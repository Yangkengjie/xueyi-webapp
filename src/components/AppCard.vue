<template>
  <section class="app-card" :class="{ 'app-card--flat': flat }">
    <header v-if="title" class="app-card__header">
      <h2 class="app-card__title">{{ title }}</h2>
      <slot name="extra" />
    </header>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: "" },
  flat: { type: Boolean, default: false }, // 无阴影的嵌入卡片
});
</script>

<style scoped>
.app-card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: var(--card-padding);
  /* UI参数：两个不相连卡片的上下间距为 36px */
  margin: 0 var(--page-padding) var(--card-gap);
}

.app-card--flat {
  box-shadow: none;
}

.app-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.app-card__title {
  font-size: var(--font-size-title);
  font-weight: 600;
}
</style>
