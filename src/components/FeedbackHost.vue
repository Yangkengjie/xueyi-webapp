<template>
  <!-- 全局 Toast / Loading 宿主，挂在 App.vue 一次 -->
  <Teleport to="body">
    <Transition name="toast-fade">
      <div v-if="toastState.visible" class="toast">{{ toastState.message }}</div>
    </Transition>
    <Transition name="toast-fade">
      <div v-if="loadingState.visible" class="loading-mask">
        <div class="loading-box">
          <span class="loading-spinner"></span>
          <span class="loading-text">{{ loadingState.text }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { toastState, loadingState } from "../utils/feedback";
</script>

<style>
.toast {
  position: fixed;
  top: 45%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  max-width: 70vw;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.72);
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  border-radius: 10px;
  white-space: pre-line;
}

.loading-mask {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
}

.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 22px 26px;
  background: #4c4c4c; /* UI参数：加载中深灰 */
  border-radius: 12px;
}

.loading-spinner {
  width: 26px;
  height: 26px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: loading-spin 0.8s linear infinite;
}

.loading-text {
  color: #fff;
  font-size: 13px;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
}
</style>
