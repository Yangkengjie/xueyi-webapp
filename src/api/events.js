/* ============================================================
 * events.js — 真实行为事件台账（集中存储）
 * 用途：所有成就判定的"真源"指标都来自这里，不用哈希/随机数伪造。
 * 事件类型：
 *  - study_minutes           {date, courseId, minutes}
 *  - task_complete           {date, taskId, dailyAllComplete:boolean}
 *  - course_start            {date, courseId, categoryKey, category(tcm/western)}
 *  - course_complete         {date, courseId, categoryKey, category}
 *  - comment_publish         {date, commentId, topicId}
 *  - comment_like_update     {date, commentId, likes, reached10:boolean}
 *  - knowledge_link_create   {date, linkId, fromNode, toNode}
 *  - kp_learn                {date, nodeId, reviewCount}
 *  - ai_question_answered    {date, qid, interactionType: normal|correction|detail_followup|syndrome}
 *  - ai_feedback_accurate    {date, qid}
 *  - ai_feedback_inaccurate  {date, qid}
 * ============================================================ */
import { mockResponse } from "./index.js";

const EVENTS_KEY = "xy-ledger-events-v1";
const LIFETIME_KEY = "xy-ledger-lifetime-v1";

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

function pad2(n) { return n < 10 ? "0" + n : "" + n; }
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseYMD(s) {
  if (!s) return null;
  const [y, m, d] = String(s).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function startOfWeek(dateObj) {
  const d = new Date(dateObj);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - day);
  return d;
}
function startOfMonth(dateObj) {
  const d = new Date(dateObj);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
}
function addDays(dateObj, n) {
  const d = new Date(dateObj);
  d.setDate(d.getDate() + n);
  return d;
}
function fmt(dateObj) {
  const d = new Date(dateObj);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function readEvents() {
  const raw = safeLS(EVENTS_KEY, null);
  if (Array.isArray(raw)) return raw;
  return [];
}
function writeEvents(list) { safeSetLS(EVENTS_KEY, list); }

function readLifetime() {
  const s = safeLS(LIFETIME_KEY, null);
  if (s && typeof s === "object") return s;
  return {
    activeStudyDays: 0,
    firstStudyAt: null,
  };
}
function writeLifetime(obj) { safeSetLS(LIFETIME_KEY, obj); }

export function pushEvent(type, payload = {}) {
  const list = readEvents();
  const ev = {
    id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    date: payload.date || todayStr(),
    ts: Date.now(),
    ...payload,
  };
  list.push(ev);
  writeEvents(list);
  return ev;
}

/* ============================================================
 * 自然周/月 完美计划判定（真实算法，禁用整除估算）
 * ============================================================ */

/**
 * 计算某个自然周是否完美：该周每天(周一~周日)都存在 task_complete.dailyAllComplete=true
 */
export function isPerfectWeek(dateOrStr, events = readEvents()) {
  const ref = typeof dateOrStr === "string" ? parseYMD(dateOrStr) : dateOrStr;
  if (!ref) return false;
  const s = startOfWeek(ref);
  const weekDates = new Set();
  for (let i = 0; i < 7; i++) weekDates.add(fmt(addDays(s, i)));
  const completeDates = new Set(
    events
      .filter((e) => e.type === "task_complete" && !!e.dailyAllComplete)
      .map((e) => e.date)
  );
  for (const d of weekDates) if (!completeDates.has(d)) return false;
  return true;
}

export function isPerfectMonth(dateOrStr, events = readEvents()) {
  const ref = typeof dateOrStr === "string" ? parseYMD(dateOrStr) : dateOrStr;
  if (!ref) return false;
  const s = startOfMonth(ref);
  const last = new Date(s.getFullYear(), s.getMonth() + 1, 0);
  const monthDates = new Set();
  for (let d = new Date(s); d <= last; d.setDate(d.getDate() + 1)) monthDates.add(fmt(d));
  const completeDates = new Set(
    events
      .filter((e) => e.type === "task_complete" && !!e.dailyAllComplete)
      .map((e) => e.date)
  );
  for (const d of monthDates) if (!completeDates.has(d)) return false;
  return true;
}

/** 累计完美周数（到今天为止，每自然周满足一次就+1） */
export function countPerfectWeeks(events = readEvents(), maxHistoryDays = 3650) {
  const today = parseYMD(todayStr());
  const earliest = addDays(today, -maxHistoryDays);
  const s = startOfWeek(earliest);
  let n = 0;
  for (let cur = new Date(s); cur <= today; cur = addDays(cur, 7)) {
    if (isPerfectWeek(cur, events)) n++;
  }
  return n;
}

export function countPerfectMonths(events = readEvents(), maxHistoryDays = 3650) {
  const today = parseYMD(todayStr());
  const s = addDays(today, -maxHistoryDays);
  const first = startOfMonth(s);
  let n = 0;
  for (let cur = new Date(first); cur <= today; cur.setMonth(cur.getMonth() + 1)) {
    if (isPerfectMonth(cur, events)) n++;
  }
  return n;
}

/* ============================================================
 * 聚合 metrics（真实 events 计算，不用随机）
 * ============================================================ */
export function aggregateMetrics() {
  const events = readEvents();
  const lifetime = readLifetime();

  /* 每日学习分钟（按天聚合，来自 study_minutes 事件 + report records 兜底） */
  const dailyMinutesAcc = {};
  for (const e of events) {
    if (e.type === "study_minutes") {
      const m = Number(e.minutes) || 0;
      dailyMinutesAcc[e.date] = (dailyMinutesAcc[e.date] || 0) + m;
    }
  }

  /* 累计有效学习天数：分钟 >=15 的天数 */
  let activeStudyDays = Object.values(dailyMinutesAcc).filter((m) => m >= 15).length;
  /* 跟 lifetime 融合，不回退（防止事件被清空时回退） */
  activeStudyDays = Math.max(lifetime.activeStudyDays || 0, activeStudyDays);
  writeLifetime({ ...lifetime, activeStudyDays });

  /* 科目的 started/completed */
  const courseStartedIds = new Set();
  const courseCompletedIds = new Set();
  const startedCategory = { tcm: new Set(), western: new Set() };
  const completedCategory = { tcm: new Set(), western: new Set() };
  for (const e of events) {
    if (e.type === "course_start" && e.courseId) {
      courseStartedIds.add(e.courseId);
      if (e.category === "tcm") startedCategory.tcm.add(e.courseId);
      if (e.category === "western") startedCategory.western.add(e.courseId);
    }
    if (e.type === "course_complete" && e.courseId) {
      courseCompletedIds.add(e.courseId);
      if (e.category === "tcm") completedCategory.tcm.add(e.courseId);
      if (e.category === "western") completedCategory.western.add(e.courseId);
    }
  }
  const startedSubjects = courseStartedIds.size;
  const completedTcmSubjects = completedCategory.tcm.size;
  const completedWesternSubjects = completedCategory.western.size;

  /* 计划类 */
  const perfectDaysSet = new Set(
    events.filter((e) => e.type === "task_complete" && !!e.dailyAllComplete).map((e) => e.date)
  );
  const perfectDays = perfectDaysSet.size;
  const perfectWeeks = countPerfectWeeks(events);
  const perfectMonths = countPerfectMonths(events);

  /* 知识库 */
  const commentsTotal = events.filter((e) => e.type === "comment_publish").length;
  const commentsLiked10 = new Set(
    events
      .filter((e) => e.type === "comment_like_update" && !!e.reached10)
      .map((e) => e.commentId)
  ).size;
  const knowledgeLinks = events.filter((e) => e.type === "knowledge_link_create").length;
  let masteredKps = events.filter((e) => e.type === "kp_learn").length;
  masteredKps = Math.max(masteredKps, lifetime.masteredKps || 0);

  /* 专项：按 categoryKey 聚合分钟 */
  const dailyMinutesByCategoryKey = {};
  for (const e of events) {
    if (e.type === "study_minutes" && e.categoryKey) {
      const m = Number(e.minutes) || 0;
      dailyMinutesByCategoryKey[e.categoryKey] = (dailyMinutesByCategoryKey[e.categoryKey] || 0) + m;
    }
  }
  const materia_medicaHours = Math.floor((dailyMinutesByCategoryKey.materia_medica || 0) / 60);
  const shang_hanHours      = Math.floor((dailyMinutesByCategoryKey.shang_han || 0) / 60);
  const nei_jingHours       = Math.floor((dailyMinutesByCategoryKey.nei_jing || 0) / 60);
  const jin_guiHours        = Math.floor((dailyMinutesByCategoryKey.jin_gui || 0) / 60);

  /* AI */
  let aiAnsweredQuestions = 0;
  let aiCorrections = 0;
  let aiDetailFollowups = 0;
  let aiSyndromeQuestions = 0;
  for (const e of events) {
    if (e.type === "ai_question_answered") {
      aiAnsweredQuestions++;
      const t = e.interactionType;
      if (t === "correction") aiCorrections++;
      if (t === "detail_followup") aiDetailFollowups++;
      if (t === "syndrome_question") aiSyndromeQuestions++;
    }
  }
  let aiAccurateFeedbacks = events.filter((e) => e.type === "ai_feedback_accurate").length;
  let aiInaccurateFeedbacks = events.filter((e) => e.type === "ai_feedback_inaccurate").length;
  aiAccurateFeedbacks = Math.max(aiAccurateFeedbacks, lifetime.aiAccurateFeedbacks || 0);
  aiInaccurateFeedbacks = Math.max(aiInaccurateFeedbacks, lifetime.aiInaccurateFeedbacks || 0);

  return {
    /* streak */
    activeStudyDays,
    totalMinutesAll: Object.values(dailyMinutesAcc).reduce((a, b) => a + b, 0),
    dailyMinutesAcc,
    /* subject */
    startedSubjects,
    completedTcmSubjects,
    completedWesternSubjects,
    /* plan */
    perfectDays,
    perfectWeeks,
    perfectMonths,
    /* knowledge */
    commentsTotal,
    commentsLiked10,
    knowledgeLinks,
    masteredKps,
    /* specialty */
    dailyMinutesByCategoryKey,
    materia_medicaHours,
    shang_hanHours,
    nei_jingHours,
    jin_guiHours,
    /* ai */
    aiAnsweredQuestions,
    aiAccurateFeedbacks,
    aiInaccurateFeedbacks,
    aiCorrections,
    aiDetailFollowups,
    aiSyndromeQuestions,
    /* metadata */
    eventsCount: events.length,
  };
}

/* ============================================================
 * 对外 Mock API
 * ============================================================ */
export function recordEvent(type, payload = {}) {
  return mockResponse(() => pushEvent(type, payload), 80);
}

export function getAggregatedMetrics() {
  return mockResponse(() => aggregateMetrics(), 120);
}

export function getNaturalWeekPerfect(dateStr) {
  return mockResponse(() => ({ perfect: isPerfectWeek(dateStr) }), 80);
}

export function getNaturalMonthPerfect(dateStr) {
  return mockResponse(() => ({ perfect: isPerfectMonth(dateStr) }), 80);
}

export { startOfWeek, startOfMonth, fmt, parseYMD, addDays };
