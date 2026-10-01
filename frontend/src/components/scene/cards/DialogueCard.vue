<!-- frontend/src/components/scene/cards/DialogueCard.vue -->
<template>
    <div class="dialogue-line" :class="{
        narrator: !line.character,
        selected: isSelected,
        'has-position': !!line.image_position,
        'is-locked': isLocked,
        'is-hidden': line.speaker_visible === false,
        'dragging': isDragging,
        'drag-over': isDragOver
    }" :draggable="!isLocked" @click="$emit('select')" @dragstart="$emit('dragstart', $event)"
        @dragend="$emit('dragend')" @dragover.prevent="$emit('dragover', $event)" @dragleave="$emit('dragleave')"
        @drop.prevent="$emit('drop', $event)">
        <!-- Drag Handle / Lock Indicator -->
        <div v-if="isLocked" class="drag-handle lock-handle" title="Required — always first, can't be moved or deleted">
            🔒
        </div>
        <div v-else class="drag-handle" title="Drag to reorder">
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
        <div class="line-header">
            <div class="speaker">
                {{ line.character?.name || 'Narrator' }}
            </div>

            <!-- Visibility Toggle -->
            <VisibilityToggle v-if="line.character" :model-value="line.speaker_visible === false"
                @change="(hidden) => $emit('update-visibility', hidden)" @click.stop />

            <!-- Voice Indicator (only when audio is attached) -->
            <button v-if="line.voice_path" type="button" class="voice-badge" :class="{ 'is-playing': isPlayingVoice }"
                :title="`Voice: ${voiceFileName} — click to ${isPlayingVoice ? 'stop' : 'preview'}`"
                @click.stop="toggleVoicePreview">
                <span>{{ isPlayingVoice ? '⏹️' : '🔊' }}</span>
                <span class="voice-filename">{{ voiceFileName }}</span>
            </button>

            <!-- Expression & Outfit Badge -->
            <div v-if="line.expression || outfitName" class="expression">
                <span v-if="outfitName" class="outfit-badge" :title="`Outfit: ${outfitName}`">
                    👕 {{ outfitName }}
                </span>
                <span v-if="outfitName && line.expression" class="expression-divider">|</span>
                <span v-if="line.expression" class="expression-emoji-group">
                    {{ getExpressionEmoji(line.expression) }}
                    <span class="expression-name">{{ line.expression }}</span>
                </span>
            </div>

            <!-- Position Indicator Button -->
            <button type="button" class="position-indicator" @click.stop="$emit('toggle-position')"
                :class="{ active: isPositionActive }" :title="getPositionTooltip(line.image_position)">
                {{ getPositionIcon(line.image_position) }}
            </button>
        </div>

        <!-- Dialogue Text -->
        <div class="text">{{ line.text }}</div>

        <!-- Line Actions -->
        <div class="line-actions">
            <button class="icon-btn" @click.stop="$emit('edit')" title="Edit">
                ✏️
            </button>
            <button v-if="!isLocked" class="icon-btn danger" @click.stop="$emit('delete')" title="Delete">
                🗑️
            </button>
            <span v-else class="icon-btn locked-hint" title="Required — can't be deleted">
                🔒
            </span>
        </div>

        <!-- Position Selector Popup -->
        <div v-if="isPositionActive" class="position-selector-popup" @click.stop>
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

// Voice preview logic
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

// Dynamic reactive variables for Vue 3 v-bind() in CSS
const lineColor = computed(() => props.line.character?.color || '#475569');
const speakerColor = computed(() => props.line.character?.color || '#94a3b8');
</script>

<style scoped>
/* Dialogue line styles */
.dialogue-line {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 1rem;
    padding-left: 2.5rem;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.2s;
    cursor: pointer;
    position: relative;
    background: rgba(255, 255, 255, 0.02);
}

/* Drag handle */
.drag-handle {
    position: absolute;
    left: 0.25rem;
    top: 50%;
    transform: translateY(-50%);
    color: #475569;
    cursor: grab;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;
    opacity: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.dialogue-line:hover .drag-handle {
    opacity: 1;
}

.drag-handle:hover {
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.05);
}

.drag-handle:active {
    cursor: grabbing;
}

/* Drag states */
.dialogue-line.dragging {
    opacity: 0.5;
    transform: scale(0.98);
}

.dialogue-line.drag-over {
    border-color: #38bdf8;
    background: rgba(56, 189, 248, 0.08);
    transform: translateY(4px);
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15);
}

.dialogue-line.has-position {
    border-left: 3px solid v-bind(lineColor);
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
    border-left-color: #475569;
}

.line-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
}

.speaker {
    font-weight: bold;
    font-size: 1rem;
    flex-shrink: 0;
    color: v-bind(speakerColor);
}

.voice-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid rgba(56, 189, 248, 0.3);
    background: rgba(56, 189, 248, 0.1);
    color: #38bdf8;
    flex-shrink: 0;
    transition: background-color 0.2s, border-color 0.2s;
    cursor: pointer;
}

.voice-badge:hover {
    background: rgba(56, 189, 248, 0.2);
}

.voice-badge.is-playing {
    background: rgba(56, 189, 248, 0.3);
    color: #7dd3fc;
    border-color: #38bdf8;
}

.voice-filename {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.expression {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #94a3b8;
    margin-left: auto;
    flex-shrink: 0;
    white-space: nowrap;
}

.expression-emoji-group {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.expression-name {
    font-size: 0.8rem;
    opacity: 0.8;
}

.expression-divider {
    color: #475569;
    font-size: 0.75rem;
}

.expression :deep(.outfit-badge),
.expression .outfit-badge {
    color: #38bdf8;
    white-space: nowrap;
}

.position-indicator {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    font-size: 0.9rem;
    border-radius: 4px;
    transition: all 0.2s;
}

.position-indicator:hover {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
}

.position-indicator.active {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.2);
}

.position-selector-popup {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    margin-top: 0.5rem;
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
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

.lock-handle {
    cursor: default;
    opacity: 0.6;
    font-size: 0.85rem;
}

.locked-hint {
    opacity: 0.5;
    cursor: default;
}

.dialogue-line.is-hidden {
    opacity: 0.55;
    border-left: 3px solid #f87171 !important;
}

.dialogue-line.is-hidden:hover {
    opacity: 0.85;
}
</style>