<template>
    <div class="dialogue-editor" id="dialogue-editor">
        <!-- Main container for side-by-side layout -->
        <div class="editor-layout" id="editor-layout">
            <!-- Left panel: Dialogue History Component -->
            <DialogueHistory :dialogue-lines="dialogueLines" :selected-line-index="selectedLineIndex"
                :is-dirty="isDirty" @select-line="handleSelectLine" @edit-line="startEdit"
                @delete-line="handleDeleteLine" @update-line-position="handleUpdateLinePosition" />

            <!-- Right panel: Speaker Selection and Input -->
            <div class="input-panel" id="input-panel">
                <!-- Speaker Selection Section -->
                <div class="speaker-section" id="speaker-section">
                    <div class="section-header" id="speaker-section-header">
                        <h4 id="speaker-section-title">Speaker & Expression</h4>
                    </div>
                    <div class="speaker-input" id="speaker-input">
                        <CastSelector v-model="currentSpeaker" :characters="characters"
                            :scene-character-ids="sceneCharacterIds" label="Select Speaker"
                            @update:modelValue="handleSpeakerChange" @expression-change="handleExpressionChange"
                            @outfit-change="handleOutfitChange" id="cast-selector" />
                    </div>
                </div>

                <!-- Dialogue Input Section -->
                <div class="dialogue-input-section" id="dialogue-input-section">
                    <div class="section-header" id="dialogue-input-header">
                        <h4 id="dialogue-input-title">Dialogue Text</h4>
                    </div>
                    <div class="textarea-wrapper" id="textarea-wrapper">
                        <textarea ref="textAreaRef" v-model="currentText" placeholder="Type dialogue here..."
                            @keydown.enter.prevent="addLine" rows="4" class="dialogue-textarea"
                            id="dialogue-textarea" />
                        <div class="textarea-hint" id="textarea-hint">
                            Press Enter to submit, Shift+Enter for new line
                        </div>
                    </div>

                    <div class="input-actions" id="input-actions">
                        <button v-if="!isEditing" class="btn primary" @click="addLine" :disabled="!currentText.trim()"
                            id="add-line-btn">
                            Add Line
                        </button>
                        <button v-else class="btn primary" @click="updateLine" :disabled="!currentText.trim()"
                            id="update-line-btn">
                            Update Line
                        </button>
                        <button v-if="isEditing" class="btn secondary" @click="cancelEdit" id="cancel-edit-btn">
                            Cancel
                        </button>
                        <button class="btn secondary" @click="$emit('add-menu')" id="add-menu-btn">
                            Add Menu Choice
                        </button>
                        <button class="btn secondary" @click="$emit('add-action')" id="add-action-btn">
                            Add Action
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue';
import CastSelector from '@/components/scene/CastSelector.vue';
import DialogueHistory from '@/components/scene/DialogueHistory.vue';
import type { DialogueLine, Character } from '@/types/models';
import type { ImagePosition } from '@/components/scene/ImagePositionSelector.vue';

interface Props {
    dialogueLines: DialogueLine[];
    characters: Character[];
    selectedLineIndex?: number | null;
    selectedSpeakerId?: string | null;
    isDirty?: boolean;
    sceneCharacterIds?: string[];
}

interface Emits {
    (e: 'add-line', line: DialogueLine): void;
    (e: 'edit-line', payload: { index: number; line: DialogueLine }): void;
    (e: 'delete-line', index: number): void;
    (e: 'select-line', index: number | null): void;
    (e: 'speaker-change', characterId: string | null): void;
    (e: 'add-menu'): void;
    (e: 'add-action'): void;
    (e: 'update-line-position', payload: { index: number; position: ImagePosition | undefined }): void;
}

const props = withDefaults(defineProps<Props>(), {
    selectedLineIndex: null,
    selectedSpeakerId: null,
    sceneCharacterIds: undefined
});

const emit = defineEmits<Emits>();

// Form state
const currentSpeaker = ref('');
const currentExpression = ref('');
const currentText = ref('');
const currentOutfit = ref('');
const textAreaRef = ref<HTMLTextAreaElement>();
const isEditing = ref(false);
const editingIndex = ref<number | null>(null);

// --- Event Handlers ---

const resetForm = () => {
    currentText.value = '';
    currentExpression.value = '';
    currentOutfit.value = '';
    nextTick(() => {
        textAreaRef.value?.focus();
    });
};

const cancelEdit = () => {
    isEditing.value = false;
    editingIndex.value = null;
    resetForm();
    emit('select-line', null);
};

const handleSpeakerChange = (characterId: string) => {
    currentSpeaker.value = characterId;
    emit('speaker-change', characterId || null);
};

const handleExpressionChange = (expression: string) => {
    currentExpression.value = expression;
};

const handleOutfitChange = (outfit: string) => {
    currentOutfit.value = outfit;
    console.log('Outfit changed:', outfit);
};

const handleSelectLine = (index: number | null) => {
    emit('select-line', index);
};

