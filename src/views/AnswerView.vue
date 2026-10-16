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
          <div class="answer__q-head">
            <span class="answer__q-tag">学生提问</span>
            <button
              class="answer__q-edit"
              aria-label="修改问题"
              :disabled="isGenerating"
              @click="editQuestion(message)"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
              <span>修改</span>
            </button>
          </div>
          <p class="answer__q-text">{{ message.content }}</p>
          <div v-if="message.images?.length" class="answer__q-imgs">
            <img v-for="(img, i) in message.images" :key="i" :src="img" alt="提问图片" />
          </div>
        </div>

        <template v-else-if="message.role === 'assistant'">
          <!-- 引擎连不上时的本地模板回答：显著标注，避免误以为是真实 AI 回答 -->
          <div v-if="message.offline" class="offline-banner">
            ⚠️ AI 引擎未连接（免费容器休眠中，唤醒约需 1 分钟），以下为内置模板回答；请等待约 1 分钟后点下方「重新生成」按钮恢复真实 AI 回答。
          </div>
          <!-- 阶段三：专科专家路由徽章 -->
          <div v-if="message.content?.skill" class="skill-badge">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2 3 7v3c0 5 3.7 8.6 9 10 5.3-1.4 9-5 9-10V7Z"/><path d="m9 12 2 2 4-4"/>
            </svg>
            <span>由「{{ message.content.skill.skillName }}」专科解答</span>
          </div>
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
            <!-- 复杂问题：AI 已做"推理→自检"，展示核对无误的要点（体现严谨、增强信任） -->
            <div
              v-if="(getAnalysis(message.content).review?.verifiedPoints || []).length"
              class="review-block"
            >
              <p class="review-block__title">已自我审校 · 核对要点</p>
              <ul class="review-block__list">
                <li
                  v-for="(p, pi) in getAnalysis(message.content).review.verifiedPoints"
                  :key="pi"
                >{{ p }}</li>
              </ul>
              <details
                v-if="(getAnalysis(message.content).review?.issues || []).length"
                class="review-block__details"
              >
                <summary>查看自检中修正的 {{ getAnalysis(message.content).review.issues.length }} 处问题</summary>
                <ul>
                  <li
                    v-for="(it, ii) in getAnalysis(message.content).review.issues"
                    :key="ii"
                  >{{ it }}</li>
                </ul>
              </details>
            </div>
          </div>

          <!-- 深度思考（R1 思维链）：参考 DeepSeek，逐字流式、可折叠。
               思考中默认展开（实时看到 AI 在想什么），正文开始后自动折叠；用户可手动展开/收起。 -->
          <div
            v-if="message.content?.reasoning"
            class="reasoning-block"
          >
            <div class="reasoning-block__head" @click="toggleReasoning(message)">
              <svg class="reasoning-block__icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a4 4 0 0 0-4 4 4 4 0 0 0-1 7.9V17h10v-2.1A4 4 0 0 0 12 3Z"/><path d="M9 19h6"/><path d="M10 21h4"/>
              </svg>
              <span class="reasoning-block__title">{{ message.content.reasoningDone ? "已深度思考" : "正在思考" }}</span>
              <span
                v-if="!message.content.reasoningDone"
                class="reasoning-block__dots"
              ><i></i><i></i><i></i></span>
              <svg
                class="reasoning-block__arrow"
                :class="{ 'is-open': isReasoningOpen(message) }"
                viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              ><path d="m6 9 6 6 6-6"/></svg>
            </div>
            <div v-show="isReasoningOpen(message)" class="reasoning-block__body">
              <div class="reasoning-block__text" v-html="renderMarkdown(message.content.reasoning)"></div>
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
              @mouseup="onAnswerSelect" @touchend="onAnswerSelect">
              <template v-for="(sec, i) in normalizeContent(message.content).sections" :key="i">
                <!-- 停止后若正文为空，不显示空的"AI 回答"区块 -->
                <div v-if="message.typingDone === false || (sec.content && sec.content.trim())" class="sec__block">
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

    <!-- 选中答案文字后浮出的小工具条 -->
    <div v-if="selBar.visible" class="sel-toolbar" :style="{ top: selBar.y + 'px', left: selBar.x + 'px' }">
      <button class="sel-toolbar__btn" @click="copySelection">复制</button>
      <button class="sel-toolbar__btn sel-toolbar__btn--primary" @click="quoteSelection">引用</button>
    </div>

    <!-- 待发送的引用块 -->
    <div v-if="pendingQuote" class="quote-chip" :class="{ 'quote-chip--plan': mode === 'plan' }">
      <span class="quote-chip__tag">引用</span>
      <span class="quote-chip__text">{{ pendingQuote }}</span>
      <button class="quote-chip__x" aria-label="移除引用" @click="pendingQuote = ''">×</button>
    </div>

    <ChatInputBar
      ref="inputBar"
      :placeholder="editingRef ? '修改问题后重新发送（点击下方取消）…' : '继续追问……'"
      :generating="isGenerating"
      @send="onFollowUp"
      @stop="stopGeneration"
    />
    <!-- 编辑问题时：提供取消入口 -->
    <button v-if="editingRef" class="edit-cancel" @click="cancelEdit">取消修改</button>

    <!-- 追问输出方式：仅答疑显示，点击展开切换 9 个模式；规划固定直接精准 -->
    <div v-if="mode === 'qa'" class="mode-bar">
      <div v-if="modePickerOpen" class="mode-bar__panel">
        <button
          v-for="m in ALL_MODE_LABELS"
          :key="m"
          class="mode-chip"
          :class="{ 'mode-chip--on': followModes.includes(m) }"
          @click="toggleFollowMode(m)"
        >{{ m.replace("模式", "") }}</button>
      </div>
      <button class="mode-bar__toggle" @click="modePickerOpen = !modePickerOpen">
        <svg class="mode-bar__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
        <span class="mode-bar__label">输出方式</span>
        <span class="mode-bar__summary">{{ modeSummary }}</span>
        <svg class="mode-bar__caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :style="{ transform: modePickerOpen ? 'rotate(180deg)' : 'none' }"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    </div>

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
import { ref, reactive, computed, watch } from "vue";
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
  callEnhanceServer,
  waitForEngineReady,
  maybeRememberNote,
} from "../api/promptEngine";

