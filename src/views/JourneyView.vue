<template>
  <PlainLayout title="学习历程">
    <!-- 学习总览卡片：分类进度 + 9 项统计（可独立折叠） -->
    <AppCard>
      <button
        type="button"
        class="sect-head"
        :aria-expanded="overviewOpen"
        aria-controls="journey-overview-body"
        :aria-label="`学习总览，${overviewOpen ? '已展开，点击收起' : '已收起，点击展开'}`"
        @click="overviewOpen = !overviewOpen"
      >
        <span class="sect-head__title">学习总览</span>
        <svg
          class="sect-head__arrow"
          :class="{ 'sect-head__arrow--open': overviewOpen }"
          viewBox="0 0 24 24" width="18" height="18"
          fill="none" stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div id="journey-overview-body" v-show="overviewOpen">
        <div v-if="overviewLoading" class="skeleton-list">
          <div class="skeleton-item" style="height:120px"></div>
          <div v-for="i in 3" :key="i" class="skeleton-item"></div>
        </div>
        <div v-else-if="overviewError" class="empty-state">
          <p class="empty-state__text">加载失败</p>
          <button class="primary-btn-sm" @click="loadOverview">重试</button>
        </div>
        <template v-else>
          <!-- 总体进度条：中医 / 西医 / 全部 三类 -->
          <div class="overview-bucket">
            <div v-for="b in bucketList" :key="b.key" class="overview-bucket__row">
              <p class="overview-bucket__label">{{ b.label }}</p>
              <div class="overview-bucket__bars">
                <div class="ob-bar">
                  <span class="ob-bar__tag ob-bar__tag--learn">学习</span>
                  <div class="ob-bar__track"><div class="ob-bar__fill ob-bar__fill--learn" :style="{width: b.learn + '%'}"></div></div>
                  <span class="ob-bar__num">{{ b.learn }}%</span>
                </div>
                <div class="ob-bar">
                  <span class="ob-bar__tag ob-bar__tag--review">复习</span>
                  <div class="ob-bar__track"><div class="ob-bar__fill ob-bar__fill--review" :style="{width: b.review + '%'}"></div></div>
                  <span class="ob-bar__num">{{ b.review }}%</span>
                </div>
                <div class="ob-bar">
                  <span class="ob-bar__tag ob-bar__tag--master">掌握</span>
                  <div class="ob-bar__track"><div class="ob-bar__fill ob-bar__fill--master" :style="{width: b.master + '%'}"></div></div>
                  <span class="ob-bar__num">{{ b.master }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 9 项统计：天数 / 科目占比 / 关联 / 评论 / 复习数 -->
          <div class="overview-stats">
            <div v-for="s in overviewStats" :key="s.label" class="overview-stats__cell">
              <p class="overview-stats__num">{{ s.value }}</p>
              <p class="text-caption">{{ s.label }}</p>
            </div>
          </div>
        </template>
      </div>
    </AppCard>

    <!-- 各科进度卡片：具体课程列表（可独立折叠，互不影响） -->
    <AppCard>
      <button
        type="button"
        class="sect-head"
        :aria-expanded="perCourseOpen"
        aria-controls="journey-percourse-body"
        :aria-label="`各科进度，${perCourseOpen ? '已展开，点击收起' : '已收起，点击展开'}`"
        @click="perCourseOpen = !perCourseOpen"
      >
        <span class="sect-head__title">各科进度</span>
        <svg
          class="sect-head__arrow"
          :class="{ 'sect-head__arrow--open': perCourseOpen }"
          viewBox="0 0 24 24" width="18" height="18"
          fill="none" stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div id="journey-percourse-body" v-show="perCourseOpen">
        <!-- 每个科目的 学习/复习/掌握 进度 -->
        <div v-if="!overviewLoading && perCourse.length" class="overview-course overview-course--no-top">
          <div v-for="c in perCourse" :key="c.id" class="overview-course__row">
            <div class="overview-course__head">
              <span class="overview-course__name">{{ c.name }}</span>
              <span class="overview-course__cat" :class="'is-' + c.category">
                {{ c.category === 'tcm' ? '中医' : '西医' }}
                {{ c.completed ? '· 已完成' : (c.started ? '· 学习中' : '') }}
              </span>
            </div>
            <div class="ob-bar ob-bar--sm">
              <span class="ob-bar__tag ob-bar__tag--learn">学</span>
              <div class="ob-bar__track"><div class="ob-bar__fill ob-bar__fill--learn" :style="{width: c.learn + '%'}"></div></div>
              <span class="ob-bar__num">{{ c.learn }}%</span>
            </div>
            <div class="ob-bar ob-bar--sm">
              <span class="ob-bar__tag ob-bar__tag--review">复</span>
              <div class="ob-bar__track"><div class="ob-bar__fill ob-bar__fill--review" :style="{width: c.review + '%'}"></div></div>
              <span class="ob-bar__num">{{ c.review }}%</span>
            </div>
            <div class="ob-bar ob-bar--sm">
              <span class="ob-bar__tag ob-bar__tag--master">掌</span>
              <div class="ob-bar__track"><div class="ob-bar__fill ob-bar__fill--master" :style="{width: c.master + '%'}"></div></div>
              <span class="ob-bar__num">{{ c.master }}%</span>
            </div>
          </div>
        </div>
        <div v-else-if="!overviewLoading" class="empty-state">
          <p class="empty-state__text">暂无科目进度数据</p>
        </div>
      </div>
    </AppCard>

    <SegmentedControl
      v-model="activeTab"
      class="journey__tabs"
      :options="[
        { label: '日报', value: 'daily' },
        { label: '周报', value: 'weekly' },
        { label: '月报', value: 'monthly' },
      ]"
    />

    <template v-if="activeTab === 'daily'">
      <div class="days" role="tablist" aria-label="日期选择">
        <button
          v-for="(d, i) in dayList"
          :key="d.date"
          type="button"
          role="tab"
          :aria-selected="i === selectedDay"
          class="days__item"
          :class="{ 'days__item--on': i === selectedDay, 'days__item--today': d.isToday }"
          @click="switchDay(i)"
        >
          <p class="days__d">{{ d.label }}</p>
          <p class="days__w">{{ d.week }}</p>
        </button>
      </div>

      <AppCard title="今日学习">
        <div v-if="dailyLoading" class="skeleton-list">
          <div class="skeleton-item" style="height:60px"></div>
          <div v-for="i in 3" :key="i" class="skeleton-item"></div>
        </div>
        <div v-else-if="dailyReport?.periodStatus === 'incomplete' || dailyReport?.periodStatus === 'future'" class="empty-state empty-state--incomplete">
          <p class="empty-state__text">{{ dailyReport.incompleteMessage || '周期未结束，暂无可查看日报' }}</p>
          <p v-if="dailyReport.periodStatus === 'incomplete'" class="empty-state__hint" style="margin-top:8px;font-size:13px;color:var(--color-text-muted)">日报将在明日自动生成，保持每日学习节奏</p>
        </div>
        <template v-else>
          <div class="today">
            <div class="today__cell">
              <p class="text-caption">今日目标</p>
              <p class="today__num">{{ dailyReport.goalDone }}<span class="today__den">/{{ dailyReport.goalTotal }}</span></p>
            </div>
            <div class="today__cell">
              <p class="text-caption">今日已学</p>
              <p class="today__num">{{ dailyReport.minutes }}<span class="today__den"> 分钟</span></p>
            </div>
            <div class="today__cell">
              <p class="text-caption">今日状态</p>
              <p class="today__mood">
                <BaseAppIcon
                  :type="dailyReport.moodKey === 'hot' ? 'recentFlame' : dailyReport.moodKey === 'stable' ? 'task' : 'adviceStar'"
                  size="xs"
                  aria-label=""
                />
                {{ dailyReport.moodText }}
              </p>
              <p class="text-caption">{{ dailyReport.moodNote }}</p>
            </div>
          </div>
          <div v-if="!dailyReport.subjects?.length" class="empty-state">
            <p class="empty-state__text">暂无学科数据</p>
          </div>
          <div v-for="s in dailyReport.subjects" :key="s.name" class="subject">
            <CourseIcon :course="s" size="sm" variant="soft" aria-label="" />
            <span class="subject__name">{{ s.name }}</span>
            <div class="subject__bar">
              <div class="subject__bar-inner" :style="{ width: safePct(s.min, 60) + '%' }"></div>
            </div>
            <span class="subject__min">{{ s.min }}min</span>
          </div>
        </template>
      </AppCard>

      <div v-if="!dailyLoading && (dailyReport.periodStatus === 'complete' || !dailyReport.periodStatus)" class="advice">
        <p class="advice__text"><BaseAppIcon type="adviceStar" size="sm" aria-label="" /> <b>今日建议</b> {{ dailyReport.advice }}</p>
        <button class="advice__btn" @click="$router.push({ name: 'study' })">去学习</button>
      </div>
    </template>

    <template v-else-if="activeTab === 'weekly'">
      <AppCard title="本周学习概览">
        <div v-if="weeklyLoading" class="skeleton-list">
          <div class="skeleton-item" style="height:120px"></div>
          <div class="skeleton-item"></div>
        </div>
        <div v-else-if="weeklyReport?.periodStatus === 'incomplete' || weeklyReport?.periodStatus === 'future'" class="empty-state empty-state--incomplete">
          <p class="empty-state__text">{{ weeklyReport.incompleteMessage || '周期未结束，暂无可查看周报' }}</p>
          <div class="weekly-entry-btn" style="margin-top:14px">
            <RouterLink :to="{ name: 'report-weekly' }" class="app-btn app-btn--ghost app-btn--sm" aria-label="进入周报独立页面">查看完整周报</RouterLink>
          </div>
        </div>
        <template v-else>
          <div class="week__head">
            <p class="week__range">{{ weeklyReport.weekRange }}</p>
            <p class="week__total">总时长 {{ weeklyReport.totalHours }}h</p>
          </div>
          <svg :viewBox="trendViewBox" class="trend" :aria-label="`本周学习趋势，共${trendPoints.length}个数据点`" role="img">
            <path :d="trendArea" fill="rgba(31,92,56,0.10)" />
            <path :d="trendLine" fill="none" stroke="#1f5c38" stroke-width="1.8" />
            <circle
              v-for="(p, i) in trendPoints"
              :key="i"
              :cx="p.x" :cy="p.y" r="3"
              fill="#fff" stroke="#1f5c38" stroke-width="1.8"
            />
            <g v-for="(d, i) in weeklyReport.trendDays?.slice(0, trendPoints.length)" :key="'d' + i">
              <text :x="trendPoints[i]?.x ?? 0" :y="trendHeight + 12" text-anchor="middle" font-size="9" fill="#999">{{ d }}</text>
            </g>
          </svg>
          <div class="week__stats">
            <div>
              <p class="text-caption">日均学习</p>
              <p class="week__stat">{{ weeklyReport.avgDaily }}h</p>
            </div>
            <div>
              <p class="text-caption">完成任务</p>
              <p class="week__stat">{{ weeklyReport.completedTasks }}个</p>
            </div>
          </div>
        </template>
      </AppCard>

      <AppCard v-if="!weeklyLoading && weeklyReport.periodStatus === 'complete'" title="本周学科分布">
        <div v-if="!weeklyReport.subjects?.length" class="empty-state">
          <p class="empty-state__text">暂无学科分布数据</p>
        </div>
        <div v-for="s in weeklyReport.subjects" :key="s.name" class="week__subject">
          <div class="week__subject-head">
            <span>{{ s.name }}</span>
            <span class="text-caption">{{ s.hours }}h</span>
          </div>
          <div class="week__subject-bar">
            <div class="week__subject-inner" :style="{ width: safePct(s.hours, 5) + '%' }"></div>
          </div>
        </div>
      </AppCard>

      <AppCard v-if="!weeklyLoading && weeklyReport.periodStatus === 'complete'" title="本周总结">
        <p class="week__summary">{{ weeklyReport.summary }}</p>
        <div v-if="weeklyReport.achievements?.length" class="week__tags">
          <span v-for="a in weeklyReport.achievements" :key="a" class="week__ach">{{ a }}</span>
        </div>
      </AppCard>
    </template>

    <template v-else-if="activeTab === 'monthly'">
      <AppCard title="本月学习概览">
        <div v-if="monthlyLoading" class="skeleton-list">
          <div class="skeleton-item" style="height:40px"></div>
          <div class="skeleton-item" style="height:80px"></div>
        </div>
        <div v-else-if="monthlyReport?.periodStatus === 'incomplete' || monthlyReport?.periodStatus === 'future'" class="empty-state empty-state--incomplete">
          <p class="empty-state__text">{{ monthlyReport.incompleteMessage || '周期未结束，暂无可查看月报' }}</p>
          <div class="monthly-entry-btn" style="margin-top:14px">
            <RouterLink :to="{ name: 'report-monthly' }" class="app-btn app-btn--ghost app-btn--sm" aria-label="进入月报独立页面">查看完整月报</RouterLink>
          </div>
        </div>
        <template v-else>
          <div class="month__head">
            <p class="month__name">{{ monthlyReport.month }}</p>
            <p class="month__total">总 {{ monthlyReport.totalHours }}h</p>
          </div>
          <div class="month__stats">
            <div v-for="s in stats" :key="s.label" class="stats__cell">
              <p class="stats__value">{{ s.value }}<span class="stats__unit"> {{ s.unit }}</span></p>
              <p class="text-caption">{{ s.label }}</p>
            </div>
          </div>
        </template>
      </AppCard>

      <AppCard v-if="!monthlyLoading && monthlyReport.periodStatus === 'complete'" title="学习热力图">
        <div class="heatmap" :style="{ gridTemplateColumns: `repeat(${heatmapCols}, 1fr)` }">
          <div
            v-for="d in monthlyReport.heatmap"
            :key="d.day"
            class="heatmap__cell"
            :style="{ background: heatmapColor(d.hours) }"
            :title="`${d.day}日：${d.hours}小时`"
            :aria-label="`${d.day}日学习${d.hours}小时`"
            role="img"
          >
            <span v-if="d.hours > 0" class="heatmap__num">{{ d.hours }}</span>
          </div>
        </div>
        <div class="heatmap__legend">
          <span class="text-caption">少</span>
          <span class="heatmap__lg" style="background: #e8f5e9"></span>
          <span class="heatmap__lg" style="background: #a5d6a7"></span>
          <span class="heatmap__lg" style="background: #66bb6a"></span>
          <span class="heatmap__lg" style="background: #2e7d32"></span>
          <span class="text-caption">多</span>
        </div>
      </AppCard>

      <AppCard v-if="!monthlyLoading && monthlyReport.periodStatus === 'complete'" title="本月学科分布">
        <div v-if="!monthlyReport.subjects?.length" class="empty-state">
          <p class="empty-state__text">暂无学科分布数据</p>
        </div>
        <div v-for="s in monthlyReport.subjects" :key="s.name" class="week__subject">
          <div class="week__subject-head">
            <span>{{ s.name }}</span>
            <span class="text-caption">{{ s.hours }}h · {{ s.pct }}%</span>
          </div>
          <div class="week__subject-bar">
            <div class="week__subject-inner" :style="{ width: safePct(s.pct) + '%' }"></div>
          </div>
        </div>
      </AppCard>

      <AppCard v-if="!monthlyLoading && monthlyReport.periodStatus === 'complete'" title="获得成就">
        <div v-if="!monthlyReport.achievements?.length" class="empty-state">
          <p class="empty-state__text">本月暂无成就，加油！</p>
        </div>
        <div class="achieve">
          <div v-for="a in monthlyReport.achievements" :key="a" class="achieve__cell achieve__cell--got">
            <p class="achieve__name">{{ a }}</p>
            <p class="achieve__badge">✓ 已获得</p>
          </div>
        </div>
      </AppCard>

      <AppCard v-if="!monthlyLoading && monthlyReport.periodStatus === 'complete'" title="月度总结">
        <p class="week__summary">{{ monthlyReport.summary }}</p>
      </AppCard>
    </template>

    <AppCard v-if="activeTab === 'daily'">
      <div class="title-card">
        <span class="title-card__badge">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#1f5c38"
               stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="10" r="6" /><path d="M8 15 6.5 21l5.5-3 5.5 3L16 15" />
          </svg>
        </span>
        <div class="title-card__info">
          <p class="text-caption">当前称号</p>
          <p class="title-card__name">
            {{ titleInfo.currentTitle?.name || '暂无' }}
            <span v-if="titleInfo.currentTitle?.streak" class="title-card__streak">连续学习 {{ titleInfo.currentTitle.streak }} 天</span>
          </p>
          <p class="title-card__motto">{{ titleInfo.currentTitle?.motto || '继续努力解锁称号' }}</p>
        </div>
        <button class="title-card__q" aria-label="称号说明" @click="toast('称号根据连续学习天数自动升级')">?</button>
      </div>
    </AppCard>

    <AppCard v-if="activeTab !== 'monthly'" title="三项统计">
      <div class="stats">
        <div v-for="s in stats" :key="s.label" class="stats__cell">
          <p class="stats__value">{{ s.value }}<span class="stats__unit"> {{ s.unit }}</span></p>
          <p class="text-caption">{{ s.label }}</p>
        </div>
      </div>
    </AppCard>

    <AppCard v-if="activeTab !== 'monthly'" title="成就">
      <template #extra>
        <button type="button" class="text-caption achieve__all" @click="$router.push({ name: 'achievements' })">查看全部 ›</button>
      </template>
      <div class="achieve__row">
        <div class="achieve__col">
          <p class="achieve__col-title" style="color:#065f46">✓ 已获得 ({{ unlockedCount }})</p>
          <div v-if="!unlockedList.length" class="empty-state" style="padding:10px 0">
            <p class="empty-state__text">暂无已获得成就</p>
          </div>
          <div v-for="a in unlockedList.slice(0, 3)" :key="a.id" class="achieve__cell achieve__cell--got">
            <p class="achieve__name">{{ a.name }}</p>
            <p class="text-caption">{{ a.description }}</p>
          </div>
        </div>
        <div class="achieve__col">
          <p class="achieve__col-title" style="color:#92400e">⏳ 即将达成 ({{ lockedCount }})</p>
          <div v-if="!lockedList.length" class="empty-state" style="padding:10px 0">
            <p class="empty-state__text">全部成就已达成！</p>
          </div>
          <div v-for="a in lockedList.slice(0, 3)" :key="a.id" class="achieve__cell">
            <p class="achieve__name">{{ a.name }}</p>
            <p class="text-caption">{{ a.description }}</p>
            <p v-if="a.progress != null" class="achieve__prog">{{ a.progress }}%</p>
            <div v-if="a.progress != null" class="achieve__mini-bar">
              <div class="achieve__mini-inner" :style="{ width: a.progress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </AppCard>

    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="showAllAchieve" class="sheet-mask" @click.self="showAllAchieve = false" @keydown.esc="showAllAchieve = false">
          <div class="sheet sheet--achieve" role="dialog" aria-modal="true" aria-label="全部成就">
            <button class="sheet__close" aria-label="关闭" @click="showAllAchieve = false">×</button>
            <p class="sheet__title">全部成就</p>
            <div class="achieve__row achieve__row--all">
              <div class="achieve__col">
                <p class="achieve__col-title" style="color:#065f46">✓ 已获得 ({{ unlockedCount }})</p>
                <div v-if="!unlockedList.length" class="empty-state">
                  <p class="empty-state__text">暂无已获得成就</p>
                </div>
                <div v-for="a in unlockedList" :key="a.id" class="achieve__cell achieve__cell--got">
                  <p class="achieve__name">{{ a.name }}</p>
                  <p class="text-caption">{{ a.description }}</p>
                  <p v-if="a.unlockedAt" class="text-caption" style="margin-top:2px">获得：{{ a.unlockedAt }}</p>
                </div>
              </div>
              <div class="achieve__col">
                <p class="achieve__col-title" style="color:#92400e">⏳ 未达成 ({{ lockedCount }})</p>
                <div v-if="!lockedList.length" class="empty-state">
                  <p class="empty-state__text">恭喜！全部成就已达成</p>
                </div>
                <div v-for="a in lockedList" :key="a.id" class="achieve__cell">
                  <p class="achieve__name">{{ a.name }}</p>
                  <p class="text-caption">{{ a.description }}</p>
                  <p v-if="a.progress != null" class="achieve__prog">{{ a.progress }}%</p>
                  <div v-if="a.progress != null" class="achieve__mini-bar">
                    <div class="achieve__mini-inner" :style="{ width: a.progress + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </PlainLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import PlainLayout from "../layouts/PlainLayout.vue";
