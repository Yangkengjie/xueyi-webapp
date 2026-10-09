<template>
  <!-- 知识速查：搜索 + 联想 + 历史 -->
  <PlainLayout title="知识速查">
    <div class="qs__bar">
      <input
        v-model="keyword"
        class="qs__input"
        placeholder="请输入"
        @keyup.enter="search"
      />
      <button class="qs__go" aria-label="搜索" @click="search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="9" /><path d="M9 12h6M12.5 9.5 15 12l-2.5 2.5" />
        </svg>
      </button>
    </div>

    <!-- 输入联想 -->
    <div v-if="keyword && !searched">
      <p v-for="(s, i) in suggests" :key="i" class="qs__suggest" @click="pick(s)">{{ s }}</p>
      <p v-if="!suggests.length" class="qs__empty text-caption">无联想结果，直接回车搜索</p>
    </div>

    <!-- 搜索结果 -->
    <div v-else-if="searched">
      <p v-for="(r, i) in results" :key="i" class="qs__result" @click="open(r)">
        <span class="qs__result-title">{{ r.title }}（……）</span>
        <span class="qs__result-cat">▤ {{ r.cat }}</span>
      </p>
      <p v-if="!results.length" class="qs__empty text-caption">未找到「{{ keyword }}」相关内容</p>
    </div>

    <!-- 历史搜索 -->
    <div v-else>
      <div class="qs__history">
        <span v-for="(h, i) in historyList" :key="i" class="qs__tag">
          <span @click="pick(h)">{{ h }}</span>
          <button class="qs__tag-x" aria-label="删除" @click="removeHistory(i)">×</button>
        </span>
      </div>
    </div>
  </PlainLayout>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import PlainLayout from "../layouts/PlainLayout.vue";
import { searchSuggest, searchHistory, linkSearchPool } from "../mock/data";

const router = useRouter();
const keyword = ref("");
const searched = ref(false);

const historyList = ref(
  JSON.parse(localStorage.getItem("xy-search-history") || "null") || [...searchHistory]
);

const suggests = computed(() =>
  searchSuggest.filter((s) => s.includes(keyword.value.trim()))
);
const results = computed(() => {
  const k = keyword.value.trim();
  return linkSearchPool.filter((r) => r.title.includes(k));
});

const saveHistory = (k) => {
  if (!k) return;
  historyList.value = [k, ...historyList.value.filter((h) => h !== k)].slice(0, 20);
  localStorage.setItem("xy-search-history", JSON.stringify(historyList.value));
};

const search = () => {
  searched.value = true;
  saveHistory(keyword.value.trim());
};
const pick = (s) => {
  keyword.value = s;
  search();
};
const removeHistory = (i) => {
  historyList.value.splice(i, 1);
  localStorage.setItem("xy-search-history", JSON.stringify(historyList.value));
};

const open = (r) => router.push({ name: "topic" });
</script>

<style scoped>
.qs__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px var(--page-padding) 12px;
  background: var(--color-input-bg);
  border-radius: var(--radius-pill);
  padding: 10px 16px;
}
.qs__input {
  flex: 1;
  font-size: 14px;
}
.qs__go {
  display: flex;
  color: var(--color-text-secondary);
}

.qs__suggest,
.qs__result {
  padding: 11px var(--page-padding);
  border-bottom: 1px solid var(--color-divider);
  font-size: 15px;
  cursor: pointer;
}
.qs__suggest:active,
.qs__result:active {
  background: var(--color-input-bg);
}
.qs__result-title {
  display: block;
  font-weight: 500;
}
.qs__result-cat {
  font-size: 12px;
  color: var(--color-text-caption);
}
.qs__empty {
  padding: 16px var(--page-padding);
}

.qs__history {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 16px;
  padding: 4px var(--page-padding);
}
.qs__tag {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding: 8px 2px;
}
.qs__tag-x {
  color: var(--color-text-caption);
  border: 1px solid var(--color-divider);
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 11px;
  line-height: 1;
}
</style>
