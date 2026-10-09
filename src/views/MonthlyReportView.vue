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
    @prev="shift(-1)"
    @next="shift(1)"
    @retry="loadReport"
  >
    <!-- 1. 月度称号 -->
    <section class="rp-card rp-title" v-if="report">
      <div class="rp-title__badge">本月称号</div>
      <p class="rp-title__name">{{ report.title || '杏林进阶者' }}</p>
      <p class="rp-title__desc">{{ report.titleDescription || '本月稳步前行，百尺竿头更进一步' }}</p>
    </section>

    <!-- 2. 月度核心数据 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">月度核心数据</p>
      </div>
      <div class="rp-kv">
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ hours(report.totalMinutes) }}<em>h {{ mins(report.totalMinutes) }}m</em></p>
          <p class="rp-kv__label">学习总时长</p>
        </div>
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ report.activeDays }}<em>/{{ report.daysInMonth || 30 }}天</em></p>
          <p class="rp-kv__label">学习天数</p>
        </div>
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ report.completedTasks }}<em> 个</em></p>
          <p class="rp-kv__label">完成任务数</p>
        </div>
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ report.knowledgePointCount }}<em> 个</em></p>
          <p class="rp-kv__label">学习知识点</p>
        </div>
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ report.aiQuestionCount }}<em> 次</em></p>
          <p class="rp-kv__label">AI答疑</p>
        </div>
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ report.averageDailyMinutes }}<em> 分/日</em></p>
          <p class="rp-kv__label">平均每日</p>
        </div>
        <div class="rp-kv__item">
          <p class="rp-kv__num">{{ report.longestStreakDays }}<em> 天</em></p>
          <p class="rp-kv__label">最长连续</p>
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
          <p class="rp-kv__label">较上月</p>
        </div>
      </div>
    </section>

    <!-- 3. 月度学习日历 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">月度学习日历</p>
        <span class="text-caption">点击日期看详情</span>
      </div>
      <div class="rp-cal__grid">
        <div v-for="w in weekLabels" :key="'w' + w" class="rp-cal__w">{{ w }}</div>
        <div
          v-for="(cell, i) in calendarCells"
          :key="'c' + i"
          class="rp-cal__cell"
          :class="cellClasses(cell)"
          @click="onCellClick(cell)"
        >
          <template v-if="cell.data">
            <span class="rp-cal__num">{{ cell.day }}</span>
            <span v-if="cell.data.minutes > 0" class="rp-cal__num-sm">{{ cell.data.minutes }}m</span>
          </template>
        </div>
      </div>
      <div class="rp-cal__legend">
        <div class="rp-cal__legend-item"><span class="rp-cal__legend-chip rp-cal__legend-chip--intensity-0"></span><span>未学</span></div>
        <div class="rp-cal__legend-item"><span class="rp-cal__legend-chip rp-cal__legend-chip--intensity-1"></span><span>少量</span></div>
        <div class="rp-cal__legend-item"><span class="rp-cal__legend-chip rp-cal__legend-chip--intensity-3"></span><span>正常</span></div>
        <div class="rp-cal__legend-item"><span class="rp-cal__legend-chip rp-cal__legend-chip--intensity-high"></span><span>高强度</span></div>
      </div>
      <div v-if="selectedDay > 0" class="rp-bar-detail" style="margin-top:12px">
        <div class="rp-bar-detail__row">
          <span class="rp-bar-detail__k">日期</span>
          <b class="rp-bar-detail__v">{{ selectedDateLabel }}</b>
        </div>
        <div class="rp-bar-detail__row">
          <span class="rp-bar-detail__k">学习时长</span>
          <span class="rp-bar-detail__v">{{ selectedRecord?.minutes || 0 }} 分钟</span>
        </div>
        <div class="rp-bar-detail__row">
          <span class="rp-bar-detail__k">完成任务</span>
          <span class="rp-bar-detail__v">{{ selectedRecord?.tasks || 0 }} 个</span>
        </div>
        <div class="rp-bar-detail__row">
          <span class="rp-bar-detail__k">主要科目</span>
          <span class="rp-bar-detail__v">
            {{ selectedRecord?.courses?.length ? selectedRecord.courses.map((c) => c.name).join('、') : '无' }}
          </span>
        </div>
        <div class="rp-bar-detail__row">
          <span class="rp-bar-detail__k">知识点</span>
          <span class="rp-bar-detail__v">
            {{ selectedRecord?.kps?.length ? selectedRecord.kps.join('、') : '无' }}
          </span>
        </div>
        <div v-if="selectedRecord?.aiQuestions" class="rp-bar-detail__row">
          <span class="rp-bar-detail__k">AI 答疑</span>
          <span class="rp-bar-detail__v">{{ selectedRecord.aiQuestions }} 次</span>
        </div>
      </div>
    </section>

    <!-- 4. 月度学习内容墙 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">本月学习内容墙</p>
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
          <span>涉及课程</span>
        </div>
        <div class="rp-wall__stat">
          <BaseAppIcon type="statKp" size="sm" aria-label="" />
          <b>{{ report.contentStats?.kps ?? 0 }}</b>
          <span>学习知识点</span>
        </div>
      </div>
    </section>

    <!-- 5. 学科TOP3（三类） -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">学科 TOP3</p>
      </div>
      <p class="rp-card__sub"><BaseAppIcon type="review" size="xs" aria-label="" />学习时长最多</p>
      <div class="rp-top3" style="margin-bottom:12px">
        <div v-for="(s, i) in topByMinutes" :key="s.key || ('m'+i)" class="rp-top3__item">
          <span :class="['rp-top3__rank', 'rp-top3__rank--' + (i+1)]">{{ i + 1 }}</span>
          <div class="rp-top3__main">
            <p class="rp-top3__name">{{ s.name || '—' }}</p>
            <p class="rp-top3__sub">累计学习</p>
          </div>
          <span class="rp-top3__val">{{ s.minutes || 0 }} 分钟</span>
        </div>
      </div>
      <p class="rp-card__sub"><BaseAppIcon type="statKp" size="xs" aria-label="" />完成知识点最多</p>
      <div class="rp-top3" style="margin-bottom:12px">
        <div v-for="(s, i) in topByKps" :key="s.key || ('k'+i)" class="rp-top3__item">
          <span :class="['rp-top3__rank', 'rp-top3__rank--' + (i+1)]">{{ i + 1 }}</span>
          <div class="rp-top3__main">
            <p class="rp-top3__name">{{ s.name || '—' }}</p>
            <p class="rp-top3__sub">完成知识点数</p>
          </div>
          <span class="rp-top3__val">{{ s.kps || 0 }} 个</span>
        </div>
      </div>
      <p class="rp-card__sub"><BaseAppIcon type="adviceStar" size="xs" aria-label="" />进步幅度最大</p>
      <div class="rp-top3">
        <div v-for="(s, i) in topByImprove" :key="s.key || ('i'+i)" class="rp-top3__item">
          <span :class="['rp-top3__rank', 'rp-top3__rank--' + (i+1)]">{{ i + 1 }}</span>
          <div class="rp-top3__main">
            <p class="rp-top3__name">{{ s.name || '—' }}</p>
            <p class="rp-top3__sub">较上月提升</p>
          </div>
          <span class="rp-top3__val" :style="{ color: s.improvement >= 0 ? '#2e7d32' : '#c62828' }">
            {{ s.improvement >= 0 ? '+' : '' }}{{ s.improvement || 0 }}%
          </span>
        </div>
      </div>
    </section>

    <!-- 6. 高频知识点 TOP3 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">高频知识点 TOP3</p>
      </div>
      <div class="rp-top3">
        <div v-for="(k, i) in safeTopKps" :key="k.name + i" class="rp-top3__item">
          <span :class="['rp-top3__rank', 'rp-top3__rank--' + (i+1)]">{{ i + 1 }}</span>
          <div class="rp-top3__main">
            <p class="rp-top3__name">{{ k.name }}</p>
            <p class="rp-top3__sub">
              {{ k.mastery || '了解' }}
              <span v-if="k.needConsolidate" style="color:#c62828; margin-left:6px">⚠ 需巩固</span>
            </p>
          </div>
          <span class="rp-top3__val">{{ k.count || 0 }} 次</span>
        </div>
      </div>
    </section>

    <!-- 7. 学习者能力变化（月初 vs 月末雷达对比） -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">学习者能力变化</p>
      </div>
      <div class="rp-radar">
        <div class="rp-radar__legend">
          <span><span class="rp-radar__dot" style="background:#90a4ae"></span>月初</span>
          <span><span class="rp-radar__dot" style="background:#1f5c38"></span>月末</span>
        </div>
        <svg viewBox="0 0 200 200" width="100%" style="max-width:300px; display:block; margin: 0 auto;">
          <!-- 网格 -->
          <polygon v-for="ring in [1,0.66,0.33]" :key="ring" :points="gridPts(ring)"
                   fill="none" stroke="#e3e3e0"/>
          <!-- 轴线 -->
          <line v-for="(p,i) in axisPts" :key="'ax'+i" x1="100" y1="100" :x2="p.x" :y2="p.y" stroke="#e3e3e0"/>
          <!-- 月初 -->
          <polygon :points="dataPts(radarBefore)" fill="rgba(144,164,174,0.25)" stroke="#90a4ae" stroke-width="1.5"/>
          <circle v-for="(p,i) in radarPts(radarBefore)" :key="'bc'+i" :cx="p.x" :cy="p.y" r="2.5" fill="#90a4ae"/>
          <!-- 月末 -->
          <polygon :points="dataPts(radarAfter)" fill="rgba(31,92,56,0.30)" stroke="#1f5c38" stroke-width="1.8"/>
          <circle v-for="(p,i) in radarPts(radarAfter)" :key="'ac'+i" :cx="p.x" :cy="p.y" r="3" fill="#1f5c38"/>
          <!-- 标签 -->
          <text v-for="(l,i) in radarLabels" :key="'l'+i" :x="labelPos[i].x" :y="labelPos[i].y"
                text-anchor="middle" font-size="11" fill="#666">{{ l }}</text>
        </svg>
        <div class="rp-radar__change">
          <div v-for="(l,i) in radarLabels" :key="l" class="rp-radar__cell">
            <p class="rp-radar__label">{{ l }}</p>
            <p class="rp-radar__value">
              {{ Math.round(radarAfter[i]) }}
              <span
                :class="radarAfter[i] - radarBefore[i] >= 0 ? 'rp-radar__up' : 'rp-radar__down'"
              >
                {{ radarAfter[i] - radarBefore[i] >= 0 ? '↑' : '↓' }}
                {{ Math.abs(Math.round(radarAfter[i] - radarBefore[i])) }}
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 8. 薄弱知识预警 -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">薄弱知识预警</p>
      </div>
      <div class="rp-weak">
        <div class="rp-weak__sec rp-weak__sec--forget">
          <p class="rp-weak__title"><BaseAppIcon type="review" size="xs" aria-label="" />遗忘风险最高（{{ weak.forgetRisk?.length || 0 }}个）</p>
          <div v-if="weak.forgetRisk?.length" class="rp-weak__tags">
            <span v-for="k in weak.forgetRisk.slice(0,6)" :key="k.name" class="rp-weak__tag">{{ k.name }}</span>
          </div>
          <p v-else class="rp-mastery__empty">暂无明显遗忘风险</p>
        </div>
        <div class="rp-weak__sec rp-weak__sec--wrong">
          <p class="rp-weak__title"><BaseAppIcon type="close" size="xs" aria-label="" />错题最多（{{ weak.mostWrong?.length || 0 }}个）</p>
          <div v-if="weak.mostWrong?.length" class="rp-weak__tags">
            <span v-for="k in weak.mostWrong.slice(0,6)" :key="k.name" class="rp-weak__tag">{{ k.name }}</span>
          </div>
          <p v-else class="rp-mastery__empty">本月错题控制良好</p>
        </div>
        <div class="rp-weak__sec rp-weak__sec--old">
          <p class="rp-weak__title"><BaseAppIcon type="history" size="xs" aria-label="" />长时间未复习（{{ weak.longUnreviewed?.length || 0 }}个）</p>
          <div v-if="weak.longUnreviewed?.length" class="rp-weak__tags">
            <span v-for="k in weak.longUnreviewed.slice(0,6)" :key="k.name" class="rp-weak__tag">{{ k.name }}</span>
          </div>
          <p v-else class="rp-mastery__empty">所有知识点近期都有复习</p>
        </div>
        <div class="rp-weak__sec rp-weak__sec--next">
          <p class="rp-weak__title"><BaseAppIcon type="adviceStar" size="xs" aria-label="" />下月建议优先复习（{{ weak.nextPriority?.length || 0 }}个）</p>
          <div v-if="weak.nextPriority?.length" class="rp-weak__tags">
            <span v-for="k in weak.nextPriority.slice(0,8)" :key="k.name" class="rp-weak__tag"
                  :title="k.reason">
              {{ k.name }}<small style="opacity:0.65; margin-left:3px">·{{ k.priority }}优</small>
            </span>
          </div>
          <p v-else class="rp-mastery__empty">下月继续保持即可</p>
        </div>
      </div>
    </section>

    <!-- 9. 月度成就（已获得 + 即将达成） -->
    <section class="rp-card" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">月度成就</p>
      </div>
      <p class="rp-ach__section-title"><BaseAppIcon type="task" size="sm" aria-label="" />已获得成就</p>
      <div v-if="report.achievements?.length" class="rp-ach__got-grid">
        <div v-for="a in report.achievements" :key="a.id" class="rp-ach__got">
          <BaseAppIcon v-if="a.iconKey" :type="a.iconKey" size="lg" aria-label="" />
          <span v-else class="rp-ach__icon-fallback"><BaseAppIcon type="task" size="lg" aria-label="" /></span>
          <div class="rp-ach__main">
            <p class="rp-ach__name">{{ a.title }}</p>
            <p class="rp-ach__desc">{{ a.desc }}</p>
          </div>
        </div>
      </div>
      <div v-else class="empty-state"><p class="empty-state__text">本月暂无新成就，继续加油！</p></div>

      <p class="rp-ach__section-title" style="margin-top:14px"><BaseAppIcon type="adviceStar" size="sm" aria-label="" />即将达成</p>
      <div v-if="report.upcomingAchievements?.length" class="rp-ach__up">
        <div v-for="u in report.upcomingAchievements" :key="u.id" class="rp-ach__up-item">
          <div class="rp-ach__up-head">
            <span class="rp-ach__up-title">
              <BaseAppIcon v-if="u.iconKey" :type="u.iconKey" size="xs" aria-label="" />
              <BaseAppIcon v-else type="adviceStar" size="xs" aria-label="" />
              {{ u.title }}
            </span>
            <span class="rp-ach__up-pct">{{ safePct(u.progress) }}%</span>
          </div>
          <p class="rp-ach__desc" style="margin-top:2px; font-size:11px; color:#666">{{ u.desc }}</p>
          <div class="rp-ach__up-bar">
            <div class="rp-ach__up-inner" :style="{ width: Math.min(100, safePct(u.progress)) + '%' }"></div>
          </div>
          <p class="rp-ach__up-tip">{{ u.current || 0 }} / {{ u.target || 100 }}</p>
        </div>
      </div>
      <div v-else class="empty-state"><p class="empty-state__text">暂无即将达成的成就</p></div>
    </section>

    <!-- 10. AI 月度总结 -->
    <section class="rp-card rp-ai" v-if="report">
      <div class="rp-card__head">
        <p class="rp-card__title">AI 月度总结</p>
      </div>
      <div class="rp-ai__section">
        <p class="rp-ai__label">本月表现</p>
        <p class="rp-ai__text">{{ report.aiSummary?.performance || '—' }}</p>
      </div>
      <div class="rp-ai__section">
        <p class="rp-ai__label">主要进步</p>
        <p class="rp-ai__text">{{ report.aiSummary?.progress || '—' }}</p>
      </div>
      <div class="rp-ai__section">
        <p class="rp-ai__label">薄弱环节</p>
        <p class="rp-ai__text">{{ report.aiSummary?.weakness || '—' }}</p>
      </div>
      <div class="rp-ai__section">
        <p class="rp-ai__label">下月建议</p>
        <p class="rp-ai__text">{{ report.aiSummary?.nextSuggestion || '—' }}</p>
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

