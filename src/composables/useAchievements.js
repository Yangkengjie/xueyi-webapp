/* ============================================================
 * useAchievements — 成就状态 + 事件驱动判定 + 解锁弹层队列
 * 本轮严格行为（避免频繁打扰）：
 *  1) 建立基线 baselineUnlockedIds（初始化 / 刷新 / 登录后首次加载）
 *     凡在基线中的成就视为"历史已解锁"，本次触发返回也绝不弹窗
 *     且绝不回放旧"未读"队列，彻底禁止启动/刷新/登录时重复弹
 *  2) trigger 返回 newlyUnlocked 仅做 diff：基线之外、且会话期 shownOnceThisSession 之外的 ID
 *     → 本次用户动作真正 locked → unlocked 的才入提示队列
 *  3) 同一次触发解锁 N 项：合并为 1 条合并提示（isMulti=true，count=N，primary=第一项）
 *     不再逐个连续轰炸
 *  4) 会话期最多主动弹 1 次：hasShownSessionToastOnce === true 之后仍继续记录成就，但不主动弹窗
 *  5) 用户设置 achievementNotify=false：仍正常解锁、保存、成就中心显示，只是不弹窗
 *     重新打开此开关不补弹之前解锁的旧成就
 * ============================================================ */
import { reactive, ref, computed } from "vue";
import * as achApi from "../api/achievement.js";
import * as settingsApi from "../api/settings.js";

const STATE_KEY_UNSEEN = "xy-ach-shown-toast-ids-v1"; // 永久记住"已经弹过窗口"的成就 ID，刷新后不重复

/* 全局共享状态（跨页面、但单实例） */
const state = reactive({
  loaded: false,
  loading: false,
  error: null,
  summary: {
    totalCount: 0, unlockedCount: 0, lockedCount: 0,
    completionRate: 0, categoryCount: {},
  },
  list: [],              // 全成就（未 hidden 的）
  upcoming: [],          // 即将达成 Top3
  recentUnlocked: [],    // 最近解锁 Top5
  metrics: {},           // 聚合的 metrics 快照
});

const baselineUnlockedIds = new Set();

/* 会话期标记：本浏览器会话最多主动弹 1 次提示（单条或合并） */
let hasShownSessionToastOnce = false;

/* 通知队列：仅"本次新解锁、去重、合并"后的项，AchievementToast 消费 */
const toastQueue = ref([]);
const toastDismissed = ref(0);

/* ---------------- 小工具 ---------------- */
function _safeGetSet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) { return new Set(); }
}
function _safeWriteSet(key, setObj) {
  try { localStorage.setItem(key, JSON.stringify(Array.from(setObj))); } catch (e) {}
}
function userPrefNotify() {
  try {
    const s = settingsApi && typeof settingsApi.getSettings === "function"
      ? null
      : null;
  } catch (_) {}
  // 直接读存储，避免 mockResponse Promise：
  try {
    const raw = localStorage.getItem("xy-api-settings");
    if (!raw) return true;
    const obj = JSON.parse(raw) || {};
    return typeof obj.achievementNotify === "boolean" ? obj.achievementNotify : true;
  } catch (e) { return true; }
}
function markToastShownPermanently(ids) {
  const setObj = _safeGetSet(STATE_KEY_UNSEEN);
  (ids || []).forEach((id) => id && setObj.add(id));
  _safeWriteSet(STATE_KEY_UNSEEN, setObj);
}

let firstLoadPromise = null;

