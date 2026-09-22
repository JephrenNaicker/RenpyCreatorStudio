<template>
    <div class="dialogue-editor" id="dialogue-editor">
        <div class="editor-layout" id="editor-layout">
            <!-- Left panel: Dialogue History -->
            <DialogueHistory :dialogue-lines="dialogueLines" :selected-line-index="selectedLineIndex"
                :is-dirty="isDirty" :characters="characters" @select-line="handleSelectLine" @edit-line="startEdit"
                @delete-line="handleDeleteLine" @update-line-position="handleUpdateLinePosition"
                @update-line-visibility="handleUpdateLineVisibility" @insert-dialogue="handleInsertDialogue"
                @insert-menu="handleInsertMenu" @insert-background="handleInsertBackground" />

            <!-- Right panel: Controls & Input -->
            <div class="input-panel" id="input-panel">
                <!-- 1. Speaker & Expression Section -->
                <div v-if="mode !== 'action'" class="speaker-section" id="speaker-section">
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

                <!-- 2. Voice Line Section (Only visible in Dialogue Mode) -->
                <div v-if="mode === 'dialogue'" class="voice-section" id="voice-section">
                    <div class="section-header flex items-center justify-between mb-2">
                        <h4 class="text-sm font-semibold text-sky-400">🎙️ Voice Line</h4>
                        <span v-if="currentVoicePath" class="text-xs text-gray-400 truncate max-w-[200px]">
                            {{ currentVoicePath }}
                        </span>
                    </div>

                    <div class="voice-controls grid grid-cols-1 gap-2">
                        <!-- Select from Character's Pre-recorded Voice Lines -->
                        <div v-if="availableVoiceLines.length > 0" class="predefined-voices">
                            <label class="text-xs text-gray-400 block mb-1">Character Voice Preset</label>
                            <select v-model="currentVoicePath" class="voice-select">
                                <option value="">-- No Voice Audio --</option>
                                <option v-for="vl in availableVoiceLines" :key="vl.line_name" :value="vl.audio_path">
                                    {{ vl.line_name }} ({{ vl.audio_path }})
                                </option>
                            </select>
                        </div>

                        <!-- Manual Voice Audio Upload / Custom Input -->
                        <div class="custom-voice-upload flex items-center gap-2">
                            <input type="file" ref="voiceInputRef" accept="audio/*" class="hidden"
                                @change="handleVoiceFileUpload" />
                            <button type="button" class="btn secondary text-xs !py-1.5 flex-1"
                                @click="triggerVoiceFileInput">
                                📁 Upload Voice File
                            </button>
                            <button v-if="currentVoicePath" type="button"
                                class="btn secondary text-xs !py-1.5 !px-3 text-red-400 border-red-900/40 hover:bg-red-950/30"
                                @click="clearVoice">
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 3. Dialogue Input Section -->
                <div v-if="mode === 'dialogue'" class="dialogue-input-section" id="dialogue-input-section">
                    <div class="section-header" id="dialogue-input-header">
                        <h4 id="dialogue-input-title">Dialogue Text</h4>
                    </div>
                    <div class="textarea-wrapper" id="textarea-wrapper">
                        <textarea ref="textAreaRef" v-model="currentText" placeholder="Type dialogue here..."
                            @keydown.enter.prevent="handleEnterKey" rows="4" class="dialogue-textarea"
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
                    </div>
                </div>

                <!-- Menu Choice Editor Panel -->
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

                <!-- Background Action Editor Panel -->
                <div v-else-if="mode === 'action'" class="action-input-section" id="action-input-section">
                    <div class="section-header" id="action-input-header">
                        <h4 id="action-input-title">
                            {{ isEditing ? 'Edit Background Action' : 'New Background Action' }}
                        </h4>
                    </div>

                    <div class="action-editor-content">
                        <div class="bg-preview-box mb-4">
                            <label class="text-xs text-gray-400 block mb-1">Selected Background</label>
                            <div
                                class="preview-banner relative h-24 rounded-lg overflow-hidden border border-gray-700 bg-gray-900 flex items-center justify-center">
                                <img v-if="currentBgPath" :src="getBgThumb(currentBgPath)" alt="Background Preview"
                                    class="w-full h-full object-cover" />
                                <span v-else class="text-gray-500 text-sm">No Background Selected</span>
                                <div
                                    class="absolute bottom-1 left-2 text-xs text-white bg-black/60 px-2 py-0.5 rounded">
                                    {{ currentBgName || 'None' }}
                                </div>
                            </div>
                        </div>

                        <div class="asset-picker mb-4">
                            <label class="text-xs text-gray-400 block mb-1">Choose from Project Library</label>
                            <div
                                class="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-gray-900/50 rounded-lg border border-gray-800">
                                <button type="button"
                                    class="text-xs p-2 rounded border text-left transition-colors flex flex-col items-center gap-1"
                                    :class="!currentBgPath ? 'border-sky-500 bg-sky-500/10 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'"
                                    @click="selectBackground('', 'None')">
                                    <span class="text-lg">🚫</span>
                                    <span class="truncate w-full text-center">None</span>
                                </button>
                                <button v-for="asset in backgroundAssets" :key="asset.id" type="button"
                                    class="text-xs p-1 rounded border text-left transition-colors relative group overflow-hidden h-14"
                                    :class="currentBgPath === asset.path ? 'border-sky-500 ring-1 ring-sky-500' : 'border-gray-700 hover:border-gray-500'"
                                    @click="selectBackground(asset.path, asset.name)">
                                    <img :src="getBgThumb(asset.path)"
                                        class="w-full h-full object-cover rounded opacity-70 group-hover:opacity-100" />
                                    <span
                                        class="absolute bottom-0 inset-x-0 bg-black/70 text-[10px] text-white px-1 truncate text-center">
                                        {{ asset.name }}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div class="asset-upload mb-4">
                            <label class="text-xs text-gray-400 block mb-1">Or Upload New Asset</label>
                            <input type="file" ref="fileInputRef" accept="image/*" class="hidden"
                                @change="handleFileUpload" />
                            <button type="button"
                                class="btn secondary w-full !py-2 text-xs flex items-center justify-center gap-2"
                                @click="triggerFileInput">
                                <span>📤</span> Upload Local Image
                            </button>
                        </div>
                    </div>

                    <div class="input-actions mt-auto">
                        <button v-if="!isEditing" class="btn primary" @click="addBackgroundAction" id="add-action-btn">
                            Add Action
                        </button>
                        <button v-else class="btn primary" @click="updateBackgroundAction" id="update-action-btn">
                            Update Action
                        </button>
                        <button class="btn secondary" @click="cancelEdit" id="cancel-action-btn">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import CastSelector from '@/components/scene/CastSelector.vue';
