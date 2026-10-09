/* ============================================================
 * 学医智用 · 成就 Mock API（统一服务）
 * 设计原则：
 *  - 定义（ACHIEVEMENT_DEFINITIONS）与用户进度完全分离，
 *    不在此处直接修改定义静态对象
 *  - progress 限制在 0-100
 *  - 已解锁成就不重新锁定（即使临时数字下降）
 *  - 解锁时间保存，首次通知标记读 = 只弹一次
 *
 *  兼容：保留 getAchievements() / getTitleAndBadges() 旧导出
 *  给旧页面 MineView / JourneyView / useStore 提供数据
 * ============================================================ */
import { mockResponse } from "./index";
import {
  ACHIEVEMENT_DEFINITIONS,
  getVisibleDefinitionsByCategory,
  countByCategory,
  METRIC_TO_CATEGORIES,
} from "../constants/definitions.js";
import { courses } from "../mock/data.js";
import * as reportApi from "./report.js";
import * as eventApi from "./events.js";

/* ---------- storage keys ---------- */
const KEY_USER_PROGRESS   = "xy-ach-user-progress-v1";
const KEY_UNLOCKED_NOTICE = "xy-ach-notice-read-v1";
const KEY_TEMP_PATCHES    = "xy-ach-metric-patches-v1";

/* ---------- 读/写安全 ---------- */
function safeLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) { return fallback; }
}
function safeSetLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

