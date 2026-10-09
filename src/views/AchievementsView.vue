<template>
  <div class="achv">
    <NavBar :title="'成就中心'" :show-back="true" />
    <div class="achv__content">

      <!-- Loading -->
      <section v-if="ach.state.loading && !ach.state.loaded" class="achv__state">
        <AchievementIcon achievement-id="" :unlocked="false" aria-label="加载中" />
        <p class="achv__state-text">成就数据加载中…</p>
        <p class="text-caption">正在整理你的学习足迹</p>
      </section>

      <!-- Error + Retry -->
      <section v-else-if="ach.state.error && !ach.state.loaded" class="achv__state">
        <div class="achv__state-icon achv__state-icon--warn">
          <AchievementIcon achievement-id="" :unlocked="false" aria-label="加载失败" />
        </div>
        <p class="achv__state-text">{{ ach.state.error }}</p>
        <p class="text-caption">请检查网络或稍后再试</p>
        <button class="achv__retry" @click="onRetry">重试</button>
      </section>

      <!-- Loaded -->
      <template v-else>
        <!-- 顶部概览 -->
        <section class="achv__hero">
          <div class="achv__hero-top">
            <div class="achv__hero-left">
              <div class="achv__hero-title">已获得成就</div>
              <div class="achv__hero-count">
                <span class="achv__hero-count-num">{{ ach.state.summary.unlockedCount || 0 }}</span>
                <span class="achv__hero-count-slash"> / </span>
                <span class="achv__hero-count-total">{{ ach.state.summary.totalCount || 0 }}</span>
              </div>
              <div class="achv__hero-rate">完成度 {{ ach.state.summary.completionRate || 0 }}%</div>
            </div>
            <div class="achv__hero-ring">
              <svg viewBox="0 0 80 80" width="72" height="72">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#e8f5e9" stroke-width="8" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="url(#gradAchv)" stroke-width="8"
                  stroke-linecap="round" :stroke-dasharray="`${ringLength}`"
                  :stroke-dashoffset="`${ringOffset}`" transform="rotate(-90 40 40)" />
                <defs>
                  <linearGradient id="gradAchv" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#81c784" />
                    <stop offset="100%" stop-color="#1f5c38" />
                  </linearGradient>
                </defs>
              </svg>
              <span class="achv__hero-ring-label">
                {{ ach.state.summary.completionRate || 0 }}%
              </span>
            </div>
          </div>

          <!-- 分类进度（图标+名称+数字，缩小图标与文字间距） -->
          <div class="achv__cat-row">
            <div v-for="c in categoryListWithCount" :key="c.key" class="achv__cat-cell">
              <div class="achv__cat-head">
                <AchievementCategoryIcon :category="c.key" variant="inverse" :aria-label="c.name" />
                <span class="achv__cat-name">{{ c.name }}</span>
              </div>
              <span class="achv__cat-num">{{ c.unlocked || 0 }}/{{ c.total || 0 }}</span>
            </div>
          </div>
        </section>

        <!-- 分类 Tab：横向滚动不换行；激活反白 icon 配色；外层「拉满左右 14px 留白并做滚动容器」 -->
        <div class="achv__seg-wrap" ref="segWrapRef">
          <SegmentedControl v-model="currentCat" :options="categoryTabOptions" :scroll="true" />
        </div>

        <!-- 列表 -->
        <section v-if="viewList.length" class="achv__list">
          <article v-for="a in viewList" :key="a.id" class="achv__card" :class="{ 'achv__card--unlocked': a.unlocked }">
            <header class="achv__card-head">
              <AchievementIcon
                :achievement-id="a.id"
                :category="a.category"
                :level="a.level || 1"
                :unlocked="a.unlocked"
                :aria-label="a.name"
              />
              <div class="achv__card-title-row">
                <h3 class="achv__card-name">{{ a.name }}</h3>
                <span v-if="a.unlocked && a.unlockedAt" class="achv__card-date">{{ a.unlockedAt }}</span>
              </div>
            </header>
            <p class="achv__card-desc">{{ a.description }}</p>
            <div class="achv__card-bar">
              <div class="achv__card-bar-label">
                <span>{{ a.current ?? 0 }}</span>
                <span class="achv__card-bar-sep">/</span>
                <span>{{ a.threshold ?? (a.conditions ? a.conditions.map((c) => c.threshold).join('+') : '-') }}</span>
                <span class="achv__card-bar-pct">{{ a.progress || 0 }}%</span>
              </div>
              <div class="achv__card-bar-track">
                <div class="achv__card-bar-fill" :style="{ width: (a.progress || 0) + '%' }"></div>
              </div>
            </div>
            <div v-if="a.unlocked" class="achv__card-tag">已解锁</div>
            <div v-else-if="a.progress >= 70" class="achv__card-tag achv__card-tag--soon">即将达成</div>
          </article>
        </section>

        <!-- 空态：分类下无成就 或 无任何成就（使用 SVG 备用图不写 Emoji） -->
        <section v-else class="achv__empty">
          <div class="achv__empty-icon">
            <AchievementIcon achievement-id="fallback" :unlocked="true" aria-label="暂无成就" />
          </div>
          <p class="achv__empty-text">
            {{ currentCat === 'all' && !ach.state.list.length ? '暂无成就数据' : '该分类下暂无成就' }}
          </p>
          <p class="text-caption">
            {{ currentCat === 'all' ? '尝试刷新或稍后重试' : '继续学习，解锁更多徽章！' }}
          </p>
          <button v-if="currentCat === 'all' && !ach.state.list.length" class="achv__retry" @click="onRetry">刷新</button>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, h } from "vue";
