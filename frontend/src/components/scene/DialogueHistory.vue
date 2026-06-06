<template>
    <div class="dialogue-history-container">
        <div class="dialogue-history-header">
            <h4>Dialogue History<span v-if="isDirty" class="dirty-indicator" title="Unsaved changes"> *</span></h4>
            <span class="line-count">{{ dialogueLines.length }} lines</span>
        </div>
        <div class="dialogue-history">
            <div v-for="(line, index) in dialogueLines" :key="line.id || index" class="dialogue-line" :class="{
                narrator: !line.character,
                selected: selectedLineIndex === index,
                'has-position': line.image_position
            }" @click="handleSelectLine(index)">
                <div class="line-header">
                    <div class="speaker" :style="{ color: line.character?.color || '#94a3b8' }">
                        {{ line.character?.name || 'Narrator' }}
                    </div>
                    <div v-if="line.expression" class="expression">
                        {{ getExpressionEmoji(line.expression) }}
                        <span class="expression-name">{{ line.expression }}</span>
                    </div>
                    <!-- Position indicator button -->
                    <button class="position-indicator" @click.stop="togglePositionSelector(index)"
                        :class="{ active: activePositionLineIndex === index }"
                        :title="getPositionTooltip(line.image_position)">
                        {{ getPositionIcon(line.image_position) }}
                    </button>
                </div>
                <div class="text">{{ line.text }}</div>
                <div class="line-actions">
                    <button class="icon-btn" @click.stop="handleEditLine(index)" title="Edit">
                        ✏️
                    </button>
                    <button class="icon-btn danger" @click.stop="handleDeleteLine(index)" title="Delete">
                        🗑️
                    </button>
                </div>

                <!-- Position Selector Popup -->
                <div v-if="activePositionLineIndex === index" class="position-selector-popup" @click.stop>
                    <ImagePositionSelector :model-value="line.image_position" :character-name="line.character?.name"
                        :character-color="line.character?.color"
                        @update:model-value="(pos) => updateLinePosition(index, pos)"
                        @change="(pos) => updateLinePosition(index, pos)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import ImagePositionSelector from '@/components/scene/ImagePositionSelector.vue';
import type { DialogueLine } from '@/types/models';
import type { ImagePosition } from '@/components/scene/ImagePositionSelector.vue';

interface Props {
    dialogueLines: DialogueLine[];
    selectedLineIndex?: number | null;
    isDirty?: boolean;
}

interface Emits {
    (e: 'select-line', index: number | null): void;
    (e: 'edit-line', index: number): void;
    (e: 'delete-line', index: number): void;
    (e: 'update-line-position', payload: { index: number; position: ImagePosition | undefined }): void;
}

const props = withDefaults(defineProps<Props>(), {
    selectedLineIndex: null,
    isDirty: false
});

const emit = defineEmits<Emits>();

// Position selector state
const activePositionLineIndex = ref<number | null>(null);

// Helper functions
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

// Event handlers
const handleSelectLine = (index: number) => {
    emit('select-line', index);
};

const handleEditLine = (index: number) => {
    emit('edit-line', index);
};

const handleDeleteLine = (index: number) => {
    emit('delete-line', index);
};

const togglePositionSelector = (index: number) => {
    if (activePositionLineIndex.value === index) {
        activePositionLineIndex.value = null;
    } else {
        activePositionLineIndex.value = index;
    }
};

const updateLinePosition = (index: number, position: ImagePosition | undefined) => {
    emit('update-line-position', { index, position });
    activePositionLineIndex.value = index;
};

// Close position selector when clicking outside
const handleClickOutside = (event: MouseEvent) => {
    if (activePositionLineIndex.value !== null) {
        const target = event.target as HTMLElement;
        const popup = document.getElementById(`position-popup-${activePositionLineIndex.value}`);
        const btn = document.getElementById(`position-btn-${activePositionLineIndex.value}`);

        if (popup && !popup.contains(target) && btn && !btn.contains(target)) {
            activePositionLineIndex.value = null;
        }
    }
};

// Lifecycle hooks
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.dirty-indicator {
    color: #38bdf8;
    font-weight: bold;
}

.dialogue-history-container {
    flex: 3;
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
    position: relative;
}

/* Dialogue line styles */
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
    position: relative;
}

.dialogue-line.has-position {
    border-left: 3px solid #38bdf8;
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

/* Scrollbar styling */
.dialogue-history::-webkit-scrollbar {
    width: 6px;
}

.dialogue-history::-webkit-scrollbar-track {
    background: #0f172a;
    border-radius: 3px;
}

.dialogue-history::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
}

.dialogue-history::-webkit-scrollbar-thumb:hover {
    background: #475569;
}
</style>