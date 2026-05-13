<template>
    <div id="scene-editor-layout" class="flex h-screen bg-gray-950">
        <!-- Left Panel -->
        <ProjectSidebar :id="`project-sidebar-${route.params.id}`"
            :characters="projectCharacters" :scenes="scenes" :selected-character-id="selectedCharacterId"
            :dirty-scene-ids="dirtyScenes" @select-character="handleSelectCharacter"
            @remove-character="handleRemoveCharacter" @add-character="addCharacterToProject" @select-scene="selectScene"
            @add-scene="handleAddScene" @delete-scene="handleDeleteScene" @update-scene="handleUpdateScene" />

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
                <SceneWorkspace id="scene-workspace-component" :key="currentScene?.id" :dialogue-lines="dialogueLines"
                    :characters="projectCharacters" :selected-line-index="selectedLineIndex"
                    :selected-speaker-id="selectedCharacterId"
                    :is-dirty="currentScene ? dirtyScenes.has(currentScene.id) : false"
                    :scene-character-ids="currentScene?.character_ids" @add-line="addDialogueLine"
                    @edit-line="handleEditLine" @delete-line="deleteDialogueLine" @select-line="selectLine"
                    @speaker-change="handleSpeakerChange" @add-menu="addMenuChoice" @add-action="addAction" />
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ProjectSidebar from '@/components/scene/ProjectSidebar.vue';
import SceneWorkspace from '@/components/scene/SceneWorkspace.vue';
import {
    dummyCharacters,
    dummyScenes,
    dummyDialogueLines,
    dummyProjects,
    type Character,
    type DialogueLine,
    type Scene,
} from '@/utils/dummyData';

const route = useRoute();
const router = useRouter();

// State
const selectedCharacterId = ref<string | null>(null);
const selectedLineIndex = ref<number | null>(null);
const currentScene = ref<Scene | null>(null);
const dialogueLines = ref<DialogueLine[]>([...dummyDialogueLines]);
const scenes = ref<Scene[]>([...dummyScenes]);
const sceneDialogueCache = ref<Record<string, DialogueLine[]>>({});
const dirtyScenes = ref<Set<string>>(new Set());
const isLoading = ref(false);
const error = ref<string | null>(null);
const autoSaveTimer = ref<number | null>(null);

// Computed
const projectCharacters = ref<Character[]>([...dummyCharacters]);

const currentProject = computed(() =>
    dummyProjects.find(p => p.id === route.params.id) ?? null
);

const selectedCharacter = computed<Character | null>(() =>
    selectedCharacterId.value
        ? projectCharacters.value.find(c => c.id === selectedCharacterId.value) || null
        : null
);

const hasUnsavedChanges = computed(() => {
    return currentScene.value ? dirtyScenes.value.has(currentScene.value.id) : false;
});

// Methods
const handleSelectCharacter = (character: Character) => {
    selectedCharacterId.value = character.id;
    selectedLineIndex.value = null;
};

const handleSpeakerChange = (characterId: string | null) => {
    selectedCharacterId.value = characterId;
};

const addCharacterToProject = () => {
    console.log('Opening character selection modal');
    alert('Character selection modal coming soon!');
};

