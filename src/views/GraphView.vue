<template>
  <div class="graph-page">
    <!-- 大标题头 -->
    <header class="graph__brand">
      <h1 class="graph__title">知识图谱模式</h1>
      <p class="graph__slogan">从关系出发，理解知识如何彼此关联</p>
    </header>

    <!-- 筛选 + 全屏 -->
    <div class="graph__controls">
      <div class="graph__chip-wrap">
        <button class="graph__chip" @click="showFilterRail = !showFilterRail">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round">
            <path d="M4 8h10M18 8h2M4 16h2M10 16h10" />
            <circle cx="16" cy="8" r="2" /><circle cx="8" cy="16" r="2" />
          </svg>
          {{ scope }}
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <div v-if="showScopes" class="graph__scopes">
          <p
            v-for="s in scopes"
            :key="s"
            class="graph__scope"
            @click="scope = s; showScopes = false"
          >{{ s }}</p>
        </div>
      </div>
      <button class="graph__expand" aria-label="全屏" @click="fullscreen = !fullscreen">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
      </button>
    </div>

    <!-- 图谱画布 -->
    <div class="graph__canvas-wrap" :class="{ 'graph__canvas-wrap--fs': fullscreen }">
      <!-- 左侧筛选栏 -->
      <Transition name="rail">
        <div v-if="showFilterRail" class="graph__rail">
          <button
            v-for="f in graphFilters"
            :key="f"
            class="graph__rail-item"
            :class="{ 'graph__rail-item--on': activeFilters.includes(f) }"
            @click="toggleFilter(f)"
          >
            {{ f }}
          </button>
        </div>
      </Transition>

      <svg class="graph__canvas" viewBox="0 0 420 560">
        <line
          v-for="(e, i) in edgeLines"
          :key="i"
          :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
          :stroke="e.color"
          stroke-width="1.2"
          opacity="0.85"
        />
        <g
          v-for="n in graphNodes"
          :key="n.id"
          class="graph__node"
          @click="selected = n"
        >
          <circle :cx="n.x" :cy="n.y" :r="n.r" :fill="nodeColor(n.color)" />
          <text :x="n.x" :y="n.y + 4" text-anchor="middle" font-size="13" fill="#333">
            {{ n.label }}
          </text>
        </g>
      </svg>

      <!-- 点击节点后的详情浮层 -->
      <Transition name="toast-fade">
        <div v-if="selected" class="graph__detail">
          <div class="graph__detail-head">
            <p class="graph__detail-title">{{ selected.label }}</p>
            <button class="graph__detail-close" aria-label="关闭" @click="selected = null">×</button>
          </div>
          <p class="graph__detail-body">{{ selected.desc }}</p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { graphNodes, graphEdges, graphFilters } from "../mock/data";

const scope = ref("全科总览");
const scopes = ["全科总览", "脏腑", "经络", "方剂", "中药"];
const showScopes = ref(false);
const showFilterRail = ref(false);
const activeFilters = ref(["显示全部"]);
const fullscreen = ref(false);
const selected = ref(null);

const nodeColor = (c) =>
  ({ blue: "#4b8fd6", orange: "#e59a4b", green: "#a9d6a4", "green-l": "#c8e6c5" }[c] || "#a9d6a4");

const edgeLines = computed(() =>
  graphEdges.map(([a, b, color]) => {
    const na = graphNodes.find((n) => n.id === a);
    const nb = graphNodes.find((n) => n.id === b);
    return { x1: na.x, y1: na.y, x2: nb.x, y2: nb.y, color };
  })
);

const toggleFilter = (f) => {
  const i = activeFilters.value.indexOf(f);
  if (i >= 0) activeFilters.value.splice(i, 1);
  else activeFilters.value.push(f);
};
</script>

<style scoped>
.graph-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.graph__brand {
  padding: calc(12px + var(--safe-top)) var(--page-padding) 10px;
}
.graph__title {
  font-size: var(--font-size-nav); /* 标题栏 20 */
  font-weight: 700;
}
.graph__slogan {
  font-size: var(--font-size-caption);
  color: var(--color-text-caption);
  margin-top: 4px;
}

.graph__controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--page-padding) 10px;
}
.graph__chip-wrap {
  position: relative;
}
/* 全科总览按钮：135.33×33.33（UI参数） */
.graph__chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 135px;
  height: 33px;
  border: 1px solid var(--color-divider);
  background: var(--color-card);
  border-radius: var(--radius-pill);
  font-size: 13px;
  color: var(--color-text);
}
.graph__scopes {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
  background: #fff;
  border-radius: 10px;
  box-shadow: var(--shadow-pop);
  min-width: 120px;
  padding: 4px 0;
}
.graph__scope {
  padding: 9px 14px;
  font-size: 14px;
  cursor: pointer;
}
.graph__scope:active {
  background: var(--color-input-bg);
}
.graph__expand {
  display: flex;
  padding: 6px;
  color: var(--color-text-secondary);
}

.graph__canvas-wrap {
  position: relative;
  flex: 1;
  margin: 0 var(--page-padding) 12px;
  background: var(--color-card);
  border-radius: var(--radius-card);
  overflow: hidden;
  min-height: 480px;
}
.graph__canvas-wrap--fs {
  position: fixed;
  inset: 0;
  z-index: 200;
  margin: 0;
  border-radius: 0;
  max-width: var(--page-width);
  left: 50%;
  transform: translateX(-50%);
}
.graph__canvas {
  width: 100%;
  height: 100%;
  min-height: 480px;
}
.graph__node {
  cursor: pointer;
}
.graph__node:active circle {
  opacity: 0.8;
}

.graph__rail {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.96);
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.06);
}
.graph__rail-item {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-input-bg);
  border-radius: 6px;
  padding: 6px 10px;
  text-align: left;
}
.graph__rail-item--on {
  background: var(--color-primary-tint);
  color: var(--color-primary);
}

.graph__detail {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  z-index: 30;
  background: #fff;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-pop);
  padding: 14px;
}
.graph__detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.graph__detail-title {
  font-weight: 700;
  font-size: 15px;
}
.graph__detail-close {
  font-size: 20px;
  color: #999;
  line-height: 1;
}
.graph__detail-body {
  font-size: 13px;
  line-height: 1.8;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.rail-enter-active,
.rail-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.rail-enter-from,
.rail-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
