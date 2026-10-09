<template>
  <PlainLayout :title="course.name" :back-to="backTarget">
    <div class="content-page">
      <section class="content-page__location" aria-label="当前位置">
        <div class="content-page__location-label">当前位置</div>
        <nav class="content-page__crumb" aria-label="知识点路径">
          <RouterLink
            class="content-page__crumb-link"
            :to="{ name: 'courseContent', params: { courseId: course.id, nodeId: course.root.id }, query: route.query }"
          >{{ course.name }}</RouterLink>
          <template v-if="breadcrumbNodes.length">
            <template v-for="(item, index) in breadcrumbNodes" :key="item.id">
              <span class="content-page__separator" aria-hidden="true">›</span>
              <RouterLink
                v-if="index < breadcrumbNodes.length - 1"
                class="content-page__crumb-link"
                :to="{ name: 'courseContent', params: { courseId: course.id, nodeId: item.id }, query: route.query }"
              >{{ cleanTitle(item.displayTitle || item.title) }}</RouterLink>
              <span v-else class="content-page__crumb-current">{{ cleanTitle(item.displayTitle || item.title) }}</span>
            </template>
          </template>
          <template v-else>
            <span class="content-page__separator" aria-hidden="true">›</span>
            <span class="content-page__crumb-current">课程总览</span>
          </template>
        </nav>
      </section>

      <section class="content-page__head">
        <h1>{{ cleanTitle(node.displayTitle || node.title) }}</h1>
        <p>{{ pageHint }}</p>
      </section>

      <div class="content-page__tip">
        按“章节 → 知识模块 → 知识点”逐级展开。末端知识点直接显示内容，不再重复生成同名子节点。
        <span class="content-page__mark-tip">点每个知识点右侧的“＋”，可标记掌握程度；标记会保存在当前浏览器。</span>
      </div>

      <section class="content-page__display-settings" aria-label="知识点显示设置">
        <div class="content-page__settings-heading">
          <strong>显示设置</strong>
          <span>{{ activeMarkFilters.length ? '正在筛选已标记知识点' : '显示全部知识点' }}</span>
        </div>
        <div class="content-page__mark-filters">
          <button
            type="button"
            class="content-page__filter-chip"
            :class="{ 'content-page__filter-chip--active': activeMarkFilters.length === 0 }"
            @click="activeMarkFilters = []"
          >全部</button>
          <button
            v-for="option in knowledgeMarkOptions"
            :key="option.value"
            type="button"
            class="content-page__filter-chip"
            :class="[`content-page__filter-chip--${option.value}`, { 'content-page__filter-chip--active': activeMarkFilters.includes(option.value) }]"
            :aria-pressed="activeMarkFilters.includes(option.value)"
            @click="toggleMarkFilter(option.value)"
          >{{ option.label }}</button>
        </div>
        <p v-if="activeMarkFilters.length" class="content-page__filter-note">
          仅显示符合所选标记的知识点，并保留必要的上级章节路径；课程原有章节顺序不变。
        </p>
        <div class="content-page__memory-row">
          <div>
            <strong>关键词记忆模式</strong>
            <p>{{ memoryMode ? '仅显示已标注的重点关键词，隐藏详细解释。' : '显示完整课程内容。' }}</p>
          </div>
          <button
            type="button"
            class="content-page__memory-toggle"
            :class="{ 'content-page__memory-toggle--active': memoryMode }"
            :aria-pressed="memoryMode"
            @click="memoryMode = !memoryMode"
          >{{ memoryMode ? '退出记忆模式' : '开启记忆模式' }}</button>
        </div>
      </section>

      <section v-if="displayNode" class="knowledge-accordion">
        <KnowledgeOutlineNode
          :node="displayNode"
          :level="0"
          :course-id="course.id"
          :default-open="true"
          :hide-self="displayNode.id === course.root.id"
          :memory-mode="memoryMode"
        />
      </section>
      <div v-else class="content-page__empty">
        当前范围内没有符合所选标记的知识点。可以更换标记类型，或先给知识点添加标记。
      </div>

      <section class="course-comments" aria-label="当前知识点评论区">
        <div class="course-comments__heading">
          <div>
            <h2>评论区 <span>{{ currentComments.length }}</span></h2>
            <p>围绕“{{ cleanTitle(node.displayTitle || node.title) }}”交流学习心得</p>
          </div>
          <span class="course-comments__local-badge">本地记录</span>
        </div>

        <form class="course-comments__composer" @submit.prevent="sendComment">
          <textarea
            v-model="commentDraft"
            rows="3"
            maxlength="1000"
            placeholder="分享你的理解、疑问或补充……"
            aria-label="评论内容"
          ></textarea>
          <div class="course-comments__composer-footer">
            <span>{{ commentDraft.length }}/1000</span>
            <button type="submit" :disabled="!commentDraft.trim()">发布评论</button>
          </div>
        </form>

        <div v-if="currentComments.length" class="course-comments__list">
          <article v-for="comment in currentComments" :key="comment.id" class="course-comment">
            <div class="course-comment__avatar">{{ (comment.name || '学')[0] }}</div>
            <div class="course-comment__body">
              <div class="course-comment__meta">
                <strong>{{ comment.name || '岐黄学子' }}</strong>
                <time>{{ formatCommentTime(comment.createdAt) }}</time>
              </div>
              <p v-if="comment.replyTo" class="course-comment__replying">回复 {{ comment.replyTo.name }}</p>
              <p class="course-comment__text">{{ comment.text }}</p>
              <div class="course-comment__actions">
                <button type="button" :class="{ 'is-active': comment.liked }" @click="toggleCommentLike(comment)">
                  <span aria-hidden="true">♥</span> {{ comment.liked ? '已点赞' : '点赞' }} <span>{{ comment.likes || 0 }}</span>
                </button>
                <button type="button" :class="{ 'is-active': comment.starred }" @click="toggleCommentStar(comment)">
                  <span aria-hidden="true">★</span> {{ comment.starred ? '已收藏' : '收藏' }}
                </button>
                <button type="button" :class="{ 'is-active': comment.reported }" :disabled="comment.reported" @click="reportComment(comment)">
                  {{ comment.reported ? '已举报' : '举报' }}
                </button>
                <button type="button" @click="replyToComment(comment)">回复</button>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="course-comments__empty">
          <span class="course-comments__empty-icon">✎</span>
          <strong>还没有评论</strong>
          <p>你可以发布第一条评论，记录自己的理解或提出问题。</p>
        </div>
        <p class="course-comments__notice">当前评论仅保存在本浏览器中；接入服务器后，可进一步实现账号同步与跨设备查看。</p>
      </section>

    </div>
  </PlainLayout>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import PlainLayout from '../layouts/PlainLayout.vue';
