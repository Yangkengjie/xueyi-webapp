<template>
  <div v-if="hideSelf" class="knowledge-tree">
    <KnowledgeOutlineNode
      v-for="child in node.children || []"
      :key="child.id"
      :node="child"
      :level="level"
      :course-id="courseId"
      :default-open="false"
      :memory-mode="memoryMode"
    />
  </div>

  <div v-else class="knowledge-node" :class="[`knowledge-node--level-${Math.min(level, 8)}`, { 'knowledge-node--leaf': !node.children?.length }]">
    <button
      class="knowledge-node__row"
      :class="{ 'knowledge-node__row--clickable': hasChildren, 'knowledge-node__row--open': isOpen }"
      :disabled="!hasChildren"
      type="button"
      :aria-expanded="hasChildren ? isOpen : undefined"
      @click="toggle"
    >
      <span v-if="level > 0" class="knowledge-node__bullet">{{ level <= 2 ? '•' : '—' }}</span>
      <span class="knowledge-node__title">{{ displayTitle }}</span>
      <span v-if="hasChildren" class="knowledge-node__arrow" :class="{ 'knowledge-node__arrow--open': isOpen }">▾</span>
    </button>
    <div class="knowledge-node__mark-wrap">
      <button
        type="button"
        class="knowledge-node__mark-button"
        :class="mark ? `knowledge-node__mark-button--${mark}` : ''"
        :aria-label="mark ? `学习标记：${markLabel}，点击修改` : '添加学习标记'"
        @click.stop="markMenuOpen = !markMenuOpen"
      >{{ mark ? markLabel : '＋' }}</button>
      <div v-if="markMenuOpen" class="knowledge-node__mark-menu" role="group" aria-label="选择掌握程度">
        <button
          v-for="option in knowledgeMarkOptions"
          :key="option.value"
          type="button"
          class="knowledge-node__mark-option"
          :class="[`knowledge-node__mark-option--${option.value}`, { 'knowledge-node__mark-option--selected': mark === option.value }]"
          @click.stop="chooseMark(option.value)"
        >{{ option.label }}</button>
        <button v-if="mark" type="button" class="knowledge-node__mark-clear" @click.stop="chooseMark('')">清除</button>
      </div>
    </div>

    <div v-if="hasChildren ? isOpen : (hasPayload || (memoryMode && node.tags?.length))" class="knowledge-node__details">
      <div v-if="visibleContent.length && !memoryMode" class="knowledge-node__content">
        <p v-for="(item, index) in visibleContent" :key="index" v-html="renderInlineMarkdown(item)"></p>
      </div>
      <div v-if="memoryMode && keywordItems.length" class="knowledge-node__keywords" aria-label="记忆关键词">
        <span v-for="keyword in keywordItems" :key="keyword" class="knowledge-node__keyword">{{ keyword }}</span>
      </div>
      <div v-if="node.notes?.length && !memoryMode" class="knowledge-node__notes">
        <p v-for="(item, index) in node.notes" :key="index" v-html="renderInlineMarkdown(cleanKnowledgeText(item))"></p>
      </div>

      <div v-if="node.images?.length" class="knowledge-node__images">
        <figure v-for="img in node.images" :key="img">
          <img :src="imageSrc(img)" :alt="displayTitle" @error="hideBrokenImage" />
        </figure>
      </div>

      <div v-if="node.children?.length" class="knowledge-node__children">
        <KnowledgeOutlineNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :level="level + 1"
          :course-id="courseId"
          :default-open="false"
          :memory-mode="memoryMode"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { getKnowledgeMark, getKnowledgeMarkLabel, knowledgeMarkOptions, setKnowledgeMark } from '../utils/knowledgeMarks';
defineOptions({ name: 'KnowledgeOutlineNode' });
const props = defineProps({
  node: { type: Object, required: true },
  courseId: { type: String, required: true },
  level: { type: Number, default: 0 },
  defaultOpen: { type: Boolean, default: true },
  hideSelf: { type: Boolean, default: false },
  memoryMode: { type: Boolean, default: false },
});

const isOpen = ref(props.defaultOpen);
const markMenuOpen = ref(false);
const mark = computed(() => getKnowledgeMark(props.courseId, props.node.id));
const markLabel = computed(() => getKnowledgeMarkLabel(mark.value));
function chooseMark(value) { setKnowledgeMark(props.courseId, props.node.id, value); markMenuOpen.value = false; }
const hasChildren = computed(() => Boolean(props.node.children?.length));
const hasPayload = computed(() => Boolean(
  props.node.content?.length || props.node.notes?.length || props.node.images?.length
));
const displayTitle = computed(() => cleanKnowledgeText(props.node.displayTitle || props.node.title || '')
  .replace(/\*\*/g, '')
  .replace(/\s+/g, ' ')
  .trim());

