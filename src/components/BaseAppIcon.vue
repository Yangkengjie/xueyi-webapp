<template>
  <span
    class="bicon"
    :class="`bicon--${size}`"
    :role="ariaLabel ? 'img' : undefined"
    :aria-label="ariaLabel || undefined"
    :aria-hidden="ariaLabel ? undefined : 'true'"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      preserveAspectRatio="xMidYMid meet"
      :width="svgSize"
      :height="svgSize"
      :style="{ color: color || 'currentColor' }"
      :stroke-width="strokeWidth"
      v-html="svgContent"
    ></svg>
  </span>
</template>

<script setup>
import { computed } from "vue";
import { BASE_ICON_SVGS } from "../constants/iconMappings.js";

const props = defineProps({
  type: { type: String, required: true },
  size: {
    type: String,
    default: "md",
    // xs=14 / sm=16 / md=18 / lg=22 / xl=28 / xxl=36
    validator: (v) => ["xs", "sm", "md", "lg", "xl", "xxl"].includes(v),
  },
  color: { type: String, default: "" }, // 空=currentColor，由父级 color 决定（选中/未选中自动跟随）
  ariaLabel: { type: String, default: "" },
  strokeWidth: { type: [Number, String], default: 1.6 },
});

const svgContent = computed(
  () => BASE_ICON_SVGS[props.type] || BASE_ICON_SVGS.statCourse
);

const svgSize = computed(() => {
  switch (props.size) {
    case "xs": return 14;
    case "sm": return 16;
    case "md": return 18;
    case "lg": return 22;
    case "xl": return 28;
    case "xxl": return 36;
    default: return 18;
  }
});
</script>

<style scoped>
.bicon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}
.bicon svg {
  display: block;
  stroke: currentColor;
  fill: none;
}
.bicon svg [fill="currentColor"] {
  fill: currentColor;
}
</style>
