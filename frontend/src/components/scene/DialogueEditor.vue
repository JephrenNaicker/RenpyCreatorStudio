<!-- frontend/src/components/scene/DialogueEditor.vue -->
<template>
    <div class="dialogue-editor" id="dialogue-editor">
        <!-- Main container for side-by-side layout -->
        <div class="editor-layout" id="editor-layout">
            <!-- Left panel: Dialogue History Component (dialogue lines + menu nodes) -->
            <DialogueHistory :dialogue-lines="dialogueLines" :selected-line-index="selectedLineIndex"
                :is-dirty="isDirty" @select-line="handleSelectLine" @edit-line="startEdit"
                @delete-line="handleDeleteLine" @update-line-position="handleUpdateLinePosition"
                @update-line-visibility="handleUpdateLineVisibility" @reorder-lines="handleReorderLines" />

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
                            :external-outfit="currentOutfit" :external-expression="currentExpression"
                            @update:modelValue="handleSpeakerChange" @expression-change="handleExpressionChange"
                            @outfit-change="handleOutfitChange" id="cast-selector" />
                    </div>
                </div>

                <!-- Dialogue Input Section -->
                <div v-if="mode === 'dialogue'" class="dialogue-input-section" id="dialogue-input-section">
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
                        <button class="btn secondary" @click="openMenuEditor" id="add-menu-btn">
                            Add Menu Choice
                        </button>
                        <button class="btn secondary" @click="openBackgroundEditor" id="add-background-btn">
                            🖼️ Change Background
                        </button>
                    </div>
                </div>

                <!-- Menu Choice Editor — swaps into the same slot -->
                <div v-else-if="mode === 'menu'" class="menu-input-section" id="menu-input-section">
                    <div class="section-header" id="menu-input-header">
                        <h4 id="menu-input-title">
                            {{ editingMenuNode ? 'Edit Menu Choice' : 'New Menu Choice' }}
                        </h4>
                    </div>
                    <MenuChoiceEditor :editing-node="editingMenuNode" :line-count="dialogueLines.length"
                        @add-menu="handleAddMenuNode" @update-menu="handleUpdateMenuNode" @cancel="closeMenuEditor"
                        id="menu-choice-editor" />
                </div>

                <!-- Background Change Editor — swaps into the same slot -->
                <div v-else class="menu-input-section" id="background-input-section">
                    <div class="section-header" id="background-input-header">
                        <h4 id="background-input-title">
                            {{ editingActionNode ? 'Edit Background Change' : 'New Background Change' }}
                        </h4>
                        <p class="text-xs text-slate-400 mt-1">
                            Pick a background — it takes effect from this point in the scene onward.
                        </p>
                    </div>

                    <div class="background-picker-grid">
                        <button type="button" class="background-picker-card" :class="{ active: !pendingBackgroundPath }"
                            @click="pendingBackgroundPath = null; pendingBackgroundName = null" id="bg-picker-none">
                            <span class="background-picker-thumb background-picker-thumb-none">🚫</span>
                            <span class="background-picker-label">None</span>
                        </button>
                        <button v-for="asset in backgroundAssets" :key="asset.id" type="button"
                            class="background-picker-card" :class="{ active: pendingBackgroundPath === asset.path }"
                            @click="pendingBackgroundPath = asset.path; pendingBackgroundName = asset.name"
                            :id="`bg-picker-${asset.id}`">
                            <span class="background-picker-thumb">
                                <img :src="getBackgroundThumb(asset.path)" :alt="asset.name" />
                            </span>
                            <span class="background-picker-label">{{ asset.name }}</span>
                        </button>
                    </div>

                    <div v-if="backgroundAssets.length === 0" class="text-sm text-slate-500 mt-2">
                        No backgrounds in this project's library yet — add one from the background panel first.
                    </div>

                    <div class="input-actions" style="margin-top: 1rem;">
                        <button class="btn primary" @click="confirmBackgroundAction" id="confirm-background-btn">
                            {{ editingActionNode ? 'Update' : 'Insert' }} Background Change
                        </button>
                        <button class="btn secondary" @click="closeBackgroundEditor" id="cancel-background-btn">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';
import CastSelector from '@/components/scene/CastSelector.vue';
import DialogueHistory from '@/components/scene/DialogueHistory.vue';
import MenuChoiceEditor from '@/components/scene/MenuChoiceEditor.vue';
import { createDialogueLine } from '@/services/dialogueService';
import type { DialogueLine, MenuNode, ActionNode, Character, SceneLine, BackgroundAsset } from '@/types/models';
import type { ImagePosition } from '@/components/scene/ImagePositionSelector.vue';

