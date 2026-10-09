<template>
  <nav class="tabbar">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.name"
      :to="tab.to"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': isActive(tab) }"
      :aria-current="isActive(tab) ? 'page' : undefined"
    >
      <span class="tabbar__icon" v-html="tab.icon"></span>
      <span class="tabbar__label">{{ tab.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { useRoute } from "vue-router";

const route = useRoute();

/* 内联 SVG 图标，22x22（UI参数：TabBar 大图标 22×22），currentColor 跟随选中态 */
const stroke = (paths) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const tabs = [
  {
    name: "home",
    label: "首页",
    to: { name: "home" },
    icon: stroke(
      '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'
    ),
  },
  {
    name: "study",
    label: "学习",
    to: { name: "study" },
    icon: stroke(
      '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>'
    ),
  },
  {
    name: "tutor",
    label: "推演",
    to: { name: "tutor" },
    icon: stroke('<path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/>'),
  },
  {
    name: "mine",
    label: "我的",
    to: { name: "mine" },
    icon: stroke(
      '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>'
    ),
  },
];

const isActive = (tab) => route.name === tab.name;
</script>

<style scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--page-width);
  height: calc(var(--tabbar-height) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  display: flex;
  background: var(--color-card);
  border-top: 1px solid var(--color-divider);
  z-index: 100;
}

.tabbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--color-text-caption);
  transition: color 0.15s ease;
}

.tabbar__item:active {
  opacity: 0.6;
}

.tabbar__item--active {
  color: var(--color-primary);
}

.tabbar__icon {
  display: flex;
  line-height: 0;
}

.tabbar__label {
  font-size: 10px;
}
</style>
