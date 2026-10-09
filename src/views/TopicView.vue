<template>
  <PlainLayout :title="detail.course">
    <template #right>
      <button class="topic__switch" @click="$router.push({ name: 'course', params: { id: 'tcm-basic' } })">
        切换导图
      </button>
    </template>

    <div class="topic__body">
      <OutlineNode
        v-for="node in tree"
        :key="node.id"
        :node="node"
        :depth="0"
        @longpress="onLongPress"
        @link="openWeakLink"
      />
      <div style="height: 90px"></div>
    </div>

    <!-- 编辑工具栏（编辑模式时出现在底部栏上方） -->
    <Transition name="toast-fade">
      <div v-if="editMode" class="topic__toolbar">
        <button v-for="t in toolbar" :key="t.label" class="topic__tool"
                :title="t.label" @click="onTool(t.label)">
          <span v-html="t.icon"></span>
        </button>
        <button class="topic__tool topic__tool--done" @click="editMode = false">完成</button>
      </div>
    </Transition>

    <!-- 底部：评论 + 输入 + 搜索 -->
    <div class="topic__bar" :style="editMode ? { bottom: 'calc(48px + var(--safe-bottom))' } : {}">
      <button class="topic__comment" @click="$router.push({ name: 'comments' })">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
        </svg>
        <span class="topic__comment-count">{{ detail.commentCount }}条</span>
      </button>
      <div class="topic__input" @click="editMode = true">
        <span class="topic__input-ph">{{ editMode ? "编辑中……" : "补充你的想法……" }}</span>
      </div>
      <button class="topic__icon" aria-label="搜索" @click="showSearch = true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" />
        </svg>
      </button>
    </div>

    <!-- 长按节点菜单：编辑文字 / 删除 -->
    <ContextMenu
      :visible="nodeMenu.visible"
      :x="nodeMenu.x"
      :y="nodeMenu.y"
      :items="[{ label: '编辑文字' }, { label: '删除' }]"
      @select="onNodeMenuSelect"
      @close="nodeMenu.visible = false"
    />

    <!-- @ 关联搜索弹层 -->
    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="showLinkSearch" class="overlay" @click.self="showLinkSearch = false">
          <div class="pop">
            <div class="pop__bar">
              <input v-model="linkKeyword" class="pop__input" placeholder="请输入" />
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#999"
                   stroke-width="2" stroke-linecap="round">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" />
              </svg>
            </div>
            <p v-for="(r, i) in linkResults" :key="i" class="pop__result" @click="pickLink(r)">
              <span class="pop__result-title">{{ r.title }}（……）</span>
              <span class="pop__result-cat">▤ {{ r.cat }}</span>
            </p>
            <p v-if="!linkResults.length" class="pop__empty text-caption">无匹配结果</p>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 弱关联点击浮层（右侧抽屉卡片） -->
    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="weakPanel" class="overlay" @click.self="weakPanel = null">
          <div class="weak">
            <div class="weak__head">
              <p class="weak__title">
                {{ weakPanel.title }} <span class="weak__tag">{{ weakPanel.tag }}</span>
              </p>
              <button class="weak__close" aria-label="关闭" @click="weakPanel = null">×</button>
            </div>
            <p class="weak__body">{{ weakPanel.body }}</p>
            <p v-for="(d, i) in weakPanel.diagnosis" :key="i" class="weak__diag">{{ d }}</p>
            <div v-if="weakPanel.tag === '@肝血虚'" class="weak__img">图片</div>
            <p class="weak__body">{{ weakPanel.extra }}</p>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 页面内搜索弹层（输入即联想） -->
    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="showSearch" class="overlay" @click.self="showSearch = false">
          <div class="pop">
            <div class="pop__bar">
              <input v-model="searchKeyword" class="pop__input" placeholder="请输入" />
              <button class="pop__go" aria-label="搜索" @click="toast('已定位到相关段落')">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round">
                  <circle cx="12" cy="12" r="9" /><path d="M9 12h6M12.5 9.5 15 12l-2.5 2.5" />
                </svg>
              </button>
            </div>
            <p v-for="(s, i) in filteredSuggest" :key="i" class="pop__suggest"
               @click="showSearch = false; toast('已定位：' + s)">
              {{ s }}
            </p>
            <p v-if="!filteredSuggest.length" class="pop__empty text-caption">无匹配结果</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </PlainLayout>
