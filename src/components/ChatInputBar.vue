<template>
  <!-- 推演输入栏：图片附件 + 圆角输入框 + 发送按钮（新版设计稿） -->
  <div class="chat-input">
    <!-- 已选图片缩略图 -->
    <div v-if="images.length" class="chat-input__images">
      <div v-for="(img, i) in images" :key="i" class="chat-input__thumb">
        <img :src="img.url" alt="附件" />
        <button class="chat-input__thumb-x" aria-label="移除图片" @click="removeImage(i)">×</button>
      </div>
    </div>

    <div class="chat-input__row">
      <button class="chat-input__btn" aria-label="选择图片" @click="fileInput.click()">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m4.5 17 4.5-4.5 3.5 3.5 3-3 4 4" />
        </svg>
      </button>
      <div class="chat-input__box">
        <textarea
          ref="fieldRef"
          v-model="text"
          class="chat-input__field"
          rows="1"
          :placeholder="placeholder"
          @input="autoResize"
          @keydown="onKeydown"
        ></textarea>
      </div>
      <!-- 生成中：发送按钮变为"停止"按钮（参考 DeepSeek），点击中断生成 -->
      <button
        v-if="generating"
        class="chat-input__btn chat-input__stop"
        aria-label="停止生成"
        @click="onStop"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <rect x="6.5" y="6.5" width="11" height="11" rx="2.5" />
        </svg>
      </button>
      <button
        v-else
        class="chat-input__btn chat-input__send"
        :class="{ 'chat-input__send--ready': canSend }"
        aria-label="发送"
        @click="submit"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="m22 2-7 20-4-9-9-4 20-7z" />
          <path d="M22 2 11 13" />
        </svg>
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      multiple
      hidden
      @change="onPick"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";

const props = defineProps({
  placeholder: { type: String, default: "输入信息……" },
  /* 是否正在生成（流式）：为 true 时显示"停止"按钮 */
  generating: { type: Boolean, default: false },
});

const emit = defineEmits(["send", "stop"]);

const onStop = () => emit("stop");

/* 供外部聚焦输入框（编辑问题时） */
const focus = () => {
  nextTick(() => {
    fieldRef.value?.focus();
    fieldRef.value?.setSelectionRange(text.value.length, text.value.length);
  });
};

const text = ref("");
const images = ref([]); // [{url, file}]
const fileInput = ref(null);
const fieldRef = ref(null);

/* 输入框随内容自动增高，到上限（约 5 行）后内部滚动——类似微信 */
const MAX_TEXTAREA_H = 120;
const autoResize = () => {
  const el = fieldRef.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, MAX_TEXTAREA_H) + "px";
  el.style.overflowY = el.scrollHeight > MAX_TEXTAREA_H ? "auto" : "hidden";
};
/* Enter 发送、Shift+Enter 换行；中文输入法组词中（isComposing）不发送 */
const onKeydown = (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    submit();
  }
};

const canSend = computed(() => text.value.trim() || images.value.length);

const onPick = (e) => {
  for (const file of e.target.files) {
    images.value.push({ url: URL.createObjectURL(file), file });
  }
  e.target.value = "";
};

const removeImage = (i) => {
  URL.revokeObjectURL(images.value[i].url);
  images.value.splice(i, 1);
};

const submit = () => {
  const value = text.value.trim();
  if (!value && !images.value.length) return;
  emit("send", { text: value, images: images.value.map((i) => i.url) });
  text.value = "";
  images.value = [];
  nextTick(autoResize);
};

/* 供外部（如 TutorView 点选快捷问题卡片）注入问题文本 */
const setText = (value) => {
  text.value = String(value || "");
  nextTick(autoResize);
};
const clear = () => {
  text.value = "";
  images.value.forEach((i) => URL.revokeObjectURL(i.url));
  images.value = [];
};
defineExpose({ setText, clear, focus });
</script>

<style scoped>
.chat-input {
  position: fixed;
  /* 页面可通过 --chat-input-bottom 抬高输入栏（如避开 TabBar） */
  bottom: var(--chat-input-bottom, 0px);
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--page-width);
  padding: 8px var(--page-padding) calc(8px + var(--safe-bottom));
  background: var(--color-bg);
  z-index: 100;
}

.chat-input__images {
  display: flex;
  gap: 8px;
  padding: 4px 2px 8px;
}

.chat-input__thumb {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  overflow: visible;
}
.chat-input__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-sm);
}
.chat-input__thumb-x {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-input__row {
  display: flex;
  align-items: flex-end;   /* 多行输入时图片/发送按钮贴底 */
  gap: 10px;
}

.chat-input__box {
  flex: 1;
  background: var(--color-card);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-card);
  padding: 10px 16px;
}

.chat-input__field {
  width: 100%;
  display: block;
  font-size: var(--font-size-body);
  line-height: 1.5;
  color: var(--color-text);
  font-family: inherit;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
}

.chat-input__field::placeholder {
  color: var(--color-text-caption);
}

.chat-input__btn {
  display: flex;
  padding: 4px;
  color: var(--color-text-secondary);
}

.chat-input__send--ready {
  color: var(--color-primary);
}

/* 停止生成按钮：醒目方形 */
.chat-input__stop {
  color: var(--color-text-primary, #2b2f38);
  padding: 5px;
  animation: stopPulse 1.8s ease-in-out infinite;
}
@keyframes stopPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.55; }
}
</style>
