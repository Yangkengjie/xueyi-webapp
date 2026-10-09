import { mockResponse, success } from "./index";
import { apiUrl } from "../utils/apiBase";

const STORAGE_KEY = "xy-api-study-status";

const STUDY_CONTINUE = [
  { courseId: "formula", courseName: "方剂学", name: "《方剂学·解表剂》", progress: 65, nodeId: "fangji-jiebiao-3", chapter: "上篇·第一章", lastPosition: { page: 12, paragraph: 3, percent: 65 }, route: { name: "topic", params: { courseId: "formula", nodeId: "fangji-jiebiao-3" } } },
  { courseId: "neijing", courseName: "内经", name: "《内经》素问·上古天真论", progress: 40, nodeId: "neijing-shanggu-2", chapter: "素问·卷一", lastPosition: { page: 7, paragraph: 5, percent: 40 }, route: { name: "topic", params: { courseId: "neijing", nodeId: "neijing-shanggu-2" } } },
  { courseId: "tcm-basic", courseName: "中医基础理论", name: "中基·藏象学说", progress: 68, nodeId: "zangxiang-5", chapter: "第三章", lastPosition: { page: 22, paragraph: 1, percent: 68 }, route: { name: "course", params: { id: "tcm-basic" }, query: { nodeId: "zangxiang-5" } } },
  { courseId: "zhongyao", courseName: "中药学", name: "中药学·清热药", progress: 22, nodeId: "qingre-2", chapter: "各论·第二章", lastPosition: { page: 5, paragraph: 2, percent: 22 }, route: { name: "topic", params: { courseId: "zhongyao", nodeId: "qingre-2" } } },
];

const EXAM_CONTINUE = [
  { courseId: "zyzh", courseName: "中医综合", name: "《中综》真题 2023 精讲", progress: 78, nodeId: "zyzh-2023-a-41", chapter: "A 型题 41-60", lastPosition: { page: 41, question: 41, percent: 78 }, route: { name: "course", params: { id: "zyzh" }, query: { nodeId: "zyzh-2023-a-41" } } },
  { courseId: "zhongyao-kao", courseName: "中药学（考）", name: "中药功效高频考点", progress: 52, nodeId: "zy-gx-12", chapter: "清热药·考点 12", lastPosition: { page: 18, flashcard: 23, percent: 52 }, route: { name: "topic", params: { courseId: "zhongyao-kao", nodeId: "zy-gx-12" } } },
  { courseId: "zhenjiu-kao", courseName: "针灸学（考）", name: "穴位主治速记", progress: 30, nodeId: "zj-xw-8", chapter: "手阳明经穴位", lastPosition: { page: 9, item: 8, percent: 30 }, route: { name: "topic", params: { courseId: "zhenjiu-kao", nodeId: "zj-xw-8" } } },
];

const STUDY_ADVICE = [
  { id: "sa-1", type: "knowledge", title: "薄弱点提醒", content: "方剂配伍关系掌握得不错，可以尝试更多方剂辨析题来巩固应用能力。", priority: "high" },
  { id: "sa-2", type: "plan", title: "今日学习建议", content: "建议先复习《内经》条文15分钟，再学习新知识，符合艾宾浩斯遗忘曲线。", priority: "medium" },
  { id: "sa-3", type: "achievement", title: "成就激励", content: "持续学习，解锁更多成就徽章，继续加油！", priority: "low" },
];

const EXAM_ADVICE = [
  { id: "ea-1", type: "knowledge", title: "提分提醒", content: "中药功效对比题是历年易错点，建议今天安排 30 分钟专项训练。", priority: "high" },
  { id: "ea-2", type: "plan", title: "今日冲刺计划", content: "推荐：40 分钟真题 + 30 分钟错题回顾 + 15 分钟功效速记，符合考前节奏。", priority: "medium" },
  { id: "ea-3", type: "achievement", title: "考前激励", content: "坚持每日打卡，解锁更多考前冲刺成就！", priority: "low" },
];

const defaultStudyStatus = {
  streakDays: 12,
  rhythm: "稳定",
  bars: [55, 70, 95, 80, 30, 45, 35, 55, 90, 60],
  nextAchievement: "博览群书",
  progress: 57,
  total: 60,
  todayMinutes: 120,
  totalHours: 286,
  learningDays: 127,
  maxStreak: 23,
};

function safeGet(key, def) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return def;
}

function safeSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

