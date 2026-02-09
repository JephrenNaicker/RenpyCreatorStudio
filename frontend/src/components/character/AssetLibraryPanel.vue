<template>
    <div class="panel max-h-[420px] overflow-y-auto scrollbar-thin space-y-6">
        <!-- Expressions Tab -->
        <div v-if="activeTab === 'expressions'" class="space-y-4">
            <div class="flex justify-between items-center">
                <h4 class="text-sm font-medium text-gray-300">Expression Images</h4>
                <button type="button" @click="$emit('add-expression')" class="btn-secondary text-sm px-3 py-1">
                    + Add Expression
                </button>
            </div>

            <!-- Upload Area -->
            <div class="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                <input type="file" ref="expressionFileInput" @change="handleExpressionFileSelect" accept="image/*"
                    multiple class="hidden" />
                <button type="button" @click="triggerExpressionFileInput" class="btn-secondary mb-2">
                    Upload Images
                </button>
                <p class="text-xs text-gray-500">Drag & drop or click to upload expression images</p>
            </div>

            <!-- Expression List -->
            <div v-if="character.expressions.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div v-for="(exp, index) in character.expressions" :key="index"
                    class="bg-gray-900 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div class="flex items-start justify-between mb-2">
                        <div class="space-y-2 flex-1">
                            <input v-model="exp.name" placeholder="Expression name" class="input text-sm"
                                @input="updateExpression(index, exp)" />
                            <select v-model="exp.outfit" @change="updateExpression(index, exp)"
                                class="input text-sm py-1">
                                <option value="">Default Outfit</option>
                                <option v-for="outfit in character.outfits" :key="outfit.name" :value="outfit.name">
                                    {{ outfit.name }}
                                </option>
                            </select>
                        </div>
                        <button type="button" @click="$emit('remove-expression', index)"
                            class="text-gray-500 hover:text-red-400 ml-2">
                            ✕
                        </button>
                    </div>

                    <!-- Image Preview -->
                    <div v-if="exp.image_path" class="cursor-pointer"
                        @click="$emit('select-preview-expression', exp.name)">
                        <div class="aspect-square bg-gray-800 rounded overflow-hidden mb-2">
                            <img v-if="exp.image_path.startsWith('http') || exp.image_path.startsWith('data:')"
                                :src="exp.image_path" :alt="exp.name" class="w-full h-full object-cover" />
                            <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
                                {{ exp.image_path }}
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 truncate">{{ exp.image_path }}</p>
                    </div>
                    <div v-else class="text-center py-4 text-gray-500 text-sm">
                        No image assigned
                    </div>
                </div>
            </div>
        </div>

        <!-- Outfits Tab -->
        <div v-if="activeTab === 'outfits'" class="space-y-4">
            <div class="flex justify-between items-center">
                <h4 class="text-sm font-medium text-gray-300">Outfits</h4>
                <button type="button" @click="$emit('add-outfit')" class="btn-secondary text-sm px-3 py-1">
                    + Add Outfit
                </button>
            </div>

            <!-- Outfit List -->
            <div class="space-y-3">
                <div v-for="(outfit, index) in character.outfits" :key="index"
                    class="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <input v-model="outfit.name" placeholder="Outfit name"
                                class="input text-sm font-medium mb-2" @input="updateOutfit(index, outfit)" />
                            <input v-model="outfit.default_image" placeholder="Default image path"
                                class="input text-sm py-1" @input="updateOutfit(index, outfit)" />
                        </div>
                        <button type="button" @click="$emit('remove-outfit', index)"
                            class="text-gray-500 hover:text-red-400 ml-3">
                            ✕
                        </button>
                    </div>

                    <!-- Outfit Preview -->
                    <div class="flex gap-2">
                        <div v-if="outfit.default_image" class="cursor-pointer"
                            @click="$emit('select-preview-outfit', outfit.name)">
                            <div class="w-20 h-20 bg-gray-800 rounded overflow-hidden">
                                <img v-if="outfit.default_image.startsWith('http') || outfit.default_image.startsWith('data:')"
                                    :src="outfit.default_image" :alt="outfit.name" class="w-full h-full object-cover" />
                                <div v-else
                                    class="w-full h-full flex items-center justify-center text-xs text-gray-500 p-1">
                                    {{ outfit.default_image }}
                                </div>
                            </div>
                            <p class="text-xs text-gray-400 mt-1">Default</p>
                        </div>

                        <!-- Additional Images -->
                        <div v-for="(img, imgIndex) in outfit.images" :key="imgIndex"
                            class="w-20 h-20 bg-gray-800 rounded overflow-hidden">
                            <img v-if="img.startsWith('http') || img.startsWith('data:')" :src="img"
                                :alt="`Outfit image ${imgIndex + 1}`" class="w-full h-full object-cover" />
                            <div v-else class="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                {{ img }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Voice Lines Tab -->
        <div v-if="activeTab === 'voice'" class="space-y-4">
            <div class="flex justify-between items-center">
                <h4 class="text-sm font-medium text-gray-300">Voice Lines</h4>
                <button type="button" @click="$emit('add-voice')" class="btn-secondary text-sm px-3 py-1">
                    + Add Voice Line
                </button>
            </div>

            <!-- Upload Area -->
            <div class="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                <input type="file" ref="voiceFileInput" @change="handleVoiceFileSelect" accept="audio/*" multiple
                    class="hidden" />
                <button type="button" @click="triggerVoiceFileInput" class="btn-secondary mb-2">
                    Upload Audio Files
                </button>
                <p class="text-xs text-gray-500">Supports MP3, WAV, OGG formats</p>
            </div>

            <!-- Voice Line List -->
            <div v-if="character.voice_lines.length > 0" class="space-y-2">
                <div v-for="(voice, index) in character.voice_lines" :key="index"
                    class="bg-gray-900 rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <input v-model="voice.line_name" placeholder="Line name (e.g., Greeting, Laugh)"
                                class="input text-sm mb-1" />
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-400">Audio:</span>
                                <input v-model="voice.audio_path" placeholder="Audio file path"
                                    class="flex-1 input text-sm py-1" />
                                <button v-if="voice.audio_path && isAudioFile(voice.audio_path)" type="button"
                                    @click="playAudio(voice.audio_path)"
                                    class="text-sm text-sky-400 hover:text-sky-300">
                                    ▶ Play
                                </button>
                            </div>
                        </div>
                        <button type="button" @click="$emit('remove-voice', index)"
                            class="text-gray-500 hover:text-red-400 ml-3">
                            ✕
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Character {
    expressions: Array<{ name: string; image_path: string; outfit: string }>;
    outfits: Array<{ name: string; default_image: string; images: string[] }>;
    voice_lines: Array<{ line_name: string; audio_path: string }>;
}

const props = defineProps<{
    character: Character;
    activeTab: 'expressions' | 'outfits' | 'voice';
}>();

const emit = defineEmits<{
    'add-expression': [];
    'remove-expression': [index: number];
    'add-outfit': [];
    'remove-outfit': [index: number];
    'add-voice': [];
    'remove-voice': [index: number];
    'upload-image': [files: File[], outfitName?: string];
    'upload-audio': [files: File[]];
    'select-preview-expression': [expressionName: string];
    'select-preview-outfit': [outfitName: string];
}>();

const expressionFileInput = ref<HTMLInputElement | null>(null);
const voiceFileInput = ref<HTMLInputElement | null>(null);

// File handling
const triggerExpressionFileInput = () => {
    expressionFileInput.value?.click();
};

const handleExpressionFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input && input.files && input.files.length > 0) {
        const files = Array.from(input.files);
        emit('upload-image', files);
    }
};

const triggerVoiceFileInput = () => {
    voiceFileInput.value?.click();
};

const handleVoiceFileSelect = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input && input.files && input.files.length > 0) {
        const files = Array.from(input.files);
        emit('upload-audio', files);
    }
};

// Helper methods
const updateExpression = (index: number, exp: any) => {
    // This ensures the parent component knows about the update
    props.character.expressions[index] = { ...exp };
};

const updateOutfit = (index: number, outfit: any) => {
    props.character.outfits[index] = { ...outfit };
};

const isAudioFile = (path: string) => {
    return /\.(mp3|wav|ogg)$/i.test(path);
};

const playAudio = (path: string) => {
    const audio = new Audio(path);
    audio.play().catch(e => console.error('Error playing audio:', e));
};
</script>