<template>
    <div class="dashboard-layout">
        <!-- Left Panel -->
        <CharacterSidebar :characters="projectCharacters" :scenes="scenes" :selected-character-id="selectedCharacterId"
            :dirty-scene-ids="dirtyScenes" @select-character="handleSelectCharacter"
            @add-character="addCharacterToProject" @select-scene="selectScene" @add-scene="handleAddScene"
            @delete-scene="handleDeleteScene" @update-scene="handleUpdateScene" />

        <!-- Main Panel -->
        <main class="workspace-main">
            <div class="workspace-header">
                <h2 class="workspace-title">
                    {{ selectedCharacter ? `Writing as ${selectedCharacter.name}` : 'Continue Writing' }}
                    <span v-if="currentScene" class="scene-badge">
                        🎬 {{ currentScene.name }}
                    </span>
                </h2>

                <div class="flex gap-2 mb-6">
                    <button class="tool-btn" @click="saveScene">💾 Save Scene</button>
                    <button class="tool-btn" @click="exportScene">📤 Export</button>
                    <button class="tool-btn" @click="undo">↩️ Undo</button>
                </div>
            </div>

            <div class="workspace-content scrollbar-thin">
                <SceneWorkspace :dialogue-lines="dialogueLines" :characters="projectCharacters"
                    :selected-line-index="selectedLineIndex" :selected-speaker-id="selectedCharacterId"
                    :is-dirty="currentScene ? dirtyScenes.has(currentScene.id) : false"
                    :scene-character-ids="currentScene?.character_ids" @add-line="addDialogueLine"
                    @edit-line="handleEditLine" @delete-line="deleteDialogueLine" @select-line="selectLine"
                    @speaker-change="handleSpeakerChange" @add-menu="addMenuChoice" @add-action="addAction" />
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import CharacterSidebar from '@/components/scene/CharacterSidebar.vue';
import SceneWorkspace from '@/components/scene/SceneWorkspace.vue';
import {
    dummyCharacters,
    dummyScenes,
    dummyDialogueLines,
    type Character,
    type DialogueLine,
    type Scene,
} from '@/utils/dummyData';

const route = useRoute();

const selectedCharacterId = ref<string | null>(null);
const selectedLineIndex = ref<number | null>(null);
const currentScene = ref<Scene | null>(null);
const dialogueLines = ref<DialogueLine[]>([...dummyDialogueLines]);
const scenes = ref<Scene[]>([...dummyScenes]);
const sceneDialogueCache = ref<Record<string, DialogueLine[]>>({});
const dirtyScenes = ref<Set<string>>(new Set());

const projectCharacters = computed(() => dummyCharacters);

const selectedCharacter = computed<Character | null>(() =>
    selectedCharacterId.value
        ? projectCharacters.value.find(c => c.id === selectedCharacterId.value) || null
        : null
);

const handleSelectCharacter = (character: Character) => {
    selectedCharacterId.value = character.id;
    selectedLineIndex.value = null;
};

const handleSpeakerChange = (characterId: string | null) => {
    selectedCharacterId.value = characterId;
};

const addCharacterToProject = () => {
    alert('Character selection modal coming soon!');
};

const selectScene = (scene: Scene) => {
    // Save current scene's dialogue to cache before switching
    if (currentScene.value) {
        sceneDialogueCache.value[currentScene.value.id] = [...dialogueLines.value];
    }
    currentScene.value = scene;
    // Restore from cache if exists, else use scene's saved lines
    dialogueLines.value = [...(sceneDialogueCache.value[scene.id] ?? scene.dialogue_lines ?? [])];
    selectedLineIndex.value = null;
};

const handleAddScene = (scene: Scene) => {
    scenes.value.push(scene);
    sceneDialogueCache.value[scene.id] = [];
    selectScene(scene);
};

const handleDeleteScene = (sceneId: string) => {
    scenes.value = scenes.value.filter(s => s.id !== sceneId);
    delete sceneDialogueCache.value[sceneId];
    dirtyScenes.value.delete(sceneId);
    if (currentScene.value?.id === sceneId) {
        currentScene.value = null;
        dialogueLines.value = [];
        selectedLineIndex.value = null;
    }
};

const handleUpdateScene = (scene: Scene) => {
    const index = scenes.value.findIndex(s => s.id === scene.id);
    if (index !== -1) {
        // assert defined to satisfy strict indexing rules
        scenes.value[index] = scene;
    }
    if (currentScene.value?.id === scene.id) {
        currentScene.value = scene;
    }
};

const addDialogueLine = (line: DialogueLine) => {
    const newLine = { ...line, id: Date.now().toString(), order: dialogueLines.value.length + 1 };
    dialogueLines.value.push(newLine);
    selectedLineIndex.value = dialogueLines.value.length - 1;
    selectedCharacterId.value = line.character?.id || null;
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
};

const handleEditLine = (payload: { index: number; line: DialogueLine }) => {
    const { index, line } = payload;
    dialogueLines.value[index] = line;
    selectedLineIndex.value = null;
    selectedCharacterId.value = line.character?.id || null;
    if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
};

const deleteDialogueLine = (index: number) => {
    if (confirm('Delete this dialogue line?')) {
        dialogueLines.value.splice(index, 1);
        selectedLineIndex.value = null;
        dialogueLines.value.forEach((line, idx) => { line.order = idx + 1; });
        if (currentScene.value) dirtyScenes.value.add(currentScene.value.id);
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

const addMenuChoice = () => alert('Menu choice feature coming soon!');
const addAction = () => alert('Action feature coming soon!');

const saveScene = () => {
    if (!currentScene.value) return;
    const id = currentScene.value.id;
    const index = scenes.value.findIndex(s => s.id === id);
    if (index !== -1) {
        const updated: Scene = { ...scenes.value[index]!, dialogue_lines: [...dialogueLines.value] };
        scenes.value[index] = updated;
        currentScene.value = updated;
    }
    delete sceneDialogueCache.value[id];
    dirtyScenes.value.delete(id);
};

const exportScene = () => alert('Export feature coming soon!');

const undo = () => {
    if (dialogueLines.value.length > 0) {
        dialogueLines.value.pop();
        selectedLineIndex.value = null;
        selectedCharacterId.value = null;
    }
};

onMounted(() => {
    console.log('Project ID:', route.params.id);
});
</script>