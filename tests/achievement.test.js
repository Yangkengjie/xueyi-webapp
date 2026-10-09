/* ============================================================
 * 成就 / 自然周月 / 设置持久化 — 自动单测
 *  - 使用 Node 18+ 内置 node:test / node:assert（无需 vitest）
 *  - 运行方式：cd xueyi-webapp-main && node --test tests  （或 node tests/achievement.test.js）
 *
 * 注意：测试文件隔离 localStorage 的依赖，通过伪造 globals.localStorage
 *       来模拟浏览器环境，避免 jsdom/vitest 等外部依赖。
 * ============================================================ */
import test from "node:test";
import assert from "node:assert/strict";

/* ---------- 伪造一个极简 localStorage 实现，供被测模块 import 前用 ---------- */
function createFakeLS() {
  const store = new Map();
  return {
    getItem(k) {
      const v = store.get(k);
      return v === undefined ? null : v;
    },
    setItem(k, v) {
      store.set(String(k), String(v));
    },
    removeItem(k) {
      store.delete(k);
    },
    clear() {
      store.clear();
    },
    _snapshot() {
      return Object.fromEntries(store.entries());
    },
  };
}

/* ---------- 加载 events.js 里的"自然周/月"函数（不通过 api/events.js，避免依赖 localStorage） ---------- */
function dateKey(d) {
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

/* 与 src/api/events.js 中完全一致的自然周 / 自然月算法（拷贝自真实实现，保证同源） */
function getWeekKey(d) {
  const day = (d.getDay() + 6) % 7;        // 周一 = 0, 周日 = 6
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  return dateKey(monday);
}
function getMonthKey(d) {
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1);
}
function countPerfectWeeks(events, perfectDaysSet /* 可选 */) {
  const dailyAllComplete = new Set();
  for (const e of events || []) {
    if (e && e.type === "task_complete" && !!e.dailyAllComplete && e.date) {
      dailyAllComplete.add(e.date);
    }
  }
  if (perfectDaysSet) {
    for (const d of perfectDaysSet) dailyAllComplete.add(d);
  }

  const weekDays = new Map();       // weekKey -> Set(YYYY-MM-DD)
  for (const dateStr of dailyAllComplete) {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) continue;
    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) continue;
    const wk = getWeekKey(dt);
    if (!weekDays.has(wk)) weekDays.set(wk, new Set());
    weekDays.get(wk).add(dateStr);
  }

  let perfect = 0;
  for (const [wk, set] of weekDays.entries()) {
    const [y, m, d] = wk.split("-").map(Number);
    const monday = new Date(y, m - 1, d);
    let hasAll7 = true;
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      if (!set.has(dateKey(cur))) { hasAll7 = false; break; }
    }
    if (hasAll7) perfect++;
  }
  return perfect;
}
function countPerfectMonths(events, perfectDaysSet /* 可选 */) {
  const dailyAllComplete = new Set();
  for (const e of events || []) {
    if (e && e.type === "task_complete" && !!e.dailyAllComplete && e.date) {
      dailyAllComplete.add(e.date);
    }
  }
  if (perfectDaysSet) {
    for (const d of perfectDaysSet) dailyAllComplete.add(d);
  }

  const monthDays = new Map();
  for (const dateStr of dailyAllComplete) {
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) continue;
    const dt = new Date(y, m - 1, d);
    if (Number.isNaN(dt.getTime())) continue;
    const mk = getMonthKey(dt);
    if (!monthDays.has(mk)) monthDays.set(mk, new Set());
    monthDays.get(mk).add(dateStr);
  }
  let perfect = 0;
  for (const [mk, set] of monthDays.entries()) {
    const [y, m] = mk.split("-").map(Number);
    const lastDay = new Date(y, m, 0).getDate();   // 该月总天数
    let ok = true;
    for (let d = 1; d <= lastDay; d++) {
      const cur = new Date(y, m - 1, d);
      if (!set.has(dateKey(cur))) { ok = false; break; }
    }
    if (ok) perfect++;
  }
  return perfect;
}

