<template>
    <div class="panel h-full flex flex-col">
        <!-- Tab Navigation -->
        <div class="panel-header">
            <div>
                <h3 class="panel-title">Asset Library</h3>
                <p class="text-sm text-gray-400">Manage expressions and voice lines</p>
            </div>
            <div class="tab-group">
                <button type="button" class="tab-button" @click="activeTab = 'expressions'"
                    :class="{ 'tab-button-active': activeTab === 'expressions' }">
                    Expressions
                </button>
                <button type="button" class="tab-button" @click="activeTab = 'voice'"
                    :class="{ 'tab-button-active': activeTab === 'voice' }">
                    Voice Lines
                </button>
            </div>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-y-auto scrollbar-thin">
            <!-- Expressions Tab -->
            <div v-if="activeTab === 'expressions'" class="p-4 space-y-6">
                <!-- Outfit Tags Section (At the top) -->
                <div class="mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="subsection-title mb-0">Outfit Tags</h4>
                        <button type="button" @click="addOutfit" class="btn-secondary btn-small">
                            + Add Tag
                        </button>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                        <div v-for="(outfit, index) in character.outfits" :key="index" class="outfit-tag-card">
                            <div class="flex-1 min-w-0">
                                <input v-model="outfit.name" placeholder="Outfit Name"
                                    class="bg-transparent border-none outfit-tag-name placeholder-gray-500 focus:outline-none focus:ring-0 w-full truncate"
                                    @input="updateOutfit(index, outfit)" />
                                <div class="mt-1">
                                    <span class="outfit-badge text-xs">
                                        {{ getExpressionCountForOutfit(outfit.name) }} expression(s)
                                    </span>
                                </div>
                            </div>
                            <button type="button" @click="removeOutfit(index)"
                                class="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-red-900/20 transition-colors flex-shrink-0">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Quick Add Expression -->
                <div class="upload-widget-simple" @click="addExpression">
                    <svg class="w-8 h-8 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <p class="upload-widget-title">Add Expression</p>
                    <p class="upload-widget-hint">Click to add a new expression</p>
                </div>

                <!-- Expression Cards Grid -->
                <div v-if="character.expressions.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div v-for="(exp, index) in character.expressions" :key="index" class="expression-card">
                        <div class="asset-card-header">
                            <div class="flex-1 min-w-0">
                                <input v-model="exp.name" placeholder="Expression Name"
                                    class="asset-card-title-input mb-2" @input="updateExpression(index, exp)" />

                                <!-- Outfit Tag -->
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-gray-500">Outfit:</span>
                                    <select v-model="exp.outfit" @change="updateExpression(index, exp)"
                                        class="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300 focus:outline-none focus:border-sky-400 min-w-[120px]">
                                        <option value="">Default</option>
                                        <option v-for="outfit in character.outfits" :key="outfit.name"
                                            :value="outfit.name">
                                            {{ outfit.name }}
                                        </option>
                                    </select>
                                </div>
                            </div>
                            <button type="button" @click="removeExpression(index)" class="asset-card-delete-btn">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <!-- Image Preview & Upload -->
                        <div class="expression-preview-container">
                            <div v-if="exp.image_path"
                                class="relative h-full w-full flex items-center justify-center bg-gray-900">
                                <img :src="getImageSrc(exp.image_path)" :alt="exp.name"
                                    class="w-full h-full object-contain scale-[1.20]" /> <!-- Custom scale -->
                                <div
                                    class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                    <span class="text-white text-sm font-medium truncate block">{{ exp.name }}</span>
                                </div>
                                <button type="button" @click="triggerExpressionFileInput(index)"
                                    class="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded transition-colors">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                </button>
                            </div>
                            <div v-else class="expression-upload-area" @click="triggerExpressionFileInput(index)">
                                <svg class="w-12 h-12 text-gray-600 mb-2" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span class="text-sm text-gray-400 font-medium">Upload Image</span>
                                <span class="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</span>
                            </div>
                        </div>

                        <!-- File Path (if exists) -->
                        <div v-if="exp.image_path" class="mt-2">
                            <p class="text-xs text-gray-400 truncate">{{ getFileName(exp.image_path) }}</p>
                        </div>

                        <input type="file" :id="`expressionFile_${index}`"
                            @change="(e) => handleExpressionFileSelect(e, index)" accept="image/*" class="hidden" />
                    </div>
                </div>

                <!-- Empty State for Expressions -->
                <div v-if="character.expressions.length === 0" class="empty-state mt-6">
                    <div class="empty-icon mb-4">
                        <svg class="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h4 class="text-lg font-medium text-gray-300 mb-2">No Expressions Yet</h4>
                    <p class="text-gray-400 mb-6 max-w-md mx-auto">
                        Add expressions to define different emotional states or poses for your character.
                    </p>
                </div>
            </div>

            <!-- Voice Lines Tab -->
            <div v-if="activeTab === 'voice'" class="p-4 space-y-6">
                <!-- Quick Add Voice Line -->
                <div class="upload-widget-simple" @click="addVoice">
                    <svg class="w-8 h-8 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p class="upload-widget-title">Add Voice Line</p>
                    <p class="upload-widget-hint">Click to add a new voice clip</p>
                </div>

                <!-- Voice Line Cards -->
                <div v-if="character.voice_lines.length > 0" class="space-y-3">
                    <div v-for="(voice, index) in character.voice_lines" :key="index" class="voice-line-card">
                        <div class="flex items-start justify-between">
                            <div class="flex-1 min-w-0">
                                <!-- Voice Line Name -->
                                <input v-model="voice.line_name" placeholder="Voice Line Name"
                                    class="asset-card-title-input mb-3" @input="updateVoiceLine(index, voice)" />

                                <!-- Audio Player/Upload -->
                                <div class="audio-player-compact">
                                    <button v-if="voice.audio_path" type="button" @click="playAudio(voice.audio_path)"
                                        class="w-8 h-8 rounded-full bg-sky-400/20 flex items-center justify-center text-sky-400 hover:bg-sky-400/30 transition-colors flex-shrink-0">
                                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                                clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                    <div v-else
                                        class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 flex-shrink-0">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>

                                    <div class="flex-1 min-w-0">
                                        <div v-if="voice.audio_path" class="flex items-center gap-2">
                                            <span class="text-sm text-gray-300 truncate">{{
                                                getFileName(voice.audio_path) }}</span>
                                            <span class="text-xs text-gray-500">•</span>
                                            <span class="text-xs text-gray-500">Audio file</span>
                                        </div>
                                        <div v-else class="text-sm text-gray-500">
                                            No audio file uploaded
                                        </div>
                                    </div>

                                    <button type="button" @click="triggerVoiceFileInput(index)"
                                        class="btn-secondary btn-small whitespace-nowrap flex-shrink-0">
                                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        {{ voice.audio_path ? 'Change' : 'Upload' }}
                                    </button>
                                </div>

                                <!-- Audio Path (if exists) -->
                                <input v-if="voice.audio_path" v-model="voice.audio_path"
                                    class="w-full mt-2 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-sky-400"
                                    placeholder="/audio/voice.mp3" @input="updateVoiceLine(index, voice)" />

                                <input type="file" :id="`voiceFile_${index}`"
                                    @change="(e) => handleVoiceFileSelect(e, index)" accept="audio/*" class="hidden" />
                            </div>

                            <button type="button" @click="removeVoice(index)"
                                class="asset-card-delete-btn ml-3 flex-shrink-0">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Empty State for Voice Lines -->
                <div v-if="character.voice_lines.length === 0" class="empty-state mt-6">
                    <div class="empty-icon mb-4">
                        <svg class="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <h4 class="text-lg font-medium text-gray-300 mb-2">No Voice Lines Yet</h4>
                    <p class="text-gray-400 mb-6 max-w-md mx-auto">
                        Add voice clips to bring your character to life. Upload MP3, WAV, or OGG files.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Character {
    expressions: Array<{ name: string; image_path: string; outfit: string }>;
    outfits: Array<{ name: string; default_image?: string }>;
    voice_lines: Array<{ line_name: string; audio_path: string }>;
}

