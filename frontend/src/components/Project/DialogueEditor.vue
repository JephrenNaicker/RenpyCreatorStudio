<template>
    <div class="dialogue-editor">
        <!-- Main container for side-by-side layout -->
        <div class="editor-layout">
            <!-- Left panel: Dialogue History -->
            <div class="dialogue-history-container">
                <div class="dialogue-history-header">
                    <h4>Dialogue History</h4>
                    <span class="line-count">{{ dialogueLines.length }} lines</span>
                </div>
                <div class="dialogue-history">
                    <div v-for="(line, index) in dialogueLines" :key="line.id || index" class="dialogue-line" :class="{
                        narrator: !line.character,
                        selected: selectedLineIndex === index
                    }" @click="$emit('select-line', index)">
                        <div class="line-header">
                            <div class="speaker" :style="{ color: line.character?.color || '#94a3b8' }">
                                {{ line.character?.name || 'Narrator' }}
                            </div>
                            <div v-if="line.expression" class="expression">
                                {{ getExpressionEmoji(line.expression) }}
                                <span class="expression-name">{{ line.expression }}</span>
                            </div>
                        </div>
                        <div class="text">{{ line.text }}</div>
                        <div class="line-actions">
                            <button class="icon-btn" @click.stop="startEdit(index)" title="Edit">
                                ✏️
                            </button>
                            <button class="icon-btn danger" @click.stop="$emit('delete-line', index)" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right panel: Speaker Selection and Input -->
            <div class="input-panel">
                <!-- Speaker Selection Section -->
                <div class="speaker-section">
                    <div class="section-header">
                        <h4>Speaker & Expression</h4>
                    </div>
                    <div class="speaker-input">
                        <SpeakerSelect v-model="currentSpeaker" :characters="characters" label="Select Speaker"
                            @update:modelValue="handleSpeakerChange" @expression-change="handleExpressionChange" />
                    </div>
                </div>

                <!-- Dialogue Input Section -->
                <div class="dialogue-input-section">
                    <div class="section-header">
                        <h4>Dialogue Text</h4>
                    </div>
                    <div class="textarea-wrapper">
                        <textarea ref="textAreaRef" v-model="currentText" placeholder="Type dialogue here..."
                            @keydown.enter.prevent="addLine" rows="4" class="dialogue-textarea" />
                        <div class="textarea-hint">
                            Press Enter to submit, Shift+Enter for new line
                        </div>
                    </div>

                    <div class="input-actions">
                        <button v-if="!isEditing" class="btn primary" @click="addLine" :disabled="!currentText.trim()">
                            Add Line
                        </button>
                        <button v-else class="btn primary" @click="updateLine" :disabled="!currentText.trim()">
                            Update Line
                        </button>
                        <button v-if="isEditing" class="btn secondary" @click="cancelEdit">
                            Cancel
                        </button>
                        <button class="btn secondary" @click="$emit('add-menu')">
                            Add Menu Choice
                        </button>
                        <button class="btn secondary" @click="$emit('add-action')">
                            Add Action
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import SpeakerSelect from '@/components/Project/SpeakerSelect.vue';
import type { DialogueLine, Character } from '@/utils/dummyData';

interface Props {
    dialogueLines: DialogueLine[];
    characters: Character[];
    selectedLineIndex?: number | null;
    selectedSpeakerId?: string | null;
}

interface Emits {
    (e: 'add-line', line: DialogueLine): void;
    (e: 'edit-line', payload: { index: number; line: DialogueLine }): void;
    (e: 'delete-line', index: number): void;
    (e: 'select-line', index: number | null): void;
    (e: 'speaker-change', characterId: string | null): void;
    (e: 'add-menu'): void;
    (e: 'add-action'): void;
}

const props = withDefaults(defineProps<Props>(), {
    selectedLineIndex: null,
    selectedSpeakerId: null
});

const emit = defineEmits<Emits>();

const currentSpeaker = ref('');
const currentExpression = ref('');
const currentText = ref('');
const textAreaRef = ref<HTMLTextAreaElement>();
const isEditing = ref(false);
const editingIndex = ref<number | null>(null);

// Watch for speaker changes from parent
watch(() => props.selectedSpeakerId, (newSpeakerId) => {
    currentSpeaker.value = newSpeakerId || '';
}, { immediate: true });

const handleSpeakerChange = (characterId: string) => {
    currentSpeaker.value = characterId;
    emit('speaker-change', characterId || null);
};