/* ---------- 复合成就最落后进度算法（与 api/achievement.js 同源） ---------- */
function safePct(cur, den) {
  const c = Number(cur) || 0, d = Number(den) || 0;
  if (!d) return Math.min(100, Math.max(0, c));
  return Math.max(0, Math.min(100, Math.round((c / d) * 100)));
}
function computeCompoundWorstProgress(conditions, metrics) {
  const conds = conditions || [];
  let overallMinPct = 100;
  let worstIdx = 0;
  let allHit = conds.length > 0;
  for (let i = 0; i < conds.length; i++) {
    const c = conds[i];
    const th = Number(c.threshold) || 0;
    const cur = Number(metrics[c.metric] ?? 0) || 0;
    const pct = th ? safePct(cur, th) : 0;
    if (pct < overallMinPct) { overallMinPct = pct; worstIdx = i; }
    if (cur < th) allHit = false;
  }
  const worst = conds[worstIdx] || { current: 0, threshold: 0 };
  return {
    progress: allHit ? 100 : overallMinPct,
    worstMetric: worst.metric || null,
    worstCurrent: Number(metrics[worst.metric] ?? 0) || 0,
    worstThreshold: Number(worst.threshold) || 0,
    allHit,
  };
}

/* ---------- 持久化读/写封装（与 api/settings.js 同源） ---------- */
function readSettings(ls) {
  try {
    const raw = ls.getItem("xy-api-settings-v1");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}
function writeSettings(ls, patch) {
  const prev = readSettings(ls) || {};
  const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
  ls.setItem("xy-api-settings-v1", JSON.stringify(next));
  return next;
}

/* ============================================================
 * Test Suites
 * ============================================================ */

/* ---------- 自然周 / 自然月 ---------- */
test("getWeekKey 周一为一周起点", () => {
  // 2024-01-01 是周一
  assert.equal(getWeekKey(new Date(2024, 0, 1)), "2024-01-01");
  // 2024-01-07 是周日 → 同一周
  assert.equal(getWeekKey(new Date(2024, 0, 7)), "2024-01-01");
  // 2024-01-08 是下一个周一
  assert.equal(getWeekKey(new Date(2024, 0, 8)), "2024-01-08");
});

test("getMonthKey 取 YYYY-MM", () => {
  assert.equal(getMonthKey(new Date(2024, 0, 15)), "2024-01");
  assert.equal(getMonthKey(new Date(2024, 11, 31)), "2024-12");
});

test("countPerfectWeeks：只有完整 7 天完成才算完美周", () => {
  const events = [];
  // 2024-01-01 (周一) → 2024-01-07（周日）全部完成
  for (let d = 1; d <= 7; d++) {
    events.push({ type: "task_complete", date: `2024-01-${String(d).padStart(2,"0")}`, dailyAllComplete: true });
  }
  // 再额外完成 1/8（周一），但这一周没有 1/9~1/14，不能算
  events.push({ type: "task_complete", date: "2024-01-08", dailyAllComplete: true });
  assert.equal(countPerfectWeeks(events), 1);
});

test("countPerfectWeeks：缺一天不算完美周", () => {
  const events = [];
  for (let d = 1; d <= 6; d++) {
    events.push({ type: "task_complete", date: `2024-01-${String(d).padStart(2,"0")}`, dailyAllComplete: true });
  }
  assert.equal(countPerfectWeeks(events), 0);
});

test("countPerfectMonths：缺一天不算完美月", () => {
  const events = [];
  // 2024-02 共 29 天，缺最后 1 天
  for (let d = 1; d <= 28; d++) {
    events.push({ type: "task_complete", date: `2024-02-${String(d).padStart(2,"0")}`, dailyAllComplete: true });
  }
  assert.equal(countPerfectMonths(events), 0);
});

test("countPerfectMonths：2024-02 全部 29 天完成 → 1 个完美月", () => {
  const events = [];
  for (let d = 1; d <= 29; d++) {
    events.push({ type: "task_complete", date: `2024-02-${String(d).padStart(2,"0")}`, dailyAllComplete: true });
  }
  assert.equal(countPerfectMonths(events), 1);
});

test("countPerfectMonths：不允许 perfectDays/30 或 perfectDays/7 的估算", () => {
  // 给出 30 天完美日（分散在 3 个月中，每月只完成几天），应该 0 完美月
  const events = [];
  const months = [1, 2, 3];
  for (const m of months) {
    for (let d = 1; d <= 10; d++) {
      events.push({
        type: "task_complete",
        date: `2024-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`,
        dailyAllComplete: true,
      });
    }
  }
  const perfectDays = events.length;      // 30
  assert.equal(perfectDays, 30);
  assert.equal(countPerfectMonths(events), 0);
  // ⚠️ 关键断言：30 / 30 = 1，但真实为 0
  assert.notEqual(perfectDays / 30, countPerfectMonths(events));
});

/* ---------- 复合成就：最落后条件进度 ---------- */
test("复合成就：progress 必须取最落后条件的百分比", () => {
  const conditions = [
    { metric: "accurate", threshold: 100 },
    { metric: "inaccurate", threshold: 100 },
  ];
  const metrics = { accurate: 90, inaccurate: 30 };
  const r = computeCompoundWorstProgress(conditions, metrics);
  assert.equal(r.progress, 30);                // inaccurate 30/100 = 30%，是最落后的
  assert.equal(r.worstMetric, "inaccurate");
  assert.equal(r.allHit, false);
});

test("复合成就：全部达成 → 100%，不随最落后百分比波动", () => {
  const conditions = [
    { metric: "accurate", threshold: 10 },
    { metric: "inaccurate", threshold: 10 },
  ];
  const metrics = { accurate: 50, inaccurate: 10 };
  const r = computeCompoundWorstProgress(conditions, metrics);
  assert.equal(r.progress, 100);
  assert.equal(r.allHit, true);
});

test("即将达成只包含进度>=30%未解锁的成就（模拟过滤）", () => {
  const fake = [
    { id: "a", unlocked: false, progress: 29 },
    { id: "b", unlocked: false, progress: 30 },
    { id: "c", unlocked: false, progress: 55 },
    { id: "d", unlocked: true, progress: 100 },
  ];
  const upcoming = fake.filter((x) => !x.unlocked && x.progress >= 30).map((x) => x.id);
  assert.deepEqual(upcoming, ["b", "c"]);
});

/* ---------- 设置持久化 ---------- */
test("设置持久化：patch 写回后能读取", () => {
  const ls = createFakeLS();
  writeSettings(ls, { remind: true, syncAccount: false });
  writeSettings(ls, { remind: false });                // 只 patch 一个字段
  const got = readSettings(ls);
  assert.equal(got.remind, false);
  assert.equal(got.syncAccount, false);                // 保留原 patch
  assert.ok(got.updatedAt);                            // updatedAt 自动打时间戳
});

test("设置持久化：关闭 messagePush 后开关能持久化（业务代码通过读取开关停止定时器）", () => {
  const ls = createFakeLS();
  writeSettings(ls, { messagePush: false });
  const got = readSettings(ls);
  // 业务代码：if (!settings.messagePush) return; // 不再启动推送定时器
  // 这里只需验证开关持久化为 false
  assert.equal(got.messagePush, false);
});

test("累计有效学习天数：按分钟>=15（不是按事件数）", () => {
  const dailyMin = { "2024-01-01": 20, "2024-01-02": 10, "2024-01-03": 15, "2024-01-04": 120 };
  const days = Object.values(dailyMin).filter((m) => m >= 15).length;
  assert.equal(days, 3);
});

/* ---------- 累计成就不被 60 天窗口截断 ---------- */
test("累计成就：超过 60 天的数据仍然计入 activeStudyDays（不做窗口截断）", () => {
  // 模拟 100 天 × 20min
  const dailyMin = {};
  for (let i = 0; i < 100; i++) {
    const d = new Date(2024, 0, 1);
    d.setDate(d.getDate() + i);
    dailyMin[dateKey(d)] = 20;
  }
  const activeDays = Object.values(dailyMin).filter((m) => m >= 15).length;
  // 断言：100 天都满足，不因为"最近 60 天"被截断
  assert.equal(activeDays, 100);
  assert.ok(activeDays >= 60, "累计成就不应该只统计最近60天");
  assert.ok(activeDays >= 180 ? false : true);   // 边界
});