/* 追问时沿用用户上次勾选的输出模式（localStorage 存 A-I 键） */
const MODE_KEY_TO_LABEL = {
  A: "直接精准模式", B: "引导式对话模式", C: "图像解说模式", D: "临床案例模式", E: "通俗类比模式",
  F: "古籍溯源模式", G: "医家各说模式", H: "现代研究模式", I: "关联方药模式",
};
const getFollowUpModes = () => {
  const fallback = mode.value === "plan"
    ? ["直接精准模式"]   /* 规划固定直接精准，实测效果最好 */
    : ["直接精准模式", "通俗类比模式", "临床案例模式", "关联方药模式"];
  try {
    const raw = localStorage.getItem("xy-api-settings");
    const s = raw ? JSON.parse(raw) : {};
    const keys = Array.isArray(s.answerStyles) ? s.answerStyles : [];
    const labels = keys.map((k) => MODE_KEY_TO_LABEL[k]).filter(Boolean);
    return labels.length ? labels : fallback;
  } catch (_) { return fallback; }
};

/* 追问输出方式选择（9 模式可随时切换，默认沿用上次选择） */
const ALL_MODE_LABELS = Object.values(MODE_KEY_TO_LABEL);
const LABEL_TO_MODE_KEY = Object.fromEntries(
  Object.entries(MODE_KEY_TO_LABEL).map(([k, v]) => [v, k])
);
const followModes = ref([]);
const modePickerOpen = ref(false);
const modeSummary = computed(() => {
  const n = followModes.value.length;
  if (!n) return "默认";
  const short = followModes.value.map((m) => m.replace("模式", ""));
  return short.length <= 2 ? short.join("、") : `${short.slice(0, 2).join("、")} 等 ${n} 项`;
});
const toggleFollowMode = (label) => {
  const i = followModes.value.indexOf(label);
  if (i >= 0) followModes.value.splice(i, 1);
  else followModes.value.push(label);
  /* 选择同步回全局设置，保持与首页/推演页一致 */
  try {
    const raw = localStorage.getItem("xy-api-settings");
    const s = raw ? JSON.parse(raw) : {};
    s.answerStyles = followModes.value.map((l) => LABEL_TO_MODE_KEY[l]).filter(Boolean);
    localStorage.setItem("xy-api-settings", JSON.stringify(s));
  } catch (_) {}
};

