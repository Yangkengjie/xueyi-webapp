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
        <input
          v-model="text"
          class="chat-input__field"
          :placeholder="placeholder"
          @keyup.enter="submit"
        />
      </div>
      <button
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
import { ref, computed } from "vue";

const props = defineProps({
  placeholder: { type: String, default: "输入信息……" },
});

const emit = defineEmits(["send"]);

const text = ref("");
const images = ref([]); // [{url, file}]
const fileInput = ref(null);

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
};

/* 供外部（如 TutorView 点选快捷问题卡片）注入问题文本 */
const setText = (value) => {
  text.value = String(value || "");
};
const clear = () => {
  text.value = "";
  images.value.forEach((i) => URL.revokeObjectURL(i.url));
  images.value = [];
};
defineExpose({ setText, clear });
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
  align-items: center;
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
  font-size: var(--font-size-body);
  color: var(--color-text);
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
</style>
