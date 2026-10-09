<template>
  <!-- 递归大纲节点：支持长按、弱关联标签点击 -->
  <div class="onode">
    <div
      class="onode__row"
      :class="{ 'onode__row--root': depth === 0 }"
      @touchstart="pressStart"
      @touchend="pressEnd"
      @mousedown="pressStart"
      @mouseup="pressEnd"
      @contextmenu.prevent
    >
      <span class="onode__bullet" :style="{ opacity: depth === 0 ? 0 : 1 }"></span>
      <span class="onode__text" :class="{ 'onode__text--hl': node.highlight }">{{ node.text }}</span>
      <span
        v-for="l in node.links || []"
        :key="l"
        class="onode__link"
        @click.stop="$emit('link', l)"
      >@{{ l }}</span>
    </div>
    <p v-if="node.note" class="onode__note">{{ node.note }}</p>
    <p v-if="node.desc" class="onode__desc">{{ node.desc }}</p>
    <div v-if="node.children?.length" class="onode__children">
      <OutlineNode
        v-for="c in node.children"
        :key="c.id"
        :node="c"
        :depth="depth + 1"
        @longpress="$emit('longpress', $event)"
        @link="$emit('link', $event)"
      />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "OutlineNode" });
const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
});
const emit = defineEmits(["longpress", "link"]);

let pressTimer = null;
const pressStart = (e) => {
  const p = e.touches ? e.touches[0] : e;
  pressTimer = setTimeout(
    () => emit("longpress", { node: props.node, x: p.clientX, y: p.clientY }),
    500
  );
};
const pressEnd = () => clearTimeout(pressTimer);
</script>

<style>
.onode {
  --indent: calc(var(--depth, 0) * 18px);
}
.onode__row {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 5px 0;
  user-select: none;
  -webkit-user-select: none;
  cursor: default;
}
.onode__row:active {
  background: var(--color-input-bg);
  border-radius: 6px;
}
.onode__row--root .onode__text {
  font-size: 17px;
  font-weight: 700;
}
.onode__bullet {
  flex: 0 0 auto;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-text);
  transform: translateY(-2px);
}
.onode__text {
  font-weight: 600;
  font-size: 15px;
}
.onode__text--hl {
  color: #c0392b; /* 主运化 等重点词条标红 */
}
.onode__link {
  font-size: var(--font-size-caption);
  color: var(--color-text-caption);
  cursor: pointer;
}
.onode__link:active {
  color: var(--color-primary);
}
.onode__desc {
  color: #8a8a88;
  font-size: 13px;
  line-height: 1.7;
  padding: 2px 0 4px 12px;
}
.onode__note {
  color: #b0b0ad;
  font-size: 12px;
  padding: 0 0 2px 12px;
}
.onode__children {
  margin-left: 12px;
  padding-left: 10px;
  border-left: 1px solid var(--color-divider);
}
</style>
