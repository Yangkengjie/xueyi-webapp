<template>
  <Teleport to="body">
    <!-- 点击外部关闭 -->
    <div v-if="open" class="fs-mask" @click="close"></div>

    <div class="fs-root" :style="{ top: y + 'px' }">
      <transition name="fs-pop">
        <div v-if="open" class="fs-panel" @click.stop>
          <!-- ① 快速提问：迷你输入框，提交后跳答疑（DeepSeek） -->
          <form class="fs-ask" @submit.prevent="quickAsk">
            <input
              v-model="askText"
              class="fs-ask__input"
              type="text"
              placeholder="直接提问，学伴为你解答…"
            />
            <button class="fs-ask__btn" type="submit" :disabled="!askText.trim()" title="提问">
              <Send :size="16" />
            </button>
          </form>

          <div class="fs-menu">
            <!-- ② 学习规划：跳推演规划 tab（Kimi） -->
            <button class="fs-item" @click="goPlan">
              <ClipboardMinus :size="17" color="#2f7a45" />
              <span class="fs-item__label">学习规划</span>
              <ChevronRight :size="15" class="fs-item__arrow" />
            </button>

            <!-- ③ 今日智能建议：调 DeepSeek，面板内展开 -->
            <button class="fs-item" @click="toggleAdvice">
              <Lightbulb :size="17" color="#2f7a45" />
              <span class="fs-item__label">今日智能建议</span>
              <span v-if="adviceLoading" class="fs-item__state">生成中</span>
              <ChevronRight :size="15" class="fs-item__arrow" :class="{ 'is-dn': showAdvice }" />
            </button>
            <div v-if="showAdvice" class="fs-advice">
              <p v-if="adviceLoading" class="fs-advice__tip">正在结合你的学习情况生成…</p>
              <p v-else-if="!adviceList.length" class="fs-advice__tip">暂无建议，请稍后再试</p>
              <div v-for="a in adviceList" :key="a.id" class="fs-advice__card">
                <p class="fs-advice__title">{{ a.title }}</p>
                <p class="fs-advice__content">{{ a.content }}</p>
              </div>
            </div>

            <!-- ④ 继续上次学习：回最近一次对话 -->
            <button class="fs-item" @click="continueLast">
              <History :size="17" color="#2f7a45" />
              <span class="fs-item__label">继续上次学习</span>
              <ChevronRight :size="15" class="fs-item__arrow" />
            </button>

            <!-- ⑤ 学习数据：周报 / 历程 -->
            <button class="fs-item" @click="toggleData">
              <BarChart3 :size="17" color="#2f7a45" />
              <span class="fs-item__label">学习数据</span>
              <ChevronRight :size="15" class="fs-item__arrow" :class="{ 'is-dn': showData }" />
            </button>
            <div v-if="showData" class="fs-sub">
              <button class="fs-sub__btn" @click="go('weeklyReport')">学习周报</button>
              <button class="fs-sub__btn" @click="go('journey')">学习历程</button>
            </div>
          </div>
        </div>
      </transition>

      <!-- 悬浮按钮：点击展开，可上下拖动 -->
      <button
        class="fs-fab"
        :class="{ 'is-drag': dragging }"
        title="快捷助手"
        @click="onFabClick"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
      >
        <Sparkles v-if="!open" :size="23" />
        <X v-else :size="23" />
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  Sparkles, Send, ClipboardMinus, Lightbulb, History, BarChart3, ChevronRight, X,
} from "@lucide/vue";
import {
  createConversation, addMessage, saveConversation, getConversations,
} from "../utils/chatStore";
import { getSmartAdvice } from "../api/study";

const router = useRouter();
const open = ref(false);
const askText = ref("");

/* ---- 悬浮位置与拖动 ---- */
const MIN_TOP = 120, EDGE = 64;
const y = ref(Math.min(window.innerHeight - 160, Math.round(window.innerHeight * 0.62)));
const dragging = ref(false);
let pressing = false, moved = false, startY = 0, startTop = 0;

function onDown(e) {
  pressing = true; moved = false;
  startY = e.clientY; startTop = y.value;
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
}
function onMove(e) {
  if (!pressing) return;
  const dy = e.clientY - startY;
  if (Math.abs(dy) > 6) { moved = true; dragging.value = true; }
  if (moved) {
    const max = window.innerHeight - EDGE;
    y.value = Math.min(max, Math.max(MIN_TOP, startTop + dy));
  }
}
function onUp() { pressing = false; setTimeout(() => { dragging.value = false; }, 0); }
function onFabClick() { if (!moved) toggleOpen(); }

function toggleOpen() { open.value = !open.value; }
function close() { open.value = false; showAdvice.value = false; showData.value = false; }

