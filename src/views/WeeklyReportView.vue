<template>
  <ReportLayout
    :type="type"
    @update:type="onTypeChange"
    :range-label="rangeLabel"
    :can-prev="true"
    :can-next="canNext"
    :loading="loading"
    :error="!!errorMsg"
    :is-empty="report?.periodStatus === 'empty'"
    :is-incomplete="isIncomplete"
    :incomplete-message="report?.incompleteMessage || ''"
    @prev="shift(-7)"
    @next="shift(7)"
    @retry="loadReport"
  >
    <!-- 1. 称号卡 -->
    <section class="rp-card rp-title" v-if="report">
      <div class="rp-title__badge">本周称号</div>
      <p class="rp-title__name">{{ report.title || '杏林勤学者' }}</p>
      <p class="rp-title__desc">{{ report.titleDescription || '保持节奏，持续积累' }}</p>
    </section>

    <!-- 2. 核心数据 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">核心数据</p>
      </div>
      <div class="rp-kv">
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ hours(report.totalMinutes) }}<em>h {{ mins(report.totalMinutes) }}m</em></p>
          <p class="rp-kv__label">学习总时长</p>
        </div>
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ report.activeDays }}<em>/7 天</em></p>
          <p class="rp-kv__label">有效学习天数</p>
        </div>
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ report.completedTasks }}<em> 个</em></p>
          <p class="rp-kv__label">完成任务数</p>
        </div>
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ report.taskCompletionRate }}<em>%</em></p>
          <p class="rp-kv__label">任务完成率</p>
        </div>
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ report.streakDays }}<em> 天</em></p>
          <p class="rp-kv__label">连续学习</p>
        </div>
        <div class="rp-kv__item">
          <p class="rp-kv__num">
            <span
              class="rp-kv__change"
              :class="report.changeRate >= 0 ? 'rp-kv__change--up' : 'rp-kv__change--down'"
            >
              {{ report.changeRate >= 0 ? '▲' : '▼' }} {{ Math.abs(report.changeRate) }}%
            </span>
          </p>
          <p class="rp-kv__label">较上周</p>
        </div>
      </div>
    </section>

    <!-- 3. 每日柱状图 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">每日学习</p>
        <span class="text-caption">点击柱子查看详情</span>
      </div>
      <div class="rp-bars">
        <div class="rp-bars__wrap">
          <button
            v-for="(d, idx) in safeDailyRecords"
            :key="d.date"
            type="button"
            class="rp-bar"
            :class="[
              'rp-bar--lv' + barLevel(d.minutes),
              {
                'rp-bar--active': selectedIdx === idx,
                'rp-bar--zero': !d.minutes
              }
            ]"
            @click="selectedIdx = selectedIdx === idx ? -1 : idx"
          >
            <span class="rp-bar__top" v-if="d.minutes">{{ d.minutes }}m</span>
            <div
              class="rp-bar__col"
              :style="{ height: barHeight(d.minutes) + 'px' }"
              :aria-label="`${d.weekDay}：${d.minutes}分钟`"
            ></div>
            <span class="rp-bar__w">{{ shortW(d.weekDay) }}</span>
          </button>
        </div>
        <div v-if="selectedIdx >= 0 && safeDailyRecords[selectedIdx]" class="rp-bar-detail">
          <div class="rp-bar-detail__row">
            <span class="rp-bar-detail__k">日期</span>
            <b class="rp-bar-detail__v">{{ safeDailyRecords[selectedIdx].date }} · {{ safeDailyRecords[selectedIdx].weekDay }}</b>
          </div>
          <div class="rp-bar-detail__row">
            <span class="rp-bar-detail__k">学习时长</span>
            <span class="rp-bar-detail__v">{{ safeDailyRecords[selectedIdx].minutes }} 分钟</span>
          </div>
          <div class="rp-bar-detail__row">
            <span class="rp-bar-detail__k">完成任务</span>
            <span class="rp-bar-detail__v">{{ safeDailyRecords[selectedIdx].tasks || 0 }} 个</span>
          </div>
          <div class="rp-bar-detail__row">
            <span class="rp-bar-detail__k">学习科目</span>
            <span class="rp-bar-detail__v">
              {{ safeDailyRecords[selectedIdx].courses?.length ? safeDailyRecords[selectedIdx].courses.map((c) => c.name).join('、') : '无' }}
            </span>
          </div>
          <div class="rp-bar-detail__row">
            <span class="rp-bar-detail__k">主要知识点</span>
            <span class="rp-bar-detail__v">
              {{ safeDailyRecords[selectedIdx].kps?.length ? safeDailyRecords[selectedIdx].kps.join('、') : '无' }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. 学习内容墙 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">本周学习内容墙</p>
      </div>
      <div class="rp-wall__grid">
        <div
          v-for="(c, i) in wallCells"
          :key="c.key"
          class="rp-wall__cell"
          :class="['rp-wall__cell--' + cellThemeClass(c, i), 'rp-wall__cell--is-' + c.type]"
          :style="cellInlineStyle(c)"
        >
          <template v-if="c.type === 'course'">
            <CourseIcon :course="{ name: c.name, courseId: c.courseId }" size="md" variant="soft" aria-label="" />
          </template>
          <template v-else-if="c.type === 'kp'">
            <BaseAppIcon type="statKp" size="md" aria-label="" />
          </template>
          <template v-else>
            <CourseIcon course-key="fallback" size="md" variant="soft" aria-label="" />
          </template>
          <span class="rp-wall__cell-name">{{ c.name }}</span>
        </div>
      </div>
      <div class="rp-wall__stats">
        <div class="rp-wall__stat">
          <BaseAppIcon type="statCourse" size="sm" aria-label="" />
          <b>{{ report.contentStats?.courses ?? 0 }}</b>
          <span>学习课程</span>
        </div>
        <div class="rp-wall__stat">
          <BaseAppIcon type="statKp" size="sm" aria-label="" />
          <b>{{ report.contentStats?.kps ?? 0 }}</b>
          <span>接触知识点</span>
        </div>
      </div>
    </section>

    <!-- 5. TOP3 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">本周 TOP3</p>
      </div>
      <div class="rp-top3">
        <div class="rp-top3__item">
          <span class="rp-top3__rank rp-top3__rank--1">1</span>
          <div class="rp-top3__main">
            <p class="rp-top3__name">{{ report.topSubjects?.[0]?.name || '—' }}</p>
            <p class="rp-top3__sub">学习时间最长科目</p>
          </div>
          <span class="rp-top3__val">{{ minsOrZero(report.topSubjects?.[0]?.minutes) }} 分钟</span>
        </div>
        <div class="rp-top3__item">
          <span class="rp-top3__rank rp-top3__rank--2">2</span>
          <div class="rp-top3__main">
            <p class="rp-top3__name">{{ report.topKnowledgePoints?.[0]?.name || '—' }}</p>
            <p class="rp-top3__sub">学习次数最多 · {{ report.topKnowledgePoints?.[0]?.mastery || '了解' }}</p>
          </div>
          <span class="rp-top3__val">{{ report.topKnowledgePoints?.[0]?.count ?? 0 }} 次</span>
        </div>
        <div class="rp-top3__item">
          <span class="rp-top3__rank rp-top3__rank--3">3</span>
          <div class="rp-top3__main">
            <p class="rp-top3__name">{{ report.topCompletedCourse?.name || '—' }}</p>
            <p class="rp-top3__sub">完成度最高课程</p>
          </div>
          <span class="rp-top3__val">{{ minsOrZero(report.topCompletedCourse?.minutes) }} 分钟</span>
        </div>
      </div>
    </section>

    <!-- 6. 学习内容分布 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">学习内容分布</p>
        <span class="text-caption">合计 {{ totalCatPct }}%</span>
      </div>
      <div class="rp-dist">
        <div v-for="c in safeCatDist" :key="c.name" class="rp-dist__row">
          <div class="rp-dist__head">
            <span class="rp-dist__name">{{ c.name }}</span>
            <span class="rp-dist__pct">{{ c.percent }}%</span>
          </div>
          <div class="rp-dist__bar">
            <div class="rp-dist__inner" :style="{ width: c.percent + '%' }"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- 7. 学习方式分布 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">学习方式分布</p>
      </div>
      <div class="rp-dist">
        <div v-for="m in safeMethodDist" :key="m.name" class="rp-dist__row">
          <div class="rp-dist__head">
            <span class="rp-dist__name">{{ m.name }}</span>
            <span class="rp-dist__pct">{{ m.percent }}%</span>
          </div>
          <div class="rp-dist__bar">
            <div class="rp-dist__inner" :style="{ width: m.percent + '%', background: methodColor(m.name) }"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. 掌握程度变化 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">掌握程度变化</p>
      </div>
      <div class="rp-mastery">
        <div class="rp-mastery__sec">
          <div class="rp-mastery__head rp-mastery__head--a">
            <BaseAppIcon type="statKp" size="xs" aria-label="" />
            <span>新掌握知识点</span>
            <span class="rp-mastery__count">{{ mc.newMastered?.length || 0 }} 个</span>
          </div>
          <div v-if="mc.newMastered?.length" class="rp-mastery__tags">
            <span v-for="k in mc.newMastered.slice(0, 8)" :key="k.name" class="rp-mastery__tag">
              {{ k.name }} · {{ k.stage }}
            </span>
          </div>
          <p v-else class="rp-mastery__empty">本周暂无新掌握知识点</p>
        </div>
        <div class="rp-mastery__sec">
          <div class="rp-mastery__head rp-mastery__head--b">
            <BaseAppIcon type="adviceStar" size="xs" aria-label="" />
            <span>了解 → 熟悉</span>
            <span class="rp-mastery__count">{{ levelUpCount('了解', '熟悉') }} 个</span>
          </div>
          <div v-if="levelUpItems('了解', '熟悉').length" class="rp-mastery__tags">
            <span v-for="k in levelUpItems('了解', '熟悉').slice(0, 8)" :key="k.name" class="rp-mastery__tag">{{ k.name }}</span>
          </div>
          <p v-else class="rp-mastery__empty">本周暂无提升</p>
        </div>
        <div class="rp-mastery__sec">
          <div class="rp-mastery__head rp-mastery__head--c">
            <BaseAppIcon type="goArrow" size="xs" aria-label="" />
            <span>熟悉 → 掌握</span>
            <span class="rp-mastery__count">{{ levelUpCount('熟悉', '掌握') }} 个</span>
          </div>
          <div v-if="levelUpItems('熟悉', '掌握').length" class="rp-mastery__tags">
            <span v-for="k in levelUpItems('熟悉', '掌握').slice(0, 8)" :key="k.name" class="rp-mastery__tag">{{ k.name }}</span>
          </div>
          <p v-else class="rp-mastery__empty">本周暂无提升</p>
        </div>
        <div class="rp-mastery__sec">
          <div class="rp-mastery__head rp-mastery__head--d">
            <BaseAppIcon type="review" size="xs" aria-label="" />
            <span>需要复习的知识点</span>
            <span class="rp-mastery__count">{{ mc.reviewNeeded?.length || 0 }} 个</span>
          </div>
          <div v-if="mc.reviewNeeded?.length" class="rp-mastery__tags">
            <span v-for="k in mc.reviewNeeded.slice(0, 8)" :key="k.name" class="rp-mastery__tag">{{ k.name }}</span>
          </div>
          <p v-else class="rp-mastery__empty">本周所有知识点掌握扎实</p>
        </div>
      </div>
    </section>

    <!-- 9. AI本周总结 + 下周计划 -->
    <section class="rp-card rp-ai" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">AI 本周总结</p>
      </div>
      <div class="rp-ai__section">
        <p class="rp-ai__label">本周表现</p>
        <p class="rp-ai__text">{{ report.aiSummary?.performance || '暂无数据' }}</p>
      </div>
      <div class="rp-ai__section">
        <p class="rp-ai__label">主要进步</p>
        <p class="rp-ai__text">{{ report.aiSummary?.progress || '暂无数据' }}</p>
      </div>
      <div class="rp-ai__section">
        <p class="rp-ai__label">下周建议</p>
        <p class="rp-ai__text">{{ report.aiSummary?.nextSuggestion || '暂无数据' }}</p>
      </div>

      <button
        type="button"
        class="rp-ai__btn"
        :disabled="planLoading"
        @click="onGeneratePlan"
      >
        <svg v-if="planLoading" class="spin" viewBox="0 0 24 24" width="16" height="16"
             fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round"><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></svg>
        <span v-if="planLoading">正在生成学习计划...</span>
        <span v-else-if="nextPlan">重新生成下周学习计划</span>
        <span v-else>生成下周学习计划</span>
      </button>

      <div v-if="nextPlan" class="rp-plan">
        <div class="rp-plan__goals">
          <div v-for="(g, i) in nextPlan.goals" :key="i" class="rp-plan__goal">{{ g }}</div>
        </div>
        <div v-for="day in groupedPlanTasks" :key="day.day" class="rp-plan__day">
          <div class="rp-plan__day-head">
            <span>{{ day.day }} · {{ day.date }}</span>
            <span class="rp-plan__day-theme">{{ day.theme }}</span>
          </div>
          <div v-for="t in day.tasks" :key="t.id" class="rp-plan__task">
            <span class="rp-plan__dot" :style="{ background: t.color }"></span>
            <div class="rp-plan__t-main">
              <p class="rp-plan__t-title">{{ t.title }}</p>
              <p class="rp-plan__t-sub">
                {{ t.type }} · {{ t.knowledge }} · 难度 {{ '●'.repeat(t.difficultyLevel || 1) }}{{ '○'.repeat(Math.max(0, 3 - (t.difficultyLevel || 1))) }}
              </p>
            </div>
            <span class="rp-plan__t-min">{{ t.minutes }}分钟</span>
          </div>
        </div>
        <ul class="rp-plan__tips">
          <li v-for="(tip, i) in nextPlan.tips" :key="i">{{ tip }}</li>
        </ul>
      </div>
    </section>
  </ReportLayout>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import ReportLayout from "../components/ReportLayout.vue";
import BaseAppIcon from "../components/BaseAppIcon.vue";
import ReportIcon from "../components/ReportIcon.vue";
import CourseIcon from "../components/CourseIcon.vue";
import AchievementIcon from "../components/AchievementIcon.vue";
import * as reportApi from "../api/report";
import "../styles/report.css";

const router = useRouter();
const route = useRoute();

const type = ref("weekly");
const startDate = ref(route.query.start ? String(route.query.start) : currentWeekStart());

const report = ref(null);
const loading = ref(false);
const errorMsg = ref("");
const selectedIdx = ref(-1);

const planLoading = ref(false);
const nextPlan = ref(null);

watch(startDate, loadReport, { immediate: true });

function currentWeekStart() {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  now.setHours(0, 0, 0, 0);
  now.setDate(now.getDate() - day);
  return fmt(now);
}
function fmt(d) {
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}
function addDays(s, n) {
  const d = new Date(s);
  d.setDate(d.getDate() + n);
  return fmt(d);
}

async function loadReport() {
  loading.value = true;
  errorMsg.value = "";
  selectedIdx.value = -1;
  try {
    const res = await reportApi.getWeeklyReport(startDate.value);
    if (res?.code === 200) {
      report.value = res.data;
      nextPlan.value = null;
    } else {
      errorMsg.value = res?.msg || "加载失败";
    }
  } catch (e) {
    errorMsg.value = String(e?.message || e || "加载失败");
    report.value = null;
  } finally {
    loading.value = false;
  }
}

function shift(days) {
  startDate.value = addDays(startDate.value, days);
}

const rangeLabel = computed(() => {
  if (!report.value?.period) return startDate.value;
  return report.value.period.start + " ~ " + report.value.period.end;
});

const canNext = computed(() => {
  if (!report.value || report.value.periodStatus !== "complete") return false;
  const end = report.value?.period?.end
    ? new Date(report.value.period.end).getTime()
    : new Date(addDays(startDate.value, 6)).getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today.getTime();
});

const isIncomplete = computed(() =>
  report.value && (report.value.periodStatus === "incomplete" || report.value.periodStatus === "future")
);

function onTypeChange(v) {
  if (v === "monthly") {
    const d = new Date(startDate.value);
    const pad = (n) => (n < 10 ? "0" + n : "" + n);
    // 周 → 月 是同层视图切换，用 replace 不堆积历史，避免返回时在周/月间反复横跳
    router.replace({ name: "monthlyReport", query: { month: `${d.getFullYear()}-${pad(d.getMonth() + 1)}` } });
  }
}

/* ---------- 辅助计算 ---------- */
function hours(m) { return Math.floor((Number(m) || 0) / 60); }
function mins(m)  { return (Number(m) || 0) % 60; }
function minsOrZero(m) { return Number(m) || 0; }

const safeDailyRecords = computed(() => {
  const list = report.value?.dailyRecords;
  if (!Array.isArray(list)) return [];
  return list;
});

const barMax = computed(() => {
  const nums = safeDailyRecords.value.map((d) => Number(d.minutes) || 0);
  if (!nums.length) return 0;
  const m = Math.max(...nums, 60);
  return m;
});
function barHeight(m) {
  const minPx = 4;
  const maxPx = 150;
  if (!barMax.value) return minPx;
  const px = Math.round((Number(m) || 0) / barMax.value * maxPx);
  return Math.max(minPx, px);
}
function shortW(w) {
  return (w || "").replace("周", "");
}

/* 柱状图强度分层（相近数值不制造突兀色差，仅按阈值分三档+0档灰横） */
function barLevel(min) {
  const m = Number(min) || 0;
  if (m <= 0) return 0;
  if (m < 30) return 1;
  if (m < 90) return 2;
  return 3;
}

/* 内容墙：凑够 12 个格，空位填知识点 */
const wallCells = computed(() => {
  const courses = report.value?.contentWall || [];
  const kps = new Set();
  courses.forEach((c) => (c.kps || []).forEach((k) => kps.add(k)));
  const kpArr = Array.from(kps);
  const cells = [];
  let i = 0;
  for (const c of courses) {
    cells.push({ key: "c-" + c.courseId, name: c.name, courseId: c.courseId, type: "course" });
    i++;
    if (i >= 12) break;
  }
  let j = 0;
  while (cells.length < 12 && j < kpArr.length) {
    cells.push({ key: "k-" + kpArr[j], name: kpArr[j], type: "kp" });
    j++;
  }
  while (cells.length < 12) {
    cells.push({ key: "e-" + cells.length, name: "综合拓展", type: "extra" });
  }
  return cells;
});

function hashStrTo1_4(s) {
  if (!s) return 1;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  const abs = Math.abs(h) || 1;
  return (abs % 4) + 1;
}

/* 主题 class：course 用 courseId / name hash 稳定映射 theme-1..4，保证同一课程同色 */
function cellThemeClass(cell, idx) {
  if (cell.type === "kp") return "theme-kp";
  if (cell.type === "extra") return "theme-extra";
  return "theme-" + hashStrTo1_4(String(cell.courseId || cell.name || idx));
}
function cellInlineStyle(cell) { return {}; }

/* 分布 */
const safeCatDist = computed(() => {
  const list = report.value?.categoryDistribution;
  if (!Array.isArray(list) || !list.length) return [];
  return list;
});
const totalCatPct = computed(() => {
  if (!safeCatDist.value.length) return 100;
  return Math.round(safeCatDist.value.reduce((a, b) => a + (Number(b.percent) || 0), 0));
});

const safeMethodDist = computed(() => {
  const list = report.value?.methodDistribution;
  if (!Array.isArray(list) || !list.length) return [];
  return list;
});
function methodColor(name) {
  const map = {
    "阅读": "linear-gradient(90deg,#81c784,#1f5c38)",
    "记忆": "linear-gradient(90deg,#ffb74d,#e65100)",
    "刷题": "linear-gradient(90deg,#90a4ae,#37474f)",
    "AI答疑": "linear-gradient(90deg,#7986cb,#283593)",
    "案例推演": "linear-gradient(90deg,#f06292,#880e4f)",
  };
  return map[name] || "linear-gradient(90deg,#81c784,#1f5c38)";
}

/* 掌握变化 */
const mc = computed(() => report.value?.masteryChanges || { newMastered: [], levelUp: [], reviewNeeded: [] });
function levelUpItems(from, to) {
  return (mc.value.levelUp || []).filter((l) => l.from === from && l.to === to);
}
function levelUpCount(from, to) {
  return levelUpItems(from, to).length;
}

/* 下周计划 */
async function onGeneratePlan() {
  planLoading.value = true;
  try {
    // 下一周的周一
    const nextStart = addDays(startDate.value, 7);
    const res = await reportApi.generateNextWeekPlan(nextStart);
    if (res?.code === 200) nextPlan.value = res.data;
  } finally {
    planLoading.value = false;
  }
}

const groupedPlanTasks = computed(() => {
  const tasks = nextPlan.value?.tasks || [];
  if (!tasks.length) return [];
  const map = new Map();
  tasks.forEach((t) => {
    const key = t.day;
    if (!map.has(key)) map.set(key, { day: key, date: t.date, theme: t.theme || "", tasks: [] });
    map.get(key).tasks.push(t);
  });
  return Array.from(map.values());
});
</script>
