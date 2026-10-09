import { mockResponse } from "./index";

const NINE_STYLES = [
  { key: "direct",   value: "direct",   name: "直接精准模式",   label: "直接精准模式",   note: "直击要点，简洁明了",           desc: "直击问题核心，给出精准简洁的答案" },
  { key: "guide",    value: "guide",    name: "引导式对话模式", label: "引导式对话模式", note: "循循善诱，通过问题引导思考",   desc: "循循善诱，通过问题引导学习者自主推理" },
  { key: "clinical", value: "clinical", name: "临床案例模式",   label: "临床案例模式",   note: "结合真实临床案例分析",         desc: "结合真实或模拟临床病案进行讲解分析" },
  { key: "image",    value: "image",    name: "图像解说模式",   label: "图像解说模式",   note: "通过图谱、示意图辅助说明",     desc: "配合知识图谱、示意图、表格进行讲解" },
  { key: "analogy",  value: "analogy",  name: "通俗类比模式",   label: "通俗类比模式",   note: "用生活事物类比解释",           desc: "运用通俗生活类比，化深奥为浅显" },
  { key: "ancient",  value: "ancient",  name: "古籍溯源模式",   label: "古籍溯源模式",   note: "引用《内经》《伤寒》原文溯源", desc: "引用经典古籍原文，梳理学术源流" },
  { key: "schools",  value: "schools",  name: "医家各说模式",   label: "医家各说模式",   note: "对比历代医家不同观点",         desc: "列举历代名家观点对比，呈现各家学说" },
  { key: "modern",   value: "modern",   name: "现代研究模式",   label: "现代研究模式",   note: "结合现代药理与临床证据",       desc: "引入现代药理研究、循证医学证据说明" },
  { key: "formula",  value: "formula",  name: "关联方药模式",   label: "关联方药模式",   note: "联想相关方剂与中药",           desc: "关联讲解相关的代表方剂与常用中药" },
];

const STORAGE_KEY = "xy-api-settings";
const LAST_PAGE_KEY = "xy-last-open-page";
const BACKUP_KEY_PREFIX = "xy-";

const defaultSettings = {
  answerStyles: ["guide"],
  smartLink: true,
  remind: true,
  push: true,
  recommend: true,
  homeCustom: "today",
  permissionCamera: false,
  permissionPhoto: true,
  permissionNotification: true,
  permissionLocation: false,
  permissionMicrophone: false,
  fontSize: "medium",
  theme: "light",
  /* --- 新增 6 项：账号同步 / 进度同步 / 数据备份 / 启动画面 / 导出 / 消息推送 --- */
  syncAccount: true,
  syncProgress: true,
  dataBackup: true,
  launchPage: "home",   // "home" | "last"
  exportData: true,
  messagePush: true,
  /* --- 成就解锁提醒开关（关闭后仍记录成就，仅不主动弹窗） --- */
  achievementNotify: true,
};

const VALID_LAUNCH_PAGE = { home: true, last: true };

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

function safeGetRaw(key, def) {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return raw;
  } catch (e) {}
  return def;
}

const VALID_STYLE_KEYS = NINE_STYLES.map((s) => s.key);
const VALID_HOME_CUSTOM = { today: true, week: true, month: true };

function sanitizeSettings(s) {
  const out = { ...s };
  if (!out || typeof out !== "object") return { ...defaultSettings };
  if (Array.isArray(out.answerStyles)) {
    const filtered = out.answerStyles.filter((k) => VALID_STYLE_KEYS.includes(k));
    out.answerStyles = filtered.length ? filtered : ["guide"];
  } else {
    out.answerStyles = ["guide"];
  }
  if (!VALID_HOME_CUSTOM[out.homeCustom]) out.homeCustom = "today";
  if (!VALID_LAUNCH_PAGE[out.launchPage]) out.launchPage = "home";
  /* 布尔值归一 */
  ["smartLink","remind","push","recommend",
   "permissionCamera","permissionPhoto","permissionNotification","permissionLocation","permissionMicrophone",
   "syncAccount","syncProgress","dataBackup","exportData","messagePush","achievementNotify"
  ].forEach((k) => { out[k] = !!out[k]; });
  return out;
}

function readSettings() {
  const raw = safeGet(STORAGE_KEY, null);
  const cleaned = sanitizeSettings(raw || {});
  return { ...defaultSettings, ...cleaned };
}

function writeSettings(s) {
  safeSet(STORAGE_KEY, s);
}

