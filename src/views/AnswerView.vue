<template>
  <div class="answer">
    <NavBar :title="question">
      <template #right>
        <button class="answer__new-chat" @click="startNewChat">新对话</button>
      </template>
    </NavBar>

    <div class="answer__body">
      <template v-for="(message, index) in messages" :key="message.id || index">
        <div v-if="message.role === 'user'" class="answer__question">
          <span class="answer__q-tag">学生提问</span>
          <p class="answer__q-text">{{ message.content }}</p>
          <div v-if="message.images?.length" class="answer__q-imgs">
            <img v-for="(img, i) in message.images" :key="i" :src="img" alt="提问图片" />
          </div>
        </div>

        <template v-else-if="message.role === 'assistant'">
          <div
            v-if="getAnalysis(message.content)"
            class="analysis-card"
          >
            <div class="analysis-card__head">
              <span class="analysis-card__title">问题理解与增强分析</span>
              <span class="analysis-card__badge">已结构化拆解</span>
            </div>
            <div class="analysis-card__rows">
              <div class="analysis-row" v-if="getAnalysis(message.content).background">
                <span class="analysis-row__k">背景</span>
                <span class="analysis-row__v">{{ getAnalysis(message.content).background }}</span>
              </div>
              <div class="analysis-row" v-if="getAnalysis(message.content).topic">
                <span class="analysis-row__k">主题</span>
                <span class="analysis-row__v">{{ getAnalysis(message.content).topic }}</span>
              </div>
              <div class="analysis-row" v-if="getAnalysis(message.content).intent">
                <span class="analysis-row__k">意图</span>
                <span class="analysis-row__v">{{ getAnalysis(message.content).intent }}</span>
              </div>
              <div class="analysis-row" v-if="(getAnalysis(message.content).outputModes || []).length">
                <span class="analysis-row__k">输出方式</span>
                <span class="analysis-row__v">{{ (getAnalysis(message.content).outputModes || []).join(' / ') }}</span>
              </div>
            </div>
            <div
              v-if="(getAnalysis(message.content).structuredPrompt || []).length"
              class="analysis-card__sp"
            >
              <p class="analysis-card__sp-title">增强优化后的结构化提问：</p>
              <p
                v-for="(q, qi) in getAnalysis(message.content).structuredPrompt"
                :key="qi"
                class="analysis-card__sp-item"
              >{{ q }}</p>
            </div>
          </div>

          <!-- 效果对比切换器（仅引擎消息显示） -->
          <div
            v-if="getAbComparison(message.content)"
            class="compare-tabs"
            role="tablist"
          >
            <button
              class="compare-tabs__btn"
              :class="{ 'is-on': compareTab === 'enhanced' }"
              @click="compareTab = 'enhanced'"
            >增强解答</button>
            <button
              class="compare-tabs__btn"
              :class="{ 'is-on': compareTab === 'original' }"
              @click="compareTab = 'original'"
            >原始直接回答</button>
            <button
              class="compare-tabs__btn"
              :class="{ 'is-on': compareTab === 'compare' }"
              @click="compareTab = 'compare'"
            >对照评测</button>
          </div>

          <!-- 增强解答视图：学伴问候 + 分模式 sections -->
          <template v-if="compareTab === 'enhanced' || !getAbComparison(message.content)">
            <div v-if="getContentGreeting(message.content)" class="greet-block">
              <div class="greet-block__head">
                <span class="greet-block__avatar">学伴</span>
                <span class="greet-block__name">中医智能学伴</span>
              </div>
              <p class="greet-block__text">{{ getContentGreeting(message.content) }}</p>
            </div>
            <div class="answer__content" :class="[textStyle, { 'answer__content--plan': mode === 'plan' }]"
              @touchstart="pressStart" @touchend="pressEnd"
              @mousedown="pressStart" @mouseup="pressEnd" @contextmenu.prevent>
              <template v-for="(sec, i) in normalizeContent(message.content).sections" :key="i">
                <div class="sec__block">
                  <h3 class="sec__h">
                    <span>{{ sec.heading }}</span>
                    <span v-if="sec.mode" class="sec__mode-tag">{{ sec.mode }}</span>
                  </h3>
                  <div class="sec__content">
                    <!-- 打字机进行中：整段当文本逐字显示，不提前渲染残缺的图/表 -->
                    <div v-if="message.typingDone === false" class="sec__text" v-html="renderMarkdown(sec.content)"></div>
                    <!-- 打字机完成 / 历史消息：解析出 mermaid 图与表格再渲染 -->
                    <template v-else>
                      <template v-for="p in parseContentParts(sec.content)" :key="p.key">
                        <div v-if="p.type === 'text'" class="sec__text" v-html="renderMarkdown(p.text)"></div>
                        <MermaidBlock v-else :code="p.code"></MermaidBlock>
                      </template>
                    </template>
                  </div>
                </div>
              </template>
            </div>
          </template>

          <!-- 原始直接回答视图 -->
          <div v-else-if="compareTab === 'original'" class="answer__content">
            <p class="answer__p">
              <span class="answer__bullet"></span>
              <span>{{ getAbComparison(message.content).unenhancedShortAnswer }}</span>
            </p>
          </div>

          <!-- 对照评测视图 -->
          <div v-else-if="compareTab === 'compare'" class="compare-metrics">
            <div
              v-for="row in metricRows(message.content)"
              :key="row.key"
              class="compare-metrics__row"
            >
              <span class="compare-metrics__label">{{ row.label }}</span>
              <span class="compare-metrics__val">{{ row.value }}</span>
            </div>
          </div>

          <div class="answer__actions">
            <button class="icon-btn" aria-label="复制" @click="copyAnswer(message.content)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
            </button>
            <button class="icon-btn" aria-label="重新生成" @click="regenerate(message.id)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>
            </button>
            <button class="icon-btn" :class="{ 'icon-btn--on': message.liked }" aria-label="点赞" @click="toggleLike(message.id)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path :fill="message.liked ? 'currentColor' : 'none'" d="M7 10v10H4a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h3Zm0 10h9.2a2 2 0 0 0 1.9-1.4l2.2-6.5A2 2 0 0 0 18.4 9H14l.8-4.2A2.3 2.3 0 0 0 12.5 2L7 8.5V20Z"/>
              </svg>
            </button>
            <button class="icon-btn" :class="{ 'icon-btn--on': message.favored }" aria-label="收藏" @click="toggleFav(message.id)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path :fill="message.favored ? 'currentColor' : 'none'" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>
              </svg>
            </button>
          </div>
        </template>
      </template>

      <div v-if="!messages.length" class="answer__empty">暂无会话内容</div>

      <div v-if="thinking" class="thinking-block">
        <span class="thinking-block__avatar">学伴</span>
        <div class="thinking-block__bubble">
          <span class="thinking-dot"></span>
          <span class="thinking-dot"></span>
          <span class="thinking-dot"></span>
          <span class="thinking-block__text">{{ thinkingText }}</span>
        </div>
      </div>
    </div>

    <ChatInputBar placeholder="继续追问……" @send="onFollowUp" />

    <ContextMenu
      :visible="menu.visible"
      :x="menu.x"
      :y="menu.y"
      :items="menuItems"
      @select="onMenuSelect"
      @close="menu.visible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import NavBar from "../components/NavBar.vue";
