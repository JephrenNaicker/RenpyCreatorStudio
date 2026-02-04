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
    /* Allow scrolling in default mode if content overflows */
    overflow-y: auto;
}

/* Dashboard mode (full screen) */
.app-layout.dashboard-mode .main-content {
    padding: 0;
    max-width: none;
    margin: 0;
    width: 100%;
    /* Change from overflow: hidden to auto */
    overflow-y: auto;
    /* CHANGE THIS */
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    /* Important for flex children to scroll */
}

/* Optional: Add smooth scrolling */
.main-content {
    scroll-behavior: smooth;
}

/* Custom scrollbar styling */
.main-content::-webkit-scrollbar {
    width: 8px;
}

.main-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}

.main-content::-webkit-scrollbar-thumb {
    background: #475569;
    border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}
</style>