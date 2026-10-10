<template>
  <div class="tutor" :class="tab === 'qa' ? 'is-qa' : 'is-plan'">
    <div class="tutor__seg">
      <SegmentedControl
        v-model="tab"
        :options="[
          { label: '答疑', value: 'qa' },
          { label: '规划', value: 'plan' },
        ]"
      />
    </div>

    <div class="tutor__row">
      <button class="tutor__link" @click="router.push({ name: 'history' })">历史记录</button>
      <button class="tutor__link" :disabled="sending" @click="newChat">新对话</button>
    </div>

    <div v-if="sessionQuestion" class="tutor__session">
      <span class="tutor__session-label">本次{{ tab === 'qa' ? '答疑' : '规划' }}</span>
      <p>{{ sessionQuestion }}</p>
    </div>

    <div class="tutor__empty">
      <div class="tutor__logo" aria-hidden="true">
        <Brain v-if="tab === 'qa'" :size="38" :stroke-width="1.8" color="#266636" />
        <ClipboardMinus v-else :size="38" :stroke-width="1.8" color="#266636" />
      </div>
      <p class="tutor__name">{{ tab === "qa" ? "中医 AI 学伴" : "个性化学习规划" }}</p>
      <p class="tutor__hint">
        {{ tab === "qa" ? "请问有什么可以帮您？在下方勾选输出方式并输入提问，引擎将自动为您结构化升级。" : "告诉我你的备考目标，我来帮你规划" }}
      </p>

      <!-- 答疑：高频痛点快捷问题 -->
      <div v-if="tab === 'qa'" class="tutor__presets" aria-label="高频痛点快捷问题">
        <button
          v-for="p in recommendList"
          :key="p.title"
          type="button"
          class="preset-card"
          @click="applyPreset(p)"
        >
          <span class="preset-card__tag">{{ p.tag }}</span>
          <span class="preset-card__title">{{ p.title }}</span>
          <span class="preset-card__q">{{ p.question }}</span>
        </button>
      </div>

      <!-- 规划：备考目标推荐卡片 -->
      <div v-else class="tutor__presets" aria-label="学习规划快捷目标">
        <button
          v-for="p in PLAN_PRESETS"
          :key="p.title"
          type="button"
          class="preset-card"
          @click="applyPreset(p)"
        >
          <span class="preset-card__tag">{{ p.tag }}</span>
          <span class="preset-card__title">{{ p.title }}</span>
          <span class="preset-card__q">{{ p.question }}</span>
        </button>
      </div>
    </div>

    <!-- 输出模式选择：仅答疑 tab，置于输入框上方 -->
    <div
      class="tutor__modes"
      role="group"
      aria-label="回答输出模式选择"
    >
      <div class="tutor__modes-hd">
        <span class="tutor__modes-title">选择输出方式（支持多选）</span>
        <span class="tutor__modes-tip">已选 {{ selectedModes.length }} 项</span>
      </div>
      <div class="tutor__modes-list">
        <button
          v-for="mode in MODE_LABELS"
          :key="mode"
          type="button"
          class="tutor__chip"
          :class="{ 'is-on': selectedModes.includes(mode) }"
          :aria-pressed="selectedModes.includes(mode)"
          @click="toggleMode(mode)"
        >
          {{ mode }}
        </button>
      </div>
    </div>

    <p v-if="sending" class="tutor__status">正在生成{{ tab === 'qa' ? '回答' : '规划' }}……</p>

    <ChatInputBar
      ref="inputBarRef"
      :key="inputKey"
      :placeholder="tab === 'qa' ? '输入问题，如：为什么阴虚会五心潮热？' : '输入目标，如：2026 考研中综 8 个月复习计划'"
      @send="onSend"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Brain, ClipboardMinus } from "@lucide/vue";
import SegmentedControl from "../components/SegmentedControl.vue";
import ChatInputBar from "../components/ChatInputBar.vue";
import { showLoading, hideLoading, toast } from "../utils/feedback";
import { apiUrl } from "../utils/apiBase";
import {
  addMessage,
  createConversation,
  getActiveAnswerStyles,
  getConversations,
  saveConversation,
} from "../utils/chatStore";
import {
  MODE_LABELS,
  DEFAULT_QA_MODE_LABELS,
  DEFAULT_PLAN_MODE_LABELS,
  keysToModeLabels,
  MODE_LABEL_TO_KEY,
  enhanceAndAnswer,
  enhanceAndPlan,
  engineSectionsToAnswerSampleSections,
  prewarmEngine,
} from "../api/promptEngine";
import { PRESET_QUESTIONS } from "../data/tcmPresetData";
import { profileRows } from "../mock/data";
import { getStudyStatus } from "../api/study";

const router = useRouter();
const route = useRoute();
/* 支持小精灵快捷入口 ?tab=plan 直达规划 */
const tab = ref(route.query.tab === "plan" ? "plan" : "qa");
const sending = ref(false);
const sessionQuestion = ref("");
const inputKey = ref(0);
const inputBarRef = ref(null);

