<template>
    <div id="scene-editor-layout" class="flex h-screen bg-gray-950">
        <!-- Left Panel -->
        <ProjectSidebar :id="`project-sidebar-${route.params.id}`" :characters="projectCharacters" :scenes="scenes"
            :selected-scene-id="currentScene?.id ?? null" :all-characters="allCharacters"
            :project-id="String(route.params.id)" :dirty-scene-ids="dirtyScenes"
            @select-character="handleSelectCharacter" @remove-character="openRemoveCharacterModal"
            @add-character="addCharacterToProject" @add-characters="handleAddCharactersToProject"
            @select-scene="selectScene" @add-scene="handleAddScene" @delete-scene="handleDeleteScene"
            @update-scene="handleUpdateScene" @create-character="handleCreateCharacter" />

        <!-- Main Panel -->
        <main id="workspace-main" class="flex-1 flex flex-col overflow-hidden">
            <div id="workspace-header" class="border-b border-gray-800 bg-gray-900/50 p-4">
                <div class="flex items-center justify-between flex-wrap gap-4">
                    <h2 id="workspace-title" class="text-xl font-semibold text-white">
                        {{ currentProject?.name ?? 'Scene Editor' }}
                        <span v-if="currentScene" :id="`scene-badge-${currentScene.id}`"
                            class="ml-2 text-sm bg-sky-400/20 text-sky-400 px-2 py-1 rounded">
                            🎬 {{ currentScene.name }}
                        </span>
                    </h2>

                    <div class="flex items-center gap-2" id="workspace-actions">
                        <button :id="currentScene ? `save-scene-${currentScene.id}` : 'save-scene-disabled'"
                            class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm"
                            @click="saveScene">
                            💾 Save Scene
                        </button>
                        <button id="export-scene-btn"
                            class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm"
                            @click="exportScene">
                            📤 Export
                        </button>
                        <button id="undo-btn"
                            class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm"
                            @click="undo">
                            ↩️ Undo
                        </button>
                        <button id="back-to-project-btn"
                            class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm ml-auto"
                            @click="router.push(`/projects/${route.params.id}`)">
                            ← Back to Project
                        </button>
                    </div>
                </div>
            </div>

            <div id="workspace-content" class="flex-1 overflow-y-auto p-4">
                <DialogueEditor id="scene-workspace-component" :key="currentScene?.id" :dialogue-lines="dialogueLines"
                    :characters="projectCharacters" :selected-line-index="selectedLineIndex"
                    :selected-speaker-id="selectedCharacterId"
                    :is-dirty="currentScene ? dirtyScenes.has(currentScene.id) : false"
                    :scene-character-ids="currentScene?.character_ids || undefined" @add-line="addDialogueLine"
                    @edit-line="handleEditLine" @delete-line="deleteDialogueLine" @select-line="selectLine"
                    @speaker-change="handleSpeakerChange" @add-menu="addMenuChoice"
                    @update-line-position="handleUpdateLinePosition"
                    @update-line-visibility="handleUpdateLineVisibility" />
            </div>
        </main>
    </div>

    <!-- Character Removal Warning Modal -->
    <div v-if="showRemovalModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
        id="character-removal-modal" @click.self="closeRemovalModal">
        <div class="bg-gray-800 rounded-xl max-w-2xl w-full mx-4 shadow-2xl" id="removal-modal-container">
            <div class="p-6 border-b border-gray-700" id="removal-modal-header">
                <div class="flex items-center gap-3">
                    <span class="text-4xl">⚠️</span>
                    <h3 class="text-2xl text-slate-50">Remove Character from Project</h3>
                </div>
            </div>

            <div class="p-6" id="removal-modal-content">
                <p class="text-slate-300 mb-4" id="removal-modal-message">
                    Are you sure you want to remove <strong class="text-sky-400">{{ characterToRemove?.name }}</strong>
                    from this project?
                </p>

                <!-- Scene usage warning -->
                <div v-if="characterSceneUsage.length > 0"
                    class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6" id="scene-usage-warning">
                    <p class="text-amber-400 font-medium mb-2 flex items-center gap-2" id="scene-usage-title">
                        <span>⚠️</span> This character appears in:
                    </p>
                    <ul class="text-slate-300 text-sm space-y-1 ml-6 list-disc" id="scene-usage-list">
                        <li v-for="usage in characterSceneUsage" :key="usage.sceneId"
                            :id="`usage-scene-${usage.sceneId}`">
                            <strong>{{ usage.sceneName }}</strong> - {{ usage.dialogueCount }} dialogue line{{
                                usage.dialogueCount !== 1 ? 's' : '' }}
                        </li>
                    </ul>
                    <p class="text-slate-400 text-sm mt-3" id="total-dialogue-summary">
                        Total: {{ totalDialogueLinesAffected }} dialogue lines across {{ characterSceneUsage.length }}
                        scene{{ characterSceneUsage.length !== 1 ? 's' : '' }}
                    </p>
                </div>

                <!-- Resolution options -->
                <div class="space-y-4" id="removal-options">
                    <p class="text-slate-300 font-medium mb-2">What would you like to do with the dialogue lines?</p>

                    <label
                        class="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                        id="option-placeholder">
                        <input type="radio" v-model="removalAction" value="placeholder" class="mt-1" />
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
                        <input type="radio" v-model="removalAction" value="swap" class="mt-1" />
                        <div class="flex-1">
                            <div class="text-slate-50 font-medium">Replace with another character</div>
                            <div class="text-slate-400 text-sm mb-2">Automatically reassign all dialogue to a different
                                character</div>
                            <select v-if="removalAction === 'swap'" v-model="swapCharacterId"
                                class="mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-slate-50"
                                id="swap-character-select">
                                <option value="">Select a character...</option>
                                <option v-for="char in availableCharactersToSwap" :key="char.id" :value="char.id">
                                    {{ char.name }} ({{ char.nickname || 'no nickname' }})
                                </option>
                            </select>
                        </div>
                    </label>

                    <label
                        class="flex items-start gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                        id="option-delete">
                        <input type="radio" v-model="removalAction" value="delete" class="mt-1" />
                        <div>
                            <div class="text-slate-50 font-medium text-red-400">Delete all dialogue lines</div>
                            <div class="text-slate-400 text-sm">⚠️ This action cannot be undone. All dialogue for this
                                character will be permanently deleted.</div>
                        </div>
                    </label>
                </div>
            </div>

            <div class="p-6 border-t border-gray-700 flex justify-end gap-3" id="removal-modal-actions">
                <button @click="closeRemovalModal"
                    class="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-slate-300 rounded-lg transition-colors"
                    id="cancel-removal-btn">
                    Cancel
                </button>
                <button @click="confirmRemoveCharacter"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    :disabled="removalAction === 'swap' && !swapCharacterId"
                    :class="{ 'opacity-50 cursor-not-allowed': removalAction === 'swap' && !swapCharacterId }"
                    id="confirm-removal-btn">
                    Confirm Removal
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ProjectSidebar from '@/components/scene/ProjectSidebar.vue';
import DialogueEditor from '@/components/scene/DialogueEditor.vue';
import type { Character, DialogueLine, MenuNode, SceneLine, Scene } from '@/utils/dummyData';
import type { ImagePosition } from '@/types/models';
import { getProject } from '@/services/projectService';
import { getCharacters, createCharacter as createCharacterService } from '@/services/characterService';
import {
    getScenesByProject,
    createScene,
    saveScene as saveSceneService,
    deleteScene as deleteSceneService,
} from '@/services/sceneService';
import {
    createMenuNode,
    replaceLine,
    deleteLine,
    applyLinePosition,
    applyLineVisibility,
} from '@/services/dialogueService';

