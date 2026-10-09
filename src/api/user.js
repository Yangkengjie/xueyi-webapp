import { mockResponse, success, delay } from "./index";

export function safeLSGet(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    return defaultValue;
  }
}

export function safeLSSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

const DEFAULT_AVATAR = "";

const defaultUser = {
  id: "u001",
  userName: "岐黄学子",
  avatarUrl: DEFAULT_AVATAR,
  lastLoginTime: "2026-08-17 09:00:00",
  studyDays: 12,
  createTime: "2026-07-20 10:00:00",
  updateTime: "2026-08-17 09:00:00",
  userId: "2024001",
  school: "成都中医药大学",
  major: "中医学5年制",
  grade: "大一",
  gender: "女",
  persona: "体系构建师",
  phone: "18682000000",
};

const STORAGE_KEY = "xy-api-user";

function readUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultUser, ...parsed };
    }
  } catch (e) {}
  return { ...defaultUser };
}

function writeUser(user) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (e) {}
}

export function getUserProfile() {
  return mockResponse(() => readUser(), 300);
}

export function updateUserProfile(profile) {
  return mockResponse(() => {
    const current = readUser();
    const updated = { ...current, ...profile, updateTime: new Date().toLocaleString("zh-CN") };
    writeUser(updated);
    return updated;
  }, 400);
}

export function updateAvatar(avatarUrl) {
  return mockResponse(() => {
    const current = readUser();
    current.avatarUrl = avatarUrl;
    current.updateTime = new Date().toLocaleString("zh-CN");
    writeUser(current);
    return { avatarUrl };
  }, 500);
}

export function login(payload) {
  return mockResponse(() => {
    const user = readUser();
    user.lastLoginTime = new Date().toLocaleString("zh-CN");
    const p = typeof payload === "object" ? payload?.phone : payload;
    if (p) user.phone = p;
    /* 演示登录不再强制覆盖默认演示用户的档案、学习数据与成就记录，
       仅补 lastLoginTime + xy-login 登录标记 */
    writeUser(user);
    try { localStorage.setItem("xy-login", "1"); } catch (e) {}
    return { code: 200, token: "mock-token-" + Date.now(), user };
  }, 800);
}

export function logout() {
  return mockResponse(() => {
    try {
      localStorage.removeItem("xy-login");
    } catch (e) {}
    return { ok: true };
  }, 200);
}

export function isLoggedIn() {
  try {
    return localStorage.getItem("xy-login") === "1";
  } catch (e) {
    return false;
  }
}
