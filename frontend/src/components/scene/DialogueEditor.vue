<!-- frontend/src/components/scene/DialogueEditor.vue -->
<template>
    <div class="h-full p-6 box-border">
        <div class="flex gap-6 h-full min-h-[500px]">
            <!-- Left panel: Dialogue History -->
            <DialogueHistory :dialogue-lines="dialogueLines" :selected-line-index="selectedLineIndex"
                :is-dirty="isDirty" :characters="characters" @select-line="handleSelectLine" @edit-line="startEdit"
                @delete-line="handleDeleteLine" @update-line-position="handleUpdateLinePosition"
                @update-line-visibility="handleUpdateLineVisibility" @insert-dialogue="handleInsertDialogue"
                @insert-menu="handleInsertMenu" @insert-background="handleInsertBackground"
                @insert-music="handleInsertMusic" />

            <!-- Right panel: Controls & Input -->
            <div class="flex-[2] flex flex-col gap-4 min-w-[300px]">
                <!-- 1. Speaker & Expression Section -->
                <div v-if="mode !== 'action' && mode !== 'music'"
                    class="bg-slate-950 border border-slate-700 rounded-xl p-5 flex flex-col shrink-0">
                    <div class="mb-2">
                        <h4 class="text-slate-50 font-semibold text-base m-0">Speaker & Expression</h4>
                    </div>
                    <div>
                        <CastSelector v-model="currentSpeaker" :characters="characters"
                            :scene-character-ids="sceneCharacterIds" label="Select Speaker"
                            :external-outfit="currentOutfit" :external-expression="currentExpression"
                            @update:modelValue="handleSpeakerChange" @expression-change="handleExpressionChange"
                            @outfit-change="handleOutfitChange" />
                    </div>
                </div>

                <!-- 2. Voice Line Section (Only visible in Dialogue Mode) -->
                <div v-if="mode === 'dialogue'"
                    class="bg-slate-950 border border-sky-400/25 rounded-xl p-5 flex flex-col shrink-0">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-sm font-semibold text-sky-400 m-0">🎙️ Voice Line</h4>
                        <span v-if="currentVoicePath" class="text-xs text-slate-400 truncate max-w-[200px]">
                            {{ currentVoicePath }}
                        </span>
                    </div>

                    <div class="grid grid-cols-1 gap-2">
                        <!-- Select from Character's Pre-recorded Voice Lines -->
                        <div v-if="availableVoiceLines.length > 0">
                            <label class="text-xs text-slate-400 block mb-1">Character Voice Preset</label>
                            <select v-model="currentVoicePath"
                                class="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-50 text-xs focus:outline-none focus:border-sky-400">
                                <option value="">-- No Voice Audio --</option>
                                <option v-for="vl in availableVoiceLines" :key="vl.line_name" :value="vl.audio_path">
                                    {{ vl.line_name }} ({{ vl.audio_path }})
                                </option>
                            </select>
                        </div>

                        <!-- Manual Voice Audio Upload / Custom Input -->
                        <div class="flex items-center gap-2">
                            <input type="file" ref="voiceInputRef" accept="audio/*" class="hidden"
                                @change="handleVoiceFileUpload" />
                            <button type="button"
                                class="flex-1 py-1.5 px-3 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                                @click="triggerVoiceFileInput">
                                📁 Upload Voice File
                            </button>
                            <button v-if="currentVoicePath" type="button"
                                class="py-1.5 px-3 rounded-md text-xs font-medium text-red-400 border border-red-900/40 hover:bg-red-950/30 transition-colors cursor-pointer"
                                @click="clearVoice">
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 3. Dialogue Input Section -->
                <div v-if="mode === 'dialogue'"
                    class="bg-slate-950 border border-slate-700 rounded-xl p-5 flex flex-col flex-1">
                    <div class="mb-2">
                        <h4 class="text-slate-50 font-semibold text-base m-0">Dialogue Text</h4>
                    </div>
                    <div class="flex-1 flex flex-col">
                        <textarea ref="textAreaRef" v-model="currentText" placeholder="Type dialogue here..."
                            @keydown.enter.prevent="handleEnterKey" rows="4"
                            class="flex-1 bg-slate-900 border border-slate-700 focus:border-sky-400 focus:outline-none rounded-lg p-4 text-slate-50 text-base resize-none min-h-[120px] transition-colors duration-200 font-sans" />
                        <div class="text-xs text-slate-500 text-right mt-1">
                            Press Enter to submit, Shift+Enter for new line
                        </div>
                    </div>

                    <div class="flex gap-3 flex-wrap mt-4">
                        <button v-if="!isEditing"
                            class="flex-1 min-w-[120px] py-3 px-5 rounded-md font-medium text-sm bg-sky-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:opacity-90 hover:enabled:-translate-y-0.5 transition-all duration-200 border-0 cursor-pointer"
                            @click="addLine" :disabled="!currentText.trim()">
                            Add Line
                        </button>
                        <button v-else
                            class="flex-1 min-w-[120px] py-3 px-5 rounded-md font-medium text-sm bg-sky-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:opacity-90 hover:enabled:-translate-y-0.5 transition-all duration-200 border-0 cursor-pointer"
                            @click="updateLine" :disabled="!currentText.trim()">
                            Update Line
                        </button>
                        <button v-if="isEditing"
                            class="flex-1 min-w-[120px] py-3 px-5 rounded-md font-medium text-sm bg-slate-800 text-slate-200 border border-slate-700 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                            @click="cancelEdit">
                            Cancel
                        </button>
                        <button
                            class="flex-1 min-w-[120px] py-3 px-5 rounded-md font-medium text-sm bg-slate-800 text-slate-200 border border-slate-700 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                            @click="openMenuEditor">
                            Add Menu Choice
                        </button>
                    </div>
                </div>

                <!-- Menu Choice Editor Panel -->
                <div v-else-if="mode === 'menu'"
                    class="bg-slate-950 border border-amber-500/30 rounded-xl p-5 flex flex-col flex-1">
                    <div class="mb-2">
                        <h4 class="text-slate-50 font-semibold text-base m-0">
                            {{ editingMenuNode ? 'Edit Menu Choice' : 'New Menu Choice' }}
                        </h4>
                    </div>
                    <MenuChoiceEditor :editing-node="editingMenuNode" :line-count="dialogueLines.length"
                        @add-menu="handleAddMenuNode" @update-menu="handleUpdateMenuNode" @cancel="closeMenuEditor" />
                </div>

                <!-- Background Action Editor Panel -->
                <div v-else-if="mode === 'action'"
                    class="bg-slate-950 border border-teal-400/30 rounded-xl p-5 flex flex-col flex-1">
                    <div class="mb-2">
                        <h4 class="text-teal-400 font-semibold text-base m-0">
                            {{ isEditing ? 'Edit Background Action' : 'New Background Action' }}
                        </h4>
                    </div>

                    <div class="flex-1">
                        <div class="mb-4">
                            <label class="text-xs text-slate-400 block mb-1">Selected Background</label>
                            <div
                                class="relative h-24 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                                <img v-if="currentBgPath" :src="getBgThumb(currentBgPath)" alt="Background Preview"
                                    class="w-full h-full object-cover" />
                                <span v-else class="text-slate-500 text-sm">No Background Selected</span>
                                <div
                                    class="absolute bottom-1 left-2 text-xs text-white bg-black/60 px-2 py-0.5 rounded">
                                    {{ currentBgName || 'None' }}
                                </div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="text-xs text-slate-400 block mb-1">Choose from Project Library</label>
                            <div
                                class="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-900/50 rounded-lg border border-slate-800">
                                <button type="button"
                                    class="text-xs p-2 rounded border text-left transition-colors flex flex-col items-center gap-1 cursor-pointer"
                                    :class="!currentBgPath ? 'border-sky-500 bg-sky-500/10 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'"
                                    @click="selectBackground('', 'None')">
                                    <span class="text-lg">🚫</span>
                                    <span class="truncate w-full text-center">None</span>
                                </button>
                                <button v-for="asset in backgroundAssets" :key="asset.id" type="button"
                                    class="text-xs p-1 rounded border text-left transition-colors relative group overflow-hidden h-14 cursor-pointer"
                                    :class="currentBgPath === asset.path ? 'border-sky-500 ring-1 ring-sky-500' : 'border-slate-700 hover:border-slate-500'"
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

                        <div class="mb-4">
                            <label class="text-xs text-slate-400 block mb-1">Or Upload New Asset</label>
                            <input type="file" ref="fileInputRef" accept="image/*" class="hidden"
                                @change="handleFileUpload" />
                            <button type="button"
                                class="w-full py-2 px-3 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                @click="triggerFileInput">
                                <span>📤</span> Upload Local Image
                            </button>
                        </div>
                    </div>

                    <div class="flex gap-3 flex-wrap mt-auto">
                        <button v-if="!isEditing"
                            class="flex-1 min-w-[120px] py-3 px-5 rounded-md font-medium text-sm bg-sky-400 text-slate-950 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 border-0 cursor-pointer"
                            @click="addBackgroundAction">
                            Add Action
                        </button>
                        <button v-else
                            class="flex-1 min-w-[120px] py-3 px-5 rounded-md font-medium text-sm bg-sky-400 text-slate-950 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 border-0 cursor-pointer"
                            @click="updateBackgroundAction">
                            Update Action
                        </button>
                        <button
                            class="flex-1 min-w-[120px] py-3 px-5 rounded-md font-medium text-sm bg-slate-800 text-slate-200 border border-slate-700 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                            @click="cancelEdit">
                            Cancel
                        </button>
                    </div>
                </div>

                <!-- Music Action Editor Panel -->
                <div v-else-if="mode === 'music'"
                    class="bg-slate-950 border border-violet-400/30 rounded-xl p-5 flex flex-col flex-1">
                    <div class="mb-2">
                        <h4 class="text-violet-400 font-semibold text-base m-0">Edit Music Action</h4>
                    </div>

                    <div class="mb-4">
                        <label class="text-xs text-slate-400 block mb-1">What should happen?</label>
                        <div class="grid grid-cols-2 gap-2">
                            <button type="button"
                                class="text-sm px-3 py-2 rounded-lg border transition-colors cursor-pointer"
                                :class="currentMusicMode === 'play' ? 'border-violet-400 bg-violet-400/10 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'"
                                @click="currentMusicMode = 'play'">
                                🎵 Play a track
                            </button>
                            <button type="button"
                                class="text-sm px-3 py-2 rounded-lg border transition-colors cursor-pointer"
                                :class="currentMusicMode === 'stop' ? 'border-violet-400 bg-violet-400/10 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'"
                                @click="currentMusicMode = 'stop'">
                                ⏹️ Stop music
                            </button>
                        </div>
                    </div>

                    <template v-if="currentMusicMode === 'play'">
                        <div class="mb-4">
                            <label class="text-xs text-slate-400 block mb-1">Choose from Project Library</label>
                            <div
                                class="flex flex-col gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-900/50 rounded-lg border border-slate-800">
                                <p v-if="musicAssets.length === 0" class="text-xs text-slate-500 px-2 py-3 text-center">
                                    No tracks yet. Upload one below.
                                </p>
                                <button v-for="track in musicAssets" :key="track.id" type="button"
                                    class="text-xs px-3 py-2 rounded border text-left truncate transition-colors cursor-pointer"
                                    :class="currentMusicPath === track.path ? 'border-violet-400 bg-violet-400/10 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'"
                                    @click="selectMusic(track.path, track.name)">
                                    🎵 {{ track.name }}
                                </button>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="text-xs text-slate-400 block mb-1">Or Upload New Track</label>
                            <input type="file" ref="musicInputRef" accept="audio/*" class="hidden"
                                @change="handleMusicFileUpload" />
                            <button type="button"
                                class="w-full py-2 px-3 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                @click="triggerMusicFileInput">
                                <span>📁</span> Upload Audio File
                            </button>
                        </div>
                    </template>

                    <div class="mb-4">
                        <label class="text-xs text-slate-400 block mb-1" for="music-fade">
                            {{ currentMusicMode === 'stop' ? 'Fade out' : 'Fade in' }} (seconds, 0 = instant)
                        </label>
                        <input id="music-fade" v-model.number="currentMusicFade" type="number" min="0" max="10"
                            step="0.5"
                            class="w-32 bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-50 text-sm focus:outline-none focus:border-violet-400" />
                    </div>

                    <div class="flex gap-3 flex-wrap mt-auto">
                        <button
                            class="flex-1 min-w-[120px] py-3 px-5 rounded-md font-medium text-sm bg-sky-400 text-slate-950 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 border-0 cursor-pointer"
                            @click="updateMusicAction">
                            Update Action
                        </button>
                        <button
                            class="flex-1 min-w-[120px] py-3 px-5 rounded-md font-medium text-sm bg-slate-800 text-slate-200 border border-slate-700 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                            @click="cancelEdit">
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
import type { DialogueLine, MenuNode, ActionNode, Character, SceneLine, BackgroundAsset, MusicAsset } from '@/types/models';
import type { ImagePosition } from '@/components/scene/ImagePositionSelector.vue';

