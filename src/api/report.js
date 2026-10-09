import { mockResponse } from "./index";
import { _periodAchievements as _achPeriod } from "./achievement.js";
import { getCourseTheme } from "../constants/iconMappings.js";

const RECORDS_KEY = "xy-api-report-records";
const RECORDS_VER = "v2"; // 最近48天活跃版
const RECORDS_VER_KEY = "xy-api-report-records-v";
const ABILITY_KEY = "xy-api-report-ability";

const SUBJECTS = [
  { key: "tcm-basic", name: "基础理论", category: "基础理论" },
  { key: "formula",   name: "方剂学",   category: "方剂"     },
  { key: "herb",      name: "中药学",   category: "中药"     },
  { key: "diagnose",  name: "诊断学",   category: "诊断"     },
  { key: "acupoint",  name: "针灸学",   category: "针灸"     },
];

/* 统一课程表：去掉 Emoji 图标字段，颜色改为 iconMappings 的主题色（不再是 8 色渐变） */
const COURSES = [
  {
    courseId: "tcm-basic",
    name: "中医基础理论",
    color: "#37684a",
    lightColor: "#eef4ee",
  },
  {
    courseId: "formula",
    name: "方剂学",
    color: "#6b5c41",
    lightColor: "#f3efe7",
  },
  {
    courseId: "neijing",
    name: "黄帝内经",
    color: "#535d50",
    lightColor: "#eef1ed",
  },
  {
    courseId: "herb",
    name: "中药学",
    color: "#38683c",
    lightColor: "#e8f3e8",
  },
  {
    courseId: "diagnose",
    name: "中医诊断学",
    color: "#4f635c",
    lightColor: "#eef3f1",
  },
  {
    courseId: "acupoint",
    name: "针灸学",
    color: "#2f6f54",
    lightColor: "#eaf4ef",
  },
  {
    courseId: "shanghan",
    name: "伤寒论",
    color: "#495a52",
    lightColor: "#eff3ee",
  },
  {
    courseId: "wenbing",
    name: "温病学",
    color: "#52645a",
    lightColor: "#eef2ef",
  },
  {
    courseId: "channels",
    name: "奇经八脉",
    color: "#4f6e6a",
    lightColor: "#e9f0f1",
  },
  {
    courseId: "nineteen",
    name: "十九畏",
    color: "#7a6238",
    lightColor: "#f2eee4",
  },
  {
    courseId: "jiebiao",
    name: "解表剂",
    color: "#3e755a",
    lightColor: "#e7f1eb",
  },
  {
    courseId: "bagang",
    name: "八纲辨证",
    color: "#456c56",
    lightColor: "#eaf0ea",
  },
];

/* 图标/主题统一真源：找不到时，用 iconMappings.getCourseTheme 兜底 */
function courseById(id) {
  const c = COURSES.find((x) => x.courseId === id);
  if (c) return c;
  const theme = getCourseTheme(id);
  return {
    courseId: id,
    name: id,
    color: theme.fg,
    lightColor: theme.bgLight,
  };
}

const KNOWLEDGE_POINTS = [
  "藏象学说", "阴阳五行", "气血津液", "经络系统", "病因病机",
  "四诊合参", "八纲辨证", "脏腑辨证", "六经辨证", "卫气营血",
  "解表剂", "清热剂", "补益剂", "和解剂", "泻下剂",
  "四气五味", "中药配伍", "君臣佐使", "十八反", "十九畏",
  "十二正经", "奇经八脉", "五输穴", "原络穴", "背俞穴",
];

const METHODS = ["阅读", "记忆", "刷题", "AI答疑", "案例推演"];

const WEEKLY_TITLES = [
  { title: "杏林勤学者",   desc: "本周保持了稳定的学习节奏，脚踏实地地积累知识" },
  { title: "方剂探索家",   desc: "在方剂配伍领域投入最多，君臣佐使了然于胸"   },
  { title: "夜读医经人",   desc: "钟爱晚间学习，夜深人静时与古人对话"         },
  { title: "经络攻坚者",   desc: "专注经络针灸，十二正经走行已熟记于心"       },
  { title: "本草有心人",   desc: "本草功夫扎实，四气五味如数家珍"             },
  { title: "辨证小能手",   desc: "四诊八纲辨证能力稳步提升，继续精进"         },
];

const MONTHLY_TITLES = [
  { title: "杏林进阶者",   desc: "本月稳步前行，学习广度和深度同步提升"   },
  { title: "勤耕不辍者",   desc: "连续学习不间断，真正做到了学而时习之"   },
  { title: "博观约取者",   desc: "涉猎广博而不浮躁，厚积方能薄发"         },
  { title: "中医践行者",   desc: "学以致用，理论联系实践的典范"           },
  { title: "经典传承人",   desc: "深耕内经伤寒，在经典中汲取中医智慧"     },
];

const MASTERY_STAGES = ["未接触", "了解", "熟悉", "掌握"];

