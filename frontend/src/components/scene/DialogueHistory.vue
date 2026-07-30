<!-- frontend/src/components/scene/DialogueHistory.vue -->
<template>
    <div class="dialogue-history-container">
        <div class="dialogue-history-header">
            <h4>Dialogue History<span v-if="isDirty" class="dirty-indicator" title="Unsaved changes"> *</span></h4>
            <div class="header-actions">
                <span class="line-count">{{ dialogueLines.length }} lines</span>
                <button v-if="hasReordered" class="icon-btn save-order-btn" @click="saveReorderedLines"
                    title="Save new order">
                    💾 Save Order
                </button>
            </div>
        </div>
        <div class="dialogue-history">
            <div v-for="(line, index) in displayLines" :key="line.id || index" class="dialogue-line" :class="{
                narrator: line.type !== 'menu' && line.type !== 'action' && !(line as DialogueLine).character,
                selected: selectedLineIndex === index,
                'has-position': line.type !== 'menu' && line.type !== 'action' && !!(line as DialogueLine).image_position,
                'is-menu': line.type === 'menu',
                'is-action': line.type === 'action',
                'is-hidden': line.type !== 'menu' && line.type !== 'action' && (line as DialogueLine).speaker_visible === false,
                'dragging': dragState.draggingIndex === index,
                'drag-over': dragState.dragOverIndex === index
            }" :style="line.type !== 'menu' && line.type !== 'action'
                ? { '--line-color': (line as DialogueLine).character?.color || '#475569' }
                : {}" draggable="true" @click="handleSelectLine(index)" @dragstart="handleDragStart($event, index)"
                @dragend="handleDragEnd" @dragover.prevent="handleDragOver($event, index)"
                @dragleave="handleDragLeave(index)" @drop.prevent="handleDrop($event, index)">
                <!-- Drag Handle -->
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

                <!-- ── Menu node row ─────────────────────────────────── -->
                <template v-if="line.type === 'menu'">
                    <div class="line-header">
                        <span class="menu-badge">🔀 Menu</span>
                        <span v-if="(line as MenuNode).prompt" class="menu-prompt">
                            "{{ (line as MenuNode).prompt }}"
                        </span>
                        <span class="menu-count">{{ (line as MenuNode).choices.length }} choices</span>
                    </div>
                    <div class="menu-choices-preview">
                        <span v-for="(choice, ci) in (line as MenuNode).choices" :key="choice.id" class="choice-chip">
                            {{ ci + 1 }}. {{ choice.text }}
                            <span v-if="choice.effects && choice.effects.length" class="effect-dot"
                                :title="`${choice.effects.length} effect(s)`">●</span>
                        </span>
                    </div>
                </template>

                <!-- ── Action node row (e.g. mid-scene background change) ─── -->
                <template v-else-if="line.type === 'action'">
                    <div class="line-header">
                        <span class="action-badge">🖼️ Background Change</span>
                        <span class="action-preview">
                            <span v-if="(line as ActionNode).background_path" class="action-thumb">
                                <img :src="getActionThumb((line as ActionNode).background_path)" alt="" />
                            </span>
                            <span v-else class="action-thumb action-thumb-none">🚫</span>
                            {{ (line as ActionNode).background_name || (line as ActionNode).background_path ||
                                'No background' }}
                        </span>
                    </div>
                </template>

                <!-- ── Dialogue line row ─────────────────────────────── -->
                <template v-else>
                    <div class="line-header">
                        <div class="speaker" :style="{ color: (line as DialogueLine).character?.color || '#94a3b8' }">
                            {{ (line as DialogueLine).character?.name || 'Narrator' }}
                        </div>

                        <!-- Visibility toggle — only for named characters, not Narrator -->
                        <VisibilityToggle v-if="(line as DialogueLine).character"
                            :model-value="(line as DialogueLine).speaker_visible === false"
                            @change="(hidden) => updateVisibility(index, hidden)" @click.stop />

                        <div v-if="(line as DialogueLine).expression" class="expression">
                            {{ getExpressionEmoji((line as DialogueLine).expression!) }}
                            <span class="expression-name">{{ (line as DialogueLine).expression }}</span>
                        </div>
                        <!-- Position indicator button -->
                        <button class="position-indicator" @click.stop="togglePositionSelector(index)"
                            :class="{ active: activePositionLineIndex === index }"
                            :title="getPositionTooltip((line as DialogueLine).image_position)">
                            {{ getPositionIcon((line as DialogueLine).image_position) }}
                        </button>
                    </div>
                    <div class="text">{{ (line as DialogueLine).text }}</div>
                </template>

                <!-- ── Shared actions (edit/delete work for both types) ── -->
                <div class="line-actions">
                    <button class="icon-btn" @click.stop="handleEditLine(index)" title="Edit">
                        ✏️
                    </button>
                    <button class="icon-btn danger" @click.stop="handleDeleteLine(index)" title="Delete">
                        🗑️
                    </button>
                </div>

                <!-- Position Selector Popup (dialogue lines only) -->
                <div v-if="activePositionLineIndex === index && line.type !== 'menu' && line.type !== 'action'"
                    class="position-selector-popup" @click.stop>
                    <ImagePositionSelector :model-value="(line as DialogueLine).image_position"
                        :character-name="(line as DialogueLine).character?.name"
                        :character-color="(line as DialogueLine).character?.color"
                        @update:model-value="(pos) => updateLinePosition(index, pos)"
                        @change="(pos) => updateLinePosition(index, pos)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import ImagePositionSelector from '@/components/scene/ImagePositionSelector.vue';
