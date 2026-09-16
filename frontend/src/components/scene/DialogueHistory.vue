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
            <template v-for="item in historyItems"
                :key="item.kind === 'divider' ? `divider-${item.index}` : (item.line.id || `line-${item.index}`)">

                <!-- ══════════════════════════════════════════════════════════
                     Insert divider — hover reveals a "+" smart-add tag.
                     Never above index 0 (the locked initial-background line
                     can't be pushed out of first place) — except when the
                     scene has no lines at all, where this is the only way
                     to add the first one.
                ══════════════════════════════════════════════════════════ -->
                <div v-if="item.kind === 'divider'" class="insert-divider relative h-4 group">
                    <div
                        class="absolute inset-x-2 top-1/2 -translate-y-1/2 h-px bg-transparent group-hover:bg-sky-400/40 transition-colors duration-200">
                    </div>

                    <button type="button"
                        class="insert-trigger absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-800 border border-gray-600 text-gray-400 text-sm leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-sky-400 hover:text-gray-900 hover:border-sky-400 transition-all duration-150 z-10"
                        :class="{ 'opacity-100 bg-sky-400 text-gray-900 border-sky-400': activeDividerIndex === item.index }"
                        @click.stop="toggleDivider(item.index)"
                        :aria-label="`Insert new line at position ${item.index + 1}`" title="Insert here">
                        +
                    </button>

                    <!-- Just the type picker — picking one inserts a blank/default
                         line immediately, no typing here. -->
                    <div v-if="activeDividerIndex === item.index" class="insert-popover
                            absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20
                            bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-2
                            grid grid-cols-3 gap-2" @click.stop>
                        <button type="button" class="btn-secondary btn-small flex flex-col items-center gap-1 !py-2"
                            @click="insertDialogueAt(item.index)" title="Insert a blank dialogue line">
                            <span class="text-base">💬</span>
                            <span class="text-[11px]">Dialogue</span>
                        </button>
                        <button type="button" class="btn-secondary btn-small flex flex-col items-center gap-1 !py-2"
                            @click="insertBackgroundAt(item.index)" title="Insert a background change">
                            <span class="text-base">🖼️</span>
                            <span class="text-[11px]">Background</span>
                        </button>
                        <button type="button" class="btn-secondary btn-small flex flex-col items-center gap-1 !py-2"
                            @click="insertMenuAt(item.index)" title="Insert a menu choice">
                            <span class="text-base">🔀</span>
                            <span class="text-[11px]">Menu</span>
                        </button>
                    </div>
                </div>

                <!-- ══════════════════════════════════════════════════════════
                     Existing line card — unchanged behavior, just reading
                     from item.line / item.index instead of line / index.
                ══════════════════════════════════════════════════════════ -->
                <div v-else class="dialogue-line" :class="{
                    narrator: item.line.type !== 'menu' && item.line.type !== 'action' && !(item.line as DialogueLine).character,
                    selected: selectedLineIndex === item.index,
                    'has-position': item.line.type !== 'menu' && item.line.type !== 'action' && !!(item.line as DialogueLine).image_position,
                    'is-menu': item.line.type === 'menu',
                    'is-action': item.line.type === 'action',
                    'is-locked': isLockedLine(item.line, item.index),
                    'is-hidden': item.line.type !== 'menu' && item.line.type !== 'action' && (item.line as DialogueLine).speaker_visible === false,
                    'dragging': dragState.draggingIndex === item.index,
                    'drag-over': dragState.dragOverIndex === item.index
                }" :style="item.line.type !== 'menu' && item.line.type !== 'action'
                    ? { '--line-color': (item.line as DialogueLine).character?.color || '#475569' }
                    : {}" :draggable="!isLockedLine(item.line, item.index)" @click="handleSelectLine(item.index)"
                    @dragstart="handleDragStart($event, item.index)" @dragend="handleDragEnd"
                    @dragover.prevent="handleDragOver($event, item.index)" @dragleave="handleDragLeave(item.index)"
                    @drop.prevent="handleDrop($event, item.index)">
                    <!-- Drag Handle — replaced with a lock icon for the required first line -->
                    <div v-if="isLockedLine(item.line, item.index)" class="drag-handle lock-handle"
                        title="Required — always first, can't be moved or deleted">
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

                    <!-- ── Menu node row ─────────────────────────────────── -->
                    <template v-if="item.line.type === 'menu'">
                        <div class="line-header">
                            <span class="menu-badge">🔀 Menu</span>
                            <span v-if="(item.line as MenuNode).prompt" class="menu-prompt">
                                "{{ (item.line as MenuNode).prompt }}"
                            </span>
                            <span class="menu-count">{{ (item.line as MenuNode).choices.length }} choices</span>
                        </div>
                        <div class="menu-choices-preview">
                            <span v-for="(choice, ci) in (item.line as MenuNode).choices" :key="choice.id"
                                class="choice-chip">
                                {{ ci + 1 }}. {{ choice.text }}
                                <span v-if="choice.effects && choice.effects.length" class="effect-dot"
                                    :title="`${choice.effects.length} effect(s)`">●</span>
                            </span>
                        </div>
                    </template>

                    <!-- ── Action node row (e.g. mid-scene background change) ─── -->
                    <template v-else-if="item.line.type === 'action'">
                        <div class="line-header action-line-header">
                            <span class="action-badge">
                                🖼️ {{ isLockedLine(item.line, item.index) ? 'Initial Background' : 'Background Change'
                                }}
                            </span>
                        </div>
                        <div class="action-banner"
                            :class="{ 'action-banner-empty': !(item.line as ActionNode).background_path }">
                            <img v-if="(item.line as ActionNode).background_path"
                                :src="getActionThumb((item.line as ActionNode).background_path)" alt=""
                                class="action-banner-img" />
                            <div class="action-banner-fade"></div>
                            <div class="action-banner-label">
                                <span v-if="!(item.line as ActionNode).background_path"
                                    class="action-banner-empty-icon">🚫</span>
                                <span class="action-name" :data-full-name="getActionName(item.line as ActionNode)">
                                    {{ getActionName(item.line as ActionNode) }}
                                </span>
                            </div>
                        </div>
                    </template>

                    <!-- ── Dialogue line row ─────────────────────────────── -->
                    <template v-else>
                        <div class="line-header">
                            <div class="speaker"
                                :style="{ color: (item.line as DialogueLine).character?.color || '#94a3b8' }">
                                {{ (item.line as DialogueLine).character?.name || 'Narrator' }}
                            </div>

                            <!-- Visibility toggle — only for named characters, not Narrator -->
                            <VisibilityToggle v-if="(item.line as DialogueLine).character"
                                :model-value="(item.line as DialogueLine).speaker_visible === false"
                                @change="(hidden) => updateVisibility(item.index, hidden)" @click.stop />

                            <div v-if="(item.line as DialogueLine).expression || resolveOutfit(item.line as DialogueLine)"
                                class="expression">
                                <span v-if="resolveOutfit(item.line as DialogueLine)" class="outfit-badge"
                                    :title="`Outfit: ${resolveOutfit(item.line as DialogueLine)}`">
                                    👕 {{ resolveOutfit(item.line as DialogueLine) }}
                                </span>
                                <span
                                    v-if="resolveOutfit(item.line as DialogueLine) && (item.line as DialogueLine).expression"
                                    class="expression-divider">|</span>
                                <span v-if="(item.line as DialogueLine).expression" class="expression-emoji-group">
                                    {{ getExpressionEmoji((item.line as DialogueLine).expression!) }}
                                    <span class="expression-name">{{ (item.line as DialogueLine).expression }}</span>
                                </span>
                            </div>
                            <!-- Position indicator button -->
                            <button class="position-indicator" @click.stop="togglePositionSelector(item.index)"
                                :class="{ active: activePositionLineIndex === item.index }"
                                :title="getPositionTooltip((item.line as DialogueLine).image_position)">
                                {{ getPositionIcon((item.line as DialogueLine).image_position) }}
                            </button>
                        </div>
                        <div class="text">{{ (item.line as DialogueLine).text }}</div>
                    </template>

                    <!-- ── Shared actions (edit/delete work for both types) ── -->
                    <div class="line-actions">
                        <button class="icon-btn" @click.stop="handleEditLine(item.index)" title="Edit">
                            ✏️
                        </button>
                        <button v-if="!isLockedLine(item.line, item.index)" class="icon-btn danger"
                            @click.stop="handleDeleteLine(item.index)" title="Delete">
                            🗑️
                        </button>
                        <span v-else class="icon-btn locked-hint" title="Required — can't be deleted">
                            🔒
                        </span>
                    </div>

                    <!-- Position Selector Popup (dialogue lines only) -->
                    <div v-if="activePositionLineIndex === item.index && item.line.type !== 'menu' && item.line.type !== 'action'"
                        class="position-selector-popup" @click.stop>
                        <ImagePositionSelector :model-value="(item.line as DialogueLine).image_position"
                            :character-name="(item.line as DialogueLine).character?.name"
                            :character-color="(item.line as DialogueLine).character?.color"
                            @update:model-value="(pos) => updateLinePosition(item.index, pos)"
                            @change="(pos) => updateLinePosition(item.index, pos)" />
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import ImagePositionSelector from '@/components/scene/ImagePositionSelector.vue';
import VisibilityToggle from '@/components/scene/VisibilityToggle.vue';
import type { DialogueLine, MenuNode, ActionNode, SceneLine, Character } from '@/types/models';
import type { ImagePosition } from '@/components/scene/ImagePositionSelector.vue';

