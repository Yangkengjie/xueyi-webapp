<template>
  <Teleport to="body">
    <div v-if="visible" class="svg-lightbox" @click.self="close" @wheel.prevent="onWheel">
      <div class="svg-lightbox__bar">
        <button class="lb-btn" @click="zoomBy(1/1.3)" title="缩小">－</button>
        <span class="lb-pct">{{ Math.round(scale * 100) }}%</span>
        <button class="lb-btn" @click="zoomBy(1.3)" title="放大">＋</button>
        <button class="lb-btn" @click="reset" title="复位">复位</button>
        <button class="lb-btn lb-btn--text" @click="copyImage" title="复制图片到剪贴板">复制</button>
        <button class="lb-btn lb-btn--text" @click="downloadImage" title="下载为 PNG">下载</button>
        <button class="lb-btn lb-btn--close" @click="close" title="关闭">✕</button>
      </div>
      <p v-if="statusMsg" class="svg-lightbox__toast">{{ statusMsg }}</p>
      <div
        class="svg-lightbox__viewport"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onUp"
        @dblclick="onDbl"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
      >
        <div
          class="svg-lightbox__stage"
          :style="{ transform: `translate(${tx}px, ${ty}px) scale(${scale})` }"
          v-html="svg"
        ></div>
      </div>
      <p class="svg-lightbox__hint">滚轮 / 双指缩放 · 双击切换 · 拖动平移</p>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from "vue";
const props = defineProps({ visible: Boolean, svg: { type: String, default: "" } });
const emit = defineEmits(["close"]);

const scale = ref(1), tx = ref(0), ty = ref(0);
const MIN = 0.4, MAX = 8;
function clampScale(v) { return Math.min(MAX, Math.max(MIN, v)); }
function reset() { scale.value = 1; tx.value = 0; ty.value = 0; }
function close() { emit("close"); }
function zoomBy(f) { scale.value = clampScale(scale.value * f); }
function onWheel(e) { zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12); }
function onDbl() { scale.value = scale.value > 1.05 ? 1 : 2; }

/* 复制 / 下载：把当前 svg 渲染成高清 PNG */
const statusMsg = ref("");
let tipTimer = null;
function flash(msg) {
  statusMsg.value = msg;
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => { statusMsg.value = ""; }, 2200);
}
async function renderToBlob() {
  const src = document.querySelector(".svg-lightbox__stage svg");
  const clone = src.cloneNode(true);
  const vb = src.viewBox && src.viewBox.baseVal;
  const w = (vb && vb.width) ? vb.width : src.getBoundingClientRect().width;
  const h = (vb && vb.height) ? vb.height : src.getBoundingClientRect().height;
  clone.setAttribute("width", w);
  clone.setAttribute("height", h);
  const xml = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml); });
  const R = 2;   // 2 倍清晰度
  const canvas = document.createElement("canvas");
  canvas.width = w * R; canvas.height = h * R;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob(res, "image/png"));
}
async function copyImage() {
  try {
    const blob = await renderToBlob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    flash("已复制图片，可直接粘贴");
  } catch (e) { flash("复制失败：" + (e.message || "浏览器不支持")); }
}
async function downloadImage() {
  try {
    const blob = await renderToBlob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "学医智用-流程图-" + Date.now() + ".png";
    a.click();
    URL.revokeObjectURL(a.href);
    flash("已开始下载 PNG");
  } catch (e) { flash("下载失败：" + (e.message || "")); }
}

/* 指针拖拽平移 */
let dragging = false, sx = 0, sy = 0, startTx = 0, startTy = 0;
function onDown(e) {
  dragging = true; sx = e.clientX; sy = e.clientY; startTx = tx.value; startTy = ty.value;
  e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
}
function onMove(e) {
  if (!dragging) return;
  tx.value = startTx + (e.clientX - sx); ty.value = startTy + (e.clientY - sy);
}
function onUp() { dragging = false; }

/* 移动端双指捏合 */
let pinchDist = 0, pinchScale = 1;
function dist(a, b) { return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); }
function onTouchStart(e) {
  if (e.touches.length === 2) { pinchDist = dist(e.touches[0], e.touches[1]); pinchScale = scale.value; }
}
function onTouchMove(e) {
  if (e.touches.length === 2 && pinchDist) {
    scale.value = clampScale(pinchScale * (dist(e.touches[0], e.touches[1]) / pinchDist));
  }
}
watch(() => props.visible, (v) => { if (v) reset(); });
</script>

<style scoped>
.svg-lightbox {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(20, 28, 24, 0.82);
  display: flex; flex-direction: column;
}
.svg-lightbox__viewport {
  flex: 1; overflow: hidden; display: flex; align-items: center; justify-content: center;
  touch-action: none; cursor: grab;
}
.svg-lightbox__viewport:active { cursor: grabbing; }
.svg-lightbox__stage { transform-origin: center center; will-change: transform; }
.svg-lightbox__stage :deep(svg) {
  /* 固定视口盒子，svg 用 preserveAspectRatio 默认等比缩放居中，
     宽图/高图/width=100% 的图都完整显示、不塌缩、不变形 */
  width: 88vw;
  height: 78vh;
  background: #fff; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,.4);
}
.svg-lightbox__bar {
  display: flex; align-items: center; gap: 10px; justify-content: center;
  padding: 14px; color: #fff;
}
.lb-btn {
  min-width: 40px; height: 40px; border-radius: 20px; border: 1px solid rgba(255,255,255,.3);
  background: rgba(255,255,255,.12); color: #fff; font-size: 15px; cursor: pointer;
}
.lb-btn:active { background: rgba(255,255,255,.25); }
.lb-btn--text {
  min-width: auto; padding: 0 16px;
}
.svg-lightbox__toast {
  position: fixed; top: 64px; left: 50%; transform: translateX(-50%);
  background: rgba(38, 102, 54, .95); color: #fff; font-size: 13px;
  padding: 9px 18px; border-radius: 20px; margin: 0; z-index: 10000;
}
.lb-pct { min-width: 56px; text-align: center; font-size: 15px; }
.lb-btn--close { margin-left: 8px; }
.svg-lightbox__hint { text-align: center; color: rgba(255,255,255,.65); font-size: 12px; padding: 10px; margin: 0; }
</style>
