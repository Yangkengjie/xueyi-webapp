/* ============================================================
 * admin.js — 管理端 Mock 接口（仅接口定义 + 示例数据）
 * 注意：当前工作区不存在真实管理端工程，本文件仅供接口说明与联调参考，
 *       不代表管理端功能已实现。
 * ============================================================ */
import { mockResponse } from "./index.js";

function safeLS(key, fallback) {
  try { const raw = localStorage.getItem(key); if (raw == null) return fallback; return JSON.parse(raw); }
  catch (e) { return fallback; }
}
function safeSetLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

const USERS_KEY = "xy-admin-users-v1";
const FEEDBACK_KEY = "xy-admin-feedback-v1";
const CONTENT_KEY = "xy-admin-content-v1";
const OPLOG_KEY = "xy-admin-oplog-v1";
const ROLE_KEY = "xy-admin-roles-v1";

const DEFAULT_USERS = [
  { id: "u001", name: "岐黄学子", mobile: "138****0001", registerAt: "2026-06-01", ban: false, learningHours: 72, favorite: "伤寒论" },
  { id: "u002", name: "杏林春暖", mobile: "139****0002", registerAt: "2026-06-08", ban: false, learningHours: 41, favorite: "中药学" },
  { id: "u003", name: "橘井泉香", mobile: "137****0003", registerAt: "2026-07-01", ban: true,  learningHours:  8, favorite: "内经" },
];
const DEFAULT_FEEDBACK = [
  { id: "fb001", userId: "u001", type: "feedback", title: "成就弹窗多次触发", content: "每次刷新都会弹一遍，希望只弹一次", status: "open", createdAt: "2026-08-20 10:12", reply: null },
  { id: "fb002", userId: "u002", type: "report",   title: "举报违规评论", content: "某评论区出现广告信息", status: "replied", createdAt: "2026-08-21 14:40", reply: "已处理，感谢反馈。" },
];
const DEFAULT_CONTENT = [
  { id: "c001", title: "伤寒论条文精讲", category: "课程", status: "published", author: "content-team", publishedAt: "2026-07-01" },
  { id: "c002", title: "中药学功效速记", category: "文章", status: "draft",     author: "content-team", publishedAt: null },
];
const DEFAULT_ROLES = [
  { key: "superadmin", name: "超级管理员", permissions: ["*"] },
  { key: "ops",        name: "运营",         permissions: ["content.edit","feedback.reply","user.view"] },
  { key: "audit",      name: "审核",         permissions: ["content.offline","feedback.reply","user.ban"] },
  { key: "viewer",     name: "只读查看",     permissions: ["user.view","content.view","log.view"] },
];

function readUsers() { const r = safeLS(USERS_KEY, null); return Array.isArray(r) ? r : DEFAULT_USERS.slice(); }
function readFeedback() { const r = safeLS(FEEDBACK_KEY, null); return Array.isArray(r) ? r : DEFAULT_FEEDBACK.slice(); }
function readContent() { const r = safeLS(CONTENT_KEY, null); return Array.isArray(r) ? r : DEFAULT_CONTENT.slice(); }
function readOplog() { const r = safeLS(OPLOG_KEY, null); return Array.isArray(r) ? r : []; }
function readRoles() { const r = safeLS(ROLE_KEY, null); return Array.isArray(r) ? r : DEFAULT_ROLES.slice(); }

function pushOp(adminId, action, target) {
  const l = readOplog();
  l.push({ id: "op-" + Date.now(), adminId: adminId || "mock-admin", action, target, at: new Date().toISOString() });
  safeSetLS(OPLOG_KEY, l.slice(-500));
}

