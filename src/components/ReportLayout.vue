<template>
  <div class="report">
    <header class="report__head">
      <button type="button" class="report__back" aria-label="返回" @click="onBack">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div class="report__head-main">
        <h1 class="report__title">杏林学习足迹</h1>
        <SegmentedControl
          :model-value="type"
          @update:model-value="(v) => emit('update:type', v)"
          class="report__type"
          :options="[
            { label: '周', value: 'weekly' },
            { label: '月', value: 'monthly' },
          ]"
        />
      </div>
      <span class="report__spacer"></span>
    </header>

    <div class="report__range-row">
      <button class="report__arrow" :disabled="!canPrev" @click="$emit('prev')" aria-label="上一期">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <p class="report__range">{{ rangeLabel }}</p>
      <button class="report__arrow" :disabled="!canNext" @click="$emit('next')" aria-label="下一期">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>

    <div v-if="loading" class="report__state">
      <div class="skeleton-list" style="width:100%;padding:0 4px">
        <div class="skeleton-item" style="height:200px"></div>
        <div class="skeleton-item" style="height:120px"></div>
        <div class="skeleton-item" style="height:160px"></div>
        <div class="skeleton-item" style="height:140px"></div>
        <div class="skeleton-item" style="height:180px"></div>
      </div>
    </div>

    <div v-else-if="error" class="report__state">
      <div class="empty-state">
        <p class="empty-state__text">加载失败，请重试</p>
        <button class="empty-state__btn" @click="$emit('retry')">重新加载</button>
      </div>
    </div>

    <div v-else-if="isIncomplete" class="report__state">
      <div class="empty-state empty-state--incomplete">
        <p class="empty-state__text">{{ incompleteMessage || '该周期尚未结束，报表将在结束后生成' }}</p>
        <button v-if="canPrev" class="empty-state__btn" @click="$emit('prev')">{{ type === 'weekly' ? '查看上一周' : '查看上个月' }}</button>
      </div>
    </div>

    <div v-else-if="isEmpty" class="report__state">
      <div class="empty-state">
        <p class="empty-state__text">本期暂无数据</p>
        <button v-if="canPrev" class="empty-state__btn" @click="$emit('prev')">查看上一期</button>
      </div>
    </div>

    <slot v-else></slot>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import SegmentedControl from "./SegmentedControl.vue";

const router = useRouter();

const props = defineProps({
  type: { type: String, required: true }, // 'weekly' | 'monthly'
  rangeLabel: { type: String, default: "" },
  canPrev: { type: Boolean, default: true },
  canNext: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  isEmpty: { type: Boolean, default: false },
  isIncomplete: { type: Boolean, default: false },
  incompleteMessage: { type: String, default: "" },
});

const emit = defineEmits(["update:type", "back", "prev", "next", "retry"]);

function onBack() {
  emit("back");
  const current = router.currentRoute.value.fullPath;
  try {
    router.back();
  } catch (e) {
    router.push({ name: "journey" });
    return;
  }
  /* router.back() 是异步导航：稍后检查是否真的离开了当前页，若还在则强制回首页 */
  setTimeout(() => {
    if (router.currentRoute.value.fullPath === current) {
      router.push({ name: "journey" });
    }
  }, 300);
}
</script>

<style scoped>
.report {
  min-height: 100vh;
  background: var(--color-page-bg);
  padding-bottom: 48px;
}
.report__head {
  position: sticky;
  top: 0;
  z-index: 40;
  background: var(--color-card);
  display: flex;
  align-items: center;
  padding: calc(10px + var(--safe-top)) var(--page-padding) 10px;
  gap: 8px;
  border-bottom: 1px solid var(--color-divider);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
}
.report__back {
  width: 36px; height: 36px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%;
  color: var(--color-text-primary);
  background: transparent;
}
.report__back:active { background: var(--color-input-bg); }
.report__head-main {
  flex: 1;
  min-width: 0;
  text-align: center;
}
.report__title {
  font-size: var(--font-size-h2);
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--color-text-primary);
}
.report__type {
  max-width: 200px;
  margin: 0 auto;
}
.report__spacer { width: 36px; flex-shrink: 0; }

.report__range-row {
  position: sticky;
  top: calc(62px + var(--safe-top));
  z-index: 30;
  background: var(--color-page-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px var(--page-padding) 10px;
  gap: 16px;
  border-bottom: 1px solid var(--color-divider);
}
.report__arrow {
  width: 30px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 50%;
  color: var(--color-text-primary);
  background: var(--color-card);
  box-shadow: var(--shadow-card);
}
.report__arrow:disabled {
  opacity: 0.3;
  pointer-events: none;
}
.report__range {
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
}
.report__state {
  padding: 16px var(--page-padding);
}
.empty-state--incomplete {
  padding: 18px 10px;
  background: var(--color-primary-tint);
  border-radius: 12px;
  border: 1px solid var(--color-primary-muted);
}
</style>