const handleDeleteLine = (index: number) => {
    emit('delete-line', index);
};

const handleUpdateLinePosition = (payload: { index: number; position: ImagePosition | undefined }) => {
    emit('update-line-position', payload);
};

const addLine = () => {
    if (!currentText.value.trim()) return;

    const character = props.characters.find(c => c.id === currentSpeaker.value);

    const newLine: DialogueLine = {
        id: Date.now().toString(),
        character: character ? {
            id: character.id,
            name: character.name,
            color: character.color
        } : null,
        text: currentText.value,
        expression: currentExpression.value || undefined,
        outfit: currentOutfit.value || undefined,
        order: props.dialogueLines.length + 1
    };

    emit('add-line', newLine);
    resetForm();
};

const updateLine = () => {
    if (!currentText.value.trim() || editingIndex.value === null) return;

    const character = props.characters.find(c => c.id === currentSpeaker.value);
    const existingLine = props.dialogueLines[editingIndex.value];

    if (!existingLine) return;

    const updatedLine: DialogueLine = {
        id: existingLine.id,
        character: character ? {
            id: character.id,
            name: character.name,
            color: character.color
        } : null,
        text: currentText.value,
        expression: currentExpression.value || undefined,
        outfit: currentOutfit.value || undefined,
        order: existingLine.order,
        image_position: existingLine.image_position
    };

    emit('edit-line', { index: editingIndex.value, line: updatedLine });
    resetForm();
    cancelEdit();
};

const startEdit = (index: number) => {
    emit('select-line', index);
};

// --- Watchers ---

// Watch for speaker changes from parent
watch(() => props.selectedSpeakerId, (newSpeakerId) => {
    currentSpeaker.value = newSpeakerId || '';
}, { immediate: true });

// Watch for line selection
watch(() => props.selectedLineIndex, (index) => {
    if (index !== null && index !== undefined && index >= 0 && index < props.dialogueLines.length) {
        const line = props.dialogueLines[index];
        if (line) {
            currentSpeaker.value = line.character?.id || '';
            currentText.value = line.text;
            currentExpression.value = line.expression || '';
            currentOutfit.value = (line as any).outfit || '';
            isEditing.value = true;
            editingIndex.value = index;
        }
    } else {
        cancelEdit();
        currentSpeaker.value = props.selectedSpeakerId || '';
        currentOutfit.value = '';
    }
}, { immediate: true });
</script>

<style scoped>
.dirty-indicator {
    color: #38bdf8;
    font-weight: bold;
}

.dialogue-editor {
    height: 100%;
    padding: 1.5rem;
    box-sizing: border-box;
}

/* Main layout container */
.editor-layout {
    display: flex;
    gap: 1.5rem;
    height: 100%;
    min-height: 500px;
}

/* Right panel styles */
.input-panel {
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    min-width: 300px;
}

.speaker-section,
.dialogue-input-section {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
}

.speaker-section {
    flex-shrink: 0;
}

.dialogue-input-section {
    flex: 1;
}

.section-header {
    margin-bottom: 1rem;
}

.section-header h4 {
    color: #f8fafc;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
}

.speaker-input {
    flex: 1;
}

/* Textarea styles */
.textarea-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.dialogue-textarea {
    flex: 1;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 1rem;
    color: #f8fafc;
    font-size: 1rem;
    resize: none;
    min-height: 120px;
    transition: border-color 0.2s;
    box-sizing: border-box;
    font-family: inherit;
}

.dialogue-textarea:focus {
    outline: none;
    border-color: #38bdf8;
}

.textarea-hint {
    font-size: 0.75rem;
    color: #64748b;
    text-align: right;
    margin-top: 0.25rem;
    padding-right: 0.25rem;
}

/* Button styles */
.input-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 1rem;
}

.btn {
    padding: 0.75rem 1.25rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    font-size: 0.9rem;
    flex: 1;
    min-width: 120px;
}

.primary {
    background: #38bdf8;
    color: #020617;
}

.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.secondary {
    background: #1e293b;
    color: #e2e8f0;
    border: 1px solid #334155;
}

.btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
}

/* Responsive design */
@media (max-width: 1024px) {
    .editor-layout {
        flex-direction: column;
        gap: 1rem;
    }

    .input-panel {
        min-height: 300px;
    }

    .input-panel {
        flex-direction: row;
        gap: 1rem;
    }

    .speaker-section {
        flex: 1;
    }

    .dialogue-input-section {
        flex: 2;
    }
}

@media (max-width: 768px) {
    .dialogue-editor {
        padding: 1rem;
    }

    .input-panel {
        flex-direction: column;
    }

    .btn {
        min-width: 100px;
        padding: 0.6rem 1rem;
        font-size: 0.85rem;
    }

    .input-actions {
        gap: 0.5rem;
    }

    .editor-layout {
        gap: 1rem;
    }
}

@media (max-height: 700px) {
    .dialogue-textarea {
        min-height: 80px;
    }
}
</style>