const props = defineProps<{
    character: Character;
}>();

const emit = defineEmits<{
    'add-expression': [];
    'remove-expression': [index: number];
    'add-outfit': [];
    'remove-outfit': [index: number];
    'add-voice': [];
    'remove-voice': [index: number];
    'upload-image': [files: File[], index: number];
    'upload-audio': [files: File[], index: number];
    'select-preview-expression': [expressionName: string];
}>();

const activeTab = ref<'expressions' | 'voice'>('expressions');

// Helper methods
const addExpression = () => {
    emit('add-expression');
};

const removeExpression = (index: number) => {
    if (confirm('Delete this expression?')) {
        emit('remove-expression', index);
    }
};

const addOutfit = () => {
    emit('add-outfit');
};

const removeOutfit = (index: number) => {
    const outfit = props.character?.outfits?.[index];
    if (!outfit) return;

    const expressionsUsingOutfit = getExpressionCountForOutfit(outfit.name);
    if (expressionsUsingOutfit > 0) {
        if (!confirm(`This outfit tag is used by ${expressionsUsingOutfit} expression(s). Delete anyway?`)) {
            return;
        }
    } else {
        if (!confirm('Delete this outfit tag?')) return;
    }
    emit('remove-outfit', index);
};

const addVoice = () => {
    emit('add-voice');
};