interface Props {
    dialogueLines: SceneLine[];
    characters: Character[];
    backgroundAssets?: BackgroundAsset[];
    selectedLineIndex?: number | null;
    selectedSpeakerId?: string | null;
    isDirty?: boolean;
    sceneCharacterIds?: string[];
}

interface Emits {
    (e: 'add-line', line: DialogueLine): void;
    (e: 'add-menu', node: MenuNode): void;
    (e: 'add-background-action', node: Omit<ActionNode, 'id' | 'order'>): void;
    (e: 'edit-line', payload: { index: number; line: SceneLine }): void;
    (e: 'delete-line', index: number): void;
    (e: 'select-line', index: number | null): void;
    (e: 'speaker-change', characterId: string | null): void;
    (e: 'add-action'): void;
    (e: 'update-line-position', payload: { index: number; position: ImagePosition | undefined }): void;
    (e: 'update-line-visibility', payload: { index: number; visible: boolean }): void;
    (e: 'reorder-lines', lines: SceneLine[]): void;
}

const props = withDefaults(defineProps<Props>(), {
    selectedLineIndex: null,
    selectedSpeakerId: null,
    sceneCharacterIds: undefined,
    backgroundAssets: () => []
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

// Panel mode — 'dialogue' (default), 'menu', or 'background'. Swaps the
// right-hand input panel in place.
const mode = ref<'dialogue' | 'menu' | 'background'>('dialogue');
const editingMenuNode = ref<MenuNode | null>(null);
const editingActionNode = ref<ActionNode | null>(null);
const pendingBackgroundPath = ref<string | null>(null);
const pendingBackgroundName = ref<string | null>(null);

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

const handleUpdateLineVisibility = (payload: { index: number; visible: boolean }) => {
    emit('update-line-visibility', payload);
};

const handleUpdateLinePosition = (payload: { index: number; position: ImagePosition | undefined }) => {
    emit('update-line-position', payload);
};

const handleReorderLines = (reorderedLines: SceneLine[]) => {
    emit('reorder-lines', reorderedLines);
};

const addLine = () => {
    if (!currentText.value.trim()) return;

    const character = props.characters.find(c => c.id === currentSpeaker.value);

    // Build the line data with default position if character exists
    const lineData: Omit<DialogueLine, 'id' | 'order' | 'type'> = {
        character: character
            ? { id: character.id, name: character.name, color: character.color }
            : null,
        text: currentText.value,
        expression: currentExpression.value || undefined,
        outfit: currentOutfit.value || undefined,
        // Add default position for characters so they get the colored border
        image_position: character ? {
            position: 'center',
            transform: {
                flip_x: false,
                zoom: 1
            }
        } : undefined,
        speaker_visible: true
    };

    const newLine = createDialogueLine(
        lineData,
        props.dialogueLines.length + 1
    );

    emit('add-line', newLine);
    resetForm();
};

const updateLine = () => {
    if (!currentText.value.trim() || editingIndex.value === null) return;

    const character = props.characters.find(c => c.id === currentSpeaker.value);
    const existingLine = props.dialogueLines[editingIndex.value];

    if (!existingLine || existingLine.type === 'menu' || existingLine.type === 'action') {
        return;
    }

    const dialogueLine = existingLine as DialogueLine;

    const updatedLine: DialogueLine = {
        id: dialogueLine.id,
        type: 'dialogue',
        character: character ? {
            id: character.id,
            name: character.name,
            color: character.color
        } : null,
        text: currentText.value,
        expression: currentExpression.value || undefined,
        outfit: currentOutfit.value || undefined,
        order: dialogueLine.order,
        // Preserve the existing image_position when updating
        image_position: dialogueLine.image_position || (character ? {
            position: 'center',
            transform: {
                flip_x: false,
                zoom: 1
            }
        } : undefined),
        speaker_visible: dialogueLine.speaker_visible ?? true
    };

    emit('edit-line', { index: editingIndex.value, line: updatedLine });
    resetForm();
    cancelEdit();
};

const startEdit = (index: number) => {
    emit('select-line', index);
};

// --- Menu editor handlers ---

const openMenuEditor = () => {
    mode.value = 'menu';
    editingMenuNode.value = null;
    editingIndex.value = null;
};

const closeMenuEditor = () => {
    mode.value = 'dialogue';
    editingMenuNode.value = null;
    editingIndex.value = null;
    emit('select-line', null);
};

const handleAddMenuNode = (node: MenuNode) => {
    emit('add-menu', node);
    closeMenuEditor();
};

const handleUpdateMenuNode = (node: MenuNode) => {
    if (editingIndex.value === null) return;
    emit('edit-line', { index: editingIndex.value, line: node });
    closeMenuEditor();
};

// --- Background action editor handlers ---

const openBackgroundEditor = () => {
    mode.value = 'background';
    editingActionNode.value = null;
    editingIndex.value = null;
    pendingBackgroundPath.value = null;
    pendingBackgroundName.value = null;
};

const closeBackgroundEditor = () => {
    mode.value = 'dialogue';
    editingActionNode.value = null;
    editingIndex.value = null;
    pendingBackgroundPath.value = null;
    pendingBackgroundName.value = null;
    emit('select-line', null);
};

const confirmBackgroundAction = () => {
    const node: Omit<ActionNode, 'id' | 'order'> = {
        type: 'action',
        action_type: 'background_change',
        background_path: pendingBackgroundPath.value ?? undefined,
        background_name: pendingBackgroundName.value ?? undefined,
    };

    if (editingActionNode.value && editingIndex.value !== null) {
        emit('edit-line', {
            index: editingIndex.value,
            line: { ...editingActionNode.value, ...node }
        });
    } else {
        emit('add-background-action', node);
    }
    closeBackgroundEditor();
};

const getBackgroundThumb = (path: string) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) {
        return path;
    }
    return `https://picsum.photos/seed/${encodeURIComponent(path)}/64/64`;
};

