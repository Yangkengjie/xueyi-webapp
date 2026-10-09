<template>
  <div class="mine">
    <header class="mine__header">
      <div class="mine__avatar" @click="$router.push({ name: 'profile' })">
        <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="avatar" class="mine__avatar-img" />
        <svg v-else viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#9db8a6"
             stroke-width="1.6" stroke-linecap="round">
          <circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.5-3.6 4-5 7-5s5.5 1.4 7 5" />
        </svg>
      </div>
      <p class="mine__name">{{ user?.userName || '未登录' }}</p>
      <p class="mine__id">ID: {{ user?.userId || '--' }}</p>
      <button class="mine__edit" @click="$router.push({ name: 'profile' })">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
        编辑资料
      </button>
    </header>

    <AppCard title="我的学习者画像">
      <PersonaRadar :axes="personaData.axes" :values="personaData.values" />
      <div class="mine__row-btns">
        <button class="mine__row" @click="$router.push({ name: 'persona' })">
          查看学习者画像报告<span class="mine__go">查看详情</span>
        </button>
        <button class="mine__row" @click="$router.push({ name: 'persona', query: { tab: 'history' } })">
          查看画像测试历史<span class="mine__go">查看</span>
        </button>
        <button class="mine__row" @click="startRetestFlow">
          重新测试<span class="mine__go">重测</span>
        </button>
      </div>
    </AppCard>

    <AppCard title="学习报告与成就">
      <div class="report">
        <button class="report__card" @click="goJourney('daily')">
          <ReportIcon report-type="daily" size="md" variant="card" aria-label="今日报告" />
          <span class="report__label">今日报告</span>
          <span class="report__go"><BaseAppIcon type="goArrow" size="xs" aria-label="" />查看</span>
        </button>
        <button class="report__card" @click="goWeekly()">
          <ReportIcon report-type="weekly" size="md" variant="card" aria-label="本周报告" />
          <span class="report__label">本周报告</span>
          <span class="report__go"><BaseAppIcon type="goArrow" size="xs" aria-label="" />查看</span>
        </button>
        <button class="report__card" @click="goMonthly()">
          <ReportIcon report-type="monthly" size="md" variant="card" aria-label="本月报告" />
          <span class="report__label">本月报告</span>
          <span class="report__go"><BaseAppIcon type="goArrow" size="xs" aria-label="" />查看</span>
        </button>
      </div>

      <!-- 成就概览行 -->
      <div class="ach__summary">
        <div class="ach__summary-count">
          <span class="ach__summary-label">已获得成就</span>
          <span class="ach__summary-num">
            <strong>{{ achSummary.unlockedCount }}</strong>
            <span class="ach__summary-slash">/{{ achSummary.totalCount }}</span>
          </span>
        </div>
        <button type="button" class="ach__summary-btn" @click="goAllAchievements">
          查看全部 ›
        </button>
      </div>

      <!-- 即将达成 Top3 -->
      <div v-if="achUpcoming.length" class="ach__soon">
        <p class="ach__soon-title">即将达成</p>
        <div v-for="u in achUpcoming" :key="u.id" class="ach__soon-item">
          <div class="ach__soon-head">
            <AchievementIcon
              :achievement-id="u.id"
              :level="u.level"
              :unlocked="false"
              size="sm"
              inline
            />
            <span class="ach__soon-name">{{ u.name }}</span>
            <span class="ach__soon-pct">{{ u.progress || 0 }}%</span>
          </div>
          <div class="ach__soon-bar">
            <div class="ach__soon-bar-fill" :style="{ width: (u.progress || 0) + '%' }"></div>
          </div>
          <p class="text-caption ach__soon-desc">{{ u.description }}</p>
        </div>
      </div>

      <!-- 最近获得 -->
      <div v-if="achRecent.length" class="ach__recent">
        <p class="ach__recent-title">
          <BaseAppIcon type="recentFlame" size="sm" aria-label="" />
          最近获得
        </p>
        <div v-for="r in achRecent" :key="r.id" class="ach__recent-item">
          <AchievementIcon
            :achievement-id="r.id"
            :level="r.level"
            :unlocked="true"
            size="md"
            :aria-label="r.name"
          />
          <div class="ach__recent-main">
            <span class="ach__recent-name">{{ r.name }}</span>
            <span class="text-caption">{{ r.description }}</span>
          </div>
          <span v-if="r.unlockedAt" class="ach__recent-date">{{ r.unlockedAt }}</span>
        </div>
      </div>

      <button class="mine__row" @click="goJourney('all')">
        学习历程与成就<span class="mine__go">›</span>
      </button>
    </AppCard>

    <AppCard title="我的收藏">
      <SegmentedControl
        v-model="favTab"
        :options="[
          { label: '收藏评论', value: 'comment' },
          { label: '收藏AI回答', value: 'answer' },
        ]"
      />
      <div class="mine__fav-list" @click="$router.push({ name: 'favorites' })">
        <p v-for="f in favPreview" :key="f.id" class="mine__fav">
          <span class="mine__fav-text">{{ favTab === 'comment' ? f.text : f.title }}</span>
          <span class="text-caption">{{ f.date }}</span>
        </p>
      </div>
    </AppCard>

    <AppCard title="设置">
      <p class="text-caption mine__set-label">AI 回答风格设置（可多选，至少1项）</p>
      <button
        type="button"
        class="mine__style-summary"
        aria-expanded="showAnswerStyles"
        @click="showAnswerStyles = !showAnswerStyles"
      >
        <div class="mine__style-summary-left">
          <span class="mine__style-summary-text">{{ answerStylesSummary }}</span>
        </div>
        <span class="mine__style-toggle">{{ showAnswerStyles ? '收起' : '展开' }} {{ showAnswerStyles ? '▲' : '▾' }}</span>
      </button>
      <Transition name="expand">
        <div v-show="showAnswerStyles" class="mine__style-list">
          <div
            v-for="s in answerStyles"
            :key="s.key"
            class="mine__style-row"
            :title="s.note || s.desc"
          >
            <span class="mine__style-name">{{ s.name || s.label }}</span>
            <ToggleSwitch
              :model-value="!!settings?.answerStyles?.includes(s.key)"
              @update:model-value="() => toggleStyle(s.key)"
            />
          </div>
        </div>
      </Transition>
      <div class="mine__set-row" @click="showHomeCustom = true">
        <span>首页个性化</span>
        <span class="mine__set-val">{{ homeCustomLabel }} ▾</span>
      </div>
      <div class="mine__set-row">
        <span>学习提醒</span>
        <ToggleSwitch :model-value="!!settings?.remind" @update:model-value="(v) => updateSetting('remind', v)" />
      </div>
      <div class="mine__set-row">
        <span>消息推送</span>
        <ToggleSwitch :model-value="!!settings?.push" @update:model-value="(v) => updateSetting('push', v)" />
      </div>
      <div class="mine__set-row">
        <span>智能推荐每日学习任务</span>
        <ToggleSwitch :model-value="!!settings?.recommend" @update:model-value="(v) => updateSetting('recommend', v)" />
      </div>
      <button class="mine__set-row mine__set-row--btn" @click="showPermission = true">
        <span>权限设置</span>
        <span class="mine__set-val">点击查看 ›</span>
      </button>
      <button class="mine__row" @click="$router.push({ name: 'settings' })">
        全部设置<span class="mine__go">›</span>
      </button>
    </AppCard>

    <AppCard title="消息通知">
      <div v-if="!notices.length" class="empty-state">
        <p class="empty-state__text">暂无消息</p>
      </div>
      <div v-for="n in notices" :key="n.id" class="notice" :class="{ 'notice--unread': !n.read && !n.ignored }">
        <div class="notice__head">
          <p class="notice__title">{{ n.title }}</p>
          <p class="text-caption">{{ n.date }}</p>
        </div>
        <p class="notice__body">{{ n.body }}</p>
        <div class="notice__btns">
          <button class="notice__btn notice__btn--primary" @click="viewNotice(n)">查看详情</button>
          <button class="notice__btn" @click="ignoreNotice(n.id)">忽略</button>
          <button class="notice__btn" @click="showComments(n)">评论</button>
        </div>
      </div>
    </AppCard>

    <AppCard title="系统设置">
      <button class="mine__row" @click="scrollToNotice">消息通知<span class="mine__go">{{ unreadCount ? unreadCount + ' 条未读' : '查看' }}</span></button>
      <button class="mine__row" @click="$router.push({ name: 'support' })">咨询与反馈<span class="mine__go">前往</span></button>
      <button class="mine__row" @click="$router.push({ name: 'about' })">了解我们<span class="mine__go">查看</span></button>
      <button class="mine__row mine__row--danger" @click="logout">退出登录</button>
    </AppCard>

    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="noticeDetail" class="sheet-mask" @click.self="noticeDetail = null" @keydown.esc="noticeDetail = null">
          <div class="sheet sheet--detail" role="dialog" aria-modal="true">
            <button class="sheet__close" aria-label="关闭" @click="noticeDetail = null">×</button>
            <p class="sheet__date">{{ noticeDetail.title }}</p>
            <p class="text-caption sheet__sub">{{ noticeDetail.date }}</p>
            <p class="sheet__body">{{ noticeDetail.body }}</p>
            <div v-if="noticeComments.length" class="sheet__comment-list">
              <p class="sheet__comment-title">评论</p>
              <div v-for="c in noticeComments" :key="c.id" class="sheet__comment-item">
                <p class="sheet__comment-author">{{ c.author }} <span class="text-caption">{{ c.date }}</span></p>
                <p class="sheet__comment-content">{{ c.content }}</p>
              </div>
            </div>
            <div class="sheet__comment-input">
              <label class="visually-hidden" for="notice-comment">发表评论</label>
              <input id="notice-comment" v-model="commentDraft" class="sheet__input" placeholder="发表评论..." @keyup.enter="submitComment" />
              <button class="notice__btn notice__btn--primary" @click="submitComment" :disabled="submittingComment">
                {{ submittingComment ? '发送中...' : '发送' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="toast-fade">
        <div v-if="showHomeCustom" class="sheet-mask" @click.self="showHomeCustom = false" @keydown.esc="showHomeCustom = false">
          <div class="sheet" role="dialog" aria-modal="true">
            <button class="sheet__close" aria-label="关闭" @click="showHomeCustom = false">×</button>
            <p class="sheet__date">首页个性化</p>
            <p class="text-caption sheet__sub">默认首页展示内容周期</p>
            <div v-for="opt in homeCustomOptions" :key="opt.value"
                 class="radio-row"
                 :class="{ 'radio-row--on': settings?.homeCustom === opt.value }"
                 @click="selectHomeCustom(opt.value)">
              <span class="radio-row__name">{{ opt.label }}</span>
              <span class="text-caption">{{ opt.desc }}</span>
              <span class="radio-row__dot" :class="{ 'radio-row__dot--on': settings?.homeCustom === opt.value }"></span>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="toast-fade">
        <div v-if="showPermission" class="sheet-mask" @click.self="showPermission = false" @keydown.esc="showPermission = false">
          <div class="sheet" role="dialog" aria-modal="true">
            <button class="sheet__close" aria-label="关闭" @click="showPermission = false">×</button>
            <p class="sheet__date">权限设置</p>
            <p class="text-caption sheet__sub">管理应用所需的各类权限（演示）</p>
            <div class="perm-row">
              <div>
                <p class="perm-row__name">通知权限</p>
                <p class="text-caption">接收学习提醒与消息推送</p>
              </div>
              <ToggleSwitch :model-value="!!settings?.permissionNotification" @update:model-value="(v) => updateSetting('permissionNotification', v)" />
            </div>
            <div class="perm-row">
              <div>
                <p class="perm-row__name">相机权限</p>
                <p class="text-caption">拍题上传 / 扫码识别</p>
              </div>
              <ToggleSwitch :model-value="!!settings?.permissionCamera" @update:model-value="(v) => updateSetting('permissionCamera', v)" />
            </div>
            <div class="perm-row">
              <div>
                <p class="perm-row__name">相册权限</p>
                <p class="text-caption">更换头像 / 上传图片</p>
              </div>
              <ToggleSwitch :model-value="!!settings?.permissionPhoto" @update:model-value="(v) => updateSetting('permissionPhoto', v)" />
            </div>
            <div class="perm-row">
              <div>
                <p class="perm-row__name">位置权限</p>
                <p class="text-caption">推荐附近中医线下活动</p>
              </div>
              <ToggleSwitch :model-value="!!settings?.permissionLocation" @update:model-value="(v) => updateSetting('permissionLocation', v)" />
            </div>
            <div class="perm-row">
              <div>
                <p class="perm-row__name">麦克风权限</p>
                <p class="text-caption">语音提问 / 背诵练习</p>
              </div>
              <ToggleSwitch :model-value="!!settings?.permissionMicrophone" @update:model-value="(v) => updateSetting('permissionMicrophone', v)" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import AppCard from "../components/AppCard.vue";
import SegmentedControl from "../components/SegmentedControl.vue";
import ToggleSwitch from "../components/ToggleSwitch.vue";
import PersonaRadar from "../components/PersonaRadar.vue";
import AchievementIcon from "../components/AchievementIcon.vue";
import ReportIcon from "../components/ReportIcon.vue";
import BaseAppIcon from "../components/BaseAppIcon.vue";
import { useStore } from "../composables/useStore";
import { useAchievements } from "../composables/useAchievements";
import * as personaApi from "../api/persona";
import * as settingsApi from "../api/settings";
import * as achievementApi from "../api/achievement";
import * as noticeApi from "../api/notice";
import * as userApi from "../api/user";
import * as eventApi from "../api/events";
import { favComments, favAnswers } from "../mock/data";
import { toast, showLoading, hideLoading } from "../utils/feedback";

const router = useRouter();
const ach = useAchievements();
const { state: storeState, loadUser, loadSettings, loadAchievements } = useStore();

const favTab = ref("comment");
const favPreview = computed(() =>
  (favTab.value === "comment" ? favComments : favAnswers).slice(0, 3).map((f, i) => ({
    ...f,
    date: ["2026.08.15", "2026.08.12", "2026.08.10"][i] || "2026.08.01",
  }))
);

const user = computed(() => storeState.user);
const settings = computed(() => storeState.settings);
const answerStyles = computed(() => storeState.answerStyles || []);
const achievements = computed(() => storeState.achievements);

/* 成就：统一服务 */
const achSummary = computed(() => ({
  totalCount: ach.state.summary?.totalCount || 0,
  unlockedCount: ach.state.summary?.unlockedCount || 0,
  lockedCount: ach.state.summary?.lockedCount || 0,
  completionRate: ach.state.summary?.completionRate || 0,
}));
const achUpcoming = computed(() => (ach.state.upcoming || []).slice(0, 3));
const achRecent = computed(() => (ach.state.recentUnlocked || []).slice(0, 5));

const homeCustomOptions = [
  { value: "today", label: "今日", desc: "默认打开今日学习概览" },
  { value: "week",  label: "本周", desc: "默认打开本周学习进度" },
  { value: "month", label: "本月", desc: "默认打开本月学习统计" },
];
const homeCustomLabel = computed(() => {
  const map = { today: "今日", week: "本周", month: "本月" };
  return map[settings.value?.homeCustom] || "今日";
});

const showAnswerStyles = ref(false);
const showHomeCustom = ref(false);
const showPermission = ref(false);
const submittingComment = ref(false);

const answerStylesSummary = computed(() => {
  const all = answerStyles.value || [];
  const selected = settings.value?.answerStyles || [];
  if (!all.length) return `已选 ${selected.length} 种`;
  const names = all.filter((a) => selected.includes(a.key)).map((a) => a.name || a.label);
  const count = names.length;
  if (count === 0) return "未选择风格";
  if (count <= 3) return names.join("、");
  return names.slice(0, 3).join("、") + ` 等${count}种`;
});

const personaData = ref({
  axes: ["记忆型", "理解型", "应用型", "分析型"],
  values: [0.75, 0.9, 0.6, 0.8],
});

const notices = ref([]);
const unreadCount = ref(0);
const noticeDetail = ref(null);
const noticeComments = ref([]);
const commentDraft = ref("");

async function loadPersona() {
  const res = await personaApi.getPersona();
  if (res.code === 200) {
    personaData.value = { axes: res.data.axes, values: res.data.values };
  }
}

async function loadNotices() {
  const res = await noticeApi.getNotices();
  if (res.code === 200) {
    notices.value = res.data.list.filter((n) => !n.ignored);
    unreadCount.value = res.data.unreadCount;
  }
}

function toggleStyle(key) {
  if (!settings.value) return;
  const styles = [...(settings.value.answerStyles || [])];
  const i = styles.indexOf(key);
  if (i >= 0) {
    if (styles.length <= 1) {
      toast("至少保留一种回答风格");
      return;
    }
    styles.splice(i, 1);
  } else {
    styles.push(key);
  }
  updateSetting("answerStyles", styles);
}

async function updateSetting(key, value) {
  const res = await settingsApi.saveSettings({ [key]: value });
  if (res.code === 200 && storeState.settings) {
    if (key === "answerStyles") {
      storeState.settings.answerStyles = res.data.answerStyles;
    } else {
      storeState.settings[key] = value;
    }
  }
}

function selectHomeCustom(val) {
  updateSetting("homeCustom", val);
  showHomeCustom.value = false;
}

function startRetestFlow() {
  router.push({ name: "persona", query: { tab: "retest" } });
}

function goJourney(type) {
  router.push({ name: "journey", query: { tab: type } });
}
function goWeekly() {
  router.push({ name: "weeklyReport" });
}
function goMonthly() {
  router.push({ name: "monthlyReport" });
}
function goAllAchievements() {
  router.push({ name: "achievements" });
}

function scrollToNotice() {
  const cards = document.querySelectorAll(".mine .app-card");
  const el = cards[cards.length - 2];
  if (el) el.scrollIntoView({ behavior: "smooth" });
  else toast("已在上方「消息通知」中展示");
}

async function viewNotice(n) {
  showLoading("加载中");
  try {
    const res = await noticeApi.getNoticeDetail(n.id);
    if (res.code === 200) {
      noticeDetail.value = res.data;
      const idx = notices.value.findIndex((x) => x.id === n.id);
      if (idx >= 0) notices.value[idx].read = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
      loadComments(n.id);
    }
  } finally {
    hideLoading();
  }
}

async function showComments(n) {
  noticeDetail.value = n;
  await loadComments(n.id);
}

async function loadComments(id) {
  const res = await noticeApi.getNoticeComments(id);
  if (res.code === 200) noticeComments.value = res.data;
}

async function submitComment() {
  if (!commentDraft.value.trim() || !noticeDetail.value || submittingComment.value) return;
  submittingComment.value = true;
  try {
    const res = await noticeApi.addNoticeComment(noticeDetail.value.id, commentDraft.value.trim(), user.value?.userName || "用户");
    if (res.code === 200) {
      const newC = res.data;
      noticeComments.value.unshift(newC);
      commentDraft.value = "";
      toast("评论已发布");
      /* --- 真实事件：comment_publish + 局部 evaluate --- */
      try {
        if (typeof eventApi.recordEvent === "function") {
          await eventApi.recordEvent("comment_publish", {
            commentId: newC.id || newC._id || ("cmt-" + Date.now()),
            topicId: noticeDetail.value.id,
            likes: Number(newC.likes) || 0,
          });
        }
        await ach.trigger("comment:publish", { relatedMetrics: ["commentsTotal"] });
      } catch (_) {}
    } else {
      toast(res.msg || "评论失败");
    }
  } finally {
    submittingComment.value = false;
  }
}

async function ignoreNotice(id) {
  const res = await noticeApi.ignoreNotice(id);
  if (res.code === 200) {
    notices.value = notices.value.filter((n) => n.id !== id);
    toast("已忽略");
  }
}

async function logout() {
  showLoading("退出中");
  try {
    await userApi.logout();
    toast("已退出登录");
    setTimeout(() => router.push({ name: "login" }), 500);
  } finally {
    hideLoading();
  }
}

function onKeydown(e) {
  if (e.key === "Escape") {
    if (noticeDetail.value) noticeDetail.value = null;
    if (showHomeCustom.value) showHomeCustom.value = false;
    if (showPermission.value) showPermission.value = false;
  }
}

onMounted(async () => {
  window.addEventListener("keydown", onKeydown);
  await Promise.all([
    loadUser(true),
    loadSettings(true),
    loadAchievements(),
    loadPersona(),
    loadNotices(),
    ach.bootstrap(),
  ]);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.mine__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(24px + var(--safe-top)) 0 18px;
}
.mine__avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--color-primary-tint);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}
.mine__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mine__name {
  font-size: 18px;
  font-weight: 700;
  margin-top: 10px;
}
.mine__id {
  font-size: var(--font-size-caption);
  color: var(--color-text-caption);
  margin-top: 2px;
}
.mine__edit {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-divider);
  background: var(--color-card);
  border-radius: var(--radius-pill);
  padding: 5px 12px;
}

