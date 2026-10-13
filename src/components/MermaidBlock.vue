<template>
  <div class="mermaid-block">
    <div v-if="svg" class="mermaid-svg" @click="openLightbox">
      <div class="mermaid-svg__inner" v-html="svg"></div>
      <span class="mermaid-svg__zoom">点击查看大图</span>
    </div>
    <div v-else-if="error" class="mermaid-fallback">
      <p class="mermaid-fallback__tip">图示生成失败，已显示原始描述：</p>
      <pre>{{ rawCode }}</pre>
    </div>
    <div v-else class="mermaid-loading">图示生成中…</div>
  </div>
  <SvgLightbox :visible="lightboxOpen" :svg="svg" @close="lightboxOpen = false" />
</template>

<script setup>
import { ref, onMounted } from "vue";
import SvgLightbox from "./SvgLightbox.vue";

const props = defineProps({ code: { type: String, required: true } });
const svg = ref("");
const error = ref(false);
const rawCode = ref(String(props.code || ""));
const lightboxOpen = ref(false);
function openLightbox() { lightboxOpen.value = true; }

const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let seq = 0;
function withTimeout(p, ms) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
}
/* 固定数量的独立 mermaid 实例池：各实例状态隔离、并发安全；
   query 固定（?pool=0..9），vite 只转换 10 次并缓存，避免每次渲染都用新 query 拖垮 dev server */
const POOL_SIZE = 10;
const pool = [];
let poolCursor = 0;
function baseConfig() {
  return {
    startOnLoad: false,
    securityLevel: "loose",
    theme: "base",
    fontFamily: "inherit",
    themeVariables: {
      primaryColor: "#e8f1ec",
      primaryTextColor: "#1f3a2c",
      primaryBorderColor: "#266636",
      lineColor: "#5a7a68",
      secondaryColor: "#f3f7f4",
      tertiaryColor: "#ffffff",
      fontSize: "16px",
    },
  };
}
async function getMermaid() {
  const idx = poolCursor++ % POOL_SIZE;
  if (!pool[idx]) {
    const mod = import.meta.env.DEV
      ? await import(`/node_modules/mermaid/dist/mermaid.esm.min.mjs?pool=${idx}`)
      : await import("mermaid");
    const m = mod.default;
    m.initialize(baseConfig());
    pool[idx] = m;
  }
  return pool[idx];
}
async function renderOnce(code) {
  const mermaid = await getMermaid();
  const id = `mmd-${Date.now()}-${seq++}`;
  try {
    const r = await withTimeout(mermaid.render(id, code), 25000);
    return r?.svg || "";
  } finally {
    /* 无论成功/失败/超时，都清掉 mermaid 挂在 body 的临时节点与炸弹错误图 */
    const stray = document.getElementById(id);
    if (stray && stray.parentNode) stray.parentNode.removeChild(stray);
  }
}
/* 清扫 body 中 #app 之外的 mermaid 游离节点（临时容器 id 前缀为 mmd 或 dmmd）。
   注意：只精准清理 mermaid 残留，绝不能误删 Teleport 到 body 的小精灵与 Lightbox */
function purgeFloating() {
  [...document.body.children].forEach((c) => {
    if (c.id === "app" || ["SCRIPT", "LINK", "STYLE", "NOSCRIPT"].includes(c.tagName)) return;
    const id = c.id || "";
    const cls = (typeof c.className === "string" && c.className) || "";
    const isMermaidStray = /^d?mmd-/.test(id) || /mermaid/i.test(cls)
      || (c.querySelector && c.querySelector(".mermaid"));
    if (isMermaidStray) c.remove();
  });
}

onMounted(async () => {
  try {
    const raw = String(props.code || "").trim();
    rawCode.value = raw;
    if (!raw) { error.value = true; return; }
    const code = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|mindmap|pie|timeline)/.test(raw)
      ? raw : `graph TD\n${raw}`;
    try {
      let out = await renderOnce(code);
      if (!out.includes("<svg")) { await delay(500); out = await renderOnce(code); } /* 新实例重试 */
      if (out.includes("<svg")) svg.value = out;
      else error.value = true;
    } catch (e) {
      try { await delay(500); const out2 = await renderOnce(code);
        if (out2.includes("<svg")) { svg.value = out2; return; } } catch (_) {}
      error.value = true;
    }
  } finally {
    purgeFloating();   /* 兜底：清掉任何游离的炸弹错误图 */
  }
});
</script>

<style scoped>
.mermaid-block {
  margin: 12px 0;
  border: 1px solid var(--color-divider, #e3eae5);
  border-radius: 12px;
  background: #fff;
  padding: 12px;
  overflow: hidden;   /* 图已等比适配，不出现横向滚动条 */
}
.mermaid-svg { cursor: zoom-in; }
/* 内嵌统一为固定高度缩略图，svg 用 preserveAspectRatio 等比缩小居中，
   长图不再占满整屏；点击才全屏查看 */
.mermaid-svg__inner {
  height: 300px;
  display: flex; justify-content: center; align-items: center;
}
.mermaid-svg__inner :deep(svg) {
  width: 100%;
  height: 100%;
}
.mermaid-svg__zoom {
  display: block; text-align: center; margin-top: 8px;
  font-size: 12px; color: #7a8a80;
}
.mermaid-loading { font-size: 13px; color: #7a8a80; text-align: center; padding: 12px; }
.mermaid-fallback__tip { font-size: 12px; color: #b05a4a; margin: 0 0 6px; }
.mermaid-fallback pre {
  font-size: 12px; line-height: 1.7; white-space: pre-wrap;
  word-break: break-word; margin: 0; font-family: inherit;
}
</style>
