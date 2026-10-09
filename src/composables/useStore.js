import { reactive, ref, computed } from "vue";
import * as userApi from "../api/user";
import * as studyApi from "../api/study";
import * as settingsApi from "../api/settings";
import * as achievementApi from "../api/achievement";

const state = reactive({
  user: null,
  studyStatus: null,
  settings: null,
  answerStyles: [],
  achievements: null,
  loading: {
    user: false,
    study: false,
    settings: false,
    all: false,
  },
  initialized: false,
});

const loginState = ref(userApi.isLoggedIn());

export function safeLSGet(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    return defaultValue;
  }
}

export function safeLSSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

async function loadUser(force = false) {
  if (state.loading.user) return;
  if (!force && state.user) return state.user;
  state.loading.user = true;
  try {
    const res = await userApi.getUserProfile();
    if (res.code === 200) {
      state.user = res.data;
    }
  } finally {
    state.loading.user = false;
  }
  return state.user;
}

async function loadStudyStatus(force = false) {
  if (state.loading.study) return;
  if (!force && state.studyStatus) return state.studyStatus;
  state.loading.study = true;
  try {
    const res = await studyApi.getStudyStatus();
    if (res.code === 200) {
      state.studyStatus = res.data;
    }
  } finally {
    state.loading.study = false;
  }
  return state.studyStatus;
}

async function loadSettings(force = false) {
  if (state.loading.settings) return;
  if (!force && state.settings) return state.settings;
  state.loading.settings = true;
  try {
    const res = await settingsApi.getSettings();
    if (res.code === 200) {
      state.settings = res.data.settings;
      state.answerStyles = res.data.answerStyles;
    }
  } finally {
    state.loading.settings = false;
  }
  return state.settings;
}

async function loadAchievements() {
  if (state.achievements) return state.achievements;
  const res = await achievementApi.getAchievements();
  if (res.code === 200) {
    state.achievements = res.data;
  }
  return state.achievements;
}

export async function initializeStore() {
  if (state.initialized) return;
  state.loading.all = true;
  try {
    await Promise.all([
      loginState.value ? loadUser(true) : Promise.resolve(),
      loadStudyStatus(true),
      loadSettings(true),
      loadAchievements(),
    ]);
    state.initialized = true;
  } finally {
    state.loading.all = false;  }
}

export function useStore() {
  const streakDays = computed(() => state.studyStatus?.streakDays ?? 0);
  const totalHours = computed(() => state.studyStatus?.totalHours ?? 0);
  const maxStreak = computed(() => state.studyStatus?.maxStreak ?? 0);

  async function updateUser(patch) {
    const res = await userApi.updateUserProfile(patch);
    if (res.code === 200 && state.user) {
      state.user = { ...state.user, ...res.data };
    }
    return res;
  }

  async function updateAvatar(url) {
    const res = await userApi.updateAvatar(url);
    if (res.code === 200 && state.user) {
      state.user.avatarUrl = url;
    }
    return res;
  }

  return {
    state,
    loginState,
    streakDays,
    totalHours,
    maxStreak,
    initializeStore,
    loadUser,
    loadStudyStatus,
    loadSettings,
    loadAchievements,
    updateUser,
    updateAvatar,
    safeLSGet,
    safeLSSet,
  };
}
