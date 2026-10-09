<template>
  <PlainLayout title="设置">
    <AppCard title="账号与同步">
      <div class="row">
        <p class="row__title">
          用户账号基础信息同步
          <span class="text-caption">跨设备同步个人档案（Web 模拟）</span>
        </p>
        <ToggleSwitch :model-value="settings.syncAccount" @update:model-value="(v) => updateSetting('syncAccount', v)" />
      </div>
      <div class="row">
        <p class="row__title">
          学习进度实时同步
          <span class="text-caption">学习记录、成就、关联即时同步（Web 模拟）</span>
        </p>
        <ToggleSwitch :model-value="settings.syncProgress" @update:model-value="(v) => updateSetting('syncProgress', v)" />
      </div>
      <div class="row row--borderless">
        <p class="row__title">
          启动画面
          <span class="text-caption">每次启动 App 时进入的页面</span>
        </p>
        <div class="segmented-wrap">
          <SegmentedControl
            :options="launchPageOptions"
            :model-value="settings.launchPage"
            @update:model-value="(v) => updateSetting('launchPage', v)"
          />
        </div>
      </div>
    </AppCard>

    <AppCard title="数据与备份">
      <div class="row">
        <p class="row__title">
          数据备份
          <span class="text-caption">{{ settings.dataBackup ? '本地快照已开启，最多保留 20 份' : '已关闭，无法创建备份' }}</span>
        </p>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; justify-content:flex-end;">
          <ToggleSwitch :model-value="settings.dataBackup" @update:model-value="(v) => updateSetting('dataBackup', v)" />
          <button class="row__action" :disabled="!settings.dataBackup || backupBusy" @click="onCreateBackup">
            {{ backupBusy ? '备份中…' : '立即备份' }}
          </button>
          <button class="row__action" :disabled="!settings.exportData || exportBusy" @click="onExportJSON">
            {{ exportBusy ? '导出中…' : '导出 JSON' }}
          </button>
        </div>
      </div>
      <div class="row">
        <p class="row__title">
          知识数据导出
          <span class="text-caption">允许导出学习记录、知识点与关联</span>
        </p>
        <ToggleSwitch :model-value="settings.exportData" @update:model-value="(v) => updateSetting('exportData', v)" />
      </div>
      <div v-if="backupList.length" class="row row--borderless">
        <p class="row__title">
          最近备份
          <span class="text-caption">点击可查看时间戳</span>
        </p>
        <span class="text-caption">{{ backupList.length }} 份</span>
      </div>
      <ul v-if="backupList.length" class="backup-list">
        <li v-for="bk in backupList.slice(0,5)" :key="bk.id" class="backup-list__item">
          <span>{{ bk.createdAt.replace('T',' ').slice(0,19) }}</span>
          <span class="text-caption">{{ bk.sizeKb }} KB</span>
        </li>
      </ul>
    </AppCard>

    <AppCard title="学习">
      <div class="row">
        <p class="row__title">
          答题风格
          <span class="text-caption">可多选，至少1项</span>
        </p>
        <button class="row__action" @click="openAnswerStyles">{{ answerStylesLabel }} ›</button>
      </div>
      <div class="row row--borderless">
        <p class="row__title">
          智能关联
          <span class="text-caption">学习页自动提示关联</span>
        </p>
        <ToggleSwitch :model-value="settings.smartLink" @update:model-value="(v) => updateSetting('smartLink', v)" />
      </div>
    </AppCard>

    <AppCard title="首页">
      <div class="row row--borderless">
        <p class="row__title">
          首页个性化
          <span class="text-caption">默认显示今日 / 本周 / 本月</span>
        </p>
        <div class="segmented-wrap">
          <SegmentedControl
            :options="homeCustomOptions"
            :model-value="settings.homeCustom"
            @update:model-value="(v) => updateSetting('homeCustom', v)"
          />
        </div>
      </div>
    </AppCard>

    <AppCard title="提醒与推送">
      <div class="row">
        <p class="row__title">
          每日学习提醒
          <span class="text-caption">{{ settings.remind ? '晚 8 点准时提醒（真实启停）' : '已关闭，提醒定时器已停止' }}</span>
        </p>
        <ToggleSwitch :model-value="settings.remind" @update:model-value="(v) => updateSetting('remind', v)" />
      </div>
      <div class="row">
        <p class="row__title">
          智能推送每日学习任务
          <span class="text-caption">根据画像推荐每日任务</span>
        </p>
        <ToggleSwitch :model-value="settings.recommend" @update:model-value="(v) => updateSetting('recommend', v)" />
      </div>
      <div class="row">
        <p class="row__title">
          消息推送总开关
          <span class="text-caption">{{ settings.messagePush ? '允许推送（关闭后推送定时器停止）' : '已关闭' }}</span>
        </p>
        <ToggleSwitch :model-value="settings.messagePush" @update:model-value="(v) => updateSetting('messagePush', v)" />
      </div>
      <div class="row">
        <p class="row__title">
          成就解锁提醒
          <span class="text-caption">
            {{ settings.achievementNotify
              ? '解锁新成就时主动弹窗（每会话最多 1 次）'
              : '已关闭，仍会记录成就，请到成就中心查看' }}
          </span>
        </p>
        <ToggleSwitch :model-value="settings.achievementNotify" @update:model-value="(v) => updateSetting('achievementNotify', v)" />
      </div>
      <div class="row row--borderless">
        <p class="row__title">
          成就达成推送
          <span class="text-caption">解锁成就时发送消息推送（Web 模拟）</span>
        </p>
        <ToggleSwitch :model-value="settings.push" @update:model-value="(v) => updateSetting('push', v)" />
      </div>
    </AppCard>

    <AppCard title="权限">
      <div class="row">
        <p class="row__title">
          通知权限
          <span class="text-caption">接收学习提醒与消息 <em class="sim">（Web 模拟）</em></span>
        </p>
        <ToggleSwitch :model-value="settings.permissionNotification" @update:model-value="(v) => updateSetting('permissionNotification', v)" />
      </div>
      <div class="row">
        <p class="row__title">
          相机权限
          <span class="text-caption">拍题 / 扫题上传 <em class="sim">（Web 模拟）</em></span>
        </p>
        <ToggleSwitch :model-value="settings.permissionCamera" @update:model-value="(v) => updateSetting('permissionCamera', v)" />
      </div>
      <div class="row">
        <p class="row__title">
          相册权限
          <span class="text-caption">更换头像 / 上传图片</span>
        </p>
        <ToggleSwitch :model-value="settings.permissionPhoto" @update:model-value="(v) => updateSetting('permissionPhoto', v)" />
      </div>
      <div class="row">
        <p class="row__title">
          位置权限
          <span class="text-caption">推荐附近线下活动 <em class="sim">（Web 模拟）</em></span>
        </p>
        <ToggleSwitch :model-value="settings.permissionLocation" @update:model-value="(v) => updateSetting('permissionLocation', v)" />
      </div>
      <div class="row row--borderless">
        <p class="row__title">
          麦克风权限
          <span class="text-caption">语音提问 / 背诵 <em class="sim">（Web 模拟）</em></span>
        </p>
        <ToggleSwitch :model-value="settings.permissionMicrophone" @update:model-value="(v) => updateSetting('permissionMicrophone', v)" />
      </div>
    </AppCard>

    <AppCard>
      <div class="row row--borderless">
        <p class="row__title">清除所有数据（本地缓存）</p>
        <button class="row__action row__action--danger" @click="onClear">清除</button>
      </div>
    </AppCard>

    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="showAnswerStyle" class="sheet-mask" @click.self="showAnswerStyle = false">
          <div class="sheet sheet--as" role="dialog" aria-modal="true">
            <button class="sheet__close" aria-label="关闭" @click="showAnswerStyle = false">×</button>
            <p class="sheet__date">答题风格（可多选，至少1项）</p>
            <p class="text-caption sheet__sub">AI 将根据选择的风格组合生成回答</p>
            <div class="as-list">
              <div
                v-for="s in answerStyles"
                :key="s.key"
                class="as-row"
              >
                <div class="as-row__main">
                  <p class="as-row__name">{{ s.label || s.name }}</p>
                  <p class="text-caption">{{ s.note || s.desc }}</p>
                </div>
                <ToggleSwitch
                  :model-value="settings.answerStyles.includes(s.key)"
                  @update:model-value="() => toggleStyle(s.key)"
                />
              </div>
            </div>
            <button class="as__save" @click="onSaveStyles" :disabled="savingStyles">
              {{ savingStyles ? '保存中...' : '确定' }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </PlainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import PlainLayout from "../layouts/PlainLayout.vue";
import AppCard from "../components/AppCard.vue";
import SegmentedControl from "../components/SegmentedControl.vue";
import ToggleSwitch from "../components/ToggleSwitch.vue";
import * as settingsApi from "../api/settings";
import { toast, showLoading, hideLoading } from "../utils/feedback";

const showAnswerStyle = ref(false);
const savingStyles = ref(false);
const answerStyles = ref([]);
const backupBusy = ref(false);
const exportBusy = ref(false);
const backupList = ref([]);
const launchPageOptions = [
  { value: "home", label: "首页" },
  { value: "last", label: "上次关闭" },
];

const settings = ref({
  answerStyles: ["guide"],
  smartLink: true,
  remind: true,
  push: false,
  recommend: true,
  homeCustom: "today",
  permissionCamera: false,
  permissionPhoto: true,
  permissionNotification: true,
  permissionLocation: false,
  permissionMicrophone: false,
  fontSize: "medium",
  theme: "light",
  syncAccount: true,
  syncProgress: true,
  dataBackup: true,
  launchPage: "home",
  exportData: true,
  messagePush: true,
});

const answerStylesLabel = computed(() => {
  const list = answerStyles.value.filter((a) => settings.value.answerStyles.includes(a.key)).map((a) => a.label || a.name);
  if (!list.length) {
    const selected = settings.value.answerStyles.slice(0, 2).join(",");
    return selected || "未设置";
  }
  if (list.length <= 3) return list.join(" · ");
  return list.slice(0, 2).join(" · ") + ` +${list.length - 2}`;
});

async function load() {
  try {
    const res = await settingsApi.getSettings();
    if (res.code === 200) {
      settings.value = { ...settings.value, ...res.data.settings };
      if (Array.isArray(res.data.answerStyles)) answerStyles.value = res.data.answerStyles;
    }
    if (!answerStyles.value.length) {
      const a = await settingsApi.getAnswerStyles();
      if (a.code === 200) answerStyles.value = a.data;
    }
    await loadBackups();
  } catch (e) {
    toast("加载设置失败");
  }
}

async function loadBackups() {
  try {
    const r = await settingsApi.listBackups();
    if (r.code === 200) backupList.value = Array.isArray(r.data.list) ? r.data.list : [];
  } catch (_) {}
}

async function onCreateBackup() {
  if (!settings.value.dataBackup || backupBusy.value) return;
  backupBusy.value = true;
  try {
    const r = await settingsApi.createBackup();
    if (r?.code === 200) {
      toast(`备份已创建：${r.data.sizeKb} KB`);
      await loadBackups();
    } else {
      toast(r?.msg || "备份失败");
    }
  } catch (e) {
    toast(String(e?.message || e || "备份失败"));
  } finally {
    backupBusy.value = false;
  }
}

async function onExportJSON() {
  if (!settings.value.exportData || exportBusy.value) return;
  exportBusy.value = true;
  try {
    const r = await settingsApi.exportDataJSON();
    if (r?.code === 200) {
      toast(`${r.data.downloaded ? '已开始下载' : '请手动复制'}：${r.data.filename}`);
    } else {
      toast(r?.msg || "导出失败");
    }
  } catch (e) {
    toast(String(e?.message || e || "导出失败"));
  } finally {
    exportBusy.value = false;
  }
}

async function updateSetting(key, value) {
  settings.value[key] = value;
  const res = await settingsApi.saveSettings({ [key]: value });
  if (res.code !== 200) toast("保存失败");
}

function toggleStyle(key) {
  const list = settings.value.answerStyles.slice();
  const idx = list.indexOf(key);
  if (idx >= 0) {
    if (list.length <= 1) {
      toast("至少保留一种回答风格");
      return;
    }
    list.splice(idx, 1);
  } else {
    list.push(key);
  }
  settings.value.answerStyles = list;
}

function openAnswerStyles() {
  showAnswerStyle.value = true;
}

async function onSaveStyles() {
  if (savingStyles.value) return;
  if (!settings.value.answerStyles.length) {
    toast("至少保留一种回答风格");
    return;
  }
  savingStyles.value = true;
  try {
    const res = await settingsApi.saveSettings({ answerStyles: settings.value.answerStyles });
    if (res.code === 200) {
      settings.value.answerStyles = res.data.answerStyles;
      showAnswerStyle.value = false;
      toast("答题风格已保存");
    } else {
      toast(res.msg || "保存失败");
    }
  } finally {
    savingStyles.value = false;
  }
}

async function onClear() {
  showLoading("清除中");
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("xy-"));
    keys.forEach((k) => localStorage.removeItem(k));
    await Promise.all([load()]);
    toast("本地缓存已清除");
  } finally {
    hideLoading();
  }
}