function safeGet(key, def) {
  try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw); } catch (e) {}
  return def;
}
function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pad(n) { return n < 10 ? "0" + n : "" + n; }
function fmtDate(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeek(d) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Mon=0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function safePct(num, den) {
  if (!den || !isFinite(den)) return 0;
  const n = Number(num) || 0, d = Number(den) || 0;
  if (d === 0) return 0;
  return Math.round((n / d) * 10000) / 100;
}

/* ---------- 统一日期完整性校验（本地零点归一，避免 UTC 与时/分/秒跨日） ---------- */
function localStartOfDay(d) {
  const x = d instanceof Date ? new Date(d) : parseDate(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function localStartOfWeek(d) {
  const x = localStartOfDay(d);
  const dow = (x.getDay() + 6) % 7; // Mon=0
  x.setDate(x.getDate() - dow);
  return x;
}
function localStartOfMonth(d) {
  const x = d instanceof Date ? new Date(d) : (typeof d === "string" && /^\d{4}-\d{1,2}$/.test(d)
    ? (() => { const [y, m] = d.split("-").map(Number); return new Date(y, m - 1, 1); })()
    : new Date(d));
  x.setHours(0, 0, 0, 0);
  x.setDate(1);
  return x;
}

/**
 * 周期完整性（接口层拦截，不依赖页面显示）
 *   四种 periodStatus：
 *   - "incomplete" ：周期未结束（今日/本周/本月 / 未来）
 *   - "empty"      ：周期已结束，但 minutes=0 / subjects=0 等
 *   - "complete"   ：正式可展示
 *   - "future"     ：未来周期（含未来任意日）
 */
function assessDaily(dateStr) {
  const now = localStartOfDay(new Date());
  const day = localStartOfDay(dateStr);
  const diff = daysBetween(day, now); // diff=0 今天，diff<0 未来，diff>0 历史
  const period = { start: dateStr, end: dateStr };
  if (diff < 0) return { isPeriodComplete: false, periodStatus: "future", incompleteMessage: "该日期尚未到达", period };
  if (diff === 0) return { isPeriodComplete: false, periodStatus: "incomplete", incompleteMessage: "今日尚未结束，日报将在明日生成", period };
  return { isPeriodComplete: true, periodStatus: "complete", incompleteMessage: "", period };
}
function assessWeek(startDateStr) {
  const now = localStartOfDay(new Date());
  const s = localStartOfWeek(startDateStr);
  const e = new Date(s.getTime() + 6 * 86400000);
  const period = { start: fmtDate(s), end: fmtDate(e) };
  if (daysBetween(s, now) < 0) {
    return { isPeriodComplete: false, periodStatus: "future", incompleteMessage: "该周尚未到达，周报无法生成", period };
  }
  // 周期结束条件：本周最后一天（周日）已结束 = now 比 e 晚 1 天（e 本地零点 + 至少 1 天）
  if (daysBetween(e, now) < 1) {
    return { isPeriodComplete: false, periodStatus: "incomplete", incompleteMessage: "本周尚未结束，周报将在本周结束后生成", period };
  }
  return { isPeriodComplete: true, periodStatus: "complete", incompleteMessage: "", period };
}
function assessMonth(monthStr) {
  const now = localStartOfDay(new Date());
  const s = localStartOfMonth(monthStr);
  const [y, m] = [s.getFullYear(), s.getMonth() + 1];
  const daysInMonth = new Date(y, m, 0).getDate();
  const e = new Date(y, m - 1, daysInMonth, 0, 0, 0, 0);
  const period = { start: fmtDate(s), end: fmtDate(e) };
  if (y > now.getFullYear() || (y === now.getFullYear() && m > (now.getMonth() + 1))) {
    return { isPeriodComplete: false, periodStatus: "future", incompleteMessage: "该月份尚未到达，月报无法生成", period };
  }
  // 周期结束条件：本月最后一天结束 = now 比 e 晚至少 1 天
  if (daysBetween(e, now) < 1) {
    return { isPeriodComplete: false, periodStatus: "incomplete", incompleteMessage: "本月尚未结束，月报将在本月结束后生成", period };
  }
  return { isPeriodComplete: true, periodStatus: "complete", incompleteMessage: "", period };
}

function incompleteDailyShell(dateStr) {
  const { isPeriodComplete, periodStatus, incompleteMessage, period } = assessDaily(dateStr);
  return {
    isPeriodComplete,
    periodStatus,
    incompleteMessage,
    period,
    date: dateStr,
    minutes: 0,
    goalDone: 0,
    goalTotal: 0,
    moodKey: "gentle",
    moodText: "周期未结束",
    moodNote: "",
    subjects: [],
    courses: [],
    kps: [],
    aiQuestions: 0,
    streak: 0,
    advice: "",
  };
}
function incompleteWeeklyShell(startDateStr) {
  const { isPeriodComplete, periodStatus, incompleteMessage, period } = assessWeek(startDateStr);
  return {
    ...emptyWeekly(period.start, period.end),
    isPeriodComplete,
    periodStatus,
    incompleteMessage,
    period,
  };
}
function incompleteMonthlyShell(monthStr) {
  const { isPeriodComplete, periodStatus, incompleteMessage, period } = assessMonth(monthStr);
  return {
    ...emptyMonthly(monthStr),
    isPeriodComplete,
    periodStatus,
    incompleteMessage,
    period,
  };
}

/* ---------- 统一每日记录生成（60天的模拟数据） ---------- */

function generateDailyRecords() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(now.getTime() - 59 * 86400000); // 60 days
  const records = {};
  const totalStudyDays = 48; // 约80%活跃率（最近 48 天活跃）
  const firstActive = 60 - totalStudyDays; // i >= 12 才是活跃，保证本周在范围内
  for (let i = 0; i < 60; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const dateStr = fmtDate(d);
    const seed = hashStr(dateStr);
    const isActive = i >= firstActive && i < 60;
    const isFuture = d.getTime() > now.getTime();
    if (!isActive || isFuture) {
      records[dateStr] = makeEmptyRecord(dateStr);
      continue;
    }
    records[dateStr] = makeDailyRecord(dateStr, seed, i);
  }
  return records;
}

function makeEmptyRecord(dateStr) {
  return {
    date: dateStr,
    minutes: 0,
    tasks: { total: 0, done: 0 },
    courses: {},
    subjects: {},
    kps: {},
    methods: {},
    aiQuestions: 0,
    moods: [],
  };
}

function makeDailyRecord(dateStr, seed, offset) {
  // 活跃率: 工作日30~90分钟，周末翻倍概率; 部分天高强度
  const dayOfWeek = parseDate(dateStr).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const baseLow  = 25;
  const baseHigh = isWeekend ? 160 : 95;
  const intensity = (seed % 100) / 100;
  let minutes = Math.round(baseLow + intensity * (baseHigh - baseLow));
  // 约15%天高强度
  if (seed % 7 === 0) minutes = Math.round(minutes * 1.6);
  minutes = Math.min(240, minutes);

  const taskTotal = 2 + (seed % 5) + (isWeekend ? 2 : 0);
  const doneRate  = 0.5 + ((seed % 60) / 100);
  const taskDone  = Math.min(taskTotal, Math.round(taskTotal * doneRate));

  // 分配到2~4门课程
  const courseCount = 2 + (seed % 3);
  const courseShuffled = shuffleArray(COURSES.slice(), seed);
  const pickedCourses = courseShuffled.slice(0, courseCount);
  const courses = {};
  const subjects = {};
  let remainMin = minutes;
  pickedCourses.forEach((c, idx) => {
    const isLast = idx === pickedCourses.length - 1;
    const weight = isLast ? 1 : (0.5 + ((seed + idx * 13) % 100) / 100);
    let min = isLast ? remainMin : Math.round(remainMin * weight / pickedCourses.length);
    min = clamp(min, 5, remainMin);
    remainMin = Math.max(0, remainMin - min);
    courses[c.courseId] = { minutes: min, courseName: c.name };
    const sub = SUBJECTS.find((s) => c.courseId.includes(s.key) || c.name.includes(s.name.slice(0, 2)));
    if (sub) subjects[sub.key] = (subjects[sub.key] || 0) + min;
    else subjects[SUBJECTS[idx % SUBJECTS.length].key] = (subjects[SUBJECTS[idx % SUBJECTS.length].key] || 0) + min;
  });

  // 知识点
  const kps = {};
  const kpCount = 2 + (seed % 4);
  const kpShuffled = shuffleArray(KNOWLEDGE_POINTS.slice(), seed + 3);
  kpShuffled.slice(0, kpCount).forEach((kp) => {
    kps[kp] = {
      count: 1 + ((seed + hashStr(kp)) % 3),
      mastery: 1 + ((seed + hashStr(kp)) % 3), // 1~3 (了解/熟悉/掌握)
    };
  });

  // 方法分布
  const methods = {};
  METHODS.forEach((m, idx) => {
    const weight = (seed + idx * 7) % 100;
    methods[m] = Math.round(minutes * weight / 400);
  });
  // 修正，让总比例接近 minutes
  const methodSum = Object.values(methods).reduce((a, b) => a + b, 0);
  if (methodSum > 0) {
    Object.keys(methods).forEach((k) => {
      methods[k] = Math.round(methods[k] * minutes / methodSum);
    });
  }

  const aiQuestions = (seed % 5 === 0) ? 1 + (seed % 3) : 0;

  return {
    date: dateStr,
    minutes,
    tasks: { total: taskTotal, done: taskDone },
    courses,
    subjects,
    kps,
    methods,
    aiQuestions,
  };
}

function shuffleArray(arr, seed) {
  const a = arr.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRecords() {
  const ver = safeGet(RECORDS_VER_KEY, null);
  const cached = safeGet(RECORDS_KEY, null);
  if (ver === RECORDS_VER && cached && typeof cached === "object") return cached;
  // 版本不匹配或无缓存 → 重新生成
  try { localStorage.removeItem(RECORDS_KEY); } catch (e) {}
  const fresh = generateDailyRecords();
  safeSet(RECORDS_KEY, fresh);
  safeSet(RECORDS_VER_KEY, RECORDS_VER);
  return fresh;
}

export const _internal = { getRecords, getRecordsInRange };

function getRecordsInRange(startDate, endDate) {
  const all = getRecords();
  const start = parseDate(startDate).getTime();
  const end   = parseDate(endDate).getTime();
  const results = [];
  const d = new Date(start);
  while (d.getTime() <= end) {
    const k = fmtDate(d);
    results.push(all[k] || makeEmptyRecord(k));
    d.setDate(d.getDate() + 1);
  }
  return results;
}

/* ---------- 能力画像的默认值（月初 vs 月末） ---------- */
const DEFAULT_ABILITY = {
  memory: 55,
  understand: 60,
  apply: 45,
  analyze: 50,
};

function getAbilityBase(monthStr, period) {
  const seed = hashStr(monthStr + (period || "before"));
  const delta = (seed % 100) / 100;
  return {
    memory:      clamp(40 + Math.round(delta * 30) + (period === "after" ? 10 : 0), 20, 95),
    understand:  clamp(45 + Math.round(delta * 30) + (period === "after" ? 12 : 0), 20, 95),
    apply:       clamp(30 + Math.round(delta * 30) + (period === "after" ? 15 : 0), 20, 95),
    analyze:     clamp(35 + Math.round(delta * 30) + (period === "after" ? 13 : 0), 20, 95),
  };
}

/* ---------- 连续学习天数（向前看） ---------- */
function calcStreak(records, toDate) {
  let streak = 0;
  const d = parseDate(toDate);
  for (let i = 0; i < 180; i++) {
    const k = fmtDate(d);
    const r = records[k] || makeEmptyRecord(k);
    if (r.minutes >= 15) streak++;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* ---------- 标题和称号 ---------- */
function pickWeeklyTitle(totalMin, records) {
  const seeds = [
    (records, idx) => Object.values(records[idx]?.courses || {})
      .some((c) => c.courseName && c.courseName.includes("方剂")),
    (records, idx) => {
      // 如果有多个记录在 20:00-23:59 产生（简化：看种子 % 3）
      return Object.keys(records).filter((k) => hashStr(k) % 3 === 0).length >= 3;
    },
    (records, idx) => {
      const acup = Object.values(records[idx]?.courses || {})
        .some((c) => c.courseName && c.courseName.includes("针灸"));
      const jingluo = Object.keys(records[idx]?.kps || {}).some((k) => k.includes("经络") || k.includes("正经"));
      return acup || jingluo;
    },
    (records, idx) => {
      const herb = Object.values(records[idx]?.courses || {})
        .some((c) => c.courseName && c.courseName.includes("中药"));
      return herb || Object.keys(records[idx]?.kps || {}).some((k) => ["四气", "五味", "配伍"].includes(k));
    },
    (records, idx) => {
      const diagno = Object.values(records[idx]?.courses || {})
        .some((c) => c.courseName && (c.courseName.includes("诊断") || c.courseName.includes("辨证")));
      return diagno || Object.keys(records[idx]?.kps || {}).some((k) => ["辨证", "四诊"].some((x) => k.includes(x)));
    },
  ];
  const firstDay = Object.keys(records)[0] || "";
  const seedIdx = Math.min(seeds.length - 1, hashStr(firstDay) % seeds.length);
  if (totalMin < 90) return WEEKLY_TITLES[0]; // 默认勤奋
  for (let i = 0; i < records.length; i++) {
    if (seeds[seedIdx](records, i)) return WEEKLY_TITLES[1 + seedIdx];
  }
  return WEEKLY_TITLES[0];
}

function pickMonthlyTitle(activeDays, longestStreak) {
  if (longestStreak >= 12) return MONTHLY_TITLES[1]; // 勤耕不辍
  if (activeDays >= 22) return MONTHLY_TITLES[2];   // 博观约取
  if (activeDays >= 18) return MONTHLY_TITLES[3];   // 中医践行者
  return MONTHLY_TITLES[0];                         // 杏林进阶者
}

/* ---------- 聚合工具 ---------- */
function sumField(list, fn) {
  return list.reduce((acc, it) => acc + (fn(it) || 0), 0);
}

/* ============================================================
   对外 API：日报 / 周报 / 月报 / 下周计划
   ============================================================ */

export function getDailyReport(date) {
  return mockResponse(() => {
    const dateStr = date || fmtDate(new Date());
    const ass = assessDaily(dateStr);
    if (!ass.isPeriodComplete) {
      return incompleteDailyShell(dateStr);
    }
    const all = getRecords();
    const rec = all[dateStr] || makeEmptyRecord(dateStr);
    const streak = calcStreak(all, dateStr);
    const courseList = Object.entries(rec.courses || {})
      .map(([courseId, v]) => ({ courseId, name: courseById(courseId)?.name || courseId, minutes: v.minutes }))
      .sort((a, b) => b.minutes - a.minutes);
    const kpList = Object.entries(rec.kps || {})
      .map(([kp, v]) => ({ name: kp, ...v, stage: MASTERY_STAGES[v.mastery] || "了解" }));
    const result = {
      isPeriodComplete: true,
      periodStatus: "complete",
      incompleteMessage: "",
      period: { start: dateStr, end: dateStr },
      date: dateStr,
      minutes: rec.minutes,
      goalDone: rec.tasks.done,
      goalTotal: rec.tasks.total,
      moodKey: rec.minutes >= 90 ? "hot" : rec.minutes >= 30 ? "stable" : "gentle",
      moodText: rec.minutes >= 90 ? "手感火热" : rec.minutes >= 30 ? "专注稳定" : "循序渐进",
      moodNote: rec.minutes >= 90 ? "今日专注力满分，趁热打铁突破薄弱点" : rec.minutes >= 30 ? "今日状态稳定，扎实推进" : "适度学习，保持节奏",
      subjects: courseList.map((c) => {
        const sub = SUBJECTS.find((s) => c.courseId.includes(s.key) || c.name.includes(s.name.slice(0, 2)));
        return { name: c.name, min: c.minutes, category: sub?.name || "综合" };
      }),
      courses: courseList,
      kps: kpList,
      aiQuestions: rec.aiQuestions,
      streak,
      advice: buildDailyAdvice(rec),
    };
    if ((rec.minutes || 0) === 0 && !courseList.length) {
      result.periodStatus = "empty";
    }
    return result;
  }, 280);
}

function buildDailyAdvice(rec) {
  if (rec.minutes < 20) return "今天学习时间较短，建议安排 20~30 分钟诵读内经原文，保持手感。";
  const weak = Object.entries(rec.kps || {}).find(([, v]) => v.mastery === 1);
  if (weak) return `知识点「${weak[0]}」仍在了解阶段，建议做2~3道习题巩固。`;
  return "今日学习投入扎实，睡前可尝试闭目回顾今日要点，加深印象。";
}

/* ---------- 周报 ---------- */
export function getWeeklyReport(startDate) {
  return mockResponse(async () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = startDate ? parseDate(startDate) : startOfWeek(now);
    // 确保 start 是周一
    const realStart = startOfWeek(start);
    const ass = assessWeek(fmtDate(realStart));
    if (!ass.isPeriodComplete) {
      return incompleteWeeklyShell(fmtDate(realStart));
    }
    const end = new Date(realStart.getTime() + 6 * 86400000);
    // 禁止未来周期：如果是本周之后，返回空
    if (realStart.getTime() > now.getTime()) {
      return emptyWeekly(fmtDate(realStart), fmtDate(end));
    }
    const startStr = fmtDate(realStart);
    const endStr = fmtDate(end);
    const records = getRecordsInRange(startStr, endStr);

    const totalMinutes = sumField(records, (r) => r.minutes);
    const activeDays = records.filter((r) => r.minutes >= 15).length;
    const completedTasks = sumField(records, (r) => r.tasks.done);
    const totalTasks = sumField(records, (r) => r.tasks.total) || 1;
    const taskRate = safePct(completedTasks, totalTasks);
    const streak = calcStreak(getRecords(), endStr);

    // 上周（对比变化率）
    const lastStart = new Date(realStart.getTime() - 7 * 86400000);
    const lastRecords = getRecordsInRange(fmtDate(lastStart), fmtDate(new Date(lastStart.getTime() + 6 * 86400000)));
    const lastMinutes = sumField(lastRecords, (r) => r.minutes);
    const changeRate = lastMinutes === 0 ? (totalMinutes === 0 ? 0 : 100) : safePct(totalMinutes - lastMinutes, lastMinutes);

    // 每日记录（用于柱状图）
    const dailyRecords = records.map((r, idx) => {
      const dayNames = ["一", "二", "三", "四", "五", "六", "日"];
      return {
        date: r.date,
        weekDay: "周" + dayNames[idx],
        minutes: r.minutes,
        tasks: r.tasks.done,
        courses: Object.entries(r.courses || {}).map(([id, v]) => {
          const c = courseById(id);
          return { id, name: c?.name || id, minutes: v.minutes, color: c?.color || "#1f5c38" };
        }),
        kps: Object.keys(r.kps || {}),
      };
    });

    // 学习内容墙（聚合本周出现的课程+知识点）
    const courseAccum = {};
    const kpAccum = {};
    records.forEach((r) => {
      Object.entries(r.courses || {}).forEach(([id, v]) => {
        if (!courseAccum[id]) { const c = courseById(id); courseAccum[id] = { ...c, minutes: 0, kps: [] }; }
        courseAccum[id].minutes += v.minutes;
      });
      Object.entries(r.kps || {}).forEach(([kp, v]) => {
        if (!kpAccum[kp]) kpAccum[kp] = { count: 0, mastery: 0, courseIds: [] };
        kpAccum[kp].count += v.count;
        kpAccum[kp].mastery = Math.max(kpAccum[kp].mastery, v.mastery);
      });
    });
    const contentWall = Object.values(courseAccum).map((c) => ({
      courseId: c.courseId,
      name: c.name,
      color: c.color,
      lightColor: c.lightColor,
      minutes: c.minutes,
      kps: Object.keys(kpAccum).slice(0, 4 + hashStr(c.courseId || "") % 3),
    })).sort((a, b) => b.minutes - a.minutes);
    const totalCourses = contentWall.length;
    const totalKps = Object.keys(kpAccum).length;

    // TOP3 科目（学习时长）
    const subjAccum = {};
    records.forEach((r) => {
      Object.entries(r.subjects || {}).forEach(([k, v]) => {
        subjAccum[k] = (subjAccum[k] || 0) + v;
      });
    });
    const topSubjects = Object.entries(subjAccum)
      .map(([k, m]) => {
        const subj = SUBJECTS.find((s) => s.key === k) || { name: k, category: k };
        return { key: k, name: subj.name, minutes: m };
      })
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 3);

    // TOP3 知识点（次数）
    const topKnowledgePoints = Object.entries(kpAccum)
      .map(([kp, v]) => ({ name: kp, count: v.count, mastery: MASTERY_STAGES[v.mastery] || "了解" }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 完成度最高的课程
    const topCompletedCourse = contentWall[0] || null;

    // 学习内容分布（5个固定分类，加起来=100%）
    const catRaw = SUBJECTS.map((s) => ({ name: s.name, minutes: subjAccum[s.key] || 0 }));
    const catTotal = catRaw.reduce((a, b) => a + b.minutes, 0);
    const categoryDistribution = normalizeDistribution(catRaw, catTotal, "基础理论");

    // 学习方式分布
    const methodRaw = METHODS.map((m) => {
      const tot = sumField(records, (r) => r.methods?.[m] || 0);
      return { name: m, minutes: tot };
    });
    const methodTotal = methodRaw.reduce((a, b) => a + b.minutes, 0);
    const methodDistribution = normalizeDistribution(methodRaw, methodTotal, "阅读");

    // 掌握程度变化
    const masteryChanges = calcMasteryChanges(records, lastRecords);

    // 成就（统一服务，按当期日期过滤）
    const periodAch = await _achPeriod({ periodStart: startStr, periodEnd: endStr });
    const achievements = periodAch.got;
    const upcomingAchievements = periodAch.upcoming;

    // 标题
    const { title, desc } = WEEKLY_TITLES.find((_, i) =>
      topSubjects[0]?.name?.includes(["方剂", "内经", "针灸", "中药", "诊断"][i - 1])
    ) || pickWeeklyTitleSafe(totalMinutes, dailyRecords);

    // AI 总结
    const aiSummary = buildWeeklyAiSummary(totalMinutes, activeDays, topSubjects, categoryDistribution, masteryChanges);

    const base = {
      period: { start: startStr, end: endStr },
      title,
      titleDescription: desc,
      totalMinutes,
      activeDays,
      completedTasks,
      taskCompletionRate: Math.round(taskRate),
      streakDays: streak,
      changeRate: Math.round(changeRate),
      dailyRecords,
      contentWall,
      contentStats: { courses: totalCourses, kps: totalKps },
      topSubjects,
      topKnowledgePoints,
      topCompletedCourse,
      categoryDistribution,
      methodDistribution,
      masteryChanges,
      achievements,
      upcomingAchievements,
      aiSummary,
    };
    const completePayload = {
      ...base,
      isPeriodComplete: true,
      periodStatus: "complete",
      incompleteMessage: "",
    };
    if ((totalMinutes || 0) === 0 && !totalCourses) completePayload.periodStatus = "empty";
    return completePayload;
  }, 420);
}

function emptyWeekly(startStr, endStr) {
  return {
    period: { start: startStr, end: endStr },
    title: "",
    titleDescription: "",
    totalMinutes: 0,
    activeDays: 0,
    completedTasks: 0,
    taskCompletionRate: 0,
    streakDays: 0,
    changeRate: 0,
    dailyRecords: [],
    contentWall: [],
    contentStats: { courses: 0, kps: 0 },
    topSubjects: [],
    topKnowledgePoints: [],
    topCompletedCourse: null,
    categoryDistribution: [],
    methodDistribution: [],
    masteryChanges: { newMastered: [], levelUp: [], reviewNeeded: [] },
    achievements: [],
    upcomingAchievements: [],
    aiSummary: { performance: "", progress: "", nextSuggestion: "" },
    isEmpty: true,
  };
}

function pickWeeklyTitleSafe(totalMinutes, dailyRecords) {
  const idx = Math.min(WEEKLY_TITLES.length - 1, Math.floor(totalMinutes / 60));
  return WEEKLY_TITLES[idx];
}

function normalizeDistribution(list, total, fallbackName) {
  if (total === 0) {
    const first = list.find((x) => x.name === fallbackName) || list[0];
    if (!first) return list.map((x) => ({ ...x, percent: 0 }));
    return list.map((x) => ({ ...x, percent: x.name === first.name ? 100 : 0 }));
  }
  let result = list.map((x) => ({ ...x, percent: safePct(x.minutes, total) }));
  let sum = result.reduce((a, b) => a + Math.round(b.percent * 10) / 10, 0);
  // 修正到 100%（调整最大的一项）
  const diff = +(100 - sum).toFixed(1);
  if (result.length > 0 && Math.abs(diff) > 0.05) {
    result[0] = { ...result[0], percent: +(result[0].percent + diff).toFixed(1) };
  }
  return result.map((x) => ({ ...x, percent: Math.max(0, +(x.percent).toFixed(1)) }));
}

function calcMasteryChanges(curr, prev) {
  // 聚合本周和上周的掌握状态
  const mkp = {};
  curr.forEach((r) => Object.entries(r.kps || {}).forEach(([kp, v]) => {
    mkp[kp] = { ...(mkp[kp] || {}), after: Math.max(mkp[kp]?.after || 0, v.mastery), afterCount: (mkp[kp]?.afterCount || 0) + v.count };
  }));
  prev.forEach((r) => Object.entries(r.kps || {}).forEach(([kp, v]) => {
    mkp[kp] = { ...(mkp[kp] || {}), before: Math.max(mkp[kp]?.before || 0, v.mastery) };
  }));
  const newMastered = [];
  const levelUp = [];
  const reviewNeeded = [];
  Object.entries(mkp).forEach(([kp, v]) => {
    const before = v.before || 0;
    const after = v.after || before;
    if (before === 0 && after >= 2) newMastered.push({ name: kp, stage: MASTERY_STAGES[after] || "熟悉" });
    if (before === 1 && after >= 2) levelUp.push({ name: kp, from: "了解", to: "熟悉" });
    else if (before === 2 && after >= 3) levelUp.push({ name: kp, from: "熟悉", to: "掌握" });
    if (after === 1 && (v.afterCount || 0) <= 1) reviewNeeded.push({ name: kp, stage: "了解", reason: "接触次数较少" });
  });
  return { newMastered, levelUp, reviewNeeded };
}

function buildWeeklyAchievements(totalMin, activeDays, streak, tasks) {
  const got = [];
  if (activeDays >= 5) got.push({ id: "week-streak-5", title: "五日勤学", desc: "本周学习≥5天", iconKey: "refresh" });
  if (totalMin >= 300) got.push({ id: "week-hours-5", title: "周习五时", desc: "本周学习≥5小时", iconKey: "review" });
  if (tasks >= 20) got.push({ id: "week-tasks-20", title: "任务达人", desc: "本周完成≥20个任务", iconKey: "task" });
  if (streak >= 14) got.push({ id: "streak-14", title: "持之以恒", desc: "连续学习≥14天", iconKey: "recentFlame" });
  return got;
}

function buildWeeklyAiSummary(totalMin, activeDays, topSubjects, categoryDist, mastery) {
  const hours = Math.round(totalMin / 60 * 10) / 10;
  const top1 = topSubjects[0]?.name || "综合学科";
  const perf = hours >= 8
    ? `本周投入 ${hours} 小时、${activeDays} 天坚持学习，整体表现优秀，学习强度稳步提升。`
    : hours >= 4
      ? `本周累计学习 ${hours} 小时，活跃 ${activeDays} 天，节奏平稳。`
      : `本周学习 ${hours} 小时、活跃 ${activeDays} 天，投入偏少，下周可增加日常固定学习时段。`;
  const prog = (mastery.levelUp?.length || 0) > 0
    ? `掌握程度提升明显：有 ${mastery.levelUp.length} 个知识点从了解上升到熟悉，${mastery.newMastered?.length || 0} 个知识点达到掌握水平。${top1} 依然是你最投入的方向。`
    : `本周${top1}学习占比最大，整体理解稳步加深，继续保持专项练习。`;
  const next = (mastery.reviewNeeded?.length || 0) > 0
    ? `下周建议：1）优先复习「${mastery.reviewNeeded[0].name}」等接触次数少的知识点；2）每天固定 30 分钟诵读经典；3）增加 ${categoryDist[2]?.name || "综合"} 方向的练习，促进各学科均衡发展。`
    : `下周建议：1）每天固定 30 分钟学习时段；2）尝试将 ${top1} 内容与临床案例结合；3）保持每日打卡，争取冲击更长连续学习。`;
  return { performance: perf, progress: prog, nextSuggestion: next };
}

/* ---------- 月报 ---------- */
export function getMonthlyReport(month) {
  return mockResponse(async () => {
    const now = new Date();
    const curY = now.getFullYear(), curM = now.getMonth() + 1;
    const mStr = month || `${curY}-${pad(curM)}`;
    const [y, m] = mStr.split("-").map(Number);
    const ass = assessMonth(mStr);
    if (!ass.isPeriodComplete) {
      return incompleteMonthlyShell(mStr);
    }
    // 不能超过本月
    if (y > curY || (y === curY && m > curM)) {
      return emptyMonthly(mStr);
    }
    const startDay = 1;
    const endDay = new Date(y, m, 0).getDate();
    const startStr = `${y}-${pad(m)}-${pad(startDay)}`;
    const endStr   = `${y}-${pad(m)}-${pad(endDay)}`;
    const records = getRecordsInRange(startStr, endStr);
    // 上月
    const prevMDate = new Date(y, m - 2, 1);
    const prevY = prevMDate.getFullYear(), prevM = prevMDate.getMonth() + 1;
    const prevEnd = new Date(prevY, prevM, 0).getDate();
    const prevRecords = getRecordsInRange(`${prevY}-${pad(prevM)}-01`, `${prevY}-${pad(prevM)}-${pad(prevEnd)}`);

    const totalMinutes = sumField(records, (r) => r.minutes);
    const activeDays   = records.filter((r) => r.minutes >= 15).length;
    const completedTasks = sumField(records, (r) => r.tasks.done);
    const kpCount = records.reduce((acc, r) => acc + Object.keys(r.kps || {}).length, 0);
    const aiQuestionCount = sumField(records, (r) => r.aiQuestions);
    const avgDaily = activeDays === 0 ? 0 : Math.round(totalMinutes / activeDays);
    // 最长连续
    const longestStreak = calcLongestStreak(records);
    const lastMin = sumField(prevRecords, (r) => r.minutes);
    const changeRate = lastMin === 0 ? (totalMinutes === 0 ? 0 : 100) : safePct(totalMinutes - lastMin, lastMin);

    // 日历数据（真实月份 + 强度颜色梯度）
    const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7; // 周一=0
    const dailyRecords = records.map((r) => ({
      date: r.date,
      day: parseDate(r.date).getDate(),
      minutes: r.minutes,
      intensity: r.minutes === 0 ? 0 : r.minutes < 30 ? 1 : r.minutes < 60 ? 2 : r.minutes < 100 ? 3 : 4,
      tasks: r.tasks.done,
      courses: Object.entries(r.courses || {}).map(([id, v]) => {
        const c = courseById(id);
        return { name: c.name, minutes: v.minutes, color: c.color };
      }).sort((a, b) => b.minutes - a.minutes).slice(0, 3),
      kps: Object.keys(r.kps || {}).slice(0, 3),
      aiQuestions: r.aiQuestions,
    }));

    // 内容墙
    const courseAccum = {};
    const kpAccum = {};
    records.forEach((r) => {
      Object.entries(r.courses || {}).forEach(([id, v]) => {
        if (!courseAccum[id]) { const c = courseById(id); courseAccum[id] = { ...c, minutes: 0, kps: [] }; }
        courseAccum[id].minutes += v.minutes;
      });
      Object.entries(r.kps || {}).forEach(([kp, v]) => {
        if (!kpAccum[kp]) kpAccum[kp] = { count: 0, mastery: 0 };
        kpAccum[kp].count += v.count;
        kpAccum[kp].mastery = Math.max(kpAccum[kp].mastery, v.mastery);
      });
    });
    const contentWall = Object.values(courseAccum)
      .sort((a, b) => b.minutes - a.minutes)
      .map((c) => ({
        courseId: c.courseId, name: c.name, color: c.color, lightColor: c.lightColor,
        minutes: c.minutes,
        kps: Object.keys(kpAccum).slice(0, 5),
      }));
    const contentStats = { courses: contentWall.length, kps: Object.keys(kpAccum).length };

    // TOP3 学科（时长/知识点/进步）
    const subjAccum = {};
    records.forEach((r) => Object.entries(r.subjects || {}).forEach(([k, v]) => { subjAccum[k] = (subjAccum[k] || 0) + v; }));
    const prevSubj = {};
    prevRecords.forEach((r) => Object.entries(r.subjects || {}).forEach(([k, v]) => { prevSubj[k] = (prevSubj[k] || 0) + v; }));

    const subjByName = Object.entries(subjAccum).map(([k, m]) => {
      const subj = SUBJECTS.find((s) => s.key === k) || { name: k };
      const prevM = prevSubj[k] || 0;
      const diff = prevM === 0 ? (m === 0 ? 0 : 100) : safePct(m - prevM, prevM);
      return { key: k, name: subj.name, minutes: m, kps: 0, improvement: diff };
    });
    // 补充 kps 数量
    subjByName.forEach((s) => {
      s.kps = Math.round(kpCount * (s.minutes / Math.max(1, totalMinutes)));
    });
    const topByMinutes = [...subjByName].sort((a, b) => b.minutes - a.minutes).slice(0, 3);
    const topByKps     = [...subjByName].sort((a, b) => b.kps - a.kps).slice(0, 3);
    const topByImprove = [...subjByName].sort((a, b) => b.improvement - a.improvement).slice(0, 3);

    const topSubjects = {
      byMinutes: topByMinutes,
      byKps: topByKps,
      byImprove: topByImprove,
    };

    // 高频知识点 TOP3
    const topKnowledgePoints = Object.entries(kpAccum)
      .map(([kp, v]) => ({
        name: kp,
        count: v.count,
        mastery: MASTERY_STAGES[v.mastery] || "了解",
        needConsolidate: v.mastery <= 1,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // 能力对比（月初 vs 月末）
    const abilityBefore = getAbilityBase(mStr, "before");
    const abilityAfter  = getAbilityBase(mStr, "after");

    // 薄弱知识预警
    const weakKnowledgePoints = calcWeakPoints(records, prevRecords, kpAccum);

    // 成就（统一服务）
    const periodAch = await _achPeriod({ periodStart: startStr, periodEnd: endStr });
    const achievements = periodAch.got;
    const upcoming = periodAch.upcoming;

    // 标题
    const { title, desc } = pickMonthlyTitleSafe(activeDays, longestStreak);

    // AI 月度总结（控制在 ~150 字）
    const summary = buildMonthlyAiSummary(totalMinutes, activeDays, longestStreak, topSubjects, weakKnowledgePoints, avgDaily);

    const base = {
      month: mStr,
      year: y,
      monthNum: m,
      title,
      titleDescription: desc,
      totalMinutes,
      activeDays,
      completedTasks,
      knowledgePointCount: kpCount,
      aiQuestionCount,
      averageDailyMinutes: avgDaily,
      longestStreakDays: longestStreak,
      changeRate: Math.round(changeRate),
      firstWeekday,
      daysInMonth: endDay,
      dailyRecords,
      contentWall,
      contentStats,
      topSubjects,
      topKnowledgePoints,
      abilityBefore,
      abilityAfter,
      weakKnowledgePoints,
      achievements,
      upcomingAchievements: upcoming,
      aiSummary: summary,
    };
    const completePayload = {
      ...base,
      isPeriodComplete: true,
      periodStatus: "complete",
      incompleteMessage: "",
      period: { start: startStr, end: endStr },
    };
    if ((totalMinutes || 0) === 0 && !contentStats.courses) completePayload.periodStatus = "empty";
    return completePayload;
  }, 500);
}

function emptyMonthly(mStr) {
  const [y, m] = mStr.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  return {
    month: mStr, year: y, monthNum: m,
    title: "", titleDescription: "",
    totalMinutes: 0, activeDays: 0, completedTasks: 0, knowledgePointCount: 0, aiQuestionCount: 0,
    averageDailyMinutes: 0, longestStreakDays: 0, changeRate: 0,
    firstWeekday, daysInMonth,
    dailyRecords: [], contentWall: [], contentStats: { courses: 0, kps: 0 },
    topSubjects: { byMinutes: [], byKps: [], byImprove: [] },
    topKnowledgePoints: [],
    abilityBefore: { ...DEFAULT_ABILITY },
    abilityAfter:  { ...DEFAULT_ABILITY },
    weakKnowledgePoints: [],
    achievements: [], upcomingAchievements: [],
    aiSummary: { performance: "", progress: "", weakness: "", nextSuggestion: "" },
    isEmpty: true,
  };
}

function calcLongestStreak(records) {
  let best = 0, cur = 0;
  records.forEach((r) => {
    if (r.minutes >= 15) { cur++; best = Math.max(best, cur); }
    else cur = 0;
  });
  return best;
}

function pickMonthlyTitleSafe(activeDays, longestStreak) {
  if (longestStreak >= 12) return MONTHLY_TITLES[1];
  if (activeDays >= 22) return MONTHLY_TITLES[2];
  if (activeDays >= 18) return MONTHLY_TITLES[3];
  return MONTHLY_TITLES[0];
}

function calcWeakPoints(curr, prev, kpAccum) {
  const lastDay = curr[curr.length - 1]?.date || fmtDate(new Date());
  const nowDay = parseDate(lastDay);
  // 遗忘风险 = 接触次数<3 且 mastery<=1
  const forget = Object.entries(kpAccum)
    .filter(([, v]) => v.count < 3 && v.mastery <= 1)
    .map(([kp]) => ({ name: kp, reason: "接触次数少", type: "forget" }))
    .slice(0, 3);
  // 错题最多：这里模拟 master 最低的
  const wrong = Object.entries(kpAccum)
    .filter(([, v]) => v.mastery <= 1)
    .sort((a, b) => (b[1].count - b[1].mastery) - (a[1].count - a[1].mastery))
    .slice(0, 3)
    .map(([kp]) => ({ name: kp, reason: "正确率低", type: "wrong" }));
  // 长时间未复习：本月出现过但最近14天没出现
  const review = [];
  const recentDays = new Set();
  for (let i = Math.max(0, curr.length - 14); i < curr.length; i++) {
    Object.keys(curr[i]?.kps || {}).forEach((k) => recentDays.add(k));
  }
  Object.keys(kpAccum).forEach((kp) => {
    if (!recentDays.has(kp)) review.push({ name: kp, reason: "近两周未复习", type: "review" });
  });
  const first3Review = review.slice(0, 3);
  // 下月优先
  const nextPriority = [...forget, ...wrong.slice(0, 1), ...first3Review.slice(0, 1)]
    .filter((_, i, arr) => arr.findIndex((x) => x.name === arr[i].name) === i)
    .slice(0, 5)
    .map((x) => ({ ...x, priority: x.type === "forget" ? "高" : x.type === "wrong" ? "高" : "中" }));
  return {
    forgetRisk: forget,
    mostWrong: wrong,
    longUnreviewed: first3Review,
    nextPriority,
  };
}

function buildMonthlyAchievements(totalMin, activeDays, longest, tasks, kps) {
  const got = [];
  const hr = Math.round(totalMin / 60);
  if (activeDays >= 20) got.push({ id: "m-active-20", title: "月廿勤耕", desc: "月学习≥20天", iconKey: "refresh", progress: 100, target: 20 });
  if (hr >= 20) got.push({ id: "m-hr-20", title: "月习廿时", desc: "月学习≥20小时", iconKey: "review", progress: 100, target: 20 });
  if (longest >= 10) got.push({ id: "m-streak-10", title: "十日不辍", desc: "连续学习≥10天", iconKey: "recentFlame", progress: 100, target: 10 });
  if (tasks >= 60) got.push({ id: "m-tasks-60", title: "月度任务王", desc: "完成任务≥60个", iconKey: "task", progress: 100, target: 60 });
  if (kps >= 100) got.push({ id: "m-kp-100", title: "博学百点", desc: "接触知识点≥100", iconKey: "statKp", progress: 100, target: 100 });
  return got;
}

function buildUpcomingAchievements(totalMin, longest, tasks, kps) {
  const up = [];
  const hr = Math.round(totalMin / 60);
  up.push({ id: "u-hr-40",  title: "月习四时", desc: "月学习≥40小时",    iconKey: "review",      progress: safePct(hr, 40),  current: hr,  target: 40 });
  up.push({ id: "u-streak-20", title: "廿日连绵", desc: "连续学习≥20天",  iconKey: "recentFlame", progress: safePct(longest, 20), current: longest, target: 20 });
  up.push({ id: "u-tasks-100", title: "百日任务", desc: "完成任务≥100个", iconKey: "task",        progress: safePct(tasks, 100), current: tasks, target: 100 });
  up.push({ id: "u-kp-200", title: "知新二百", desc: "接触知识点≥200", iconKey: "statKp",    progress: safePct(kps, 200), current: kps, target: 200 });
  return up;
}

function buildMonthlyAiSummary(totalMin, activeDays, longest, topSubjects, weak, avg) {
  const hr = Math.round(totalMin / 60 * 10) / 10;
  const top1 = topSubjects.byMinutes[0]?.name || "综合";
  const top2 = topSubjects.byImprove[0]?.name || "综合";
  const weakKp = weak.nextPriority?.[0]?.name;
  const perf = `本月学习 ${hr} 小时，活跃 ${activeDays} 天，平均每日 ${avg} 分钟，最长连续 ${longest} 天，整体节奏稳定，具备了良好的学习惯性。`;
  const prog = `${top1} 投入最多，${top2} 进步最大；本月接触 ${topSubjects.byKps[0]?.name || "综合"} 相关知识点最多，已初步形成知识网络。`;
  const weakness = weakKp ? `薄弱点：「${weakKp}」${weak.nextPriority?.[0]?.reason || ""}，需要重点回顾。` : "本月知识点掌握较为均匀，未出现明显薄弱项。";
  const next = "下月建议：1）每天固定时段学习，培养习惯；2）优先复习薄弱知识点，穿插做题巩固；3）增加案例推演，提升应用能力。";
  return { performance: perf, progress: prog, weakness, nextSuggestion: next };
}

/* ---------- 生成下周计划 ---------- */
export function generateNextWeekPlan(startDate) {
  return mockResponse(() => {
    const start = startDate ? parseDate(startDate) : new Date(startOfWeek(new Date()).getTime() + 7 * 86400000);
    const realStart = startOfWeek(start);
    const weekStart = fmtDate(realStart);
    const weekEnd = fmtDate(new Date(realStart.getTime() + 6 * 86400000));
    const seed = hashStr(weekStart);

    // 基于科目排名安排
    const picks = shuffleArray(COURSES.slice(), seed).slice(0, 4);
    const dailyThemes = ["基础理论夯实", "方剂配伍训练", "中药功效记忆", "经典条文诵读", "辨证练习", "真题/练习", "自由复习"];
    const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const tasks = [];
    let tid = 1;
    for (let i = 0; i < 7; i++) {
      const d = new Date(realStart.getTime() + i * 86400000);
      const isWeekend = i >= 5;
      const count = isWeekend ? 4 : 3;
      const theme = dailyThemes[i];
      for (let j = 0; j < count; j++) {
        const c = picks[(i + j) % picks.length];
        const kp = KNOWLEDGE_POINTS[(seed + i * 3 + j * 7) % KNOWLEDGE_POINTS.length];
        const baseMin = isWeekend ? [30, 25, 20, 15] : [25, 20, 15];
        const min = baseMin[j] || 15;
        const type = j === 0 ? "阅读" : j === 1 ? "记忆" : j === 2 ? "刷题" : "AI答疑";
        tasks.push({
          id: "plan-" + tid++,
          date: fmtDate(d),
          day: dayNames[i],
          theme,
          title: `${c.name} · ${kp}`,
          courseId: c.courseId,
          courseName: c.name,
          knowledge: kp,
          minutes: min,
          type,
          difficultyLevel: 1 + ((seed + i + j) % 3),
          color: c.color,
          lightColor: c.lightColor,
        });
      }
    }
    // 汇总：总时长、每日目标、重点课程
    const totalMin = tasks.reduce((a, b) => a + b.minutes, 0);
    const focusCourses = picks.map((c) => c.name);
    const goals = [
      `学习总时长：约 ${Math.round(totalMin / 60 * 10) / 10} 小时`,
      `核心课程：${focusCourses.join("、")}`,
      `每日打卡：${dayNames.slice(0, 5).join("、")} + 周末加强`,
      `任务总数：${tasks.length} 个`,
    ];
    const tips = [
      "建议每天固定时间（例如 21:00-22:00）开始学习，形成生物钟。",
      "学习前 5 分钟快速浏览上周薄弱点，温故而知新。",
      "周末可安排一次完整模拟，检验本周学习效果。",
    ];
    return {
      period: { start: weekStart, end: weekEnd },
      totalMinutes: totalMin,
      totalTasks: tasks.length,
      goals,
      dailyThemes,
      tasks,
      tips,
    };
  }, 600);
}