/* ------------------ 日期完整性统一判断（本地零点归一，避免跨日跳变） ------------------ */
function today0() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeekLocal0(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return x;
}
function assessDaily(dateStr) {
  const now = today0();
  const x = new Date(dateStr);
  x.setHours(0, 0, 0, 0);
  const diff = Math.round((now.getTime() - x.getTime()) / 86400000);
  const period = { start: dateStr, end: dateStr };
  if (diff < 0) return { isPeriodComplete: false, periodStatus: "future", incompleteMessage: "该日期尚未到达", period };
  if (diff === 0) return { isPeriodComplete: false, periodStatus: "incomplete", incompleteMessage: "今日尚未结束，日报将在明日生成", period };
  return { isPeriodComplete: true, periodStatus: "complete", incompleteMessage: "", period };
}
function assessWeek(startDateStr) {
  const now = today0();
  const s = startOfWeekLocal0(startDateStr);
  const e = new Date(s.getTime() + 6 * 86400000);
  const startStr = s.toISOString().slice(0, 10);
  const endStr = e.toISOString().slice(0, 10);
  const period = { start: startStr, end: endStr };
  const daysS = Math.round((now.getTime() - s.getTime()) / 86400000);
  if (daysS < 0) return { isPeriodComplete: false, periodStatus: "future", incompleteMessage: "该周尚未到达，周报无法生成", period };
  const daysE = Math.round((now.getTime() - e.getTime()) / 86400000);
  if (daysE < 1) return { isPeriodComplete: false, periodStatus: "incomplete", incompleteMessage: "本周尚未结束，周报将在本周结束后生成", period };
  return { isPeriodComplete: true, periodStatus: "complete", incompleteMessage: "", period };
}
function assessMonth(monthStr) {
  const now = today0();
  const [y, m] = monthStr.split("-").map(Number);
  const s = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const daysInMonth = new Date(y, m, 0).getDate();
  const e = new Date(y, m - 1, daysInMonth, 0, 0, 0, 0);
  const startStr = `${y}-${String(m).padStart(2, "0")}-01`;
  const endStr = `${y}-${String(m).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  const period = { start: startStr, end: endStr };
  if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1))
    return { isPeriodComplete: false, periodStatus: "future", incompleteMessage: "该月份尚未到达，月报无法生成", period };
  const daysE = Math.round((now.getTime() - e.getTime()) / 86400000);
  if (daysE < 1) return { isPeriodComplete: false, periodStatus: "incomplete", incompleteMessage: "本月尚未结束，月报将在本月结束后生成", period };
  return { isPeriodComplete: true, periodStatus: "complete", incompleteMessage: "", period };
}

function readStatus() {
  const raw = safeGet(STORAGE_KEY, null);
  if (raw && typeof raw === "object") return { ...defaultStudyStatus, ...raw };
  return { ...defaultStudyStatus };
}

function writeStatus(status) {
  safeSet(STORAGE_KEY, status);
}

/* 调用增强引擎的智能建议接口（DeepSeek 生成），失败返回 null 由调用方回落 mock */
async function callSmartAdviceServer(payload) {
  try {
    const resp = await fetch(apiUrl("/api/smart-advice"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    return null;
  }
}

export async function getSmartAdvice(mode = "study") {
  const server = await callSmartAdviceServer({ mode, status: readStatus() });
  if (server && Array.isArray(server.advice) && server.advice.length) {
    return success(server.advice);
  }
  return mockResponse(() => {
    const base = mode === "exam" ? EXAM_ADVICE : STUDY_ADVICE;
    return base.map((a) => ({ ...a }));
  }, 400);
}

export function getContinueStudy(mode = "study") {
  return mockResponse(() => {
    const list = (mode === "exam" ? EXAM_CONTINUE : STUDY_CONTINUE).map((c) => ({ ...c }));
    return { list, mode };
  }, 250);
}

export function getStudyStatus() {
  return mockResponse(() => readStatus(), 300);
}

export function updateStudyStatus(patch) {
  return mockResponse(() => {
    const current = readStatus();
    const updated = { ...current, ...patch };
    writeStatus(updated);
    return updated;
  }, 200);
}

function buildSubjectsFromMinutes(totalMin) {
  const names = ["方剂学", "内经", "针灸学", "练习", "中医基础理论", "中药学", "温病学"];
  const count = 2 + Math.floor(Math.random() * 3);
  const pick = names.slice(0, count);
  let remain = totalMin;
  const result = [];
  for (let i = 0; i < pick.length; i++) {
    const isLast = i === pick.length - 1;
    const share = isLast ? remain : Math.max(5, Math.round(totalMin / pick.length * (0.6 + Math.random() * 0.8)));
    result.push({ name: pick[i], min: share });
    remain = Math.max(0, remain - share);
  }
  return result;
}

const MOOD_KEYS = ["hot", "stable", "gentle", "think", "push", "calm"];
const MOOD_TEXTS = {
  hot: "手感火热",
  stable: "专注稳定",
  gentle: "循序渐进",
  think: "思考深入",
  push: "干劲十足",
  calm: "慢节奏",
};
const MOOD_ICON_KEYS = {
  hot: "recentFlame",
  stable: "task",
  gentle: "adviceStar",
  think: "statKp",
  push: "plus",
  calm: "journey",
};
const MOOD_NOTES = {
  hot: "专注力满分，趁热打铁突破薄弱点",
  stable: "状态稳定，完成度高",
  gentle: "保持节奏，扎实推进",
  think: "理解力出色，适合攻克难点",
  push: "行动力强，挑战更高目标",
  calm: "适度休息，避免疲劳",
};
const ADVICE_POOL = [
  "方剂配伍关系掌握得不错，可以尝试更多方剂辨析题哦~",
  "建议增加《内经》原文朗读时间，加深印象。",
  "今日专注时长不错，建议睡前回顾要点卡片。",
  "中基藏象部分得分高，可推进到病机章节。",
  "针灸穴位学习可结合打卡方式提高坚持度。",
  "中药功效对比可做一张横向表格方便记忆。",
];

export function getDailyReport(dateStr) {
  return mockResponse(async () => {
    const date = dateStr || new Date().toISOString().slice(0, 10);
    const ass = assessDaily(date);
    if (!ass.isPeriodComplete) {
      return {
        ...ass,
        date,
        goalDone: 0,
        goalTotal: 0,
        minutes: 0,
        moodKey: "gentle",
        moodText: "周期未结束",
        moodIconKey: "",
        moodNote: ass.incompleteMessage,
        subjects: [],
        advice: ass.incompleteMessage,
      };
    }
    const hash = Array.from(date).reduce((a, c) => a + c.charCodeAt(0), 0);
    const minutes = 30 + (hash % 120);
    const goalDone = 2 + (hash % 5);
    const goalTotal = goalDone + (hash % 4) + 1;
    const moodKey = MOOD_KEYS[hash % MOOD_KEYS.length];
    const report = {
      ...ass,
      date,
      goalDone,
      goalTotal,
      minutes,
      moodKey,
      moodText: MOOD_TEXTS[moodKey],
      moodIconKey: MOOD_ICON_KEYS[moodKey],
      moodNote: MOOD_NOTES[moodKey] || "状态稳定",
      subjects: buildSubjectsFromMinutes(minutes),
      advice: ADVICE_POOL[hash % ADVICE_POOL.length],
    };
    /* 日报总结文案接入 DeepSeek，失败保留本地文案 */
    const server = await callSmartAdviceServer({
      mode: "daily",
      data: { date, minutes, goalDone, goalTotal, moodText: report.moodText, subjects: report.subjects },
    });
    if (server && typeof server.summary === "string" && server.summary.trim()) {
      report.advice = server.summary.trim();
    }
    return report;
  }, 300);
}

export function getWeeklyReport(startDate) {
  return mockResponse(async () => {
    const base = startDate || new Date().toISOString().slice(0, 10);
    const ass = assessWeek(base);
    const periodDays = [];
    const s = new Date(ass.period.start);
    for (let i = 0; i < 7; i++) {
      const d = new Date(s.getTime() + i * 86400000);
      periodDays.push(`${d.getMonth() + 1}.${d.getDate()}`);
    }
    if (!ass.isPeriodComplete) {
      return {
        ...ass,
        weekRange: `${periodDays[0]} - ${periodDays[periodDays.length - 1]}`,
        totalHours: 0,
        avgDaily: "0.0",
        trend: [],
        trendDays: periodDays,
        dayCount: 7,
        subjects: [],
        completedTasks: 0,
        achievements: [],
        summary: ass.incompleteMessage,
      };
    }
    const hash = Array.from(base).reduce((a, c) => a + c.charCodeAt(0), 0);
    const dayCount = 7;
    const trend = [];
    const trendDays = [];
    const startObj = new Date(base);
    let total = 0;
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(startObj.getTime() + i * 86400000);
      trendDays.push(`${d.getMonth() + 1}.${d.getDate()}`);
      const val = +((0.4 + ((hash + i * 13) % 20) / 20 * 2.4).toFixed(1));
      trend.push(val);
      total += val;
    }
    const subjectNames = ["中医基础理论", "内经", "方剂学", "中医诊断学", "中药学"];
    const pick = subjectNames.slice(0, 3 + (hash % 2));
    const subjects = pick.map((name, i) => ({
      name,
      hours: +(total / pick.length * (0.7 + ((hash + i) % 5) / 10)).toFixed(1),
    }));
    const report = {
      ...ass,
      weekRange: `${trendDays[0]} - ${trendDays[trendDays.length - 1]}`,
      totalHours: +total.toFixed(1),
      avgDaily: +(total / 7).toFixed(1),
      trend,
      trendDays,
      dayCount,
      subjects,
      completedTasks: 20 + (hash % 25),
      achievements: hash % 2 ? ["初入杏林", "只言片语"] : ["初入杏林", "小试牛刀"],
      summary: `本周学习节奏${hash % 3 === 0 ? "稳定持续" : "先抑后扬"}，${subjects[0].name}学习时长显著提升，继续保持！`,
    };
    /* 周报总结文案接入 DeepSeek，失败保留本地文案 */
    const server = await callSmartAdviceServer({
      mode: "weekly",
      data: { weekRange: report.weekRange, totalHours: report.totalHours, avgDaily: report.avgDaily, subjects, completedTasks: report.completedTasks },
    });
    if (server && typeof server.summary === "string" && server.summary.trim()) {
      report.summary = server.summary.trim();
    }
    return report;
  }, 400);
}

export function getMonthlyReport(month) {
  return mockResponse(async () => {
    const n = new Date();
    const defaultMonth = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
    const m = month || defaultMonth;
    const ass = assessMonth(m);
    const [y, mm] = m.split("-").map(Number);
    const daysInMonth = new Date(y, mm, 0).getDate();
    if (!ass.isPeriodComplete) {
      return {
        ...ass,
        month: m,
        totalHours: 0,
        studyDays: 0,
        avgDaily: "0.0",
        maxStreak: 0,
        daysInMonth,
        subjects: [],
        achievements: [],
        heatmap: Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, hours: 0 })),
        summary: ass.incompleteMessage,
      };
    }
    const hash = Array.from(m).reduce((a, c) => a + c.charCodeAt(0), 0);
    const totalHours = +(40 + (hash % 40)).toFixed(1);
    const studyDays = 18 + (hash % 10);
    const subjectNames = ["中医基础理论", "内经", "方剂学", "中医诊断学"];
    let acc = 0;
    const subjects = subjectNames.map((name, i, arr) => {
      const isLast = i === arr.length - 1;
      const pct = isLast ? Math.max(5, 100 - acc) : 15 + ((hash + i * 7) % 20);
      acc += pct;
      return {
        name,
        hours: +(totalHours * pct / 100).toFixed(1),
        pct,
      };
    });
    const heatmap = [];
    for (let i = 0; i < daysInMonth; i++) {
      const h = (hash + i * 11) % 100;
      heatmap.push({
        day: i + 1,
        hours: h < 12 ? 0 : +((h - 10) / 25).toFixed(1),
      });
    }
    const report = {
      ...ass,
      month: m,
      totalHours,
      studyDays,
      avgDaily: +(totalHours / studyDays).toFixed(1),
      maxStreak: 10 + (hash % 20),
      daysInMonth,
      subjects,
      achievements: ["初入杏林", "博览群书", "只言片语", "小试牛刀"],
      heatmap,
      summary: `本月学习勤奋，总时长接近 ${Math.round(totalHours)} 小时！尤其在${subjects[0].name}方面进步显著，建议下个月增加临床案例学习。`,
    };
    /* 月报总结文案接入 DeepSeek，失败保留本地文案 */
    const server = await callSmartAdviceServer({
      mode: "monthly",
      data: { month: m, totalHours, studyDays, avgDaily: report.avgDaily, maxStreak: report.maxStreak, subjects },
    });
    if (server && typeof server.summary === "string" && server.summary.trim()) {
      report.summary = server.summary.trim();
    }
    return report;
  }, 500);
}