import VisibilityToggle from '@/components/scene/VisibilityToggle.vue';
import type { DialogueLine, MenuNode, ActionNode, SceneLine } from '@/types/models';
import type { ImagePosition } from '@/components/scene/ImagePositionSelector.vue';

interface Props {
    dialogueLines: SceneLine[];
    selectedLineIndex?: number | null;
    isDirty?: boolean;
}

interface Emits {
    (e: 'select-line', index: number | null): void;
    (e: 'edit-line', index: number): void;
    (e: 'delete-line', index: number): void;
    (e: 'update-line-position', payload: { index: number; position: ImagePosition | undefined }): void;
    (e: 'update-line-visibility', payload: { index: number; visible: boolean }): void;
    (e: 'reorder-lines', lines: SceneLine[]): void;
}

const props = withDefaults(defineProps<Props>(), {
    selectedLineIndex: null,
    isDirty: false
});

const emit = defineEmits<Emits>();

// Position selector state
const activePositionLineIndex = ref<number | null>(null);

// Drag state
const dragState = ref({
    draggingIndex: null as number | null,
    dragOverIndex: null as number | null,
    fromIndex: null as number | null
});

// Reorder state
const hasReordered = ref(false);
const reorderedLines = ref<SceneLine[]>([...props.dialogueLines]);

// Watch for external changes to reset reorder state
watch(() => props.dialogueLines, (newLines) => {
    if (!hasReordered.value) {
        reorderedLines.value = [...newLines];
    }
}, { deep: true });

// Display lines - use reordered lines if reordered, otherwise props
const displayLines = computed(() => {
    return hasReordered.value ? reorderedLines.value : props.dialogueLines;
});

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

// Same demo-mode placeholder fallback used in BackgroundLibPanel — real
// blob/data/http paths render directly, seeded dummy filenames get a stand-in.
const getActionThumb = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) {
        return path;
    }
    return `https://picsum.photos/seed/${encodeURIComponent(path)}/64/64`;
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

const updateVisibility = (index: number, hidden: boolean) => {
    emit('update-line-visibility', { index, visible: !hidden });
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
};

// Drag event handlers
const handleDragStart = (event: DragEvent, index: number) => {
    dragState.value.draggingIndex = index;
    dragState.value.fromIndex = index;

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
    }
};

const handleDragEnd = () => {
    dragState.value.draggingIndex = null;
    dragState.value.dragOverIndex = null;
};

const handleDragOver = (event: DragEvent, index: number) => {
    if (dragState.value.draggingIndex !== null && dragState.value.draggingIndex !== index) {
        dragState.value.dragOverIndex = index;
    }
};

const handleDragLeave = (index: number) => {
    if (dragState.value.dragOverIndex === index) {
        dragState.value.dragOverIndex = null;
    }
};

