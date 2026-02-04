<template>
    <div class="dashboard">
        <!-- Left Panel -->
        <CharacterSidebar :characters="projectCharacters" :scenes="scenes" :selected-character-id="selectedCharacterId"
            @select-character="handleSelectCharacter" @add-character="addCharacterToProject"
            @select-scene="selectScene" />

        <!-- Main Panel -->
        <main class="workspace">
            <div class="workspace-header">
                <h2>
                    {{ selectedCharacter ? `Writing as ${selectedCharacter.name}` : 'Continue Writing' }}
                    <span v-if="currentScene" class="scene-badge">
                        🎬 {{ currentScene.name }}
                    </span>
                </h2>

                <div class="quick-tools">
                    <button class="tool-btn" @click="saveScene">
                        💾 Save Scene
                    </button>
                    <button class="tool-btn" @click="exportScene">
                        📤 Export
                    </button>
                    <button class="tool-btn" @click="undo">
                        ↩️ Undo
                    </button>
                </div>
            </div>

            <div class="workspace-content">
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import CharacterSidebar from '@/components/Project/CharacterSidebar.vue';
import DialogueEditor from '@/components/Project/DialogueEditor.vue';
// Import everything from dummyData.ts (your single source)
import {
    dummyCharacters,
    dummyScenes,
    dummyDialogueLines,
    type Character,
    type DialogueLine,
    type Scene,
    type Project
} from '@/utils/dummyData';

const route = useRoute();

// State - use the dummy data
const selectedCharacterId = ref<string | null>(null);
const selectedLineIndex = ref<number | null>(null);
const currentScene = ref<Scene | null>(null);
const dialogueLines = ref<DialogueLine[]>([...dummyDialogueLines]);

// IMPORTANT: Use the correct property names from dummyData.ts
const scenes = ref<Scene[]>([...dummyScenes]);

// Computed
const projectCharacters = computed(() => {
    return dummyCharacters;
});

const selectedCharacter = computed<Character | null>(() => {
    return selectedCharacterId.value
        ? projectCharacters.value.find(c => c.id === selectedCharacterId.value) || null
        : null;
});

// Watch for narrator selection
watch(() => selectedCharacterId.value, (newId) => {
    // Handle narrator selection if needed
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
    alert('Character selection modal coming soon!');
};

const selectScene = (scene: Scene) => {
    currentScene.value = scene;
    // Use dialogue_lines (from dummyData.ts structure)
    dialogueLines.value = [...(scene.dialogue_lines || [])];
    console.log('Loading scene:', scene);
};

const addDialogueLine = (line: DialogueLine) => {
    const newLine = {
        ...line,
        id: Date.now().toString(),
        order: dialogueLines.value.length + 1
    };
    dialogueLines.value.push(newLine);
    selectedLineIndex.value = dialogueLines.value.length - 1;

    // Update speaker selection
    if (line.character) {
        selectedCharacterId.value = line.character.id;
    } else {
        selectedCharacterId.value = null; // Narrator
    }
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
        // Update orders
        dialogueLines.value.forEach((line, idx) => {
            line.order = idx + 1;
        });
    }
};

const selectLine = (index: number | null) => {
    selectedLineIndex.value = index;
    if (index !== null && index >= 0 && index < dialogueLines.value.length) {
        const line = dialogueLines.value[index];
        selectedCharacterId.value = line?.character?.id ?? null;
    } else {
        selectedCharacterId.value = null;
    }
};

const addMenuChoice = () => {
    alert('Menu choice feature coming soon!');
};

const addAction = () => {
    alert('Action feature coming soon!');
};

const saveScene = () => {
    console.log('Saving scene:', {
        scene: currentScene.value,
        dialogue: dialogueLines.value
    });
    alert('Scene saved!');
};

const exportScene = () => {
    alert('Export feature coming soon!');
};

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

<style scoped>
/* Keep your existing styles, they're good */
.workspace {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    overflow: hidden;
}

.dialogue-editor-wrapper {
    flex: 1;
    min-height: 0;
    overflow: hidden;
}

.dashboard {
    display: grid;
    grid-template-columns: 260px 1fr;
    height: calc(100vh - 64px);
}

.workspace {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0f172a;
    overflow: hidden;
}

.workspace-header {
    padding: 1.5rem 1.5rem 0;
}

.workspace-header h2 {
    color: #f8fafc;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
}

.scene-badge {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 500;
}

.quick-tools {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.tool-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    color: #cbd5e1;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.tool-btn:hover {
    background: rgba(56, 189, 248, 0.2);
    border-color: #38bdf8;
    color: #f8fafc;
}

.workspace-content {
    flex: 1;
    min-height: 0;
    /* Crucial for scrolling */
    overflow-y: auto;
    /* Enable scrolling here */
}

/* Add custom scrollbar for workspace */
.workspace-content::-webkit-scrollbar {
    width: 8px;
}

.workspace-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}

.workspace-content::-webkit-scrollbar-thumb {
    background: #475569;
    border-radius: 4px;
}

.workspace-content::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}
</style>