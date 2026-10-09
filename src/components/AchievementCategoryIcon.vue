<template>
  <span
    class="cat-icon"
    :class="variant"
    :role="ariaLabel ? 'img' : undefined"
    :aria-label="ariaLabel || undefined"
  >
    <svg
      class="cat-icon__svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.6"
      preserveAspectRatio="xMidYMid meet"
      v-html="svgContent"
    ></svg>
  </span>
</template>

<script setup>
import { computed } from "vue";
import { CATEGORY_ICON_SVGS, CATEGORY_TO_ICON_KEY } from "../constants/achievementIcons.js";

const props = defineProps({
  category: { type: String, required: true }, // all / streak / subject / plan / knowledge / specialty / ai
  variant: {
    // plain: Segmented 默认色，inverse: hero 卡片白色前景，active: Segmented 激活态白字
    type: String,
    default: "plain",
    validator: (v) => ["plain", "active", "inverse"].includes(v),
  },
  ariaLabel: { type: String, default: "" },
});

const svgContent = computed(() => {
  const key = CATEGORY_TO_ICON_KEY[props.category] || "all";
  return CATEGORY_ICON_SVGS[key] || CATEGORY_ICON_SVGS.all;
});
</script>

<style scoped>
.cat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.cat-icon__svg {
  width: 100%;
  height: 100%;
  stroke: currentColor;
  fill: none;
}

/* 分类图标里带 [fill] 的小圆点、小花瓣（例如「全部」六瓣、「学习天数」小圆）统一 inherit fill，让它用 currentColor，保持设计一致 */
.cat-icon__svg [fill="currentColor"] {
  fill: currentColor;
}

/* ---------- 三态配色（复用项目色变量） ---------- */
/* 1) plain：未选中分段控件 / 一般文本 secondary（青灰墨绿过渡） */
.cat-icon.plain {
  color: #6a8f78;            /* 墨绿偏灰一点，跟未选中 secondary 文字协调 */
}

/* 2) active：Segmented 选中（白色前景） */
.cat-icon.active {
  color: #ffffff;
}

/* 3) inverse：Hero 卡片（半透明白前景色 92% 白） */
.cat-icon.inverse {
  color: rgba(255, 255, 255, 0.92);
}
</style>