const type = ref("monthly");
const month = ref(route.query.month ? String(route.query.month) : currentMonth());

const report = ref(null);
const loading = ref(false);
const errorMsg = ref("");
const selectedDay = ref(-1);

watch(month, loadReport, { immediate: true });

function currentMonth() {
  const d = new Date();
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function fmt(d) {
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}
function shiftMonth(mStr, delta) {
  const [y, m] = mStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

async function loadReport() {
  loading.value = true;
  errorMsg.value = "";
  selectedDay.value = -1;
  try {
    const res = await reportApi.getMonthlyReport(month.value);
    if (res?.code === 200) report.value = res.data;
    else errorMsg.value = res?.msg || "加载失败";
  } catch (e) {
    errorMsg.value = String(e?.message || e || "加载失败");
    report.value = null;
  } finally {
    loading.value = false;
  }
}

function shift(delta) {
  month.value = shiftMonth(month.value, delta);
}

const rangeLabel = computed(() => {
  if (!report.value?.monthNum) return month.value;
  const m = report.value;
  return `${m.year}年${m.monthNum}月（1日 ~ ${m.daysInMonth}日）`;
});

const canNext = computed(() => {
  if (!report.value || report.value.periodStatus !== "complete") return false;
  const [y, m] = (report.value?.month || month.value).split("-").map(Number);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // 仅当 monthEnd 已经完整过完（月末最后一天结束后）才能下一期
  const monthEnd = new Date(y, m, 0, 0, 0, 0, 0); // 本月最后一天零点
  return monthEnd.getTime() < today.getTime();
});

const isIncomplete = computed(() =>
  report.value && (report.value.periodStatus === "incomplete" || report.value.periodStatus === "future")
);

function onTypeChange(v) {
  if (v === "weekly") {
    const [y, m] = month.value.split("-").map(Number);
    const midDate = fmt(new Date(y, m - 1, 15));
    router.push({ name: "weeklyReport", query: { start: midDate } });
  }
}

/* ---------- 小工具 ---------- */
function hours(m) { return Math.floor((Number(m) || 0) / 60); }
function mins(m)  { return (Number(m) || 0) % 60; }
function safePct(n, d) {
  const num = Number(n) || 0, den = Number(d) || 0;
  if (!den) return Math.min(100, num);
  return Math.max(0, Math.min(100, Math.round((num / den) * 100)));
}

/* 日历网格 */
const weekLabels = ["一", "二", "三", "四", "五", "六", "日"];
const calendarCells = computed(() => {
  const fw = report.value?.firstWeekday ?? 0;
  const days = report.value?.daysInMonth ?? 30;
  const records = report.value?.dailyRecords || [];
  const recordMap = new Map();
  records.forEach((r) => recordMap.set(r.day, r));
  const cells = [];
  for (let i = 0; i < fw; i++) cells.push({ day: -1 - i, data: null, isFuture: false, isToday: false });
  const now = new Date();
  const curY = report.value?.year ?? now.getFullYear();
  const curM = report.value?.monthNum ?? (now.getMonth() + 1);
  const todayKey = (curY === now.getFullYear() && curM === now.getMonth() + 1) ? now.getDate() : -1;
  for (let d = 1; d <= days; d++) {
    const isFuture =
      curY > now.getFullYear()
        ? true
        : curY < now.getFullYear()
          ? false
          : curM > now.getMonth() + 1
            ? true
            : curM < now.getMonth() + 1
              ? false
              : d > now.getDate();
    cells.push({
      day: d,
      data: recordMap.get(d) || null,
      isFuture,
      isToday: d === todayKey,
    });
  }
  return cells;
});

function intensityOf(cell) {
  if (!cell.data) return 0;
  const raw = Number(cell.data.intensity ?? 0);
  if (raw <= 0) return 0;
  return Math.min(4, Math.max(1, raw));
}

function cellClasses(cell) {
  const list = [];
  if (!cell.data) {
    list.push("rp-cal__cell--empty");
    return list;
  }
  const lv = intensityOf(cell);
  list.push("rp-cal__cell--intensity-" + (lv === 4 ? "high" : lv));
  if (cell.isFuture) list.push("rp-cal__cell--future");
  if (cell.isToday) list.push("rp-cal__cell--today");
  if (selectedDay.value === cell.day) list.push("rp-cal__cell--active");
  return list;
}

function onCellClick(cell) {
  if (!cell.data) return;
  if (cell.isFuture) return;
  selectedDay.value = selectedDay.value === cell.day ? -1 : cell.day;
}

const selectedRecord = computed(() => {
  const records = report.value?.dailyRecords || [];
  return records.find((r) => r.day === selectedDay.value) || null;
});
const selectedDateLabel = computed(() => {
  if (!report.value || selectedDay.value < 0) return "";
  return `${report.value.year}年${report.value.monthNum}月${selectedDay.value}日`;
});

/* 内容墙 */
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
function cellThemeClass(cell, idx) {
  if (cell.type === "kp") return "theme-kp";
  if (cell.type === "extra") return "theme-extra";
  return "theme-" + hashStrTo1_4(String(cell.courseId || cell.name || idx));
}
function cellInlineStyle(cell) { return {}; }

/* 学科TOP3 */
const topByMinutes = computed(() => report.value?.topSubjects?.byMinutes || []);
const topByKps     = computed(() => report.value?.topSubjects?.byKps || []);
const topByImprove = computed(() => report.value?.topSubjects?.byImprove || []);
const safeTopKps   = computed(() => report.value?.topKnowledgePoints || []);

/* 雷达图 */
const radarLabels = ["记忆能力", "理解能力", "应用能力", "分析能力"];
const radarBefore = computed(() => {
  const a = report.value?.abilityBefore || {};
  return [a.memory || 0, a.understand || 0, a.apply || 0, a.analyze || 0].map((x) => Number(x) || 0);
});
const radarAfter = computed(() => {
  const a = report.value?.abilityAfter || {};
  return [a.memory || 0, a.understand || 0, a.apply || 0, a.analyze || 0].map((x) => Number(x) || 0);
});
const cx = 100, cy = 100, R = 62;
function ang(i) { return (Math.PI * 2 * i) / radarLabels.length - Math.PI / 2; }
const axisPts = computed(() => radarLabels.map((_, i) => ({
  x: cx + R * Math.cos(ang(i)), y: cy + R * Math.sin(ang(i)),
})));
function gridPts(ring) {
  return radarLabels.map((_, i) =>
    `${cx + R * ring * Math.cos(ang(i))},${cy + R * ring * Math.sin(ang(i))}`
  ).join(" ");
}
function radarPts(values) {
  return values.map((v, i) => {
    const r = Math.min(1, Math.max(0, v / 100)) * R;
    return { x: cx + r * Math.cos(ang(i)), y: cy + r * Math.sin(ang(i)) };
  });
}
function dataPts(values) {
  return radarPts(values).map((p) => `${p.x},${p.y}`).join(" ");
}
const labelPos = computed(() => radarLabels.map((_, i) => ({
  x: cx + (R + 14) * Math.cos(ang(i)),
  y: cy + (R + 14) * Math.sin(ang(i)) + 4,
})));

/* 薄弱 */
const weak = computed(() => report.value?.weakKnowledgePoints || {
  forgetRisk: [], mostWrong: [], longUnreviewed: [], nextPriority: [],
});
</script>
