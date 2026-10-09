<template>
  <PlainLayout :title="moduleName" :back-to="backTarget">
    <div class="detail-page">
      <div class="detail-page__intro">
        <h1>{{ title }}</h1>
        <p>{{ moduleIntro }}</p>
      </div>

      <form class="knowledge-search" @submit.prevent="searchKnowledge">
        <input
          v-model.trim="keyword"
          :placeholder="searchPlaceholder"
          aria-label="知识库检索关键词"
        />
        <button type="submit" :disabled="ragState === 'loading'">
          {{ ragState === 'loading' ? '检索中' : '检索' }}
        </button>
      </form>

      <section class="knowledge-result" aria-live="polite">
        <div class="knowledge-result__head">
          <h2>{{ resultTitle }}</h2>
          <span v-if="ragState === 'loading'">正在查询知识库…</span>
        </div>

        <template v-if="ragState === 'success' && ragResults.length">
          <article v-for="(item, resultIndex) in ragResults" :key="item.id" class="knowledge-result__item">
            <div class="knowledge-result__label">相关结果 {{ resultIndex + 1 }}</div>
            <p v-for="(paragraph, index) in splitParagraphs(item.text)" :key="index">{{ paragraph }}</p>
            <div v-if="item.filename" class="knowledge-result__source">来源：{{ item.filename }}</div>
          </article>
        </template>

        <p v-else-if="ragState === 'empty'" class="knowledge-result__muted">
          当前知识库没有检索到足够可靠的内容。你可以换一个更具体的关键词继续查询。
        </p>
        <p v-else-if="ragState === 'error'" class="knowledge-result__muted">
          知识库暂时无法连接，请检查开发服务和 API Key 配置后重试。
        </p>
        <p v-else class="knowledge-result__muted">
          输入关键词后即可查询知识库中的相关资料。
        </p>
      </section>

      <section class="search-guide">
        <h2>检索提示</h2>
        <p>{{ guideText }}</p>
      </section>
    </div>
  </PlainLayout>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import PlainLayout from '../layouts/PlainLayout.vue';
import { learningModules, learningResources } from '../mock/data';
import { retrieveKnowledge } from '../services/ragApi';

const route = useRoute();
const RAG_COLLECTION_ID = import.meta.env.VITE_RAG_COLLECTION_ID || '01M0YMBJ181HRXGH4X9F976GN9';
const moduleId = computed(() => String(route.params.module || 'case'));
const moduleInfo = computed(() => learningModules.find((m) => m.id === moduleId.value));
const moduleName = computed(() => moduleInfo.value?.name || '学习资源');
const title = computed(() => String(route.query.title || moduleName.value));
const item = computed(() => (learningResources[moduleId.value] || []).find((x) => x.title === title.value));
const backTarget = computed(() => ({ name: 'learningResources', query: { module: moduleId.value } }));

const configs = {
  case: {
    intro: '围绕症状、舌脉、病机和辨证线索，从知识库中检索相关依据。',
    placeholder: '例如：肝血虚、湿疹、脾虚湿困',
    guide: '建议把病例中的关键症状、舌脉或证候名称组合起来检索。',
    prefix: '中医辨证',
  },
  formula: {
    intro: '查询中药、方剂及其功效、主治和相关理论。',
    placeholder: '例如：人参、四君子汤、龙胆泻肝汤',
    guide: '优先输入具体药名、方名或功效关键词，结果会更集中。',
    prefix: '中药方剂',
  },
  classic: {
    intro: '围绕经典理论关键词检索已收录的中医基础知识。',
    placeholder: '例如：阴阳、五行、藏象、气血津液',
    guide: '目前结果以已上传课程资料为准；知识库没有收录的经典原文不会凭空生成。',
    prefix: '中医经典',
  },
  meridian: {
    intro: '检索经络、穴位及相关人体结构和中医理论知识。',
    placeholder: '例如：足三里、合谷、胃经、督脉',
    guide: '可以直接输入穴位名、经络名或相关症状进行检索。',
    prefix: '经络穴位',
  },
  navigation: {
    intro: '输入你想学习的问题，让知识库帮助定位已有课程资料。',
    placeholder: '例如：我想了解五行之间的关系',
    guide: '尽量描述具体学习目标，例如“人体解剖学 胸椎 肋凹”。',
    prefix: '',
  },
};

