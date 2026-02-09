<template>
    <div class="max-w-7xl mx-auto px-4 pb-20">
        <div class="tool-card">
            <h2 class="section-title mb-6">Create Character</h2>

            <!-- 3-Panel Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <!-- Panel 1: Character Info (Left) -->
                <div class="lg:col-span-1">
                    <div class="panel h-full">
                        <h3 class="text-lg font-semibold text-white mb-4">Character Info</h3>
                        <CharacterInfoPanel v-model:name="character.name" v-model:nickname="character.nickname"
                            v-model:color="character.color" v-model:age="character.age"
                            v-model:birth_date="character.birth_date" v-model:bio="character.bio" />
                    </div>
                </div>

                <!-- Panel 2 & 3: Right Column -->
                <div class="lg:col-span-2 space-y-6">

                    <!-- Panel 2: Preview (Top Right) -->
                    <div class="panel">
                        <h3 class="text-lg font-semibold text-white mb-4">Preview</h3>
                        <CharacterPreviewPanel :character="character" :selected-outfit="selectedOutfit"
                            :selected-expression="selectedExpression" @select-outfit="selectOutfit"
                            @select-expression="selectExpression" />
                    </div>

                    <!-- Panel 3: Asset Library (Bottom) -->
                    <div class="panel">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-white">Asset Library</h3>
                            <div class="flex gap-2">
                                <button type="button" class="tab-button" @click="activeAssetTab = 'expressions'"
                                    :class="{ 'bg-gray-700': activeAssetTab === 'expressions' }">
                                    Expressions
                                </button>
                                <button type="button" class="tab-button" @click="activeAssetTab = 'outfits'"
                                    :class="{ 'bg-gray-700': activeAssetTab === 'outfits' }">
                                    Outfits
                                </button>
                                <button type="button" class="tab-button" @click="activeAssetTab = 'voice'"
                                    :class="{ 'bg-gray-700': activeAssetTab === 'voice' }">
                                    Voice Lines
                                </button>
                            </div>
                        </div>

                        <AssetLibraryPanel :character="character" :active-tab="activeAssetTab"
                            @add-expression="addExpression" @remove-expression="removeExpression"
                            @add-outfit="addOutfit" @remove-outfit="removeOutfit" @add-voice="addVoice"
                            @remove-voice="removeVoice" @upload-image="handleImageUpload"
                            @upload-audio="handleAudioUpload" @select-preview-expression="selectExpression"
                            @select-preview-outfit="selectOutfit" />
                    </div>

                </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end pt-6 mt-6 border-t border-gray-700">
                <button type="button" @click="createCharacter" class="btn-primary px-5 py-2 text-base">
                    Create Character
                </button>
            </div>

        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { characterAPI } from '@/services/api';
import CharacterInfoPanel from '@/components/character/CharacterInfoPanel.vue';
import CharacterPreviewPanel from '@/components/character/CharacterPreviewPanel.vue';
import AssetLibraryPanel from '@/components/character/AssetLibraryPanel.vue';

// Define types for better TypeScript support
interface VoiceLine {
    line_name: string;
    audio_path: string;
    file?: File;
}

interface Outfit {
    name: string;
    default_image: string;
    images: string[];
}

interface Expression {
    name: string;
    image_path: string;
    outfit: string;
    file?: File;
}

interface CharacterData {
    project_id: string;
    name: string;
    nickname: string;
    color: string;
    age: number | null;
    birth_date: string;
    bio: string;
    voice_lines: VoiceLine[];
    outfits: Outfit[];
    expressions: Expression[];
}

// Character data
const character = ref<CharacterData>({
    project_id: 'test-project',
    name: '',
    nickname: '',
    color: '#4F46E5', // Default purple
    age: null,
    birth_date: '',
    bio: '',
    voice_lines: [],
    outfits: [],
    expressions: []
});

// UI State
const activeAssetTab = ref<'expressions' | 'outfits' | 'voice'>('expressions');
const selectedOutfit = ref<string>('');
const selectedExpression = ref<string>('');

// Methods
const selectOutfit = (outfitName: string) => {
    selectedOutfit.value = outfitName;
};

const selectExpression = (expressionName: string) => {
    selectedExpression.value = expressionName;
};

// Asset management methods
const addVoice = () => {
    character.value.voice_lines.push({ line_name: '', audio_path: '' });
};

const removeVoice = (i: number) => {
    character.value.voice_lines.splice(i, 1);
};

const addOutfit = () => {
    character.value.outfits.push({ name: '', default_image: '', images: [] });
};

const removeOutfit = (i: number) => {
    character.value.outfits.splice(i, 1);
};

const addExpression = () => {
    character.value.expressions.push({ name: '', image_path: '', outfit: '' });
};

const removeExpression = (i: number) => {
    character.value.expressions.splice(i, 1);
};

// File upload handlers
const handleImageUpload = (files: File[], outfitName?: string) => {
    // Handle image upload logic here
    console.log('Uploading images:', files, 'for outfit:', outfitName);
};

const handleAudioUpload = (files: File[]) => {
    // Handle audio upload logic here
    console.log('Uploading audio files:', files);
};

const createCharacter = async () => {
    try {
        // Prepare form data for file uploads
        const formData = new FormData();

        // Create a clean character object without file references for JSON
        const charData: Omit<CharacterData, 'voice_lines' | 'expressions'> & {
            voice_lines: Omit<VoiceLine, 'file'>[];
            expressions: Omit<Expression, 'file'>[];
        } = {
            project_id: character.value.project_id,
            name: character.value.name,
            nickname: character.value.nickname,
            color: character.value.color,
            age: character.value.age,
            birth_date: character.value.birth_date,
            bio: character.value.bio,
            voice_lines: character.value.voice_lines.map(voice => ({
                line_name: voice.line_name,
                audio_path: voice.audio_path
            })),
            outfits: [...character.value.outfits],
            expressions: character.value.expressions.map(exp => ({
                name: exp.name,
                image_path: exp.image_path,
                outfit: exp.outfit
            }))
        };

        formData.append('character', JSON.stringify(charData));

        // Add files if they exist
        character.value.expressions.forEach((exp, index) => {
            if (exp.file) {
                formData.append(`expression_${index}`, exp.file);
            }
        });

        character.value.voice_lines.forEach((voice, index) => {
            if (voice.file) {
                formData.append(`voice_${index}`, voice.file);
            }
        });

        await characterAPI.create(formData);
        // Add success notification
        alert('Character created successfully!');
    } catch (error) {
        console.error('Error creating character:', error);
        alert('Failed to create character. Please try again.');
    }
};
</script>