import ChatInputBar from "../components/ChatInputBar.vue";
import ContextMenu from "../components/ContextMenu.vue";
import MermaidBlock from "../components/MermaidBlock.vue";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });
/* 每个表格外包一层横向滚动容器，滚动条紧贴表格底部 */
const _fallbackToken = (t, i, o) => md.renderer.renderToken(t, i, o);
const _tblOpen = md.renderer.rules.table_open || _fallbackToken;
const _tblClose = md.renderer.rules.table_close || _fallbackToken;
md.renderer.rules.table_open = (t, i, o) => `<div class="table-wrap">${_tblOpen(t, i, o)}`;
md.renderer.rules.table_close = (t, i, o) => `${_tblClose(t, i, o)}</div>`;
const renderMarkdown = (text) => md.render(String(text || ""));
import { answerSample, planSample } from "../mock/data";
import { toast, showLoading, hideLoading } from "../utils/feedback";
import { addMessage, buildMockAnswer, getActiveAnswerStyles, getConversation, saveConversation, replaceMessage } from "../utils/chatStore";
import {
  enhanceAndAnswer,
  enhanceAndPlan,
  engineSectionsToAnswerSampleSections,
  buildUserContextFromLocal,
  callEnhanceServerStream,
} from "../api/promptEngine";

