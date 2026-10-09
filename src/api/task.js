import { mockResponse } from "./index";

const STORAGE_KEY = "xy-api-tasks";
const HISTORY_KEY = "xy-api-task-history";
const DETAIL_KEY = "xy-api-task-detail";

const baseRecommendTasks = [
  { id: "r1", text: "背诵《伤寒论》一级条文5条", course: "伤寒论", source: "system", estimate: 15, difficulty: "中", type: "recite", nodeId: "shanghan-1" },
  { id: "r2", text: "做《内科学》第一章练习题并改错", course: "内科学", source: "system", estimate: 30, difficulty: "中", type: "exercise", nodeId: "neike-1" },
  { id: "r3", text: "学习《方剂学》解表剂组成与功效", course: "方剂学", source: "system", estimate: 25, difficulty: "易", type: "learn", nodeId: "fangji-jiebiao" },
];

const baseRecommendExamTasks = [
  { id: "e1", text: "《中医综合》真题 2023 A 型题 1-20 题", course: "中医综合", source: "system", estimate: 40, difficulty: "中", type: "exam", nodeId: "zyzh-2023-a1" },
  { id: "e2", text: "《中药学》考试高频功效对照记忆", course: "中药学", source: "system", estimate: 30, difficulty: "中", type: "recite", nodeId: "zhongyao-gx" },
  { id: "e3", text: "《针灸学》穴位定位速记 10 穴", course: "针灸学", source: "system", estimate: 20, difficulty: "易", type: "recite", nodeId: "zhenjiu-xuewei-10" },
];

const defaultTasks = [
  { ...baseRecommendTasks[0], id: 1, done: true },
  { ...baseRecommendTasks[1], id: 2, done: false },
  { ...baseRecommendTasks[2], id: 3, done: false },
];

const defaultDetailMap = {
  1: { objective: "掌握《伤寒论》核心条文", keywords: ["伤寒论", "条文背诵"], references: ["《伤寒论》原文第1-5条", "教材注解"], tips: "大声朗读 + 抄写 3 遍可增强记忆" },
  2: { objective: "通过习题巩固第一章内容", keywords: ["内科学", "改错"], references: ["《内科学》第一章教材", "配套习题集"], tips: "错题整理到错题本，每周回顾" },
  3: { objective: "掌握解表剂分类", keywords: ["方剂学", "解表剂"], references: ["《方剂学》教材解表剂章节", "趣味方歌"], tips: "结合歌诀记忆，按分类对比" },
};

const defaultHistory = [
  { date: "2026-08-16", items: [
    { id: 101, text: "复习内经二级条文60-65", done: true, course: "内经", minutes: 22 },
    { id: 102, text: "完成中医诊断学期末模拟题", done: true, course: "中医诊断学", minutes: 65 },
  ], subjects: ["内经", "中医诊断学"], mood: "积极", advice: "保持节奏，下周可加难度", minutes: 87 },
  { date: "2026-08-15", items: [
    { id: 103, text: "学习内经二级条文60-65", done: true, course: "内经", minutes: 28 },
  ], subjects: ["内经"], mood: "专注", advice: "建议增加理解类题目", minutes: 28 },
  { date: "2026-08-14", items: [
    { id: 104, text: "《中药学》清热药功效梳理", done: true, course: "中药学", minutes: 40 },
    { id: 105, text: "《方剂学》清热剂方歌", done: false, course: "方剂学", minutes: 15 },
  ], subjects: ["中药学", "方剂学"], mood: "疲惫", advice: "适度休息，劳逸结合", minutes: 55 },
  { date: "2026-08-13", items: [
    { id: 106, text: "《中医基础理论》藏象复习", done: true, course: "中基", minutes: 35 },
  ], subjects: ["中基"], mood: "专注", advice: "可尝试做思维导图梳理", minutes: 35 },
  { date: "2026-08-12", items: [
    { id: 107, text: "《温病学》卫气营血辨证", done: true, course: "温病学", minutes: 45 },
    { id: 108, text: "错题回顾 20 题", done: true, course: "综合", minutes: 30 },
  ], subjects: ["温病学", "综合"], mood: "积极", advice: "正确率提升明显，保持！", minutes: 75 },
  { date: "2026-08-11", items: [
    { id: 109, text: "《金匮要略》第一篇条文", done: true, course: "金匮", minutes: 25 },
  ], subjects: ["金匮"], mood: "一般", advice: "条文较晦涩，可配合医案理解", minutes: 25 },
  { date: "2026-08-10", items: [
    { id: 110, text: "《针灸学》十二经脉流注", done: true, course: "针灸学", minutes: 38 },
  ], subjects: ["针灸学"], mood: "积极", advice: "可以尝试自己画图", minutes: 38 },
];

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

