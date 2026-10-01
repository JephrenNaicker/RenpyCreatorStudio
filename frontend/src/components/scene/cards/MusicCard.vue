<!-- frontend/src/components/scene/cards/MusicCard.vue -->
<template>
    <div class="group relative flex flex-col gap-2.5 mb-4 pl-5 pr-4 py-3.5 rounded-[10px] border border-l-[3px] border-l-violet-400 cursor-pointer transition-colors"
        :class="[
            selected ? 'bg-violet-400/10 border-violet-400/40' : 'border-transparent bg-white/[0.02] hover:bg-white/[0.045]',
            isDragging ? 'opacity-50' : '',
            isDragOver ? 'ring-1 ring-violet-400/60' : ''
        ]" :draggable="!isLocked" @dragover.prevent @click="emit('select', index)">

        <!-- Header -->
        <div class="flex items-center gap-2 min-w-0">
            <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-400/10 border border-violet-400/20 text-violet-300 text-xs font-bold tracking-wide whitespace-nowrap">
                {{ isStop ? '⏹️ Stop Music' : '🎵 Play Music' }}
            </span>

            <span v-if="fadeLabel"
                class="text-xs text-gray-400 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5 whitespace-nowrap">
                {{ fadeLabel }}
            </span>

            <div class="ml-auto flex items-center gap-1 transition-opacity"
                :class="selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'">
                <button type="button"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-50 hover:bg-white/10 transition-colors"
                    title="Edit" @click.stop="emit('edit', index)">
                    ✏️
                </button>
                <button type="button"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Delete" @click.stop="emit('delete', index)">
                    🗑️
                </button>
            </div>
        </div>

        <!-- Body: stop -->
        <div v-if="isStop"
            class="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-400">
            Music stops here
        </div>

        <!-- Body: play with a track -->
        <div v-else-if="line.music_path"
            class="flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2">
            <button type="button"
                class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
                :class="isPlaying ? 'bg-violet-400/30 text-violet-200' : 'bg-violet-400/15 text-violet-300 hover:bg-violet-400/25'"
                :title="isPlaying ? 'Stop preview' : 'Preview track'" @click.stop="togglePreview">
                <span class="text-sm">{{ isPlaying ? '⏹️' : '▶️' }}</span>
            </button>
            <div class="min-w-0 flex-1">
                <p class="text-sm text-gray-100 truncate">{{ trackName }}</p>
                <p class="text-xs text-gray-500">Loops until changed or stopped</p>
            </div>
        </div>

        <!-- Body: play with no track chosen yet -->
        <div v-else
            class="flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-700 px-3 py-4 text-sm text-gray-500">
            <span>🚫</span>
            <span>No track selected. Click edit to pick one.</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue';
import type { ActionNode } from '@/types/models';

interface Props {
    line: ActionNode;
    index: number;
    selected?: boolean;
    isLocked?: boolean;
    isDragging?: boolean;
    isDragOver?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    selected: false,
    isLocked: false,
    isDragging: false,
    isDragOver: false
});

interface Emits {
    (e: 'select', index: number): void;
    (e: 'edit', index: number): void;
    (e: 'delete', index: number): void;
}

const emit = defineEmits<Emits>();

const isStop = computed(() => props.line.music_mode === 'stop');

const trackName = computed(() => {
    if (props.line.music_name) return props.line.music_name;
    const path = props.line.music_path ?? '';
    if (path.startsWith('blob:')) return 'Uploaded track';
    return path.split('/').pop() || path;
});

const fadeLabel = computed(() => {
    const fade = props.line.music_fade;
    if (!fade || fade <= 0) return '';
    return `${isStop.value ? 'Fade out' : 'Fade in'} ${fade}s`;
});

// --- Preview playback (same approach as the voice icon on DialogueCard) ---
const isPlaying = ref(false);
let previewAudio: HTMLAudioElement | null = null;

const stopPreview = () => {
    previewAudio?.pause();
    previewAudio = null;
    isPlaying.value = false;
};

const togglePreview = () => {
    if (!props.line.music_path) return;
    if (isPlaying.value) return stopPreview();

    previewAudio = new Audio(props.line.music_path);
    previewAudio.onended = stopPreview;
    previewAudio.onerror = stopPreview;
    isPlaying.value = true;
    previewAudio.play().catch(stopPreview);
};

onUnmounted(stopPreview);
</script>