<template>
    <div class="dialogue-editor">
        <!-- Dialogue History -->
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
                    <button class="icon-btn" @click.stop="$emit('edit-line', index)" title="Edit">
                        ✏️
                    </button>
                    <button class="icon-btn danger" @click.stop="$emit('delete-line', index)" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        </div>

        <!-- Dialogue Input -->
        <div class="dialogue-input">
            <div class="input-header">
                <SpeakerSelect v-model="currentSpeaker" :characters="characters" label="Speaker"
                    @update:modelValue="handleSpeakerChange" @expression-change="handleExpressionChange" />
            </div>

            <textarea ref="textAreaRef" v-model="currentText" placeholder="Type dialogue here..."
                @keydown.enter.prevent="addLine" rows="3" class="dialogue-textarea" />

            <div class="input-actions">
                <button class="btn primary" @click="addLine" :disabled="!currentText.trim()">
                    Add Line
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
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue';
import SpeakerSelect from '@/components/Project/SpeakerSelect.vue';
import type { DialogueLine, Character } from '@/types';

interface Props {
    dialogueLines: DialogueLine[];
    characters: Character[];
    selectedLineIndex?: number | null;
    selectedSpeakerId?: string | null;
}

interface Emits {
    (e: 'add-line', line: DialogueLine): void;
    (e: 'edit-line', index: number): void;
    (e: 'delete-line', index: number): void;
    (e: 'select-line', index: number): void;
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

    // Reset form
    currentText.value = '';
    currentExpression.value = '';

    // Focus textarea
    nextTick(() => {
        textAreaRef.value?.focus();
    });
};

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

// Safely handle line selection
watch(() => props.selectedLineIndex, (index) => {
    if (index !== null && index !== undefined && index >= 0 && index < props.dialogueLines.length) {
        const line = props.dialogueLines[index];
        if (line) {
            currentSpeaker.value = line.character?.id || '';
            currentText.value = line.text;
            currentExpression.value = line.expression || '';
        }
    } else {
        // Reset form when no line is selected
        currentSpeaker.value = props.selectedSpeakerId || '';
        currentText.value = '';
        currentExpression.value = '';
    }
}, { immediate: true });
</script>

<style scoped>
/* Keep your existing styles */
.dialogue-editor {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    height: 100%;
}

.dialogue-history {
    flex: 1;
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.5rem;
    overflow-y: auto;
    max-height: 400px;
}

.dialogue-line {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
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
}

.speaker {
    font-weight: bold;
    font-size: 1.1rem;
}

.expression {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #94a3b8;
}

.expression-name {
    font-size: 0.85rem;
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

/* Dialogue Input */
.dialogue-input {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.5rem;
}

.input-header {
    margin-bottom: 1rem;
}

.dialogue-textarea {
    width: 100%;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 1rem;
    color: #f8fafc;
    font-size: 1rem;
    resize: vertical;
    min-height: 80px;
    margin-bottom: 1rem;
    transition: border-color 0.2s;
}

.dialogue-textarea:focus {
    outline: none;
    border-color: #38bdf8;
}

.input-actions {
    display: flex;
    gap: 0.75rem;
}

.btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    font-size: 0.9rem;
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
</style>