const route = useRoute();
const router = useRouter();

// Type guard — narrows a SceneLine to DialogueLine (excludes menu/action nodes)
const isDialogueLine = (line: SceneLine): line is DialogueLine => line.type !== 'menu';

// State
const selectedCharacterId = ref<string | null>(null);
const selectedLineIndex = ref<number | null>(null);
const currentScene = ref<Scene | null>(null);
const dialogueLines = ref<SceneLine[]>([]);
const scenes = ref<Scene[]>([]);
const sceneDialogueCache = ref<Record<string, SceneLine[]>>({});
const dirtyScenes = ref<Set<string>>(new Set());
const isLoading = ref(false);
const error = ref<string | null>(null);
const autoSaveTimer = ref<number | null>(null);

// Character removal modal state
const showRemovalModal = ref(false);
const characterToRemove = ref<Character | null>(null);
const removalAction = ref<'placeholder' | 'swap' | 'delete'>('placeholder');
const swapCharacterId = ref<string>('');

// Master roster — every character that has ever been created
const allCharacters = ref<Character[]>([]);

// IDs of characters actually assigned to the current project
const projectCharacterIds = ref<string[]>([]);

// Characters to show in the sidebar roster — filtered by project
const projectCharacters = computed<Character[]>(() =>
    allCharacters.value.filter(c => projectCharacterIds.value.includes(c.id))
);

