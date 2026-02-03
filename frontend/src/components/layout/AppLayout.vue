<template>
    <div class="app-layout" :class="{ 'dashboard-mode': isDashboardMode }">
        <AppHeader />
        <main class="main-content">
            <router-view />
        </main>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppHeader from './AppHeader.vue';

const route = useRoute();

const isDashboardMode = computed(() => {
    return route.meta.layout === 'dashboard';
});
</script>

<style scoped>
.app-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* Default mode (centered with padding) */
.main-content {
    flex: 1;
    padding: 2rem 1rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
}

/* Dashboard mode (full screen) */
.app-layout.dashboard-mode {
    overflow: hidden;
}

.app-layout.dashboard-mode .main-content {
    padding: 0;
    max-width: none;
    margin: 0;
    width: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
</style>