import DialogueHistory from '@/components/scene/DialogueHistory.vue';
import MenuChoiceEditor from '@/components/scene/MenuChoiceEditor.vue';
import { createDialogueLine, createMenuNode } from '@/services/dialogueService';
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
    (e: 'add-background-asset', asset: BackgroundAsset): void;
    (e: 'edit-line', payload: { index: number; line: SceneLine }): void;
    (e: 'delete-line', index: number): void;
    (e: 'select-line', index: number | null): void;
    (e: 'speaker-change', characterId: string | null): void;
    (e: 'update-line-position', payload: { index: number; position: ImagePosition | undefined }): void;
    (e: 'update-line-visibility', payload: { index: number; visible: boolean }): void;
    (e: 'insert-line', payload: { index: number; line: SceneLine }): void;
}

const props = withDefaults(defineProps<Props>(), {
    backgroundAssets: () => [],
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
const currentVoicePath = ref('');

const textAreaRef = ref<HTMLTextAreaElement>();
const fileInputRef = ref<HTMLInputElement>();
const voiceInputRef = ref<HTMLInputElement>();

// Background Action State
const currentBgPath = ref('');
const currentBgName = ref('');

const isEditing = ref(false);
const editingIndex = ref<number | null>(null);

// Mode: 'dialogue' | 'menu' | 'action'
const mode = ref<'dialogue' | 'menu' | 'action'>('dialogue');
const editingMenuNode = ref<MenuNode | null>(null);

// --- Voice Helpers & Computeds ---
const selectedCharacter = computed(() => {
    return props.characters.find(c => c.id === currentSpeaker.value);
});

const availableVoiceLines = computed(() => {
    return selectedCharacter.value?.voice_lines || [];
});

const triggerVoiceFileInput = () => {
    voiceInputRef.value?.click();
};

const handleVoiceFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file) return;

    // Use standard object URL or local relative path representation
    currentVoicePath.value = URL.createObjectURL(file);
};

