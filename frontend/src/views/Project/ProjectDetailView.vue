<template>
    <div v-if="project" class="max-w-[1400px] mx-auto p-8 px-4" id="project-detail-view">
        <!-- Project Header -->
        <div class="flex justify-between items-start mb-8 pb-6 border-b border-gray-700 flex-wrap gap-6"
            id="project-header">
            <div class="header-left" id="project-header-left">
                <h1 class="text-4xl text-slate-50 mb-2" :id="`project-name-${project.id}`">{{ project.name }}</h1>
                <div class="flex items-center gap-3 flex-wrap" id="project-tags-container">
                    <span v-for="(tag, index) in project.tags" :key="tag"
                        class="bg-sky-400/20 text-sky-400 px-3 py-1 rounded-full text-sm font-medium"
                        :id="`project-tag-${index}`">
                        {{ tag }}
                    </span>
                    <span class="text-slate-400 text-sm" id="project-created-date">Created {{
                        formatDate(project.created_at) }}</span>
                </div>
            </div>

            <div class="flex gap-4 flex-wrap" id="project-actions">
                <router-link :to="`/projects/${project.id}/scenes`" class="btn-primary" id="open-scene-editor-btn">
                    📝 Open Scene Editor
                </router-link>
                <router-link :to="`/projects/${project.id}/edit`" class="btn-secondary" id="edit-project-btn">
                    ✏️ Edit Project
                </router-link>
                <button class="btn-danger" @click="deleteProject" id="delete-project-btn">
                    🗑️ Delete
                </button>
            </div>
        </div>

        <!-- Project Content -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8" id="project-content-grid">
            <!-- Left Column -->
            <div class="flex flex-col gap-6" id="left-column">
                <!-- Project Overview -->
                <div class="card" id="project-overview-card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2" id="overview-title">📖
                        Project Overview</h3>
                    <p class="text-slate-300 leading-relaxed mb-6" id="project-main-plot">{{ project.main_plot
                        }}</p>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4" id="stats-grid">
                        <div class="flex flex-col items-center p-4 bg-white/5 rounded-lg" id="stat-characters">
                            <span class="text-3xl font-bold text-sky-400" id="character-count">{{
                                projectCharacters.length }}</span>
                            <span class="text-sm text-slate-400 mt-1">Characters</span>
                        </div>
                        <div class="flex flex-col items-center p-4 bg-white/5 rounded-lg" id="stat-scenes">
                            <span class="text-3xl font-bold text-sky-400" id="scene-count">{{ projectScenes.length
                                }}</span>
                            <span class="text-sm text-slate-400 mt-1">Scenes</span>
                        </div>
                        <div class="flex flex-col items-center p-4 bg-white/5 rounded-lg" id="stat-dialogue">
                            <span class="text-3xl font-bold text-sky-400" id="dialogue-count">{{ totalDialogueLines
                                }}</span>
                            <span class="text-sm text-slate-400 mt-1">Dialogue Lines</span>
                        </div>
                    </div>
                </div>

                <!-- Main Character -->
                <div v-if="mainCharacter" class="card" id="main-character-card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2" id="main-character-title">🌟
                        Main Character</h3>
                    <div class="flex items-center gap-4 p-4 bg-white/5 rounded-lg border-l-4"
                        :style="{ borderLeftColor: mainCharacter.color }"
                        :id="`main-character-container-${mainCharacter.id}`">
                        <div class="w-10 h-10 rounded-lg" :style="{ backgroundColor: mainCharacter.color }"
                            :id="`main-character-color-${mainCharacter.id}`"></div>
                        <div class="flex-1" id="main-character-info">
                            <h4 class="text-lg text-slate-50 mb-1" :id="`main-character-name-${mainCharacter.id}`">{{
                                mainCharacter.name }}</h4>
                            <p v-if="mainCharacter.nickname" class="text-sky-400 text-sm italic mb-2"
                                :id="`main-character-nickname-${mainCharacter.id}`">
                                "{{ mainCharacter.nickname }}"
                            </p>
                            <p class="text-slate-400 text-sm mb-2" :id="`main-character-stats-${mainCharacter.id}`">
                                {{ mainCharacter.expressions?.length || 0 }} expressions •
                                {{ mainCharacter.outfits?.length || 0 }} outfits
                            </p>
                            <p class="text-slate-300 text-sm leading-relaxed"
                                :id="`main-character-bio-${mainCharacter.id}`">{{
                                    truncateText(mainCharacter.bio, 120) }}
                            </p>
                        </div>
                        <router-link :to="`/characters/${mainCharacter.id}`" class="btn-small bg-sky-400 text-gray-900"
                            :id="`view-main-character-btn-${mainCharacter.id}`">
                            View
                        </router-link>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card" id="recent-activity-card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2" id="activity-title">📅
                        Recent Activity</h3>
                    <div class="flex flex-col gap-4" id="activity-list">
                        <div v-for="(activity, index) in recentActivity" :key="activity.id"
                            class="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors"
                            :id="`activity-item-${index}`">
                            <span class="text-xl opacity-80" :id="`activity-icon-${index}`">{{ activity.icon }}</span>
                            <div class="flex-1">
                                <p class="text-slate-50 text-sm mb-1" :id="`activity-text-${index}`">{{ activity.text }}
                                </p>
                                <span class="text-slate-400 text-xs" :id="`activity-time-${index}`">{{ activity.time
                                    }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="flex flex-col gap-6" id="right-column">
                <!-- Project Characters -->
                <div class="card" id="project-characters-card">
                    <div class="flex justify-between items-center mb-5">
                        <h3 class="text-xl text-slate-50 flex items-center gap-2" id="characters-title">👥
                            Project Characters</h3>
                        <CharacterPickerDropdown :characters="allAvailableCharacters"
                            :selected-character-ids="projectCharacterIds" button-label="Add Character"
                            :show-label="true" multi-select @create="handleCreateCharacter"
                            @update:selectedIds="handleAddCharactersToProject" id="character-picker-dropdown" />
                    </div>

                    <div v-if="projectCharacters.length > 0" class="flex flex-col gap-3" id="characters-list">
                        <div v-for="character in projectCharacters" :key="character.id"
                            class="flex justify-between items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors group"
                            :id="`character-item-${character.id}`">
                            <div class="flex items-center gap-3">
                                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: character.color }"
                                    :id="`character-color-${character.id}`"></div>
                                <span class="text-slate-50 font-medium" :id="`character-name-${character.id}`">{{
                                    character.name }}</span>
                                <span v-if="character.nickname" class="text-slate-400 text-sm italic"
                                    :id="`character-nickname-${character.id}`">
                                    ({{ character.nickname }})
                                </span>
                            </div>
                            <div class="flex gap-2 items-center" :id="`character-stats-${character.id}`">
                                <span class="bg-sky-400/10 text-sky-400 px-2 py-1 rounded-full text-xs"
                                    :id="`character-expressions-${character.id}`">😀 {{
                                        character.expressions?.length || 0 }}</span>
                                <span class="bg-sky-400/10 text-sky-400 px-2 py-1 rounded-full text-xs"
                                    :id="`character-outfits-${character.id}`">👕 {{
                                        character.outfits?.length || 0 }}</span>
                                <button @click="removeCharacterFromProject(character.id)"
                                    class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all ml-2"
                                    :id="`remove-character-btn-${character.id}`" title="Remove from project">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                    <p v-else class="text-slate-500 italic text-center py-8" id="no-characters-message">No
                        characters assigned to this project yet.
                    </p>
                </div>

                <!-- Quick Actions -->
                <div class="card" id="quick-actions-card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2" id="quick-actions-title">⚡
                        Quick Actions</h3>
                    <div class="grid grid-cols-2 gap-4" id="quick-actions-grid">
                        <button @click="startDialogue"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5"
                            id="quick-action-dialogue">
                            <span class="text-3xl">💬</span>
                            <span class="text-sm text-center">Write Dialogue</span>
                        </button>
                        <button @click="addScene"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5"
                            id="quick-action-add-scene">
                            <span class="text-3xl">🎬</span>
                            <span class="text-sm text-center">Add Scene</span>
                        </button>
                        <button @click="exportProject"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5"
                            id="quick-action-export">
                            <span class="text-3xl">📤</span>
                            <span class="text-sm text-center">Export Project</span>
                        </button>
                        <button @click="manageAssets"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5"
                            id="quick-action-assets">
                            <span class="text-3xl">🖼️</span>
                            <span class="text-sm text-center">Manage Assets</span>
                        </button>
                    </div>
                </div>

                <!-- Export Status -->
                <div class="card" id="export-status-card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2" id="export-status-title">📊
                        Export Status</h3>
                    <div class="flex flex-col gap-3 mb-6" id="export-status-list">
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                            id="export-status-renpy">
                            <span class="text-slate-300 text-sm">Ren'Py Script:</span>
                            <span class="text-sm font-medium px-3 py-1 rounded-full bg-green-500/20 text-green-400"
                                id="export-status-renpy-badge">Ready</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                            id="export-status-characters">
                            <span class="text-slate-300 text-sm">Character Definitions:</span>
                            <span class="text-sm font-medium px-3 py-1 rounded-full bg-green-500/20 text-green-400"
                                id="export-status-characters-badge">Ready</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                            id="export-status-assets">
                            <span class="text-slate-300 text-sm">Asset References:</span>
                            <span class="text-sm font-medium px-3 py-1 rounded-full bg-red-500/20 text-red-400"
                                id="export-status-assets-badge">Missing 3</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg"
                            id="export-status-transitions">
                            <span class="text-slate-300 text-sm">Scene Transitions:</span>
                            <span class="text-sm font-medium px-3 py-1 rounded-full bg-amber-500/20 text-amber-400"
                                id="export-status-transitions-badge">Pending</span>
                        </div>
                    </div>
                    <button class="btn-primary w-full justify-center" @click="runExport" id="export-complete-btn">
                        🚀 Export Complete Project
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Warning Modal for Character Removal -->
    <div v-if="showRemovalWarning" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        id="removal-warning-modal" @click.self="closeRemovalWarning">
        <div class="bg-gray-800 rounded-xl max-w-2xl w-full mx-4 shadow-2xl" id="removal-warning-container">
            <div class="p-6 border-b border-gray-700" id="removal-warning-header">
                <div class="flex items-center gap-3">
                    <span class="text-4xl">⚠️</span>
                    <h3 class="text-2xl text-slate-50">Remove Character from Project</h3>
                </div>
            </div>

            <div class="p-6" id="removal-warning-content">
                <p class="text-slate-300 mb-4" id="removal-warning-message">
                    Are you sure you want to remove <strong class="text-sky-400">{{ characterToRemove?.name }}</strong>
                    from this project?
                </p>

                <!-- Warning about scenes and dialogue -->
                <div v-if="characterUsageInfo.scenesWithCharacter.length > 0"
                    class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6" id="usage-warning-container">
                    <p class="text-amber-400 font-medium mb-2 flex items-center gap-2" id="usage-warning-title">
                        <span>⚠️</span> This character is used in:
                    </p>
                    <ul class="text-slate-300 text-sm space-y-1 ml-6 list-disc" id="usage-list">
                        <li :id="`usage-scene-${scene.id}`" v-for="scene in characterUsageInfo.scenesWithCharacter">
                            <strong>{{ scene.name }}</strong> - {{ scene.dialogue_count }} dialogue line{{
                                scene.dialogue_count !== 1 ? 's' : '' }}
                        </li>
                    </ul>
                    <p class="text-slate-400 text-sm mt-3" id="total-dialogue-count">
                        Total: {{ characterUsageInfo.totalDialogueLines }} dialogue lines across {{
                            characterUsageInfo.scenesWithCharacter.length }} scene{{
                            characterUsageInfo.scenesWithCharacter.length !== 1 ? 's' : '' }}
                    </p>
                </div>

                <!-- Resolution options -->
                <div class="space-y-4" id="resolution-options">
                    <p class="text-slate-300 font-medium mb-2">What would you like to do with the dialogue lines?</p>

                    <label
                        class="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                        id="option-keep-placeholder">
                        <input type="radio" v-model="removalOption" value="keep_as_placeholder" class="mt-1" />
                        <div>
                            <div class="text-slate-50 font-medium">Keep as "Removed Character" placeholder</div>
                            <div class="text-slate-400 text-sm">Dialogue lines will show "[Removed: {{
                                characterToRemove?.name
                                }}]" and can be reassigned later</div>
                        </div>
                    </label>

                    <label
                        class="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                        id="option-swap">
                        <input type="radio" v-model="removalOption" value="swap" class="mt-1" />
                        <div class="flex-1">
                            <div class="text-slate-50 font-medium">Replace with another character</div>
                            <div class="text-slate-400 text-sm mb-2">Automatically reassign all dialogue to a different
                                character</div>
                            <select v-if="removalOption === 'swap'" v-model="selectedSwapCharacterId"
                                class="mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-slate-50"
                                id="swap-character-select">
                                <option value="">Select a character...</option>
                                <option v-for="char in availableSwapCharacters" :key="char.id" :value="char.id">
                                    {{ char.name }} ({{ char.nickname || 'no nickname' }})
                                </option>
                            </select>
                        </div>
                    </label>

                    <label
                        class="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                        id="option-delete">
                        <input type="radio" v-model="removalOption" value="delete" class="mt-1" />
                        <div>
                            <div class="text-slate-50 font-medium text-red-400">Delete all dialogue lines</div>
                            <div class="text-slate-400 text-sm">⚠️ This action cannot be undone. All dialogue for this
                                character will be permanently deleted.</div>
                        </div>
                    </label>
                </div>
            </div>

            <div class="p-6 border-t border-gray-700 flex justify-end gap-3" id="removal-warning-actions">
                <button @click="closeRemovalWarning"
                    class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-slate-300 rounded-lg transition-colors"
                    id="cancel-removal-btn">
                    Cancel
                </button>
                <button @click="confirmRemoveCharacter"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    :disabled="removalOption === 'swap' && !selectedSwapCharacterId"
                    :class="{ 'opacity-50 cursor-not-allowed': removalOption === 'swap' && !selectedSwapCharacterId }"
                    id="confirm-removal-btn">
                    Confirm Removal
                </button>
            </div>
        </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showSuccessToast"
        class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in"
        id="success-toast">
        {{ successMessage }}
    </div>

    <!-- Error Toast -->
    <div v-if="error"
        class="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in"
        id="error-toast">
        {{ error }}
        <button @click="error = null" class="ml-4 hover:text-gray-200">✕</button>
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