import AppCard from "../components/AppCard.vue";
import SegmentedControl from "../components/SegmentedControl.vue";
import BaseAppIcon from "../components/BaseAppIcon.vue";
import ReportIcon from "../components/ReportIcon.vue";
import CourseIcon from "../components/CourseIcon.vue";
import AchievementIcon from "../components/AchievementIcon.vue";
import { useStore } from "../composables/useStore";
import { useAchievements } from "../composables/useAchievements";
import * as studyApi from "../api/study";
import * as journeyApi from "../api/journey";
import * as achievementApi from "../api/achievement";
import { toast } from "../utils/feedback";

const route = useRoute();
const router = useRouter();
const ach = useAchievements();
const { state: storeState, loadStudyStatus } = useStore();

/* ---------- 学习总览与各科进度折叠 ---------- */
const overviewOpen = ref(true);
const perCourseOpen = ref(true);
const overviewLoading = ref(false);
const overviewError = ref(false);
const perCourse = ref([]);
const categoryAgg = ref({ tcm: { learn: 0, review: 0, master: 0 }, western: { learn: 0, review: 0, master: 0 }, overall: { learn: 0, review: 0, master: 0 } });
const overviewNumbers = ref({
  activeStudyDays: 0,
  studiedSubjects: 0,
  professionalTotal: 0,
  subjectsPercent: 0,
  knowledgeLinks: 0,
  commentsTotal: 0,
  reviewCount: 0,
  totalMinutes: 0,
});