import KnowledgeOutlineNode from '../components/KnowledgeOutlineNode.vue';
import { courseContent } from '../mock/courseContent';
import { buildPrunedCourses } from '../utils/courseTree';
import { getKnowledgeMark, knowledgeMarkOptions, knowledgeMarks } from '../utils/knowledgeMarks';
import { addCourseComment, getCourseComments, updateCourseComment, courseComments } from '../utils/courseComments';
import { toast } from '../utils/feedback';

const route = useRoute();
const prunedCourses = buildPrunedCourses(courseContent);
const course = computed(() => prunedCourses[String(route.params.courseId)] || prunedCourses['tcm-basic']);
const node = computed(() => findNode(course.value.root, String(route.params.nodeId)) || course.value.root);
const activeMarkFilters = ref([]);
const memoryMode = ref(false);
function toggleMarkFilter(value) {
  if (activeMarkFilters.value.length === 0) {
    activeMarkFilters.value = [value];
    return;
  }
  const next = activeMarkFilters.value.includes(value)
    ? activeMarkFilters.value.filter((item) => item !== value)
    : [...activeMarkFilters.value, value];
  activeMarkFilters.value = next;
}
function filterMarkedNode(current, courseId, selectedMarks) {
  if (!current) return null;
  const children = (current.children || [])
    .map((child) => filterMarkedNode(child, courseId, selectedMarks))
    .filter(Boolean);
  const ownMark = getKnowledgeMark(courseId, current.id);
  const keepSelf = selectedMarks.includes(ownMark);
  if (keepSelf || children.length) return { ...current, children };
  return null;
}
const displayNode = computed(() => {
  // 读取标记仓库以建立响应式依赖：标记更改后筛选结果会即时更新。
  knowledgeMarks.value;
  if (!activeMarkFilters.value.length) return node.value;
  return filterMarkedNode(node.value, course.value.id, activeMarkFilters.value);
});
function findNode(n, id) { if (n.id === id) return n; for (const c of n.children || []) { const x = findNode(c, id); if (x) return x; } return null; }
function pathToNodes(n, id, path = []) {
  if (n.id === id) return [...path, n];
  for (const child of n.children || []) {
    const result = pathToNodes(child, id, [...path, n]);
    if (result) return result;
  }
  return null;
}
const breadcrumbNodes = computed(() => {
  const fullPath = pathToNodes(course.value.root, node.value.id) || [course.value.root];
  // 根节点名称与页面标题相同，不重复显示两次。
  return fullPath.length > 1 && cleanTitle(fullPath[0].title) === cleanTitle(course.value.name)
    ? fullPath.slice(1)
    : fullPath;
});
const backTarget = computed(() => {
  if (route.query.from === 'favorites') {
    return { name: 'favorites' };
  }
  if (route.query.from === 'search') {
    return {
      name: 'quickSearch',
      query: { from: 'study', q: String(route.query.q || '') },
    };
  }
  return {
    name: 'course',
    params: { id: course.value.id },
    query: { from: 'framework' },
  };
});
const cleanTitle = (value) => String(value || '').replace(/\*\*/g,'').replace(/\s+/g,' ').trim();
const commentDraft = ref('');
const replyTarget = ref(null);
const currentComments = computed(() => {
  // 订阅全局评论仓库，保证点赞、收藏、发布后立即刷新。
  courseComments.value;
  return getCourseComments(course.value.id, node.value.id);
});
function sendComment() {
  const text = commentDraft.value.trim();
  if (!text) return;
  const created = addCourseComment(course.value.id, node.value.id, text, replyTarget.value);
  if (!created) return;
  commentDraft.value = '';
  replyTarget.value = null;
  toast('评论已发布（保存在当前浏览器）');
}
function toggleCommentLike(comment) {
  const liked = !comment.liked;
  updateCourseComment(course.value.id, node.value.id, comment.id, {
    liked,
    likes: Math.max(0, Number(comment.likes || 0) + (liked ? 1 : -1)),
  });
}
function toggleCommentStar(comment) {
  const starred = !comment.starred;
  updateCourseComment(course.value.id, node.value.id, comment.id, { starred });
  toast(starred ? '已收藏该评论' : '已取消收藏');
}
function reportComment(comment) {
  if (comment.reported) return;
  const accepted = typeof window === 'undefined' || typeof window.confirm !== 'function'
    ? true
    : window.confirm('确定举报这条评论吗？当前仅记录在本浏览器中。');
  if (!accepted) return;
  updateCourseComment(course.value.id, node.value.id, comment.id, { reported: true });
  toast('已记录举报（本地演示）');
}
function replyToComment(comment) {
  replyTarget.value = { id: comment.id, name: comment.name || '岐黄学子' };
  commentDraft.value = `@${replyTarget.value.name} `;
  toast('已切换为回复模式，请补充回复内容');
}
function formatCommentTime(value) {
  if (!value) return '刚刚';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚';
  const now = new Date();
  const sameDay = date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
  return sameDay
    ? date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}
