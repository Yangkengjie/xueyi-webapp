<template>
  <button
    class="switch"
    :class="{ 'switch--on': modelValue }"
    role="switch"
    :aria-checked="modelValue"
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span class="switch__dot"></span>
  </button>
</template>

<script setup>
defineProps({ modelValue: { type: Boolean, default: false } });
defineEmits(["update:modelValue"]);
</script>

<style scoped>
.switch {
  width: 44px;
  height: 26px;
  border-radius: var(--radius-pill);
  background: #d8d8d5;
  position: relative;
  transition: background 0.2s ease;
  flex: 0 0 auto;
}
.switch--on {
  background: var(--color-primary);
}
.switch__dot {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
}
.switch--on .switch__dot {
  transform: translateX(18px);
}
</style>