/* 实时定时器：根据 remind/push/messagePush 开关真实启停 */
let _remindTimer = null;
let _pushTimer = null;
function ensureTimers() {
  const s = readSettings();
  /* 每日学习提醒：晚 8 点 */
  if (_remindTimer) { clearTimeout(_remindTimer); _remindTimer = null; }
  if (s.remind && s.permissionNotification) {
    const now = new Date();
    const target = new Date(now);
    target.setHours(20, 0, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();
    _remindTimer = setTimeout(() => {
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("学医智用", { body: "今日学习时间到啦，坚持就是胜利！" });
        }
      } catch (_) {}
      ensureTimers();
    }, Math.min(delay, 2 ** 31 - 1));
  }
  /* 智能推送：每 30 分钟模拟一次消息提示（真实启停） */
  if (_pushTimer) { clearInterval(_pushTimer); _pushTimer = null; }
  if (s.push && s.messagePush) {
    _pushTimer = setInterval(() => {
      try {
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent("xy-push-tick", { detail: { at: Date.now() } }));
        }
      } catch (_) {}
    }, 30 * 60 * 1000);
  }
}

export function getSettings() {
  return mockResponse(() => {
    ensureTimers();
    const s = readSettings();
    return {
      settings: s,
      answerStyles: NINE_STYLES,
      selectedAnswerStyles: s.answerStyles,
      /* --- 权限说明：浏览器无法原生提供的权限统一标注 Web 模拟 --- */
      permissionNotes: {
        camera: "Web 模拟（浏览器无原生相机权限控制，仅前端切换 UI 能力）",
        location: "Web 模拟（地理位置需用户单独授权浏览器，此处仅前端开关）",
        microphone: "Web 模拟（麦克风需浏览器授权，此处仅前端标记）",
        notification: "Web 模拟（浏览器通知需用户首次同意，此处为前端偏好标记）",
      },
    };
  }, 250);
}

export function saveSettings(patch) {
  return mockResponse(() => {
    const current = readSettings();
    const next = sanitizeSettings({ ...current, ...patch });
    writeSettings(next);
    ensureTimers();
    return next;
  }, 300);
}

export function getAnswerStyles() {
  return mockResponse(() => NINE_STYLES.slice(), 200);
}

export function getSelectedAnswerStyles() {
  return mockResponse(() => {
    const s = readSettings();
    return {
      keys: s.answerStyles,
      list: NINE_STYLES.filter((a) => s.answerStyles.includes(a.key)),
    };
  }, 200);
}

export function saveSelectedAnswerStyles(keys) {
  return mockResponse(() => {
    const list = Array.isArray(keys) ? keys.slice() : [];
    const filtered = list.filter((k) => VALID_STYLE_KEYS.includes(k));
    const final = filtered.length ? filtered : ["guide"];
    return saveSettings({ answerStyles: final });
  }, 300);
}

export function getPermissions() {
  return mockResponse(() => {
    const s = readSettings();
    return {
      camera: !!s.permissionCamera,
      photo: !!s.permissionPhoto,
      notification: !!s.permissionNotification,
      location: !!s.permissionLocation,
      microphone: !!s.permissionMicrophone,
      /* Web 模拟标注 */
      webSimulated: ["camera", "location", "microphone", "notification"],
    };
  }, 200);
}

export function savePermission(key, value) {
  return mockResponse(() => {
    const map = {
      camera: "permissionCamera",
      photo: "permissionPhoto",
      notification: "permissionNotification",
      location: "permissionLocation",
      microphone: "permissionMicrophone",
    };
    const k = map[key];
    if (!k) throw new Error("未知权限");
    return saveSettings({ [k]: !!value });
  }, 250);
}

/* ============================================================
 * 新增：启动页 / 数据备份 / JSON 导出
 * ============================================================ */

export function recordLastPage(routeName) {
  try { localStorage.setItem(LAST_PAGE_KEY, JSON.stringify({ route: routeName || "home", at: Date.now() })); }
  catch (e) {}
  return mockResponse(() => ({ ok: true }), 40);
}

export function getLaunchPage() {
  return mockResponse(() => {
    const s = readSettings();
    const last = safeGet(LAST_PAGE_KEY, { route: "home" });
    return {
      mode: s.launchPage,
      lastRoute: s.launchPage === "last" ? (last.route || "home") : "home",
    };
  }, 120);
}

export function saveLaunchPage(mode) {
  return saveSettings({ launchPage: VALID_LAUNCH_PAGE[mode] ? mode : "home" });
}

/* 备份快照：聚合所有 xy- 前缀键（学习记录/知识点编辑/关联/成就/个人设置 等） */
function buildBackupSnapshot() {
  const out = {};
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(BACKUP_KEY_PREFIX)) keys.push(k);
    }
  } catch (e) {}
  for (const k of keys) {
    try { out[k] = safeGetRaw(k, null); } catch (_) { out[k] = null; }
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: "xueyi-webapp",
    keys,
    data: out,
  };
}

