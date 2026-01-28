<template>
    <header class="app-header">
        <div class="header-content">
            <!-- Logo/Brand -->
            <div class="brand">
                <router-link to="/" class="logo-link">
                    <span class="logo-icon">🎮</span>
                    <span class="logo-text">Ren'Py Creator</span>
                </router-link>
            </div>

            <!-- Navigation -->
            <nav class="nav-menu">
                <router-link to="/" class="nav-item">
                    <span class="nav-icon">🏠</span>
                    <span class="nav-text">Home</span>
                </router-link>

                <router-link to="/projects" class="nav-item">
                    <span class="nav-icon">📁</span>
                    <span class="nav-text">Projects</span>
                </router-link>

                <!-- Characters Dropdown -->
                <div class="dropdown" :class="{ open: isCharactersOpen }">
                    <button class="dropdown-toggle nav-item" @click="toggleCharacters">
                        <span class="nav-icon">👤</span>
                        <span class="nav-text">Characters</span>
                        <span class="dropdown-arrow">{{ isCharactersOpen ? '▲' : '▼' }}</span>
                    </button>

                    <div v-if="isCharactersOpen" class="dropdown-menu">
                        <router-link to="/characters" class="dropdown-item" @click="closeDropdown">
                            <span class="dropdown-icon">📋</span>
                            View All Characters
                        </router-link>
                        <router-link to="/characters/new" class="dropdown-item" @click="closeDropdown">
                            <span class="dropdown-icon">➕</span>
                            Create New Character
                        </router-link>
                        <div class="dropdown-divider"></div>
                        <router-link to="/characters/recent" class="dropdown-item" @click="closeDropdown">
                            <span class="dropdown-icon">🕒</span>
                            Recently Edited
                        </router-link>
                    </div>
                </div>

                <router-link to="/dialogue" class="nav-item">
                    <span class="nav-icon">💬</span>
                    <span class="nav-text">Dialogue</span>
                </router-link>

                <router-link to="/export" class="nav-item">
                    <span class="nav-icon">📤</span>
                    <span class="nav-text">Export</span>
                </router-link>
            </nav>

            <!-- User/Actions -->
            <div class="header-actions">
                <button class="icon-button" title="Settings">
                    ⚙️
                </button>
                <button class="icon-button" title="Help">
                    ❓
                </button>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const isCharactersOpen = ref(false);

const toggleCharacters = () => {
    isCharactersOpen.value = !isCharactersOpen.value;
};

const closeDropdown = () => {
    isCharactersOpen.value = false;
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
        isCharactersOpen.value = false;
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.app-header {
    background: #020617;
    border-bottom: 1px solid #334155;
    position: sticky;
    top: 0;
    z-index: 1000;
    backdrop-filter: blur(10px);
}

.header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
}

.brand {
    display: flex;
    align-items: center;
}

.logo-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: #f8fafc;
    font-weight: bold;
    font-size: 1.25rem;
}

.logo-icon {
    font-size: 1.5rem;
}

.logo-text {
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.nav-menu {
    display: flex;
    gap: 0.5rem;
    flex: 1;
    justify-content: center;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    color: #cbd5e1;
    transition: all 0.2s ease;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.95rem;
}

.nav-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
}

.router-link-exact-active {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
}

.nav-icon {
    font-size: 1.1rem;
}

/* Dropdown Styles */
.dropdown {
    position: relative;
}

.dropdown-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.dropdown-arrow {
    font-size: 0.8rem;
    margin-left: 0.25rem;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.5rem;
    min-width: 220px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    padding: 0.5rem;
    z-index: 1000;
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    text-decoration: none;
    color: #cbd5e1;
    transition: all 0.2s ease;
}

.dropdown-item:hover {
    background: rgba(56, 189, 248, 0.1);
    color: #f8fafc;
}

.dropdown-icon {
    font-size: 1rem;
    opacity: 0.8;
}

.dropdown-divider {
    height: 1px;
    background: #334155;
    margin: 0.5rem 0;
}

/* Header Actions */
.header-actions {
    display: flex;
    gap: 0.5rem;
}

.icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #cbd5e1;
    cursor: pointer;
    font-size: 1.2rem;
    transition: all 0.2s ease;
}

.icon-button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
}
</style>