// 【】用于课程重点/考试提示，普通知识点视图只保留干净正文；不改写原始课程数据。
function cleanKnowledgeText(value) {
  return String(value || '').replace(/【[^】]*】/g, '').replace(/[ \t]{2,}/g, ' ').trim();
}

const normalize = (value) => String(value || '')
  .replace(/\*\*/g, '')
  .replace(/[\s：:，,。；;、（）()【】\[\]—-]/g, '')
  .toLowerCase();

const visibleContent = computed(() => (props.node.content || []).map((item) => cleanKnowledgeText(item)).filter((item) => {
  const content = normalize(item);
  const title = normalize(displayTitle.value);
  // 标题已经完整包含正文时，不再把同一段文字重复显示一次。
  return content && !(title.includes(content) || content.includes(title));
}));
const keywordItems = computed(() => {
  // 记忆模式只展示课程中已有的重点标注，不再从普通正文自动猜测关键词。
  const found = [];
  const add = (raw) => {
    const value = String(raw || '')
      .replace(/\*\*/g, '')
      .replace(/==/g, '')
      .replace(/[“”‘’「」『』]/g, '')
      .replace(/^\s*(?:(?:第\s*[一二三四五六七八九十百0-9]+[章节节篇])|(?:\d+[.、)）]))\s*/, '')
      .replace(/[\s：:，,。；;、（）()【】\[\]—–-]+$/g, '')
      .trim();
    if (!value || value.length < 2 || value.length > 30) return;
    if (!found.includes(value) && found.length < 12) found.push(value);
  };

  // 标签字段是正式标注来源，优先展示。
  for (const tag of props.node.tags || []) add(tag);

  // 同时支持标题/正文/注释中的显式重点标记：**关键词**、==关键词==、【重点提示】。
  const rawSource = [props.node.displayTitle, props.node.title, ...(props.node.content || []), ...(props.node.notes || [])].join('\n');
  const markedPattern = /\*\*(.+?)\*\*|==(.+?)==|【([^】]+)】/g;
  let match;
  while ((match = markedPattern.exec(rawSource)) !== null) add(match[1] || match[2] || match[3]);

  return found;
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 课程数据已由 Markdown 转换为结构化节点；这里保留常用的行内格式，且先转义原文，避免把正文当作 HTML 执行。
function renderInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/==(.+?)==/g, '<mark>$1</mark>');
}

const toggle = () => { if (hasChildren.value) isOpen.value = !isOpen.value; };
const imageSrc = (img) => `/course-images/${encodeURIComponent(img)}`;
const hideBrokenImage = (event) => { event.currentTarget.closest('figure')?.remove(); };
</script>