/* ---------- 小工具 ---------- */
function safePct(cur, den) {
  const c = Number(cur) || 0, d = Number(den) || 0;
  if (!d) return Math.min(100, Math.max(0, c));
  return Math.max(0, Math.min(100, Math.round((c / d) * 100)));
}
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function fmtDate(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

/* ============================================================
 * METRICS 聚合：所有成就的基础指标都从"单一真源"计算得到
 * 数据源：
 *   1) report.js 提供的 60 天每日 records（分钟/任务/AI问答）
 *   2) courses 静态数据（started/completed/category）
 *   3) 临时 "metric patches"：给尚未有真实事件系统的指标（评论/关联/点赞）
 *      一个基于 hash 的 mock 数量，保持刷新前后一致
 * ============================================================ */

/** 根据真实事件台账 + lifetime + report records 兜底计算 metrics 快照 */
async function buildAllMetrics() {
  const todayDate = fmtDate(new Date());

  /* --- 核心：真实事件台账聚合（单一真源） --- */
  const base = typeof eventApi.aggregateMetrics === "function"
    ? eventApi.aggregateMetrics()
    : {};

  /* --- report.js records 兜底：兼容旧系统已有 60 天分钟数据，不互相覆盖 --- */
  const records = (reportApi._internal && typeof reportApi._internal.getRecords === "function")
    ? reportApi._internal.getRecords()
    : safeLS("xy-api-report-records", {}) || {};
  const dates = Object.keys(records || {}).sort();

  let legacyActiveDays = 0;
  let legacyTotalMinutes = 0;
  let legacyAiQuestions = 0;
  const legacyCategoryMinutes = {};
  const legacyPerfectDays = new Set();

  for (const d of dates) {
    const rec = records[d] || {};
    const mins = Number(rec.minutes) || 0;
    legacyTotalMinutes += mins;
    if (mins >= 15) legacyActiveDays++;
    if (rec.tasks
        && Number(rec.tasks.total) > 0
        && Number(rec.tasks.done) >= Number(rec.tasks.total)) {
      legacyPerfectDays.add(d);
    }
    legacyAiQuestions += Number(rec.aiQuestions) || 0;
    if (Array.isArray(rec.courses)) {
      for (const rc of rec.courses) {
        const cDef = courses.find((c) => c.name === rc.name);
        if (cDef) {
          const key = cDef.categoryKey;
          legacyCategoryMinutes[key] = (legacyCategoryMinutes[key] || 0) + (Number(rc.min) || 0);
        }
      }
    }
  }

  /* --- 融合：真实事件 + legacy records（互相叠加，不互相覆盖） + lifetime（永不回退） --- */
  const streakDailyMin = { ...(base.dailyMinutesAcc || {}) };
  for (const d of dates) streakDailyMin[d] = (streakDailyMin[d] || 0) + (Number(records[d].minutes) || 0);
  const activeStudyDaysFromBoth = Object.values(streakDailyMin).filter((m) => m >= 15).length;
  const activeStudyDays = Math.max(
    Number(base.activeStudyDays) || 0,
    legacyActiveDays,
    activeStudyDaysFromBoth,
  );

  const totalMinutesAll = Math.max(
    Number(base.totalMinutesAll) || 0,
    legacyTotalMinutes,
    Object.values(streakDailyMin).reduce((a, b) => a + b, 0),
  );

  const subjectFromEvents = {
    startedSubjects: Number(base.startedSubjects) || 0,
    completedTcmSubjects: Number(base.completedTcmSubjects) || 0,
    completedWesternSubjects: Number(base.completedWesternSubjects) || 0,
  };
  const subjectFromCourses = {
    startedSubjects: courses.filter((c) => !!c.started).length,
    completedTcmSubjects: courses.filter((c) => c.category === "tcm" && !!c.completed).length,
    completedWesternSubjects: courses.filter((c) => c.category === "western" && !!c.completed).length,
  };
  const startedSubjects = Math.max(subjectFromEvents.startedSubjects, subjectFromCourses.startedSubjects);
  const completedTcmSubjects = Math.max(subjectFromEvents.completedTcmSubjects, subjectFromCourses.completedTcmSubjects);
  const completedWesternSubjects = Math.max(subjectFromEvents.completedWesternSubjects, subjectFromCourses.completedWesternSubjects);

  const perfectDaysSet = new Set([
    ...(base.perfectDays
      ? (() => {
          // 从 events 重新推导 perfectDays 的日期集合
          return [];
        })()
      : []),
    ...legacyPerfectDays,
  ]);
  // 从事件台账精确获取 perfectDays 日期集合
  try {
    if (typeof eventApi.aggregateMetrics === "function") {
      const events = safeLS("xy-ledger-events-v1", []) || [];
      for (const e of events) {
        if (e && e.type === "task_complete" && !!e.dailyAllComplete && e.date) {
          perfectDaysSet.add(e.date);
        }
      }
    }
  } catch (_) {}
  const perfectDays = perfectDaysSet.size;
  // 自然周/月：真实算法，禁用 perfectDays / 7 或 / 30 估算
  let perfectWeeks = Number(base.perfectWeeks) || 0;
  let perfectMonths = Number(base.perfectMonths) || 0;
  try {
    if (typeof eventApi.countPerfectWeeks === "function") {
      const events = safeLS("xy-ledger-events-v1", []) || [];
      // 把 legacy perfectDays 也注入临时事件，保证 countPerfectWeeks/Months 能识别到
      const mergedEvents = [...events];
      for (const d of legacyPerfectDays) {
        if (!mergedEvents.find((x) => x.type === "task_complete" && x.date === d && !!x.dailyAllComplete)) {
          mergedEvents.push({ type: "task_complete", date: d, dailyAllComplete: true });
        }
      }
      perfectWeeks = eventApi.countPerfectWeeks(mergedEvents);
      perfectMonths = eventApi.countPerfectMonths(mergedEvents);
    }
  } catch (_) {}

  /* --- 知识库指标：真实事件台账数据（严格删除哈希 sin/seed 逻辑） --- */
  const commentsTotal = Number(base.commentsTotal) || 0;
  const commentsLiked10 = Number(base.commentsLiked10) || 0;
  const knowledgeLinks = Number(base.knowledgeLinks) || 0;
  const masteredKps = Number(base.masteredKps) || 0;

  /* --- 专项时长：events.categoryKey 聚合 + legacy records 叠加 --- */
  const mergedCategoryMin = { ...(base.dailyMinutesByCategoryKey || {}) };
  for (const k of Object.keys(legacyCategoryMinutes)) {
    mergedCategoryMin[k] = (mergedCategoryMin[k] || 0) + legacyCategoryMinutes[k];
  }
  const materia_medicaHours = Math.floor((mergedCategoryMin.materia_medica || 0) / 60);
  const shang_hanHours      = Math.floor((mergedCategoryMin.shang_han      || 0) / 60);
  const nei_jingHours       = Math.floor((mergedCategoryMin.nei_jing       || 0) / 60);
  const jin_guiHours        = Math.floor((mergedCategoryMin.jin_gui        || 0) / 60);

  /* --- AI：真实事件 + records.aiQuestions 叠加（互动精确，数量叠加） --- */
  const aiAnsweredQuestions = (Number(base.aiAnsweredQuestions) || 0) + legacyAiQuestions;
  const aiAccurateFeedbacks = Number(base.aiAccurateFeedbacks) || 0;
  const aiInaccurateFeedbacks = Number(base.aiInaccurateFeedbacks) || 0;
  const aiCorrections = Number(base.aiCorrections) || 0;
  const aiDetailFollowups = Number(base.aiDetailFollowups) || 0;
  const aiSyndromeQuestions = Number(base.aiSyndromeQuestions) || 0;

  return {
    /* streak */
    activeStudyDays, totalMinutesAll,
    /* subject */
    startedSubjects, completedTcmSubjects, completedWesternSubjects,
    /* plan */
    perfectDays, perfectWeeks, perfectMonths,
    /* knowledge */
    commentsTotal, commentsLiked10, knowledgeLinks, masteredKps,
    /* specialty */
    materia_medicaHours, shang_hanHours, nei_jingHours, jin_guiHours,
    /* ai */
    aiAnsweredQuestions, aiAccurateFeedbacks, aiInaccurateFeedbacks,
    aiCorrections, aiDetailFollowups, aiSyndromeQuestions,
    /* metadata */
    _todayDate: todayDate,
    _firstStartedSubject: courses.find((c) => !!c.started && !!c.startedAt) || null,
  };
}

/* ============================================================
 * 单条成就 → 计算 current/threshold/progress/unlocked
 *  注意：
 *   - 已解锁的永远不重新锁（即使本次 cur<threshold，也返回 unlocked）
 *   - 复合条件全部满足才算 unlocked
 * ============================================================ */
function computeAchievementItem(def, metrics, storedProgress) {
  const stored = storedProgress[def.id] || {};
  let unlocked = !!stored.unlocked;
  let unlockedAt = stored.unlockedAt || null;
  let current = 0;

  const single = !def.conditions;
  if (single) {
    const th = Number(def.threshold) || 0;
    current = Number(metrics[def.metric] ?? 0) || 0;
    // 首次解锁
    if (!unlocked && current >= th && th > 0) {
      unlocked = true;
      unlockedAt = metrics._todayDate || fmtDate(new Date());
    }
    return {
      id: def.id,
      category: def.category,
      name: def.name,
      level: def.level || 1,
      description: def.description,
      metric: def.metric,
      threshold: th,
      current,
      progress: unlocked ? 100 : safePct(current, th),
      unlocked,
      unlockedAt,
      hidden: !!def.hidden,
      extra: buildExtra(def, metrics),
    };
  }

  // 复合条件：以"最落后条件"的 current/threshold 展示
  const conds = def.conditions || [];
  let allHit = conds.length > 0;
  let overallMinPct = 100;
  const condResults = [];
  let worstCondIdx = 0;
  for (let i = 0; i < conds.length; i++) {
    const c = conds[i];
    const th = Number(c.threshold) || 0;
    const cur = Number(metrics[c.metric] ?? 0) || 0;
    const pct = th ? safePct(cur, th) : 0;
    if (pct < overallMinPct) {
      overallMinPct = pct;
      worstCondIdx = i;
    }
    if (cur < th) allHit = false;
    condResults.push({ metric: c.metric, threshold: th, current: cur, progress: pct });
  }
  // current/threshold 统一指向最落后的条件，显示短板进度
  const worst = condResults[worstCondIdx] || { current: 0, threshold: 0 };
  current = worst.current;
  if (!unlocked && allHit) {
    unlocked = true;
    unlockedAt = metrics._todayDate || fmtDate(new Date());
  }
  return {
    id: def.id,
    category: def.category,
    name: def.name,
    level: def.level || 1,
    description: def.description,
    conditions: condResults,
    threshold: worst.threshold,
    worstConditionMetric: worst.metric,
    current,
    progress: unlocked ? 100 : overallMinPct,
    unlocked,
    unlockedAt,
    hidden: !!def.hidden,
    extra: buildExtra(def, metrics),
  };
}

/* 附加信息（初出茅庐→首科日期/名称等） */
function buildExtra(def, metrics) {
  if (def.id === "sub_first" && metrics._firstStartedSubject) {
    return {
      firstSubjectName: metrics._firstStartedSubject.name,
      firstSubjectDate: metrics._firstStartedSubject.startedAt,
    };
  }
  return null;
}

/* 持久化：每次 compute 后，把"已解锁 + 首次解锁时间"写回 storage */
function persistProgress(list) {
  const store = safeLS(KEY_USER_PROGRESS, {});
  for (const it of list) {
    const prev = store[it.id] || {};
    // 不覆盖已解锁且已记录的 unlockedAt
    store[it.id] = {
      unlocked: !!it.unlocked,
      unlockedAt: it.unlocked ? (prev.unlockedAt || it.unlockedAt) : null,
      noticeRead: !!prev.noticeRead,
    };
  }
  safeSetLS(KEY_USER_PROGRESS, store);
  return store;
}

/* 根据定义 + 指标 + 历史状态生成最终成就进度列表 */
async function buildProgressForDefinitions(defs) {
  const metrics = await buildAllMetrics();
  const storedProgress = safeLS(KEY_USER_PROGRESS, {});
  const list = defs.map((def) => computeAchievementItem(def, metrics, storedProgress));
  persistProgress(list);
  return { list, metrics };
}

/* ============================================================
 * 对外 Mock API
 * ============================================================ */

/* --- 1) 取成就定义（给分类页展示 tab 用） --- */
export function getAchievementDefinitions(category = "all") {
  return mockResponse(() => {
    const defs = getVisibleDefinitionsByCategory(category);
    return {
      definitions: defs,
      categoryCount: countByCategory(),
    };
  }, 200);
}

/* --- 2) 取当前用户所有成就进度（核心接口） --- */
export async function getUserAchievementProgress(category = "all") {
  return mockResponse(async () => {
    const defs = category === "all"
      ? ACHIEVEMENT_DEFINITIONS
      : getVisibleDefinitionsByCategory(category);
    const { list, metrics } = await buildProgressForDefinitions(defs);
    const total   = list.filter((x) => !x.hidden).length;
    const unlocked = list.filter((x) => !x.hidden && x.unlocked).length;
    // 即将达成：未解锁、进度最高的 3 个（>=30%）
    const upcoming = list
      .filter((x) => !x.hidden && !x.unlocked && x.progress >= 30)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);
    // 最近获得：按 unlockedAt desc
    const recent = list
      .filter((x) => !x.hidden && x.unlocked && x.unlockedAt)
      .sort((a, b) => (b.unlockedAt || "").localeCompare(a.unlockedAt || ""))
      .slice(0, 5);
    return {
      list,
      summary: {
        totalCount: total,
        unlockedCount: unlocked,
        lockedCount: total - unlocked,
        completionRate: safePct(unlocked, total),
        categoryCount: countByCategory(),
      },
      upcoming,
      recentUnlocked: recent,
      metrics,
    };
  }, 350);
}

