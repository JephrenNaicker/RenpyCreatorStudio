<template>
    <div v-if="project" class="max-w-[1400px] mx-auto p-8 px-4" data-testid="project-detail-view">
        <!-- Project Header -->
        <div class="flex justify-between items-start mb-8 pb-6 border-b border-gray-700 flex-wrap gap-6"
            data-testid="project-header">
            <div class="header-left" data-testid="project-header-left">
                <h1 class="text-4xl text-slate-50 mb-2" data-testid="project-name">{{ project.name }}</h1>
                <div class="flex items-center gap-3 flex-wrap" data-testid="project-tags-container">
                    <span v-for="(tag, index) in project.tags" :key="tag"
                        class="bg-sky-400/20 text-sky-400 px-3 py-1 rounded-full text-sm font-medium"
                        :data-testid="`project-tag-${index}`" :data-tag-value="tag">
                        {{ tag }}
                    </span>
                    <span class="text-slate-400 text-sm" data-testid="project-created-date">Created {{
                        formatDate(project.created_at) }}</span>
                </div>
            </div>

            <div class="flex gap-4 flex-wrap" data-testid="project-actions">
                <router-link :to="`/projects/${project.id}/scenes`" class="btn-primary"
                    data-testid="open-scene-editor-btn">
                    📝 Open Scene Editor
                </router-link>
                <router-link :to="`/projects/${project.id}/edit`" class="btn-secondary" data-testid="edit-project-btn">
                    ✏️ Edit Project
                </router-link>
                <button class="btn-danger" @click="deleteProject" data-testid="delete-project-btn">
                    🗑️ Delete
                </button>
            </div>
        </div>

        <!-- Project Content -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8" data-testid="project-content-grid">
            <!-- Left Column -->
            <div class="flex flex-col gap-6" data-testid="left-column">
                <!-- Project Overview -->
                <div class="card" data-testid="project-overview-card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2" data-testid="overview-title">📖
                        Project Overview</h3>
                    <p class="text-slate-300 leading-relaxed mb-6" data-testid="project-main-plot">{{ project.main_plot
                    }}</p>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4" data-testid="stats-grid">
                        <div class="flex flex-col items-center p-4 bg-white/5 rounded-lg" data-testid="stat-characters">
                            <span class="text-3xl font-bold text-sky-400" data-testid="character-count">{{
                                characterCount }}</span>
                            <span class="text-sm text-slate-400 mt-1">Characters</span>
                        </div>
                        <div class="flex flex-col items-center p-4 bg-white/5 rounded-lg" data-testid="stat-scenes">
                            <span class="text-3xl font-bold text-sky-400" data-testid="scene-count">{{ sceneCount
                            }}</span>
                            <span class="text-sm text-slate-400 mt-1">Scenes</span>
                        </div>
                        <div class="flex flex-col items-center p-4 bg-white/5 rounded-lg" data-testid="stat-dialogue">
                            <span class="text-3xl font-bold text-sky-400" data-testid="dialogue-count">{{ dialogueLines
                            }}</span>
                            <span class="text-sm text-slate-400 mt-1">Dialogue Lines</span>
                        </div>
                    </div>
                </div>

                <!-- Main Character -->
                <div v-if="mainCharacter" class="card" data-testid="main-character-card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2" data-testid="main-character-title">🌟
                        Main Character</h3>
                    <div class="flex items-center gap-4 p-4 bg-white/5 rounded-lg border-l-4"
                        :style="{ borderLeftColor: mainCharacter.color }" data-testid="main-character-container">
                        <div class="w-10 h-10 rounded-lg" :style="{ backgroundColor: mainCharacter.color }"
                            :data-testid="`main-character-color-${mainCharacter.id}`"></div>
                        <div class="flex-1" data-testid="main-character-info">
                            <h4 class="text-lg text-slate-50 mb-1" data-testid="main-character-name">{{
                                mainCharacter.name }}</h4>
                            <p v-if="mainCharacter.nickname" class="text-sky-400 text-sm italic mb-2"
                                data-testid="main-character-nickname">
                                "{{ mainCharacter.nickname }}"
                            </p>
                            <p class="text-slate-400 text-sm mb-2" data-testid="main-character-stats">
                                {{ mainCharacter.expressions?.length || 0 }} expressions •
                                {{ mainCharacter.outfits?.length || 0 }} outfits
                            </p>
                            <p class="text-slate-300 text-sm leading-relaxed" data-testid="main-character-bio">{{
                                truncateText(mainCharacter.bio, 120) }}
                            </p>
                        </div>
                        <router-link :to="`/characters/${mainCharacter.id}`" class="btn-small bg-sky-400 text-gray-900"
                            :data-testid="`view-main-character-btn-${mainCharacter.id}`">
                            View
                        </router-link>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card" data-testid="recent-activity-card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2" data-testid="activity-title">📅
                        Recent Activity</h3>
                    <div class="flex flex-col gap-4" data-testid="activity-list">
                        <div v-for="(activity, index) in recentActivity" :key="activity.id"
                            class="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors"
                            :data-testid="`activity-item-${index}`" :data-activity-id="activity.id">
                            <span class="text-xl opacity-80" data-testid="activity-icon">{{ activity.icon }}</span>
                            <div class="flex-1">
                                <p class="text-slate-50 text-sm mb-1" data-testid="activity-text">{{ activity.text }}
                                </p>
                                <span class="text-slate-400 text-xs" data-testid="activity-time">{{ activity.time
                                }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="flex flex-col gap-6" data-testid="right-column">
                <!-- Project Characters -->
                <div class="card" data-testid="project-characters-card">
                    <div class="flex justify-between items-center mb-5">
                        <h3 class="text-xl text-slate-50 flex items-center gap-2" data-testid="characters-title">👥
                            Project Characters</h3>
                        <CharacterPickerDropdown :characters="allCharacters"
                            :selected-character-ids="projectCharacterIds" button-label="Add Character"
                            :show-label="true" multi-select @create="handleCreateCharacter"
                            @update:selectedIds="handleAddCharactersToProject"
                            data-testid="character-picker-dropdown" />
                    </div>

                    <div v-if="projectCharacters.length > 0" class="flex flex-col gap-3" data-testid="characters-list">
                        <div v-for="character in projectCharacters" :key="character.id"
                            class="flex justify-between items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                            :data-testid="`character-item-${character.id}`" :data-character-id="character.id"
                            :data-character-name="character.name">
                            <div class="flex items-center gap-3">
                                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: character.color }"
                                    :data-testid="`character-color-${character.id}`"></div>
                                <span class="text-slate-50 font-medium"
                                    :data-testid="`character-name-${character.id}`">{{ character.name }}</span>
                                <span v-if="character.nickname" class="text-slate-400 text-sm italic"
                                    :data-testid="`character-nickname-${character.id}`">
                                    ({{ character.nickname }})
                                </span>
                            </div>
                            <div class="flex gap-2" :data-testid="`character-stats-${character.id}`">
                                <span class="bg-sky-400/10 text-sky-400 px-2 py-1 rounded-full text-xs"
                                    :data-testid="`character-expressions-${character.id}`">😀 {{
                                        character.expressions?.length || 0 }}</span>
                                <span class="bg-sky-400/10 text-sky-400 px-2 py-1 rounded-full text-xs"
                                    :data-testid="`character-outfits-${character.id}`">👕 {{
                                        character.outfits?.length || 0 }}</span>
                            </div>
                        </div>
                    </div>
                    <p v-else class="text-slate-500 italic text-center py-8" data-testid="no-characters-message">No
                        characters assigned to this project yet.
                    </p>
                </div>

                <!-- Quick Actions -->
                <div class="card" data-testid="quick-actions-card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2" data-testid="quick-actions-title">⚡
                        Quick Actions</h3>
                    <div class="grid grid-cols-2 gap-4" data-testid="quick-actions-grid">
                        <button @click="startDialogue"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5"
                            data-testid="quick-action-dialogue">
                            <span class="text-3xl">💬</span>
                            <span class="text-sm text-center">Write Dialogue</span>
                        </button>
                        <button @click="addScene"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5"
                            data-testid="quick-action-add-scene">
                            <span class="text-3xl">🎬</span>
                            <span class="text-sm text-center">Add Scene</span>
                        </button>
                        <button @click="exportProject"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5"
                            data-testid="quick-action-export">
                            <span class="text-3xl">📤</span>
                            <span class="text-sm text-center">Export Project</span>
                        </button>
                        <button @click="manageAssets"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5"
                            data-testid="quick-action-assets">
                            <span class="text-3xl">🖼️</span>
                            <span class="text-sm text-center">Manage Assets</span>
                        </button>
                    </div>
                </div>

                <!-- Export Status -->
                <div class="card" data-testid="export-status-card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2" data-testid="export-status-title">📊
                        Export Status</h3>
                    <div class="flex flex-col gap-3 mb-6" data-testid="export-status-list">
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                            data-testid="export-status-renpy">
                            <span class="text-slate-300 text-sm">Ren'Py Script:</span>
                            <span class="text-sm font-medium px-3 py-1 rounded-full bg-green-500/20 text-green-400"
                                data-testid="export-status-renpy-badge">Ready</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                            data-testid="export-status-characters">
                            <span class="text-slate-300 text-sm">Character Definitions:</span>
                            <span class="text-sm font-medium px-3 py-1 rounded-full bg-green-500/20 text-green-400"
                                data-testid="export-status-characters-badge">Ready</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                            data-testid="export-status-assets">
                            <span class="text-slate-300 text-sm">Asset References:</span>
                            <span class="text-sm font-medium px-3 py-1 rounded-full bg-red-500/20 text-red-400"
                                data-testid="export-status-assets-badge">Missing 3</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                            data-testid="export-status-transitions">
                            <span class="text-slate-300 text-sm">Scene Transitions:</span>
                            <span class="text-sm font-medium px-3 py-1 rounded-full bg-amber-500/20 text-amber-400"
                                data-testid="export-status-transitions-badge">Pending</span>
                        </div>
                    </div>
                    <button class="btn-primary w-full justify-center" @click="runExport"
                        data-testid="export-complete-btn">
                        🚀 Export Complete Project
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div v-else class="max-w-[1400px] mx-auto p-8 px-4" data-testid="project-not-found">
        <div class="card" data-testid="not-found-card">
            <h3 class="text-xl text-slate-50 mb-4" data-testid="not-found-title">Project Not Found</h3>
            <p class="text-slate-400 mb-4" data-testid="not-found-message">The project you're looking for doesn't exist.
            </p>
            <router-link to="/projects" class="btn-primary inline-block" data-testid="back-to-projects-btn">Back to
                Projects</router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CharacterPickerDropdown from '@/components/character/CharacterPickerDropdown.vue';