interface Props {
    dialogueLines: SceneLine[];
    characters: Character[];
    backgroundAssets?: BackgroundAsset[];
    selectedLineIndex?: number | null;
    selectedSpeakerId?: string | null;
    isDirty?: boolean;
    sceneCharacterIds?: string[];
    musicAssets?: MusicAsset[];
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
    (e: 'add-music-asset', asset: MusicAsset): void;
}

const props = withDefaults(defineProps<Props>(), {
    backgroundAssets: () => [],
    selectedLineIndex: null,
    selectedSpeakerId: null,
    sceneCharacterIds: undefined,
    musicAssets: () => []
});

const emit = defineEmits<Emits>();

const currentSpeaker = ref('');
const currentExpression = ref('');
const currentText = ref('');
const currentOutfit = ref('');
const currentVoicePath = ref('');

const textAreaRef = ref<HTMLTextAreaElement>();
const fileInputRef = ref<HTMLInputElement>();
const voiceInputRef = ref<HTMLInputElement>();

const currentBgPath = ref('');
const currentBgName = ref('');

const isEditing = ref(false);
const editingIndex = ref<number | null>(null);

const mode = ref<'dialogue' | 'menu' | 'action' | 'music'>('dialogue');
const editingMenuNode = ref<MenuNode | null>(null);