/* 追问时沿用用户上次勾选的输出模式（localStorage 存 A-I 键） */
const MODE_KEY_TO_LABEL = {
  A: "直接精准模式", B: "引导式对话模式", C: "图像解说模式", D: "临床案例模式", E: "通俗类比模式",
  F: "古籍溯源模式", G: "医家各说模式", H: "现代研究模式", I: "关联方药模式",
};
const getFollowUpModes = () => {
  const fallback = mode.value === "plan"
    ? ["引导式对话模式", "图像解说模式", "现代研究模式"]
    : ["直接精准模式", "通俗类比模式", "临床案例模式", "关联方药模式"];
  try {
    const raw = localStorage.getItem("xy-api-settings");
    const s = raw ? JSON.parse(raw) : {};
    const keys = Array.isArray(s.answerStyles) ? s.answerStyles : [];
    const labels = keys.map((k) => MODE_KEY_TO_LABEL[k]).filter(Boolean);
    return labels.length ? labels : fallback;
  } catch (_) { return fallback; }
};

/* 引擎 sections → 按原始 {mode, title, content} 模板渲染 */
const buildEngineContent = (engineData) => {
  const rawSections = engineData?.answer?.sections || [];
  const sections = rawSections
    .filter((s) => s && (s.title || s.content))
    .map((s) => ({
      mode: s.mode || "",
      heading: s.title || "要点解析",
      content: String(s.content || ""),
    }));
  return {
    greeting: engineData?.answer?.companionGreeting || "",
    sections,
    engine: {
      analysis: engineData?.analysis || null,
      abComparison: engineData?.abComparison || null,
      relatedKnowledgeNodes: engineData?.answer?.relatedKnowledgeNodes || [],
    },
  };
};

const route = useRoute();
const router = useRouter();
const conversationId = computed(() => String(route.params.id || ""));
const conversation = ref(null);
const mode = ref("qa");
const question = ref("");
const messages = ref([]);
const thinking = ref(false);
const thinkingText = ref("正在思考…");

const loadConversation = () => {
  const id = conversationId.value;
  const stored = id && id !== "legacy" ? getConversation(id) : null;
  conversation.value = stored;
  mode.value = stored?.mode || route.query.mode || "qa";
  question.value = stored?.messages?.find((m) => m.role === "user")?.content || route.query.q || (mode.value === "plan" ? planSample.title : answerSample.title);
  if (stored?.messages?.length) {
    messages.value = [...stored.messages];
  } else if (id === "legacy") {
    const legacyQuestion = route.query.q || question.value;
    const legacyContent = mode.value === "plan" ? planSample : answerSample;
    messages.value = [
      { id: "legacy-user", role: "user", content: legacyQuestion },
      { id: "legacy-assistant", role: "assistant", content: legacyContent },
    ];
  } else {
    messages.value = [];
  }
  maybeAutoGenerate();
};

watch(() => route.params.id, loadConversation, { immediate: true });

