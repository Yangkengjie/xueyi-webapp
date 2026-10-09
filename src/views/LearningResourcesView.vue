<template>
  <PlainLayout title="学习资源" :back-to="{ name: 'study' }">
    <div class="resource-page">
      <p class="resource-page__intro">选择学习板块，进入网站知识库中的对应内容。</p>

      <div class="resource-page__tabs" aria-label="学习资源分类">
        <button
          v-for="item in learningModules"
          :key="item.id"
          class="resource-page__tab"
          :class="{ 'resource-page__tab--active': activeId === item.id }"
          @click="selectModule(item.id)"
        >{{ item.name }}</button>
      </div>

      <section class="resource-page__hero" :class="`resource-page__hero--${activeModule.tone}`">
        <div class="resource-page__hero-icon">{{ activeModule.icon }}</div>
        <div>
          <h2>{{ activeModule.name }}</h2>
          <p>{{ activeModule.desc }}</p>
        </div>
      </section>

      <div class="resource-page__list">
        <button
          v-for="item in activeItems"
          :key="item.title"
          class="resource-card"
          @click="openItem(item)"
        >
          <div class="resource-card__main">
            <p class="resource-card__title">{{ item.title }}</p>
            <p class="resource-card__meta">{{ item.meta }}</p>
            <div v-if="typeof item.progress === 'number'" class="resource-card__progress">
              <span :style="{ width: item.progress + '%' }"></span>
            </div>
          </div>
          <div class="resource-card__side">
            <span v-if="item.tag" class="resource-card__tag">{{ item.tag }}</span>
            <span v-if="typeof item.progress === 'number'" class="resource-card__pct">{{ item.progress }}%</span>
            <span class="resource-card__arrow">›</span>
          </div>
        </button>
      </div>
    </div>
  </PlainLayout>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PlainLayout from '../layouts/PlainLayout.vue';
import { learningModules, learningResources } from '../mock/data';
import { toast } from '../utils/feedback';

const route = useRoute();
const router = useRouter();
const activeId = computed(() => {
  const id = String(route.query.module || 'framework');
  return learningModules.some((m) => m.id === id) ? id : 'framework';
});

const activeModule = computed(() => learningModules.find((m) => m.id === activeId.value));
const activeItems = computed(() => learningResources[activeId.value] || []);

// 分类切换同步到 URL，保证浏览器/顶部返回能回到真实访问路径，
// 不会再停留在第一次进入的分类。
const selectModule = (id) => {
  if (id === activeId.value) return;
  router.push({ name: 'learningResources', query: { module: id } });
};

const openItem = (item) => {
  if (item.routeName) {
    router.push(item.routeName === 'course'
      ? { name: 'course', params: { id: item.courseId || 'tcm-basic' }, query: { from: 'resources', module: activeId.value } }
      : { name: item.routeName, query: { from: 'resources', module: activeId.value } });
    return;
  }
  if (item.courseId) {
    router.push({ name: 'course', params: { id: item.courseId }, query: { from: 'resources', module: activeId.value } });
    return;
  }
  router.push({
    name: 'resourceDetail',
    params: { module: activeId.value },
    query: { title: item.title },
  });
  toast(`已进入「${item.title}」`);
};
</script>

<style scoped>
.resource-page { padding: 4px var(--page-padding) 28px; }
.resource-page__intro { color: var(--color-text-caption); font-size: 13px; line-height: 1.7; margin-bottom: 14px; }
.resource-page__tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding-bottom: 10px;
}
.resource-page__tab {
  min-width: 0;
  padding: 8px 8px;
  border-radius: var(--radius-pill);
  background: var(--color-card);
  border: 1px solid var(--color-divider);
  color: var(--color-text-secondary);
  font-size: 13px;
  white-space: nowrap;
}
.resource-page__tab--active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.resource-page__hero { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: var(--radius-card); background: var(--color-primary-tint); margin-bottom: 14px; }
.resource-page__hero-icon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 14px; background: rgba(255,255,255,.72); color: var(--color-primary); font-size: 22px; }
.resource-page__hero h2 { font-size: 17px; font-weight: 700; }
.resource-page__hero p { font-size: 12px; color: var(--color-text-secondary); margin-top: 4px; }
.resource-page__hero--orange .resource-page__hero-icon { color: #b46c21; }
.resource-page__hero--blue .resource-page__hero-icon { color: #477cae; }
.resource-page__hero--purple .resource-page__hero-icon { color: #7459a7; }
.resource-page__hero--teal .resource-page__hero-icon { color: #397d78; }
.resource-page__list { display: grid; gap: 10px; }
.resource-card { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; text-align: left; padding: 15px; background: var(--color-card); border-radius: var(--radius-card); box-shadow: var(--shadow-card); }
.resource-card:active { opacity: .72; }
.resource-card__main { min-width: 0; flex: 1; }
.resource-card__title { font-size: 15px; font-weight: 650; }
.resource-card__meta { font-size: 12px; color: var(--color-text-caption); margin-top: 5px; line-height: 1.5; }
.resource-card__side { display: flex; align-items: center; gap: 8px; color: var(--color-text-caption); }
.resource-card__tag { font-size: 11px; padding: 4px 7px; border-radius: 999px; background: var(--color-primary-tint); color: var(--color-primary); white-space: nowrap; }
.resource-card__pct { font-size: 12px; white-space: nowrap; }
.resource-card__arrow { font-size: 24px; line-height: 1; }
.resource-card__progress { height: 5px; margin-top: 9px; border-radius: 99px; overflow: hidden; background: var(--color-primary-tint); }
.resource-card__progress span { display: block; height: 100%; border-radius: inherit; background: var(--color-primary); }
</style>
