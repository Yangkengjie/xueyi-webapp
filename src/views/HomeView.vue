<template>
  <div class="home">
    <header class="home__brand">
      <h1 class="home__brand-name">学医智用</h1>
      <p class="home__brand-slogan">用AI重新定义中医学习——从千人一面到因你而变</p>
    </header>

    <div class="quick">
      <RouterLink :to="{ name: 'quickSearch' }" class="quick__card">
        <span class="quick__icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" />
          </svg>
        </span>
        <span class="quick__name">知识速查</span>
        <span class="quick__en">QUICK SEARCH</span>
      </RouterLink>
      <RouterLink :to="{ name: 'tutor' }" class="quick__card">
        <span class="quick__icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
          </svg>
        </span>
        <span class="quick__name">AI 答疑</span>
        <span class="quick__en">SMART QA</span>
      </RouterLink>
    </div>

    <AppCard>
      <div class="task__head">
        <h2 class="task__title">{{ mode === "study" ? "今日学习" : "今日复习" }}</h2>
        <button class="icon-btn" aria-label="刷新任务" :disabled="taskLoading" @click="refreshTasks">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
               :class="{ 'spin': taskLoading }">
            <path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" />
          </svg>
        </button>
      </div>
      <div v-if="taskLoading" class="skeleton-list">
        <div v-for="i in 3" :key="i" class="skeleton-item"></div>
      </div>
      <ul v-else-if="taskError" class="empty-state">
        <p class="empty-state__text">任务加载失败，点击重试</p>
        <button class="empty-state__btn" @click="loadTasks">重新加载</button>
      </ul>
      <ul v-else-if="!tasks.length" class="empty-state">
        <p class="empty-state__text">暂无任务，点击下方「+」添加</p>
      </ul>
      <ul v-else class="task__list">
        <li v-for="task in tasks" :key="task.id" class="task__row">
          <button
            type="button"
            class="task__check-btn"
            :aria-label="task.done ? '取消完成' : '标记完成'"
            @click.stop="toggleTask(task)"
          >
            <span class="task__check" :class="{ 'task__check--done': task.done }">
              <svg v-if="task.done" viewBox="0 0 24 24" width="12" height="12"
                   fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round">
                <path d="M5 12l5 5 9-10" />
              </svg>
            </span>
          </button>
          <button type="button" class="task__main" @click="openTaskDetail(task)">
            <span class="task__text" :class="{ 'task__text--done': task.done }">{{ task.text }}</span>
            <span v-if="task.course" class="task__course">{{ task.course }}</span>
          </button>
        </li>
      </ul>
      <div class="task__foot">
        <button class="icon-btn" aria-label="历史任务" @click="showHistory = true">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round">
            <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3.5 2" />
          </svg>
        </button>
        <button class="icon-btn" aria-label="添加任务" @click="showAdd = true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </AppCard>

    <AppCard v-if="continueList.length || continueLoading">
      <p class="continue__label">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />
        </svg>
        继续学习
      </p>
      <div v-if="continueLoading" class="skeleton-list">
        <div v-for="i in 2" :key="i" class="skeleton-item"></div>
      </div>
      <div v-else-if="continueError" class="empty-state">
        <p class="empty-state__text">继续学习加载失败</p>
      </div>
      <div v-else-if="!continueList.length" class="empty-state">
        <p class="empty-state__text">暂无继续学习内容，快去添加课程吧</p>
      </div>
      <RouterLink
        v-for="item in continueList"
        :key="item.courseId"
        :to="item.route"
        class="continue__item"
        :aria-label="`继续学习${item.name}`"
      >
        <div class="continue__main">
          <span class="continue__name">{{ item.name }}</span>
          <span class="continue__chapter text-caption">{{ item.chapter }} · 上次学到 {{ item.lastPosition?.page || '第1节' }}</span>
          <div class="continue__progress">
            <div class="continue__progress-inner" :style="{ width: safePct(item.progress) + '%' }"></div>
          </div>
          <span class="continue__pct text-caption">{{ safePct(item.progress) }}%</span>
        </div>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </RouterLink>
    </AppCard>

    <AppCard v-if="adviceList.length || adviceLoading">
      <p class="continue__label">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        智能学习建议
      </p>
      <div v-if="adviceLoading" class="skeleton-list">
        <div v-for="i in 2" :key="i" class="skeleton-item"></div>
      </div>
      <div v-else-if="adviceError" class="empty-state">
        <p class="empty-state__text">建议加载失败</p>
      </div>
      <div v-else-if="!adviceList.length" class="empty-state">
        <p class="empty-state__text">暂无学习建议</p>
      </div>
      <div v-else>
        <div v-for="a in adviceList" :key="a.id" class="advice-item" :class="'advice-item--' + a.priority">
          <span class="advice-item__tag">{{ a.title }}</span>
          <span class="advice-item__content">{{ a.content }}</span>
        </div>
      </div>
    </AppCard>

    <SegmentedControl
      v-model="mode"
      pill
      :options="[
        { label: '学习模式', value: 'study' },
        { label: '备考模式', value: 'exam' },
      ]"
      class="home__mode"
    />

    <template v-if="mode === 'study'">
      <AppCard>
        <div class="report__head">
          <p class="continue__label">
            <BaseAppIcon type="reportHead" size="xs" aria-label="" />
            学习报告
          </p>
        </div>
        <div class="report__btns">
          <RouterLink class="report__btn" :to="{ name: 'journey', query: { tab: 'daily' } }">
            <ReportIcon report-type="daily" size="md" variant="card" aria-label="日报" />
            <span>日报</span>
          </RouterLink>
          <RouterLink class="report__btn" :to="{ name: 'journey', query: { tab: 'weekly' } }">
            <ReportIcon report-type="weekly" size="md" variant="card" aria-label="周报" />
            <span>周报</span>
          </RouterLink>
          <RouterLink class="report__btn" :to="{ name: 'journey', query: { tab: 'monthly' } }">
            <ReportIcon report-type="monthly" size="md" variant="card" aria-label="月报" />
            <span>月报</span>
          </RouterLink>
        </div>
      </AppCard>

      <AppCard>
        <div class="status__head">
          <p class="status__label">
            <BaseAppIcon type="statusHead" size="xs" aria-label="" />
            学习状态
          </p>
          <button class="icon-btn" aria-label="学习历程" @click="$router.push({ name: 'journey' })">
            <BaseAppIcon type="journey" size="sm" aria-label="" />
          </button>
        </div>
        <div v-if="statusLoading" class="skeleton-list">
          <div class="skeleton-item"></div>
          <div class="skeleton-item" style="height: 70px"></div>
        </div>
        <div v-else-if="statusError" class="empty-state">
          <p class="empty-state__text">学习状态加载失败</p>
        </div>
        <template v-else>
          <div class="status__stats">
            <div>
              <p class="text-caption">连续学习</p>
              <p class="status__num">{{ status?.streakDays ?? 0 }} 天</p>
            </div>
            <div>
              <p class="text-caption">今日已学</p>
              <p class="status__num">{{ status?.todayMinutes ?? 0 }} 分钟</p>
            </div>
            <div>
              <p class="text-caption">当前节奏</p>
              <p class="status__num">{{ status?.rhythm ?? '-' }}</p>
            </div>
          </div>
          <div class="status__bars">
            <span
              v-for="(h, i) in status?.bars ?? []"
              :key="i"
              class="status__bar"
              :class="{ 'status__bar--muted': h < 50 }"
              :style="{ height: h + '%' }"
            ></span>
          </div>
          <div class="status__achieve">
            <p class="text-caption">
              即将达成：
              <template v-if="homeNextAch">
                <AchievementIcon
                  :achievement-id="homeNextAch.id"
                  :level="homeNextAch.level"
                  :unlocked="false"
                  size="sm"
                  inline
                />
                {{ homeNextAch.name }}
              </template>
              <template v-else>暂无</template>
            </p>
            <p class="status__pct">{{ homeNextAch?.progress ?? 0 }}%</p>
          </div>
          <div class="status__progress">
            <div class="status__progress-inner"
                 :style="{ width: (homeNextAch?.progress ?? 0) + '%' }"></div>
          </div>
          <p class="status__count text-caption">
            {{ homeNextAch?.current ?? 0 }}/{{ homeNextAch?.threshold ?? '-' }}
            <span v-if="settingsLoaded && settings.remind" class="status__remind">· 晚 8 点提醒</span>
          </p>
        </template>
      </AppCard>
    </template>

    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="showAdd" class="sheet-mask" @click.self="showAdd = false" @keydown.esc="showAdd = false">
          <div class="sheet" role="dialog" aria-modal="true" aria-label="添加任务">
            <button class="sheet__close" aria-label="关闭" @click="showAdd = false">×</button>
            <p class="sheet__date">{{ todayLabel }}</p>
            <ul v-if="tasks.length" class="sheet__list">
              <li v-for="task in tasks" :key="task.id" class="sheet__task-row">
                <button type="button" class="task__check-btn" @click.stop="toggleTask(task)">
                  <span class="task__check" :class="{ 'task__check--done': task.done }">
                    <svg v-if="task.done" viewBox="0 0 24 24" width="12" height="12"
                         fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  </span>
                </button>
                <span :class="{ 'task__text--done': task.done }">{{ task.text }}</span>
              </li>
            </ul>
            <label class="visually-hidden" for="new-task-input">新任务名称</label>
            <input
              id="new-task-input"
              v-model="newTask"
              class="sheet__input"
              placeholder="任务名称"
              aria-label="新任务名称"
              @keyup.enter="addTask"
            />
            <div class="sheet__foot">
              <button class="icon-btn" aria-label="历史任务" @click="showAdd = false; showHistory = true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
                     stroke-width="1.8" stroke-linecap="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3.5 2" />
                </svg>
              </button>
              <button class="icon-btn" aria-label="确认添加" :disabled="!newTask.trim() || addLoading" @click="addTask">
                <svg v-if="!addLoading" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
                     stroke-width="1.8" stroke-linecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span v-else class="mini-spin" aria-label="添加中"></span>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="toast-fade">
        <div v-if="showHistory" class="sheet-mask" @click.self="showHistory = false" @keydown.esc="showHistory = false">
          <div class="sheet" role="dialog" aria-modal="true" aria-label="历史任务">
            <button class="sheet__close" aria-label="关闭" @click="showHistory = false">×</button>
            <div v-if="historyLoading" class="skeleton-list">
              <div v-for="i in 3" :key="i" class="skeleton-item" style="height: 40px"></div>
            </div>
            <div v-else-if="!taskHistory.length" class="empty-state">
              <p class="empty-state__text">暂无历史任务记录</p>
            </div>
            <div v-else>
              <div v-for="group in taskHistory" :key="group.date" class="sheet__group">
                <p class="sheet__date">{{ formatHistoryDate(group.date) }}</p>
                <ul>
                  <li v-for="(t, i) in group.items" :key="i" class="sheet__task sheet__task--done">
                    <span class="task__check task__check--done">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none"
                           stroke="#fff" stroke-width="3" stroke-linecap="round">
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                    </span>
                    <span>{{ t.text }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="toast-fade">
        <div v-if="taskDetail" class="sheet-mask" @click.self="taskDetail = null" @keydown.esc="taskDetail = null">
          <div class="sheet sheet--detail" role="dialog" aria-modal="true" aria-label="任务详情">
            <button class="sheet__close" aria-label="关闭" @click="taskDetail = null">×</button>
            <div v-if="detailLoading" class="skeleton-list">
              <div class="skeleton-item"></div>
              <div class="skeleton-item" style="height: 120px"></div>
            </div>
            <template v-else>
              <p class="detail__title">{{ taskDetail.text }}</p>
              <div class="detail__meta">
                <span v-if="taskDetail.course" class="detail__tag">{{ taskDetail.course }}</span>
                <span class="detail__tag" :class="taskDetail.done ? 'detail__tag--ok' : 'detail__tag--warn'">
                  {{ taskDetail.done ? '已完成' : '进行中' }}
                </span>
                <span class="detail__tag detail__tag--muted">
                  {{ taskDetail.source === 'custom' ? '自定义' : '推荐任务' }}
                </span>
              </div>
              <div v-if="taskDetailDetail" class="detail__body">
                <section v-if="taskDetailDetail.objective">
                  <p class="detail__h">学习目标</p>
                  <p class="detail__p">{{ taskDetailDetail.objective }}</p>
                </section>
                <section v-if="taskDetailDetail.keywords?.length">
                  <p class="detail__h">关键词</p>
                  <div class="detail__kws">
                    <span v-for="k in taskDetailDetail.keywords" :key="k" class="detail__kw">{{ k }}</span>
                  </div>
                </section>
                <section v-if="taskDetailDetail.estimatedMinutes">
                  <p class="detail__h">预计用时</p>
                  <p class="detail__p">约 {{ taskDetailDetail.estimatedMinutes }} 分钟</p>
                </section>
                <section v-if="taskDetailDetail.tips?.length">
                  <p class="detail__h">学习提示</p>
                  <ul class="detail__ul">
                    <li v-for="(tip, i) in taskDetailDetail.tips" :key="i">{{ tip }}</li>
                  </ul>
                </section>
                <section v-if="taskDetailDetail.references?.length">
                  <p class="detail__h">参考来源</p>
                  <ul class="detail__ul">
                    <li v-for="(r, i) in taskDetailDetail.references" :key="i">{{ r }}</li>
                  </ul>
                </section>
              </div>
              <div class="detail__actions">
                <button
                  class="detail__btn detail__btn--ghost"
                  :disabled="toggleLoading"
                  @click="toggleTask(taskDetail)"
                >
                  {{ taskDetail.done ? '取消完成' : '标记完成' }}
                </button>
                <button
                  v-if="taskDetail.source === 'custom'"
                  class="detail__btn detail__btn--danger"
                  :disabled="removeLoading"
                  @click="removeTask(taskDetail)"
                >
                  {{ removeLoading ? '删除中...' : '删除任务' }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import AppCard from "../components/AppCard.vue";
import SegmentedControl from "../components/SegmentedControl.vue";
import BaseAppIcon from "../components/BaseAppIcon.vue";
import ReportIcon from "../components/ReportIcon.vue";
import AchievementIcon from "../components/AchievementIcon.vue";
import CourseIcon from "../components/CourseIcon.vue";
import * as taskApi from "../api/task";
import * as studyApi from "../api/study";
import * as settingsApi from "../api/settings";
import * as eventApi from "../api/events";
import { useAchievements } from "../composables/useAchievements";
import { useStore, safeLSGet, safeLSSet } from "../composables/useStore";
import { toast } from "../utils/feedback";

const router = useRouter();
const ach = useAchievements();
const { loadStudyStatus, state: storeState } = useStore();

const homeNextAch = computed(() => {
  const upcoming = ach.state.upcoming || [];
  if (upcoming[0]) return upcoming[0];
  const list = ach.state.list || [];
  const locked = list.filter((a) => !a.unlocked).sort((a, b) => b.progress - a.progress);
  return locked[0] || { name: '-', progress: 0, current: 0, threshold: 0 };
});

const mode = ref(safeLSGet("xy-mode", "study"));
watch(mode, (v) => {
  safeLSSet("xy-mode", v);
  Promise.all([loadTasks(), loadAdvice(), loadContinue()]);
});

const tasks = ref([]);
const taskLoading = ref(false);
const taskError = ref(false);
const showAdd = ref(false);
const showHistory = ref(false);
const newTask = ref("");
const taskHistory = ref([]);
const historyLoading = ref(false);
const addLoading = ref(false);
const removeLoading = ref(false);
const toggleLoading = ref(false);

const taskDetail = ref(null);
const taskDetailDetail = ref(null);
const detailLoading = ref(false);

const adviceList = ref([]);
const adviceLoading = ref(false);
const adviceError = ref(false);

const continueList = ref([]);
const continueLoading = ref(false);
const continueError = ref(false);

const status = ref(null);
const statusLoading = ref(false);
const statusError = ref(false);

const settings = ref({
  remind: true,
  recommend: true,
  homeCustom: "today",
  answerStyles: ["guide"],
});
const settingsLoaded = ref(false);

const todayLabel = new Date().toLocaleDateString("zh-CN", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function formatHistoryDate(d) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString("zh-CN", { weekday: "long", month: "long", day: "numeric" });
  } catch (e) {
    return d;
  }
}

function safePct(numerator, denominator = 100) {
  const n = Number(numerator) || 0;
  const d = Number(denominator) || 0;
  if (d <= 0) return 0;
  const v = Math.round((n / d) * 100);
  return Math.min(100, Math.max(0, v));
}

async function loadSettings() {
  try {
    const res = await settingsApi.getSettings();
    if (res.code === 200) {
      settings.value = { ...settings.value, ...res.data.settings };
    }
  } finally {
    settingsLoaded.value = true;
  }
}

async function loadTasks() {
  taskLoading.value = true;
  taskError.value = false;
  try {
    const res = await taskApi.getTasks(mode.value);
    if (res.code === 200) {
      tasks.value = Array.isArray(res.data?.list) ? res.data.list : [];
    } else {
      taskError.value = true;
    }
  } catch (e) {
    taskError.value = true;
  } finally {
    taskLoading.value = false;
  }
}

async function loadTaskHistory() {
  historyLoading.value = true;
  try {
    const res = await taskApi.getTaskHistory();
    if (res.code === 200) {
      taskHistory.value = Array.isArray(res.data) ? res.data : [];
    }
  } finally {
    historyLoading.value = false;
  }
}

async function loadAdvice() {
  adviceLoading.value = true;
  adviceError.value = false;
  try {
    const res = await studyApi.getSmartAdvice(mode.value);
    if (res.code === 200) {
      adviceList.value = Array.isArray(res.data) ? res.data : [];
    } else {
      adviceError.value = true;
    }
  } catch (e) {
    adviceError.value = true;
  } finally {
    adviceLoading.value = false;
  }
}

async function loadContinue() {
  continueLoading.value = true;
  continueError.value = false;
  try {
    const res = await studyApi.getContinueStudy(mode.value);
    if (res.code === 200) {
      const data = res.data;
      if (Array.isArray(data)) continueList.value = data;
      else if (Array.isArray(data?.list)) continueList.value = data.list;
      else continueList.value = [];
    } else {
      continueError.value = true;
    }
  } catch (e) {
    continueError.value = true;
  } finally {
    continueLoading.value = false;
  }
}

async function loadStatus() {
  statusLoading.value = true;
  statusError.value = false;
  try {
    const res = await loadStudyStatus(true);
    status.value = res || null;
    if (!res) statusError.value = true;
  } catch (e) {
    statusError.value = true;
  } finally {
    statusLoading.value = false;
  }
}

async function toggleTask(task) {
  toggleLoading.value = true;
  try {
    const res = await taskApi.toggleTask(task.id);
    if (res.code === 200) {
      const found = tasks.value.find((t) => t.id === task.id);
      if (found) found.done = res.data.done;
      if (taskDetail.value?.id === task.id) {
        taskDetail.value = { ...taskDetail.value, done: res.data.done };
      }
      /* --- 真实事件：task_complete，计算每日全勤 dailyAllComplete --- */
      const today = typeof eventApi.todayStr === "function" ? eventApi.todayStr()
        : (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
      const todo = tasks.value.filter((t) => !t.customOnly);
      const total = todo.length;
      const done = todo.filter((t) => !!t.done).length;
      const dailyAllComplete = total > 0 && done >= total;
      try {
        if (typeof eventApi.recordEvent === "function") {
          await eventApi.recordEvent("task_complete", {
            taskId: task.id,
            date: today,
            done: !!res.data.done,
            dailyAllComplete,
            taskTotalToday: total,
            taskDoneToday: done,
          });
        }
        await ach.trigger("task:complete", {
          relatedMetrics: dailyAllComplete
            ? ["perfectDays", "perfectWeeks", "perfectMonths"]
            : ["perfectDays"],
        });
      } catch (_) {}
    }
  } finally {
    toggleLoading.value = false;
  }
}

async function refreshTasks() {
  if (taskLoading.value) return;
  taskLoading.value = true;
  try {
    const res = await taskApi.refreshTasks(mode.value);
    if (res.code === 200) {
      tasks.value = Array.isArray(res.data?.list) ? res.data.list : [];
      toast("已为你重新生成今日任务（自定义任务已保留）");
    } else {
      toast(res.msg || "刷新失败");
    }
  } catch (e) {
    toast("刷新失败，请稍后重试");
  } finally {
    taskLoading.value = false;
  }
}

async function addTask() {
  const text = newTask.value.trim();
  if (!text) return;
  if (addLoading.value) return;
  addLoading.value = true;
  try {
    const res = await taskApi.addTask(text, "", {});
    if (res.code === 200) {
      tasks.value.push(res.data);
      newTask.value = "";
      toast("任务已添加");
    } else {
      toast(res.msg || "添加失败");
    }
  } catch (e) {
    toast("添加失败");
  } finally {
    addLoading.value = false;
  }
}

async function removeTask(task) {
  if (removeLoading.value) return;
  removeLoading.value = true;
  try {
    const res = await taskApi.removeTask(task.id);
    if (res.code === 200) {
      tasks.value = tasks.value.filter((t) => t.id !== task.id);
      taskDetail.value = null;
      toast("任务已删除");
    }
  } finally {
    removeLoading.value = false;
  }
}

async function openTaskDetail(task) {
  taskDetail.value = task;
  taskDetailDetail.value = null;
  detailLoading.value = true;
  try {
    const res = await taskApi.getTaskDetail(task.id);
    if (res.code === 200) {
      taskDetailDetail.value = res.data;
    }
  } finally {
    detailLoading.value = false;
  }
}

function onKeydown(e) {
  if (e.key === "Escape") {
    if (taskDetail.value) taskDetail.value = null;
    else if (showAdd.value) showAdd.value = false;
    else if (showHistory.value) showHistory.value = false;
  }
}

onMounted(async () => {
  window.addEventListener("keydown", onKeydown);
  await Promise.all([
    loadSettings(),
    loadTasks(),
    loadTaskHistory(),
    loadAdvice(),
    loadContinue(),
    loadStatus(),
    ach.bootstrap(),
  ]);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.home__brand {
  padding: calc(12px + var(--safe-top)) var(--page-padding) 18px;
}
.home__brand-name {
  font-size: var(--font-size-nav);
  font-weight: 700;
}
.home__brand-slogan {
  font-size: var(--font-size-caption);
  color: var(--color-text-caption);
  margin-top: 4px;
  overflow-wrap: anywhere;
}

.home__mode {
  margin: 0 var(--page-padding) var(--card-gap);
}

.icon-btn {
  display: flex;
  padding: 6px;
  color: var(--color-text-secondary);
  border-radius: 8px;
}
.icon-btn:disabled {
  opacity: 0.5;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.mini-spin {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-primary-muted);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.task__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.task__title {
  font-size: var(--font-size-title);
  font-weight: 600;
}
.task__list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.task__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}
.task__check-btn {
  flex: 0 0 auto;
  padding: 2px;
  border-radius: 50%;
}
.task__check {
  display: block;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  border: 1.5px solid var(--color-text-caption);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.task__check--done {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.task__main {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 8px;
  text-align: left;
}
.task__main:active { background: var(--color-input-bg); }
.task__text {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 14px;
}
.task__text--done {
  color: var(--color-text-caption);
  text-decoration: line-through;
}
.task__course {
  flex: 0 0 auto;
  font-size: 11px;
  background: var(--color-primary-tint);
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  white-space: nowrap;
}
.task__foot {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 4px;
}

.empty-state {
  padding: 18px 0;
  text-align: center;
}
.empty-state__text {
  font-size: 13px;
  color: var(--color-text-caption);
}
.empty-state__btn {
  margin-top: 10px;
  padding: 6px 16px;
  font-size: 13px;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: var(--radius-pill);
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

.continue__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}
.continue__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  gap: 12px;
  border-bottom: 1px solid var(--color-divider);
}
.continue__item:last-child { border-bottom: 0; }
.continue__item:active { opacity: 0.6; }
.continue__main {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto auto;
  column-gap: 8px;
  row-gap: 4px;
}
.continue__name {
  grid-column: 1 / -1;
  font-weight: 600;
  font-size: 14px;
  overflow-wrap: anywhere;
}
.continue__chapter {
  grid-column: 1 / -1;
  color: var(--color-text-caption);
  overflow-wrap: anywhere;
}
.continue__progress {
  grid-column: 1 / 2;
  height: 4px;
  background: var(--color-input-bg);
  border-radius: var(--radius-pill);
  overflow: hidden;
  align-self: center;
}
.continue__progress-inner {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-pill);
}
.continue__pct {
  grid-column: 2 / 3;
  grid-row: 3 / 4;
  text-align: right;
}

.advice-item {
  padding: 10px 12px;
  background: var(--color-input-bg);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  border-left: 3px solid var(--color-primary-muted);
}
.advice-item--high { border-left-color: #e74c3c; }
.advice-item--medium { border-left-color: #f39c12; }
.advice-item--low { border-left-color: var(--color-primary-muted); }
.advice-item__tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  background: var(--color-primary-tint);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  margin-right: 8px;
}
.advice-item__content {
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}

.report__head { margin-bottom: 10px; }
.report__btns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.report__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 6px;
  background: var(--color-input-bg);
  border-radius: var(--radius-card);
  font-size: 14px;
  font-weight: 500;
}
.report__btn:active { opacity: 0.7; }
.report__icon { font-size: 22px; }

.quick {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 0 var(--page-padding);
  margin-bottom: var(--card-gap);
}
.quick__card {
  min-height: 110px;
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
}
.quick__card:active { opacity: 0.7; }
.quick__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--color-primary-tint);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}
.quick__name {
  font-weight: 600;
  font-size: 15px;
}
.quick__en {
  font-size: 10px;
  letter-spacing: 1px;
  color: var(--color-text-caption);
}

.status__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.status__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}
.status__stats {
  display: flex;
  gap: 20px;
  margin: 10px 0 12px;
  flex-wrap: wrap;
}
.status__stats > div { min-width: 0; }
.status__num {
  font-size: var(--font-size-title);
  font-weight: 600;
  margin-top: 2px;
  overflow-wrap: anywhere;
}
.status__bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 64px;
  margin-bottom: 14px;
}
.status__bar {
  flex: 1;
  min-width: 0;
  border-radius: 3px 3px 0 0;
  background: var(--color-primary);
}
.status__bar--muted {
  background: var(--color-primary-muted);
}
.status__achieve {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}
.status__achieve > p { min-width: 0; overflow-wrap: anywhere; }
.status__pct { font-weight: 600; flex-shrink: 0; }
.status__progress {
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--color-primary-tint);
  overflow: hidden;
  margin-top: 6px;
}
.status__progress-inner {
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--color-primary);
}
.status__count {
  text-align: right;
  margin-top: 4px;
  overflow-wrap: anywhere;
}
.status__remind {
  color: var(--color-primary);
  margin-left: 6px;
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
  max-height: 75vh;
  overflow-y: auto;
  background: var(--color-card);
  border-radius: 16px 16px 0 0;
  padding: 20px 16px calc(16px + var(--safe-bottom));
  position: relative;
}
.sheet--detail { max-height: 85vh; }
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
.sheet__date {
  font-weight: 600;
  margin-bottom: 10px;
  padding-right: 30px;
  overflow-wrap: anywhere;
}
.sheet__list { list-style: none; padding: 0; margin: 0 0 10px; }
.sheet__task-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 0;
}
.sheet__task {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 0;
}
.sheet__task--done { color: var(--color-text-caption); text-decoration: line-through; }
.sheet__group { margin-bottom: 8px; }
.sheet__input {
  width: 100%;
  border-bottom: 1px solid var(--color-divider);
  padding: 10px 2px;
  font-size: var(--font-size-body);
  color: var(--color-text);
}
.sheet__input::placeholder { color: var(--color-text-caption); }
.sheet__foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.detail__title {
  font-size: 17px;
  font-weight: 700;
  margin: 6px 30px 10px 0;
  overflow-wrap: anywhere;
}
.detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}
.detail__tag {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--color-primary-tint);
  color: var(--color-primary);
}
.detail__tag--ok { background: #d1fae5; color: #065f46; }
.detail__tag--warn { background: #fef3c7; color: #92400e; }
.detail__tag--muted { background: var(--color-input-bg); color: var(--color-text-caption); }
.detail__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.detail__h {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--color-text-secondary);
}
.detail__p {
  font-size: 14px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}
.detail__kws {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.detail__kw {
  font-size: 12px;
  padding: 3px 9px;
  background: var(--color-input-bg);
  border-radius: 999px;
  color: var(--color-text-secondary);
}
.detail__ul {
  padding-left: 18px;
  margin: 0;
  font-size: 13px;
  line-height: 1.9;
  color: var(--color-text-secondary);
}
.detail__actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.detail__btn {
  flex: 1;
  padding: 11px 0;
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 500;
}
.detail__btn:disabled { opacity: 0.6; }
.detail__btn--ghost {
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: transparent;
}
.detail__btn--danger {
  background: #fee2e2;
  color: #b91c1c;
}

.visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

@media (max-width: 375px) {
  .quick {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .status__stats {
    gap: 14px;
  }
  .home__brand-slogan {
    font-size: 12px;
  }
  .continue__main {
    column-gap: 6px;
  }
  .detail__actions {
    flex-direction: column;
  }
}
@media (max-width: 340px) {
  .report__btns {
    grid-template-columns: 1fr;
  }
}
</style>