// Removal warning state
const showRemovalWarning = ref(false);
const characterToRemove = ref<Character | null>(null);
const removalOption = ref<'keep_as_placeholder' | 'swap' | 'delete'>('keep_as_placeholder');
const selectedSwapCharacterId = ref<string>('');

// Project data - reactive arrays that can be modified
const projectCharacters = ref<Character[]>([]);
const projectCharacterIds = ref<string[]>([]);

// Find project by route param
const project = computed(() => {
    const found = dummyProjects.find(p => p.id === route.params.id);
    return found || null;
});

// Derive main character from project
const mainCharacter = computed(() => {
    const mainCharacterId = project.value?.main_character_id;
    return mainCharacterId
        ? dummyCharacters.find(c => c.id === mainCharacterId) ?? null
        : null;
});

// All characters available in the system (not filtered by project)
const allAvailableCharacters = computed(() => dummyCharacters);

// Scenes belonging to this project
const projectScenes = computed(() =>
    dummyScenes.filter(s => s.project_id === project.value?.id)
);

// Total dialogue lines
const totalDialogueLines = computed(() =>
    projectScenes.value.reduce((total, scene) => total + scene.dialogue_lines.length, 0)
);

// Get character usage info across scenes
const getCharacterUsageInfo = (characterId: string) => {
    const scenesWithCharacter: { id: string; name: string; dialogue_count: number }[] = [];
    let totalDialogue = 0;

    projectScenes.value.forEach(scene => {
        const dialogueLinesForChar = scene.dialogue_lines.filter(line => line.character?.id === characterId);
        if (dialogueLinesForChar.length > 0) {
            scenesWithCharacter.push({
                id: scene.id,
                name: scene.name,
                dialogue_count: dialogueLinesForChar.length
            });
            totalDialogue += dialogueLinesForChar.length;
        }
    });

    return {
        scenesWithCharacter,
        totalDialogueLines: totalDialogue,
        hasUsage: scenesWithCharacter.length > 0
    };
};

