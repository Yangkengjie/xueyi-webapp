<template>
  <span
    class="cicon"
    :class="`cicon--${size}`"
    :style="containerStyle"
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
      :stroke-width="strokeWidth"
      :style="{ color: fgColor }"
      v-html="svgContent"
    ></svg>
  </span>
</template>

<script setup>
import { computed } from "vue";
import {
  resolveCourseKey,
  getCourseTheme,
  getCourseShape,
} from "../constants/iconMappings.js";

const props = defineProps({
  // 课程对象 { name?, courseId? } 或直接 name 字符串
  course: { type: [Object, String], default: "" },
  // 直接给 key 也可（跳过 resolve）
  courseKey: { type: String, default: "" },
  // sm=20（继续学习小标）, md=28（课程墙）, lg=32（课程墙大卡）
  size: { type: String, default: "md", validator: (v) => ["sm", "md", "lg"].includes(v) },
  // soft=只画图标无色底（继续学习）；card=带淡色底（课程墙）
  variant: { type: String, default: "card", validator: (v) => ["soft", "card"].includes(v) },
  ariaLabel: { type: String, default: "" },
  strokeWidth: { type: [Number, String], default: 1.7 },
});

const _resolvedKey = computed(() => {
  if (props.courseKey) return props.courseKey;
  if (typeof props.course === "string") {
    return resolveCourseKey({ name: props.course });
  }
  return resolveCourseKey({
    name: props.course?.name,
    courseId: props.course?.courseId || props.course?.id,
  });
});

const theme = computed(() => getCourseTheme(_resolvedKey.value));

const svgContent = computed(() => getCourseShape(_resolvedKey.value));

const svgSize = computed(() => (props.size === "sm" ? 20 : props.size === "lg" ? 32 : 28));

const fgColor = computed(() => theme.value.fg);

const containerStyle = computed(() => {
  if (props.variant !== "card") return {};
  const { bgLight, bgDeep } = theme.value;
  // 收敛：不做高饱和渐变，只用极淡同色系 bgLight + 轻微内阴影（视觉不抢）
  return {
    background: bgLight,
    borderRadius: "14px",
    padding: props.size === "lg" ? "14px" : props.size === "md" ? "12px" : "6px",
    boxShadow: `inset 0 0 0 1px ${bgDeep}`,
  };
});
</script>

<style scoped>
.cicon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  line-height: 1;
}
.cicon svg {
  display: block;
  stroke: currentColor;
  fill: none;
}
.cicon svg [fill="currentColor"] {
  fill: currentColor;
}
.cicon--sm svg { stroke-width: 1.7; }
.cicon--md svg { stroke-width: 1.7; }
.cicon--lg svg { stroke-width: 1.8; }
</style>
