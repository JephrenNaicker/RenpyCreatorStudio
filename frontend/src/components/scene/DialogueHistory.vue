<!-- frontend/src/components/scene/DialogueHistory.vue -->
<template>
    <div class="flex-[3] flex flex-col bg-slate-950 border border-slate-700 rounded-xl overflow-hidden min-w-[300px]">
        <div class="flex justify-between items-center px-6 py-4 bg-white/[0.03] border-b border-slate-700 shrink-0">
            <h4 class="text-slate-50 text-base font-semibold m-0">
                Dialogue History<span v-if="isDirty" class="text-sky-400 font-bold" title="Unsaved changes"> *</span>
            </h4>
            <div class="flex items-center gap-3">
                <span class="text-slate-400 text-xs bg-sky-400/10 px-3 py-1 rounded-full">{{ dialogueLines.length }}
                    lines</span>
                <button v-if="hasReordered"
                    class="text-sky-400 bg-sky-400/10 hover:bg-sky-400/20 px-3 py-1 rounded-full text-xs transition-all duration-200 hover:scale-105 border-0 cursor-pointer"
                    @click="saveReorderedLines" title="Save new order">
                    💾 Save Order
                </button>
            </div>
        </div>
        <div
            class="flex-1 overflow-y-auto p-4 relative [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-900 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
            <template v-for="item in historyItems"
                :key="item.kind === 'divider' ? `divider-${item.index}` : (item.line.id || `line-${item.index}`)">

                <!-- Insert divider -->
                <div v-if="item.kind === 'divider'" class="insert-divider relative h-4 group">
                    <div
                        class="absolute inset-x-2 top-1/2 -translate-y-1/2 h-px bg-transparent group-hover:bg-sky-400/40 transition-colors duration-200">
                    </div>

                    <button type="button"
                        class="insert-trigger absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 text-slate-400 text-sm leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-sky-400 hover:text-slate-950 hover:border-sky-400 transition-all duration-150 z-10"
                        :class="{ 'opacity-100 bg-sky-400 text-slate-950 border-sky-400': activeDividerIndex === item.index }"
                        @click.stop="toggleDivider(item.index)"
                        :aria-label="`Insert new line at position ${item.index + 1}`" title="Insert here">
                        +
                    </button>

                    <div v-if="activeDividerIndex === item.index" class="insert-popover
                            absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20
                            bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-2
                            grid grid-cols-4 gap-1.5 w-max" @click.stop>
                        <button type="button"
                            class="flex flex-col items-center gap-1 py-2 px-3 text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors cursor-pointer"
                            @click="insertDialogueAt(item.index)" title="Insert a blank dialogue line">
                            <span class="text-base">💬</span>
                            <span class="text-[11px]">Dialogue</span>
                        </button>
                        <button type="button"
                            class="flex flex-col items-center gap-1 py-2 px-3 text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors cursor-pointer"
                            @click="insertBackgroundAt(item.index)" title="Insert a background change">
                            <span class="text-base">🖼️</span>
                            <span class="text-[11px]">Background</span>
                        </button>
                        <button type="button"
                            class="flex flex-col items-center gap-1 py-2 px-3 text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors cursor-pointer"
                            @click="insertMenuAt(item.index)" title="Insert a menu choice">
                            <span class="text-base">🔀</span>
                            <span class="text-[11px]">Menu</span>
                        </button>
                        <button type="button"
                            class="flex flex-col items-center gap-1 py-2 px-3 text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-md hover:bg-slate-700 transition-colors cursor-pointer"
                            @click="insertMusicAt(item.index)" title="Insert a music change">
                            <span class="text-base">🎵</span>
                            <span class="text-[11px]">Music</span>
                        </button>
                    </div>
                </div>

                <!-- Card Component Delegation -->
                <template v-else>
                    <MenuCard v-if="item.line.type === 'menu'" :line="asMenuNode(item.line)" :index="item.index"
                        :selected="selectedLineIndex === item.index" :is-locked="isLockedLine(item.line, item.index)"
                        :is-dragging="dragState.draggingIndex === item.index"
                        :is-drag-over="dragState.dragOverIndex === item.index" @select="handleSelectLine(item.index)"
                        @edit="handleEditLine(item.index)" @delete="handleDeleteLine(item.index)"
                        @dragstart="handleDragStart($event, item.index)" @dragend="handleDragEnd"
                        @dragover="handleDragOver($event, item.index)" @dragleave="handleDragLeave(item.index)"
                        @drop="handleDrop($event, item.index)" />

                    <MusicCard v-else-if="isMusicNode(item.line)" :line="asActionNode(item.line)" :index="item.index"
                        :selected="selectedLineIndex === item.index" :is-locked="false"
                        :is-dragging="dragState.draggingIndex === item.index"
                        :is-drag-over="dragState.dragOverIndex === item.index" @select="handleSelectLine(item.index)"
                        @edit="handleEditLine(item.index)" @delete="handleDeleteLine(item.index)"
                        @dragstart="handleDragStart($event, item.index)" @dragend="handleDragEnd"
                        @dragover="handleDragOver($event, item.index)" @dragleave="handleDragLeave(item.index)"
                        @drop="handleDrop($event, item.index)" />

                    <ActionCard v-else-if="item.line.type === 'action'" :line="asActionNode(item.line)"
                        :index="item.index" :selected="selectedLineIndex === item.index"
                        :is-locked="isLockedLine(item.line, item.index)"
                        :is-dragging="dragState.draggingIndex === item.index"
                        :is-drag-over="dragState.dragOverIndex === item.index" @select="handleSelectLine(item.index)"
                        @edit="handleEditLine(item.index)" @delete="handleDeleteLine(item.index)"
                        @dragstart="handleDragStart($event, item.index)" @dragend="handleDragEnd"
                        @dragover="handleDragOver($event, item.index)" @dragleave="handleDragLeave(item.index)"
                        @drop="handleDrop($event, item.index)" />

                    <DialogueCard v-else :line="asDialogueLine(item.line)" :index="item.index" :characters="characters"
                        :is-selected="selectedLineIndex === item.index" :is-locked="isLockedLine(item.line, item.index)"
                        :is-dragging="dragState.draggingIndex === item.index"
                        :is-drag-over="dragState.dragOverIndex === item.index"
                        :is-position-active="activePositionLineIndex === item.index"
                        @select="handleSelectLine(item.index)" @edit="handleEditLine(item.index)"
                        @delete="handleDeleteLine(item.index)"
                        @update-visibility="(hidden) => updateVisibility(item.index, hidden)"
                        @toggle-position="togglePositionSelector(item.index)"
                        @update-position="(pos) => updateLinePosition(item.index, pos)"
                        @dragstart="handleDragStart($event, item.index)" @dragend="handleDragEnd"
                        @dragover="handleDragOver($event, item.index)" @dragleave="handleDragLeave(item.index)"
                        @drop="handleDrop($event, item.index)" />
                </template>
            </template>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import DialogueCard from '@/components/scene/cards/DialogueCard.vue';
