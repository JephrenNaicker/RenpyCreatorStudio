<template>
    <div class="dashboard-layout">
        <!-- Left Panel -->
        <CharacterSidebar :characters="projectCharacters" :scenes="scenes" :selected-character-id="selectedCharacterId"
            @select-character="handleSelectCharacter" @add-character="addCharacterToProject" @select-scene="selectScene"
            @add-scene="handleAddScene" @delete-scene="handleDeleteScene" @update-scene="handleUpdateScene" />

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
                <DialogueEditor :dialogue-lines="dialogueLines" :characters="projectCharacters"
                    :selected-line-index="selectedLineIndex" :selected-speaker-id="selectedCharacterId"
                    @add-line="addDialogueLine" @edit-line="handleEditLine" @delete-line="deleteDialogueLine"
                    @select-line="selectLine" @speaker-change="handleSpeakerChange" @add-menu="addMenuChoice"
                    @add-action="addAction" />
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import CharacterSidebar from '@/components/Project/CharacterSidebar.vue';
import DialogueEditor from '@/components/Project/DialogueEditor.vue';
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
    currentScene.value = scene;
    dialogueLines.value = [...(scene.dialogue_lines || [])];
    selectedLineIndex.value = null;
};

const handleAddScene = (scene: Scene) => {
    scenes.value.push(scene);
    selectScene(scene);
};

const handleDeleteScene = (sceneId: string) => {
    scenes.value = scenes.value.filter(s => s.id !== sceneId);
    if (currentScene.value?.id === sceneId) {
        currentScene.value = null;
        dialogueLines.value = [];
        selectedLineIndex.value = null;
    }
};

const handleUpdateScene = (scene: Scene) => {
    const index = scenes.value.findIndex(s => s.id === scene.id);
    if (index !== -1) scenes.value[index] = scene;
    if (currentScene.value?.id === scene.id) currentScene.value = scene;
};

const addDialogueLine = (line: DialogueLine) => {
    const newLine = { ...line, id: Date.now().toString(), order: dialogueLines.value.length + 1 };
    dialogueLines.value.push(newLine);
    selectedLineIndex.value = dialogueLines.value.length - 1;
    selectedCharacterId.value = line.character?.id || null;
};

const handleEditLine = (payload: { index: number; line: DialogueLine }) => {
    const { index, line } = payload;
    dialogueLines.value[index] = line;
    selectedLineIndex.value = null;
    selectedCharacterId.value = line.character?.id || null;
};

const deleteDialogueLine = (index: number) => {
    if (confirm('Delete this dialogue line?')) {
        dialogueLines.value.splice(index, 1);
        selectedLineIndex.value = null;
        dialogueLines.value.forEach((line, idx) => { line.order = idx + 1; });
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
    console.log('Saving scene:', { scene: currentScene.value, dialogue: dialogueLines.value });
    alert('Scene saved!');
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