import NavBar from "../components/NavBar.vue";
import SegmentedControl from "../components/SegmentedControl.vue";
import AchievementIcon from "../components/AchievementIcon.vue";
import AchievementCategoryIcon from "../components/AchievementCategoryIcon.vue";
import { ACHIEVEMENT_CATEGORIES } from "../constants/definitions.js";
import { useAchievements } from "../composables/useAchievements";

const ach = useAchievements();
const currentCat = ref("all");
const segWrapRef = ref(null);

const ringLen = 2 * Math.PI * 34;
const ringLength = ringLen;
const ringOffset = computed(() => {
  const rate = Number(ach.state.summary.completionRate || 0);
  return ringLen * (1 - rate / 100);
});

/* 分类计数：按当前 list 真实 unlocked 统计 */
const categoryListWithCount = computed(() => {
  const list = ach.state.list || [];
  return ACHIEVEMENT_CATEGORIES.filter((c) => c.key !== "all").map((c) => {
    const sub = list.filter((a) => a.category === c.key);
    return {
      ...c,
      total: sub.length,
      unlocked: sub.filter((a) => a.unlocked).length,
    };
  });
});

const categoryTabOptions = computed(() => {
  return ACHIEVEMENT_CATEGORIES.map((c) => ({
    value: c.key,
    label: c.name, // 兼容：当 renderLabel 不可用时退化为纯文字
    renderLabel: () => h("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        whiteSpace: "nowrap",
        justifyContent: "center",
      },
    }, [
      h(AchievementCategoryIcon, {
        category: c.key,
        variant: currentCat.value === c.key ? "active" : "plain",
        ariaLabel: c.name,
      }),
      c.name,
    ]),
  }));
});

/* 点击分类后：自动把该项滚到最左边第一位，保证后面内容都能完整看见 */
async function scrollCatIntoView(catKey, { smooth = true } = {}) {
  const wrap = segWrapRef.value;
  if (!wrap) return;
  const idx = ACHIEVEMENT_CATEGORIES.findIndex((c) => c.key === catKey);
  if (idx < 0) return;
  await nextTick();
  const seg = wrap.querySelector(":scope > .seg");
  if (!seg) return;
  const items = seg.querySelectorAll(".seg__item");
  const target = items[idx];
  if (!target) return;
  try {
    target.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      inline: "start",
      block: "nearest",
    });
  } catch (e) {
    // 兼容老设备：手动计算 scrollLeft
    const leftPadding = 14;
    const targetLeft = target.offsetLeft - leftPadding;
    wrap.scrollTo({ left: Math.max(0, targetLeft), behavior: smooth ? "smooth" : "auto" });
  }
}

watch(currentCat, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    scrollCatIntoView(newVal, { smooth: true });
  }
});

const viewList = computed(() => {
  if (!ach.state.loaded) return [];
  return ach.byCategory(currentCat.value);
});

async function onRetry() {
  await ach.forceReload();
}

onMounted(async () => {
  await ach.bootstrap();
  // 首次进入不滚（保持「全部」在最左），但做一次对齐兜底避免刷新后仍被裁切
  scrollCatIntoView(currentCat.value || "all", { smooth: false });
});
</script>

<style scoped>
.achv {
  min-height: 100%;
  background: var(--color-bg);
  padding-bottom: 32px;
}
.achv__content {
  padding: 12px 14px 0;
}

