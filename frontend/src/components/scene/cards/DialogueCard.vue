<!-- frontend/src/components/scene/cards/DialogueCard.vue -->
<template>
    <div class="dialogue-line" :class="{
        narrator: !line.character,
        selected,
        'has-position': !!line.image_position,
        'is-hidden': line.speaker_visible === false,
        'dragging': isDragging,
        'drag-over': isDragOver
    }" :style="{ '--line-color': line.character?.color || '#475569' }" draggable="true" @click="emit('select', index)"
        @dragstart="handleDragStart" @dragend="handleDragEnd" @dragover.prevent="handleDragOver"
        @dragleave="handleDragLeave" @drop.prevent="handleDrop">
        <div class="drag-handle" title="Drag to reorder">
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

        <div class="line-content">
            <div class="line-header">
                <div class="speaker" :style="{ color: line.character?.color || '#94a3b8' }">
                    {{ line.character?.name || 'Narrator' }}
                    <span v-if="line.speaker_visible === false" class="hidden-badge">👻 Hidden</span>
                </div>

                <VisibilityToggle v-if="line.character" :model-value="line.speaker_visible === false"
                    @change="(hidden) => emit('update-visibility', { index, visible: !hidden })" @click.stop />

                <div v-if="line.expression" class="expression">
                    {{ getExpressionEmoji(line.expression) }}
                    <span class="expression-name">{{ line.expression }}</span>
                </div>

                <button class="position-indicator" @click.stop="emit('toggle-position', index)"
                    :class="{ active: activePositionIndex === index }" :title="getPositionTooltip(line.image_position)">
                    {{ getPositionIcon(line.image_position) }}
                </button>
            </div>

            <div class="text">{{ line.text }}</div>
        </div>

        <div class="line-actions">
            <button class="icon-btn" @click.stop="emit('edit', index)" title="Edit">✏️</button>
            <button class="icon-btn danger" @click.stop="emit('delete', index)" title="Delete">🗑️</button>
        </div>

        <div v-if="activePositionIndex === index" class="position-selector-popup" @click.stop>
            <ImagePositionSelector :model-value="line.image_position" :character-name="line.character?.name"
                :character-color="line.character?.color"
                @update:model-value="(pos) => emit('update-position', { index, position: pos })"
                @change="(pos) => emit('update-position', { index, position: pos })" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { DialogueLine } from '@/types/models';
import type { ImagePosition } from '@/components/scene/ImagePositionSelector.vue';
import VisibilityToggle from '../VisibilityToggle.vue';
import ImagePositionSelector from '../ImagePositionSelector.vue';

interface Props {
    line: DialogueLine;
    index: number;
    selected: boolean;
    activePositionIndex: number | null;
}

const props = defineProps<Props>();

interface Emits {
    (e: 'select', index: number): void;
    (e: 'edit', index: number): void;
    (e: 'delete', index: number): void;
    (e: 'update-visibility', payload: { index: number; visible: boolean }): void;
    (e: 'update-position', payload: { index: number; position: ImagePosition | undefined }): void;
    (e: 'toggle-position', index: number): void;
    (e: 'drag-start', payload: { index: number; type: string }): void;
    (e: 'drag-end'): void;
    (e: 'drag-over', index: number): void;
    (e: 'drag-leave', index: number): void;
    (e: 'drop', payload: { fromIndex: number; toIndex: number }): void;
}

const emit = defineEmits<Emits>();

// Drag state
const isDragging = ref(false);
const isDragOver = ref(false);

// Helper functions
const getExpressionEmoji = (expression: string): string => {
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

// Drag event handlers
const handleDragStart = (event: DragEvent) => {
    isDragging.value = true;
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', JSON.stringify({
            index: props.index,
            type: 'dialogue'
        }));
    }
    emit('drag-start', { index: props.index, type: 'dialogue' });
};

const handleDragEnd = () => {
    isDragging.value = false;
    isDragOver.value = false;
    emit('drag-end');
};

const handleDragOver = () => {
    if (!isDragOver.value) {
        isDragOver.value = true;
        emit('drag-over', props.index);
    }
};

const handleDragLeave = () => {
    isDragOver.value = false;
    emit('drag-leave', props.index);
};

const handleDrop = (event: DragEvent) => {
    isDragOver.value = false;
    try {
        const data = JSON.parse(event.dataTransfer?.getData('text/plain') || '{}');
        if (data.index !== undefined && data.index !== props.index) {
            emit('drop', { fromIndex: data.index, toIndex: props.index });
        }
    } catch (e) {
        console.error('Failed to parse drag data', e);
    }
};
</script>

<style scoped>
.dialogue-line {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.2s;
    cursor: pointer;
    position: relative;
    background: rgba(255, 255, 255, 0.02);
}

.dialogue-line.has-position {
    border-left: 3px solid var(--line-color, #38bdf8);
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

.dialogue-line.dragging {
    opacity: 0.5;
    transform: scale(0.95);
}

.dialogue-line.drag-over {
    border-color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    transform: translateY(4px);
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2);
}

.dialogue-line.is-hidden {
    opacity: 0.55;
    border-left: 3px solid #f87171 !important;
}

.dialogue-line.is-hidden:hover {
    opacity: 0.85;
}

.drag-handle {
    flex-shrink: 0;
    color: #475569;
    cursor: grab;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
}

.drag-handle:hover {
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.05);
}

.drag-handle:active {
    cursor: grabbing;
}

.line-content {
    flex: 1;
    min-width: 0;
}

.line-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex-wrap: wrap;
}

.speaker {
    font-weight: bold;
    font-size: 1rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.hidden-badge {
    font-size: 0.7rem;
    color: #f87171;
    font-weight: normal;
}

.expression {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #94a3b8;
    margin-left: auto;
    flex-shrink: 0;
}

.expression-name {
    font-size: 0.8rem;
    opacity: 0.8;
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
    flex-shrink: 0;
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

.text {
    color: #cbd5e1;
    line-height: 1.5;
    font-size: 1rem;
    padding: 0.5rem 0 0 0;
}

.line-actions {
    display: flex;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s;
    flex-shrink: 0;
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
</style>