const clearVoice = () => {
    currentVoicePath.value = '';
};

// --- General Helpers ---
const getBgThumb = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) {
        return path;
    }
    return `https://picsum.photos/seed/${encodeURIComponent(path)}/128/72`;
};

const resolveLineOutfit = (line: DialogueLine): string => {
    if (!line.character) return '';
    const character = props.characters.find(c => c.id === line.character!.id);
    if (line.expression) {
        const matchedExpression = character?.expressions?.find(e => e.name === line.expression);
        if (matchedExpression?.outfit) return matchedExpression.outfit;
    }
    return line.outfit || '';
};

const resetForm = () => {
    currentText.value = '';
    currentExpression.value = '';
    currentOutfit.value = '';
    currentVoicePath.value = '';
    currentBgPath.value = '';
    currentBgName.value = '';
    nextTick(() => {
        if (mode.value === 'dialogue') {
            textAreaRef.value?.focus();
        }
    });
};

const cancelEdit = () => {
    isEditing.value = false;
    editingIndex.value = null;
    mode.value = 'dialogue';
    editingMenuNode.value = null;
    resetForm();
    emit('select-line', null);
};

// --- Action / Background Handlers ---
const selectBackground = (path: string, name: string) => {
    currentBgPath.value = path;
    currentBgName.value = name;
};

const triggerFileInput = () => {
    fileInputRef.value?.click();
};

const handleFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file) return;

    const assetUrl = URL.createObjectURL(file);
    const newAsset: BackgroundAsset = {
        id: `bg_${Date.now()}`,
        name: file.name,
        path: assetUrl
    };

    emit('add-background-asset', newAsset);
    selectBackground(newAsset.path, newAsset.name);
};

const addBackgroundAction = () => {
    emit('add-background-action', {
        type: 'action',
        action_type: 'background_change',
        background_path: currentBgPath.value || undefined,
        background_name: currentBgName.value || undefined,
    });
    cancelEdit();
};

const updateBackgroundAction = () => {
    if (editingIndex.value === null) return;
    const existing = props.dialogueLines[editingIndex.value] as ActionNode;

    const updatedNode: ActionNode = {
        ...existing,
        background_path: currentBgPath.value || undefined,
        background_name: currentBgName.value || undefined,
    };

    emit('edit-line', { index: editingIndex.value, line: updatedNode });
    cancelEdit();
};

// --- Form & Line Handlers ---
const handleEnterKey = (e: KeyboardEvent) => {
    if (e.shiftKey) return;
    if (isEditing.value) {
        updateLine();
    } else {
        addLine();
    }
};

const handleSpeakerChange = (characterId: string) => {
    currentSpeaker.value = characterId;
    currentVoicePath.value = ''; // Reset voice when changing speaker
    emit('speaker-change', characterId || null);
};

const handleExpressionChange = (expression: string) => {
    currentExpression.value = expression;
};

const handleOutfitChange = (outfit: string) => {
    currentOutfit.value = outfit;
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

const addLine = () => {
    if (!currentText.value.trim()) return;

    const character = props.characters.find(c => c.id === currentSpeaker.value);

    const lineData: Omit<DialogueLine, 'id' | 'order' | 'type'> & { voice_path?: string } = {
        character: character
            ? { id: character.id, name: character.name, color: character.color }
            : null,
        text: currentText.value,
        expression: currentExpression.value || undefined,
        outfit: currentOutfit.value || undefined,
        voice_path: currentVoicePath.value || undefined,
        image_position: character ? {
            position: 'center',
            transform: { flip_x: false, zoom: 1 }
        } : undefined,
        speaker_visible: true
    };

    const newLine = createDialogueLine(lineData, props.dialogueLines.length + 1);
    emit('add-line', newLine as DialogueLine);
    resetForm();
};

const updateLine = () => {
    if (!currentText.value.trim() || editingIndex.value === null) return;

    const character = props.characters.find(c => c.id === currentSpeaker.value);
    const existingLine = props.dialogueLines[editingIndex.value];

    if (!existingLine || existingLine.type === 'menu' || existingLine.type === 'action') return;

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
        voice_path: currentVoicePath.value || undefined,
        order: dialogueLine.order,
        image_position: dialogueLine.image_position || (character ? {
            position: 'center',
            transform: { flip_x: false, zoom: 1 }
        } : undefined),
        speaker_visible: dialogueLine.speaker_visible ?? true
    };

    emit('edit-line', { index: editingIndex.value, line: updatedLine });
    cancelEdit();
};