const handleRemoveCharacter = (characterId: string) => {
    if (confirm(`Remove this character from the project?`)) {
        // Remove from project roster
        projectCharacters.value = projectCharacters.value.filter(c => c.id !== characterId);
        // Cascade — unassign from all scenes too
        scenes.value = scenes.value.map(s => ({
            ...s,
            character_ids: s.character_ids.filter(id => id !== characterId)
        }));
        // Clear selection if that character was selected
        if (selectedCharacterId.value === characterId) {
            selectedCharacterId.value = null;
        }
        // Mark scenes as dirty
        scenes.value.forEach(s => {
            if (s.character_ids.includes(characterId) === false) {
                dirtyScenes.value.add(s.id);
            }
        });
    }
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

const handleAddScene = (scene: Scene) => {
    scenes.value.push(scene);
    sceneDialogueCache.value[scene.id] = [];
    selectScene(scene);
};

const handleDeleteScene = (sceneId: string) => {
    if (confirm('Delete this scene? This cannot be undone.')) {
        scenes.value = scenes.value.filter(s => s.id !== sceneId);
        delete sceneDialogueCache.value[sceneId];
        dirtyScenes.value.delete(sceneId);
        if (currentScene.value?.id === sceneId) {
            currentScene.value = null;
            dialogueLines.value = [];
            selectedLineIndex.value = null;
            selectedCharacterId.value = null;
        }
    }
};

const handleUpdateScene = (scene: Scene) => {
    const index = scenes.value.findIndex(s => s.id === scene.id);
    if (index !== -1) {
        scenes.value[index] = scene;
    }
    if (currentScene.value?.id === scene.id) {
        currentScene.value = scene;
    }
};

const addDialogueLine = (line: DialogueLine) => {
    const newLine: DialogueLine = {
        ...line,
        id: `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        order: dialogueLines.value.length + 1
    };
    dialogueLines.value.push(newLine);
    selectedLineIndex.value = dialogueLines.value.length - 1;
    selectedCharacterId.value = line.character?.id || null;
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);

    // Trigger auto-save
    scheduleAutoSave();
};

const handleEditLine = (payload: { index: number; line: DialogueLine }) => {
    const { index, line } = payload;
    dialogueLines.value[index] = line;
    selectedLineIndex.value = null;
    selectedCharacterId.value = line.character?.id || null;
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);

    // Trigger auto-save
    scheduleAutoSave();
};

const deleteDialogueLine = (index: number) => {
    if (confirm('Delete this dialogue line?')) {
        dialogueLines.value.splice(index, 1);
        selectedLineIndex.value = null;
        dialogueLines.value.forEach((line, idx) => { line.order = idx + 1; });
        if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);

        // Trigger auto-save
        scheduleAutoSave();
    }
};

const selectLine = (index: number | null) => {
    selectedLineIndex.value = index;
    if (index !== null && index >= 0 && index < dialogueLines.value.length) {
        selectedCharacterId.value = dialogueLines.value[index]?.character?.id ?? null;
    } else {
        selectedCharacterId.value = null;
    }
};

const addMenuChoice = () => {
    console.log('Adding menu choice');
    alert('Menu choice feature coming soon!');
};

const addAction = () => {
    console.log('Adding action');
    alert('Action feature coming soon!');
};

const saveScene = async () => {
    if (!currentScene.value) return;

    isLoading.value = true;

    try {
        const id = currentScene.value.id;
        const index = scenes.value.findIndex(s => s.id === id);

        if (index !== -1) {
            const updated: Scene = {
                ...scenes.value[index]!,
                dialogue_lines: [...dialogueLines.value],
                updated_at: new Date().toISOString()
            };
            scenes.value[index] = updated;
            currentScene.value = updated;
        }

        delete sceneDialogueCache.value[id];
        dirtyScenes.value.delete(id);

        console.log(`Scene "${currentScene.value.name}" saved successfully`);

        // Show temporary success indicator
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

// Reset state (for testing)
const resetState = () => {
    selectedCharacterId.value = null;
    selectedLineIndex.value = null;
    currentScene.value = null;
    dialogueLines.value = [...dummyDialogueLines];
    scenes.value = [...dummyScenes];
    sceneDialogueCache.value = {};
    dirtyScenes.value.clear();
    error.value = null;

    if (autoSaveTimer.value) {
        clearTimeout(autoSaveTimer.value);
        autoSaveTimer.value = null;
    }
};

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveScene();
    }
    // Ctrl/Cmd + Z to undo
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        undo();
    }
};

// Lifecycle
onMounted(() => {
    console.log('Scene Editor mounted for project:', route.params.id);
    window.addEventListener('keydown', handleKeydown);

    // Load any auto-saved draft from localStorage
    const draft = localStorage.getItem(`scene_draft_${route.params.id}`);
    if (draft) {
        try {
            const parsed = JSON.parse(draft);
            if (parsed.timestamp && Date.now() - parsed.timestamp < 60000) {
                console.log('Found recent draft, restoring...');
                // Restore logic here
            }
        } catch (err) {
            console.error('Failed to load draft:', err);
        }
    }
});

onUnmounted(() => {
    // Auto-save before unmounting
    autoSaveCurrentScene();
    window.removeEventListener('keydown', handleKeydown);
    if (autoSaveTimer.value) {
        clearTimeout(autoSaveTimer.value);
    }
});

// Watch for project ID changes
watch(() => route.params.id, () => {
    console.log('Project ID changed, reloading...');
    resetState();
});

// Expose for testing in development
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
/* Only custom styles that can't be easily done with Tailwind */
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

/* Custom scrollbar for workspace */
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