const bucketList = computed(() => [
  { key: "tcm",     label: "中医类科目", ...categoryAgg.value.tcm },
  { key: "western", label: "西医类科目", ...categoryAgg.value.western },
  { key: "overall", label: "全部科目",   ...categoryAgg.value.overall },
]);
const overviewStats = computed(() => {
  const o = overviewNumbers.value;
  return [
    { label: "累计有效学习天数", value: o.activeStudyDays + " 天" },
    { label: "已学科目 / 专业课总数", value: `${o.studiedSubjects}/${o.professionalTotal} (${o.subjectsPercent}%)` },
    { label: "累计知识关联", value: o.knowledgeLinks + " 条" },
    { label: "累计评论", value: o.commentsTotal + " 条" },
    { label: "累计复习次数", value: o.reviewCount + " 次" },
    { label: "累计学习时长", value: Math.round(o.totalMinutes / 60) + " 小时" },
  ];
});
async function loadOverview() {
  overviewLoading.value = true;
  overviewError.value = false;
  try {
    const res = await journeyApi.getJourneyOverview();
    if (res?.code === 200 && res.data) {
      perCourse.value = Array.isArray(res.data.perCourse) ? res.data.perCourse : [];
      categoryAgg.value = res.data.category || categoryAgg.value;
      if (res.data.tcm) categoryAgg.value.tcm = res.data.tcm;
      if (res.data.western) categoryAgg.value.western = res.data.western;
      if (res.data.overall) categoryAgg.value.overall = res.data.overall;
      overviewNumbers.value = { ...overviewNumbers.value, ...(res.data.overview || {}) };
    } else {
      overviewError.value = true;
    }
  } catch (e) {
    overviewError.value = true;
  } finally {
    overviewLoading.value = false;
  }
}