/* 引擎 sections → 按原始 {mode, title, content} 模板渲染 */
const buildEngineContent = (engineData, skill = null) => {
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
    reasoning: "",
    reasoningDone: true,
    skill: skill || null,   /* 兜底时保留专科专家徽章 */
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
/* 生成中状态（思考+正文流式）：控制输入栏的"停止"按钮 */
const isGenerating = ref(false);
let currentAbort = null;
/* 当前正在编辑的提问（修改刚刚的问题）：{ userId, assistantId }，null 表示非编辑态 */
const editingRef = ref(null);

/* 停止生成：中断 SSE 流（已生成内容保留），参考 DeepSeek */
const stopGeneration = () => {
  if (currentAbort) {
    try { currentAbort.abort(); } catch (_) {}
  }
};

/* 把 localStorage 里的最新会话刷回 Vue（generateReply 高频调用，故定义在前，避免 TDZ） */
const syncConversation = () => {
  const latest = getConversation(conversationId.value);
  if (!latest) return;
  conversation.value = latest;
  messages.value = [...latest.messages];
};

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
  if (!followModes.value.length) followModes.value = getFollowUpModes();
  maybeAutoGenerate();
};

watch(() => route.params.id, loadConversation, { immediate: true });

/* 把一条消息转成纯文本（用于给引擎的多轮历史）。
   user 内容是字符串；assistant 内容是 { sections:[{heading,content}] } 结构，需拼接。 */
function messageToPlainText(msg) {
  const c = msg?.content;
  if (typeof c === "string") return c;
  if (!c || typeof c !== "object") return "";
  const sections = Array.isArray(c.sections) ? c.sections : [];
  return sections
    .map((s) => `${s.heading ? `${s.heading}\n` : ""}${s.content || ""}`)
    .join("\n\n")
    .trim();
}

/* 取出"当前问题之前"的对话历史（此时最新一条 user 消息已入列、骨架尚未插入），
   供引擎识别追问与纠正。后端会再清洗、限条数。 */
function buildHistoryForEngine() {
  const conv = getConversation(conversationId.value);
  const prior = conv && Array.isArray(conv.messages) ? conv.messages.slice(0, -1) : [];
  return prior
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: messageToPlainText(m) }))
    .filter((m) => m.content && m.content.trim());
}