// Character usage info for warning modal
const characterUsageInfo = ref<{
    scenesWithCharacter: { id: string; name: string; dialogue_count: number }[];
    totalDialogueLines: number;
    hasUsage: boolean;
}>({
    scenesWithCharacter: [],
    totalDialogueLines: 0,
    hasUsage: false
});

// Available characters for swapping (all characters except the one being removed)
const availableSwapCharacters = computed(() =>
    dummyCharacters.filter(c => c.id !== characterToRemove.value?.id)
);

// Recent activity
const recentActivity = ref([
    { id: 1, icon: '💬', text: 'Added dialogue scene "First Encounter"', time: '2 hours ago' },
    { id: 2, icon: '👤', text: 'Created character "Professor Morgan"', time: '1 day ago' },
    { id: 3, icon: '🎬', text: 'Updated scene transitions in Chapter 2', time: '2 days ago' },
    { id: 4, icon: '📝', text: 'Edited main plot description', time: '3 days ago' }
]);

// Load project data (for now, just use all characters)
// TODO: Replace with API call to get project-specific characters
const loadProjectData = () => {
    // For demo purposes, we'll use all characters
    // In a real app, you'd filter by project.character_ids
    projectCharacters.value = [...dummyCharacters];
    projectCharacterIds.value = dummyCharacters.map(c => c.id);
};

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