import {
    dummyProjects,
    dummyCharacters,
    dummyScenes,
    type Character,
} from '@/utils/dummyData';

const route = useRoute();
const router = useRouter();

// State management
const isLoading = ref(false);
const error = ref<string | null>(null);
const showSuccessToast = ref(false);
const successMessage = ref('');

// Find project by route param
const project = computed(() => {
    const found = dummyProjects.find(p => p.id === route.params.id);
    if (!found) return null;
    return found;
});

// Derive main character from project
const mainCharacter = computed(() => {
    const mainCharacterId = project.value?.main_character_id;
    return mainCharacterId
        ? dummyCharacters.find(c => c.id === mainCharacterId) ?? null
        : null;
});

// All characters in the project roster
const projectCharacters = computed(() => dummyCharacters);

// Scenes belonging to this project
const projectScenes = computed(() =>
    dummyScenes.filter(s => s.project_id === project.value?.id)
);

// Derived stats
const characterCount = computed(() => projectCharacters.value.length);
const sceneCount = computed(() => projectScenes.value.length);
const dialogueLines = computed(() =>
    projectScenes.value.reduce((total, scene) => total + scene.dialogue_lines.length, 0)
);

// Track project character IDs
const projectCharacterIds = computed(() =>
    projectCharacters.value.map(c => c.id)
);

