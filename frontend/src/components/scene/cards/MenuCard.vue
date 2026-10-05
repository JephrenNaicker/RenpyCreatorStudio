<!-- frontend/src/components/scene/cards/MenuCard.vue -->
<template>
    <div class="group relative flex flex-col gap-3 mb-4 p-4 rounded-lg bg-amber-500/[0.08] border border-amber-500/25 border-l-4 border-l-amber-400 cursor-pointer transition-all duration-200 hover:bg-amber-500/[0.14] hover:border-amber-500/40"
        :class="{
            '!bg-amber-500/20 !border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.2)]': isSelected,
            'opacity-50': isDragging,
            'ring-2 ring-sky-400/60': isDragOver,
            'cursor-grab': !isLocked,
        }" :draggable="!isLocked" @click="emit('select', index)" @dragstart="emit('dragstart', $event)"
        @dragend="emit('dragend', $event)" @dragover.prevent="emit('dragover', $event)"
        @dragleave="emit('dragleave', $event)" @drop="emit('drop', $event)">

        <div class="flex items-center gap-3 min-w-0">
            <span
                class="bg-amber-500/25 text-amber-200 text-[0.8rem] font-semibold px-2.5 py-1 rounded-md border border-amber-500/30">
                🔀 Menu
            </span>
            <span v-if="line.prompt" class="text-amber-100 font-medium text-[0.95rem]">
                "{{ line.prompt }}"
            </span>
            <span class="text-amber-400 text-[0.8rem] ml-auto">
                {{ line.choices.length }} choices
            </span>
        </div>

        <div class="flex flex-wrap gap-2">
            <span v-for="(choice, ci) in line.choices" :key="choice.id"
                class="bg-slate-900/60 border border-amber-500/30 text-slate-300 text-[0.85rem] px-2.5 py-1 rounded-md inline-flex items-center gap-[0.35rem]">
                {{ ci + 1 }}. {{ choice.text }}
                <span v-if="choice.effects?.length" class="text-sky-400 text-[0.7rem]"
                    :title="`${choice.effects.length} effect(s)`">●</span>
            </span>
        </div>

        <div class="flex gap-2 justify-end opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <button type="button"
                class="bg-transparent border-0 text-slate-400 cursor-pointer p-1 text-sm rounded transition-all duration-200 hover:text-slate-50 hover:bg-white/10"
                @click.stop="emit('edit', index)" title="Edit">✏️</button>
            <button v-if="!isLocked" type="button"
                class="bg-transparent border-0 text-slate-400 cursor-pointer p-1 text-sm rounded transition-all duration-200 hover:text-red-400 hover:bg-red-400/10"
                @click.stop="emit('delete', index)" title="Delete">🗑️</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { MenuNode } from '@/types/models';

interface Props {
    line: MenuNode;
    index: number;
    isSelected?: boolean;
    isLocked?: boolean;
    isDragging?: boolean;
    isDragOver?: boolean;
}

withDefaults(defineProps<Props>(), {
    isSelected: false,
    isLocked: false,
    isDragging: false,
    isDragOver: false,
});

interface Emits {
    (e: 'select', index: number): void;
    (e: 'edit', index: number): void;
    (e: 'delete', index: number): void;
    (e: 'dragstart', event: DragEvent): void;
    (e: 'dragend', event: DragEvent): void;
    (e: 'dragover', event: DragEvent): void;
    (e: 'dragleave', event: DragEvent): void;
    (e: 'drop', event: DragEvent): void;
}

const emit = defineEmits<Emits>();
</script>