const handleDrop = (event: DragEvent, toIndex: number) => {
    event.preventDefault();

    const fromIndex = dragState.value.fromIndex;
    if (fromIndex === null || fromIndex === toIndex) {
        dragState.value.dragOverIndex = null;
        return;
    }

    // Perform the reorder on reorderedLines
    const lines = [...reorderedLines.value];
    const [movedLine] = lines.splice(fromIndex, 1);
    if (movedLine) {
        lines.splice(toIndex, 0, movedLine);
    }

    reorderedLines.value = lines;
    hasReordered.value = true;

    // Update selection if needed
    if (props.selectedLineIndex !== null) {
        let newSelectedIndex = props.selectedLineIndex;
        if (fromIndex === props.selectedLineIndex) {
            newSelectedIndex = toIndex;
        } else if (
            fromIndex < props.selectedLineIndex &&
            toIndex >= props.selectedLineIndex
        ) {
            newSelectedIndex = props.selectedLineIndex - 1;
        } else if (
            fromIndex > props.selectedLineIndex &&
            toIndex <= props.selectedLineIndex
        ) {
            newSelectedIndex = props.selectedLineIndex + 1;
        }
        emit('select-line', newSelectedIndex);
    }

    // Reset drag state
    dragState.value.draggingIndex = null;
    dragState.value.dragOverIndex = null;
    dragState.value.fromIndex = null;
};

const saveReorderedLines = () => {
    emit('reorder-lines', reorderedLines.value);
    hasReordered.value = false;
};

// Close position selector when clicking outside.
const handleClickOutside = (event: MouseEvent) => {
    if (activePositionLineIndex.value === null) return;
    const target = event.target as HTMLElement;
    if (target.closest('.position-selector-popup')) return;
    if (target.closest('.position-indicator')) return;
    activePositionLineIndex.value = null;
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

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.line-count {
    color: #94a3b8;
    font-size: 0.85rem;
    background: rgba(56, 189, 248, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
}

.save-order-btn {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    transition: all 0.2s;
    border: none;
    cursor: pointer;
}

.save-order-btn:hover {
    background: rgba(56, 189, 248, 0.2);
    transform: scale(1.05);
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

/* Menu node gets a distinct amber accent so it's visually obvious in the list */
.dialogue-line.is-menu {
    border-left: 3px solid #f59e0b;
    background: rgba(245, 158, 11, 0.03);
}

.dialogue-line.is-menu:hover {
    border-color: rgba(245, 158, 11, 0.5);
}

.dialogue-line.is-menu.selected {
    background: rgba(245, 158, 11, 0.08);
    border-color: #f59e0b;
}

.menu-badge {
    font-size: 0.78rem;
    font-weight: 700;
    color: #f59e0b;
    letter-spacing: 0.03em;
}

/* Action node (background change) gets its own teal accent — distinct from
   the menu's amber so the two special row types don't get confused at a glance */
.dialogue-line.is-action {
    border-left: 3px solid #2dd4bf;
    background: rgba(45, 212, 191, 0.03);
}

.dialogue-line.is-action:hover {
    border-color: rgba(45, 212, 191, 0.5);
}

.dialogue-line.is-action.selected {
    background: rgba(45, 212, 191, 0.08);
    border-color: #2dd4bf;
}

.action-badge {
    font-size: 0.78rem;
    font-weight: 700;
    color: #2dd4bf;
    letter-spacing: 0.03em;
    flex-shrink: 0;
}

.action-preview {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #cbd5e1;
}

.action-thumb {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    overflow: hidden;
    border: 1px solid #334155;
    background: #0f172a;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
}

.action-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.action-thumb-none {
    color: #64748b;
}

.menu-prompt {
    flex: 1;
    font-size: 0.82rem;
    color: #94a3b8;
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.menu-count {
    font-size: 0.72rem;
    color: #64748b;
    background: rgba(245, 158, 11, 0.1);
    padding: 0.1rem 0.45rem;
    border-radius: 10px;
}

.menu-choices-preview {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding-left: 0.25rem;
}

.choice-chip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    color: #cbd5e1;
    padding: 0.2rem 0;
}

.effect-dot {
    color: #38bdf8;
    font-size: 0.6rem;
    opacity: 0.7;
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

/* Hidden character — dims the card, red left border */
.dialogue-line.is-hidden {
    opacity: 0.55;
    border-left: 3px solid #f87171 !important;
}

.dialogue-line.is-hidden:hover {
    opacity: 0.85;
}

/* Scrollbar */
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