<template>
  <PlainLayout title="我的收藏">
    <!-- 搜索入口 -->
    <div class="fav__search" @click="showSearch = true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#999"
           stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" />
      </svg>
    </div>

    <SegmentedControl
      v-model="tab"
      :options="[
        { label: '收藏评论', value: 'comment' },
        { label: 'AI回答', value: 'answer' },
      ]"
      class="fav__seg"
    />

    <!-- 收藏评论 -->
    <div v-if="tab === 'comment'">
      <div v-for="c in favComments" :key="c.id" class="fav-comment">
        <span class="fav-comment__avatar">{{ c.name[0] }}</span>
        <div class="fav-comment__main">
          <p class="fav-comment__name">{{ c.name }}</p>
          <p class="fav-comment__text">{{ c.text }}</p>
          <div class="fav-comment__foot">
            <span class="text-caption">{{ c.tag }}</span>
            <button class="fav-comment__go" aria-label="查看原文" @click="goComment">→</button>
          </div>
        </div>
      </div>
    </div>

    <!-- AI 回答 -->
    <div v-else>
      <div v-for="a in favAnswers" :key="a.id" class="fav-answer">
        <p class="fav-answer__title">
          {{ a.title }}
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
          </svg>
        </p>
        <p class="fav-answer__text">{{ a.text }}</p>
        <button class="fav-answer__go" aria-label="查看回答"
                @click="$router.push({ name: 'answer', params: { id: 'a1' }, query: { q: a.title } })">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="9" /><path d="M9 12h6M12.5 9.5 15 12l-2.5 2.5" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 搜索弹层 -->
    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="showSearch" class="overlay" @click.self="showSearch = false">
          <div class="pop">
            <div class="pop__bar">
              <input v-model="keyword" class="pop__input" placeholder="请输入" />
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#999"
                   stroke-width="2" stroke-linecap="round">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" />
              </svg>
            </div>
            <p v-for="(h, i) in filteredHistory" :key="i" class="pop__suggest"
               @click="keyword = h">
              {{ h }}
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </PlainLayout>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import PlainLayout from "../layouts/PlainLayout.vue";
import SegmentedControl from "../components/SegmentedControl.vue";
import { favComments, favAnswers, searchHistory } from "../mock/data";

const router = useRouter();
const tab = ref("comment");
const showSearch = ref(false);
const keyword = ref("");

const filteredHistory = computed(() => {
  const k = keyword.value.trim();
  if (!k) return searchHistory;
  return searchHistory.filter((h) => h.includes(k));
});

const goComment = () => router.push({ name: "comments" });
</script>

<style scoped>
/* 搜索入口：44×44 可触区域（UI参数：未做卡片但应可点击） */
.fav__search {
  display: flex;
  align-items: center;
  width: 44px;
  height: 44px;
  margin-left: calc(var(--page-padding) - 8px);
  cursor: pointer;
  color: var(--color-text-caption);
}
.fav__seg {
  margin: 0 var(--page-padding) 10px;
}

.fav-comment {
  display: flex;
  gap: 10px;
  padding: 12px var(--page-padding);
  border-bottom: 1px solid var(--color-divider);
}
.fav-comment__avatar {
  flex: 0 0 36px;
  height: 36px; /* UI参数：头像 36×36 */
  border-radius: 50%;
  background: var(--color-primary-tint);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.fav-comment__main {
  flex: 1;
  min-width: 0;
}
.fav-comment__name {
  font-weight: 600;
  font-size: 14px;
}
.fav-comment__text {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-top: 3px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.fav-comment__foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}
.fav-comment__go {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--color-divider);
  color: var(--color-text-secondary);
  font-size: 12px;
}

.fav-answer {
  position: relative;
  padding: 12px var(--page-padding) 16px;
  border-bottom: 1px solid var(--color-divider);
}
.fav-answer__title {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 14px;
}
.fav-answer__text {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.8;
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.fav-answer__go {
  position: absolute;
  right: 14px;
  bottom: 10px;
  display: flex;
  color: var(--color-text-secondary);
}
</style>
