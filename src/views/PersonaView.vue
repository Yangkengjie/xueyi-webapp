<template>
  <PlainLayout title="学习者画像">
    <template v-if="stage === 'intro'">
      <AppCard title="我的学习者画像">
        <PersonaRadar :axes="personaData.axes" :values="personaData.values" />
        <p class="persona__type"><b>当前类型：</b>{{ personaData.type }}</p>
        <p class="persona__desc">{{ personaData.description }}</p>

        <div class="persona__section">
          <p class="persona__sec-title">优势能力</p>
          <div class="persona__tags">
            <span v-for="(s, i) in personaData.strengths" :key="i" class="persona__tag persona__tag--good">{{ s }}</span>
          </div>
        </div>
        <div class="persona__section">
          <p class="persona__sec-title">待提升项</p>
          <div class="persona__tags">
            <span v-for="(w, i) in personaData.weaknesses" :key="i" class="persona__tag persona__tag--warn">{{ w }}</span>
          </div>
        </div>
        <div class="persona__section">
          <p class="persona__sec-title">AI 学习建议</p>
          <ul class="persona__rec-list">
            <li v-for="(r, i) in personaData.recommendations" :key="i">{{ r }}</li>
          </ul>
        </div>

        <div class="persona__btns">
          <button class="persona__btn persona__btn--primary" :disabled="starting" @click="startTest">
            {{ starting ? '准备中...' : '重新测试' }}
          </button>
          <button class="persona__btn" :disabled="historyLoading" @click="openHistory">
            {{ historyLoading ? '加载中...' : '测试历史' }}
          </button>
        </div>
      </AppCard>
    </template>

    <template v-else-if="stage === 'test'">
      <AppCard :title="`第 ${curIdx + 1} / ${questions.length} 题`">
        <div v-if="testLoading" class="skeleton-list">
          <div class="skeleton-item" style="height:20px"></div>
          <div class="skeleton-item" style="height:14px;width:70%"></div>
          <div class="skeleton-item" style="height:36px"></div>
          <div class="skeleton-item" style="height:36px"></div>
        </div>
        <template v-else>
          <p class="q__title">{{ curQuestion?.title }}</p>
          <p class="q__hint text-caption">请选择最符合你习惯的一项</p>
          <div class="q__opt">
            <button
              v-for="o in curQuestion?.options || []"
              :key="o.key"
              class="q__opt-btn"
              :class="{ 'q__opt-btn--on': answers[curQuestion.id] === o.key }"
              :aria-pressed="answers[curQuestion.id] === o.key"
              :disabled="submitting"
              @click="pickOption(o.key)"
            >
              <span class="q__opt-key">{{ o.key }}</span>
              <span class="q__opt-text">{{ o.text }}</span>
            </button>
          </div>
          <div class="q__nav">
            <button class="q__nav-btn" :disabled="curIdx === 0 || submitting" @click="prev">上一题</button>
            <button
              v-if="curIdx < questions.length - 1"
              class="q__nav-btn q__nav-btn--primary"
              :disabled="!answers[curQuestion?.id] || submitting"
              @click="next"
            >下一题</button>
            <button
              v-else
              class="q__nav-btn q__nav-btn--primary"
              :disabled="answeredCount < questions.length || submitting"
              @click="submitTest"
            >
              {{ submitting ? '提交中...' : '提交测试' }}
            </button>
          </div>
          <p class="q__progress text-caption">已答 {{ answeredCount }} / {{ questions.length }} · 用时 {{ formatDuration(testSecElapsed) }}</p>
        </template>
      </AppCard>
    </template>

    <template v-else-if="stage === 'result'">
      <AppCard title="画像测试结果">
        <div v-if="calcLoading" class="skeleton-list">
          <div class="skeleton-item" style="height:180px"></div>
        </div>
        <template v-else>
          <p class="result__head">本次画像：<b>{{ personaData.type }}</b></p>
          <PersonaRadar :axes="personaData.axes" :values="personaData.values" />
          <p class="persona__desc">{{ personaData.description }}</p>
          <p class="result__meta text-caption">答题 {{ questions.length }} 道 · 用时 {{ formatDuration(lastDurationSec) }} · 综合得分 {{ lastScore }}</p>
          <div class="persona__btns">
            <button class="persona__btn persona__btn--primary" @click="backIntro">查看完整画像</button>
            <button class="persona__btn" @click="openHistory">查看历史记录</button>
          </div>
        </template>
      </AppCard>
    </template>

    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="showHistory" class="sheet-mask" @click.self="showHistory = false" @keydown.esc="showHistory = false" tabindex="-1">
          <div class="sheet sheet--history" role="dialog" aria-modal="true">
            <button class="sheet__close" aria-label="关闭" @click="showHistory = false">×</button>
            <p class="sheet__date">测试历史记录</p>
            <p class="sheet__sub text-caption">共 {{ historyList.length }} 次测试</p>
            <div v-if="!historyList.length" class="empty-state">
              <p class="empty-state__text">暂无历史记录</p>
            </div>
            <div v-for="h in historyList" :key="h.id" class="history-item">
              <div class="history-item__head">
                <span class="history-item__type">{{ h.type }}</span>
                <span class="text-caption">{{ h.date }}</span>
              </div>
              <p class="history-item__detail">
                答题 {{ h.totalQuestions }} 题 · 用时 {{ h.duration }} 分钟 · 得分 {{ h.score }}
              </p>
              <div class="history-item__radar">
                <PersonaRadar :axes="personaData.axes" :values="h.values" size="sm" />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </PlainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";