/* 调引擎生成回答并写入对话（首次自动生成、追问、重新生成共用） */
async function generateReply(question, images = [], modes) {
  if (thinking.value) return;
  thinking.value = true;
  thinkingText.value = "正在思考…";
  /* 首字等待阶段：分阶段提示，避免长时间停在同一句话显得卡死 */
  const stageMsgs = [
    [4000, "正在理解问题…"],
    [9000, "正在结合你的学习情况组织答案…"],
    [16000, "问题稍复杂，正在精心整理，请稍候…"],
  ];
  const stageTimers = stageMsgs.map(([t, msg]) => setTimeout(() => {
    if (thinking.value && streamedCharsRef.n === 0) thinkingText.value = msg;
  }, t));
  const clearStageTimers = () => stageTimers.forEach(clearTimeout);
  const streamedCharsRef = { n: 0 };
  try {
    const ctx = buildUserContextFromLocal();
    const useModes = (Array.isArray(modes) && modes.length) ? modes : getFollowUpModes();
    let engineData = null;

    /* 答疑/规划都走流式：规划 provider=kimi，答疑 deepseek */
    const payload = {
      question,
      selectedOutputs: useModes,
      studentGrade: ctx.studentGrade,
      currentCourse: ctx.currentCourse,
      userPreference: ctx.userPreference,
      studyStats: ctx.studyStats,
      provider: mode.value === "plan" ? "kimi" : "deepseek",
    };
    let streamedChars = 0;
    const ok = await callEnhanceServerStream(
      payload,
      (delta) => {
        streamedChars += (delta || "").length;
        streamedCharsRef.n = streamedChars;
        clearStageTimers();   /* 已开始出字，停止阶段提示 */
        if (streamedChars % 20 < 4) thinkingText.value = `正在生成…已收到 ${streamedChars} 字`;
      },
      (parsed) => { engineData = parsed; }
    );
    if (!ok && !engineData) {
      /* 流式失败回退普通接口 */
      const res = mode.value === "plan"
        ? await enhanceAndPlan({ question, modeLabels: useModes, forceServer: true, provider: "kimi", context: ctx })
        : await enhanceAndAnswer({ question, modeLabels: useModes, kind: "qa", forceServer: true, provider: "deepseek", context: ctx });
      engineData = res?.data || null;
    }

    if (!engineData || !engineData.answer?.sections?.length) {
      throw new Error("引擎未返回有效内容");
    }
    const content = buildEngineContent(engineData);
    const activeStyles = getActiveAnswerStyles();
    const updated = getConversation(conversationId.value);
    if (updated) {
      updated.pendingAnswer = false;
      updated.pendingQuestion = "";
      /* 先插入骨架：卡片标题立即可见，bullets 为空，再逐字填充 */
      const skeleton = {
        ...content,
        sections: (content.sections || []).map((s) => ({ ...s, content: "" })),
      };
      addMessage(updated, "assistant", skeleton, { answerStyles: activeStyles });
      saveConversation(updated);
      syncConversation();
      thinking.value = false;
      /* 打字机：逐字填充 bullets */
      const lastMsg = updated.messages[updated.messages.length - 1];
      typewriterFill(updated, lastMsg, content.sections || []);
    } else {
      thinking.value = false;
    }
  } catch (e) {
    thinking.value = false;
    toast(e && e.message ? e.message : "生成失败，请重试");
  } finally {
    clearStageTimers();
  }
}

/* 打字机效果：把完整 sections 的 content 逐字填到骨架消息里 */
let twTimer = null;
function typewriterFill(conversation, msg, targetSections) {
  if (twTimer) { clearInterval(twTimer); twTimer = null; }
  msg.typingDone = false;   /* 打字机进行中：只显示文本，不渲染图/表 */
  const allChars = [];
  targetSections.forEach((s, si) => {
    String(s.content || "").split("").forEach((ch) => allChars.push({ si, ch }));
  });
  if (!allChars.length) { msg.typingDone = true; return; }
  let idx = 0;
  twTimer = setInterval(() => {
    const batch = Math.min(12 + Math.floor(Math.random() * 12), allChars.length - idx);
    idx += batch;
    msg.content.sections = targetSections.map((s, si) => {
      const end = allChars.slice(0, idx).filter((c) => c.si === si).length;
      return { ...s, content: String(s.content || "").slice(0, end) };
    });
    if (idx >= allChars.length) {
      clearInterval(twTimer); twTimer = null;
      msg.typingDone = true;  /* 全部填完：解锁，mermaid 图/表格此刻才渲染 */
    }
    saveConversation(conversation);
    syncConversation();
  }, 10);
}

/* 首次提问：TutorView 已存 user 消息并标记 pendingAnswer，这里自动接管生成 */
function maybeAutoGenerate() {
  const c = conversation.value;
  if (!c || !c.pendingAnswer) return;
  const hasAssistant = (c.messages || []).some((m) => m.role === "assistant");
  if (hasAssistant) return;
  const q = c.pendingQuestion || (c.messages || []).find((m) => m.role === "user")?.content;
  if (!q) return;
  generateReply(q, c.pendingImages || [], c.pendingModes || getFollowUpModes());
}

const latestAssistantId = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i -= 1) {
    if (messages.value[i].role === "assistant") return messages.value[i].id;
  }
  return null;
});