/* --- 3) evaluateAchievements: 事件发生后只判定相关分类（返回可能的新解锁成就） --- */
export async function evaluateAchievements(eventName, payload = {}) {
  return mockResponse(async () => {
    const categoriesToRecompute = new Set();
    const metrics = payload && payload.relatedMetrics
      ? (Array.isArray(payload.relatedMetrics) ? payload.relatedMetrics : [payload.relatedMetrics])
      : Object.keys(METRIC_TO_CATEGORIES);
    for (const m of metrics) {
      (METRIC_TO_CATEGORIES[m] || []).forEach((c) => categoriesToRecompute.add(c));
    }
    const defs = ACHIEVEMENT_DEFINITIONS.filter((d) => categoriesToRecompute.has(d.category));
    const stored = safeLS(KEY_USER_PROGRESS, {});
    const beforeUnlockedSet = new Set(
      Object.entries(stored).filter(([, v]) => v.unlocked).map(([id]) => id)
    );
    const { list } = await buildProgressForDefinitions(defs);
    const newlyUnlocked = list.filter((x) => x.unlocked && !beforeUnlockedSet.has(x.id));
    return {
      recomputedCategories: Array.from(categoriesToRecompute),
      newlyUnlocked,
      recomputedTotal: list.length,
    };
  }, 250);
}