const config = computed(() => configs[moduleId.value] || configs.navigation);
const moduleIntro = computed(() => config.value.intro);
const searchPlaceholder = computed(() => config.value.placeholder);
const guideText = computed(() => config.value.guide);
const keyword = ref(title.value);
const ragState = ref('idle');
const ragResults = ref([]);
const resultTitle = computed(() => keyword.value ? `“${keyword.value}”的检索结果` : '知识库检索结果');

function buildQuery() {
  const query = String(keyword.value || '').trim();
  // 查询词保持“模块提示 + 用户关键词”的简洁结构，避免大量泛化关键词
  // 稀释用户真正想检索的知识点。
  return [config.value.prefix, query].filter(Boolean).join(' · ');
}

async function searchKnowledge() {
  if (!keyword.value) return;
  ragResults.value = [];
  ragState.value = 'loading';
  try {
    const result = await retrieveKnowledge({
      query: buildQuery(),
      collectionId: RAG_COLLECTION_ID,
      topK: 6,
      minScore: 0.32,
    });
    ragResults.value = result.results || [];
    ragState.value = ragResults.value.length ? 'success' : 'empty';
  } catch (error) {
    console.warn('[Learning RAG]', error);
    ragState.value = 'error';
  }
}

const splitParagraphs = (text) => String(text || '')
  .split(/\n+/)
  .map(item => item.replace(/^[-•]\s*/gm, '').trim())
  .filter(Boolean);

if (keyword.value && moduleId.value !== 'framework') searchKnowledge();
</script>

<style scoped>
.detail-page { padding: 12px var(--page-padding) 34px; }
.detail-page__intro { padding: 4px 2px 14px; }
.detail-page__intro h1 { font-size: 24px; line-height: 1.35; margin: 0 0 7px; font-weight: 800; }
.detail-page__intro p { margin: 0; font-size: 13px; line-height: 1.75; color: var(--color-text-secondary); }
.knowledge-search { display: flex; gap: 8px; padding: 10px 0 14px; border-bottom: 1px solid var(--color-divider); }
.knowledge-search input { min-width: 0; flex: 1; height: 42px; border: 1px solid var(--color-divider); border-radius: 21px; background: var(--color-card); padding: 0 14px; color: var(--color-text); font-size: 14px; outline: none; }
.knowledge-search input:focus { border-color: var(--color-primary); }
.knowledge-search button { flex: 0 0 auto; height: 42px; padding: 0 17px; border-radius: 21px; background: var(--color-primary); color: #fff; font-size: 14px; }
.knowledge-search button:disabled { opacity: .6; }
.knowledge-result { padding: 18px 2px 4px; }
.knowledge-result__head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.knowledge-result__head h2, .search-guide h2 { margin: 0; font-size: 18px; line-height: 1.45; font-weight: 760; }
.knowledge-result__head span { color: var(--color-text-caption); font-size: 12px; white-space: nowrap; }
.knowledge-result__item { padding: 14px 14px 16px; margin: 0 0 14px; border: 1px solid var(--color-divider); border-radius: 14px; background: var(--color-card); }
.knowledge-result__label { display: inline-flex; margin: 0 0 8px; font-size: 11px; line-height: 1; color: var(--color-primary); background: rgba(39, 101, 64, .08); padding: 6px 8px; border-radius: 999px; }
.knowledge-result__item p { margin: 0 0 8px; font-size: 15px; line-height: 1.85; color: var(--color-text-secondary); white-space: pre-wrap; }
.knowledge-result__source { font-size: 12px; color: var(--color-text-caption); margin-top: 8px; }
.knowledge-result__muted { margin: 0; font-size: 13px; line-height: 1.8; color: var(--color-text-caption); }
.search-guide { margin-top: 18px; padding: 14px 2px 0; border-top: 1px solid var(--color-divider); }
.search-guide p { margin: 8px 0 0; font-size: 13px; line-height: 1.8; color: var(--color-text-caption); }
</style>