const pageHint = computed(() => {
  if (course.value.id === 'tcm-basic') return '按章节递进展开，先看结构，再按需展开具体知识。';
  if (course.value.id === 'tcm-diag') return '每章知识按层级折叠展示，先看结构，再按需展开具体内容。';
  if (course.value.id === 'anatomy') return '按系统和解剖模块逐级展开，不把多个知识集合堆在同一页面。';
  return '按层级展开知识点，点击箭头查看需要的具体内容。';
});


</script>

<style scoped>
.content-page{padding:12px var(--page-padding) 42px}.content-page__location{margin:2px 0 14px}.content-page__location-label{font-size:12px;color:var(--color-text-caption);margin-bottom:5px}.content-page__crumb{display:flex;align-items:baseline;flex-wrap:wrap;gap:5px;font-size:13px;color:var(--color-text-secondary);line-height:1.75;overflow-wrap:anywhere}.content-page__separator{color:#a5aeab}.content-page__crumb-link{color:var(--color-text-secondary);text-decoration:none;border-bottom:1px dashed #cbd4d0}.content-page__crumb-link:active{color:var(--color-primary)}.content-page__crumb-current{color:var(--color-text);font-weight:600}.content-page__head{padding:4px 2px 12px}.content-page__head h1{font-size:24px;line-height:1.4;margin:0 0 8px;font-weight:800;overflow-wrap:anywhere}.content-page__head p{margin:0;color:var(--color-text-secondary);font-size:13px;line-height:1.7;overflow-wrap:anywhere}.content-page__tip{font-size:12px;line-height:1.7;color:var(--color-text-caption);background:var(--color-card);padding:10px 12px;border-radius:12px;margin:0 0 13px;box-shadow:var(--shadow-card)}.content-page__mark-tip{display:block;margin-top:4px;color:#47755a}.content-page__display-settings{margin:0 0 12px;padding:12px;border:1px solid #e5ebe7;border-radius:14px;background:#fff}.content-page__settings-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.content-page__settings-heading strong{font-size:14px;color:var(--color-text)}.content-page__settings-heading span{font-size:11px;color:var(--color-text-caption)}.content-page__mark-filters{display:flex;flex-wrap:wrap;gap:7px}.content-page__filter-chip{min-height:32px;padding:5px 11px;border:1px solid #e0e7e3;border-radius:999px;background:#fff;color:#59645f;font-size:12px}.content-page__filter-chip--active{background:#21663b;border-color:#21663b;color:#fff}.content-page__filter-chip--mastered:not(.content-page__filter-chip--active){color:#1d6637}.content-page__filter-chip--familiar:not(.content-page__filter-chip--active){color:#315d9c}.content-page__filter-chip--understood:not(.content-page__filter-chip--active){color:#8a6a13}.content-page__filter-chip--weak:not(.content-page__filter-chip--active){color:#b4483c}.content-page__filter-note{margin:9px 0 0;font-size:11px;line-height:1.6;color:var(--color-text-caption)}.content-page__memory-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:13px;padding-top:12px;border-top:1px solid #edf0ee}.content-page__memory-row strong{font-size:13px;color:var(--color-text)}.content-page__memory-row p{margin:4px 0 0;font-size:11px;line-height:1.6;color:var(--color-text-caption)}.content-page__memory-toggle{flex-shrink:0;min-height:34px;padding:6px 12px;border:1px solid #dce5e0;border-radius:999px;background:#fff;color:#21663b;font-size:12px}.content-page__memory-toggle--active{background:#21663b;border-color:#21663b;color:#fff}.content-page__empty{padding:24px 14px;border-radius:12px;background:#fff;color:var(--color-text-caption);font-size:13px;line-height:1.7;text-align:center}.knowledge-accordion{padding:4px 2px}
.course-comments{margin:26px 0 0;padding-top:18px;border-top:1px solid #e5eae7}.course-comments__heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.course-comments__heading h2{font-size:20px;line-height:1.4;margin:0;font-weight:800}.course-comments__heading h2 span{font-size:13px;color:var(--color-text-caption);font-weight:500;margin-left:4px}.course-comments__heading p{margin:5px 0 0;color:var(--color-text-caption);font-size:12px;line-height:1.6;overflow-wrap:anywhere}.course-comments__local-badge{flex-shrink:0;padding:4px 8px;border-radius:999px;background:#f0f5f2;color:#557260;font-size:11px}.course-comments__composer{padding:12px;border:1px solid #e2e9e5;border-radius:14px;background:#fff;box-shadow:var(--shadow-card)}.course-comments__composer textarea{display:block;width:100%;min-height:68px;resize:vertical;border:0;outline:0;background:transparent;color:var(--color-text);font:inherit;font-size:14px;line-height:1.7}.course-comments__composer textarea::placeholder{color:#a2aaa6}.course-comments__composer-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;padding-top:9px;border-top:1px solid #edf0ee}.course-comments__composer-footer span{font-size:11px;color:var(--color-text-caption)}.course-comments__composer-footer button{min-height:34px;padding:6px 15px;border:0;border-radius:999px;background:#21663b;color:#fff;font-size:13px}.course-comments__composer-footer button:disabled{background:#cbd8cf;color:#fff}.course-comments__list{margin-top:8px}.course-comment{display:flex;gap:10px;padding:15px 2px;border-bottom:1px solid #edf0ee}.course-comment__avatar{flex:0 0 34px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#eaf3ed;color:#21663b;font-size:14px;font-weight:650}.course-comment__body{flex:1;min-width:0}.course-comment__meta{display:flex;align-items:center;justify-content:space-between;gap:10px}.course-comment__meta strong{font-size:13px;font-weight:650}.course-comment__meta time{font-size:11px;color:var(--color-text-caption);flex-shrink:0}.course-comment__replying{margin:5px 0 0;color:#47755a;font-size:12px}.course-comment__text{margin:7px 0 0;font-size:14px;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere}.course-comment__actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:14px;margin-top:9px}.course-comment__actions button{padding:2px 0;color:var(--color-text-caption);font-size:11px}.course-comment__actions button.is-active{color:#21663b}.course-comment__actions button:disabled{opacity:.7}.course-comments__empty{display:flex;flex-direction:column;align-items:center;gap:7px;padding:28px 12px 22px;color:var(--color-text-caption);text-align:center}.course-comments__empty-icon{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#edf4ef;color:#47755a;font-size:20px}.course-comments__empty strong{font-size:14px;color:#66716b}.course-comments__empty p{margin:0;font-size:12px;line-height:1.7}.course-comments__notice{margin:14px 0 0;color:#9aa29e;font-size:11px;line-height:1.6}
</style>
