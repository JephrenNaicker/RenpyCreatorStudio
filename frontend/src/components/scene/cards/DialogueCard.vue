<!-- frontend/src/components/scene/cards/DialogueCard.vue -->
<template>
    <div class="group relative flex flex-col gap-2 mb-4 p-4 pl-10 rounded-lg border border-transparent bg-white/[0.02] cursor-pointer transition-all duration-200 hover:bg-white/[0.05] hover:border-sky-400/30"
        :class="[
            isSelected ? '!bg-sky-400/10 !border-sky-400' : '',
            !line.character ? 'border-l-[3px] border-l-slate-600' : '',
            line.image_position ? 'border-l-[3px]' : '',
            isDragging ? 'opacity-50 scale-[0.98]' : '',
            isDragOver ? '!border-sky-400 bg-sky-400/[0.08] translate-y-1 shadow-[0_4px_12px_rgba(56,189,248,0.15)]' : '',
            line.speaker_visible === false ? 'opacity-[0.55] !border-l-[3px] !border-l-red-400 hover:opacity-[0.85]' : ''
        ]" :style="line.image_position ? { borderLeftColor: lineColor } : {}" :draggable="!isLocked"
        @click="$emit('select')" @dragstart="$emit('dragstart', $event)" @dragend="$emit('dragend')"
        @dragover.prevent="$emit('dragover', $event)" @dragleave="$emit('dragleave')"
        @drop.prevent="$emit('drop', $event)">

        <!-- Drag Handle / Lock Indicator -->
        <div v-if="isLocked"
            class="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded text-slate-600 flex items-center justify-center opacity-60 text-[0.85rem] cursor-default"
            title="Required — always first, can't be moved or deleted">
            🔒
        </div>
        <div v-else
            class="absolute left-1 top-1/2 -translate-y-1/2 p-1 rounded text-slate-600 flex items-center justify-center opacity-0 transition-all duration-200 cursor-grab active:cursor-grabbing group-hover:opacity-100 hover:text-slate-400 hover:bg-white/5"
            title="Drag to reorder">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <circle cx="9" cy="12" r="1" fill="currentColor" />
                <circle cx="9" cy="16" r="1" fill="currentColor" />
                <circle cx="9" cy="8" r="1" fill="currentColor" />
                <circle cx="15" cy="12" r="1" fill="currentColor" />
                <circle cx="15" cy="16" r="1" fill="currentColor" />
                <circle cx="15" cy="8" r="1" fill="currentColor" />
            </svg>
        </div>

        <!-- Line Header -->
        <div class="flex items-center gap-2 min-w-0">
            <div class="font-bold text-base shrink-0" :style="{ color: speakerColor }">
                {{ line.character?.name || 'Narrator' }}
            </div>

            <!-- Visibility Toggle -->
            <VisibilityToggle v-if="line.character" :model-value="line.speaker_visible === false"
                @change="(hidden) => $emit('update-visibility', hidden)" @click.stop />

            <!-- Voice Indicator -->
            <button v-if="line.voice_path" type="button"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-sky-400/30 bg-sky-400/10 text-sky-400 shrink-0 transition-colors duration-200 cursor-pointer hover:bg-sky-400/20"
                :class="{ '!bg-sky-400/30 !text-sky-300 !border-sky-400': isPlayingVoice }"
                :title="`Voice: ${voiceFileName} — click to ${isPlayingVoice ? 'stop' : 'preview'}`"
                @click.stop="toggleVoicePreview">
                <span>{{ isPlayingVoice ? '⏹️' : '🔊' }}</span>
                <span class="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">{{ voiceFileName }}</span>
            </button>

            <!-- Expression & Outfit Badge -->
            <div v-if="line.expression || outfitName"
                class="flex items-center gap-2 text-[0.85rem] text-slate-400 ml-auto shrink-0 whitespace-nowrap">
                <span v-if="outfitName" class="text-sky-400 whitespace-nowrap" :title="`Outfit: ${outfitName}`">
                    👕 {{ outfitName }}
                </span>
                <span v-if="outfitName && line.expression" class="text-slate-600 text-xs">|</span>
                <span v-if="line.expression" class="inline-flex items-center gap-[0.35rem]">
                    {{ getExpressionEmoji(line.expression) }}
                    <span class="text-xs opacity-80">{{ line.expression }}</span>
                </span>
            </div>

            <!-- Position Indicator Button -->
            <button type="button"
                class="bg-transparent border-0 text-slate-400 cursor-pointer px-2 py-1 text-sm rounded transition-all duration-200 hover:text-sky-400 hover:bg-sky-400/10"
                :class="{ '!text-sky-400 !bg-sky-400/20': isPositionActive }" @click.stop="$emit('toggle-position')"
                :title="getPositionTooltip(line.image_position)">
                {{ getPositionIcon(line.image_position) }}
            </button>
        </div>

        <!-- Dialogue Text -->
        <div class="text-slate-300 leading-normal text-base py-2">{{ line.text }}</div>

        <!-- Line Actions -->
        <div class="flex gap-2 justify-end opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button
                class="bg-transparent border-0 text-slate-400 cursor-pointer p-1 text-sm rounded transition-all duration-200 hover:text-slate-50 hover:bg-white/10"
                @click.stop="$emit('edit')" title="Edit">
                ✏️
            </button>
            <button v-if="!isLocked"
                class="bg-transparent border-0 text-slate-400 cursor-pointer p-1 text-sm rounded transition-all duration-200 hover:text-red-400 hover:bg-red-400/10"
                @click.stop="$emit('delete')" title="Delete">
                🗑️
            </button>
            <span v-else class="bg-transparent border-0 text-slate-400 p-1 text-sm rounded opacity-50 cursor-default"
                title="Required — can't be deleted">
                🔒
            </span>
        </div>

        <!-- Position Selector Popup -->
        <div v-if="isPositionActive" class="absolute top-full left-0 right-0 z-50 mt-2 animate-[fadeIn_0.2s_ease-out]"
            @click.stop>
            <ImagePositionSelector :model-value="line.image_position" :character-name="line.character?.name"
                :character-color="line.character?.color" @update:model-value="(pos) => $emit('update-position', pos)"
                @change="(pos) => $emit('update-position', pos)" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue';