.mine__row-btns {
  margin-top: 10px;
}
.mine__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 2px;
  font-size: 14px;
  border-bottom: 1px solid var(--color-divider);
  text-align: left;
}
.mine__row:last-child {
  border-bottom: none;
}
.mine__row:active {
  opacity: 0.6;
}
.mine__row--danger {
  color: #c0392b;
  justify-content: flex-start;
}
.mine__go {
  font-size: var(--font-size-caption);
  color: var(--color-text-caption);
}

.report {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 4px;
}
.report__card {
  min-height: 87px;
  background: var(--color-primary-tint);
  border-radius: var(--radius-card);
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 6px;
}
.report__card:active {
  opacity: 0.75;
}
.report__label {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  font-weight: 600;
}
.report__go {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.mine__achieve {
  margin: 12px 0 2px;
}
.mine__achieve-head {
  display: flex;
  justify-content: space-between;
}
.mine__pct {
  font-weight: 600;
  font-size: 13px;
}
.mine__progress {
  height: 7px;
  border-radius: var(--radius-pill);
  background: var(--color-input-bg);
  margin-top: 6px;
  overflow: hidden;
}
.mine__progress-inner {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-pill);
}

.mine__fav-list {
  margin-top: 10px;
  cursor: pointer;
}
.mine__fav {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
  padding: 9px 2px;
  border-bottom: 1px solid var(--color-divider);
}
.mine__fav:last-child {
  border-bottom: none;
}
.mine__fav-text {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.mine__fav .text-caption {
  flex: 0 0 auto;
}

.mine__set-label {
  margin-bottom: 8px;
}
.mine__style-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 2px;
  border-bottom: 1px solid var(--color-divider);
  text-align: left;
  gap: 10px;
}
.mine__style-summary:active { background: var(--color-input-bg); }
.mine__style-summary-left {
  flex: 1;
  min-width: 0;
}
.mine__style-summary-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}
.mine__style-toggle {
  flex-shrink: 0;
  font-size: var(--font-size-caption);
  color: var(--color-primary);
}
.mine__style-list {
  margin-bottom: 4px;
  border-bottom: 1px solid var(--color-divider);
  overflow: hidden;
}
.mine__style-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 2px;
  font-size: 14px;
  border-top: 1px solid var(--color-divider);
}
.mine__style-row:first-child {
  border-top: none;
}
.mine__style-name {
  font-size: 14px;
}
.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.28s ease, opacity 0.2s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 800px;
  opacity: 1;
}
.mine__set-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 11px 2px;
  font-size: 14px;
  border-bottom: 1px solid var(--color-divider);
}
.mine__set-row--btn:active {
  opacity: 0.6;
}
.mine__set-val {
  font-size: var(--font-size-caption);
  color: var(--color-text-caption);
}

