<template>
  <RouterView />
  <FeedbackHost />
  <AchievementToast />
  <FloatingSprite />
</template>

<script setup>
import FeedbackHost from "./components/FeedbackHost.vue";
import AchievementToast from "./components/AchievementToast.vue";
import FloatingSprite from "./components/FloatingSprite.vue";
</script>