/* --- 4) getUnlockedAchievements：只返回已解锁成就（按 unlockedAt 倒序） --- */
export async function getUnlockedAchievements(limit = null) {
  return mockResponse(async () => {
    const { list, metrics } = await buildProgressForDefinitions(ACHIEVEMENT_DEFINITIONS);
    const unlocked = list
      .filter((x) => !x.hidden && x.unlocked)
      .sort((a, b) => (b.unlockedAt || "").localeCompare(a.unlockedAt || ""));
    return {
      list: limit ? unlocked.slice(0, limit) : unlocked,
      totalCount: unlocked.length,
      metrics,
    };
  }, 300);
}

/* --- 5) getUpcomingAchievements：即将达成（进度 >=30% 未解锁，取 Top N） --- */
export async function getUpcomingAchievements(n = 3) {
  return mockResponse(async () => {
    const { list } = await buildProgressForDefinitions(ACHIEVEMENT_DEFINITIONS);
    const upcoming = list
      .filter((x) => !x.hidden && !x.unlocked && x.progress >= 30)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, Math.max(1, Number(n) || 3));
    return { list: upcoming };
  }, 200);
}

/* --- 6) markAchievementNoticeRead：标记成就通知已读，保证"解锁弹层"只弹一次 --- */
export function markAchievementNoticeRead(idList) {
  return mockResponse(() => {
    const stored = safeLS(KEY_USER_PROGRESS, {});
    const ids = Array.isArray(idList) ? idList : [idList];
    for (const id of ids) {
      if (!stored[id]) stored[id] = { unlocked: false, unlockedAt: null };
      stored[id].noticeRead = true;
    }
    safeSetLS(KEY_USER_PROGRESS, stored);
    // 返回当前未读成就（用于弹层队列）
    const unread = Object.entries(stored)
      .filter(([, v]) => v.unlocked && !v.noticeRead)
      .map(([id, v]) => ({ id, unlockedAt: v.unlockedAt }));
    return { marked: ids.length, unreadQueue: unread };
  }, 120);
}