interface Props {
    dialogueLines: SceneLine[];
    selectedLineIndex?: number | null;
    isDirty?: boolean;
    // Full character roster — needed to resolve each dialogue line's outfit
    // from its character's current expression→outfit mapping (Asset Library),
    // rather than trusting a stale per-line snapshot.
    characters?: Character[];
}

interface Emits {
    (e: 'select-line', index: number | null): void;
    (e: 'edit-line', index: number): void;
    (e: 'delete-line', index: number): void;
    (e: 'update-line-position', payload: { index: number; position: ImagePosition | undefined }): void;
    (e: 'update-line-visibility', payload: { index: number; visible: boolean }): void;
    (e: 'reorder-lines', lines: SceneLine[]): void;
    // ── New: raised by the hover insert-divider. No form data — every
    // insert is a blank/default line at this position; the parent decides
    // exactly what "blank" means for each type. ──
    (e: 'insert-dialogue', payload: { index: number }): void;
    (e: 'insert-menu', payload: { index: number }): void;
    (e: 'insert-background', payload: { index: number }): void;
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

// ── Flattened render list: a divider between every card (never above index
// 0 — the locked initial-background line can't be pushed out of first
// place) plus a trailing divider after the last card. When the scene has
// no lines yet, that trailing divider is the only one shown, at index 0. ──
type HistoryItem =
    | { kind: 'divider'; index: number }
    | { kind: 'line'; index: number; line: SceneLine };

const historyItems = computed<HistoryItem[]>(() => {
    const items: HistoryItem[] = [];
    displayLines.value.forEach((line, index) => {
        if (index > 0) {
            items.push({ kind: 'divider', index });
        }
        items.push({ kind: 'line', index, line });
    });
    items.push({ kind: 'divider', index: displayLines.value.length });
    return items;
});

// ── Insert divider state ──
const activeDividerIndex = ref<number | null>(null);

const toggleDivider = (index: number) => {
    activeDividerIndex.value = activeDividerIndex.value === index ? null : index;
};

const closeDivider = () => {
    activeDividerIndex.value = null;
};

const insertDialogueAt = (index: number) => {
    emit('insert-dialogue', { index });
    closeDivider();
};

const insertBackgroundAt = (index: number) => {
    emit('insert-background', { index });
    closeDivider();
};

const insertMenuAt = (index: number) => {
    emit('insert-menu', { index });
    closeDivider();
};

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

// Derive the outfit from the character's live expression list rather than
// trusting a per-line snapshot — keeps it accurate if outfits are reassigned
// later in the Asset Library, and ties the badge to the character record.
// Falls back to `line.outfit` only if the character/expression can't be
// resolved (e.g. character removed from the roster).
const resolveOutfit = (line: DialogueLine): string | undefined => {
    if (!line.expression) return undefined;
    const character = props.characters?.find(c => c.id === line.character?.id);
    const matchedExpression = character?.expressions?.find(e => e.name === line.expression);
    return matchedExpression?.outfit || line.outfit || undefined;
};

// The scene's mandatory opening "background: none" line — always index 0,
// always an action node flagged is_initial. Locked: no drag, no delete.
const isLockedLine = (line: SceneLine | undefined, index: number): boolean => {
    return !!line && index === 0 && line.type === 'action' && !!(line as ActionNode).is_initial;
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

const getActionName = (node: ActionNode): string => {
    return node.background_name || node.background_path || 'None';
};

// Event handlers
const handleSelectLine = (index: number) => {
    emit('select-line', index);
};

const handleEditLine = (index: number) => {
    emit('edit-line', index);
};

const handleDeleteLine = (index: number) => {
    if (isLockedLine(displayLines.value[index], index)) return;
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
    if (isLockedLine(displayLines.value[index], index)) {
        event.preventDefault();
        return;
    }

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
    if (index === 0 && isLockedLine(displayLines.value[0], 0)) return;
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
    // Index 0 is reserved for the locked initial background line — never
    // let another line get dropped there and push it out of place.
    if (toIndex === 0 && isLockedLine(reorderedLines.value[0], 0)) {
        dragState.value.dragOverIndex = null;
        dragState.value.draggingIndex = null;
        dragState.value.fromIndex = null;
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

// Close position selector / insert popover when clicking outside.
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    if (activePositionLineIndex.value !== null) {
        if (!target.closest('.position-selector-popup') && !target.closest('.position-indicator')) {
            activePositionLineIndex.value = null;
        }
    }

    if (activeDividerIndex.value !== null) {
        if (!target.closest('.insert-popover') && !target.closest('.insert-trigger')) {
            closeDivider();
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

.action-line-header {
    margin-bottom: 0.5rem;
}

/* Full-width banner — image stretches to fill the row instead of a small
   square thumbnail, with feathered left/right edges (mask) and a bottom
   gradient (fade) that both looks softer and gives the name label
   somewhere legible to sit. */
.action-banner {
    position: relative;
    width: 100%;
    height: 88px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #334155;
    background: linear-gradient(135deg, #0f172a, #1e293b);
}

.action-banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.8;
    -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
    mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
    transition: opacity 0.2s ease, transform 0.3s ease;
}

.dialogue-line:hover .action-banner-img {
    opacity: 0.95;
    transform: scale(1.03);
}

.action-banner-fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(2, 6, 23, 0.85) 0%, rgba(2, 6, 23, 0.2) 60%, transparent 100%);
    pointer-events: none;
}

.action-banner-empty {
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-banner-empty .action-banner-fade {
    background: transparent;
}

.action-banner-empty-icon {
    font-size: 1.1rem;
    color: #475569;
}

.action-banner-label {
    position: absolute;
    left: 0.75rem;
    right: 0.75rem;
    bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
}

/* Name is truncated with an ellipsis by default; hovering reveals the full
   name in a small floating tooltip built from the data attribute, so long
   filenames don't force the banner (or the row) to grow. */
.action-name {
    position: relative;
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 0.85rem;
    font-weight: 500;
    color: #f1f5f9;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
    cursor: default;
}

.action-name:hover::after {
    content: attr(data-full-name);
    position: absolute;
    left: 0;
    bottom: calc(100% + 8px);
    background: #0f172a;
    border: 1px solid #2dd4bf;
    color: #f8fafc;
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
    white-space: nowrap;
    font-size: 0.75rem;
    font-weight: 500;
    text-shadow: none;
    z-index: 20;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
    pointer-events: none;
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

/* Let the shared .outfit-badge (Tailwind design-system class from tailwind.css)
   keep its own sky-tinted color/background instead of inheriting .expression's
   muted gray text color. */
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

/* Locked initial background line — non-interactive drag handle, no
   hover "grab" affordance; row itself stays clickable to open the editor */
.lock-handle {
    cursor: default;
    opacity: 0.6;
    font-size: 0.85rem;
}

.locked-hint {
    opacity: 0.5;
    cursor: default;
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