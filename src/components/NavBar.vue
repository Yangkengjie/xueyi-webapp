<template>
  <header class="navbar">
    <!-- 左侧：返回按钮或自定义插槽 -->
    <div class="navbar__side">
      <slot name="left">
        <button v-if="showBack" class="navbar__back" aria-label="返回" @click="goBack">
          <!-- UI参数：返回图标 11×22 -->
          <svg viewBox="0 0 12 24" width="11" height="22" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M10 4 3 12l7 8" />
          </svg>
        </button>
      </slot>
    </div>

    <!-- 中间：标题（可选副标题） -->
    <div class="navbar__center">
      <h1 class="navbar__title">{{ title }}</h1>
      <p v-if="subtitle" class="navbar__subtitle">{{ subtitle }}</p>
    </div>

    <!-- 右侧：操作插槽 -->
    <div class="navbar__side navbar__side--right">
      <slot name="right" />
    </div>
  </header>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
const props = defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  showBack: { type: Boolean, default: true },
  big: { type: Boolean, default: false },
  // 指定二级页面的固定返回目标，避免分类切换后回退到旧分类。
  backTo: { type: [String, Object], default: null },
});

const goBack = () => {
  if (props.backTo) {
    router.push(props.backTo);
    return;
  }
  if (window.history.length > 1) router.back();
  else router.push({ name: "home" });
};
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 90;
  min-height: calc(var(--nav-height) + var(--safe-top));
  padding-top: var(--safe-top);
  display: grid;
  grid-template-columns: 88px 1fr 88px;
  align-items: center;
  background: var(--color-bg);
}

.navbar__side {
  display: flex;
  align-items: center;
  padding-left: 8px;
}

.navbar__side--right {
  justify-content: flex-end;
  padding-left: 0;
  padding-right: 12px;
}

.navbar__back {
  display: flex;
  padding: 6px;
  color: var(--color-text);
}

.navbar__center {
  text-align: center;
  min-width: 0;
}

.navbar__title {
  font-size: var(--font-size-nav);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.navbar__subtitle {
  font-size: var(--font-size-caption);
  color: var(--color-text-caption);
  margin-top: 2px;
}
</style>