import VisibilityToggle from '@/components/scene/VisibilityToggle.vue';
import ImagePositionSelector, { type ImagePosition } from '@/components/scene/ImagePositionSelector.vue';
import type { DialogueLine, Character } from '@/types/models';

interface Props {
    line: DialogueLine;
    index: number;
    characters?: Character[];
    isSelected?: boolean;
    isLocked?: boolean;
    isDragging?: boolean;
    isDragOver?: boolean;
    isPositionActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    characters: () => [],
    isSelected: false,
    isLocked: false,
    isDragging: false,
    isDragOver: false,
    isPositionActive: false
});

defineEmits<{
    (e: 'select'): void;
    (e: 'edit'): void;
    (e: 'delete'): void;
    (e: 'update-visibility', hidden: boolean): void;
    (e: 'toggle-position'): void;
    (e: 'update-position', position: ImagePosition | undefined): void;
    (e: 'dragstart', event: DragEvent): void;
    (e: 'dragend'): void;
    (e: 'dragover', event: DragEvent): void;
    (e: 'dragleave'): void;
    (e: 'drop', event: DragEvent): void;
}>();

const getExpressionEmoji = (expression: string) => {
    const emojiMap: Record<string, string> = {
        'happy': '😊', 'sad': '😢', 'angry': '😠', 'surprised': '😲',
        'neutral': '😐', 'smile': '😄', 'concerned': '😟', 'serious': '😐',
        'mysterious': '🕵️', 'determined': '💪', 'excited': '🤩', 'tired': '😴',
        'confused': '😕', 'thinking': '🤔'
    };
    return emojiMap[expression] || '😀';
};

const getPositionIcon = (position: ImagePosition | undefined): string => {
    if (!position) return '📍';
    switch (position.position) {
        case 'left': return '◀📍';
        case 'center': return '◆📍';
        case 'right': return '📍▶';
        case 'custom': return '⚙️📍';
        default: return '📍';
    }
};

const getPositionTooltip = (position: ImagePosition | undefined): string => {
    if (!position) return 'No position set - Click to add position';
    let label = `Position: ${position.position}`;
    if (position.transform?.flip_x) label += ' (Flipped)';
    if (position.transform?.zoom && position.transform.zoom !== 1) label += ` (Zoom: ${position.transform.zoom}x)`;
    return label;
};

const outfitName = computed(() => {
    if (!props.line.expression) return undefined;
    const character = props.characters?.find(c => c.id === props.line.character?.id);
    const matchedExpression = character?.expressions?.find(e => e.name === props.line.expression);
    return matchedExpression?.outfit || props.line.outfit || undefined;
});

const voiceFileName = computed(() => {
    const path = props.line.voice_path;
    if (!path) return '';
    if (path.startsWith('blob:')) return 'Uploaded audio';
    return path.split('/').pop() || path;
});

const isPlayingVoice = ref(false);
let previewAudio: HTMLAudioElement | null = null;

const stopVoicePreview = () => {
    previewAudio?.pause();
    previewAudio = null;
    isPlayingVoice.value = false;
};

const toggleVoicePreview = () => {
    if (!props.line.voice_path) return;
    if (isPlayingVoice.value) return stopVoicePreview();

    previewAudio = new Audio(props.line.voice_path);
    previewAudio.onended = stopVoicePreview;
    previewAudio.onerror = stopVoicePreview;
    isPlayingVoice.value = true;
    previewAudio.play().catch(stopVoicePreview);
};

onUnmounted(stopVoicePreview);

const lineColor = computed(() => props.line.character?.color || '#475569');
const speakerColor = computed(() => props.line.character?.color || '#94a3b8');
</script>