// --- Watchers ---

// Watch for speaker changes from parent
watch(() => props.selectedSpeakerId, (newSpeakerId) => {
    currentSpeaker.value = newSpeakerId || '';
}, { immediate: true });

// Watch for line selection - FIXED with proper null/undefined checks
watch(() => props.selectedLineIndex, (index) => {
    // Check if index is valid
    if (index === null || index === undefined || index < 0 || index >= props.dialogueLines.length) {
        cancelEdit();
        if (mode.value === 'menu') {
            mode.value = 'dialogue';
            editingMenuNode.value = null;
        }
        if (mode.value === 'background') {
            mode.value = 'dialogue';
            editingActionNode.value = null;
            pendingBackgroundPath.value = null;
            pendingBackgroundName.value = null;
        }
        currentSpeaker.value = props.selectedSpeakerId || '';
        currentOutfit.value = '';
        return;
    }

    // Get the line at the index
    const line = props.dialogueLines[index];

    if (line && line.type === 'menu') {
        // Switch the input panel into menu-edit mode for this node
        mode.value = 'menu';
        editingMenuNode.value = line as MenuNode;
        isEditing.value = false;
        editingIndex.value = index;
    } else if (line && line.type === 'action') {
        // Switch the input panel into background-edit mode for this node
        mode.value = 'background';
        editingActionNode.value = line as ActionNode;
        pendingBackgroundPath.value = (line as ActionNode).background_path ?? null;
        pendingBackgroundName.value = (line as ActionNode).background_name ?? null;
        isEditing.value = false;
        editingIndex.value = index;
    } else if (line) {
        const dialogueLine = line as DialogueLine;
        mode.value = 'dialogue';
        editingMenuNode.value = null;
        editingActionNode.value = null;
        currentSpeaker.value = dialogueLine.character?.id || '';
        currentText.value = dialogueLine.text;
        currentExpression.value = dialogueLine.expression || '';
        currentOutfit.value = dialogueLine.outfit || '';
        isEditing.value = true;
        editingIndex.value = index;
    } else {
        // Undefined — cancel editing
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
.dialogue-input-section,
.menu-input-section {
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

.dialogue-input-section,
.menu-input-section {
    flex: 1;
}

/* Amber accent so it's visually obvious you're in menu-building mode */
.menu-input-section {
    border-color: rgba(245, 158, 11, 0.3);
}

#menu-input-title {
    color: #f59e0b;
}

/* Teal accent for background-change mode — matches the row accent in DialogueHistory */
#background-input-section {
    border-color: rgba(45, 212, 191, 0.3);
}

#background-input-title {
    color: #2dd4bf;
}

.background-picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
    gap: 0.75rem;
}

.background-picker-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    background: #0f172a;
    border: 2px solid #334155;
    border-radius: 8px;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.15s;
}

.background-picker-card:hover {
    border-color: #475569;
}

.background-picker-card.active {
    border-color: #2dd4bf;
    background: rgba(45, 212, 191, 0.08);
}

.background-picker-thumb {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 4px;
    overflow: hidden;
    background: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
}

.background-picker-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.background-picker-thumb-none {
    color: #64748b;
}

.background-picker-label {
    font-size: 0.72rem;
    color: #cbd5e1;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
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

    .dialogue-input-section,
    .menu-input-section {
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