function buildDayList() {
  const list = [];
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const today = new Date();
  // 不包含今天（今天未结束），只显示昨天及更早，最近 4 个可查看日期
  for (let i = 4; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const pad = (n) => String(n).padStart(2, "0");
    list.push({
      date: `${d.getFullYear()}-${pad(month)}-${pad(day)}`,
      label: `${month}.${pad(day)}`,
      week: i === 1 ? "昨天" : weekdays[d.getDay()],
      isToday: false,
    });
  }
  return list;
}

const activeTab = ref("daily");
const dayList = ref(buildDayList());
const selectedDay = ref(dayList.value.length - 1);
const showAllAchieve = ref(false);

const dailyLoading = ref(false);
const weeklyLoading = ref(false);
const monthlyLoading = ref(false);

const dailyReport = ref({
  date: "",
  goalDone: 0,
  goalTotal: 0,
  minutes: 0,
  mood: "—",
  moodNote: "暂无数据",
  subjects: [],
  advice: "开始学习，生成个性化建议",
});

const weeklyReport = ref({
  weekRange: "",
  totalHours: 0,
  avgDaily: "0.0",
  trend: [],
  trendDays: [],
  subjects: [],
  completedTasks: 0,
  achievements: [],
  summary: "本周还没有学习数据，加油开始学习吧！",
});