/* 调引擎生成回答并写入对话（首次自动生成、追问、重新生成共用） */
async function generateReply(question, images = [], modes, replaceAssistantId = null) {
  if (thinking.value) return;
  thinking.value = true;
  isGenerating.value = true;
  /* 为本次流创建中断器，供"停止生成"使用 */
  currentAbort = new AbortController();
  const signal = currentAbort.signal;
  let aborted = false;
  signal.addEventListener("abort", () => { aborted = true; });
  thinkingText.value = "正在思考…";
  /* 首字等待阶段提示（出字后立刻停止） */
  const stageMsgs = [
    [3000, "正在理解问题…"],
    [8000, "正在结合你的学习情况组织答案…"],
    [14000, "问题稍复杂，请稍候…"],
  ];
  const stageTimers = stageMsgs.map(([t, msg]) => setTimeout(() => {
    if (thinking.value) thinkingText.value = msg;
  }, t));
  const clearStageTimers = () => stageTimers.forEach(clearTimeout);
  try {
    /* 发请求前先确保引擎就绪：免费容器休眠时自动唤醒（约 60-90s），
       否则 POST 直接 503 只能给模板兜底。健康时探测秒回、无感知。 */
    thinkingText.value = "正在连接 AI 引擎（若长时间未使用，唤醒约需 1 分钟）…";
    const engineReady = await waitForEngineReady({ timeoutMs: 150000, intervalMs: 5000 });
    if (engineReady) thinkingText.value = "正在思考…";

    const ctx = buildUserContextFromLocal();
    const useModes = (Array.isArray(modes) && modes.length) ? modes : getFollowUpModes();
    const provider = mode.value === "plan" ? "kimi" : "deepseek";
    const payload = {
      question,
      selectedOutputs: useModes,
      studentGrade: ctx.studentGrade,
      currentCourse: ctx.currentCourse,
      userPreference: ctx.userPreference,
      userNotes: ctx.userNotes,
      studyStats: ctx.studyStats,
      history: buildHistoryForEngine(),
      provider,
    };

    /* 1) 思考阶段【不】立即插入空骨架"AI 回答"卡片——只显示思考气泡，
       否则用户会看到一个空卡片，分不清是在思考还是卡住。
       骨架卡片推迟到第一个实质内容（analysis 或 delta）到达时才创建。 */
    let updated = null;
    let msg = null;
    let saveTimer = null;
    /* 阶段三：skill 事件先于 analysis 到达，暂存专家信息，创建骨架时写入 */
    let pendingSkill = null;
    /* 持久化节流：流式高频更新，不必每个字都 JSON.stringify 写 localStorage（会阻塞主线程、
       让逐字流卡顿）。约 400ms 落盘一次，流结束再补存完整结果。 */
    const flushSave = () => {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      if (updated) saveConversation(updated);
    };
    const scheduleSave = () => {
      if (saveTimer) return;
      saveTimer = setTimeout(() => { saveTimer = null; if (updated) saveConversation(updated); }, 400);
    };
    function ensureMsg() {
      if (msg) return msg;
      updated = getConversation(conversationId.value);
      if (!updated) throw new Error("会话不存在");
      updated.pendingAnswer = false;
      updated.pendingQuestion = "";
      const skeleton = {
        sections: [{ heading: "AI 回答", content: "" }],
        engine: { analysis: null, abComparison: null },
        reasoning: "",        // R1 思考过程（思维链），逐字流式显示
        reasoningDone: false, // 思考是否完成（正文开始即完成、自动折叠）
        skill: pendingSkill ? { skillId: pendingSkill.skillId, skillName: pendingSkill.skillName } : null,
      };
      let msgId;
      if (replaceAssistantId) {
        replaceMessage(updated, replaceAssistantId, skeleton, { offline: false });
        msgId = replaceAssistantId;
      } else {
        addMessage(updated, "assistant", skeleton, { offline: false });
        msgId = updated.messages[updated.messages.length - 1].id;
      }
      saveConversation(updated);
      /* 用当前 updated【同一份引用】同步到响应式：后续逐字更新写回的就是
         会被保存的 updated，二者不能断开。
         （若用 syncConversation() 重新 getConversation() 深拷贝，会产生两份对象：
          正文更新在新拷贝、保存的却是旧 updated，刷新后回答就"消失"了。） */
      conversation.value = updated;
      messages.value = [...updated.messages];
      const idx = messages.value.findIndex((x) => x.id === msgId);
      if (idx < 0) throw new Error("消息创建失败");
      msg = messages.value[idx];
      msg.typingDone = false;
      /* 有实质内容了，才收起思考气泡 */
      thinking.value = false;
      clearStageTimers();
      return msg;
    }

    /* 2) 流式顺序：问题理解(analysis) → 思考过程(reasoning，复杂问题 R1) → 正文(delta) 逐字显示。 */
    let acc = "";
    let reasonAcc = "";
    let bodyStarted = false;
    const ok = await callEnhanceServerStream(
      payload,
      (delta) => {
        const m = ensureMsg();
        if (!bodyStarted) {
          bodyStarted = true;
          /* 正文开始 = 思考结束：标记完成、自动折叠思考区 */
          m.content.reasoningDone = true;
        }
        acc += delta || "";
        m.content.sections[0].content = acc;   /* 细粒度响应式更新，逐字平滑 */
        scheduleSave();
      },
      () => { if (msg) msg.typingDone = true; },   /* 流结束：解锁表格/mermaid 渲染 */
      (analysis) => {
        if (analysis && !analysis.error) {
          const m = ensureMsg();
          m.content.engine.analysis = analysis;
          scheduleSave();
        }
      },
      (review) => {
        /* review 事件晚于 analysis：补填到已显示的分析卡片，触发"已自我审校"区块 */
        const existing = msg?.content?.engine?.analysis;
        if (existing && review && !review.error) {
          existing.review = review;
          scheduleSave();
        }
      },
      (reasoning) => {
        /* R1 思考过程：逐字累积，实时显示在"正在思考"折叠区（参考 DeepSeek） */
        const m = ensureMsg();
        reasonAcc += reasoning || "";
        m.content.reasoning = reasonAcc;
        scheduleSave();
      },
      (skill) => {
        /* 阶段三：专科专家路由结果，先暂存（骨架创建时写入）；
           并让思考气泡显示"XX 专家正在思考" */
        if (skill && skill.skillName) {
          pendingSkill = skill;
          thinkingText.value = `${skill.skillName}正在思考…`;
        }
      },
      signal
    );

    /* 4) 用户停止：保留已生成内容，不做兜底 */
    if (ok === "aborted") {
      /* 标记思考区为已结束（避免一直显示"正在思考"），但正文若是空的则保持思考中观感 */
      if (msg) {
        msg.content.reasoningDone = true;
        msg.typingDone = true;
      }
    }

    /* 5) 兜底：非主动停止、且没有任何正文（连不上 / 上游报错 / 流异常关闭）→ 本地模板。
       注意：不能只看 !ok——后端正文失败时流可能"正常关闭"返回 error，但正文同样为空。 */
    const streamError = ok && typeof ok === "object" ? ok.error : null;
    if (ok !== "aborted" && !acc.trim()) {
      const res = provider === "kimi"
        ? await enhanceAndPlan({ question, modeLabels: useModes, provider: "kimi", context: ctx })
        : await enhanceAndAnswer({ question, modeLabels: useModes, kind: "qa", provider: "deepseek", context: ctx });
      const fb = res?.data;
      if (fb?.answer?.sections?.length) {
        const m = ensureMsg();   /* 兜底也要先创建骨架卡片（同时收起思考气泡） */
        m.content = buildEngineContent(fb, m.content?.skill);
        toast(streamError ? "AI 正文生成失败，已先显示内置模板，可点「重新生成」" : "AI 引擎暂不可用，本条为内置模板回答，稍后可点「重新生成」");
      } else {
        /* 本地模板也没有：写一个明确的失败占位，绝不留空白回答 */
        const m = ensureMsg();
        m.content.sections[0].content = `> ⚠️ 本次回答生成失败：${streamError || "未收到 AI 响应"}\n> 请点下方「重新生成」按钮再试。`;
        if (streamError) toast(streamError);
      }
    } else if (streamError && acc.trim()) {
      /* 正文已生成一部分后才报错：保留已有内容，仅提示 */
      toast(streamError);
    }
    if (msg) {
      msg.typingDone = true;
      flushSave();              /* 流结束/停止：立即落盘已有内容 */
    }
  } catch (e) {
    thinking.value = false;
    toast(e && e.message ? e.message : "生成失败，请重试");
  } finally {
    /* 无论正常/停止/异常：收起思考、停止按钮复位、定时器清理、内容落盘 */
    thinking.value = false;
    isGenerating.value = false;
    currentAbort = null;
    clearStageTimers();
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    /* 停止发生在骨架创建前（还在思考阶段）：清掉会话 pending 标记，避免一直显示待生成 */
    if (!updated) {
      try {
        const c = getConversation(conversationId.value);
        if (c && c.pendingAnswer) { c.pendingAnswer = false; c.pendingQuestion = ""; saveConversation(c); }
      } catch (_) {}
    } else {
      try { saveConversation(updated); } catch (_) {}
    }
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

/* 深度思考折叠区展开状态：
   - 用户没手动操作时：思考中（reasoningDone=false）展开、正文开始后自动折叠；
   - 用户手动点开/收起后，尊重用户选择。 */
const reasoningUserToggled = reactive({});
const reasoningUserOpen = reactive({});
const isReasoningOpen = (msg) => {
  if (!msg) return false;
  if (reasoningUserToggled[msg.id]) return !!reasoningUserOpen[msg.id];
  return !msg.content?.reasoningDone;
};
const toggleReasoning = (msg) => {
  if (!msg) return;
  reasoningUserToggled[msg.id] = true;
  reasoningUserOpen[msg.id] = !isReasoningOpen(msg);
};
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

const regenerate = (messageId) => {
  if (thinking.value) { toast("请等待当前回答生成完毕"); return; }
  const current = getConversation(conversationId.value);
  if (!current) return;
  const answerIndex = current.messages.findIndex((m) => m.id === messageId);
  const previousUser = answerIndex > 0
    ? [...current.messages].slice(0, answerIndex).reverse().find((m) => m.role === "user")
    : null;
  const sourceQuestion = previousUser?.content || question.value;
  if (!sourceQuestion) { toast("未找到原问题，无法重新生成"); return; }
  /* 沿用该回答当时勾选的输出模式 */
  let modes = getFollowUpModes();
  const oldModes = current.messages[answerIndex]?.content?.analysis?.outputModes;
  if (Array.isArray(oldModes) && oldModes.length) modes = oldModes;
  /* 真正重走云端引擎，并原地替换该条回答 */
  generateReply(sourceQuestion, [], modes, messageId);
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

const inputBar = ref(null);
const pendingQuote = ref("");
const selBar = ref({ visible: false, x: 0, y: 0, text: "" });

/* 读取答案区内当前选中的文字及其位置 */
const getAnswerSelection = () => {
  const sel = window.getSelection();
  const text = sel ? String(sel.toString() || "").trim() : "";
  if (!text || !sel.rangeCount) return null;
  const anchor = sel.anchorNode;
  const node = anchor && (anchor.nodeType === 1 ? anchor : anchor.parentElement);
  if (!node || !node.closest || !node.closest(".answer__content")) return null;
  const rect = sel.getRangeAt(0).getBoundingClientRect();
  return { text, x: rect.left + rect.width / 2, y: rect.top };
};

/* 选中后浮出工具条（touchend 时选择尚未生成，延迟读取） */
const onAnswerSelect = () => {
  setTimeout(() => {
    const s = getAnswerSelection();
    if (!s) { selBar.value.visible = false; return; }
    selBar.value = {
      visible: true,
      x: Math.max(70, Math.min(s.x, window.innerWidth - 70)),
      y: Math.max(44, s.y - 46),
      text: s.text,
    };
  }, 12);
};

const clearSelection = () => {
  try { window.getSelection()?.removeAllRanges(); } catch (_) {}
};

const copySelection = async () => {
  const t = selBar.value.text;
  try {
    await navigator.clipboard.writeText(t);
    toast("已复制选中内容");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast("已复制选中内容"); }
    catch { toast("复制失败，请长按文字选择"); }
    ta.remove();
  }
  selBar.value.visible = false;
  clearSelection();
};

const quoteSelection = () => {
  pendingQuote.value = selBar.value.text;
  selBar.value.visible = false;
  clearSelection();
  toast("已引用，可在下方继续输入问题");
};

/* 修改刚刚的问题（参考 DeepSeek）：把该提问载入输入框，改完发送会替换原回答，而非追加追问 */
const editQuestion = (userMsg) => {
  if (isGenerating.value) return;
  const idx = messages.value.findIndex((m) => m.id === userMsg.id);
  if (idx < 0) return;
  const assistant = messages.value.slice(idx + 1).find((m) => m.role === "assistant");
  editingRef.value = { userId: userMsg.id, assistantId: assistant?.id || null };
  inputBar.value?.setText(userMsg.content);
  inputBar.value?.focus();
  toast("已载入问题，修改后重新发送即可");
};
const cancelEdit = () => {
  editingRef.value = null;
  inputBar.value?.clear();
};

const onFollowUp = async ({ text, images = [] }) => {
  if (!text && !images.length) return;
  let question = text || "图片提问";

  /* 编辑模式：更新原问题、替换原回答，而非新增一轮追问 */
  if (editingRef.value) {
    const { userId, assistantId } = editingRef.value;
    editingRef.value = null;
    const conv = getConversation(conversationId.value);
    if (conv) {
      const um = conv.messages.find((m) => m.id === userId);
      if (um) { um.content = question; um.images = images; conv.updatedAt = new Date().toISOString(); }
      saveConversation(conv);
      syncConversation();
    }
    generateReply(question, images, followModes.value.length ? followModes.value : getFollowUpModes(), assistantId);
    return;
  }
  if (pendingQuote.value) {
    const quoted = String(pendingQuote.value).replace(/\n/g, "\n> ");
    question = `> ${quoted}\n\n${question}`;
  }
  const current = getConversation(conversationId.value);
  if (current) {
    addMessage(current, "user", question, { images });
    saveConversation(current);
    syncConversation();
  }
  pendingQuote.value = "";
  /* 若这是一次纠正/强调，记入长期偏好（跨会话生效） */
  maybeRememberNote(text);
  generateReply(question, images, followModes.value.length ? followModes.value : getFollowUpModes());
};

const startNewChat = () => router.push({ name: "tutor", query: { new: "1" } });
</script>

<style scoped>
.answer { --chat-input-bottom: var(--safe-bottom); }
.answer__new-chat { font-size: var(--font-size-caption); color: var(--color-primary); padding: 6px 0; white-space: nowrap; }
.answer__body { padding: 0 var(--page-padding) 150px; }
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
.answer__q-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.answer__q-tag {
  display: inline-block;
  font-size: 11px;
  color: #fff;
  background: var(--color-primary);
  border-radius: 6px;
  padding: 2px 8px;
}
.answer__q-edit {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  padding: 2px 7px;
  cursor: pointer;
}
.answer__q-edit:hover { color: var(--color-primary); border-color: var(--color-primary); }
.answer__q-edit:disabled { opacity: 0.5; cursor: not-allowed; }
.answer__q-text { font-weight: 500; }
.answer__q-imgs { display: flex; gap: 8px; margin-top: 8px; }
.answer__q-imgs img { width: 72px; height: 72px; object-fit: cover; border-radius: var(--radius-sm); }

/* 编辑问题：取消按钮 */
.edit-cancel {
  display: block;
  margin: 0 auto 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 0;
  cursor: pointer;
}
.edit-cancel:hover { color: var(--color-primary); }
.answer__content { user-select: text; -webkit-user-select: text; }
.answer__content--selecting { background: var(--color-primary-tint); border-radius: var(--radius-sm); }

/* 选中文字后的浮动工具条 */
.sel-toolbar {
  position: fixed;
  transform: translate(-50%, 0);
  display: flex;
  background: #1f2d27;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
  padding: 4px;
  z-index: 200;
}
.sel-toolbar::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: #1f2d27;
}
.sel-toolbar__btn {
  border: 0;
  background: transparent;
  color: #e8f0eb;
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 7px;
  white-space: nowrap;
}
.sel-toolbar__btn--primary { color: #9fe6c0; }
.sel-toolbar__btn:active { background: rgba(255, 255, 255, 0.12); }

/* 待发送引用块 */
.quote-chip {
  position: fixed;
  bottom: calc(104px + var(--safe-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 2 * var(--page-padding));
  max-width: var(--page-width);
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-primary-tint);
  border: 1px solid var(--color-primary-border, rgba(46, 109, 84, 0.2));
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  z-index: 99;
}
.quote-chip--plan { bottom: calc(64px + var(--safe-bottom)); }
.quote-chip__tag {
  flex: none;
  font-size: 11px;
  color: #fff;
  background: var(--color-primary);
  border-radius: 5px;
  padding: 2px 7px;
}
.quote-chip__text {
  flex: 1;
  font-size: 12.5px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.quote-chip__x {
  flex: none;
  border: 0;
  background: rgba(0, 0, 0, 0.08);
  color: var(--color-text-secondary);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
}

/* 追问输出方式选择条 */
.mode-bar {
  position: fixed;
  bottom: calc(58px + var(--safe-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 2 * var(--page-padding));
  max-width: var(--page-width);
  z-index: 100;
}
.mode-bar__toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--color-divider, #e3eae5);
  background: var(--color-card, #fff);
  border-radius: var(--radius-pill, 20px);
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0,0,0,.06));
  padding: 7px 13px;
}
.mode-bar__ico { flex: none; width: 15px; height: 15px; color: var(--color-primary); }
.mode-bar__label { flex: none; font-size: 12.5px; color: var(--color-text-secondary); }
.mode-bar__summary {
  flex: 1; text-align: left; font-size: 12.5px; color: var(--color-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.mode-bar__caret { flex: none; width: 14px; height: 14px; color: var(--color-text-secondary); transition: transform .18s; }
.mode-bar__panel {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  background: var(--color-card, #fff);
  border: 1px solid var(--color-divider, #e3eae5);
  border-radius: var(--radius-card, 12px);
  box-shadow: 0 10px 30px rgba(0,0,0,.14);
  padding: 12px;
  max-height: 46vh;
  overflow-y: auto;
}
.mode-chip {
  border: 1px solid var(--color-divider, #dfe7e2);
  background: var(--color-bg, #f6f8f7);
  color: var(--color-text-secondary);
  font-size: 12.5px;
  border-radius: var(--radius-pill, 16px);
  padding: 5px 12px;
  white-space: nowrap;
}
.mode-chip--on {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
.mode-chip:active { opacity: .85; }
.answer__content--serif { font-family: Georgia, "Songti SC", serif; }
.answer__content--underline { text-decoration: underline; }
.answer__content--italic { font-style: italic; }
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

/* 阶段三：专科专家徽章 */
.skill-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 10px 0 2px;
  padding: 4px 11px;
  font-size: 12px;
  color: var(--color-primary);
  background: var(--color-primary-tint);
  border: 1px solid var(--color-border-light);
  border-radius: 999px;
}
.skill-badge svg { flex-shrink: 0; }

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

/* 自我审校区块 */
.review-block {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(46, 109, 79, 0.22);
  background: rgba(46, 109, 79, 0.06);
}
.review-block__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  margin-bottom: 6px;
}
.review-block__list {
  margin: 0;
  padding-left: 18px;
  list-style: disc;
}
.review-block__list li {
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: 3px;
}
.review-block__details {
  margin-top: 6px;
  font-size: 11px;
  color: var(--color-text-caption);
}
.review-block__details summary { cursor: pointer; outline: none; }
.review-block__details ul {
  margin: 6px 0 0;
  padding-left: 16px;
  list-style: disc;
}
.review-block__details li {
  line-height: 1.6;
  margin-bottom: 3px;
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

/* 深度思考折叠区（R1 思维链，参考 DeepSeek） */
.reasoning-block {
  margin: 12px 0;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  background: #f6f8fb;
  overflow: hidden;
}
.reasoning-block__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  cursor: pointer;
  user-select: none;
}
.reasoning-block__icon { color: #6b7fd6; flex-shrink: 0; }
.reasoning-block__title {
  font-size: 13px;
  font-weight: 600;
  color: #5a6bb5;
}
.reasoning-block__dots { display: inline-flex; gap: 3px; margin-left: 2px; }
.reasoning-block__dots i {
  width: 4px; height: 4px; border-radius: 50%;
  background: #8a98d0;
  animation: reasoningBlink 1.2s infinite ease-in-out;
}
.reasoning-block__dots i:nth-child(2) { animation-delay: .2s; }
.reasoning-block__dots i:nth-child(3) { animation-delay: .4s; }
@keyframes reasoningBlink {
  0%, 80%, 100% { opacity: .25; }
  40% { opacity: 1; }
}
.reasoning-block__arrow {
  margin-left: auto;
  color: #9aa3c4;
  transition: transform .2s ease;
  flex-shrink: 0;
}
.reasoning-block__arrow.is-open { transform: rotate(180deg); }
.reasoning-block__body {
  padding: 2px 12px 11px;
  border-top: 1px dashed var(--color-border-light);
}
.reasoning-block__text {
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  max-height: 320px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
.reasoning-block__text p { margin: 6px 0; }

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
.offline-banner {
  margin: 8px 0 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff4e5;
  border: 1px solid #ffb86b;
  color: #9a4a00;
  font-size: 13px;
  line-height: 1.6;
}
</style>
