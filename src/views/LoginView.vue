<template>
  <div class="login" role="main" aria-labelledby="login-title">
    <div class="login__hero">
      <div class="login__brand" aria-hidden="true">
        <span class="login__logo">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#c0392b">
            <path d="M12 3c3 2 5 4.5 5 8a5 5 0 0 1-10 0c0-3.5 2-6 5-8z" />
          </svg>
        </span>
        <p class="login__app">学医智用</p>
      </div>
      <h1 id="login-title" class="login__title">欢迎来到学医智用</h1>
      <p class="login__slogan">开启你的中医智慧学习之旅</p>
    </div>

    <div class="login__sheet">
      <p class="login__hint">当前为演示版本，学习数据仅保存在本机浏览器中</p>
      <button
        class="login__btn-primary"
        :disabled="loading"
        :aria-busy="loading"
        aria-label="进入学医智用体验版本"
        @click="onEnter"
      >
        <span v-if="loading" class="login__spinner" aria-hidden="true"></span>
        {{ loading ? '登录中…' : '进入体验' }}
      </button>

      <div class="login__terms">
        <button type="button" class="login__link" aria-label="查看用户协议（内容完善中）" @click="showComingSoon('用户协议')">
          《用户协议》
        </button>
        <span class="login__divider">·</span>
        <button type="button" class="login__link" aria-label="查看隐私政策（内容完善中）" @click="showComingSoon('隐私政策')">
          《隐私政策》
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="toast-fade">
        <div v-if="loginError" class="login__error-toast" role="alert" aria-live="assertive">
          {{ loginError }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import * as userApi from "../api/user";
import { toast } from "../utils/feedback";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const loginError = ref("");

let errTimer = null;
function showError(msg) {
  loginError.value = msg || "登录失败，请稍后再试";
  clearTimeout(errTimer);
  errTimer = setTimeout(() => (loginError.value = ""), 2200);
}

function showComingSoon(name) {
  toast(`${name}内容完善中`);
}

async function onEnter() {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await userApi.login({ demo: true });
    if (res?.code === 200 || res?.token || res?.user) {
      toast("欢迎回来");
      const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "";
      setTimeout(() => {
        if (redirect) {
          try { router.replace(redirect); } catch (_) { router.replace({ name: "home" }); }
        } else {
          router.replace({ name: "home" });
        }
      }, 350);
    } else {
      showError(res?.msg || "登录失败，请稍后再试");
    }
  } catch (e) {
    showError(e?.message || "登录失败，请检查网络");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  /* 已有登录态时，路由守卫已 redirect，这里只做清理 */
});
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at 50% 28%, #ffffff 0%, #eef5f3 72%);
  padding: calc(36px + var(--safe-top)) 24px calc(36px + var(--safe-bottom));
  box-sizing: border-box;
  overflow-x: hidden;
}

.login__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  margin-top: 24px;
  padding-bottom: 20px;
  flex: 1;
  justify-content: center;
}

.login__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px 8px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(31, 92, 56, 0.12);
  box-shadow: 0 8px 24px rgba(31, 92, 56, 0.06);
}

.login__logo {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f6e3e0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.login__app {
  font-family: var(--font-family-serif);
  font-weight: 700;
  font-size: 15px;
  color: var(--color-text);
  letter-spacing: 0.5px;
}

.login__title {
  font-family: var(--font-family-serif);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin: 14px 0 0;
  letter-spacing: 1px;
}

.login__slogan {
  font-family: var(--font-family-serif);
  font-size: 15px;
  line-height: 1.9;
  color: var(--color-text-secondary);
  margin: 0;
}

.login__sheet {
  width: 100%;
  max-width: 430px;
  align-self: center;
  background: var(--color-card);
  border: 1px solid var(--color-divider);
  border-radius: 20px;
  padding: 22px 20px 20px;
  box-shadow: 0 18px 40px rgba(31, 92, 56, 0.08);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login__hint {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-caption);
  text-align: center;
  line-height: 1.7;
}

.login__btn-primary {
  position: relative;
  width: 100%;
  min-height: 48px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: linear-gradient(180deg, #2e7d49 0%, #1f5c38 100%);
  color: #fff;
  box-shadow: 0 8px 20px rgba(31, 92, 56, 0.24);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.15s ease, transform 0.1s ease;
}

.login__btn-primary:hover,
.login__btn-primary:focus-visible {
  opacity: 0.96;
  outline: none;
  box-shadow: 0 0 0 3px rgba(31, 92, 56, 0.12), 0 8px 20px rgba(31, 92, 56, 0.24);
}

.login__btn-primary:active {
  transform: translateY(1px);
  opacity: 0.92;
}

.login__btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login__spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  animation: login-spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes login-spin {
  to { transform: rotate(360deg); }
}

.login__terms {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-caption);
  flex-wrap: wrap;
}

.login__link {
  padding: 2px 0;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 2px;
  background: transparent;
  border: 0;
}

.login__link:focus-visible {
  outline: 2px solid rgba(31, 92, 56, 0.25);
  outline-offset: 2px;
  border-radius: 4px;
}

.login__divider {
  opacity: 0.6;
}

.login__error-toast {
  position: fixed;
  left: 50%;
  bottom: calc(40px + var(--safe-bottom));
  transform: translateX(-50%);
  background: rgba(31, 41, 55, 0.94);
  color: #fff;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 13px;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-width: calc(100vw - 48px);
}

/* ------------------- 响应式 ------------------- */
@media (max-width: 375px) {
  .login {
    padding-left: 18px;
    padding-right: 18px;
  }
  .login__title {
    font-size: 24px;
  }
  .login__sheet {
    padding: 18px 16px 16px;
    border-radius: 18px;
  }
}

@media (max-width: 320px) {
  .login__hero {
    gap: 12px;
    margin-top: 10px;
  }
  .login__title {
    font-size: 22px;
  }
  .login__slogan {
    font-size: 13px;
  }
}

@media (min-width: 900px) {
  .login {
    padding: calc(8vh + var(--safe-top)) 10vw calc(8vh + var(--safe-bottom));
  }
  .login__sheet {
    max-width: 420px;
  }
  .login__title {
    font-size: 32px;
  }
}
</style>
