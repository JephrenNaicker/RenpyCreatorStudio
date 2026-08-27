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
                    <h2 id="workspace-title" class="text-xl font-semibold text-white flex items-center flex-wrap gap-2">
                        {{ currentProject?.name ?? 'Scene Editor' }}
                        <span v-if="currentScene" :id="`scene-badge-${currentScene.id}`"
                            class="text-sm bg-sky-400/20 text-sky-400 px-2 py-1 rounded">
                            🎬 {{ currentScene.name }}
                        </span>

                        <!-- Current scene background — click to open/change. Lives here (not the
                             action toolbar) since it's a property of this scene, not a global action. -->
                        <button v-if="currentScene" id="scene-background-chip" type="button"
                            class="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg pl-1.5 pr-3 py-1 transition-colors"
                            @click="showBackgroundLibrary = true">
                            <span v-if="currentSceneBackgroundThumb"
                                class="w-6 h-6 rounded overflow-hidden border border-gray-600 flex-shrink-0 bg-gray-900">
                                <img :src="currentSceneBackgroundThumb" alt="" class="w-full h-full object-cover" />
                            </span>
                            <span v-else
                                class="w-6 h-6 rounded flex items-center justify-center bg-gray-900 border border-dashed border-gray-600 text-gray-500 text-xs flex-shrink-0">
                                🖼️
                            </span>
                            <span class="text-gray-300">
                                {{ currentSceneBackgroundName ?? 'Set background' }}
                            </span>
                        </button>
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
                            class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
                            :disabled="!canUndo" :title="canUndo ? 'Undo last change (Ctrl+Z)' : 'Nothing to undo'"
                            @click="undo">
                            ↩️ Undo
                        </button>
                        <button id="redo-btn"
                            class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
                            :disabled="!canRedo" :title="canRedo ? 'Redo (Ctrl+Y)' : 'Nothing to redo'" @click="redo">
                            ↪️ Redo
                        </button>
                        <button id="manage-variables-btn"
                            class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm"
                            @click="showVariableManager = true">
                            🧮 Variables
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
                    :characters="projectCharacters" :variables="variables" :background-assets="backgroundAssets"
                    :selected-line-index="selectedLineIndex" :selected-speaker-id="selectedCharacterId"
                    :is-dirty="currentScene ? dirtyScenes.has(currentScene.id) : false"
                    :scene-character-ids="currentScene?.character_ids || undefined" @add-line="addDialogueLine"
                    @edit-line="handleEditLine" @delete-line="deleteDialogueLine" @select-line="selectLine"
                    @speaker-change="handleSpeakerChange" @add-menu="addMenuChoice"
                    @add-background-action="handleAddBackgroundAction" @update-line-position="handleUpdateLinePosition"
                    @update-line-visibility="handleUpdateLineVisibility" />
            </div>
        </main>
    </div>

    <!-- Backdrop — click anywhere outside the panel to close it -->
    <Transition name="fade-backdrop">
        <div v-if="showBackgroundLibrary" class="fixed inset-0 bg-black/50 z-40"
            @click="showBackgroundLibrary = false" />
    </Transition>

    <Transition name="slide">
        <div v-if="showBackgroundLibrary" class="fixed right-0 top-0 h-full z-50 shadow-2xl" style="width: 340px;">
            <BackgroundLibPanel :background-assets="backgroundAssets"
                :current-background-path="currentScene?.background_image ?? null"
                @select-background="handleSelectBackground" @add-background="handleAddBackground"
                @delete-background="handleDeleteBackground" @clear-background="handleClearBackground"
                @close="showBackgroundLibrary = false" />
        </div>
    </Transition>

    <!-- Story Variables Modal -->
    <VariableManager :open="showVariableManager" :variables="variables" :scenes="scenes"
        @update:open="showVariableManager = $event" @update:variables="handleVariablesUpdate"
        @update:scenes="handleVariableRenameScenes" />

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
import VariableManager from '@/components/scene/VariableManager.vue';
import type { Character, DialogueLine, MenuNode, ActionNode, SceneLine, Scene, Project, StoryVariable } from '@/utils/dummyData';
import type { ImagePosition } from '@/types/models';
import { getProject, updateProject } from '@/services/projectService';
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
import BackgroundLibPanel from '@/components/background/BackgroundLibPanel.vue';
import type { BackgroundAsset } from '@/types/models';