// Current project — loaded async via projectService
const currentProject = ref<Scene | null>(null);

// Computed: Selected character
const selectedCharacter = computed<Character | null>(() =>
    selectedCharacterId.value
        ? projectCharacters.value.find(c => c.id === selectedCharacterId.value) || null
        : null
);

// Computed: Has unsaved changes
const hasUnsavedChanges = computed(() => {
    return currentScene.value ? dirtyScenes.value.has(currentScene.value.id) : false;
});

// Get character usage across all scenes in this project
const getCharacterUsage = (characterId: string) => {
    const usage: { sceneId: string; sceneName: string; dialogueCount: number }[] = [];
    let totalDialogue = 0;

    scenes.value.forEach(scene => {
        const dialogueCount = scene.dialogue_lines.filter(
            line => isDialogueLine(line) && line.character?.id === characterId
        ).length;
        if (dialogueCount > 0) {
            usage.push({
                sceneId: scene.id,
                sceneName: scene.name,
                dialogueCount
            });
            totalDialogue += dialogueCount;
        }
    });

    return { usage, totalDialogue };
};

// Computed: Character scene usage for modal
const characterSceneUsage = computed(() => {
    if (!characterToRemove.value) return [];
    return getCharacterUsage(characterToRemove.value.id).usage;
});

// Computed: Total dialogue lines affected
const totalDialogueLinesAffected = computed(() => {
    if (!characterToRemove.value) return 0;
    return getCharacterUsage(characterToRemove.value.id).totalDialogue;
});

// Computed: Available characters to swap with (excluding the one being removed)
const availableCharactersToSwap = computed(() =>
    projectCharacters.value.filter(c => c.id !== characterToRemove.value?.id)
);

// Load all project data via services
const loadProjectData = async () => {
    isLoading.value = true;
    error.value = null;
    try {
        const projectId = route.params.id as string;
        const [project, chars, projectScenes] = await Promise.all([
            getProject(projectId),
            getCharacters(),
            getScenesByProject(projectId),
        ]);
        currentProject.value = project as any;
        allCharacters.value = chars;
        scenes.value = projectScenes;
        // Fall back to all character IDs if the project doesn't track them explicitly
        projectCharacterIds.value = project?.character_ids ?? chars.map(c => c.id);
    } catch (err) {
        console.error('Failed to load project data:', err);
        error.value = 'Failed to load project data';
    } finally {
        isLoading.value = false;
    }
};

// Methods
const handleAddCharactersToProject = (characterIds: string[]) => {
    characterIds.forEach(id => {
        if (!projectCharacterIds.value.includes(id)) {
            projectCharacterIds.value.push(id);
        }
    });
};

const handleSelectCharacter = (character: Character) => {
    selectedCharacterId.value = character.id;
    selectedLineIndex.value = null;
};

const handleCreateCharacter = async (characterData: Omit<Character, 'id' | 'created_at' | 'updated_at'>) => {
    try {
        // Call the character service to create the character
        const newCharacter = await createCharacterService(characterData);

        // Add to local state
        allCharacters.value.push(newCharacter);

        // Add to project if projectId is provided
        if (route.params.id) {
            projectCharacterIds.value.push(newCharacter.id);
            // TODO: Update project via projectService
        }

        // Auto-select the new character if needed
        selectedCharacterId.value = newCharacter.id;

        showTempSuccess(`Character "${newCharacter.name}" created successfully!`);

        // If the character was created in the context of adding to project,
        // we could also trigger adding them to the current scene
        if (currentScene.value && !currentScene.value.character_ids.includes(newCharacter.id)) {
            // Optionally add to current scene
            currentScene.value.character_ids.push(newCharacter.id);
            dirtyScenes.value.add(currentScene.value.id);
        }

    } catch (err) {
        console.error('Failed to create character:', err);
        error.value = 'Failed to create character';
        showTempError('Failed to create character. Please try again.');
    }
};

