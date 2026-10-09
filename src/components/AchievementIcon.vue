<template>
  <div
    class="achv-icon"
    :class="[
      unlocked ? 'achv-icon--unlocked' : 'achv-icon--locked',
      size === 'sm' ? 'achv-icon--sm' : 'achv-icon--md',
    ]"
    :role="ariaLabel ? 'img' : undefined"
    :aria-label="ariaLabel || undefined"
  >
    <svg
      class="achv-icon__svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      :stroke-width="strokeWidth"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- 底色背景圆（解锁 / 未解锁） -->
      <circle
        class="achv-icon__bg"
        cx="12"
        cy="12"
        r="11.2"
      />
      <!-- 等级点缀层（由外到内叠加，颜色在 .achv-icon--level-* 中） -->
      <!-- Ⅱ 级：浅绿外轮廓 -->
      <g v-if="level >= 2" class="achv-icon__ring achv-icon__ring--l2">
        <circle cx="12" cy="12" r="10" fill="none" />
      </g>
      <!-- Ⅳ 级：青玉色内圈 -->
      <g v-if="level >= 4" class="achv-icon__ring achv-icon__ring--l4">
        <circle cx="12" cy="12" r="5" fill="none" />
      </g>
      <!-- Ⅲ/Ⅴ 级：淡金点缀（四枚小圆点） -->
      <g v-if="level === 3 || level === 5" class="achv-icon__ring achv-icon__ring--gold">
        <circle cx="12" cy="3" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="21" cy="12" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="12" cy="21" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="3" cy="12" r="0.9" fill="currentColor" stroke="none" />
      </g>
      <!-- 主体图案（所有形状 class 统一走 stroke/fill 继承） -->
      <g class="achv-icon__main" v-html="shapeSvg"></g>
      <!-- 锁定小挂锁（未解锁 & 非 sm 尺寸展示淡灰挂锁小标） -->
      <g v-if="!unlocked && size !== 'sm'" class="achv-icon__lock">
        <rect x="9.2" y="11.2" width="5.6" height="4" rx="1" />
        <path d="M10.4 11.2 V9.6 A1.6 1.6 0 0 1 13.6 9.6 V11.2" />
        <circle cx="12" cy="13.4" r="0.6" fill="currentColor" />
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { ACHIEVEMENT_ICON_MAP, ACHIEVEMENT_BADGE_SHAPES } from "../constants/achievementIcons.js";

const props = defineProps({
  achievementId: { type: String, default: "" },
  // 传入 category 用于未知 ID 的默认备用图（可选）
  category: { type: String, default: "" },
  level: { type: [Number, String], default: 1 },
  unlocked: { type: Boolean, default: true },
  size: { type: String, default: "md" }, // md=成就徽章（42）、sm=更紧凑（24，暂未用到）
  ariaLabel: { type: String, default: "" },
});

const levelNum = computed(() => {
  const n = Number(props.level);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 1;
});

const strokeWidth = computed(() => {
  return props.size === "sm" ? 1.6 : 1.7;
});

const shapeSvg = computed(() => {
  const key = ACHIEVEMENT_ICON_MAP[props.achievementId];
  return ACHIEVEMENT_BADGE_SHAPES[key] || ACHIEVEMENT_BADGE_SHAPES.fallback_book_sprout;
});
</script>

<style scoped>
/* 统一容器：墨绿线 / 浅绿底 / 白 / 少量淡金/青灰点缀 */
.achv-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 999px;
  position: relative;
  /* 非常轻微的柔和阴影（只在解锁才开，由 class 控制） */
}

.achv-icon--md {
  width: 42px;
  height: 42px;
}
.achv-icon--sm {
  width: 24px;
  height: 24px;
}

.achv-icon__svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* --------- 颜色规则（统一通过 stroke: currentColor 继承） --------- */
/* 解锁：墨绿主线、浅绿色背景 */
.achv-icon--unlocked {
  background: transparent;
}
.achv-icon--unlocked .achv-icon__bg {
  fill: #e8f5e9;                /* 浅绿背景 */
  stroke: #c8e6c9;              /* 最淡轮廓线 */
  stroke-width: 0.6;
}
.achv-icon--unlocked .achv-icon__main {
  color: var(--color-primary, #266636); /* 墨绿主线 */
  stroke: currentColor;
  fill: none;
}
.achv-icon--unlocked .achv-icon__main [fill="currentColor"] {
  fill: var(--color-primary, #266636);
}
/* 解锁：柔和阴影 */
.achv-icon--unlocked.achv-icon--md {
  box-shadow: 0 2px 8px rgba(38, 102, 54, 0.10);
}

/* 未解锁：青灰线条、灰白背景、透明度降低 */
.achv-icon--locked {
  background: transparent;
  opacity: 0.85;
}
.achv-icon--locked .achv-icon__bg {
  fill: #f1f3f4;                /* 灰白背景 */
  stroke: #e0e4e7;
  stroke-width: 0.6;
}
.achv-icon--locked .achv-icon__main {
  color: #90a4ae;               /* 青灰主线 */
  stroke: currentColor;
  fill: none;
}
.achv-icon--locked .achv-icon__main [fill="currentColor"] {
  fill: #90a4ae;
}
.achv-icon--locked .achv-icon__lock {
  color: #78909c;
  stroke: currentColor;
  stroke-width: 1.3;
  fill: none;
}
.achv-icon--locked .achv-icon__lock [fill="currentColor"] {
  fill: #78909c;
}

/* --------- 等级点缀（少量点缀，不花哨） --------- */
/* Ⅱ 级：增加一层浅绿轮廓 */
.achv-icon--unlocked .achv-icon__ring--l2 {
  color: #a5d6a7;
}
.achv-icon--locked .achv-icon__ring--l2 {
  color: #cfd8dc;
}
.achv-icon__ring--l2 circle {
  stroke-width: 0.8;
  stroke: currentColor;
  fill: none;
}

/* Ⅲ 级 & Ⅴ 级：淡金小点缀点（四点） */
.achv-icon--unlocked .achv-icon__ring--gold {
  color: #d4b97e;                /* 低饱和淡金 */
}
.achv-icon--locked .achv-icon__ring--gold {
  color: #b0bec5;                /* 青灰点 */
}

/* Ⅳ 级：青玉色内圈（解锁时开，未解锁时灰化） */
.achv-icon--unlocked .achv-icon__ring--l4 {
  color: #7fb4a8;                /* 青玉 */
}
.achv-icon--locked .achv-icon__ring--l4 {
  color: #b0bec5;
}
.achv-icon__ring--l4 circle {
  stroke-width: 0.9;
  stroke: currentColor;
  fill: none;
}

/* Ⅴ 级特殊：外环轻微淡金描边（最外圈用 box-shadow 外发光，不做霓虹） */
.achv-icon--unlocked.achv-icon--md::after {
  /* 使用属性 class 区分等级最直观：用 :deep() / box-shadow 内阴影模拟淡金外环 */
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: 999px;
  pointer-events: none;
  display: none;
}
/* 注：实际 Ⅴ 级通过 .achv-icon--unlocked + 数据属性 levelNum 很难；我们用外层 class + 组件内部用 level 映射的 style hook（这里不引入动态 style，保持颜色简洁） */
</style>
