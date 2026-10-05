<!-- frontend/src/components/scene/cards/ActionCard.vue -->
<template>
    <div class="group relative flex flex-col gap-[0.65rem] mb-4 pt-[0.9rem] pr-4 pb-4 pl-[1.25rem] rounded-[10px] border border-transparent border-l-[3px] border-l-[#2dd4bf] bg-white/[0.02] cursor-pointer transition-all duration-200 hover:bg-white/[0.045] hover:border-[#2dd4bf]/35"
        :class="{
            'bg-[#2dd4bf]/[0.08] !border-[#2dd4bf]': isSelected,
            'opacity-50': isDragging,
            'ring-2 ring-sky-400/60': isDragOver,
            'cursor-grab': !isLocked,
        }" :draggable="!isLocked" @click="emit('select', index)" @dragstart="emit('dragstart', $event)"
        @dragend="emit('dragend', $event)" @dragover.prevent="emit('dragover', $event)"
        @dragleave="emit('dragleave', $event)" @drop="emit('drop', $event)">

        <!-- Header -->
        <div class="flex items-center gap-2 min-w-0">
            <span
                class="inline-flex items-center gap-[0.35rem] px-[0.65rem] py-[0.25rem] rounded-full bg-[#2dd4bf]/10 border border-[#2dd4bf]/15 text-[#2dd4bf] text-xs font-bold tracking-[0.025em] whitespace-nowrap">
                🖼️ Background Change
            </span>

            <div class="ml-auto flex items-center gap-[0.3rem] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                :class="{ 'opacity-100': isSelected }">
                <button type="button"
                    class="w-7 h-7 flex items-center justify-center p-0 bg-transparent border-0 rounded-[5px] text-slate-400 cursor-pointer transition-colors duration-150 hover:text-slate-50 hover:bg-white/10"
                    @click.stop="emit('edit', index)" title="Edit">
                    ✏️
                </button>

                <!-- The scene's opening background line can be edited but never deleted -->
                <button v-if="!isLocked" type="button"
                    class="w-7 h-7 flex items-center justify-center p-0 bg-transparent border-0 rounded-[5px] text-slate-400 cursor-pointer transition-colors duration-150 hover:text-red-400 hover:bg-red-400/10"
                    @click.stop="emit('delete', index)" title="Delete">
                    🗑️
                </button>
            </div>
        </div>

        <!-- Background Preview -->
        <div
            class="group/preview relative w-full h-[100px] overflow-hidden rounded-[7px] border border-slate-700 bg-slate-900 isolate transition-all duration-200 group-hover:border-[#2dd4bf]/40">
            <!-- Background Image -->
            <img v-if="line.background_path" :src="getActionThumb(line.background_path)"
                :alt="line.background_name || 'Background'"
                class="absolute inset-0 w-full h-full object-cover block transition-all duration-400 group-hover:scale-[1.025]" />

            <!-- Dark Gradient -->
            <div v-if="line.background_path"
                class="absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/45 via-35% to-black/5 to-75%">
            </div>

            <!-- Empty State -->
            <div v-if="!line.background_path"
                class="absolute inset-0 flex items-center justify-center gap-2 text-slate-500 text-[0.8rem] bg-[repeating-linear-gradient(45deg,#0f172a,#0f172a_10px,#111c30_10px,#111c30_20px)]">
                <span class="text-base opacity-70">🚫</span>
                <span>No background selected</span>
            </div>

            <!-- Background Name -->
            <div v-if="line.background_path"
                class="absolute left-4 bottom-[0.65rem] z-[2] max-w-[75%] text-white text-base font-semibold leading-snug truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] [text-shadow:_0_2px_8px_rgba(0,0,0,0.6)]">
                {{ line.background_name || line.background_path || 'No background' }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ActionNode } from '@/types/models';

interface Props {
    line: ActionNode;
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

const getActionThumb = (path?: string) => {
    if (!path) return '';

    if (
        path.startsWith('blob:') ||
        path.startsWith('data:') ||
        path.startsWith('http')
    ) {
        return path;
    }

    return `https://picsum.photos/seed/${encodeURIComponent(path)}/864/100`;
};
</script>