import PlainLayout from "../layouts/PlainLayout.vue";
import AppCard from "../components/AppCard.vue";
import PersonaRadar from "../components/PersonaRadar.vue";
import * as personaApi from "../api/persona";
import { toast, showLoading, hideLoading } from "../utils/feedback";

const route = useRoute();

const stage = ref("intro"); // intro | test | result
const showHistory = ref(false);

const personaData = ref({
  axes: ["记忆型", "理解型", "应用型", "分析型"],
  values: [0.75, 0.9, 0.6, 0.8],
  type: "体系构建师",
  description: "理解型得分最高，擅长把知识点连成体系；建议多通过案例与图谱巩固应用能力。",
  strengths: ["知识体系构建能力强", "概念理解深入", "逻辑思维清晰"],
  weaknesses: ["应用实践需加强", "记忆细节可提升"],
  recommendations: ["多做案例分析题", "使用知识图谱建立关联", "定期做记忆强化训练"],
});

const questions = ref([]);
const answers = ref({});
const curIdx = ref(0);
const testLoading = ref(false);
const starting = ref(false);
const submitting = ref(false);
const calcLoading = ref(false);
const historyLoading = ref(false);

const testStartAt = ref(0);
const testSecElapsed = ref(0);
const lastDurationSec = ref(0);
const lastScore = ref(0);
const historyList = ref([]);

let timerHandle = 0;

const curQuestion = computed(() => questions.value[curIdx.value]);
const answeredCount = computed(() => Object.keys(answers.value).length);

async function loadPersona() {
  const res = await personaApi.getPersona();
  if (res.code === 200) personaData.value = { ...personaData.value, ...res.data };
}

async function loadHistory() {
  historyLoading.value = true;
  try {
    const res = await personaApi.getPersonaHistory();
    if (res.code === 200) historyList.value = res.data;
  } finally {
    historyLoading.value = false;
  }
}

async function openHistory() {
  showHistory.value = true;
  if (!historyList.value.length) await loadHistory();
}

async function startTest() {
  if (starting.value) return;
  starting.value = true;
  testLoading.value = true;
  try {
    const res = await personaApi.getTestQuestions();
    if (res.code === 200) {
      questions.value = res.data.questions;
      answers.value = {};
      curIdx.value = 0;
      testStartAt.value = Date.now();
      testSecElapsed.value = 0;
      stage.value = "test";
      startTimer();
    }
  } finally {
    starting.value = false;
    testLoading.value = false;
  }
}

function startTimer() {
  if (timerHandle) clearInterval(timerHandle);
  timerHandle = setInterval(() => {
    testSecElapsed.value = Math.floor((Date.now() - testStartAt.value) / 1000);
  }, 1000);
}

function stopTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = 0;
  }
}

function pickOption(key) {
  if (!curQuestion.value) return;
  answers.value[curQuestion.value.id] = key;
}

function prev() {
  if (curIdx.value > 0) curIdx.value -= 1;
}

function next() {
  if (curIdx.value < questions.value.length - 1) curIdx.value += 1;
}

