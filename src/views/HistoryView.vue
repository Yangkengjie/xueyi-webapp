<template>
  <PlainLayout title="历史">
    <div class="history">
      <div class="history__tabs" role="tablist" aria-label="历史记录筛选">
        <button
          v-for="t in filters"
          :key="t.value"
          class="history__tab"
          :class="{ 'history__tab--active': filterMode === t.value }"
          role="tab"
          @click="filterMode = t.value"
        >
          {{ t.label }}
        </button>
      </div>

      <template v-if="groups.length">
        <div v-for="group in groups" :key="group.group" class="history__group">
          <p class="history__date">{{ group.group }}</p>
          <p
            v-for="item in group.items"
            :key="item.id"
            class="history__item"
            @click="open(item)"
          >
            {{ item.title }}
          </p>
        </div>
      </template>

      <div v-else class="history__empty">
        <p>{{ emptyText }}</p>
        <button @click="router.push({ name: 'tutor' })">{{ emptyAction }}</button>
      </div>
    </div>
  </PlainLayout>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import PlainLayout from "../layouts/PlainLayout.vue";
import { getConversations, formatHistoryGroups } from "../utils/chatStore";

const router = useRouter();
const filters = [
  { value: "all", label: "全部" },
  { value: "qa", label: "答疑" },
  { value: "plan", label: "规划" },
];
const filterMode = ref("all");

const conversations = computed(() => {
  const all = getConversations();
  if (filterMode.value === "all") return all;
  return all.filter((c) => c.mode === filterMode.value);
});
const groups = computed(() => formatHistoryGroups(conversations.value));
const emptyText = computed(() =>
  filterMode.value === "plan" ? "还没有规划记录" : filterMode.value === "qa" ? "还没有答疑记录" : "还没有新的对话"
);
const emptyAction = computed(() => (filterMode.value === "plan" ? "开始一次规划" : "开始一次答疑"));

const open = (conversation) => router.push({ name: "answer", params: { id: conversation.id } });
</script>

<style scoped>
.history__tabs {
  display: flex;
  gap: 8px;
  padding: 10px var(--page-padding);
}
.history__tab {
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 14px;
  color: var(--color-text-secondary);
  background: var(--color-input-bg, #f2f3f5);
}
.history__tab--active {
  color: #fff;
  background: var(--color-primary, #2f6fed);
}
.history__group { padding:0 var(--page-padding); }
.history__date { font-size:var(--font-size-caption); color:var(--color-text-caption); padding:14px 0 6px; }
.history__item { padding:7px 10px; border-radius:var(--radius-sm); font-size:15px; cursor:pointer; }
.history__item:active { background:var(--color-input-bg); }
.history__empty { padding:60px 20px; text-align:center; color:var(--color-text-caption); }
.history__empty button { margin-top:16px; color:var(--color-primary); }
.history__legacy { margin-top:12px; padding-top:12px; border-top:1px solid var(--color-border); }
.history__legacy-title { padding:0 var(--page-padding); font-size:var(--font-size-caption); color:var(--color-text-secondary); }
</style>