// Remove character from project with warning
const removeCharacterFromProject = async (characterId: string) => {
    const character = projectCharacters.value.find(c => c.id === characterId);
    if (!character) return;

    // Check if character is used in any scenes
    const usageInfo = getCharacterUsageInfo(characterId);
    characterUsageInfo.value = usageInfo;

    // If character has no usage, remove directly without warning
    if (!usageInfo.hasUsage) {
        await performCharacterRemoval(characterId);
        return;
    }

    // Show warning modal with usage info
    characterToRemove.value = character;
    removalOption.value = 'keep_as_placeholder';
    selectedSwapCharacterId.value = '';
    showRemovalWarning.value = true;
};

// Perform the actual removal based on selected option
const performCharacterRemoval = async (characterId: string, swapWithId?: string) => {
    isLoading.value = true;
    try {
        const removedCharacter = projectCharacters.value.find(c => c.id === characterId);

        // Handle dialogue lines based on option
        if (characterUsageInfo.value.hasUsage && removalOption.value !== 'keep_as_placeholder') {
            if (removalOption.value === 'swap' && swapWithId) {
                // Replace character in all dialogue lines
                const newCharacter = dummyCharacters.find(c => c.id === swapWithId);
                projectScenes.value.forEach(scene => {
                    scene.dialogue_lines = scene.dialogue_lines.map(line => {
                        if (line.character?.id === characterId) {
                            return {
                                ...line,
                                character: newCharacter ? {
                                    id: newCharacter.id,
                                    name: newCharacter.name,
                                    color: newCharacter.color
                                } : line.character
                            };
                        }
                        return line;
                    });
                });
                showSuccess(`Character "${removedCharacter?.name}" replaced with "${newCharacter?.name}"`);
            } else if (removalOption.value === 'delete') {
                // Delete all dialogue lines for this character
                projectScenes.value.forEach(scene => {
                    scene.dialogue_lines = scene.dialogue_lines.filter(
                        line => line.character?.id !== characterId
                    );
                });
                showSuccess(`Character "${removedCharacter?.name}" removed and all dialogue lines deleted`);
            }
        } else if (characterUsageInfo.value.hasUsage && removalOption.value === 'keep_as_placeholder') {
            // Keep as placeholder - mark character as removed in dialogue
            projectScenes.value.forEach(scene => {
                scene.dialogue_lines = scene.dialogue_lines.map(line => {
                    if (line.character?.id === characterId) {
                        return {
                            ...line,
                            character: {
                                ...line.character,
                                name: `[Removed: ${line.character.name}]`,
                                color: '#6B7280'
                            }
                        };
                    }
                    return line;
                });
            });
            showSuccess(`Character "${removedCharacter?.name}" removed from project (dialogue preserved as placeholder)`);
        }

        // Remove character from project characters list
        projectCharacters.value = projectCharacters.value.filter(c => c.id !== characterId);
        projectCharacterIds.value = projectCharacterIds.value.filter(id => id !== characterId);

        // Close modal
        closeRemovalWarning();
    } catch (err) {
        console.error('Failed to remove character:', err);
        error.value = 'Failed to remove character from project';
    } finally {
        isLoading.value = false;
    }
};

