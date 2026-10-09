<template>
  <PlainLayout title="咨询与反馈">
    <p class="support__greet">{{ greeting }}，有任何问题都可以告诉我们～</p>

    <div class="support__search">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#999"
           stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" />
      </svg>
      <label class="visually-hidden" for="faq-search">搜索常见问题</label>
      <input id="faq-search" v-model="keyword" class="support__search-input" placeholder="搜索常见问题" aria-label="搜索常见问题" />
    </div>

    <div class="support__tabs" role="tablist" aria-label="咨询与反馈切换">
      <button
        v-for="t in ['咨询', '反馈']"
        :key="t"
        role="tab"
        :aria-selected="tab === t"
        class="support__tab"
        :class="{ 'support__tab--on': tab === t }"
        @click="tab = t"
      >
        {{ t }}
      </button>
    </div>

    <div v-if="tab === '咨询'" role="tabpanel">
      <div v-if="!filteredFaq.length" class="empty-state" style="padding:24px var(--page-padding)">
        <p class="empty-state__text">没有匹配的问题，试试其他关键词，或到「反馈」告诉我们。</p>
      </div>
      <div v-for="(f, i) in filteredFaq" :key="i" class="faq">
        <button class="faq__q" :aria-expanded="openIdx === i" @click="openIdx = openIdx === i ? -1 : i">
          <span>{{ f.q }}</span>
          <span class="faq__chev" :class="{ 'faq__chev--open': openIdx === i }" aria-hidden="true">›</span>
        </button>
        <p v-if="openIdx === i" class="faq__a">{{ f.a }}</p>
      </div>
    </div>

    <div v-else class="feedback" role="tabpanel">
      <div class="feedback__row">
        <label class="feedback__label" for="fb-category">反馈类型</label>
        <select id="fb-category" v-model="fbCategory" class="feedback__select" aria-label="反馈类型">
          <option v-for="c in fbCategories" :key="c.value" :value="c.value">{{ c.label }}</option>
        </select>
      </div>
      <div class="feedback__row">
        <label class="feedback__label" for="fb-text">反馈内容</label>
        <label class="visually-hidden" for="fb-text">反馈内容，不少于5个字</label>
        <textarea
          id="fb-text"
          v-model="feedbackText"
          class="feedback__area"
          rows="5"
          maxlength="500"
          aria-describedby="fb-hint"
          placeholder="请描述你遇到的问题或建议（不少于5个字）……"
        ></textarea>
        <p class="text-caption feedback__hint" id="fb-hint">
          {{ feedbackText.length }}/500 · 我们会认真对待每一条反馈
        </p>
      </div>
      <div class="feedback__row">
        <label class="feedback__label" for="fb-contact">联系方式（选填）</label>
        <input
          id="fb-contact"
          v-model="fbContact"
          class="feedback__input"
          placeholder="便于我们回访，如手机号 / 邮箱"
          maxlength="64"
          aria-label="联系方式 选填"
        />
      </div>
      <button class="feedback__submit" @click="submitFeedback" :disabled="submitting">
        {{ submitting ? '提交中...' : '提交反馈' }}
      </button>

      <div v-if="fbHistory.length" class="fb-history">
        <p class="fb-history__title">最近反馈</p>
        <div v-for="h in fbHistory.slice(0,5)" :key="h.id" class="fb-item">
          <div class="fb-item__head">
            <span class="fb-item__cat">{{ h.category }}</span>
            <span class="text-caption">{{ h.status }}</span>
          </div>
          <p class="fb-item__content">{{ h.content }}</p>
          <p class="text-caption">{{ new Date(h.submittedAt).toLocaleString('zh-CN') }}</p>
        </div>
      </div>
    </div>
  </PlainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import PlainLayout from "../layouts/PlainLayout.vue";
import { faqConsult } from "../mock/data";
import * as feedbackApi from "../api/feedback";
import { toast, showLoading, hideLoading } from "../utils/feedback";

const hour = new Date().getHours();
const greeting = hour < 11 ? "早安" : hour < 14 ? "午安" : hour < 18 ? "下午好" : "晚安";

const tab = ref("咨询");
const keyword = ref("");
const openIdx = ref(-1);
const feedbackText = ref("");
const fbContact = ref("");
const fbCategory = ref("建议");
const submitting = ref(false);
const fbHistory = ref([]);