function applyBackupSnapshot(snapshot) {
  if (!snapshot || !snapshot.data || typeof snapshot.data !== "object") {
    throw new Error("备份文件无效");
  }
  const map = snapshot.data || {};
  for (const k of Object.keys(map)) {
    if (!k.startsWith(BACKUP_KEY_PREFIX)) continue;
    try {
      const raw = map[k];
      if (raw == null) localStorage.removeItem(k);
      else localStorage.setItem(k, raw);
    } catch (e) {}
  }
  return { restored: Object.keys(map).length };
}

export function createBackup() {
  return mockResponse(async () => {
    const s = readSettings();
    if (!s.dataBackup) {
      throw new Error("数据备份开关已关闭，请先在设置中开启");
    }
    const snap = buildBackupSnapshot();
    /* 保存到 backup bucket */
    const bucket = safeGet("xy-backup-bucket", []);
    const list = Array.isArray(bucket) ? bucket.slice() : [];
    list.unshift({ id: "bk-" + Date.now(), createdAt: snap.exportedAt, sizeKb: Math.round(JSON.stringify(snap).length / 1024) });
    safeSet("xy-backup-bucket", list.slice(0, 20));
    return {
      snapshotId: "bk-" + Date.now(),
      createdAt: snap.exportedAt,
      keysCount: (snap.keys || []).length,
      sizeKb: Math.round(JSON.stringify(snap).length / 1024),
    };
  }, 400);
}

export function listBackups() {
  return mockResponse(() => {
    const list = safeGet("xy-backup-bucket", []);
    return { list: Array.isArray(list) ? list : [] };
  }, 120);
}

/* 浏览器下载 JSON：URL.createObjectURL + Blob */
function _downloadBlob(dataStr, filename) {
  try {
    if (typeof window === "undefined" || !window.URL || !window.Blob || !window.document) return false;
    const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch (_) {}
      try { URL.revokeObjectURL(url); } catch (_) {}
    }, 50);
    return true;
  } catch (e) { return false; }
}

export function exportDataJSON() {
  return mockResponse(async () => {
    const s = readSettings();
    if (!s.exportData) {
      throw new Error("知识数据导出开关已关闭，请先在设置中开启");
    }
    const snap = buildBackupSnapshot();
    const body = JSON.stringify(snap, null, 2);
    const ok = _downloadBlob(body, `xueyi-backup-${new Date().toISOString().slice(0,10)}.json`);
    return {
      format: "JSON",
      sizeBytes: body.length,
      downloaded: ok,
      filename: `xueyi-backup-${new Date().toISOString().slice(0,10)}.json`,
      note: ok ? "已开始下载" : "当前环境不支持自动下载，请手动复制 JSON 数据",
      raw: ok ? undefined : body,
    };
  }, 350);
}

/* 管理员调用（Mock）：解析并恢复备份 */
export function restoreBackupFromJSON(jsonStr) {
  return mockResponse(() => {
    let snap;
    try { snap = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr; }
    catch (e) { throw new Error("JSON 解析失败"); }
    const r = applyBackupSnapshot(snap);
    return { restoredCount: r.restored, ok: true };
  }, 350);
}

/* 账号同步偏好 & 进度实时同步偏好（开启时，定时把 localStorage 状态写入“云端镜像桶”） */
let _syncTimer = null;
export function _tickSyncCloudMirror() {
  const s = readSettings();
  if (!(s.syncAccount || s.syncProgress)) {
    if (_syncTimer) { clearInterval(_syncTimer); _syncTimer = null; }
    return;
  }
  if (_syncTimer) return;
  _syncTimer = setInterval(() => {
    try {
      const cur = readSettings();
      const snapshot = {};
      if (cur.syncAccount) snapshot.user = safeGet("xy-user-info", null);
      if (cur.syncProgress) {
        snapshot.records = safeGet("xy-api-report-records", null);
        snapshot.tasks = safeGet("xy-api-tasks", null);
        snapshot.achievements = safeGet("xy-ach-user-progress-v1", null);
        snapshot.events = safeGet("xy-ledger-events-v1", null);
        snapshot.lifetime = safeGet("xy-ledger-lifetime-v1", null);
      }
      safeSet("xy-cloud-mirror", { syncedAt: new Date().toISOString(), payload: snapshot });
    } catch (_) {}
  }, 60 * 1000);
}
/* 初始启动时检查一次 */
try { _tickSyncCloudMirror(); } catch (_) {}