const route = useRoute();
const router = useRouter();

// Type guard — narrows a SceneLine to DialogueLine (excludes menu/action nodes)
const isDialogueLine = (line: SceneLine): line is DialogueLine => line.type !== 'menu' && line.type !== 'action';

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

// Undo/redo history — a per-scene stack of dialogueLines snapshots taken
// immediately *before* each mutation. Undo pops the most recent snapshot
// and restores it, rather than blindly removing the last array element
// (which only happened to look correct for "add line"). Redo mirrors this:
// undo pushes the state it's replacing onto the redo stack, and any new
// mutation clears the redo stack (the old "future" is no longer valid
// once the user branches off with a fresh edit).
const MAX_UNDO_HISTORY = 50;
const sceneHistory = ref<Record<string, SceneLine[][]>>({});
const sceneRedoHistory = ref<Record<string, SceneLine[][]>>({});

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

// Background library state
const showBackgroundLibrary = ref(false);
const backgroundAssets = ref<BackgroundAsset[]>([]);

// Current project — loaded async via projectService
const currentProject = ref<Project | null>(null);

// Story variable registry for this project — sourced from Project.variables,
// managed via VariableManager.vue + VariableManagerService.ts
const variables = ref<StoryVariable[]>([]);
const showVariableManager = ref(false);

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

// Computed: Whether there's an undo snapshot available for the current scene
const canUndo = computed(() => {
    if (!currentScene.value) return false;
    return (sceneHistory.value[currentScene.value.id]?.length ?? 0) > 0;
});

// Computed: Whether there's a redo snapshot available for the current scene
const canRedo = computed(() => {
    if (!currentScene.value) return false;
    return (sceneRedoHistory.value[currentScene.value.id]?.length ?? 0) > 0;
});

// Snapshot the current scene's dialogue lines onto its undo stack, and
// clear its redo stack — a fresh mutation invalidates whatever "future"
// redo used to point to.
// Call this BEFORE mutating dialogueLines so undo() can restore the
// pre-mutation state, regardless of what kind of edit just happened
// (add, edit, delete, reposition, visibility toggle, etc).
const pushHistory = () => {
    if (!currentScene.value) return;
    const sceneId = currentScene.value.id;
    const stack = sceneHistory.value[sceneId] ?? (sceneHistory.value[sceneId] = []);
    stack.push(JSON.parse(JSON.stringify(dialogueLines.value)));
    if (stack.length > MAX_UNDO_HISTORY) stack.shift();
    sceneRedoHistory.value[sceneId] = [];
};

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
        currentProject.value = project;
        allCharacters.value = chars;
        scenes.value = projectScenes;
        // Fall back to all character IDs if the project doesn't track them explicitly
        projectCharacterIds.value = project?.character_ids ?? chars.map(c => c.id);
        variables.value = project?.variables ?? [];
        backgroundAssets.value = project?.background_assets ?? [];
    } catch (err) {
        console.error('Failed to load project data:', err);
        error.value = 'Failed to load project data';
    } finally {
        isLoading.value = false;
    }
};

// Persist the current character roster to the project record itself.
// Without this, adding/removing a character only ever lived in this
// component's local refs — switching to ProjectDetailView (or reloading)
// would re-fetch the project via getProject() and the old roster would
// come right back. Called after every mutation of projectCharacterIds so
// both views read the same source of truth.
const persistCharacterRoster = async () => {
    if (!currentProject.value) return;
    try {
        const updated = await updateProject(currentProject.value.id, {
            character_ids: projectCharacterIds.value
        });
        if (updated) currentProject.value = updated;
    } catch (err) {
        console.error('Failed to persist character roster:', err);
        error.value = 'Failed to save project roster changes';
    }
};