const fbCategories = [
  { value: "建议", label: "功能建议" },
  { value: "缺陷", label: "缺陷 / 错误" },
  { value: "内容", label: "内容问题" },
  { value: "体验", label: "体验反馈" },
  { value: "其他", label: "其他" },
];

const filteredFaq = computed(() => {
  const k = keyword.value.trim();
  if (!k) return faqConsult;
  return faqConsult.filter((f) => f.q.includes(k) || f.a.includes(k));
});

async function loadHistory() {
  const res = await feedbackApi.getFeedbackHistory();
  if (res.code === 200) fbHistory.value = res.data;
}

async function submitFeedback() {
  if (submitting.value) return;
  const trimmed = feedbackText.value.trim();
  if (!trimmed) {
    toast("请先填写反馈内容");
    return;
  }
  if (trimmed.length < 5) {
    toast("反馈内容不少于 5 个字");
    return;
  }
  submitting.value = true;
  showLoading("提交反馈中");
  try {
    const res = await feedbackApi.submitFeedback({
      category: fbCategory.value,
      content: trimmed,
      contact: fbContact.value.trim(),
    });
    if (res.code === 200) {
      feedbackText.value = "";
      fbContact.value = "";
      toast("反馈提交成功，谢谢您！");
      loadHistory();
    } else {
      toast(res.msg || "提交失败，请稍后再试");
    }
  } catch (e) {
    const msg = e?.message || "提交失败，请稍后再试";
    if (/频繁|RATE_LIMIT/i.test(msg)) {
      toast("提交过于频繁，请稍候 1 分钟再试");
    } else if (/重复|DUPLICATE/i.test(msg)) {
      toast("检测到重复提交，相同内容 1 小时内仅需提交一次");
    } else {
      toast(msg);
    }
  } finally {
    hideLoading();
    submitting.value = false;
  }
}

onMounted(loadHistory);
</script>

<style scoped>
.support__greet {
  padding: 10px var(--page-padding);
  font-size: 14px;
}

.support__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 var(--page-padding) 6px;
  background: var(--color-input-bg);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
}
.support__search-input {
  flex: 1;
  font-size: 14px;
  color: var(--color-text);
}

.support__tabs {
  display: flex;
  padding: 0 var(--page-padding);
}
.support__tab {
  flex: 1;
  padding: 12px 0;
  font-size: 15px;
  color: var(--color-text);
  border-bottom: 2px solid transparent;
}
.support__tab--on {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 500;
}

.faq {
  border-bottom: 1px solid var(--color-divider);
  margin: 0 var(--page-padding);
}
.faq__q {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 15px 2px;
  font-size: 14px;
  text-align: left;
}
.faq__chev {
  color: var(--color-text-caption);
  transition: transform 0.15s ease;
  display: inline-block;
}
.faq__chev--open {
  transform: rotate(90deg);
}
.faq__a {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.8;
  padding: 0 2px 14px;
}

.feedback {
  padding: 14px var(--page-padding);
}
.feedback__row {
  margin-bottom: 14px;
}
.feedback__label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--color-text);
}
.feedback__select,
.feedback__input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  background: var(--color-card);
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-card);
  color: var(--color-text);
}
.feedback__area {
  width: 100%;
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.7;
  resize: none;
  color: var(--color-text);
  border: 1px solid var(--color-divider);
}
.feedback__hint {
  margin-top: 6px;
  color: var(--color-text-caption);
}
.feedback__submit {
  margin-top: 4px;
  width: 100%;
  padding: 12px 0;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-pill);
  font-size: 15px;
}
.feedback__submit:disabled { opacity: 0.6; }
.feedback__submit:active { opacity: 0.85; }

.fb-history {
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid var(--color-divider);
}
.fb-history__title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 10px;
}
.fb-item {
  padding: 12px;
  background: var(--color-input-bg);
  border-radius: var(--radius-card);
  margin-bottom: 10px;
}
.fb-item__head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.fb-item__cat {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--color-primary-tint);
  color: var(--color-primary);
  border-radius: 999px;
}
.fb-item__content {
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 4px;
  color: var(--color-text);
}
.empty-state__text {
  font-size: 13px;
  color: var(--color-text-caption);
}
.visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
</style>
