<template>
  <!-- 学习者画像雷达图（SVG 四轴） -->
  <div class="radar">
    <svg viewBox="0 0 200 170" class="radar__svg">
      <!-- 网格 -->
      <polygon
        v-for="ring in [1, 0.66, 0.33]"
        :key="ring"
        :points="gridPoints(ring)"
        fill="none"
        stroke="#e3e3e0"
      />
      <!-- 轴线 -->
      <line
        v-for="(p, i) in axisPoints"
        :key="i"
        :x1="cx" :y1="cy" :x2="p.x" :y2="p.y"
        stroke="#e3e3e0"
      />
      <!-- 数据面 -->
      <polygon :points="dataPoints" fill="rgba(31,92,56,0.18)" stroke="#1f5c38" stroke-width="1.5" />
      <circle v-for="(p, i) in valuePoints" :key="'v' + i" :cx="p.x" :cy="p.y" r="2.5" fill="#1f5c38" />
      <!-- 轴标签 -->
      <text
        v-for="(label, i) in axes"
        :key="'l' + i"
        :x="labelPos[i].x"
        :y="labelPos[i].y"
        text-anchor="middle"
        font-size="11"
        fill="#999"
      >
        {{ label }}
      </text>
    </svg>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  axes: { type: Array, required: true },
  values: { type: Array, required: true }, // 0~1
});

const cx = 100;
const cy = 82;
const R = 58;

const angle = (i) => (Math.PI * 2 * i) / props.axes.length - Math.PI / 2;

const axisPoints = computed(() =>
  props.axes.map((_, i) => ({ x: cx + R * Math.cos(angle(i)), y: cy + R * Math.sin(angle(i)) }))
);

const gridPoints = (ring) =>
  props.axes
    .map((_, i) => `${cx + R * ring * Math.cos(angle(i))},${cy + R * ring * Math.sin(angle(i))}`)
    .join(" ");

const valuePoints = computed(() =>
  props.values.map((v, i) => ({
    x: cx + R * v * Math.cos(angle(i)),
    y: cy + R * v * Math.sin(angle(i)),
  }))
);

const dataPoints = computed(() => valuePoints.value.map((p) => `${p.x},${p.y}`).join(" "));

const labelPos = computed(() =>
  props.axes.map((_, i) => ({
    x: cx + (R + 18) * Math.cos(angle(i)),
    y: cy + (R + 14) * Math.sin(angle(i)) + 4,
  }))
);
</script>

<style scoped>
.radar {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}
.radar__svg {
  width: 200px;
  height: 170px;
}
</style>
