<template>
  <AppLayout />
</template>

<script setup lang="ts">
import AppLayout from './components/layout/AppLayout.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  line-height: 1.5;
}

#app {
  min-height: 100vh;
}
</style>