/* --- 7) 查询"未读解锁队列"（给全局弹层组件初始化用） --- */
export function getUnreadNoticeQueue() {
  return mockResponse(() => {
    const stored = safeLS(KEY_USER_PROGRESS, {});
    const arr = [];
    for (const [id, v] of Object.entries(stored)) {
      if (v.unlocked && !v.noticeRead) {
        const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === id);
        if (def && !def.hidden) arr.push({ id, name: def.name, desc: def.description, unlockedAt: v.unlockedAt });
      }
    }
    // 按 unlockedAt ASC：先解锁先弹
    arr.sort((a, b) => (a.unlockedAt || "").localeCompare(b.unlockedAt || ""));
    return { queue: arr };
  }, 100);
}

/* --- 8) 补丁：手动增加某个 metric（用于"模拟事件发生"，Mock MVP 用） --- */
export function _mockPatchMetric(metricName, delta) {
  const patches = safeLS(KEY_TEMP_PATCHES, {});
  patches[metricName] = (Number(patches[metricName]) || 0) + delta;
  safeSetLS(KEY_TEMP_PATCHES, patches);
  return mockResponse(() => ({ metric: metricName, delta, newValue: patches[metricName] }), 80);
}

/* ============================================================
 * 兼容导出（旧页面 MineView / JourneyView / useStore 继续可用）
 * 所有旧字段从新服务派生，保证数据同源
 * ============================================================ */
export function getAchievements() {
  return mockResponse(async () => {
    const defs = getVisibleDefinitionsByCategory("all");
    const { list, metrics } = await buildProgressForDefinitions(defs);
    const total    = list.length;
    const unlocked = list.filter((a) => a.unlocked).length;
    // nextAchievement: 进度最高（但未满）的那个
    const next = list
      .filter((a) => !a.unlocked)
      .sort((a, b) => b.progress - a.progress)[0] || null;

    return {
      list: list.map((a) => ({
        id: a.id,
        name: a.name,
        cond: a.description,
        unlocked: a.unlocked,
        unlockedAt: a.unlockedAt,
        progress: a.progress,
        target: a.threshold ?? null,
        current: a.current ?? null,
        category: a.category,
      })),
      totalCount: total,
      unlockedCount: unlocked,
      nextAchievement: next ? {
        id: next.id,
        name: next.name,
        progress: next.progress,
        target: next.threshold,
        current: next.current,
        category: next.category,
      } : null,
      metrics,
    };
  }, 300);
}