</template>

<script setup>
import { ref, computed } from "vue";
import PlainLayout from "../layouts/PlainLayout.vue";
import ContextMenu from "../components/ContextMenu.vue";
import OutlineNode from "../components/OutlineNode.vue";
import { topicDetail, weakLinkPanels, linkSearchPool, searchSuggest } from "../mock/data";
import { toast } from "../utils/feedback";

const detail = topicDetail;
const tree = ref(JSON.parse(JSON.stringify(detail.tree)));
const editMode = ref(false);

/* ---- 长按节点：编辑文字 / 删除 ---- */
const nodeMenu = ref({ visible: false, x: null, y: null, node: null });
const onLongPress = ({ node, x, y }) => {
  nodeMenu.value = { visible: true, x, y, node };
};

const onNodeMenuSelect = (item) => {
  const node = nodeMenu.value.node;
  if (item.label === "编辑文字") {
    editMode.value = true;
    editingNode.value = node;
    toast("已进入编辑模式");
  } else if (item.label === "删除") {
    removeNode(tree.value, node.id);
    toast("已删除该节点");
  }
};

const removeNode = (list, id) => {
  const i = list.findIndex((n) => n.id === id);
  if (i >= 0) return list.splice(i, 1);
  for (const n of list) if (n.children?.length) removeNode(n.children, id);
};

/* ---- 编辑工具栏 ---- */
const editingNode = ref(null);
const toolbar = [
  { label: "标签", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 12 9-9h9v9l-9 9-9-9z"/><circle cx="16" cy="8" r="1.5"/></svg>' },
  { label: "列表", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>' },
  { label: "文字", icon: '<span style="font-family:serif;font-size:17px">T</span>' },
  { label: "加粗", icon: '<span style="font-weight:800;font-size:16px">B</span>' },
  { label: "关联", icon: '<span style="font-size:18px">@</span>' },
  { label: "链接", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>' },
  { label: "图片", icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4.5 17 4.5-4.5 3.5 3.5 3-3 4 4"/></svg>' },
];

const onTool = (label) => {
  if (label === "关联") {
    showLinkSearch.value = true;
  } else if (label === "加粗") {
    toast("已切换加粗");
  } else {
    toast(`已插入「${label}」`);
  }
};

/* ---- @ 关联搜索 ---- */
const showLinkSearch = ref(false);
const linkKeyword = ref("");
const linkResults = computed(() => {
  const k = linkKeyword.value.trim();
  if (!k) return linkSearchPool;
  return linkSearchPool.filter((r) => r.title.includes(k));
});

const pickLink = (r) => {
  const node = editingNode.value || findNode(tree.value, "pi-yunhua");
  if (node) {
    node.links = [...(node.links || []), r.title];
  }
  showLinkSearch.value = false;
  toast(`已关联 @${r.title}`);
};

const findNode = (list, id) => {
  for (const n of list) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const hit = findNode(n.children, id);
      if (hit) return hit;
    }
  }
  return null;
};

/* ---- 弱关联浮层 ---- */
const weakPanel = ref(null);
const openWeakLink = (name) => {
  weakPanel.value = weakLinkPanels[name] || {
    title: "关联知识",
    tag: "@" + name,
    body: "该知识点的详细内容正在建设中。",
    diagnosis: [],
    extra: "",
  };
};

/* ---- 页面内搜索 ---- */
const showSearch = ref(false);
const searchKeyword = ref("");
const filteredSuggest = computed(() => {
  const k = searchKeyword.value.trim();
  if (!k) return searchSuggest;
  return searchSuggest.filter((s) => s.includes(k));
});
</script>

<style scoped>
.topic__switch {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-pill);
  padding: 4px 10px;
  background: var(--color-card);
}

.topic__body {
  padding: 4px var(--page-padding) 0;
}

/* 底部栏：搜索栏高40 r20，圆形按钮 44×44（UI参数） */
.topic__bar {
  position: fixed;
  bottom: var(--safe-bottom);
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--page-width);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px var(--page-padding);
  background: var(--color-bg);
  z-index: 100;
}
.topic__comment {
  width: 44px;
  height: 44px; /* UI参数：圆形按钮 44×44 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  line-height: 1.1;
}
.topic__comment-count {
  font-size: 10px;
  transform: scale(0.9);
}
.topic__input {
  flex: 1;
  height: 40px; /* UI参数：搜索栏 246×40，圆角 20 */
  display: flex;
  align-items: center;
  background: var(--color-card);
  border-radius: var(--radius-bar);
  box-shadow: var(--shadow-card);
  padding: 0 16px;
}
.topic__input-ph {
  color: var(--color-text-caption);
  font-size: var(--font-size-body);
}
.topic__icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