async function submitTest() {
  if (submitting.value) return;
  if (answeredCount.value < questions.value.length) {
    toast(`请完成全部 ${questions.value.length} 道题目`);
    return;
  }
  submitting.value = true;
  stopTimer();
  lastDurationSec.value = testSecElapsed.value;
  try {
    calcLoading.value = true;
    const res = await personaApi.submitPersonaTest(answers.value, testSecElapsed.value);
    if (res.code === 200) {
      personaData.value = { ...personaData.value, ...res.data.persona };
      lastScore.value = res.data.score;
      stage.value = "result";
      toast("画像已更新，历史记录已保存");
      loadHistory();
    } else {
      toast(res.msg || "提交失败");
    }
  } finally {
    submitting.value = false;
    calcLoading.value = false;
  }
}

function backIntro() {
  stage.value = "intro";
}

function formatDuration(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${rest.toString().padStart(2, "0")}`;
}

watch(
  () => route.query.tab,
  (v) => {
    if (v === "retest") startTest();
    else if (v === "history") openHistory();
  }
);

onMounted(async () => {
  await Promise.all([loadPersona(), loadHistory()]);
  if (route.query.tab === "retest") startTest();
  else if (route.query.tab === "history") openHistory();
});

onBeforeUnmount(() => {
  stopTimer();
});
</script>

<style scoped>
.persona__type {
  margin-top: 10px;
  font-size: 14px;
  padding: 0 2px;
}
.persona__desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.8;
  padding: 4px 2px 8px;
}
.persona__section {
  margin-top: 12px;
  padding: 0 2px;
}
.persona__sec-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
}
.persona__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.persona__tag {
  font-size: 12px;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  background: var(--color-input-bg);
}
.persona__tag--good {
  background: var(--color-primary-tint);
  color: var(--color-primary);
}
.persona__tag--warn {
  background: #fef3c7;
  color: #92400e;
}
.persona__rec-list {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.9;
  padding-left: 18px;
  list-style: decimal;
}
.persona__btns {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.persona__btn {
  flex: 1;
  padding: 10px 0;
  border-radius: var(--radius-pill);
  background: var(--color-input-bg);
  color: var(--color-text-secondary);
  font-size: 14px;
}
.persona__btn:disabled {
  opacity: 0.6;
}
.persona__btn--primary {
  background: var(--color-primary);
  color: #fff;
}

.q__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.7;
}
.q__hint {
  margin: 4px 0 14px;
}
.q__opt {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.q__opt-btn {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  text-align: left;
  padding: 10px 12px;
  border-radius: var(--radius-card);
  background: var(--color-input-bg);
  border: 1.5px solid transparent;
  font-size: 14px;
  line-height: 1.6;
}
.q__opt-btn--on {
  background: var(--color-primary-tint);
  border-color: var(--color-primary);
}
.q__opt-btn:disabled {
  opacity: 0.7;
}
.q__opt-key {
  flex: 0 0 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  border: 1.5px solid var(--color-divider);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
}
.q__opt-btn--on .q__opt-key {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
.q__opt-text {
  flex: 1;
}
.q__nav {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}
.q__nav-btn {
  flex: 1;
  padding: 10px 0;
  border-radius: var(--radius-pill);
  background: var(--color-input-bg);
  color: var(--color-text-secondary);
  font-size: 14px;
}
.q__nav-btn--primary {
  background: var(--color-primary);
  color: #fff;
}
.q__nav-btn:disabled {
  opacity: 0.55;
}
.q__progress {
  margin-top: 8px;
}

.result__head {
  font-size: 15px;
  margin-bottom: 6px;
}
.result__meta {
  margin: 10px 0 4px;
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
  position: relative;
  width: 100%;
  max-width: var(--page-width);
  max-height: 85vh;
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

.empty-state {
  padding: 24px 0;
  text-align: center;
}
.empty-state__text {
  font-size: 13px;
  color: var(--color-text-caption);
}

.history-item {
  padding: 12px;
  background: var(--color-input-bg);
  border-radius: var(--radius-card);
  margin-bottom: 10px;
}
.history-item__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.history-item__type {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-primary);
}
.history-item__detail {
  font-size: 12px;
  color: var(--color-text-caption);
  margin-top: 4px;
}
.history-item__radar {
  margin-top: 8px;
  padding: 0 24px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px 0;
}
.skeleton-item {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 4px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