/* ---- ① 快速提问：复用答疑首次发送流程 ---- */
function quickAsk() {
  const question = askText.value.trim();
  if (!question) return;
  const conv = createConversation({ question, mode: "qa" });
  addMessage(conv, "user", question, { images: [] });
  conv.pendingAnswer = true;
  conv.pendingQuestion = question;
  conv.pendingImages = [];
  conv.pendingModes = [];
  conv.pendingMode = "qa";
  saveConversation(conv);
  askText.value = "";
  close();
  router.push({ name: "answer", params: { id: conv.id } });
}

/* ---- ② 学习规划 ---- */
function goPlan() {
  close();
  router.push({ name: "tutor", query: { tab: "plan" } });
}

/* ---- ③ 今日智能建议 ---- */
const showAdvice = ref(false);
const adviceLoading = ref(false);
const adviceList = ref([]);
async function toggleAdvice() {
  if (showAdvice.value) { showAdvice.value = false; return; }
  showAdvice.value = true;
  showData.value = false;
  if (!adviceList.value.length) {
    adviceLoading.value = true;
    try {
      const r = await getSmartAdvice("study");
      adviceList.value = r.data || [];
    } catch (_) { adviceList.value = []; }
    adviceLoading.value = false;
  }
}

/* ---- ④ 继续上次学习 ---- */
function continueLast() {
  const list = getConversations();
  close();
  if (list && list.length) {
    router.push({ name: "answer", params: { id: list[0].id } });
  } else {
    router.push({ name: "history" });
  }
}

/* ---- ⑤ 学习数据 ---- */
const showData = ref(false);
function toggleData() {
  showData.value = !showData.value;
  showAdvice.value = false;
}
function go(name) { close(); router.push({ name }); }
</script>

<style scoped>
.fs-mask { position: fixed; inset: 0; z-index: 8990; background: transparent; }
.fs-root {
  position: fixed; right: 16px; z-index: 9000;
  display: flex; flex-direction: column; align-items: flex-end; gap: 12px;
}

/* 悬浮按钮 */
.fs-fab {
  width: 52px; height: 52px; border-radius: 50%; border: none; cursor: pointer;
  background: linear-gradient(135deg, #2f7a45, #266636); color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 22px rgba(38, 102, 54, .38);
  transition: transform .15s ease;
  touch-action: none;
}
.fs-fab:active { transform: scale(.93); }
.fs-fab.is-drag { transition: none; }

/* 展开面板 */
.fs-panel {
  width: 258px; background: #fff; border-radius: 16px; overflow: hidden;
  box-shadow: 0 14px 42px rgba(0, 0, 0, .16); border: 1px solid #edf1ee;
}

/* 迷你提问框 */
.fs-ask { display: flex; gap: 8px; padding: 12px; border-bottom: 1px solid #f0f3f0; }
.fs-ask__input {
  flex: 1; min-width: 0; border: 1px solid #e4eae5; border-radius: 10px;
  padding: 9px 11px; font-size: 13px; outline: none; background: #fafbfa;
}
.fs-ask__input:focus { border-color: #266636; background: #fff; }
.fs-ask__btn {
  width: 37px; flex: 0 0 auto; border: none; border-radius: 10px;
  background: #266636; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.fs-ask__btn:disabled { opacity: .4; }

/* 菜单 */
.fs-menu { padding: 6px; }
.fs-item {
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 10px 8px; border: none; background: transparent; cursor: pointer;
  border-radius: 10px; color: #333;
}
.fs-item:active { background: #f2f6f3; }
.fs-item__label { flex: 1; text-align: left; font-size: 14px; }
.fs-item__state { font-size: 11px; color: #9aa59d; }
.fs-item__arrow { color: #b3bdb5; transition: transform .2s ease; }
.fs-item__arrow.is-dn { transform: rotate(90deg); }

/* 建议卡片 */
.fs-advice { padding: 0 8px 8px; }
.fs-advice__tip { font-size: 12px; color: #9aa59d; padding: 6px 4px; margin: 0; }
.fs-advice__card { background: #f4f8f5; border-radius: 10px; padding: 9px 11px; margin-top: 7px; }
.fs-advice__title { font-size: 13px; font-weight: 600; color: #266636; margin: 0; }
.fs-advice__content { font-size: 12px; color: #555; line-height: 1.6; margin: 4px 0 0; }

/* 学习数据子项 */
.fs-sub { display: flex; gap: 8px; padding: 0 8px 8px; }
.fs-sub__btn {
  flex: 1; padding: 9px; border: 1px solid #e4eae5; background: #fff;
  border-radius: 10px; font-size: 12.5px; color: #333; cursor: pointer;
}
.fs-sub__btn:active { background: #f2f6f3; }

/* 展开动画 */
.fs-pop-enter-active, .fs-pop-leave-active { transition: all .18s ease; }
.fs-pop-enter-from, .fs-pop-leave-to { opacity: 0; transform: translateY(8px) scale(.97); }
</style>