/* Hero 概览 */
.achv__hero {
  background: linear-gradient(160deg, #1f5c38 0%, #2e7d32 60%, #43a047 100%);
  color: #fff;
  border-radius: 18px;
  padding: 18px 16px 14px;
  margin-bottom: 14px;
  box-shadow: 0 8px 24px rgba(31, 92, 56, 0.25);
}
.achv__hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.achv__hero-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 1px;
  margin-bottom: 2px;
}
.achv__hero-count {
  display: flex;
  align-items: baseline;
  line-height: 1;
  margin-bottom: 4px;
}
.achv__hero-count-num {
  font-size: 34px;
  font-weight: 900;
}
.achv__hero-count-slash {
  margin: 0 2px;
  opacity: 0.6;
  font-size: 18px;
}
.achv__hero-count-total {
  font-size: 18px;
  opacity: 0.75;
  font-weight: 600;
}
.achv__hero-rate {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}
.achv__hero-ring {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}
.achv__hero-ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

/* 分类进度行：2 行 × 3 列；缩小 icon & 文字间距，手机不换行 */
.achv__cat-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 14px;
}
.achv__cat-cell {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(4px);
  border-radius: 12px;
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 0;
}
.achv__cat-head {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-width: 0;
}
.achv__cat-name {
  font-size: 12px;
  opacity: 0.94;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1;
}
.achv__cat-num {
  font-size: 11px;
  font-weight: 700;
  opacity: 0.94;
  line-height: 1;
}

/* 分类 Tab：拉满页面两侧，抵消父 padding，并提供左右留白让首尾按钮完整可见 + 真滚动 */
.achv__seg-wrap {
  margin: 0 -14px;
  padding: 0 14px 4px 14px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  touch-action: pan-x; /* 浏览器手势：这里只横向滚动，避免被识别成纵向翻页 */
  position: relative;
  z-index: 2; /* 高于卡片层，保证点击不到下面的卡片标题 */
}
.achv__seg-wrap::-webkit-scrollbar { display: none; }
.achv__seg-wrap > :deep(.seg--scroll) {
  overflow: visible;
  flex-wrap: nowrap;
  min-width: 100%;
  width: max-content;
}

/* 成就卡片 */
.achv__list {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.achv__card {
  position: relative;
  background: var(--color-card);
  border: 1px solid var(--color-divider);
  border-radius: 14px;
  padding: 14px 14px 12px;
}
.achv__card--unlocked {
  border-color: rgba(129, 199, 132, 0.6);
  box-shadow: 0 2px 10px rgba(76, 175, 80, 0.08);
  background: linear-gradient(180deg, #fafff5 0%, var(--color-card) 100%);
}
.achv__card-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
/* 移除旧的 .achv__badge 渐变/阴影/Emoji 盒（交给组件渲染） */
.achv__card-title-row {
  flex: 1;
  min-width: 0;
}
.achv__card-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 2px;
  word-break: break-word;
}
.achv__card-date {
  display: inline-block;
  font-size: 11px;
  color: var(--color-primary);
  font-weight: 600;
}
.achv__card-desc {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.6;
  word-break: break-word;
}

/* 进度条 */
.achv__card-bar {
  margin-top: 10px;
}
.achv__card-bar-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-bottom: 5px;
  font-weight: 600;
}
.achv__card-bar-sep { opacity: 0.5; margin: 0 2px; }
.achv__card-bar-pct {
  color: var(--color-primary);
  font-weight: 700;
}
.achv__card-bar-track {
  width: 100%;
  height: 6px;
  background: #e8f5e9;
  border-radius: 999px;
  overflow: hidden;
}
.achv__card-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #81c784, #1f5c38);
  border-radius: 999px;
  transition: width 0.25s ease;
}

/* 标签 */
.achv__card-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(76, 175, 80, 0.15);
  color: var(--color-primary);
  font-weight: 700;
}
.achv__card-tag--soon {
  background: rgba(255, 152, 0, 0.15);
  color: #ef6c00;
}

/* 空态 / Loading / Error */
.achv__state,
.achv__empty {
  margin-top: 40px;
  text-align: center;
  color: var(--color-text-secondary);
}
.achv__empty-icon,
.achv__state-icon {
  margin: 0 auto 12px;
  width: 56px;
  height: 56px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  justify-content: center;
}
.achv__state-icon--warn { color: #b45309; opacity: 1; }
.achv__empty-text,
.achv__state-text {
  font-size: 14px;
  margin-bottom: 4px;
}
.achv__retry {
  margin-top: 14px;
  padding: 8px 20px;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
}
</style>