const monthlyReport = ref({
  month: "",
  totalHours: 0,
  studyDays: 0,
  avgDaily: "0.0",
  maxStreak: 0,
  subjects: [],
  achievements: [],
  heatmap: [],
  summary: "本月还没有学习数据。",
});

const titleInfo = ref({
  currentTitle: { name: "初心学徒", motto: "“路漫漫其修远兮，吾将上下而求索”", streak: 1, icon: "owl" },
  availableTitles: [],
});

const achievementsList = computed(() => ach.byCategory("all"));

const unlockedList = computed(() => achievementsList.value.filter((a) => a.unlocked));
const lockedList = computed(() => achievementsList.value.filter((a) => !a.unlocked));
const unlockedCount = computed(() => unlockedList.value.length);
const lockedCount = computed(() => lockedList.value.length);

const stats = computed(() => [
  { label: "日均学习时长", value: ((storeState.studyStatus?.todayMinutes || 0) / 60).toFixed(1), unit: "小时" },
  { label: "学习总天数", value: storeState.studyStatus?.learningDays || 0, unit: "天" },
  { label: "最长连续学习", value: storeState.studyStatus?.maxStreak || 0, unit: "天" },
]);

const trendWidth = 320;
const trendHeight = 100;
const trendPadX = 20;
const trendViewBox = `0 0 ${trendWidth} ${trendHeight + 20}`;