const menu = ref({ visible: false, x: null, y: null });
let pressTimer = null;
const menuItems = [
  { label: "分享", icon: "" }, { label: "反馈", icon: "" }, { label: "选择", icon: "" },
  { label: "字体", icon: "" }, { label: "下划线", icon: "" }, { label: "斜体", icon: "" }, { label: "不喜欢", icon: "" },
];
const pressStart = (e) => {
  const point = e.touches ? e.touches[0] : e;
  pressTimer = setTimeout(() => { menu.value = { visible: true, x: point.clientX, y: point.clientY }; }, 500);
};
const pressEnd = () => clearTimeout(pressTimer);
const fontClass = ref("");
const underline = ref(false);
const italic = ref(false);
const selecting = ref(false);
const textStyle = computed(() => ({
  "answer__content--serif": fontClass.value === "serif",
  "answer__content--underline": underline.value,
  "answer__content--italic": italic.value,
  "answer__content--selecting": selecting.value,
}));
const onMenuSelect = (item) => {
  if (item.label === "选择") { selecting.value = !selecting.value; toast(selecting.value ? "已进入选择模式" : "已退出选择模式"); }
  else if (item.label === "字体") fontClass.value = fontClass.value === "serif" ? "" : "serif";
  else if (item.label === "下划线") underline.value = !underline.value;
  else if (item.label === "斜体") italic.value = !italic.value;
  else if (item.label === "分享") toast("已分享");
  else if (item.label === "反馈") toast("已提交反馈，谢谢您");
  else if (item.label === "不喜欢") toast("已反馈，将减少此类回答");
};

const normalizeContent = (value) => {
  if (value?.sections) {
    return { sections: value.sections.map((s) => ({
      mode: s.mode || "",
      heading: s.heading || s.title || "要点解析",
      content: s.content != null ? s.content : (Array.isArray(s.bullets) ? s.bullets.join("\n") : ""),
    })) };
  }
  return { sections: [{ heading: "AI 回答", content: String(value || "") }] };
};

/* 把一段 content 拆成 parts：普通文本 / mermaid 图。
   支持两种写法：①标准 ```mermaid 围栏；②裸写（一行 "mermaid"，紧跟 graph/flowchart 等，空行结束） */
const MERMAID_DIAG_TYPES = "graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|mindmap|pie|timeline";
const parseContentParts = (content) => {
  const text = String(content || "");
  const parts = [];
  const re = new RegExp(
    "```mermaid[ \\t]*\\n?([\\s\\S]*?)```" +
    "|(?:^|\\n)[ \\t]*mermaid[ \\t]*\\n((" + MERMAID_DIAG_TYPES + ")\\b[\\s\\S]*?)(?=\\n[ \\t]*\\n|\\n[ \\t]*【|$)",
    "g"
  );
  let last = 0, i = 0, m;
  while ((m = re.exec(text)) !== null) {
    const code = (m[1] != null ? m[1] : m[2] || "").trim();
    const blockStart = m[1] != null ? m.index : m.index + 1; /* 裸块吃掉了开头换行 */
    if (blockStart > last) {
      parts.push({ type: "text", text: text.slice(last, blockStart), key: `t${i}` });
    }
    if (code) parts.push({ type: "mermaid", code, key: `m${i}` });
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last), key: `t${i}` });
  if (!parts.length) parts.push({ type: "text", text, key: "t0" });
  return parts;
};
const getAnalysis = (value) => (value && typeof value === "object" ? value.engine?.analysis : null) || null;
const getAbComparison = (value) => (value && typeof value === "object" ? value.engine?.abComparison : null) || null;
const getContentGreeting = (value) => (value && typeof value === "object" ? value.greeting : "") || "";