<style scoped>
.knowledge-tree{display:grid;gap:6px}
.knowledge-node{position:relative;margin:0;color:var(--color-text)}
.knowledge-node__row{width:100%;display:flex;align-items:flex-start;gap:9px;padding:7px 66px 7px 0;border:0;background:transparent;text-align:left;color:inherit;font:inherit;line-height:1.65}
.knowledge-node__row--clickable{cursor:pointer}.knowledge-node__row:disabled{cursor:default}
.knowledge-node__bullet{font-size:16px;line-height:1.65;color:#60706c;flex:0 0 auto}
.knowledge-node__title{font-size:15px;font-weight:500;letter-spacing:.005em;flex:1;min-width:0;overflow-wrap:anywhere}
.knowledge-node__mark-wrap{position:absolute;right:0;top:5px;z-index:2}
.knowledge-node__mark-button{min-width:28px;min-height:26px;padding:3px 7px;border:1px solid #dce5e0;border-radius:999px;background:#f7faf8;color:#687570;font-size:11px;line-height:1.2;white-space:nowrap}
.knowledge-node__mark-button--mastered{background:#e7f4eb;border-color:#b9ddc4;color:#1d6637}
.knowledge-node__mark-button--familiar{background:#edf4ff;border-color:#c8daf8;color:#315d9c}
.knowledge-node__mark-button--understood{background:#fff7df;border-color:#f0dfaa;color:#8a6a13}
.knowledge-node__mark-button--weak{background:#fff0ee;border-color:#f0c8c2;color:#b4483c}
.knowledge-node__mark-menu{position:absolute;right:0;top:31px;display:flex;flex-wrap:wrap;gap:5px;width:170px;padding:8px;background:#fff;border:1px solid #e2e8e4;border-radius:12px;box-shadow:0 6px 20px #173b2b1a}
.knowledge-node__mark-option,.knowledge-node__mark-clear{border:1px solid #e0e6e2;border-radius:999px;background:#fff;color:#3f4b46;padding:5px 8px;font-size:12px;white-space:nowrap}
.knowledge-node__mark-option--mastered.knowledge-node__mark-option--selected{background:#e7f4eb;border-color:#b9ddc4;color:#1d6637}
.knowledge-node__mark-option--familiar.knowledge-node__mark-option--selected{background:#edf4ff;border-color:#c8daf8;color:#315d9c}
.knowledge-node__mark-option--understood.knowledge-node__mark-option--selected{background:#fff7df;border-color:#f0dfaa;color:#8a6a13}
.knowledge-node__mark-option--weak.knowledge-node__mark-option--selected{background:#fff0ee;border-color:#f0c8c2;color:#b4483c}
.knowledge-node__mark-clear{color:#8a918f}
/* 保持原有简洁课程树：只通过字号、字重、缩进区分层级，不增加卡片或边框。 */
.knowledge-node--level-0{padding:2px 0 8px}.knowledge-node--level-0>.knowledge-node__mark-wrap{top:8px}
.knowledge-node--level-0>.knowledge-node__row .knowledge-node__title{font-size:25px;font-weight:800;line-height:1.4}
.knowledge-node--level-1>.knowledge-node__row{padding-top:9px;padding-bottom:8px}
.knowledge-node--level-1>.knowledge-node__row .knowledge-node__title{font-size:21px;font-weight:760;line-height:1.5}
.knowledge-node--level-2>.knowledge-node__row .knowledge-node__title{font-size:19px;font-weight:680;line-height:1.55}
.knowledge-node--level-3>.knowledge-node__row .knowledge-node__title{font-size:17px;font-weight:620;line-height:1.65}
.knowledge-node--level-4 .knowledge-node__title{font-size:16px;font-weight:560}
.knowledge-node--level-5 .knowledge-node__title,.knowledge-node--level-6 .knowledge-node__title,.knowledge-node--level-7 .knowledge-node__title,.knowledge-node--level-8 .knowledge-node__title{font-size:15px;font-weight:500;color:var(--color-text-secondary)}
.knowledge-node__arrow{flex:0 0 auto;margin-top:6px;font-size:14px;line-height:1;color:var(--color-primary);transition:transform .18s ease;transform:rotate(-90deg)}
.knowledge-node__arrow--open{transform:rotate(0)}
.knowledge-node__details{padding-bottom:5px}
.knowledge-node__children{margin:2px 0 5px 10px;padding-left:14px;border-left:1px solid #dfe4e2}
.knowledge-node--level-2 .knowledge-node__children{border-left-color:#e7ebe9}
.knowledge-node--level-3 .knowledge-node__children,.knowledge-node--level-4 .knowledge-node__children{border-left-color:#eef1f0}
.knowledge-node__keywords{display:flex;flex-wrap:wrap;gap:7px;margin:4px 0 10px 26px}.knowledge-node__keyword{display:inline-flex;align-items:center;min-height:28px;padding:4px 10px;border:1px solid #d6e7dc;border-radius:8px;background:#edf7f0;color:#215d38;font-size:13px;font-weight:650;line-height:1.5;overflow-wrap:anywhere}.knowledge-node__content{margin:2px 0 8px 26px;color:#66706f}
.knowledge-node__content p{font-size:16px;line-height:1.85;margin:0 0 8px;font-weight:400;overflow-wrap:anywhere;word-break:normal}.knowledge-node__content strong,.knowledge-node__notes strong{font-weight:750;color:var(--color-text)}.knowledge-node__content code,.knowledge-node__notes code{padding:1px 4px;border-radius:4px;background:#f0f3f1;font-size:.92em}.knowledge-node__content mark,.knowledge-node__notes mark{background:#fff0b8;color:inherit;padding:0 2px;border-radius:3px}
.knowledge-node__notes{margin:2px 0 8px 26px;color:#8a918f}
.knowledge-node__notes p{font-size:14px;line-height:1.8;margin:0 0 6px;overflow-wrap:anywhere;word-break:normal}
.knowledge-node__images{display:grid;gap:8px;margin:7px 0 8px 26px}
.knowledge-node__images figure{margin:0}.knowledge-node__images img{display:block;max-width:100%;max-height:420px;border-radius:14px;background:#f7f7f5;object-fit:contain}
@media (max-width:380px){
  .knowledge-node--level-0>.knowledge-node__row .knowledge-node__title{font-size:23px}
  .knowledge-node--level-1>.knowledge-node__row .knowledge-node__title{font-size:20px}
  .knowledge-node--level-2>.knowledge-node__row .knowledge-node__title{font-size:18px}
  .knowledge-node--level-3>.knowledge-node__row .knowledge-node__title{font-size:16px}
  .knowledge-node__children{margin-left:6px;padding-left:10px}
  .knowledge-node__row{padding-right:60px}
  .knowledge-node__mark-menu{width:158px}
}
</style>