const removeVoice = (index: number) => {
    if (confirm('Delete this voice line?')) {
        emit('remove-voice', index);
    }
};

const updateExpression = (index: number, exp: any) => {
    if (props.character?.expressions?.[index]) {
        props.character.expressions[index] = { ...exp };
    }
};

const updateOutfit = (index: number, outfit: any) => {
    if (props.character?.outfits?.[index]) {
        props.character.outfits[index] = { ...outfit };
    }
};

const updateVoiceLine = (index: number, voice: any) => {
    if (props.character?.voice_lines?.[index]) {
        props.character.voice_lines[index] = { ...voice };
    }
};

const getExpressionCountForOutfit = (outfitName: string) => {
    if (!outfitName || !props.character?.expressions) return 0;
    return props.character.expressions.filter(exp => exp.outfit === outfitName).length;
};

const getFileName = (path: string) => {
    return path.split('/').pop() || path;
};

// Update getImageSrc to use placeholder images
const getImageSrc = (path: string) => {
    if (!path) return '';

    // If it's a blob URL (temporary), return as is
    if (path.startsWith('blob:')) {
        return path;
    }

    // If it's a base64 string, return as is
    if (path.startsWith('data:')) {
        return path;
    }

    // If it's a path to a real image
    if (path.startsWith('http')) {
        return path;
    }

    // For dummy data, use placeholder images
    // You can use free placeholder services
    return `https://picsum.photos/400/400?random=${encodeURIComponent(path)}`;
};

// File handling
const triggerExpressionFileInput = (index: number) => {
    const fileInput = document.getElementById(`expressionFile_${index}`) as HTMLInputElement;
    if (fileInput) {
        fileInput.click();
    }
};

const handleExpressionFileSelect = (event: Event, index: number) => {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
        const files = Array.from(input.files);
        if (props.character?.expressions?.[index] && files[0]) {
            // Create object URL for preview
            const objectUrl = URL.createObjectURL(files[0]);
            props.character.expressions[index].image_path = objectUrl;
            emit('select-preview-expression', props.character.expressions[index].name);
        }
        emit('upload-image', files, index);
    }
};

const triggerVoiceFileInput = (index: number) => {
    const fileInput = document.getElementById(`voiceFile_${index}`) as HTMLInputElement;
    if (fileInput) {
        fileInput.click();
    }
};

const handleVoiceFileSelect = (event: Event, index: number) => {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
        const files = Array.from(input.files);
        if (props.character?.voice_lines?.[index] && files[0]) {
            const objectUrl = URL.createObjectURL(files[0]);
            props.character.voice_lines[index].audio_path = objectUrl;
        }
        emit('upload-audio', files, index);
    }
};

const isAudioFile = (path: string) => {
    return /\.(mp3|wav|ogg|m4a)$/i.test(path) || path.startsWith('blob:');
};

const playAudio = (path: string) => {
    const audio = new Audio(path);
    audio.play().catch(e => console.error('Error playing audio:', e));
};
</script>