import MenuCard from '@/components/scene/cards/MenuCard.vue';
import ActionCard from '@/components/scene/cards/ActionCard.vue';
import MusicCard from '@/components/scene/cards/MusicCard.vue';
import type { ActionNode, MenuNode, DialogueLine, SceneLine, Character } from '@/types/models';
import type { ImagePosition } from '@/components/scene/ImagePositionSelector.vue';

interface Props {
    dialogueLines: SceneLine[];
    selectedLineIndex?: number | null;
    isDirty?: boolean;
    characters?: Character[];
}

interface Emits {
    (e: 'select-line', index: number | null): void;
    (e: 'edit-line', index: number): void;
    (e: 'delete-line', index: number): void;
    (e: 'update-line-position', payload: { index: number; position: ImagePosition | undefined }): void;
    (e: 'update-line-visibility', payload: { index: number; visible: boolean }): void;
    (e: 'reorder-lines', lines: SceneLine[]): void;
    (e: 'insert-dialogue', payload: { index: number }): void;
    (e: 'insert-menu', payload: { index: number }): void;
    (e: 'insert-background', payload: { index: number }): void;
    (e: 'insert-music', payload: { index: number }): void;
}

const props = withDefaults(defineProps<Props>(), {
    selectedLineIndex: null,
    isDirty: false
});

const emit = defineEmits<Emits>();

const asMenuNode = (line: SceneLine) => line as MenuNode;
const asActionNode = (line: SceneLine) => line as ActionNode;
const asDialogueLine = (line: SceneLine) => line as DialogueLine;
const isMusicNode = (line: SceneLine) => line.type === 'action' && (line as ActionNode).action_type === 'music_change';

const insertMusicAt = (index: number) => {
    emit('insert-music', { index });
    closeDivider();
};

const activePositionLineIndex = ref<number | null>(null);

const dragState = ref({
    draggingIndex: null as number | null,
    dragOverIndex: null as number | null,
    fromIndex: null as number | null
});

const hasReordered = ref(false);
const reorderedLines = ref<SceneLine[]>([...props.dialogueLines]);

watch(() => props.dialogueLines, (newLines) => {
    if (!hasReordered.value) {
        reorderedLines.value = [...newLines];
    }
}, { deep: true });

const displayLines = computed(() => {
    return hasReordered.value ? reorderedLines.value : props.dialogueLines;
});

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

const isLockedLine = (line: SceneLine | undefined, index: number): boolean => {
    return !!line && index === 0 && line.type === 'action' && !!(line as ActionNode).is_initial;
};

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
    activePositionLineIndex.value = activePositionLineIndex.value === index ? null : index;
};

const updateLinePosition = (index: number, position: ImagePosition | undefined) => {
    emit('update-line-position', { index, position });
};

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

    if (toIndex === 0 && isLockedLine(reorderedLines.value[0], 0)) {
        dragState.value.dragOverIndex = null;
        dragState.value.draggingIndex = null;
        dragState.value.fromIndex = null;
        return;
    }

    const lines = [...reorderedLines.value];
    const [movedLine] = lines.splice(fromIndex, 1);
    if (movedLine) {
        lines.splice(toIndex, 0, movedLine);
    }

    reorderedLines.value = lines;
    hasReordered.value = true;

    if (props.selectedLineIndex !== null) {
        let newSelectedIndex = props.selectedLineIndex;
        if (fromIndex === props.selectedLineIndex) {
            newSelectedIndex = toIndex;
        } else if (fromIndex < props.selectedLineIndex && toIndex >= props.selectedLineIndex) {
            newSelectedIndex = props.selectedLineIndex - 1;
        } else if (fromIndex > props.selectedLineIndex && toIndex <= props.selectedLineIndex) {
            newSelectedIndex = props.selectedLineIndex + 1;
        }
        emit('select-line', newSelectedIndex);
    }

    dragState.value.draggingIndex = null;
    dragState.value.dragOverIndex = null;
    dragState.value.fromIndex = null;
};

const saveReorderedLines = () => {
    emit('reorder-lines', reorderedLines.value);
    hasReordered.value = false;
};

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

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>