/* 个性化推荐问题：初始用写死的预设，进页面后用历史问题调引擎刷新 */
const recommendList = ref(PRESET_QUESTIONS);

onMounted(async () => {
  /* 进页面即提前唤醒可能休眠的免费容器，用户打字期间完成冷启动 */
  try { prewarmEngine(); } catch (_) {}
  try {
    const convs = getConversations();
    const history = convs.slice(0, 12).map((c) => c.question).filter(Boolean);
    if (!history.length) return;
    const resp = await fetch(apiUrl("/api/recommend-questions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ historyQuestions: history, studentGrade: "" }),
    });
    if (!resp.ok) return;
    const data = await resp.json();
    if (Array.isArray(data?.questions) && data.questions.length) {
      recommendList.value = data.questions;
    }
  } catch (_) { /* 推荐失败保留默认 */ }
});

/* 从本地资料与学习状态拼出真实用户画像，传给引擎作为"背景"依据
   优先读 xy-api-user（"我的"页可编辑），回退 mock/profileRows */
function readRealProfile() {
  try {
    const raw = localStorage.getItem("xy-api-user");
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}
function buildUserContext() {
  const real = readRealProfile() || {};
  const row = (key) => (profileRows.find((r) => r.key === key) || {}).value || "";
  const grade = real.grade || row("grade") || "大一";
  const major = real.major || row("major") || "中医学5年制";
  const persona = real.persona || row("persona") || "体系构建师";
  const school = real.school || "";
  const st = (() => { try { return getStudyStatus() || {}; } catch { return {}; } })();
  const learn = st.learningDays ? `累计学习${st.learningDays}天` : "";
  const hours = st.totalHours ? `累计${st.totalHours}小时` : "";
  const streak = st.streakDays ? `连续打卡${st.streakDays}天` : "";
  const studyBits = [learn, hours, streak].filter(Boolean).join("、");
  return {
    studentGrade: `${grade}·${major}${school ? `·${school}` : ""}`,
    currentCourse: "中医基础理论 / 方剂学",
    userPreference: persona,
    studyStats: {
      learningDays: st.learningDays || 0,
      totalHours: st.totalHours || 0,
      streakDays: st.streakDays || 0,
      todayMinutes: st.todayMinutes || 0,
      summary: studyBits,
    },
  };
}

/* 9 种模式默认勾选：答疑 4 项 / 规划 3 项（与引擎 DeductionTab 对齐）
   进页面时优先读设置页存的 xy-api-settings.answerStyles，读不到才用默认 */
function initModes() {
  try {
    const raw = localStorage.getItem("xy-api-settings");
    if (raw) {
      const s = JSON.parse(raw);
      const labels = keysToModeLabels(Array.isArray(s.answerStyles) ? s.answerStyles : [], "qa");
      if (labels.length) return labels;
    }
  } catch (_) {}
  return DEFAULT_QA_MODE_LABELS.slice();
}
const selectedModes = ref(initModes());

/* 规划 tab 的备考目标推荐卡片 */
const PLAN_PRESETS = [
  {
    title: "2026 考研中综 8 个月",
    question: "制定 2026 年考研中医综合 8 个月复习计划，基础一般，目标 240+",
    tag: "考研规划 · 长期",
  },
  {
    title: "方剂学方歌速背 14 天",
    question: "帮我做一份 14 天方剂学方歌速背计划，每天 30 分钟，覆盖解表剂到理气剂",
    tag: "专项突破 · 背诵",
  },
  {
    title: "期末冲刺 7 天中基",
    question: "中医基础理论期末 7 天冲刺计划，重点藏象、病机、防治原则",
    tag: "期末冲刺 · 7 天",
  },
];

/* 切换 tab 时重置为对应默认模式 */
const resetModes = () => {
  selectedModes.value = (tab.value === "plan" ? DEFAULT_PLAN_MODE_LABELS : DEFAULT_QA_MODE_LABELS).slice();
};
watch(tab, resetModes);

/* 模式多选：至少保留 1 项 */
function toggleMode(mode) {
  const list = selectedModes.value.slice();
  const idx = list.indexOf(mode);
  if (idx >= 0) {
    if (list.length <= 1) {
      toast("至少保留 1 种输出模式");
      return;
    }
    list.splice(idx, 1);
  } else {
    list.push(mode);
  }
  selectedModes.value = list;
}

/* 把当前勾选模式同步到设置页的 xy-api-settings.answerStyles */
const persistStyles = () => {
  try {
    const keys = selectedModes.value.map((m) => MODE_LABEL_TO_KEY[m]).filter(Boolean);
    const raw = localStorage.getItem("xy-api-settings");
    const s = raw ? JSON.parse(raw) : {};
    s.answerStyles = keys.length ? keys : ["direct"];
    localStorage.setItem("xy-api-settings", JSON.stringify(s));
  } catch (_) {}
};

/* 点选快捷卡片：把问题填入输入框 */
const applyPreset = (p) => {
  if (inputBarRef.value && typeof inputBarRef.value.setText === "function") {
    inputBarRef.value.setText(p.question);
  }
};

const clearDraft = () => {
  sessionQuestion.value = "";
  inputKey.value += 1;
};

watch(() => router.currentRoute.value.query.new, (value) => {
  if (value === "1") clearDraft();
}, { immediate: true });

const onSend = async ({ text, images }) => {
  if (sending.value) return;

  const question = text || (images.length ? "图片提问" : "");
  if (!question) return;

  sessionQuestion.value = question;
  sending.value = true;
  persistStyles();

  const conversation = createConversation({ question, mode: tab.value });
  addMessage(conversation, "user", question, { images });
  const activeStyles = getActiveAnswerStyles();
  /* 标记"待引擎生成"，携带问题上下文；AnswerView 检测到后自动调引擎并显示思考气泡 */
  conversation.pendingAnswer = true;
  conversation.pendingQuestion = question;
  conversation.pendingImages = images;
  conversation.pendingModes = selectedModes.value.slice();
  conversation.pendingMode = tab.value;
  saveConversation(conversation);

  /* 立即跳转回答页，由 AnswerView 接管生成（体验与追问一致：用户消息先上去 + 思考气泡） */
  router.push({ name: "answer", params: { id: conversation.id } });
};

const newChat = () => {
  if (sending.value) return;
  clearDraft();
  resetModes();
  toast("已新建对话");
};
</script>

<style scoped>
.tutor {
  --chat-input-bottom: calc(var(--tabbar-height) + var(--safe-bottom));
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.tutor__seg { padding: calc(8px + var(--safe-top)) var(--page-padding) 0; }
.tutor__row { display: flex; justify-content: space-between; padding: 14px var(--page-padding) 0; }
.tutor__link { font-size: var(--font-size-caption); color: var(--color-text-secondary); padding: 4px 0; }
.tutor__link:disabled { opacity: .45; }

/* 输出模式选择区（答疑 tab，置于输入框上方） */
.tutor__modes {
  margin: 0 var(--page-padding) calc(var(--tabbar-height) + var(--safe-bottom) + 12px);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  padding: 12px 12px 8px;
}
.tutor__modes-hd {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
  padding: 0 4px;
}
.tutor__modes-title { color: var(--color-text-primary); font-size: 13px; font-weight: 600; }
.tutor__modes-tip { color: var(--color-text-caption); font-size: 11px; }
.tutor__modes-list { display: flex; flex-wrap: wrap; gap: 6px 8px; }
.tutor__chip {
  flex: none;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.3;
  transition: all .15s;
}
.tutor__chip.is-on {
  border-color: var(--color-primary);
  background: var(--color-primary-tint);
  color: var(--color-primary);
  font-weight: 600;
}

.tutor__session { margin: 14px var(--page-padding) 0; padding: 10px 12px; border-radius: var(--radius-sm); background: var(--color-primary-tint); }
.tutor__session-label { font-size: var(--font-size-caption); color: var(--color-text-secondary); }
.tutor__session p { margin-top: 4px; font-size: 14px; line-height: 1.5; }

.tutor__empty {
  flex: 0 0 auto;   /* 高度随内容，推荐卡片后紧跟输出方式卡片，不撑出大段留白 */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px var(--page-padding);
}
.tutor__logo {
  width: 64px; height: 64px;
  border-radius: 18px;
  background: #e8f1ec;
  display: flex; align-items: center; justify-content: center;
  margin: 10px 0 14px;
  box-shadow: 0 4px 14px rgba(38, 102, 54, 0.12);
  overflow: hidden;
}
.tutor__logo-img { width: 100%; height: 100%; object-fit: cover; }
.tutor__name { font-size: var(--font-size-title); color: var(--color-text-primary); font-weight: 600; }
.tutor__hint { color: var(--color-text-caption); margin-top: 6px; font-size: 13px; text-align: center; line-height: 1.7; }

/* 快捷问题 / 推荐卡片 */
.tutor__presets {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  margin-top: 22px;
}
.preset-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  text-align: left;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  padding: 12px 12px 10px;
  transition: border-color .15s, transform .15s;
}
.preset-card:active { border-color: var(--color-primary); transform: translateY(1px); }
.preset-card__tag {
  align-self: flex-start;
  display: inline-block;
  color: var(--color-primary);
  background: var(--color-primary-tint);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  line-height: 1.4;
}
.preset-card__title { color: var(--color-text-primary); font-size: 14px; font-weight: 600; line-height: 1.35; }
.preset-card__q {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.tutor__status {
  position: fixed;
  left: 50%;
  bottom: calc(var(--tabbar-height) + var(--safe-bottom) + 72px);
  transform: translateX(-50%);
  padding: 7px 12px;
  border-radius: var(--radius-pill);
  background: var(--color-text);
  color: #fff;
  font-size: var(--font-size-caption);
  z-index: 110;
}

@media (width <= 340px) {
  .tutor__presets { grid-template-columns: 1fr; }
  .tutor__chip { padding: 5px 8px; font-size: 11px; }
  .tutor__modes-tip { display: none; }
}
@media (width >= 420px) {
  .tutor__modes { padding: 14px 14px 10px; }
  .preset-card { padding: 14px; }
}
</style>
