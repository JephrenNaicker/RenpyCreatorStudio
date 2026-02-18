<template>
    <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- Header with Create Button -->
        <div class="action-bar mb-8">
            <div>
                <h1 class="section-title mb-0">Create Character</h1>
                <p class="text-gray-400 text-sm">Design your character's appearance, expressions, and voice lines</p>
            </div>
            <button type="button" @click="createCharacter" class="btn-primary px-6 py-3 text-base font-medium"
                :disabled="!character.name.trim()" :class="{ 'opacity-50 cursor-not-allowed': !character.name.trim() }">
                Create Character
            </button>
        </div>

        <!-- 3-Panel Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Panel 1: Character Info (Left) -->
            <div class="lg:col-span-1">
                <div class="panel h-full">
                    <div class="panel-header">
                        <h3 class="panel-title">Character Info</h3>
                    </div>
                    <CharacterInfoPanel v-model:name="character.name" v-model:nickname="character.nickname"
                        v-model:color="character.color" v-model:age="character.age"
                        v-model:birth_date="character.birth_date" v-model:bio="character.bio" />
                </div>
            </div>

            <!-- Panel 2 & 3: Right Column -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Panel 2: Preview (Top Right) -->
                <div class="panel">
                    <div class="panel-header">
                        <h3 class="panel-title">Preview</h3>
                        <div class="flex gap-2">
                            <span class="text-xs text-gray-400">Live Preview</span>
                        </div>
                    </div>
                    <CharacterPreviewPanel :character="character" :selected-outfit="selectedOutfit"
                        :selected-expression="selectedExpression" @select-outfit="selectOutfit"
                        @select-expression="selectExpression" @set-default-expression="setDefaultExpression" />
                </div>

                <!-- Panel 3: Asset Library (Bottom) -->
                <div class="panel">
                    <AssetLibraryPanel :character="character" @add-expression="addExpression"
                        @remove-expression="removeExpression" @add-outfit="addOutfit" @remove-outfit="removeOutfit"
                        @add-voice="addVoice" @remove-voice="removeVoice" @upload-image="handleImageUpload"
                        @upload-audio="handleAudioUpload" @select-preview-expression="selectExpression" />
                </div>
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

// Define types
interface VoiceLine {
    line_name: string;
    audio_path: string;
    file?: File;
}

interface Expression {
    name: string;
    image_path: string;
    outfit: string;
    isDefault?: boolean;
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
    outfits: { name: string; default_image: string }[];
    expressions: Expression[];
}

// Character data
const character = ref<CharacterData>({
    project_id: 'test-project',
    name: '',
    nickname: '',
    color: '#4F46E5',
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

// Set default expression
const setDefaultExpression = (expressionName: string) => {
    // Remove default flag from all expressions
    character.value.expressions.forEach(exp => {
        exp.isDefault = exp.name === expressionName;
    });

    // Also select this expression in the preview
    selectExpression(expressionName);

    console.log(`Set "${expressionName}" as default expression`);
};

// Asset management methods
const addVoice = () => {
    character.value.voice_lines.push({ line_name: '', audio_path: '' });
};

const removeVoice = (i: number) => {
    character.value.voice_lines.splice(i, 1);
};

const addOutfit = () => {
    character.value.outfits.push({ name: '', default_image: '' });
};

const removeOutfit = (i: number) => {
    character.value.outfits.splice(i, 1);
};

const addExpression = () => {
    const newExp = {
        name: '',
        image_path: '',
        outfit: '',
        isDefault: character.value.expressions.length === 0 // First expression becomes default
    };
    character.value.expressions.push(newExp);
};

const removeExpression = (i: number) => {
    const wasDefault = character.value.expressions[i]?.isDefault;
    character.value.expressions.splice(i, 1);

    // If we removed the default expression, set a new default if there are other expressions
    if (wasDefault && character.value.expressions.length > 0) {
        // Find first expression with an image, or just the first expression
        const newDefault = character.value.expressions.find(exp => exp.image_path) || character.value.expressions[0];
        if (newDefault) {
            newDefault.isDefault = true;
            selectExpression(newDefault.name);
        }
    }
};

// File upload handlers
const handleImageUpload = (files: File[], index: number) => {
    console.log('Uploading images:', files, 'for index:', index);
};

const handleAudioUpload = (files: File[]) => {
    console.log('Uploading audio files:', files);
};

const createCharacter = async () => {
    if (!character.value.name.trim()) {
        alert('Please enter a character name');
        return;
    }

    try {
        const formData = new FormData();

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
                outfit: exp.outfit,
                isDefault: exp.isDefault
            }))
        };

        formData.append('character', JSON.stringify(charData));

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
        alert('Character created successfully!');
    } catch (error) {
        console.error('Error creating character:', error);
        alert('Failed to create character. Please try again.');
    }
};
</script>