/* -------------------- 1. 用户管理 -------------------- */
export function adminListUsers({ keyword = "", page = 1, pageSize = 20 } = {}) {
  return mockResponse(() => {
    let list = readUsers();
    if (keyword) {
      const k = String(keyword).toLowerCase();
      list = list.filter((u) => (u.name || "").toLowerCase().includes(k) || (u.mobile || "").includes(k));
    }
    const total = list.length;
    const s = (page - 1) * pageSize;
    return { total, page, pageSize, list: list.slice(s, s + pageSize) };
  }, 220);
}
export function adminSetUserBan({ userId, ban }) {
  return mockResponse(() => {
    const users = readUsers();
    const u = users.find((x) => x.id === userId);
    if (!u) throw new Error("用户不存在");
    u.ban = !!ban;
    safeSetLS(USERS_KEY, users);
    pushOp("audit", ban ? "user.ban" : "user.unban", userId);
    return u;
  }, 200);
}

/* -------------------- 2. 反馈 / 举报 -------------------- */
export function adminListFeedback({ status = "", keyword = "", page = 1, pageSize = 20 } = {}) {
  return mockResponse(() => {
    let list = readFeedback();
    if (status) list = list.filter((f) => f.status === status);
    if (keyword) {
      const k = String(keyword).toLowerCase();
      list = list.filter((f) => (f.title || "").toLowerCase().includes(k) || (f.content || "").toLowerCase().includes(k));
    }
    const total = list.length;
    const s = (page - 1) * pageSize;
    return { total, page, pageSize, list: list.slice(s, s + pageSize) };
  }, 220);
}
export function adminReplyFeedback({ feedbackId, reply }) {
  return mockResponse(() => {
    const list = readFeedback();
    const f = list.find((x) => x.id === feedbackId);
    if (!f) throw new Error("反馈不存在");
    f.reply = reply;
    f.status = "replied";
    safeSetLS(FEEDBACK_KEY, list);
    pushOp("ops", "feedback.reply", feedbackId);
    return f;
  }, 200);
}

/* -------------------- 3. 内容管理 -------------------- */
export function adminListContent({ keyword = "", status = "", page = 1, pageSize = 20 } = {}) {
  return mockResponse(() => {
    let list = readContent();
    if (status) list = list.filter((c) => c.status === status);
    if (keyword) {
      const k = String(keyword).toLowerCase();
      list = list.filter((c) => (c.title || "").toLowerCase().includes(k));
    }
    const total = list.length;
    const s = (page - 1) * pageSize;
    return { total, page, pageSize, list: list.slice(s, s + pageSize) };
  }, 220);
}
export function adminPublishContent({ id, published = true }) {
  return mockResponse(() => {
    const list = readContent();
    const c = list.find((x) => x.id === id);
    if (!c) throw new Error("内容不存在");
    c.status = published ? "published" : "offline";
    if (published) c.publishedAt = new Date().toISOString().slice(0, 10);
    safeSetLS(CONTENT_KEY, list);
    pushOp("ops", published ? "content.publish" : "content.offline", id);
    return c;
  }, 200);
}

/* -------------------- 4. 用户画像统计 -------------------- */
export function adminUserStats({ userId }) {
  return mockResponse(() => {
    return {
      userId,
      learningMinutes: 72 * 60,
      subjects: ["伤寒论", "中药学"],
      favoriteFeatures: ["AI 答疑", "知识图谱", "每日任务"],
      weeklyHeat: [30, 45, 60, 20, 90, 0, 55],
    };
  }, 180);
}

/* -------------------- 5. 管理员操作日志 -------------------- */
export function adminListOplog({ page = 1, pageSize = 50 } = {}) {
  return mockResponse(() => {
    const list = readOplog().slice().reverse();
    const total = list.length;
    const s = (page - 1) * pageSize;
    return { total, page, pageSize, list: list.slice(s, s + pageSize) };
  }, 200);
}

/* -------------------- 6. 管理员角色与权限 -------------------- */
export function adminListRoles() {
  return mockResponse(() => readRoles(), 160);
}

export function adminMissingNotice() {
  return mockResponse(() => ({
    implemented: false,
    notice: "管理端源码缺失，暂未实现。以上 Mock 接口仅用于接口定义与演示数据。",
    availableApis: [
      "adminListUsers / adminSetUserBan",
      "adminListFeedback / adminReplyFeedback",
      "adminListContent / adminPublishContent",
      "adminUserStats",
      "adminListOplog",
      "adminListRoles",
    ],
  }), 100);
}
