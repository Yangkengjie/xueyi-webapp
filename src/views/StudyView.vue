<template>
  <div>
    <header class="study__brand">
      <h1 class="study__title">学习</h1>
      <p class="study__slogan">从关系出发，理解知识如何彼此关联</p>
    </header>

    <!-- 知识图谱模式入口 -->
    <RouterLink :to="{ name: 'graph' }" class="study__graph">
      <div>
        <p class="study__graph-title">知识图谱模式</p>
        <p class="text-caption">以图谱方式探索知识点之间的关联</p>
      </div>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
           stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" />
        <circle cx="12" cy="18" r="2.5" /><path d="M8 7.5 10.8 16M16 7.5 13.2 16M8.5 6h7" />
      </svg>
    </RouterLink>

    <!-- 课程列表 -->
    <h2 class="section-title study__section">我的课程</h2>
    <RouterLink
      v-for="c in courses"
      :key="c.id"
      :to="{ name: 'course', params: { id: c.id } }"
      class="course"
    >
      <div class="course__info">
        <p class="course__name">{{ c.name }}</p>
        <p class="text-caption">{{ c.desc }}</p>
        <div class="course__progress">
          <div class="course__progress-inner" :style="{ width: c.progress + '%' }"></div>
        </div>
      </div>
      <span class="course__pct">{{ c.progress }}%</span>
    </RouterLink>
  </div>
</template>

<script setup>
import { courses } from "../mock/data";
</script>

<style scoped>
.study__brand {
  padding: calc(12px + var(--safe-top)) var(--page-padding) 24px;
}
.study__title {
  font-size: var(--font-size-nav); /* 标题栏 20 */
  font-weight: 700;
}
.study__slogan {
  font-size: var(--font-size-caption);
  color: var(--color-text-caption);
  margin-top: 4px;
}

.study__graph {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 var(--page-padding) 14px;
  padding: 16px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-card);
}
.study__graph:active {
  opacity: 0.85;
}
.study__graph-title {
  font-size: var(--font-size-title);
  font-weight: 600;
}
.study__graph .text-caption {
  color: rgba(255, 255, 255, 0.75);
}

.study__section {
  padding-left: var(--page-padding);
}

.course {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 var(--page-padding) 10px;
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 14px;
}
.course:active {
  opacity: 0.7;
}
.course__info {
  flex: 1;
}
.course__name {
  font-weight: 600;
  font-size: 15px;
}
.course__progress {
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-tint);
  margin-top: 10px;
  overflow: hidden;
}
.course__progress-inner {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-pill);
}
.course__pct {
  font-size: var(--font-size-caption);
  color: var(--color-text-caption);
}
</style>