const trendPoints = computed(() => {
  const data = Array.isArray(weeklyReport.value.trend) ? weeklyReport.value.trend : [];
  const n = data.length;
  if (n === 0) return [];
  const maxV = Math.max(0.1, ...data.map((v) => Number(v) || 0));
  if (n === 1) {
    return [{ x: trendWidth / 2, y: trendHeight - ((data[0] || 0) / maxV) * (trendHeight - 20) - 10 }];
  }
  const innerW = trendWidth - trendPadX * 2;
  const step = innerW / (n - 1);
  return data.map((v, i) => {
    const val = Number(v) || 0;
    const x = trendPadX + step * i;
    const y = trendHeight - (val / maxV) * (trendHeight - 20) - 10;
    return { x, y };
  });
});

const trendLine = computed(() => {
  const pts = trendPoints.value;
  if (!pts.length) return "";
  if (pts.length === 1) {
    const p = pts[0];
    return `M ${p.x - 1} ${p.y} L ${p.x + 1} ${p.y}`;
  }
  return "M " + pts.map((p) => `${p.x} ${p.y}`).join(" L ");
});

const trendArea = computed(() => {
  const pts = trendPoints.value;
  if (!pts.length) return "";
  if (pts.length === 1) {
    const p = pts[0];
    return `M ${p.x - 6} ${trendHeight} L ${p.x - 6} ${p.y} L ${p.x + 6} ${p.y} L ${p.x + 6} ${trendHeight} Z`;
  }
  const line = trendLine.value;
  const last = pts[pts.length - 1];
  const first = pts[0];
  return line + ` L ${last.x} ${trendHeight} L ${first.x} ${trendHeight} Z`;
});

const heatmapCols = computed(() => {
  const n = (monthlyReport.value.heatmap || []).length;
  if (n <= 28) return 7;
  if (n <= 35) return 7;
  return 7;
});

function safePct(numerator, denominator = 100) {
  const n = Number(numerator) || 0;
  const d = Number(denominator) || 0;
  if (d <= 0) return 0;
  const v = Math.round((n / d) * 100);
  return Math.min(100, Math.max(0, v));
}

function heatmapColor(hours) {
  if (hours <= 0) return "#f5f5f5";
  if (hours < 1) return "#e8f5e9";
  if (hours < 2) return "#a5d6a7";
  if (hours < 3) return "#66bb6a";
  return "#2e7d32";
}

async function switchDay(idx) {
  selectedDay.value = idx;
  dailyLoading.value = true;
  try {
    const res = await studyApi.getDailyReport(dayList.value[idx].date);
    if (res.code === 200) dailyReport.value = res.data;
  } finally {
    dailyLoading.value = false;
  }
}

async function loadDaily() {
  dailyLoading.value = true;
  try {
    const res = await studyApi.getDailyReport(dayList.value[selectedDay.value]?.date);
    if (res.code === 200) dailyReport.value = res.data;
  } finally {
    dailyLoading.value = false;
  }
}

async function loadWeekly() {
  weeklyLoading.value = true;
  try {
    const res = await studyApi.getWeeklyReport();
    if (res.code === 200) weeklyReport.value = res.data;
  } finally {
    weeklyLoading.value = false;
  }
}

async function loadMonthly() {
  monthlyLoading.value = true;
  try {
    const res = await studyApi.getMonthlyReport();
    if (res.code === 200) monthlyReport.value = res.data;
  } finally {
    monthlyLoading.value = false;
  }
}

async function loadAchievements() {
  // 新统一服务（useAchievements）
  await ach.bootstrap();
}

async function loadTitle() {
  const res = await achievementApi.getTitleAndBadges();
  if (res.code === 200) titleInfo.value = res.data;
}

function onKeydown(e) {
  if (e.key === "Escape" && showAllAchieve.value) {
    showAllAchieve.value = false;
  }
}

watch(activeTab, async (tab, old) => {
  if (tab === "daily") {
    await loadDaily();
  } else if (tab === "weekly") {
    // 跳转到独立周报页
    activeTab.value = old === "monthly" ? "daily" : "daily"; // 还原防止UI停在周Tab
    router.push({ name: "weeklyReport" });
  } else if (tab === "monthly") {
    activeTab.value = old === "weekly" ? "daily" : "daily";
    router.push({ name: "monthlyReport" });
  }
});

