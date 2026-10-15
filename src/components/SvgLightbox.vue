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
        ref="viewportEl"
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
          ref="stageEl"
          class="svg-lightbox__stage"
          :style="{ width: dispW + 'px', height: dispH + 'px', marginLeft: tx + 'px', marginTop: ty + 'px' }"
          v-html="svg"
        ></div>
      </div>
      <p class="svg-lightbox__hint">滚轮 / 双指缩放 · 双击切换 · 拖动平移</p>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
const props = defineProps({ visible: Boolean, svg: { type: String, default: "" } });
const emit = defineEmits(["close"]);

const scale = ref(1), tx = ref(0), ty = ref(0);
/* 允许缩到很小（超宽图也要能缩到全图可见），放大上限保持 12 倍看细节 */
const MIN = 0.1, MAX = 12;
function clampScale(v) { return Math.min(MAX, Math.max(MIN, v)); }
function reset() { scale.value = 1; tx.value = 0; ty.value = 0; }
function close() { emit("close"); }
function zoomBy(f) { scale.value = clampScale(scale.value * f); }
function onWheel(e) { zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12); }
function onDbl() { scale.value = scale.value > 1.05 ? 1 : 2.5; }

/* 图的逻辑尺寸（viewBox）与适应视口的基准比例。
   缩放直接改变 SVG 的渲染宽高（dispW/H），浏览器按最终尺寸重新光栅化矢量，
   而不是用 transform:scale 拉伸已光栅化的位图——放大始终清晰。 */
const stageEl = ref(null);
const viewportEl = ref(null);
const naturalW = ref(800), naturalH = ref(400);
const fit = ref(1);
const dispW = computed(() => naturalW.value * fit.value * scale.value);
const dispH = computed(() => naturalH.value * fit.value * scale.value);

function measure() {
  nextTick(() => {
    const svgEl = stageEl.value && stageEl.value.querySelector("svg");
    if (!svgEl) return;
    /* 固定像素尺寸优先；mermaid 12 的 width 可能是 "100%"（百分比不是真实像素，
       parseFloat 会错误地得到 100），这种情况必须走 viewBox */
    const wAttr = svgEl.getAttribute("width");
    const hAttr = svgEl.getAttribute("height");
    const isPx = (v) => v != null && v !== "" && !String(v).includes("%");
    let nw = isPx(wAttr) ? parseFloat(wAttr) : NaN;
    let nh = isPx(hAttr) ? parseFloat(hAttr) : NaN;
    const vb = svgEl.viewBox && svgEl.viewBox.baseVal;
    if ((!nw || !nh) && vb && vb.width && vb.height) { nw = vb.width; nh = vb.height; }
    if (!nw || !nh) { const r = svgEl.getBoundingClientRect(); nw = r.width || 800; nh = r.height || 400; }
    naturalW.value = nw; naturalH.value = nh;
    const vp = viewportEl.value;
    const vw = vp ? vp.clientWidth : window.innerWidth * 0.92;
    const vh = vp ? vp.clientHeight : window.innerHeight * 0.72;
    /* 取 min（contain）：默认让整张图完整适应屏幕、全图可见，不超出任何方向；
       文字看不清时再点 + / 滚轮 / 双击放大看细节（之前用 max 会让宽图默认
       横向超出、即使缩到最小也看不全） */
    fit.value = Math.min(vw / nw, vh / nh);
    reset();
  });
}
watch(() => [props.visible, props.svg], () => { if (props.visible) measure(); });

/* 复制 / 下载：把当前 svg 渲染成高清 PNG（3 倍超采样，放大也清晰） */
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
  const R = 3;   // 3 倍清晰度
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
    flash("已开始下载高清 PNG");
  } catch (e) { flash("下载失败：" + (e.message || "")); }
}

/* 指针拖拽平移 */
let dragging = false, sx = 0, sy = 0, startTx = 0, startTy = 0;
function onDown(e) {
  dragging = true; sx = e.clientX; sy = e.clientY; startTx = tx.value; startTy = ty.value;
  /* setPointerCapture 在某些合成事件/触摸场景会抛 InvalidStateError，
     不能让它中断拖拽（后续 move 仍可正常响应） */
  try { e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId); } catch (_) {}
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
.svg-lightbox__stage {
  /* flex 居中：必须 flex-shrink:0，否则超出视口的放大图会被收缩变形。
     实测：超大 stage 用 transform 或绝对定位都会在 Chromium 上合成光栅化空白，
     只有 flex 布局能正常绘制；平移改用 margin 偏移。 */
  flex: 0 0 auto;
}
.svg-lightbox__stage :deep(svg) {
  /* 尺寸由 stage 的 dispW/dispH 驱动（矢量按当前缩放重新光栅化），
     viewBox 保证等比、不变形。
     mermaid 12 给 svg 内联了 max-width:NNpx，会把放大后的图重新压回原尺寸、
     且因内联样式优先级最高必须用 !important 覆盖，否则图被挤到视口外看不见 */
  width: 100%;
  height: 100%;
  max-width: none !important;
  max-height: none !important;
  display: block;
  background: #fff; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,.4);
}
.svg-lightbox__bar {
  display: flex; align-items: center; gap: 10px; justify-content: center;
  padding: 12px 10px; color: #fff;
  background: rgba(15, 22, 18, 0.75);
  backdrop-filter: blur(8px);
  flex-wrap: wrap;
}
.lb-btn {
  min-width: 44px; height: 44px; border-radius: 22px; border: 1px solid rgba(255,255,255,.35);
  background: rgba(255,255,255,.18); color: #fff; font-size: 17px; cursor: pointer;
  font-weight: 600;
}
.lb-btn:active { background: rgba(255,255,255,.35); }
.lb-btn--text {
  min-width: auto; padding: 0 18px; font-size: 14px; font-weight: 500;
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
