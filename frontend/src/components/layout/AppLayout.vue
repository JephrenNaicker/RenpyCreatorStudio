<template>
    <div class="app-layout">
        <AppHeader />
        <main class="main-content">
            <router-view />
        </main>
    </div>
</template>

<script setup lang="ts">
import AppHeader from './AppHeader.vue';
</script>

<style scoped>
.app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.main-content {
    flex: 1;
    padding: 2rem 1rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}
</style>