// Confirm removal from warning modal
const confirmRemoveCharacter = async () => {
    if (!characterToRemove.value) return;

    if (removalOption.value === 'swap' && !selectedSwapCharacterId.value) {
        error.value = 'Please select a character to swap with';
        return;
    }

    await performCharacterRemoval(
        characterToRemove.value.id,
        removalOption.value === 'swap' ? selectedSwapCharacterId.value : undefined
    );
};

// Close removal warning modal
const closeRemovalWarning = () => {
    showRemovalWarning.value = false;
    characterToRemove.value = null;
    removalOption.value = 'keep_as_placeholder';
    selectedSwapCharacterId.value = '';
};

// Handle adding characters to project
const handleAddCharactersToProject = (characterIds: string[]) => {
    const currentIds = projectCharacterIds.value;
    const addedIds = characterIds.filter(id => !currentIds.includes(id));
    const removedIds = currentIds.filter(id => !characterIds.includes(id));

    // Handle additions
    if (addedIds.length > 0) {
        const addedCharacters = allAvailableCharacters.value.filter(c => addedIds.includes(c.id));
        // Add to project
        projectCharacterIds.value = [...currentIds, ...addedIds];
        projectCharacters.value = allAvailableCharacters.value.filter(c =>
            projectCharacterIds.value.includes(c.id)
        );
        showSuccess(`Added ${addedCharacters.map(c => c.name).join(', ')} to project`);
    }

    // Handle removals
    if (removedIds.length > 0) {
        // Process removals one by one to show proper warnings
        removedIds.forEach(id => {
            removeCharacterFromProject(id);
        });
    }
};

