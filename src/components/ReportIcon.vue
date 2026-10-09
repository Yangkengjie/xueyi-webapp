<template>
  <span
    class="ricon"
    :class="[
      `ricon--${size}`,
      `ricon--${variant}`,
      { 'ricon--strong': strong },
    ]"
    :role="ariaLabel ? 'img' : undefined"
    :aria-label="ariaLabel || undefined"
    :aria-hidden="ariaLabel ? undefined : 'true'"
  >
    <span class="ricon__badge">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        preserveAspectRatio="xMidYMid meet"
        :width="svgSize"
        :height="svgSize"
        :stroke-width="strokeWidth"
        v-html="svgContent"
      ></svg>
    </span>
  </span>
</template>

<script setup>
import { computed } from "vue";
import { REPORT_ICON_SVGS } from "../constants/iconMappings.js";

const props = defineProps({
  // daily / weekly / monthly
  reportType: {
    type: String,
    required: true,
    validator: (v) => ["daily", "weekly", "monthly"].includes(v),
  },
  // sm=20（按钮内用）, md=24（学习报告 3 格入口）, lg=28（个人页入口卡）
  size: { type: String, default: "md", validator: (v) => ["sm", "md", "lg"].includes(v) },
  // plain: 透明底用 currentColor；card: 浅绿底墨绿线（课程墙 3 格入口卡片默认）
  variant: { type: String, default: "card", validator: (v) => ["plain", "card"].includes(v) },
  strong: { type: Boolean, default: false },
  ariaLabel: { type: String, default: "" },
  strokeWidth: { type: [Number, String], default: 1.6 },
});

const svgContent = computed(
  () => REPORT_ICON_SVGS[props.reportType] || REPORT_ICON_SVGS.daily
);

const svgSize = computed(() => (props.size === "sm" ? 20 : props.size === "lg" ? 28 : 24));
</script>

<style scoped>
.ricon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}
.ricon__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
.ricon svg {
  display: block;
  stroke: currentColor;
  fill: none;
}
.ricon svg [fill="currentColor"] {
  fill: currentColor;
}
/* variant=card：淡米白/淡绿卡底 + 墨绿线条（收敛不花哨）*/
.ricon--card .ricon__badge {
  background: #eaf3ec;
  padding: 8px;
}
.ricon--card.ricon--md .ricon__badge {
  width: 44px;
  height: 44px;
}
.ricon--card.ricon--lg .ricon__badge {
  width: 52px;
  height: 52px;
}
.ricon--card.ricon--sm .ricon__badge {
  width: 36px;
  height: 36px;
  padding: 6px;
}
.ricon--card {
  color: #266636; /* 墨绿 */
}
.ricon--card.ricon--strong {
  color: #1f5c38;
}
/* variant=plain：无底，纯 SVG */
.ricon--plain {
  color: #37684a;
}
.ricon--plain.ricon--strong {
  color: var(--color-primary, #266636);
}
</style>