/* 效果对比切换器：enhanced=增强解答 / original=原始直接回答 / compare=对照评测 */
const compareTab = ref("enhanced");
/* 对照评测指标中文名映射（与引擎 comparisonMetrics 键对应） */
const METRIC_LABELS = {
  accuracyDiff: "准确性",
  completenessDiff: "完整性",
  understandabilityDiff: "易懂度",
  knowledgeExpansionDiff: "知识拓展",
};
const metricRows = (content) => {
  const metrics = getAbComparison(content)?.comparisonMetrics;
  if (!metrics || typeof metrics !== "object") return [];
  return Object.entries(METRIC_LABELS)
    .filter(([key]) => metrics[key])
    .map(([key, label]) => ({ key, label, value: metrics[key] }));
};
const bold = (t) => String(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
const plainText = (value) => normalizeContent(value).sections.map((s) => s.heading + "\n" + String(s.content).replace(/\*\*/g, "")).join("\n\n");
const copyAnswer = async (value) => {
  try { await navigator.clipboard.writeText(plainText(value)); } catch { /* ignore */ }
  toast("已复制");
};

const syncConversation = () => {
  const latest = getConversation(conversationId.value);
  if (!latest) return;
  conversation.value = latest;
  messages.value = [...latest.messages];
};

const regenerate = (messageId) => {
  showLoading("正在重新生成");
  setTimeout(() => {
    const current = getConversation(conversationId.value);
    if (current) {
      const answerIndex = current.messages.findIndex((m) => m.id === messageId);
      const previousUser = answerIndex > 0
        ? [...current.messages].slice(0, answerIndex).reverse().find((m) => m.role === "user")
        : null;
      const sourceQuestion = previousUser?.content || question.value;
      const activeStyles = getActiveAnswerStyles();
      replaceMessage(current, messageId, buildMockAnswer(sourceQuestion, mode.value, activeStyles), { regenerated: true, answerStyles: activeStyles });
      saveConversation(current);
      syncConversation();
    }
    hideLoading();
    toast("已生成新的回答");
  }, 900);
};

const updateMessageFeedback = (messageId, patch) => {
  const current = getConversation(conversationId.value);
  const message = current?.messages?.find((item) => item.id === messageId);
  if (!message) return;
  Object.assign(message, patch);
  saveConversation(current);
  syncConversation();
};

const toggleLike = (messageId) => {
  const message = messages.value.find((item) => item.id === messageId);
  const next = !message?.liked;
  updateMessageFeedback(messageId, { liked: next });
  toast(next ? "已点赞" : "已取消点赞");
};

const toggleFav = (messageId) => {
  const message = messages.value.find((item) => item.id === messageId);
  const next = !message?.favored;
  updateMessageFeedback(messageId, { favored: next });
  toast(next ? "已收藏\n可在“我的-我的收藏”中查看" : "已取消收藏");
};

const onFollowUp = async ({ text, images = [] }) => {
  if (!text && !images.length) return;
  const question = text || "图片提问";
  const current = getConversation(conversationId.value);
  if (current) {
    addMessage(current, "user", question, { images });
    saveConversation(current);
    syncConversation();
  }
  generateReply(question, images, getFollowUpModes());
};

const startNewChat = () => router.push({ name: "tutor", query: { new: "1" } });
</script>

<style scoped>
.answer { --chat-input-bottom: var(--safe-bottom); }
.answer__new-chat { font-size: var(--font-size-caption); color: var(--color-primary); padding: 6px 0; white-space: nowrap; }
.answer__body { padding: 0 var(--page-padding) 110px; }
.answer__question { background: var(--color-primary-tint); border-radius: var(--radius-card); padding: 12px 14px; margin: 14px 0; }
.answer__q-tag {
  display: inline-block;
  font-size: 11px;
  color: #fff;
  background: var(--color-primary);
  border-radius: 6px;
  padding: 2px 8px;
  margin-bottom: 6px;
}
.answer__q-text { font-weight: 500; }
.answer__q-imgs { display: flex; gap: 8px; margin-top: 8px; }
.answer__q-imgs img { width: 72px; height: 72px; object-fit: cover; border-radius: var(--radius-sm); }
.answer__content { user-select: none; -webkit-user-select: none; }
.answer__content--serif { font-family: Georgia, "Songti SC", serif; }
.answer__content--underline { text-decoration: underline; }
.answer__content--italic { font-style: italic; }
.answer__content--selecting { user-select: text; -webkit-user-select: text; background: var(--color-primary-tint); border-radius: var(--radius-sm); }
.answer__h { font-size: 15px; font-weight: 700; margin: 16px 0 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.answer__mode-tag {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-tint);
  border-radius: 999px;
  padding: 2px 8px;
}
.answer__p { display: flex; gap: 8px; line-height: 1.9; margin: 10px 0; text-align: justify; font-size: 14px; }
.answer__bullet { flex: 0 0 auto; width: 5px; height: 5px; border-radius: 50%; background: var(--color-primary); margin-top: 9px; }
.answer__p :deep(strong) { font-weight: 700; color: var(--color-primary); }

/* 统一 section 卡片：每个模式独立框起来 */
.sec__block {
  margin: 14px 0;
  border: 1px solid var(--color-divider);
  border-radius: 14px;
  background: var(--color-card);
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(31, 92, 56, 0.05);
}
.sec__h {
  font-size: 15px; font-weight: 700;
  margin: 0 0 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--color-divider);
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.sec__mode-tag {
  font-size: 11px; font-weight: 500;
  color: var(--color-primary);
  background: var(--color-primary-tint);
  border-radius: 999px;
  padding: 2px 8px;
}
.sec__content { font-size: 14px; }
.sec__text {
  line-height: 1.9;
  word-break: break-word;
  text-align: justify;
}
.sec__text :deep(strong) { font-weight: 700; color: var(--color-primary); }
.sec__text :deep(p) { margin: 6px 0; }
.sec__text :deep(ul), .sec__text :deep(ol) { margin: 6px 0; padding-left: 22px; }
.sec__text :deep(li) { margin: 3px 0; }

/* Markdown 表格：真正的边框表格；仅表格外层横向滚动，滚动条紧贴表格底部 */
.sec__text :deep(.table-wrap) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 10px 0;
}
.sec__text :deep(.table-wrap table) { margin: 0; }
.sec__text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  min-width: 420px;
  font-size: 13px;
  line-height: 1.7;
  display: table;
}
.sec__text :deep(th), .sec__text :deep(td) {
  border: 1px solid var(--color-divider, #d8e2db);
  padding: 7px 10px;
  text-align: left;
  vertical-align: top;
}
.sec__text :deep(th) {
  background: var(--color-primary-tint, #e8f1ec);
  color: var(--color-primary, #266636);
  font-weight: 700;
  white-space: nowrap;
}
.sec__text :deep(tbody tr:nth-child(even) td) { background: #f7faf8; }
.answer__actions { display: flex; gap: 15px; padding: 14px 2px 6px; }

/* 问题理解与增强分析卡片 */
.analysis-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  padding: 12px 14px;
  margin: 14px 0 4px;
}
.analysis-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.analysis-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.analysis-card__badge {
  font-size: 11px;
  color: var(--color-primary);
  background: var(--color-primary-tint);
  border-radius: 999px;
  padding: 2px 8px;
}
.analysis-card__rows {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}
.analysis-row {
  display: flex;
  gap: 10px;
  font-size: 12px;
  line-height: 1.5;
}
.analysis-row__k {
  flex: 0 0 44px;
  color: var(--color-text-caption);
}
.analysis-row__v { color: var(--color-text-secondary); }
.analysis-card__sp {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--color-divider, var(--color-border-light));
}
.analysis-card__sp-title { font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; }
.analysis-card__sp-item {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  padding-left: 4px;
}

/* 效果对比切换器 */
.compare-tabs {
  display: flex;
  gap: 8px;
  margin: 14px 0 4px;
}
.compare-tabs__btn {
  flex: 1;
  border: 1px solid var(--color-border-light);
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border-radius: 999px;
  padding: 7px 4px;
  font-size: 12px;
  transition: all .15s;
}
.compare-tabs__btn.is-on {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
  font-weight: 600;
}

/* 学伴问候区 */
.greet-block { margin: 14px 0 4px; }
.greet-block__head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.greet-block__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.greet-block__name { font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.greet-block__text { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; padding-left: 36px; }

/* 对照评测指标 */
.compare-metrics {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  padding: 12px 14px;
  margin: 8px 0;
}
.compare-metrics__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
}
.compare-metrics__row + .compare-metrics__row { border-top: 1px dashed var(--color-border-light); }
.compare-metrics__label { color: var(--color-text-secondary); }
.compare-metrics__val { color: var(--color-primary); font-weight: 600; }

/* 思考中气泡（不遮屏，对话流内嵌） */
.thinking-block { display: flex; gap: 8px; align-items: flex-start; margin: 14px 0 4px; }
.thinking-block__avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--color-primary); color: #fff;
  font-size: 11px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
}
.thinking-block__bubble {
  display: flex; align-items: center; gap: 5px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-light);
  border-radius: 14px;
  padding: 10px 14px;
}
.thinking-block__text { font-size: 13px; color: var(--color-text-secondary); }
.thinking-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--color-primary);
  animation: thinking-bounce 1.2s infinite ease-in-out;
}
.thinking-dot:nth-child(2) { animation-delay: 0.2s; }
.thinking-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes thinking-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
.icon-btn { display: flex; align-items: center; justify-content: center; padding: 4px; color: var(--color-text-secondary); font-size: 15px; }
.icon-btn svg { width: 15px; height: 15px; }
.icon-btn--on { color: var(--color-primary); }
.answer__empty { padding: 60px 20px; text-align: center; color: var(--color-text-caption); }
</style>
