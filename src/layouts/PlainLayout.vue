<template>
  <!-- 二级页面框架：顶部 NavBar（返回 + 居中标题 + 胶囊），无 TabBar。
       用法：<PlainLayout title="设置">…页面内容…</PlainLayout> -->
  <div class="plain-layout">
    <NavBar :title="title" :show-back="showBack" :back-to="backTo">
      <template v-if="$slots.right" #right><slot name="right" /></template>
      <template v-if="$slots.left" #left><slot name="left" /></template>
    </NavBar>
    <main class="plain-layout__content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import NavBar from "../components/NavBar.vue";

defineProps({
  title: { type: String, default: "" },
  showBack: { type: Boolean, default: true },
  backTo: { type: [String, Object], default: null },
});
</script>

<style scoped>
.plain-layout__content {
  min-height: calc(100% - var(--nav-height) - var(--safe-top));
  padding-bottom: 24px;
}
</style>