const startEdit = (index: number) => {
    emit('select-line', index);
};

// --- Menu Handlers ---
const openMenuEditor = () => {
    mode.value = 'menu';
    editingMenuNode.value = null;
    editingIndex.value = null;
};

const closeMenuEditor = () => {
    cancelEdit();
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

// --- Divider Insert Handlers ---
const handleInsertDialogue = (payload: { index: number }) => {
    const lineData: Omit<DialogueLine, 'id' | 'order' | 'type'> = {
        character: null,
        text: '',
        speaker_visible: true
    };
    const newLine = createDialogueLine(lineData, payload.index + 1);
    emit('insert-line', { index: payload.index, line: newLine });
};

const handleInsertMenu = (payload: { index: number }) => {
    const newNode = createMenuNode(
        {
            prompt: undefined,
            choices: [
                { id: `choice_${Date.now()}_0_${Math.random().toString(36).slice(2, 6)}`, text: '' },
                { id: `choice_${Date.now()}_1_${Math.random().toString(36).slice(2, 6)}`, text: '' }
            ]
        },
        payload.index + 1
    );
    emit('insert-line', { index: payload.index, line: newNode });
};

const handleInsertBackground = (payload: { index: number }) => {
    const newNode: ActionNode = {
        id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: 'action',
        order: payload.index + 1,
        action_type: 'background_change',
        background_path: undefined,
        background_name: undefined,
    };
    emit('insert-line', { index: payload.index, line: newNode });
};

// --- Watchers ---
watch(() => props.selectedSpeakerId, (newSpeakerId) => {
    if (!isEditing.value) {
        currentSpeaker.value = newSpeakerId || '';
    }
}, { immediate: true });

watch(() => props.selectedLineIndex, (index) => {
    if (index === null || index === undefined || index < 0 || index >= props.dialogueLines.length) {
        if (isEditing.value) {
            cancelEdit();
        }
        return;
    }

    const line = props.dialogueLines[index];
    editingIndex.value = index;

    if (!line) return;

    if (line.type === 'menu') {
        mode.value = 'menu';
        editingMenuNode.value = line as MenuNode;
        isEditing.value = true;
    } else if (line.type === 'action') {
        const actionNode = line as ActionNode;
        mode.value = 'action';
        editingMenuNode.value = null;
        currentBgPath.value = actionNode.background_path || '';
        currentBgName.value = actionNode.background_name || '';
        isEditing.value = true;
    } else {
        const dialogueLine = line as DialogueLine;
        mode.value = 'dialogue';
        editingMenuNode.value = null;
        currentSpeaker.value = dialogueLine.character?.id || '';
        currentText.value = dialogueLine.text || '';
        currentExpression.value = dialogueLine.expression || '';
        currentVoicePath.value = dialogueLine.voice_path || '';
        currentOutfit.value = resolveLineOutfit(dialogueLine);
        isEditing.value = true;
    }
}, { immediate: true });
</script>

<style scoped>
.dialogue-editor {
    height: 100%;
    padding: 1.5rem;
    box-sizing: border-box;
}

.editor-layout {
    display: flex;
    gap: 1.5rem;
    height: 100%;
    min-height: 500px;
}

.input-panel {
    flex: 2;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 300px;
}

.speaker-section,
.voice-section,
.dialogue-input-section,
.menu-input-section,
.action-input-section {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
}

.speaker-section,
.voice-section {
    flex-shrink: 0;
}

.voice-section {
    border-color: rgba(56, 189, 248, 0.25);
}

.voice-select {
    width: 100%;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 0.5rem;
    color: #f8fafc;
    font-size: 0.85rem;
}

.dialogue-input-section,
.menu-input-section,
.action-input-section {
    flex: 1;
}

.menu-input-section {
    border-color: rgba(245, 158, 11, 0.3);
}

.action-input-section {
    border-color: rgba(45, 212, 191, 0.3);
}

#action-input-title {
    color: #2dd4bf;
}

.section-header h4 {
    color: #f8fafc;
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
}

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
}

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
</style>