export function useAchievements() {

  async function ensureLoaded(force = false) {
    if (state.loading) return state;
    if (state.loaded && !force) return state;
    state.loading = true;
    state.error = null;
    try {
      const res = await achApi.getUserAchievementProgress("all");
      if (res?.code === 200) {
        const d = res.data || {};
        state.list             = Array.isArray(d.list) ? d.list.filter((a) => !a.hidden) : [];
        state.summary          = { ...state.summary, ...(d.summary || {}) };
        state.upcoming         = Array.isArray(d.upcoming) ? d.upcoming : [];
        state.recentUnlocked   = Array.isArray(d.recentUnlocked) ? d.recentUnlocked : [];
        state.metrics          = d.metrics || state.metrics;
        state.loaded           = true;

        // 建立当前解锁基线，初始化过程不弹窗
        state.list.forEach((a) => {
          if (a && a.unlocked && a.id) baselineUnlockedIds.add(a.id);
        });
      } else {
        state.error = res?.msg || "加载失败";
      }
    } catch (e) {
      state.error = e?.message || "网络异常，稍后重试";
    } finally { state.loading = false; }
    return state;
  }

  /* 初始化：只加载 summary/list，不读取旧未读队列（彻底禁止历史成就登录/刷新时重弹） */
  async function bootstrap() {
    if (firstLoadPromise) return firstLoadPromise;
    firstLoadPromise = (async () => {
      await ensureLoaded();
      // 基线已在 ensureLoaded 内构建；这里故意不处理旧通知
    })();
    return firstLoadPromise;
  }

  /* 触发一次事件 → 重算相关成就 → 有 真正 的新解锁 → 合并入队列最多 1 项 */
  async function trigger(eventName, payload) {
    const res = await achApi.evaluateAchievements(eventName, payload || {});
    if (res?.code === 200 && Array.isArray(res.data?.newlyUnlocked)) {
      const permanentlyShown = _safeGetSet(STATE_KEY_UNSEEN);
      const candidates = res.data.newlyUnlocked
        .filter((a) => a && !a.hidden && a.id)
        // 1) 必须是"基线外"（防止刷新时把已经解锁的当成新解锁）
        .filter((a) => !baselineUnlockedIds.has(a.id))
        // 2) 必须是"从未弹过提示"的
        .filter((a) => !permanentlyShown.has(a.id));

      if (candidates.length) {
        // 写入基线（避免本次会话再次把这些当新），且写永久展示过 ID
        markToastShownPermanently(candidates.map((a) => a.id));
        candidates.forEach((a) => a.id && baselineUnlockedIds.add(a.id));
        // 有解锁 → 刷新 summary/upcoming（成就中心显示用）
        ensureLoaded(true);

        // 展示规则：
        const allowPopup = userPrefNotify() && !hasShownSessionToastOnce;
        if (allowPopup) {
          const list = candidates.map((a) => ({
            id: a.id, name: a.name, desc: a.description, unlockedAt: a.unlockedAt,
          }));
          if (list.length === 1) {
            enqueueToast({ isMulti: false, count: 1, primary: list[0], ids: list.map((x) => x.id) });
          } else {
            enqueueToast({
              isMulti: true,
              count: list.length,
              primary: list[0],
              ids: list.map((x) => x.id),
              restNames: list.slice(1).map((x) => x.name),
            });
          }
          hasShownSessionToastOnce = true;
        }
      }
    }
    return res;
  }

  function enqueueToast(item) {
    if (!item || !item.ids || !item.ids.length) return;
    if (toastQueue.value.length) return; // 本会话最多一条展示，并且避免堆叠
    toastQueue.value.push(item);
  }

  const currentToast = computed(() => toastQueue.value[0] || null);

  function dismissCurrent({ markedRead = true } = {}) {
    const cur = toastQueue.value.shift();
    if (cur && markedRead) {
      try { achApi.markAchievementNoticeRead(cur.primary && cur.primary.id).catch(() => {}); } catch (_) {}
      if (cur.ids && cur.ids.length) markToastShownPermanently(cur.ids);
    }
    toastDismissed.value++;
  }

  function markCurrentSeen() {
    const cur = currentToast.value;
    if (cur) {
      try { achApi.markAchievementNoticeRead(cur.primary && cur.primary.id).catch(() => {}); } catch (_) {}
      if (cur.ids && cur.ids.length) markToastShownPermanently(cur.ids);
      toastQueue.value.shift();
      toastDismissed.value++;
    }
  }

  async function forceReload() {
    return ensureLoaded(true);
  }

  function byCategory(catKey = "all") {
    if (!state.list?.length) return [];
    const base = catKey === "all"
      ? state.list
      : state.list.filter((a) => a.category === catKey);
    return sortAchievements(base);
  }

  function sortAchievements(arr) {
    const unlocked = arr.filter((a) => a.unlocked).sort((a, b) =>
      (b.unlockedAt || "").localeCompare(a.unlockedAt || "")
    );
    const locked = arr.filter((a) => !a.unlocked).sort((a, b) => {
      if (b.progress !== a.progress) return b.progress - a.progress;
      return (b.current || 0) - (a.current || 0);
    });
    return [...unlocked, ...locked];
  }

  return {
    state,
    load: ensureLoaded,
    bootstrap,
    trigger,
    /* 队列 */
    toastQueue,
    currentToast,
    dismissCurrent,
    markCurrentSeen,
    /* 查询 */
    byCategory,
    forceReload,
  };
}