.notice {
  background: var(--color-input-bg);
  border-radius: var(--radius-card);
  padding: 14px;
  margin-bottom: 10px;
}
.notice:last-child {
  margin-bottom: 0;
}
.notice--unread {
  background: var(--color-primary-tint);
  border-left: 3px solid var(--color-primary);
}
.notice__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.notice__title {
  font-weight: 600;
  font-size: 14px;
}
.notice__body {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-top: 6px;
}
.notice__btns {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.notice__btn {
  font-size: 12px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  background: var(--color-card);
  color: var(--color-text-secondary);
}
.notice__btn--primary {
  background: var(--color-primary);
  color: #fff;
}

.empty-state {
  padding: 16px 0;
  text-align: center;
}
.empty-state__text {
  font-size: 13px;
  color: var(--color-text-caption);
}

.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sheet {
  width: 100%;
  max-width: var(--page-width);
  max-height: 80vh;
  overflow-y: auto;
  background: var(--color-card);
  border-radius: 16px 16px 0 0;
  padding: 20px 16px calc(20px + var(--safe-bottom));
}
.sheet__date {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 4px;
}
.sheet__sub {
  margin-bottom: 12px;
}
.sheet__body {
  font-size: 14px;
  line-height: 1.8;
  color: var(--color-text-secondary);
}
.sheet__comment-list {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--color-divider);
}
.sheet__comment-title {
  font-weight: 600;
  margin-bottom: 10px;
}
.sheet__comment-item {
  padding: 8px 0;
}
.sheet__comment-author {
  font-size: 13px;
  font-weight: 600;
}
.sheet__comment-content {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-top: 3px;
}
.sheet__comment-input {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.sheet__comment-input .sheet__input {
  flex: 1;
  border-bottom: 1px solid var(--color-divider);
  padding: 8px 4px;
}
.sheet__close {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 26px;
  line-height: 1;
  padding: 4px 10px;
  color: var(--color-text-caption);
  border-radius: 50%;
}
.sheet__close:active {
  opacity: 0.6;
}
.sheet {
  position: relative;
}
.radio-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 4px 12px;
  align-items: center;
  padding: 12px 4px;
  border-bottom: 1px solid var(--color-divider);
  cursor: pointer;
}
.radio-row:last-child {
  border-bottom: none;
}
.radio-row:active {
  background: var(--color-input-bg);
}
.radio-row--on .radio-row__name {
  color: var(--color-primary);
  font-weight: 600;
}
.radio-row__name {
  font-size: 14px;
  grid-row: 1;
  grid-column: 1;
}
.radio-row .text-caption {
  grid-row: 2;
  grid-column: 1;
}
.radio-row__dot {
  grid-row: 1 / span 2;
  grid-column: 2;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-divider);
  border-radius: 50%;
  position: relative;
}
.radio-row__dot--on {
  border-color: var(--color-primary);
}
.radio-row__dot--on::after {
  content: '';
  position: absolute;
  inset: 3px;
  background: var(--color-primary);
  border-radius: 50%;
}
.perm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid var(--color-divider);
}
.perm-row:last-child {
  border-bottom: none;
}
.perm-row__name {
  font-size: 14px;
  font-weight: 500;
}
.visually-hidden {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 360px) {
  .report {
    gap: 8px;
  }
  .report__card {
    padding: 10px;
  }
  .ach__summary-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
  .ach__cat-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ========== 学习报告与成就（新版） ========== */
.ach__summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0 2px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 100%);
  border-radius: var(--radius-card);
  border: 1px solid #c8e6c9;
}
.ach__summary-count {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ach__summary-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.ach__summary-num {
  font-size: 18px;
  font-weight: 800;
  color: #1b5e20;
  line-height: 1.1;
}
.ach__summary-num strong {
  font-size: 26px;
  font-weight: 900;
  color: #1f5c38;
}
.ach__summary-slash {
  font-size: 16px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
.ach__summary-btn {
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(31, 92, 56, 0.22);
  flex-shrink: 0;
}
.ach__summary-btn:active { opacity: 0.85; }

/* 即将达成 */
.ach__soon {
  margin: 14px 0 2px;
}
.ach__soon-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}
.ach__soon-item {
  padding: 10px 12px;
  background: var(--color-input-bg);
  border-radius: 12px;
  margin-bottom: 8px;
}
.ach__soon-item:last-child { margin-bottom: 0; }
.ach__soon-head {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}
.ach__soon-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-secondary);
  flex: 1;
  min-width: 0;
}
.ach__soon-pct {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 700;
  flex-shrink: 0;
}
.ach__soon-bar {
  width: 100%;
  height: 5px;
  background: #e8f0e9;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 5px;
}
.ach__soon-bar-fill {
  height: 100%;
  background: var(--color-primary);
  opacity: 0.85;
  border-radius: 999px;
}
.ach__soon-desc {
  line-height: 1.5;
}

/* 最近获得 */
.ach__recent {
  margin: 14px 0 2px;
}
.ach__recent-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #d66c2b;
}
.ach__recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: linear-gradient(90deg, #f3f8ed 0%, transparent 60%);
  border-radius: 12px;
  margin-bottom: 6px;
  border-left: 3px solid #8bba92;
}
.ach__recent-item:last-child { margin-bottom: 0; }
.ach__recent-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.ach__recent-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  word-break: break-word;
}
.ach__recent-date {
  font-size: 11px;
  color: var(--color-primary);
  font-weight: 600;
  flex-shrink: 0;
}
</style>