const handleExpressionChange = (expression: string) => {
    currentExpression.value = expression;
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
        } : undefined,
        text: currentText.value,
        expression: currentExpression.value || undefined,
        order: props.dialogueLines.length + 1
    };

    emit('add-line', newLine);
    resetForm();
};

const updateLine = () => {
    if (!currentText.value.trim() || editingIndex.value === null) return;

    const character = props.characters.find(c => c.id === currentSpeaker.value);
    const existingLine = props.dialogueLines[editingIndex.value];

    if (!existingLine) return; // Safety check

    const updatedLine: DialogueLine = {
        id: existingLine.id,
        character: character ? {
            id: character.id,
            name: character.name,
            color: character.color
        } : undefined,
        text: currentText.value,
        expression: currentExpression.value || undefined,
        order: existingLine.order
    };

    // Emit edit event to parent
    emit('edit-line', { index: editingIndex.value, line: updatedLine });
    resetForm();
    cancelEdit();
};

const startEdit = (index: number) => {
    emit('select-line', index); // Let parent handle the selection/editing
};

const cancelEdit = () => {
    isEditing.value = false;
    editingIndex.value = null;
    resetForm();
    emit('select-line', null); // Deselect line
};

const resetForm = () => {
    currentText.value = '';
    currentExpression.value = '';
    nextTick(() => {
        textAreaRef.value?.focus();
    });
};

// Safely handle line selection
watch(() => props.selectedLineIndex, (index) => {
    if (index !== null && index !== undefined && index >= 0 && index < props.dialogueLines.length) {
        const line = props.dialogueLines[index];
        if (line) {
            currentSpeaker.value = line.character?.id || '';
            currentText.value = line.text;
            currentExpression.value = line.expression || '';
            isEditing.value = true;
            editingIndex.value = index;
        }
    } else {
        // Reset form when no line is selected
        cancelEdit();
        currentSpeaker.value = props.selectedSpeakerId || '';
    }
}, { immediate: true });

const getExpressionEmoji = (expression: string) => {
    const emojiMap: Record<string, string> = {
        'happy': '😊',
        'sad': '😢',
        'angry': '😠',
        'surprised': '😲',
        'neutral': '😐',
        'smile': '😄',
        'concerned': '😟',
        'serious': '😐',
        'mysterious': '🕵️',
        'determined': '💪',
        'excited': '🤩',
        'tired': '😴',
        'confused': '😕',
        'thinking': '🤔'
    };
    return emojiMap[expression] || '😀';
};
</script>

<style scoped>
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

/* Left panel: Dialogue History */
.dialogue-history-container {
    flex: 3;
    /* 3 parts for history */
    display: flex;
    flex-direction: column;
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    overflow: hidden;
    min-width: 300px;
}

.dialogue-history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid #334155;
    flex-shrink: 0;
}

.dialogue-history-header h4 {
    color: #f8fafc;
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

.line-count {
    color: #94a3b8;
    font-size: 0.85rem;
    background: rgba(56, 189, 248, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
}

.dialogue-history {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

/* Right panel: Input Section */
.input-panel {
    flex: 2;
    /* 2 parts for input */
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

/* Shared styles for dialogue lines */
.dialogue-line {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.2s;
    cursor: pointer;
}

.dialogue-line:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(56, 189, 248, 0.3);
}

.dialogue-line.selected {
    background: rgba(56, 189, 248, 0.1);
    border-color: #38bdf8;
}

.dialogue-line.narrator {
    border-left: 3px solid #475569;
}

.line-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.speaker {
    font-weight: bold;
    font-size: 1rem;
}

.expression {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #94a3b8;
}

.expression-name {
    font-size: 0.8rem;
    opacity: 0.8;
}

.text {
    color: #cbd5e1;
    line-height: 1.5;
    font-size: 1rem;
    padding: 0.5rem 0;
}

.line-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    opacity: 0;
    transition: opacity 0.2s;
}

.dialogue-line:hover .line-actions {
    opacity: 1;
}

.icon-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.25rem;
    font-size: 0.9rem;
    border-radius: 4px;
    transition: all 0.2s;
}

.icon-btn:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.1);
}

.icon-btn.danger:hover {
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
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

    .dialogue-history-container,
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
    .dialogue-line {
        gap: 0.25rem;
        margin-bottom: 0.75rem;
        padding: 0.75rem;
    }

    .dialogue-history {
        padding: 0.75rem;
    }
}
</style>