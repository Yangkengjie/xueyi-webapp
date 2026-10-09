<template>
  <!-- 长按弹出菜单：浮层卡片（AI回答长按）或底部动作条通用 -->
  <Teleport to="body">
    <Transition name="menu-fade">
      <div v-if="visible" class="menu-mask" @click.self="close">
        <div class="menu-card" :style="positionStyle">
          <button
            v-for="item in items"
            :key="item.label"
            class="menu-card__item"
            @click="select(item)"
          >
            <span class="menu-card__icon" v-html="item.icon"></span>
            <span>{{ item.label }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  visible: { type: Boolean, default: false },
  items: { type: Array, required: true }, // [{label, icon?, danger?}]
  x: { type: Number, default: null }, // 传入坐标则浮于按压点附近
  y: { type: Number, default: null },
});

const emit = defineEmits(["select", "close"]);

const positionStyle = computed(() => {
  if (props.x == null || props.y == null) {
    // 默认：居中偏下
    return { left: "50%", top: "55%", transform: "translate(-50%, -50%)" };
  }
  const left = Math.min(Math.max(props.x, 90), window.innerWidth - 100);
  const top = Math.min(props.y, window.innerHeight - 60 - props.items.length * 46);
  return { left: left + "px", top: top + "px", transform: "translateX(-50%)" };
});

const select = (item) => {
  emit("select", item);
  close();
};
const close = () => emit("close");
</script>

<style>
.menu-mask {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.25);
}

.menu-card {
  position: absolute;
  min-width: 150px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.14);
  padding: 4px 0;
  overflow: hidden;
}

.menu-card__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 18px;
  font-size: 15px;
  color: #333;
  border-bottom: 1px solid #f2f2f0;
  text-align: left;
}
.menu-card__item:last-child {
  border-bottom: none;
}
.menu-card__item:active {
  background: #f5f5f3;
}
.menu-card__icon {
  display: flex;
  line-height: 0;
  color: #555;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease;
}
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}
</style>
