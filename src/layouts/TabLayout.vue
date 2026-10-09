<template>
  <!-- 带底部 TabBar 的主框架：首页 / 学习 / 推演 / 我的 -->
  <div class="tab-layout">
    <main class="tab-layout__content">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <!-- 缓存 Tab 页：切换后保留滚动位置与页面状态（对应设计稿「默认回到上次浏览的位置」） -->
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </main>
    <TabBar />
  </div>
</template>

<script setup>
import TabBar from "../components/TabBar.vue";
import { onMounted, onBeforeUnmount, ref, nextTick } from "vue";

const tabBarEl = ref(null);

function applyTabBarHeight() {
  try {
    const el = document.querySelector(".tab-bar, [data-tabbar-root], nav.tab-bar, footer.tab-bar, footer[role='tablist']");
    const h = el ? el.getBoundingClientRect().height : 0;
    const final = Math.round(h || 64);
    document.documentElement.style.setProperty("--tabbar-height", final + "px");
  } catch (_) {}
}
onMounted(async () => {
  await nextTick();
  applyTabBarHeight();
  window.addEventListener("resize", applyTabBarHeight, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", applyTabBarHeight, { passive: true });
  }
  // TabBar 懒加载或动画过渡完成后再补一次
  setTimeout(applyTabBarHeight, 120);
  setTimeout(applyTabBarHeight, 600);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", applyTabBarHeight);
  if (window.visualViewport) {
    window.visualViewport.removeEventListener("resize", applyTabBarHeight);
  }
});
</script>

<style scoped>
.tab-layout__content {
  min-height: 100%;
  /* 给 TabBar 留出空间 */
  padding-bottom: calc(var(--tabbar-height) + var(--safe-bottom) + 12px);
}
</style>
