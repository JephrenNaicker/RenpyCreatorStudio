<template>
    <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- Header with Create Button -->
        <div class="action-bar mb-8">
            <div>
                <h1 class="section-title mb-0">Create Character</h1>
                <p class="text-gray-400 text-sm">Design your character's appearance, expressions, and voice lines</p>
            </div>
            <button id="btn-create-character" type="button" @click="createCharacter"
                class="btn-primary px-6 py-3 text-base font-medium" :disabled="!character.name.trim()"
                :class="{ 'opacity-50 cursor-not-allowed': !character.name.trim() }" aria-label="Create character">
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
                        v-model:birthDate="character.birthDate" v-model:bio="character.bio" :character-id="characterId"
                        :metadata="characterMetadata" @validate="handleValidation" />
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
                    <CharacterPreviewPanel :character="previewCharacter" :selected-outfit="selectedOutfit"
                        :selected-expression="selectedExpression" @select-outfit="selectOutfit"
                        @select-expression="selectExpression" @set-default-expression="setDefaultExpression" />
                </div>

                <!-- Panel 3: Asset Library (Bottom) -->
                <div class="panel">
                    <AssetLibraryPanel :character="assetLibraryCharacter" @add-expression="addExpression"
                        @remove-expression="removeExpression" @add-outfit="addOutfit" @remove-outfit="removeOutfit"
                        @add-voice="addVoice" @remove-voice="removeVoice" @upload-image="handleImageUpload"
                        @upload-audio="handleAudioUpload" @select-preview-expression="selectExpression"
                        @update-expression="handleUpdateExpression" @update-outfit="handleUpdateOutfit"
                        @update-voice="handleUpdateVoice" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { characterAPI } from '@/services/api';
import CharacterInfoPanel from '@/components/character/CharacterInfoPanel.vue';
import CharacterPreviewPanel from '@/components/character/CharacterPreviewPanel.vue';
import AssetLibraryPanel from '@/components/character/AssetLibraryPanel.vue';

const route = useRoute();
const router = useRouter();

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

interface Outfit {
    name: string;
    default_image?: string;
}

interface CharacterData {
    project_id: string;
    name: string;
    nickname: string;
    color: string;
    age: number | null;
    birthDate: string;
    bio: string;
    voice_lines: VoiceLine[];
    outfits: Outfit[];
    expressions: Expression[];
}

// Validation errors
const validationErrors = ref<Record<string, string>>({});

// Character data
const characterId = ref<string>(''); // Will be set after creation
const characterMetadata = ref<{ createdAt?: string; updatedAt?: string }>({});

const character = ref<CharacterData>({
    project_id: (route.query.projectId as string) || 'test-project',
    name: (route.query.name as string) || '', // Pre-fill from query param
    nickname: '',
    color: '#38bdf8', // Changed default color
    age: null,
    birthDate: '',
    bio: '',
    voice_lines: [],
    outfits: [],
    expressions: []
});

// Computed for preview panel (formats data for preview)
const previewCharacter = computed(() => ({
    name: character.value.name,
    nickname: character.value.nickname,
    color: character.value.color,
    age: character.value.age,
    birthDate: character.value.birthDate,
    bio: character.value.bio,
    expressions: character.value.expressions,
    outfits: character.value.outfits
}));

// Computed for asset library (provides the character data it expects)
const assetLibraryCharacter = computed(() => ({
    expressions: character.value.expressions,
    outfits: character.value.outfits,
    voice_lines: character.value.voice_lines
}));

// UI State
const activeAssetTab = ref<'expressions' | 'outfits' | 'voice'>('expressions');
const selectedOutfit = ref<string>('');
const selectedExpression = ref<string>('');

// Validation handler
const handleValidation = (errors: Record<string, string>) => {
    validationErrors.value = errors;
};

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

// Update handlers for real-time updates
const handleUpdateExpression = (index: number, updatedExpression: Expression) => {
    character.value.expressions[index] = updatedExpression;
};

const handleUpdateOutfit = (index: number, updatedOutfit: Outfit) => {
    character.value.outfits[index] = updatedOutfit;
};

const handleUpdateVoice = (index: number, updatedVoice: VoiceLine) => {
    character.value.voice_lines[index] = updatedVoice;
};

// File upload handlers
const handleImageUpload = (files: File[], index: number) => {
    if (files[0] && character.value.expressions[index]) {
        // Store the file for later upload
        character.value.expressions[index].file = files[0];
        // Create preview URL
        character.value.expressions[index].image_path = URL.createObjectURL(files[0]);
    }
};

const handleAudioUpload = (files: File[], index: number) => {
    if (files[0] && character.value.voice_lines[index]) {
        // Store the file for later upload
        character.value.voice_lines[index].file = files[0];
        // Create preview URL
        character.value.voice_lines[index].audio_path = URL.createObjectURL(files[0]);
    }
};

const createCharacter = async () => {
    // Check for validation errors
    if (validationErrors.value.name) {
        alert(validationErrors.value.name);
        return;
    }

    if (!character.value.name.trim()) {
        alert('Please enter a character name');
        return;
    }

    try {
        const formData = new FormData();

        const charData = {
            project_id: character.value.project_id,
            name: character.value.name,
            nickname: character.value.nickname,
            color: character.value.color,
            age: character.value.age,
            birth_date: character.value.birthDate, // Convert back for API
            bio: character.value.bio,
            voice_lines: character.value.voice_lines.map(voice => ({
                line_name: voice.line_name,
                audio_path: voice.audio_path
            })),
            outfits: character.value.outfits,
            expressions: character.value.expressions.map(exp => ({
                name: exp.name,
                image_path: exp.image_path,
                outfit: exp.outfit,
                isDefault: exp.isDefault
            }))
        };

        formData.append('character', JSON.stringify(charData));

        // Append expression image files
        character.value.expressions.forEach((exp, index) => {
            if (exp.file) {
                formData.append(`expression_${index}`, exp.file);
            }
        });

        // Append voice audio files
        character.value.voice_lines.forEach((voice, index) => {
            if (voice.file) {
                formData.append(`voice_${index}`, voice.file);
            }
        });

        const response = await characterAPI.create(formData);

        // Show success message
        alert('Character created successfully!');

        // Navigate back to project or characters list
        if (character.value.project_id && character.value.project_id !== 'test-project') {
            router.push(`/projects/${character.value.project_id}`);
        } else {
            router.push('/characters');
        }
    } catch (error) {
        console.error('Error creating character:', error);
        alert('Failed to create character. Please try again.');
    }
};
</script>