// Handle creating a new character
const handleCreateCharacter = async (characterData: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => {
    isLoading.value = true;
    try {
        const newCharacter: Character = {
            ...characterData,
            id: `char_${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            voice_lines: characterData.voice_lines || [],
            outfits: characterData.outfits || [],
            expressions: characterData.expressions || []
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // Add to all characters
        dummyCharacters.push(newCharacter);

        // Auto-add to project characters
        projectCharacters.value.push(newCharacter);
        projectCharacterIds.value.push(newCharacter.id);

        showSuccess(`Character "${newCharacter.name}" created and added to project!`);
    } catch (err) {
        console.error('Failed to create character:', err);
        error.value = 'Failed to create character';
    } finally {
        isLoading.value = false;
    }
};

// Delete project
const deleteProject = async () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        isLoading.value = true;
        try {
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

// Quick action handlers
const startDialogue = () => {
    router.push(`/projects/${project.value?.id}/dashboard`);
};

const addScene = () => {
    router.push(`/projects/${project.value?.id}/dashboard`);
};

const exportProject = () => {
    alert('Export feature coming soon!');
};

const manageAssets = () => {
    alert('Asset management coming soon!');
};

const runExport = () => {
    alert('Export feature coming soon!');
};

// Lifecycle
onMounted(() => {
    console.log('Loading project:', route.params.id);
    loadProjectData();

    if (!project.value) {
        error.value = 'Project not found';
    }
});

// Watch for route changes
watch(() => route.params.id, () => {
    console.log('Project ID changed:', route.params.id);
    loadProjectData();
    if (!project.value) {
        error.value = 'Project not found';
    } else {
        error.value = null;
    }
});
</script>

<style scoped>
@keyframes slide-in {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.animate-slide-in {
    animation: slide-in 0.3s ease-out;
}
</style>