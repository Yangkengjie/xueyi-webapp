import { mockResponse } from "./index";

const STORAGE_KEY = "xy-api-feedback";
const RATE_LIMIT_MS = 10 * 1000;
const MAX_DUP_TEXT = 8;

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

function readStore() {
  const raw = safeGet(STORAGE_KEY, null);
  if (raw && typeof raw === "object" && Array.isArray(raw.items)) return raw;
  return { items: [], lastAt: 0 };
}

function writeStore(s) {
  safeSet(STORAGE_KEY, s);
}

const TYPES = [
  { key: "bug",     label: "Bug 反馈" },
  { key: "feature", label: "功能建议" },
  { key: "content", label: "内容纠错" },
  { key: "other",   label: "其他" },
];

export function getFeedbackTypes() {
  return mockResponse(() => TYPES.slice(), 150);
}

export function submitFeedback(payload) {
  return mockResponse(() => {
    const now = Date.now();
    const store = readStore();
    const text = String((payload && payload.text) || "").trim();
    const type = String((payload && payload.type) || "other");
    const contact = String((payload && payload.contact) || "");

    if (!text) throw new Error("反馈内容不能为空");
    if (text.length > 400) throw new Error("反馈内容不能超过 400 字");

    if (now - store.lastAt < RATE_LIMIT_MS) {
      const remain = Math.ceil((RATE_LIMIT_MS - (now - store.lastAt)) / 1000);
      throw new Error(`提交过于频繁，请 ${remain} 秒后再试`);
    }

    const sameCount = store.items.filter(
      (x) => x && x.text && x.text.slice(0, MAX_DUP_TEXT) === text.slice(0, MAX_DUP_TEXT) && (now - (x.at || 0)) < 60 * 60 * 1000
    ).length;
    if (sameCount >= 2) {
      throw new Error("检测到相似内容重复提交，请修改后再提交");
    }

    const item = {
      id: `fb-${now}`,
      text,
      type: TYPES.find((t) => t.key === type) ? type : "other",
      contact,
      at: now,
      status: "received",
    };
    store.items.unshift(item);
    store.lastAt = now;
    writeStore(store);
    return {
      id: item.id,
      status: item.status,
      receivedAt: new Date(now).toLocaleString("zh-CN"),
      message: "已收到反馈，感谢你的支持~",
    };
  }, 500);
}

export function getFeedbackHistory() {
  return mockResponse(() => {
    const store = readStore();
    return store.items
      .map((x) => ({
        id: x.id,
        text: x.text,
        typeLabel: (TYPES.find((t) => t.key === x.type) || {}).label || x.type,
        status: x.status,
        at: x.at ? new Date(x.at).toLocaleString("zh-CN") : "",
      }));
  }, 200);
}