// Recent activity (will come from API later)
const recentActivity = ref([
    { id: 1, icon: '💬', text: 'Added dialogue scene "First Encounter"', time: '2 hours ago' },
    { id: 2, icon: '👤', text: 'Created character "Professor Morgan"', time: '1 day ago' },
    { id: 3, icon: '🎬', text: 'Updated scene transitions in Chapter 2', time: '2 days ago' },
    { id: 4, icon: '📝', text: 'Edited main plot description', time: '3 days ago' }
]);

// All characters available
const allCharacters = ref<Character[]>([...dummyCharacters]);

// Format date helper
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

// Truncate text helper
const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Show success notification
const showSuccess = (message: string) => {
    successMessage.value = message;
    showSuccessToast.value = true;
    setTimeout(() => {
        showSuccessToast.value = false;
    }, 3000);
};

// Delete project
const deleteProject = async () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        isLoading.value = true;
        try {
            // TODO: API call to delete project
            // await api.deleteProject(project.value.id);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            console.log('Project deleted:', project.value?.id);
            showSuccess('Project deleted successfully');
            router.push('/projects');
        } catch (err) {
            console.error('Failed to delete project:', err);
            error.value = 'Failed to delete project';
        } finally {
            isLoading.value = false;
        }
    }
};

// Handle creating a new character
const handleCreateCharacter = async (characterData: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => {
    isLoading.value = true;
    try {
        // Generate a new ID (in real app, this would be from API)
        const newCharacter: Character = {
            ...characterData,
            id: `char_${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            voice_lines: characterData.voice_lines || [],
            outfits: characterData.outfits || [],
            expressions: characterData.expressions || []
        };

        // TODO: API call to save character
        // const response = await api.createCharacter(newCharacter);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Add to all characters
        allCharacters.value.push(newCharacter);

        // Auto-add to project characters
        // In a real app, you'd make an API call to associate the character with the project
        console.log('Created new character:', newCharacter);
        showSuccess(`Character "${newCharacter.name}" created and added to project!`);
    } catch (err) {
        console.error('Failed to create character:', err);
        error.value = 'Failed to create character';
    } finally {
        isLoading.value = false;
    }
};

// Handle adding characters to project
const handleAddCharactersToProject = (characterIds: string[]) => {
    // Get currently selected IDs vs previously selected IDs
    const currentIds = projectCharacters.value.map(c => c.id);
    const addedIds = characterIds.filter(id => !currentIds.includes(id));
    const removedIds = currentIds.filter(id => !characterIds.includes(id));

    // Handle additions
    if (addedIds.length > 0) {
        const addedCharacters = allCharacters.value.filter(c => addedIds.includes(c.id));
        console.log('Added characters to project:', addedCharacters);
        // In a real app, you'd make an API call to associate these characters
        showSuccess(`Added ${addedCharacters.map(c => c.name).join(', ')} to project`);
    }

    // Handle removals
    if (removedIds.length > 0) {
        const removedCharacters = allCharacters.value.filter(c => removedIds.includes(c.id));
        console.log('Removed characters from project:', removedCharacters);
        // In a real app, you'd make an API call to remove these associations
        showSuccess(`Removed ${removedCharacters.map(c => c.name).join(', ')} from project`);
    }
};

// Quick action handlers
const startDialogue = () => {
    console.log('Starting dialogue for project:', project.value?.id);
    router.push(`/projects/${project.value?.id}/dashboard`);
};

const addScene = () => {
    console.log('Adding scene to project:', project.value?.id);
    router.push(`/projects/${project.value?.id}/dashboard`);
};

const exportProject = () => {
    console.log('Exporting project:', project.value?.id);
    alert('Export feature coming soon!');
};

const manageAssets = () => {
    console.log('Managing assets for project:', project.value?.id);
    alert('Asset management coming soon!');
};

const runExport = () => {
    console.log('Running full export for project:', project.value?.id);
    alert('Export feature coming soon!');
};

// Refresh project data (for testing)
const refreshProjectData = async () => {
    isLoading.value = true;
    try {
        // TODO: API call to refresh project data
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('Project data refreshed');
    } catch (err) {
        console.error('Failed to refresh project:', err);
    } finally {
        isLoading.value = false;
    }
};

// Get export status (for testing)
const getExportStatus = computed(() => ({
    renpy: 'ready',
    characterDefinitions: 'ready',
    assetReferences: { status: 'missing', count: 3 },
    sceneTransitions: 'pending'
}));

// Lifecycle
onMounted(() => {
    console.log('Loading project:', route.params.id);

    // Validate project exists
    if (!project.value) {
        error.value = 'Project not found';
    }
});

// Watch for route changes
watch(() => route.params.id, (newId) => {
    console.log('Project ID changed:', newId);
    if (!project.value) {
        error.value = 'Project not found';
    } else {
        error.value = null;
    }
});

// Expose methods for testing in development
if (import.meta.env.DEV) {
    // @ts-ignore - Expose for testing purposes
    window.__PROJECT_DETAIL_VIEW__ = {
        refreshProjectData,
        getProjectData: () => project.value,
        getExportStatus: () => getExportStatus.value,
        addRecentActivity: (activity: { icon: string; text: string; time: string }) => {
            recentActivity.value.unshift({
                id: Date.now(),
                ...activity
            });
        }
    };
}
</script>

<style scoped>
/* Add any component-specific styles here if needed */
.error-toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
}

.success-toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    background: #10b981;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>