// Methods
const handleAddCharactersToProject = async (characterIds: string[]) => {
    let changed = false;
    characterIds.forEach(id => {
        if (!projectCharacterIds.value.includes(id)) {
            projectCharacterIds.value.push(id);
            changed = true;
        }
    });
    if (changed) await persistCharacterRoster();
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
            await persistCharacterRoster();
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

// VariableManager emits the full updated registry after create/edit/delete.
// No backend endpoint for project.variables exists yet — mirrors the same
// "mutate local state, TODO the persistence call" pattern handleCreateCharacter
// uses below until projectService exposes one.
const handleVariablesUpdate = (updated: StoryVariable[]) => {
    variables.value = updated;
    // TODO: persist via projectService once an update-project-variables endpoint exists
};

// Only fires when a variable rename cascaded into scene data (effects/conditions
// rewritten to the new key). dialogueLines is a decoupled draft of the open
// scene, so it needs a manual refresh — and any scene whose dialogue_lines
// actually changed needs to be marked dirty so the rename survives a save.
const handleVariableRenameScenes = (updatedScenes: Scene[]) => {
    updatedScenes.forEach(updated => {
        const previous = scenes.value.find(s => s.id === updated.id);
        if (previous && JSON.stringify(previous.dialogue_lines) !== JSON.stringify(updated.dialogue_lines)) {
            dirtyScenes.value.add(updated.id);
        }
    });

    scenes.value = updatedScenes;

    if (currentScene.value) {
        const refreshed = updatedScenes.find(s => s.id === currentScene.value!.id);
        if (refreshed) {
            dialogueLines.value = [...refreshed.dialogue_lines];
        }
    }
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
    const removedCharacterName = characterToRemove.value.name;

    // Build the updated scene list locally first (dialogue reassignment +
    // character_ids cleanup), then persist every touched scene below — not
    // just whichever one happens to be open right now. Previously this only
    // relied on autosave for `currentScene`, so edits to any *other* scene
    // the character appeared in were silently lost (never sent to
    // saveSceneService, and never reflected in ProjectDetailView).
    let updatedScenes = scenes.value.map(scene => ({
        ...scene,
        character_ids: scene.character_ids.filter(id => id !== characterId)
    }));

    if (totalDialogueLinesAffected.value > 0) {
        if (removalAction.value === 'swap' && swapWithId) {
            const swapCharacter = projectCharacters.value.find(c => c.id === swapWithId);
            // Replace character in all scenes (menu/action nodes pass through untouched)
            updatedScenes = updatedScenes.map(scene => ({
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
            showTempSuccess(`Replaced "${removedCharacterName}" with "${swapCharacter?.name}"`);
        } else if (removalAction.value === 'delete') {
            // Delete all dialogue lines for this character (menu/action nodes are kept)
            updatedScenes = updatedScenes.map(scene => ({
                ...scene,
                dialogue_lines: scene.dialogue_lines.filter(
                    line => !isDialogueLine(line) || line.character?.id !== characterId
                )
            }));
            showTempSuccess(`Deleted all dialogue for "${removedCharacterName}"`);
        } else {
            // Keep as placeholder - mark as removed (menu/action nodes pass through untouched)
            updatedScenes = updatedScenes.map(scene => ({
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
            showTempSuccess(`Character "${removedCharacterName}" removed (dialogue preserved as placeholder)`);
        }
    }

    // Persist every scene that actually changed (dialogue and/or
    // character_ids) — comparing against the pre-mutation snapshot avoids
    // re-saving (and re-timestamping) scenes the removed character never
    // touched.
    const changedScenes = updatedScenes.filter(scene => {
        const original = scenes.value.find(s => s.id === scene.id);
        return !original || JSON.stringify(original) !== JSON.stringify(scene);
    });

    try {
        const savedScenes = await Promise.all(changedScenes.map(scene => saveSceneService(scene)));
        // Merge saved (server-timestamped) versions back into local state
        scenes.value = updatedScenes.map(scene => savedScenes.find(s => s.id === scene.id) ?? scene);
        savedScenes.forEach(s => dirtyScenes.value.delete(s.id));
    } catch (err) {
        console.error('Failed to save scenes during character removal:', err);
        error.value = 'Some scene changes could not be saved';
    }

    // Keep the open scene's dialogue editor in sync with what was just saved
    if (currentScene.value) {
        const refreshed = scenes.value.find(s => s.id === currentScene.value!.id);
        if (refreshed) {
            currentScene.value = refreshed;
            dialogueLines.value = [...refreshed.dialogue_lines];
            delete sceneDialogueCache.value[refreshed.id];
        }
    }

    // Remove character from project roster and persist it so
    // ProjectDetailView sees the same membership on next load.
    projectCharacterIds.value = projectCharacterIds.value.filter(id => id !== characterId);
    await persistCharacterRoster();

    // Clear selection if that character was selected
    if (selectedCharacterId.value === characterId) {
        selectedCharacterId.value = null;
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
            delete sceneHistory.value[sceneId];
            delete sceneRedoHistory.value[sceneId];
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
    pushHistory();
    dialogueLines.value.push(line);
    selectedLineIndex.value = dialogueLines.value.length - 1;
    selectedCharacterId.value = line.character?.id || null;
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
    scheduleAutoSave();
};

const addMenuChoice = (node: MenuNode) => {
    pushHistory();
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

const handleAddBackgroundAction = (node: Omit<ActionNode, 'id' | 'order'>) => {
    pushHistory();
    const newNode: ActionNode = {
        ...node,
        id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        order: dialogueLines.value.length + 1,
    };
    dialogueLines.value.push(newNode);
    selectedLineIndex.value = dialogueLines.value.length - 1;
    selectedCharacterId.value = null;
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
    scheduleAutoSave();
};

const handleEditLine = (payload: { index: number; line: SceneLine }) => {
    pushHistory();
    dialogueLines.value = replaceLine(dialogueLines.value, payload.index, payload.line);
    selectedLineIndex.value = null;
    selectedCharacterId.value = isDialogueLine(payload.line)
        ? payload.line.character?.id || null
        : null;
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
    scheduleAutoSave();
};

const deleteDialogueLine = (index: number) => {
    if (confirm('Delete this line?')) {
        pushHistory();
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
        selectedCharacterId.value = (line && isDialogueLine(line))
            ? line.character?.id ?? null
            : null;
    } else {
        selectedCharacterId.value = null;
    }
};

const handleUpdateLinePosition = ({ index, position }: { index: number; position: ImagePosition | undefined }) => {
    pushHistory();
    dialogueLines.value = applyLinePosition(dialogueLines.value, index, position);
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
};

const handleUpdateLineVisibility = ({ index, visible }: { index: number; visible: boolean }) => {
    pushHistory();
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
    if (!currentScene.value) {
        console.log('Nothing to undo');
        return;
    }

    const sceneId = currentScene.value.id;
    const stack = sceneHistory.value[sceneId];
    if (!stack || stack.length === 0) {
        console.log('Nothing to undo');
        return;
    }

    // Stash the current (about-to-be-replaced) state on the redo stack
    // before restoring, so redo() can bring it back.
    const redoStack = sceneRedoHistory.value[sceneId] ?? (sceneRedoHistory.value[sceneId] = []);
    redoStack.push(JSON.parse(JSON.stringify(dialogueLines.value)));
    if (redoStack.length > MAX_UNDO_HISTORY) redoStack.shift();

    // Restore the snapshot taken right before the last mutation — this
    // correctly reverts adds, edits, deletes, repositions, and visibility
    // toggles alike, instead of assuming the last mutation only ever
    // appended to the end of the array.
    const previous = stack.pop()!;
    dialogueLines.value = previous;
    selectedLineIndex.value = null;
    selectedCharacterId.value = null;
    dirtyScenes.value.add(currentScene.value.id);
    scheduleAutoSave();
};

const redo = () => {
    if (!currentScene.value) {
        console.log('Nothing to redo');
        return;
    }

    const sceneId = currentScene.value.id;
    const redoStack = sceneRedoHistory.value[sceneId];
    if (!redoStack || redoStack.length === 0) {
        console.log('Nothing to redo');
        return;
    }

    // Stash the current state back on the undo stack so undo can reverse
    // the redo, then restore the most recently undone snapshot.
    const stack = sceneHistory.value[sceneId] ?? (sceneHistory.value[sceneId] = []);
    stack.push(JSON.parse(JSON.stringify(dialogueLines.value)));
    if (stack.length > MAX_UNDO_HISTORY) stack.shift();

    const next = redoStack.pop()!;
    dialogueLines.value = next;
    selectedLineIndex.value = null;
    selectedCharacterId.value = null;
    dirtyScenes.value.add(currentScene.value.id);
    scheduleAutoSave();
};

const resetState = async () => {
    selectedCharacterId.value = null;
    selectedLineIndex.value = null;
    currentScene.value = null;
    dialogueLines.value = [];
    sceneDialogueCache.value = {};
    sceneHistory.value = {};
    sceneRedoHistory.value = {};
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
    // Undo: Ctrl/Cmd+Z (without Shift)
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
    }
    // Redo: Ctrl/Cmd+Y, or the common Ctrl/Cmd+Shift+Z alternative
    if (
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'z')
    ) {
        event.preventDefault();
        redo();
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
        canUndo: () => canUndo.value,
        redo,
        canRedo: () => canRedo.value,
        addDialogueLine: (line: DialogueLine) => addDialogueLine(line)
    };
}

// ── Background library handlers ──

const handleAddBackground = (asset: BackgroundAsset) => {
    backgroundAssets.value.push(asset);
    // Auto-select this background for the current scene (optional but nice)
    if (currentScene.value) {
        handleSelectBackground(asset);
    }
    // Mark project as dirty? We'll handle saving later; for now just local.
};

const handleDeleteBackground = (id: string) => {
    const assetToDelete = backgroundAssets.value.find(a => a.id === id);
    if (!assetToDelete) return;
    if (!confirm(`Delete background "${assetToDelete.name}"?`)) return;

    backgroundAssets.value = backgroundAssets.value.filter(a => a.id !== id);

    // If the current scene uses this background, clear it.
    if (currentScene.value && currentScene.value.background_image === assetToDelete.path) {
        currentScene.value.background_image = undefined;
        dirtyScenes.value.add(currentScene.value.id);
    }
};

const handleSelectBackground = (asset: BackgroundAsset) => {
    if (!currentScene.value) {
        // Optionally show a toast: "No scene selected"
        return;
    }
    currentScene.value.background_image = asset.path;
    dirtyScenes.value.add(currentScene.value.id);
    // Close the panel after selection (optional)
    showBackgroundLibrary.value = false;
};

const handleClearBackground = () => {
    if (!currentScene.value) return;
    currentScene.value.background_image = undefined;
    dirtyScenes.value.add(currentScene.value.id);
    showBackgroundLibrary.value = false;
};

// Same demo-mode fallback used inside BackgroundLibPanel — blob/data/http render
// directly, anything else (seeded dummy filenames) falls back to a placeholder.
const getBackgroundImageSrc = (path: string) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) {
        return path;
    }
    return `https://picsum.photos/seed/${encodeURIComponent(path)}/64/64`;
};

// Drives the chip next to the scene name in the header
const currentSceneBackgroundThumb = computed(() => {
    const path = currentScene.value?.background_image;
    return path ? getBackgroundImageSrc(path) : null;
});

const currentSceneBackgroundName = computed(() => {
    const path = currentScene.value?.background_image;
    if (!path) return null;
    const match = backgroundAssets.value.find(a => a.path === path);
    return match?.name ?? path;
});



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

.slide-enter-active,
.slide-leave-active {
    transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(100%);
}

.fade-backdrop-enter-active,
.fade-backdrop-leave-active {
    transition: opacity 0.2s ease;
}

.fade-backdrop-enter-from,
.fade-backdrop-leave-to {
    opacity: 0;
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