function readTasks() {
  const list = safeGet(STORAGE_KEY, null);
  if (Array.isArray(list)) return list;
  return defaultTasks.map((t) => ({ ...t }));
}

function writeTasks(tasks) {
  safeSet(STORAGE_KEY, tasks);
}

function readDetailMap() {
  const m = safeGet(DETAIL_KEY, null);
  if (m && typeof m === "object") return m;
  return { ...defaultDetailMap };
}

function writeDetailMap(m) {
  safeSet(DETAIL_KEY, m);
}

function readHistory() {
  const h = safeGet(HISTORY_KEY, null);
  if (Array.isArray(h)) return h;
  return defaultHistory.map((d) => ({ ...d, items: (d.items || []).map((x) => ({ ...x })) }));
}

function buildRecommendTasks(mode) {
  const base = mode === "exam" ? baseRecommendExamTasks : baseRecommendTasks;
  const now = Date.now();
  return base.map((t, i) => ({
    ...t,
    id: `${mode === "exam" ? "e" : "r"}-${now}-${i}`,
    done: false,
    createdAt: now,
  }));
}

export function getTasks(mode = "study") {
  return mockResponse(() => {
    const list = readTasks();
    const doneCount = list.filter((t) => t.done).length;
    return { list, total: list.length, doneCount, mode };
  }, 250);
}

export function getTaskDetail(taskId) {
  return mockResponse(() => {
    const tasks = readTasks();
    const task = tasks.find((t) => String(t.id) === String(taskId));
    if (!task) throw new Error("任务不存在");
    const map = readDetailMap();
    const extra = map[taskId] || {
      objective: `完成：${task.text}`,
      keywords: [task.course || "综合", task.type || "学习"],
      references: ["对应教材章节", "配套课件"],
      tips: "建议专注 25 分钟后休息 5 分钟（番茄工作法）",
    };
    return { ...task, ...extra };
  }, 220);
}

export function addTask(text, course = "自定义", extra = {}) {
  return mockResponse(() => {
    const tasks = readTasks();
    const id = `c-${Date.now()}`;
    const newTask = {
      id,
      text,
      done: false,
      course: course || "自定义",
      source: "custom",
      estimate: extra.estimate || 20,
      difficulty: extra.difficulty || "中",
      type: extra.type || "custom",
      createdAt: Date.now(),
    };
    tasks.push(newTask);
    writeTasks(tasks);
    if (extra.tips || extra.objective) {
      const map = readDetailMap();
      map[id] = { objective: extra.objective, tips: extra.tips, keywords: extra.keywords, references: extra.references };
      writeDetailMap(map);
    }
    return newTask;
  }, 300);
}

export function toggleTask(taskId) {
  return mockResponse(() => {
    const tasks = readTasks();
    const task = tasks.find((t) => String(t.id) === String(taskId));
    if (task) task.done = !task.done;
    writeTasks(tasks);
    return task;
  }, 200);
}

export function removeTask(taskId) {
  return mockResponse(() => {
    const tasks = readTasks().filter((t) => String(t.id) !== String(taskId));
    writeTasks(tasks);
    const doneCount = tasks.filter((t) => t.done).length;
    return { list: tasks, total: tasks.length, doneCount };
  }, 220);
}

export function refreshTasks(mode = "study") {
  return mockResponse(() => {
    const current = readTasks();
    const customTasks = current.filter((t) => t && (t.source === "custom" || /^c-/.test(String(t.id))));
    const refreshed = buildRecommendTasks(mode);
    const merged = [...refreshed, ...customTasks];
    writeTasks(merged);
    const doneCount = merged.filter((t) => t.done).length;
    return { list: merged, total: merged.length, doneCount, refreshedCount: refreshed.length, preservedCustomCount: customTasks.length, mode };
  }, 400);
}

export function getTaskHistory() {
  return mockResponse(() => readHistory(), 300);
}

export function getDayReport(dateStr) {
  return mockResponse(() => {
    const history = readHistory();
    const day = history.find((d) => d.date === dateStr);
    if (day) return day;
    const baseItems = [
      { id: `${dateStr}-1`, text: "日常学习安排", done: true, course: "综合", minutes: 30 },
    ];
    return {
      date: dateStr,
      items: baseItems,
      subjects: ["综合"],
      mood: "平静",
      advice: "该日暂无记录，保持学习节奏即可",
      minutes: 30,
    };
  }, 250);
}