// ── Helper for error toast ──
const showTempError = (message: string) => {
    const toast = document.createElement('div');
    toast.id = 'error-toast';
    toast.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

const handleSpeakerChange = (characterId: string | null) => {
    selectedCharacterId.value = characterId;
};

const addCharacterToProject = () => {
    console.log('Opening character selection modal');
    alert('Character selection modal coming soon!');
};

// Open removal modal instead of direct confirm
const openRemoveCharacterModal = (characterId: string) => {
    const character = projectCharacters.value.find(c => c.id === characterId);
    if (!character) return;

    characterToRemove.value = character;
    removalAction.value = 'placeholder';
    swapCharacterId.value = '';
    showRemovalModal.value = true;
};

// Close removal modal
const closeRemovalModal = () => {
    showRemovalModal.value = false;
    characterToRemove.value = null;
    removalAction.value = 'placeholder';
    swapCharacterId.value = '';
};

// Confirm and execute character removal
const confirmRemoveCharacter = async () => {
    if (!characterToRemove.value) return;

    if (removalAction.value === 'swap' && !swapCharacterId.value) {
        error.value = 'Please select a character to swap with';
        return;
    }

    const characterId = characterToRemove.value.id;
    const swapWithId = removalAction.value === 'swap' ? swapCharacterId.value : undefined;

    // Handle dialogue lines based on action
    if (totalDialogueLinesAffected.value > 0) {
        if (removalAction.value === 'swap' && swapWithId) {
            const swapCharacter = projectCharacters.value.find(c => c.id === swapWithId);
            // Replace character in all scenes (menu nodes pass through untouched)
            scenes.value = scenes.value.map(scene => ({
                ...scene,
                dialogue_lines: scene.dialogue_lines.map((line): SceneLine => {
                    if (isDialogueLine(line) && line.character?.id === characterId && swapCharacter) {
                        return {
                            ...line,
                            character: {
                                id: swapCharacter.id,
                                name: swapCharacter.name,
                                color: swapCharacter.color
                            }
                        };
                    }
                    return line;
                })
            }));
            // Also update current scene dialogue lines
            dialogueLines.value = dialogueLines.value.map((line): SceneLine => {
                if (isDialogueLine(line) && line.character?.id === characterId && swapCharacter) {
                    return {
                        ...line,
                        character: {
                            id: swapCharacter.id,
                            name: swapCharacter.name,
                            color: swapCharacter.color
                        }
                    };
                }
                return line;
            });
            showTempSuccess(`Replaced "${characterToRemove.value.name}" with "${swapCharacter?.name}"`);
        } else if (removalAction.value === 'delete') {
            // Delete all dialogue lines for this character (menu nodes are kept — they have no speaker)
            scenes.value = scenes.value.map(scene => ({
                ...scene,
                dialogue_lines: scene.dialogue_lines.filter(
                    line => !isDialogueLine(line) || line.character?.id !== characterId
                )
            }));
            dialogueLines.value = dialogueLines.value.filter(
                line => !isDialogueLine(line) || line.character?.id !== characterId
            );
            showTempSuccess(`Deleted all dialogue for "${characterToRemove.value.name}"`);
        } else {
            // Keep as placeholder - mark as removed (menu nodes pass through untouched)
            scenes.value = scenes.value.map(scene => ({
                ...scene,
                dialogue_lines: scene.dialogue_lines.map((line): SceneLine => {
                    if (isDialogueLine(line) && line.character?.id === characterId) {
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
                })
            }));
            dialogueLines.value = dialogueLines.value.map((line): SceneLine => {
                if (isDialogueLine(line) && line.character?.id === characterId) {
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
            showTempSuccess(`Character "${characterToRemove.value.name}" removed (dialogue preserved as placeholder)`);
        }
    }

    // Remove character from project roster
    projectCharacterIds.value = projectCharacterIds.value.filter(id => id !== characterId);

    // Remove character from scene character_ids
    scenes.value = scenes.value.map(s => ({
        ...s,
        character_ids: s.character_ids.filter(id => id !== characterId)
    }));

    // Mark affected scenes as dirty
    scenes.value.forEach(s => {
        if (!s.character_ids.includes(characterId)) {
            dirtyScenes.value.add(s.id);
        }
    });

    // Clear selection if that character was selected
    if (selectedCharacterId.value === characterId) {
        selectedCharacterId.value = null;
    }

    // If current scene dialogue was affected, mark as dirty
    if (currentScene.value) {
        dirtyScenes.value.add(currentScene.value.id);
    }

    closeRemovalModal();
};

const selectScene = (scene: Scene) => {
    // Auto-save current scene before switching
    autoSaveCurrentScene();

    // Save current scene's dialogue to cache before switching
    if (currentScene.value) {
        sceneDialogueCache.value[currentScene.value.id] = [...dialogueLines.value];
    }
    currentScene.value = scene;
    // Restore from cache if exists, else use scene's saved lines
    dialogueLines.value = [...(sceneDialogueCache.value[scene.id] ?? scene.dialogue_lines ?? [])];
    selectedLineIndex.value = null;
    selectedCharacterId.value = null;
};

const handleAddScene = async (sceneData: Omit<Scene, 'id' | 'created_at' | 'updated_at' | 'dialogue_lines'>) => {
    try {
        // The service creates the full Scene object with IDs and timestamps
        const newScene = await createScene(sceneData);
        scenes.value.push(newScene);
        sceneDialogueCache.value[newScene.id] = [];
        await selectScene(newScene);
        showTempSuccess(`Scene "${newScene.name}" created!`);
    } catch (err) {
        console.error('Failed to create scene:', err);
        error.value = 'Failed to create scene';
    }
};

const handleDeleteScene = async (sceneId: string) => {
    if (confirm('Delete this scene? This cannot be undone.')) {
        try {
            await deleteSceneService(sceneId);
            scenes.value = scenes.value.filter(s => s.id !== sceneId);
            delete sceneDialogueCache.value[sceneId];
            dirtyScenes.value.delete(sceneId);
            if (currentScene.value?.id === sceneId) {
                currentScene.value = null;
                dialogueLines.value = [];
                selectedLineIndex.value = null;
                selectedCharacterId.value = null;
            }
        } catch (err) {
            console.error('Failed to delete scene:', err);
            error.value = 'Failed to delete scene';
        }
    }
};

const handleUpdateScene = async (scene: Scene) => {
    try {
        const updated = await saveSceneService(scene);
        const index = scenes.value.findIndex(s => s.id === updated.id);
        if (index !== -1) scenes.value[index] = updated;
        if (currentScene.value?.id === updated.id) currentScene.value = updated;
    } catch (err) {
        console.error('Failed to update scene:', err);
        error.value = 'Failed to update scene';
    }
};

const addDialogueLine = (line: DialogueLine) => {
    dialogueLines.value.push(line);
    selectedLineIndex.value = dialogueLines.value.length - 1;
    selectedCharacterId.value = line.character?.id || null;
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
    scheduleAutoSave();
};

const addMenuChoice = (node: MenuNode) => {
    const newNode = createMenuNode(
        { prompt: node.prompt, choices: node.choices },
        dialogueLines.value.length + 1
    );
    dialogueLines.value.push(newNode);
    selectedLineIndex.value = dialogueLines.value.length - 1;
    selectedCharacterId.value = null;
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
    scheduleAutoSave();
};

const handleEditLine = (payload: { index: number; line: SceneLine }) => {
    dialogueLines.value = replaceLine(dialogueLines.value, payload.index, payload.line);
    selectedLineIndex.value = null;
    selectedCharacterId.value = payload.line.type === 'menu'
        ? null
        : (payload.line as DialogueLine).character?.id || null;
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
    scheduleAutoSave();
};

const deleteDialogueLine = (index: number) => {
    if (confirm('Delete this line?')) {
        dialogueLines.value = deleteLine(dialogueLines.value, index);
        selectedLineIndex.value = null;
        if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
        scheduleAutoSave();
    }
};

const selectLine = (index: number | null) => {
    selectedLineIndex.value = index;
    if (index !== null && index >= 0 && index < dialogueLines.value.length) {
        const line = dialogueLines.value[index];
        selectedCharacterId.value = (line && line.type !== 'menu')
            ? (line as DialogueLine).character?.id ?? null
            : null;
    } else {
        selectedCharacterId.value = null;
    }
};

const handleUpdateLinePosition = ({ index, position }: { index: number; position: ImagePosition | undefined }) => {
    dialogueLines.value = applyLinePosition(dialogueLines.value, index, position);
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
};

const handleUpdateLineVisibility = ({ index, visible }: { index: number; visible: boolean }) => {
    dialogueLines.value = applyLineVisibility(dialogueLines.value, index, visible);
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
};

const saveScene = async () => {
    if (!currentScene.value) return;
    isLoading.value = true;
    try {
        const updated = await saveSceneService({
            ...currentScene.value,
            dialogue_lines: [...dialogueLines.value],
        });
        const index = scenes.value.findIndex(s => s.id === updated.id);
        if (index !== -1) scenes.value[index] = updated;
        currentScene.value = updated;
        delete sceneDialogueCache.value[updated.id];
        dirtyScenes.value.delete(updated.id);
        showTempSuccess('Scene saved!');
    } catch (err) {
        console.error('Failed to save scene:', err);
        error.value = 'Failed to save scene';
    } finally {
        isLoading.value = false;
    }
};

const autoSaveCurrentScene = () => {
    if (hasUnsavedChanges.value && currentScene.value) {
        console.log('Auto-saving scene before switching...');
        saveScene();
    }
};

const scheduleAutoSave = () => {
    if (autoSaveTimer.value) {
        clearTimeout(autoSaveTimer.value);
    }
    autoSaveTimer.value = setTimeout(() => {
        if (hasUnsavedChanges.value && currentScene.value) {
            console.log('Auto-saving scene...');
            saveScene();
        }
    }, 3000);
};

const showTempSuccess = (message: string) => {
    const toast = document.createElement('div');
    toast.id = 'success-toast';
    toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 2000);
};

const exportScene = () => {
    if (!currentScene.value) {
        alert('No scene selected to export');
        return;
    }
    console.log('Exporting scene:', currentScene.value);
    alert('Export feature coming soon!');
};

const undo = () => {
    if (dialogueLines.value.length > 0) {
        const removed = dialogueLines.value.pop();
        selectedLineIndex.value = null;
        selectedCharacterId.value = null;
        if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
        console.log('Undo: removed line', removed);
        scheduleAutoSave();
    } else {
        console.log('Nothing to undo');
    }
};

const resetState = async () => {
    selectedCharacterId.value = null;
    selectedLineIndex.value = null;
    currentScene.value = null;
    dialogueLines.value = [];
    sceneDialogueCache.value = {};
    dirtyScenes.value.clear();
    error.value = null;
    if (autoSaveTimer.value) {
        clearTimeout(autoSaveTimer.value);
        autoSaveTimer.value = null;
    }
    await loadProjectData();
};

const handleKeydown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveScene();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        undo();
    }
};

onMounted(() => {
    console.log('Scene Editor mounted for project:', route.params.id);
    loadProjectData();
    window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
    autoSaveCurrentScene();
    window.removeEventListener('keydown', handleKeydown);
    if (autoSaveTimer.value) {
        clearTimeout(autoSaveTimer.value);
    }
});

watch(() => route.params.id, () => {
    console.log('Project ID changed, reloading...');
    resetState();
});

if (import.meta.env.DEV) {
    // @ts-ignore
    window.__SCENE_EDITOR_VIEW__ = {
        resetState,
        saveScene,
        undo,
        getCurrentScene: () => currentScene.value,
        getDialogueLines: () => dialogueLines.value,
        hasUnsavedChanges: () => hasUnsavedChanges.value,
        addDialogueLine: (line: DialogueLine) => addDialogueLine(line)
    };
}
</script>

<style scoped>
@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fade-in 0.2s ease-out;
}

.overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: #334155 #1e293b;
}

.overflow-y-auto::-webkit-scrollbar {
    width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #1e293b;
    border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #475569;
}
</style>