/* 编辑工具栏 */
.topic__toolbar {
  position: fixed;
  bottom: var(--safe-bottom);
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--page-width);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px var(--page-padding);
  background: var(--color-card);
  border-top: 1px solid var(--color-divider);
  z-index: 101;
}
.topic__tool {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 6px 0;
  color: var(--color-text-secondary);
}
.topic__tool:active {
  color: var(--color-primary);
}
.topic__tool--done {
  color: var(--color-primary);
  font-weight: 600;
  font-size: 13px;
}
</style>

<style>
/* 弹层通用样式（Teleport 到 body，不能用 scoped） */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
}

.pop {
  align-self: flex-start;
  margin-top: 60px;
  width: calc(100% - 32px);
  max-width: 448px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  padding: 12px 14px;
  max-height: 60vh;
  overflow-y: auto;
}
.pop__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f0ee;
  border-radius: 999px;
  padding: 9px 14px;
  margin-bottom: 8px;
}
.pop__input {
  flex: 1;
  font-size: 14px;
  color: #1a1a1a;
}
.pop__go {
  display: flex;
  color: #666;
}
.pop__result {
  padding: 10px 4px;
  border-bottom: 1px solid #f2f2f0;
  cursor: pointer;
}
.pop__result-title {
  display: block;
  font-size: 15px;
  font-weight: 500;
}
.pop__result-cat {
  font-size: 12px;
  color: #999;
}
.pop__suggest {
  padding: 9px 4px;
  font-size: 15px;
  border-bottom: 1px solid #f2f2f0;
  cursor: pointer;
}
.pop__suggest:active,
.pop__result:active {
  background: #f6f6f4;
}
.pop__empty {
  padding: 14px 4px;
}

.weak {
  align-self: flex-start;
  margin-top: calc(60px + var(--safe-top));
  width: calc(72% );
  max-width: 320px;
  margin-right: 8px;
  margin-left: auto;
  background: #fff;
  border-radius: 14px 0 0 14px;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.12);
  padding: 16px;
  max-height: 72vh;
  overflow-y: auto;
}
.weak__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.weak__title {
  font-weight: 600;
  font-size: 15px;
}
.weak__tag {
  color: #999;
  font-weight: 400;
  font-size: 13px;
}
.weak__close {
  font-size: 20px;
  color: #999;
  line-height: 1;
  padding: 0 2px;
}
.weak__body {
  font-size: 14px;
  line-height: 1.8;
  margin-top: 10px;
  text-align: justify;
}
.weak__diag {
  font-size: 14px;
  font-weight: 500;
  margin-top: 4px;
}
.weak__img {
  height: 150px;
  margin: 12px 0;
  background: #f0f0ee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 18px;
}
</style>
