<template>
  <PlainLayout :title="courseName">
    <template #right>
      <!-- 切换到大纲详情 -->
      <button class="mindmap__switch" aria-label="切换到大纲" @click="$router.push({ name: 'topic' })">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M13 9h4M13 13h4" />
        </svg>
      </button>
    </template>

    <!-- 思维导图：可拖拽平移 + 点击节点进入大纲 -->
    <div
      class="mindmap"
      @pointerdown="dragStart"
      @pointermove="dragMove"
      @pointerup="dragEnd"
      @pointercancel="dragEnd"
    >
      <svg
        class="mindmap__canvas"
        :width="canvasW"
        :height="canvasH"
        :style="{ transform: `translate(${offset.x}px, ${offset.y}px)` }"
      >
        <!-- 连线 -->
        <path
          v-for="(e, i) in edges"
          :key="'e' + i"
          :d="e.d"
          fill="none"
          stroke="#8aa8d8"
          stroke-width="1.5"
        />
        <!-- 节点 -->
        <g
          v-for="n in nodes"
          :key="n.key"
          class="mindmap__node"
          @click.stop="onNodeClick(n)"
        >
          <rect
            :x="n.x"
            :y="n.y - 13"
            :width="n.w"
            height="26"
            rx="6"
            :fill="n.depth === 0 ? '#1f5c38' : n.depth === 1 ? '#eef2fb' : '#f6f7f5'"
            :stroke="n.depth === 0 ? '#1f5c38' : '#d7dce6'"
          />
          <text
            :x="n.x + 10"
            :y="n.y + 4"
            :fill="n.depth === 0 ? '#fff' : '#333'"
            font-size="12"
          >
            {{ n.name }}
          </text>
        </g>
      </svg>
    </div>
  </PlainLayout>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import PlainLayout from "../layouts/PlainLayout.vue";
import { courseOutline, courses } from "../mock/data";

const route = useRoute();
const router = useRouter();
const course = courses.find((c) => c.id === route.params.id);
const courseName = course ? "课程大纲" : "课程大纲";

/* ---- 横向树布局：根在左，向右展开 ---- */
const NODE_H = 34;
const LEVEL_W = 150;
const CHAR_W = 12.5;

let keySeq = 0;
const nodes = [];
const edges = [];

function layout(node, depth, yCursor) {
  const key = keySeq++;
  const w = Math.max(56, node.name.length * CHAR_W + 20);
  const me = { key, name: node.name, depth, w, x: depth * LEVEL_W + 16, y: 0 };

  if (!node.children?.length) {
    me.y = yCursor.value;
    yCursor.value += NODE_H;
  } else {
    const startY = yCursor.value;
    for (const child of node.children) {
      const childNode = layout(child, depth + 1, yCursor);
      edges.push({
        d: `M ${me.x + me.w} ${0} C ${me.x + me.w + 40} ${0}, ${childNode.x - 40} ${childNode.y}, ${childNode.x} ${childNode.y}`,
        fromKey: key,
      });
    }
    me.y = (startY + yCursor.value - NODE_H) / 2;
  }
  nodes.push(me);
  return me;
}

const cursor = { value: 30 };
const root = layout(courseOutline, 0, cursor);
/* 修正根节点连线的起点 y（布局时根 y 尚未知） */
for (const e of edges) {
  if (e.fromKey === root.key) {
    e.d = e.d.replace(/M (\S+) \S+ C (\S+) \S+,/, `M $1 ${root.y} C $2 ${root.y},`);
  }
}

const canvasW = computed(() => Math.max(...nodes.map((n) => n.x + n.w)) + 40);
const canvasH = computed(() => Math.max(...nodes.map((n) => n.y)) + 60);

/* ---- 平移 ---- */
const offset = ref({ x: 8, y: 20 });
let drag = null;
const dragStart = (e) => {
  drag = { x: e.clientX - offset.value.x, y: e.clientY - offset.value.y };
};
const dragMove = (e) => {
  if (!drag) return;
  offset.value = { x: e.clientX - drag.x, y: e.clientY - drag.y };
};
const dragEnd = () => (drag = null);

const onNodeClick = (n) => {
  if (n.depth >= 1) router.push({ name: "topic" });
};
</script>

<style scoped>
.mindmap {
  height: calc(100vh - var(--nav-height) - var(--safe-top) - 60px);
  overflow: hidden;
  background: var(--color-card);
  margin: 0 var(--page-padding);
  border-radius: var(--radius-card);
  touch-action: none;
  cursor: grab;
}
.mindmap:active {
  cursor: grabbing;
}
.mindmap__canvas {
  transition: transform 0.05s linear;
}
.mindmap__node {
  cursor: pointer;
}
.mindmap__switch {
  display: flex;
  padding: 6px;
  color: var(--color-text-secondary);
}
</style>