const currentMusicMode = ref<'play' | 'stop'>('play');
const currentMusicPath = ref('');
const currentMusicName = ref('');
const currentMusicFade = ref<number>(0);
const musicInputRef = ref<HTMLInputElement>();

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

    currentVoicePath.value = URL.createObjectURL(file);
};

const clearVoice = () => {
    currentVoicePath.value = '';
};

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
    currentMusicMode.value = 'play';
    currentMusicPath.value = '';
    currentMusicName.value = '';
    currentMusicFade.value = 0;
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

const selectMusic = (path: string, name: string) => {
    currentMusicPath.value = path;
    currentMusicName.value = name;
};

const triggerMusicFileInput = () => musicInputRef.value?.click();

const handleMusicFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const asset: MusicAsset = {
        id: `music_${Date.now()}`,
        name: file.name,
        path: URL.createObjectURL(file)
    };
    emit('add-music-asset', asset);
    selectMusic(asset.path, asset.name);
    input.value = '';
};

const updateMusicAction = () => {
    if (editingIndex.value === null) return;
    const existing = props.dialogueLines[editingIndex.value] as ActionNode;
    const isStop = currentMusicMode.value === 'stop';
    const fade = Number(currentMusicFade.value) || 0;

    const updatedNode: ActionNode = {
        ...existing,
        music_mode: currentMusicMode.value,
        music_path: isStop ? undefined : (currentMusicPath.value || undefined),
        music_name: isStop ? undefined : (currentMusicName.value || undefined),
        music_fade: fade > 0 ? fade : undefined,
    };

    emit('edit-line', { index: editingIndex.value, line: updatedNode });
    cancelEdit();
};

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
    currentVoicePath.value = '';
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

const handleInsertMusic = (payload: { index: number }) => {
    const newNode: ActionNode = {
        id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: 'action',
        order: payload.index + 1,
        action_type: 'music_change',
        music_mode: 'play',
    };
    emit('insert-line', { index: payload.index, line: newNode });
};

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
    } else if (line.type === 'action' && (line as ActionNode).action_type === 'music_change') {
        const musicNode = line as ActionNode;
        mode.value = 'music';
        editingMenuNode.value = null;
        currentMusicMode.value = musicNode.music_mode ?? 'play';
        currentMusicPath.value = musicNode.music_path || '';
        currentMusicName.value = musicNode.music_name || '';
        currentMusicFade.value = musicNode.music_fade ?? 0;
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