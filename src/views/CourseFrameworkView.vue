<template>
  <PlainLayout title="课程框架" :back-to="{ name: 'study' }">
    <div class="framework-page">
      <div class="framework-head">
        <div>
          <h1>{{ mode === 'graph' ? '知识图谱模式' : '课程大纲模式' }}</h1>
          <p>{{ mode === 'graph' ? '从课程之间的关系出发，建立整体知识框架' : '按课程层级查看章节与知识点的思维导图' }}</p>
        </div>
        <div class="framework-switch" role="tablist" aria-label="课程框架模式">
          <button :class="{on: mode==='graph'}" @click="mode='graph'">图谱</button>
          <button :class="{on: mode==='outline'}" @click="mode='outline'">大纲</button>
        </div>
      </div>

      <template v-if="mode === 'graph'">
        <section class="course-graph" aria-label="四门课程知识图谱">
          <svg class="course-graph__lines" viewBox="0 0 360 390" preserveAspectRatio="none" aria-hidden="true">
            <line x1="180" y1="190" x2="82" y2="115" />
            <line x1="180" y1="190" x2="275" y2="95" />
            <line x1="180" y1="190" x2="92" y2="285" />
            <line x1="180" y1="190" x2="278" y2="285" />
          </svg>
          <button
            v-for="(c, index) in courses"
            :key="c.id"
            class="course-graph__node"
            :class="`course-graph__node--${index}`"
            @click="openCourse(c.id)"
          >{{ c.name }}</button>
          <div class="course-graph__center">课程框架</div>
        </section>
        <p class="framework-tip">点击任意课程，进入该课程的知识结构与具体内容。</p>
      </template>

      <template v-else>
        <section class="outline-intro">
          <p>选择一门真实课程，查看按一级、二级、三级知识节点组织的思维导图。</p>
        </section>
        <div class="course-list">
          <button v-for="c in courses" :key="c.id" class="course-card" @click="openCourse(c.id)">
            <div>
              <strong>{{ c.name }}</strong>
              <span>{{ c.desc }}</span>
            </div>
            <b>查看导图 ›</b>
          </button>
        </div>
      </template>
    </div>
  </PlainLayout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import PlainLayout from '../layouts/PlainLayout.vue';
import { courses } from '../mock/data';

const router = useRouter();
const mode = ref('graph');
const openCourse = (id) => {
  router.push({ name: 'course', params: { id }, query: { from: 'framework' } });
};
</script>

<style scoped>
.framework-page{padding:10px var(--page-padding) 28px}.framework-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}.framework-head h1{font-size:22px;font-weight:750}.framework-head p{font-size:12px;color:var(--color-text-caption);line-height:1.6;margin-top:5px;max-width:210px}.framework-switch{display:flex;padding:3px;background:var(--color-card);border:1px solid var(--color-divider);border-radius:999px;box-shadow:var(--shadow-card)}.framework-switch button{padding:6px 10px;border-radius:999px;font-size:12px;color:var(--color-text-secondary)}.framework-switch .on{background:var(--color-primary);color:#fff}.course-graph{position:relative;height:430px;border-radius:var(--radius-card);background:var(--color-card);box-shadow:var(--shadow-card);overflow:hidden}.course-graph__lines{position:absolute;inset:0;width:100%;height:100%}.course-graph__lines line{stroke:#d9dfdf;stroke-width:1.4}.course-graph__center,.course-graph__node{position:absolute;display:grid;place-items:center;border-radius:50%;background:#fff;border:2px solid #55796c;color:var(--color-text);box-shadow:var(--shadow-card);text-align:center;line-height:1.35}.course-graph__center{left:50%;top:50%;transform:translate(-50%,-50%);width:94px;height:94px;font-size:16px;font-weight:700;background:var(--color-primary);color:#fff;border-color:var(--color-primary)}.course-graph__node{width:92px;height:92px;padding:8px;font-size:14px}.course-graph__node--0{left:8%;top:11%}.course-graph__node--1{right:7%;top:6%}.course-graph__node--2{left:10%;bottom:8%}.course-graph__node--3{right:7%;bottom:8%}.course-graph__node:active{transform:scale(.96)}.framework-tip{text-align:center;font-size:13px;color:var(--color-text-caption);margin:14px 8px}.outline-intro{padding:14px 15px;background:var(--color-primary-tint);border-radius:var(--radius-card);margin-bottom:12px}.outline-intro p{font-size:13px;color:var(--color-text-secondary);line-height:1.7}.course-list{display:grid;gap:10px}.course-card{width:100%;display:flex;align-items:center;justify-content:space-between;text-align:left;padding:15px;background:var(--color-card);border-radius:var(--radius-card);box-shadow:var(--shadow-card)}.course-card strong{display:block;font-size:16px}.course-card span{display:block;font-size:12px;color:var(--color-text-caption);margin-top:5px;line-height:1.5}.course-card b{font-size:12px;color:var(--color-primary);font-weight:600;white-space:nowrap;margin-left:10px}
</style>