onMounted(async () => {
  window.addEventListener("keydown", onKeydown);
  if (route.query.tab) activeTab.value = String(route.query.tab);
  await loadStudyStatus(true);
  await Promise.all([loadOverview(), loadDaily(), loadWeekly(), loadMonthly(), loadAchievements(), loadTitle()]);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.journey__tabs {
  margin: 4px var(--page-padding) 10px;
}

.days {
  display: flex;
  justify-content: space-around;
  padding: 4px var(--page-padding) 14px;
}
.days__item {
  text-align: center;
  padding: 6px 10px;
  border-radius: var(--radius-card);
  cursor: pointer;
}
.days__item--on {
  background: var(--color-primary-tint);
  outline: 1.5px solid var(--color-primary);
}
.days__item--today .days__d {
  color: var(--color-primary);
}
.days__d {
  font-size: 13px;
  font-weight: 500;
}
.days__w {
  font-size: 11px;
  color: var(--color-text-caption);
  margin-top: 2px;
}
.days__item--on .days__w {
  color: var(--color-primary);
}

.today {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.today__num {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: 2px;
}
.today__den {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-caption);
}
.today__mood {
  font-weight: 600;
  margin-top: 4px;
}

.subject {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
}
.subject__icon {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: var(--color-primary-tint);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.subject__name {
  flex: 0 0 56px;
  font-size: 13px;
}
.subject__bar {
  flex: 1;
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--color-input-bg);
  overflow: hidden;
}
.subject__bar-inner {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-pill);
}
.subject__min {
  font-size: 12px;
  color: var(--color-text-caption);
  flex: 0 0 42px;
  text-align: right;
}

.advice {
  margin: 0 var(--page-padding) 12px;
  background: var(--color-primary-tint);
  border-radius: var(--radius-card);
  padding: 14px;
}
.advice__text {
  font-size: 13px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.advice__btn {
  margin-top: 10px;
  font-size: 13px;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-pill);
  padding: 6px 18px;
  background: transparent;
}

.title-card {
  display: flex;
  align-items: center;
  gap: 12px;
}
.title-card__badge {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1.5px dashed var(--color-primary-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}
.title-card__info {
  flex: 1;
  min-width: 0;
}
.title-card__name {
  font-weight: 700;
  font-size: 15px;
  margin-top: 2px;
  overflow-wrap: anywhere;
}
.title-card__streak {
  font-size: 11px;
  font-weight: 400;
  color: var(--color-primary);
  background: var(--color-primary-tint);
  border-radius: var(--radius-pill);
  padding: 2px 8px;
  margin-left: 6px;
  display: inline-block;
  margin-top: 2px;
}
.title-card__motto {
  font-size: 12px;
  color: var(--color-text-caption);
  margin-top: 2px;
  overflow-wrap: anywhere;
}
.title-card__q {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid var(--color-divider);
  color: var(--color-text-caption);
  font-size: 12px;
}

.trend {
  width: 100%;
  height: auto;
  display: block;
}

.week__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 4px;
  gap: 10px;
}
.week__range {
  font-weight: 600;
  overflow-wrap: anywhere;
}
.week__total {
  color: var(--color-primary);
  font-weight: 600;
  flex-shrink: 0;
}
.week__stats {
  display: flex;
  justify-content: space-around;
  margin-top: 8px;
}
.week__stat {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  margin-top: 2px;
}
.week__subject {
  padding: 8px 0;
}
.week__subject-head {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 5px;
  gap: 10px;
}
.week__subject-head > span { min-width: 0; overflow-wrap: anywhere; }
.week__subject-bar {
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--color-input-bg);
  overflow: hidden;
}
.week__subject-inner {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-pill);
}
.week__summary {
  font-size: 13px;
  line-height: 1.8;
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}
.week__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.week__ach {
  font-size: 12px;
  padding: 4px 10px;
  background: var(--color-primary-tint);
  color: var(--color-primary);
  border-radius: var(--radius-pill);
}

.month__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}
.month__head > p { min-width: 0; overflow-wrap: anywhere; }
.month__name {
  font-weight: 600;
  font-size: 16px;
}
.month__total {
  color: var(--color-primary);
  font-weight: 600;
  flex-shrink: 0;
}

.stats {
  display: flex;
  padding: 4px 0 0;
}
.stats__cell {
  flex: 1;
  text-align: center;
  min-width: 0;
}
.stats__value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
  overflow-wrap: anywhere;
}
.stats__unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-caption);
}
.stats__cell .text-caption {
  margin-top: 2px;
}

.month__stats {
  display: flex;
  padding: 10px 0 4px;
  flex-wrap: wrap;
  gap: 10px;
}

