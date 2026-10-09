<template>
  <!-- 分段选择器：答疑/规划、收藏评论/AI回答、学习模式/备考模式 -->
  <div class="seg" :class="{ 'seg--pill': pill, 'seg--scroll': scroll }">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="seg__item"
      :class="{ 'seg__item--active': modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
    >
      <template v-if="opt.renderLabel">
        <component :is="opt.renderLabel" />
      </template>
      <template v-else>{{ opt.label }}</template>
    </button>
  </div>
</template>

<script setup>
defineProps({
  options: { type: Array, required: true }, // [{label, value, renderLabel?: () => VNode}]
  modelValue: { type: String, required: true },
  pill: { type: Boolean, default: false }, // 首页模式切换的胶囊描边样式
  scroll: { type: Boolean, default: false }, // 分类多时支持横向滚动（不压缩文字）
});
defineEmits(["update:modelValue"]);
</script>

<style scoped>
/* UI参数（推演）：外 348×42.67，内 171×33 */
.seg {
  display: flex;
  background: var(--color-input-bg);
  border-radius: var(--radius-sm);
  padding: 5px;
  gap: 2px;
}

.seg__item {
  flex: 1;
  min-width: 0;
  height: 33px;
  text-align: center;
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  border-radius: 6px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 8px;
  white-space: nowrap;
}

.seg__item--active {
  background: var(--color-primary);
  color: #fff;
  font-weight: 500;
}

/* 横向滚动分类（不压缩文字）— 注意：外层 wrap 已接管真滚动权限，这里只负责 max-content 宽 + 不换行 */
.seg--scroll {
  flex-wrap: nowrap;
  overflow: visible; /* 不做内层滚动，交给外层 .achv__seg-wrap */
  min-width: 100%;
  width: max-content;
}
.seg--scroll .seg__item {
  flex: 0 0 auto;
  min-width: unset;
  padding: 0 10px;
}

/* 胶囊描边变体（首页模式切换）：外 327×52 r20，内 153×40 r16 */
.seg--pill {
  background: var(--color-card);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-toggle-outer);
  padding: 6px;
}
.seg--pill .seg__item {
  border-radius: var(--radius-toggle-inner);
  height: 40px;
}
.seg--pill .seg__item--active {
  background: var(--color-card);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  font-weight: 600;
}
</style>
