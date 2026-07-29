<template>
    <div class="bg-library-panel bg-gray-900/95 backdrop-blur-sm border-l border-gray-700 h-full w-80 flex flex-col">
        <!-- Header -->
        <div class="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 class="text-white font-semibold flex items-center gap-2">
                <span>🖼️</span> Background Library
            </h3>
            <button @click="$emit('close')" id="close-background-panel"
                class="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg w-8 h-8 flex items-center justify-center transition-colors"
                aria-label="Close background library" title="Close (Esc)">
                ✕
            </button>
        </div>

        <!-- Grid of backgrounds -->
        <div class="flex-1 overflow-y-auto p-4">
            <div v-if="backgroundAssets.length === 0" class="text-gray-400 text-center py-8">
                No backgrounds yet.<br />Upload one below.
            </div>

            <div class="grid grid-cols-2 gap-3">
                <!-- "No background" — always available, clears the current scene's backdrop -->
                <div class="asset-card bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer group relative"
                    :class="{ 'ring-2 ring-sky-400': !currentBackgroundPath }" @click="$emit('clear-background')">
                    <div class="aspect-video bg-gray-900 flex items-center justify-center text-gray-500 text-2xl">
                        🚫
                    </div>
                    <div class="p-2 text-sm text-gray-300 truncate flex items-center justify-between">
                        <span>None</span>
                        <span v-if="!currentBackgroundPath" class="text-sky-400 text-xs">✓ Active</span>
                    </div>
                </div>

                <div v-for="asset in backgroundAssets" :key="asset.id" :id="`background-card-${asset.id}`"
                    class="asset-card bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer group relative"
                    :class="{ 'ring-2 ring-sky-400': asset.path === currentBackgroundPath }"
                    @click="$emit('select-background', asset)">
                    <div class="aspect-video bg-gray-700 relative">
                        <img :src="getImageSrc(asset.path)" :alt="asset.name" class="w-full h-full object-cover"
                            loading="lazy" />
                        <!-- Delete button (hover) -->
                        <button @click.stop="$emit('delete-background', asset.id)"
                            class="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete background">
                            ×
                        </button>
                    </div>
                    <div class="p-2 text-sm text-gray-300 truncate flex items-center justify-between">
                        <span :title="asset.name">{{ asset.name }}</span>
                        <span v-if="asset.path === currentBackgroundPath"
                            class="text-sky-400 text-xs flex-shrink-0 ml-1">✓</span>
                    </div>
                </div>
            </div>

            <!-- Upload area -->
            <div
                class="mt-4 border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-sky-400 transition-colors">
                <input type="file" accept="image/*" @change="handleFileUpload" class="hidden" ref="fileInput" />
                <button @click="fileInput?.click()" class="text-sky-400 hover:text-sky-300 text-sm font-medium">
                    + Upload Background
                </button>
                <p class="text-gray-500 text-xs mt-1">PNG, JPG, WEBP</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { BackgroundAsset } from '@/types/models';

defineProps<{
    backgroundAssets: BackgroundAsset[];
    currentBackgroundPath?: string | null;
}>();

const emit = defineEmits<{
    (e: 'select-background', asset: BackgroundAsset): void;
    (e: 'add-background', asset: BackgroundAsset): void;
    (e: 'delete-background', id: string): void;
    (e: 'clear-background'): void;
    (e: 'close'): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

// Esc closes the panel — a second, more discoverable way out besides the ✕
const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') emit('close');
};
onMounted(() => document.addEventListener('keydown', handleEscape));
onUnmounted(() => document.removeEventListener('keydown', handleEscape));

const getImageSrc = (path: string): string => {
    if (!path) return 'https://picsum.photos/seed/default/400/225';
    if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) {
        return path;
    }
    // Fallback for dummy filenames
    return `https://picsum.photos/seed/${encodeURIComponent(path)}/400/225`;
};

const handleFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file) return; // <-- Add this null check

    const objectUrl = URL.createObjectURL(file);
    const newAsset: BackgroundAsset = {
        id: `bg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        path: objectUrl,
        createdAt: new Date().toISOString(),
    };

    emit('add-background', newAsset);
    input.value = ''; // reset
};
</script>

<style scoped>
.bg-library-panel {
    width: 320px;
    min-width: 320px;
}

.asset-card {
    transition: all 0.2s;
}

.asset-card:hover {
    transform: translateY(-2px);
}
</style>