.heatmap {
  display: grid;
  gap: 4px;
  margin: 8px 0;
}
.heatmap__cell {
  aspect-ratio: 1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.heatmap__num {
  font-size: 9px;
  color: rgba(0, 0, 0, 0.65);
  font-weight: 600;
}
.heatmap__legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.heatmap__lg {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.achieve {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 12px;
}
.achieve__cell {
  background: var(--color-input-bg);
  border-radius: var(--radius-sm);
  padding: 10px;
  overflow-wrap: anywhere;
}
.achieve__cell--got {
  background: var(--color-primary-tint);
}
.achieve__name {
  font-weight: 600;
  font-size: 14px;
}
.achieve__badge {
  font-size: 11px;
  color: var(--color-primary);
  margin-top: 4px;
  font-weight: 600;
}
.achieve__prog {
  font-size: 12px;
  color: var(--color-primary);
  margin-top: 3px;
}
.achieve__all {
  cursor: pointer;
}
.achieve__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.achieve__col {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.achieve__col-title {
  font-size: 13px;
  font-weight: 600;
}
.achieve__mini-bar {
  height: 4px;
  background: var(--color-primary-tint);
  border-radius: var(--radius-pill);
  overflow: hidden;
  margin-top: 4px;
}
.achieve__mini-inner {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-pill);
}

.sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sheet {
  width: 100%;
  max-width: var(--page-width);
  max-height: 85vh;
  overflow-y: auto;
  background: var(--color-card);
  border-radius: 16px 16px 0 0;
  padding: 20px 16px calc(20px + var(--safe-bottom));
  position: relative;
}
.sheet__close {
  position: absolute;
  top: 8px;
  right: 10px;
  font-size: 28px;
  line-height: 1;
  padding: 2px 10px;
  color: var(--color-text-caption);
  border-radius: 8px;
}
.sheet__close:active { opacity: 0.6; }
.sheet__title {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 12px;
  padding-right: 30px;
}
.sheet--achieve .achieve__row--all {
  grid-template-columns: 1fr;
  gap: 16px;
}
.sheet--achieve .achieve__row--all .achieve__col {
  gap: 8px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px 0;
}
.skeleton-item {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 4px;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.empty-state {
  padding: 14px 0;
  text-align: center;
}
.empty-state__text {
  font-size: 13px;
  color: var(--color-text-caption);
}
.empty-state--incomplete {
  margin: 10px 4px;
  padding: 18px 14px;
  border-radius: 14px;
  background: var(--color-primary-tint);
  border: 1px solid var(--color-primary-muted);
}
.empty-state--incomplete .empty-state__text {
  color: var(--color-primary-deep);
  font-weight: 600;
  font-size: 14px;
  line-height: 1.6;
}
.empty-state--incomplete .app-btn {
  margin-top: 12px;
  display: inline-flex;
}

@media (max-width: 375px) {
  .today { gap: 12px; }
  .stats { flex-wrap: wrap; }
  .achieve__row { grid-template-columns: 1fr; }
  .week__head { flex-direction: column; align-items: flex-start; }
  .month__head { flex-direction: column; align-items: flex-start; }
  .subject__name { flex: 0 0 48px; font-size: 12px; }
  .days { padding: 4px 4px 14px; }
  .days__item { padding: 6px 6px; }
}

/* ---------- 学习总览卡片样式 ---------- */
.sect-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px 10px;
  border-radius: 10px;
  color: var(--color-text-primary);
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.sect-head:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
.sect-head__title {
  font-size: var(--font-size-title);
  font-weight: 600;
}
.sect-head__arrow {
  color: var(--color-text-secondary);
  transition: transform 0.22s ease;
  transform: rotate(0deg);
}
.sect-head__arrow--open {
  transform: rotate(90deg);
}

.overview-bucket { padding: 2px 0 6px; }
.overview-bucket__row { padding: 8px 0; border-bottom: 1px dashed var(--color-divider); }
.overview-bucket__row:last-child { border-bottom: 0; }
.overview-bucket__label { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.overview-bucket__bars { display: flex; flex-direction: column; gap: 4px; }

.ob-bar { display: flex; align-items: center; gap: 6px; font-size: 11px; }
.ob-bar--sm { font-size: 11px; }
.ob-bar__tag { flex: 0 0 28px; text-align: center; border-radius: 4px; padding: 1px 0; font-size: 10px; font-weight: 600; }
.ob-bar__tag--learn  { background: var(--progress-study-bg);   color: var(--progress-study); }
.ob-bar__tag--review { background: var(--progress-review-bg);  color: #64866b; }
.ob-bar__tag--master { background: var(--progress-mastery-bg); color: var(--progress-mastery); }
.ob-bar__track { flex: 1; height: 6px; background: var(--progress-track); border-radius: var(--radius-pill); overflow: hidden; }
.ob-bar__fill { height: 100%; border-radius: var(--radius-pill); }
.ob-bar__fill--learn  { background: var(--progress-study); }
.ob-bar__fill--review { background: var(--progress-review); }
.ob-bar__fill--master { background: var(--progress-mastery); }
.ob-bar__num {
  flex: 0 0 34px; text-align: right;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 14px 0 6px;
  border-top: 1px solid var(--color-divider);
  margin-top: 6px;
}
.overview-stats__cell { text-align: center; min-width: 0; }
.overview-stats__num { font-size: 15px; font-weight: 700; color: var(--color-primary); overflow-wrap: anywhere; }

.overview-course { margin-top: 0; padding-top: 0; border-top: 0; }
.overview-course--no-top { border-top: 0; padding-top: 2px; }
.overview-course__title { font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.overview-course__row { padding: 6px 0; border-bottom: 1px dashed var(--color-divider); }
.overview-course__row:last-child { border-bottom: 0; }
.overview-course__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; gap: 10px; }
.overview-course__name { font-size: 13px; font-weight: 500; overflow-wrap: anywhere; }
.overview-course__cat { font-size: 11px; color: var(--color-text-caption); flex-shrink: 0; }
.overview-course__cat.is-tcm { color: #1f5c38; }
.overview-course__cat.is-western { color: #6a4a2a; }

.primary-btn-sm {
  margin-top: 6px;
  padding: 6px 16px;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
}

@media (max-width: 360px) {
  .overview-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