export function getTitleAndBadges() {
  return mockResponse(async () => {
    const { metrics } = await buildAllMetrics().then((m) => ({ metrics: m })).catch(() => ({ metrics: {} }));
    const streak = Number(metrics.activeStudyDays) || 0;
    let currentTitle;
    if (streak >= 100) currentTitle = { name: "岐黄传人",   motto: "“博学之，审问之，慎思之”", streak, icon: "dragon" };
    else if (streak >= 60) currentTitle = { name: "杏林新秀",   motto: "“业精于勤，荒于嬉”",    streak, icon: "lotus" };
    else if (streak >= 30) currentTitle = { name: "勤奋耕读者", motto: "“精诚不倦，日就月将”",  streak, icon: "book" };
    else if (streak >= 21) currentTitle = { name: "猫头鹰学习者", motto: "“诚心守正，光明学通”", streak, icon: "owl" };
    else if (streak >= 7)  currentTitle = { name: "勤学小童生", motto: "“幼而学者，如日出之光”", streak, icon: "seed" };
    else                    currentTitle = { name: "初入杏林",   motto: "“千里之行，始于足下”",  streak, icon: "sprout" };

    return {
      currentTitle,
      availableTitles: [
        { name: "初入杏林",     streakRequired: 1,   unlocked: streak >= 1 },
        { name: "勤学小童生",   streakRequired: 7,   unlocked: streak >= 7 },
        { name: "猫头鹰学习者", streakRequired: 21,  unlocked: streak >= 21 },
        { name: "勤奋耕读者",   streakRequired: 30,  unlocked: streak >= 30 },
        { name: "杏林新秀",     streakRequired: 60,  unlocked: streak >= 60 },
        { name: "岐黄传人",     streakRequired: 100, unlocked: streak >= 100 },
      ],
    };
  }, 280);
}

/* 内部给 report.js 周/月报共用的：返回"当期新获得成就 + 将要达成Top3"
   period: { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
   注意：
   1) 必须和 report.js 的 assessWeek/assessMonth 一致：只有周期完整结束后才允许发放周期内成就
      （= periodEnd 时间 23:59:59 已经过完，today0 至少比 periodEnd 晚 1 天）
   2) 周期未完整结束时直接返回 got:[] upcoming:正常 ，不发放任何成就，避免未结算就领
*/
export async function _periodAchievements({ periodStart, periodEnd }) {
  const { list } = await buildProgressForDefinitions(ACHIEVEMENT_DEFINITIONS);
  const start = periodStart || "1970-01-01";
  const end   = periodEnd   || "2999-12-31";

  const today0 = new Date();
  today0.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  // 周期结束的次日零点 <= 今天零点，才算"这个周期完整结束"
  const oneDayMs = 24 * 60 * 60 * 1000;
  const periodComplete = (endDate.getTime() + oneDayMs) <= today0.getTime();

  const got = periodComplete
    ? list
        .filter((a) => !a.hidden && a.unlocked && a.unlockedAt && a.unlockedAt >= start && a.unlockedAt <= end)
        .map((a) => ({
          id: a.id,
          title: a.name,
          desc: a.description,
          iconKey: iconForCategory(a.category),
          progress: 100,
          target: a.threshold,
          unlockedAt: a.unlockedAt,
        }))
    : [];
  const upcoming = list
    .filter((a) => !a.hidden && !a.unlocked)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 4)
    .map((a) => ({
      id: a.id,
      title: a.name,
      desc: a.description,
      iconKey: iconForCategory(a.category),
      progress: a.progress,
      current: a.current,
      target: a.threshold,
    }));
  return { got, upcoming };
}

function iconForCategory(cat) {
  const m = {
    streak: "refresh", subject: "statCourse", plan: "adviceStar",
    knowledge: "statKp", specialty: "review", ai: "tutorBubble",
  };
  return m[cat] || "task";
}
