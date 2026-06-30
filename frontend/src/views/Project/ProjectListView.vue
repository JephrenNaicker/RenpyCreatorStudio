<template>
    <div id="project-list-view" class="max-w-[1100px] mx-auto px-4">
        <div id="page-header" class="flex justify-between items-center mb-8">
            <h1 id="page-title" class="text-3xl font-bold text-white">Projects</h1>

            <router-link id="new-project-btn" to="/projects/new"
                class="bg-sky-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-sky-300 transition-colors inline-flex items-center gap-2">
                <span>➕</span>
                New Project
            </router-link>
        </div>

        <div v-if="projects.length" id="project-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="project in projects" :key="project.id" :id="`project-card-${project.id}`"
                class="bg-gray-900/50 border border-gray-700 rounded-xl relative hover:border-sky-400 hover:-translate-y-1 transition-all duration-200">
                <!-- Card body (clickable area for detail view) -->
                <div id="card-main" class="p-6 cursor-pointer" @click="goToDetail(project.id)">
                    <h3 :id="`project-name-${project.id}`" class="text-xl font-semibold text-white mb-2">
                        {{ project.name }}
                    </h3>

                    <p v-if="project.main_plot" :id="`project-plot-${project.id}`"
                        class="text-gray-400 text-sm mb-3 line-clamp-2">
                        {{ truncate(project.main_plot, 100) }}
                    </p>

                    <div :id="`project-tags-${project.id}`" class="flex flex-wrap gap-1 mb-3">
                        <span v-for="(tag, tagIndex) in project.tags" :key="tag"
                            :id="`project-tag-${project.id}-${tagIndex}`"
                            class="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded">
                            {{ tag }}
                        </span>
                    </div>

                    <div :id="`project-meta-${project.id}`" class="text-xs text-gray-500 space-y-1">
                        <div :id="`project-date-${project.id}`" class="flex items-center gap-1">
                            <span>📅</span>
                            <span>{{ formatDate(project.created_at) }}</span>
                        </div>
                        <div v-if="project.main_character_id" :id="`project-main-char-${project.id}`"
                            class="flex items-center gap-1">
                            <span>👤</span>
                            <span>Main Character: {{ getMainCharacterName(project.main_character_id) }}</span>
                        </div>
                    </div>
                </div>

                <!-- 3-dot menu -->
                <div :id="`card-menu-${project.id}`" class="absolute top-3 right-3">
                    <button :id="`menu-trigger-${project.id}`"
                        class="bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-xl leading-none px-2 py-1 rounded transition-colors"
                        @click.stop="toggleMenu(project.id)">
                        ⋯
                    </button>
                    <div v-if="activeMenu === project.id" :id="`menu-dropdown-${project.id}`"
                        class="absolute top-full right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg min-w-[160px] z-10 overflow-hidden shadow-lg"
                        @click.stop>
                        <button :id="`menu-open-${project.id}`" @click="goToDetail(project.id)"
                            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors text-left">
                            📄 Open
                        </button>
                        <button :id="`menu-scenes-${project.id}`" @click="goToScenes(project.id)"
                            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors text-left">
                            ✍️ Write Scenes
                        </button>
                        <button :id="`menu-edit-${project.id}`" @click="goToEdit(project.id)"
                            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors text-left">
                            ✏️ Edit Project
                        </button>
                        <button :id="`menu-delete-${project.id}`" @click="confirmDelete(project)"
                            class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-950 hover:text-red-300 transition-colors text-left">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-else id="empty-state" class="text-center py-16 border-2 border-dashed border-gray-700 rounded-2xl">
            <h3 id="empty-title" class="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p id="empty-message" class="text-gray-400 mb-6">Create your first story project</p>

            <router-link id="empty-create-btn" to="/projects/new"
                class="bg-sky-400 text-gray-900 px-6 py-2 rounded-lg font-medium hover:bg-sky-300 transition-colors inline-block">
                Create Project
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Project, Character } from '@/utils/dummyData';
import { getAllProjects, deleteProject as deleteProjectService } from '@/services/projectService';
import { getCharacters } from '@/services/characterService';

const router = useRouter();
const projects = ref<Project[]>([]);
const characters = ref<Character[]>([]); // loaded once, used for synchronous lookups in the template
const activeMenu = ref<string | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Load projects + characters via their services
const loadProjects = async () => {
    isLoading.value = true;
    error.value = null;

    try {
        const [loadedProjects, loadedCharacters] = await Promise.all([
            getAllProjects(),
            getCharacters(),
        ]);
        projects.value = loadedProjects;
        characters.value = loadedCharacters;
    } catch (err) {
        console.error('Failed to load projects:', err);
        error.value = 'Failed to load projects';
    } finally {
        isLoading.value = false;
    }
};

// Close menu when clicking outside
const handleClickOutside = () => {
    if (activeMenu.value) {
        activeMenu.value = null;
    }
};

// Navigation functions
const goToDetail = (projectId: string) => {
    router.push(`/projects/${projectId}`);
};

const goToScenes = (projectId: string) => {
    router.push(`/projects/${projectId}/scenes`);
};

const goToEdit = (projectId: string) => {
    router.push(`/projects/${projectId}/edit`);
};

const confirmDelete = async (project: Project) => {
    if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
        isLoading.value = true;

        try {
            await deleteProjectService(project.id);

            projects.value = projects.value.filter(p => p.id !== project.id);
            console.log(`Project "${project.name}" deleted`);
        } catch (err) {
            console.error('Failed to delete project:', err);
            error.value = 'Failed to delete project';
        } finally {
            isLoading.value = false;
        }
    }
    activeMenu.value = null;
};

const toggleMenu = (projectId: string) => {
    activeMenu.value = activeMenu.value === projectId ? null : projectId;
};

// Helper functions
const getMainCharacterName = (characterId: string): string => {
    const character = characters.value.find(c => c.id === characterId);
    return character ? character.name : 'Unknown';
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const truncate = (text: string, len: number) => {
    if (!text) return '';
    return text.length > len ? text.slice(0, len) + '...' : text;
};

// Refresh projects (for testing)
const refreshProjects = async () => {
    await loadProjects();
};

// Reset menu state
const resetMenu = () => {
    activeMenu.value = null;
};

// Lifecycle
onMounted(() => {
    loadProjects();
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

// Expose for testing in development
if (import.meta.env.DEV) {
    // @ts-ignore
    window.__PROJECT_LIST_VIEW__ = {
        refreshProjects,
        resetMenu,
        getProjects: () => projects.value,
        getActiveMenu: () => activeMenu.value
    };
}
</script>

<!-- Minimal custom CSS - mostly using Tailwind utilities -->
<style scoped>
/* Only custom styles that Tailwind can't easily handle */
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Smooth transitions for card hover */
#project-grid>div {
    transition: transform 0.2s ease, border-color 0.2s ease;
}

/* Loading state (if needed) */
.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(56, 189, 248, 0.2);
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Menu dropdown animation */
#menu-dropdown-* {
    animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>