function onKeydown(e) {
  if (e.key === "Escape") {
    if (showAnswerStyle.value) showAnswerStyle.value = false;
  }
}

onMounted(async () => {
  window.addEventListener("keydown", onKeydown);
  await load();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-divider);
  gap: 12px;
}
.row--borderless {
  border-bottom: 0;
  padding-bottom: 4px;
  padding-top: 4px;
}
.row__title {
  font-size: 14px;
  font-weight: 500;
}
.row__title .text-caption {
  display: block;
  margin-top: 2px;
  font-weight: 400;
}
.row__action {
  font-size: 13px;
  color: var(--color-primary);
  flex-shrink: 0;
}
.row__action--danger {
  color: #b91c1c;
}
.segmented-wrap {
  flex-shrink: 0;
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
  top: 10px;
  right: 12px;
  font-size: 26px;
  line-height: 1;
  padding: 4px 10px;
  color: var(--color-text-caption);
  border-radius: 50%;
}
.sheet__close:active { opacity: 0.6; }
.sheet__date {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 4px;
}
.sheet__sub {
  margin-bottom: 12px;
}
.as-list {
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-card);
  background: var(--color-input-bg);
  overflow: hidden;
}
.as-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 14px 14px;
  gap: 12px;
  border-top: 1px solid var(--color-divider);
}
.as-row:first-child {
  border-top: none;
}
.as-row__main {
  flex: 1;
  min-width: 0;
  text-align: left;
}
.as-row__name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 2px;
}
.as__save {
  margin-top: 16px;
  width: 100%;
  padding: 12px 0;
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-pill);
  font-size: 15px;
  font-weight: 600;
}
.as__save:disabled {
  opacity: 0.6;
}
.sim {
  font-style: normal;
  color: #b45309;
  font-size: 11px;
  padding: 0 4px;
  border-radius: 4px;
  background: #fff7ed;
  margin-left: 4px;
}
.backup-list {
  list-style: none;
  padding: 0;
  margin: 6px 0 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.backup-list__item {
  display: flex;
  justify-content: space-between;
  padding: 5px 10px;
  border-radius: 6px;
  background: var(--color-input-bg);
  font-size: 12px;
}
</style>
