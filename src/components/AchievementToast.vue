<template>
  <Teleport to="body">
    <Transition name="toast-pop">
      <div
        v-if="currentToast"
        class="ach-toast-mask"
        role="dialog"
        aria-modal="true"
        :aria-label="toastAriaLabel"
        @click.self="onClose(false)"
      >
        <div class="ach-toast">
          <div class="ach-toast__glow"></div>
          <div class="ach-toast__badge">
            <AchievementIcon
              v-if="currentToast.primary?.id"
              :achievement-id="currentToast.primary.id"
              :level="currentToast.primary.level"
              :unlocked="true"
              size="lg"
              :aria-label="currentToast.primary.name"
            />
            <span class="ach-toast__badge-tag">
              {{ currentToast.isMulti ? `本次获得 ${currentToast.count} 项成就` : "成就解锁" }}
            </span>
          </div>

          <h2 class="ach-toast__name">
            {{ currentToast.isMulti ? `获得 ${currentToast.count} 项成就` : currentToast.primary?.name }}
          </h2>
          <p v-if="currentToast.isMulti" class="ach-toast__multi-desc">
            含「{{ currentToast.primary?.name }}」<template v-if="currentToast.restNames && currentToast.restNames.length">、{{ formatRestNames }}</template>
          </p>
          <p v-else class="ach-toast__desc">{{ currentToast.primary?.desc }}</p>

          <p v-if="!currentToast.isMulti && currentToast.primary?.unlockedAt" class="ach-toast__date">
            {{ currentToast.primary.unlockedAt }}
          </p>

          <div class="ach-toast__actions">
            <button type="button" class="ach-toast__btn ach-toast__btn--ghost" @click="onClose(false)">
              知道了
            </button>
            <button type="button" class="ach-toast__btn ach-toast__btn--primary" @click="onClose(true)">
              {{ currentToast.isMulti ? "查看全部" : "查看成就" }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AchievementIcon from "./AchievementIcon.vue";
import { useAchievements } from "../composables/useAchievements";

const router = useRouter();
const ach = useAchievements();
const currentToast = computed(() => ach.currentToast.value);
const toastAriaLabel = computed(() => {
  const t = currentToast.value;
  if (!t) return "成就解锁通知";
  if (t.isMulti) return `解锁 ${t.count} 项成就通知`;
  return `成就解锁：${t.primary?.name || ""}`;
});
const formatRestNames = computed(() => {
  const t = currentToast.value;
  if (!t?.restNames?.length) return "";
  if (t.restNames.length <= 2) return t.restNames.join("、");
  return `${t.restNames.slice(0, 2).join("、")} 等`;
});

onMounted(async () => {
  try { await ach.bootstrap(); } catch (e) {}
});

/* 3 秒自动关闭（约）：单个或合并弹窗都遵循，仍可手动关闭 */
const AUTO_DISMISS_MS = 3200;
let autoTimer = null;
const dismissAt = ref(0);
const startAt = ref(0);

function clearAutoTimer() {
  if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
}
function restartAutoTimer() {
  clearAutoTimer();
  startAt.value = Date.now();
  dismissAt.value = startAt.value + AUTO_DISMISS_MS;
  autoTimer = setTimeout(() => {
    // 自动关闭 → 当作"知道了"，不跳转
    onClose(false);
  }, AUTO_DISMISS_MS);
}

watch(currentToast, (v, oldV) => {
  if (!oldV && v) {
    restartAutoTimer();
  } else if (!v) {
    clearAutoTimer();
  }
}, { immediate: true });

onBeforeUnmount(() => {
  clearAutoTimer();
});

function onClose(viewAchievements) {
  ach.markCurrentSeen();
  clearAutoTimer();
  if (viewAchievements) {
    router.push({ name: "achievements" });
  }
}
</script>

<style scoped>
.ach-toast-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.ach-toast {
  position: relative;
  width: 100%;
  max-width: 320px;
  background: linear-gradient(165deg, #fffdf5 0%, #ffffff 50%, #f1f8e9 100%);
  border-radius: 20px;
  padding: 28px 20px 22px;
  text-align: center;
  box-shadow: 0 16px 48px rgba(31, 92, 56, 0.28), 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
  border: 1px solid rgba(129, 199, 132, 0.4);
}

.ach-toast__glow {
  position: absolute;
  top: -80px; left: 50%;
  width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(76,175,80,0.35), rgba(76,175,80,0) 65%);
  transform: translateX(-50%);
  pointer-events: none;
}

.ach-toast__badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  position: relative;
  z-index: 1;
}
.ach-toast__badge-tag {
  display: inline-block;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #1f5c38;
  background: rgba(197, 225, 165, 0.95);
  border-radius: 999px;
  letter-spacing: 0.5px;
}

.ach-toast__name {
  position: relative;
  z-index: 1;
  font-size: 22px;
  font-weight: 800;
  color: #1b5e20;
  margin: 8px 0 4px;
  letter-spacing: 0.5px;
}
.ach-toast__desc {
  position: relative;
  z-index: 1;
  font-size: 13px;
  line-height: 1.6;
  color: #37474f;
  margin: 0 8px 6px;
  word-break: break-all;
}
.ach-toast__multi-desc {
  position: relative;
  z-index: 1;
  font-size: 13px;
  line-height: 1.7;
  color: #37474f;
  margin: 0 8px 8px;
}
.ach-toast__date {
  position: relative;
  z-index: 1;
  font-size: 11px;
  color: #689f38;
  margin: 0 0 14px;
  font-weight: 600;
}

.ach-toast__actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  position: relative;
  z-index: 1;
}
.ach-toast__btn {
  flex: 1;
  height: 40px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.5px;
  transition: transform 0.08s ease;
}
.ach-toast__btn:active { transform: translateY(1px); opacity: 0.9; }
.ach-toast__btn--ghost {
  background: #fff;
  color: #1f5c38;
  border: 1px solid #c8e6c9;
}
.ach-toast__btn--primary {
  background: linear-gradient(90deg, #43a047, #1f5c38);
  color: #fff;
  border: none;
  box-shadow: 0 6px 16px rgba(31,92,56,0.28);
}

/* 过渡 */
.toast-pop-enter-active, .toast-pop-leave-active {
  transition: opacity 0.2s ease, transform 0.25s cubic-bezier(.2,.9,.3,1.2);
}
.toast-pop-enter-from, .toast-pop-leave-to {
  opacity: 0;
}
.toast-pop-enter-from .ach-toast,
.toast-pop-leave-to .ach-toast {
  transform: translateY(12px) scale(0.92);
}

@media (max-width: 320px) {
  .ach-toast {
    padding: 22px 16px 18px;
  }
  .ach-toast__name {
    font-size: 19px;
  }
}
</style>
