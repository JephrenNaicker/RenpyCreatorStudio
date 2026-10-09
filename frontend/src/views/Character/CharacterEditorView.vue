<template>
    <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- Header with Update Button -->
        <div class="flex justify-between items-center flex-wrap gap-4 mb-8">
            <div>
                <h1 id="page-title" class="text-3xl font-bold text-slate-50 mb-0">Edit Character</h1>
                <p id="page-description" class="text-slate-400 text-sm">Update your character's appearance, expressions,
                    and voice lines</p>
            </div>
            <div class="flex gap-3">
                <button id="btn-delete-character" type="button" @click="deleteCharacter"
                    :class="[btnBase, btnDanger, 'text-base']" aria-label="Delete character permanently">
                    Delete Character
                </button>
                <button id="btn-update-character" type="button" @click="updateCharacter"
                    :class="[btnBase, btnPrimary, 'text-base']" :disabled="!character.name.trim() || !isValid"
                    aria-label="Save character changes">
                    Update Character
                </button>
            </div>
        </div>

        <!-- 3-Panel Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Panel 1: Character Info (Left) -->
            <div class="lg:col-span-1">
                <div :class="[panel, 'h-full']">
                    <div :class="panelHeader">
                        <h3 :class="panelTitle">Character Info</h3>
                    </div>
                    <CharacterInfoPanel :name="character.name" :nickname="character.nickname" :color="character.color"
                        :age="character.age" :birth-date="character.birthDate" :bio="character.bio"
                        :character-id="character.id" :metadata="characterMetadata"
                        @update:name="updateField('name', $event)" @update:nickname="updateField('nickname', $event)"
                        @update:color="updateField('color', $event)" @update:age="updateField('age', $event)"
                        @update:birthDate="updateField('birthDate', $event)" @update:bio="updateField('bio', $event)"
                        @validate="handleValidation" />
                </div>
            </div>

            <!-- Panel 2 & 3: Right Column -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Panel 2: Preview (Top Right) -->
                <div :class="panel">
                    <div :class="panelHeader">
                        <h3 :class="panelTitle">Preview</h3>
                        <div class="flex gap-2">
                            <span class="text-xs text-slate-400">Live Preview</span>
                            <span v-if="hasUnsavedChanges" id="unsaved-indicator" class="text-xs text-amber-400">*
                                Unsaved changes</span>
                        </div>
                    </div>
                    <CharacterPreviewPanel :character="previewCharacter" :selected-outfit="selectedOutfit"
                        :selected-expression="selectedExpression" @select-outfit="selectOutfit"
                        @select-expression="selectExpression" @set-default-expression="setDefaultExpression" />
                </div>

                <!-- Panel 3: Asset Library (Bottom) -->
                <!-- AssetLibraryPanel's root also carries the global `.panel` class; the [&>.panel] variants keep it
                     matching this view's slate panel look (this used to leak in via the scoped <style>). -->
                <div
                    :class="[panel, '[&>.panel]:bg-slate-950 [&>.panel]:border-slate-700 [&>.panel]:rounded-xl [&>.panel]:overflow-hidden']">
                    <AssetLibraryPanel :character="assetLibraryCharacter" @add-expression="addExpression"
                        @remove-expression="removeExpression" @add-outfit="addOutfit" @remove-outfit="removeOutfit"
                        @add-voice="addVoice" @remove-voice="removeVoice" @upload-image="handleImageUpload"
                        @upload-audio="handleAudioUpload" @select-preview-expression="selectExpression"
                        @update-expression="updateExpression" @update-outfit="updateOutfit"
                        @update-voice="updateVoice" />
                </div>
            </div>
        </div>

        <!-- Unsaved Changes Warning Modal -->
        <div v-if="showUnsavedModal"
            class="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] backdrop-blur-sm"
            @click.self="closeUnsavedModal">
            <div class="bg-slate-950 border border-slate-700 rounded-2xl w-[90%] max-w-[500px]" role="dialog"
                aria-modal="true" aria-labelledby="unsaved-modal-title">
                <div class="flex justify-between items-center p-6 border-b border-slate-700">
                    <h3 id="unsaved-modal-title" class="m-0 text-[1.17rem] font-bold text-slate-50">Unsaved Changes
                    </h3>
                    <button id="btn-close-unsaved-modal"
                        class="bg-transparent text-2xl text-slate-400 cursor-pointer p-1" @click="closeUnsavedModal"
                        aria-label="Close modal">
                        ✕
                    </button>
                </div>
                <div class="p-6 text-slate-300">
                    <p>You have unsaved changes. Do you want to save them before leaving?</p>
                </div>
                <div class="flex justify-end gap-4 p-6 border-t border-slate-700">
                    <button id="btn-discard-changes" :class="[btnBase, btnSecondary]" @click="discardAndLeave"
                        aria-label="Discard unsaved changes">
                        Discard
                    </button>
                    <button id="btn-cancel-leave" :class="[btnBase, btnSecondary]" @click="closeUnsavedModal"
                        aria-label="Cancel and stay on page">
                        Cancel
                    </button>
                    <button id="btn-save-and-leave" :class="[btnBase, btnPrimary]" @click="saveAndLeave"
                        aria-label="Save changes and leave">
                        Save & Leave
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import CharacterInfoPanel from '@/components/character/CharacterInfoPanel.vue';
import CharacterPreviewPanel from '@/components/character/CharacterPreviewPanel.vue';
import AssetLibraryPanel from '@/components/character/AssetLibraryPanel.vue';
import { type Character } from '@/utils/dummyData';
import { getCharacter, updateCharacter as updateCharacterService, deleteCharacter as deleteCharacterService } from '@/services/characterService';

const route = useRoute();
const router = useRouter();

// --- Shared Tailwind class strings (full literals so Tailwind's scanner picks them up) ---
// Named locally so they don't collide with the global .btn-* / .panel* component classes in tailwind.css.
const btnBase =
    'px-6 py-3 rounded-lg font-medium cursor-pointer transition-all duration-200';
const btnPrimary =
    'bg-sky-400 text-slate-950 enabled:hover:opacity-90 enabled:hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed';
const btnDanger = 'bg-red-900 text-red-200 hover:bg-red-800 hover:-translate-y-px';
const btnSecondary = 'bg-transparent border border-slate-700 text-slate-300 hover:bg-slate-800';
// p-6 / mb-6 are intentional: the old scoped CSS only overrode colours, so the global
// .panel (p-6) and .panel-header (mb-6) spacing from tailwind.css still applied.
const panel = 'bg-slate-950 border border-slate-700 rounded-xl overflow-hidden p-6';
const panelHeader = 'px-6 py-4 mb-6 border-b border-slate-700 flex justify-between items-center';
const panelTitle = 'text-lg font-semibold text-slate-50';

// Types
interface VoiceLine {
    line_name: string;
    audio_path: string;
    file?: File;
    _isNew?: boolean;
    _isDeleted?: boolean;
}

interface Expression {
    name: string;
    image_path: string;
    outfit: string;
    isDefault?: boolean;
    file?: File;
    _isNew?: boolean;
    _isDeleted?: boolean;
}

interface Outfit {
    name: string;
    default_image?: string;
    _isNew?: boolean;
    _isDeleted?: boolean;
}

interface CharacterData {
    id?: string;
    project_id: string;
    name: string;
    nickname: string;
    color: string;
    age: number | null;
    birthDate: string;  // Internal camelCase for components
    bio: string;
    voice_lines: VoiceLine[];
    outfits: Outfit[];
    expressions: Expression[];
}

// Validation state
const validationErrors = ref<Record<string, string>>({});
const isValid = computed(() => Object.keys(validationErrors.value).length === 0);
const discardingChanges = ref(false);

// Character metadata
const characterMetadata = ref<{ createdAt?: string; updatedAt?: string }>({});

// Original character data for comparison
const originalCharacter = ref<CharacterData | null>(null);
const character = ref<CharacterData>({
    project_id: 'test-project',
    name: '',
    nickname: '',
    color: '#38bdf8',
    age: null,
    birthDate: '',
    bio: '',
    voice_lines: [],
    outfits: [],
    expressions: []
});

// Computed for preview panel
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

// Computed for asset library
const assetLibraryCharacter = computed(() => ({
    expressions: character.value.expressions,
    outfits: character.value.outfits,
    voice_lines: character.value.voice_lines
}));

// UI State
const selectedOutfit = ref<string>('');
const selectedExpression = ref<string>('');
const showUnsavedModal = ref(false);
const pendingNavigation = ref<string | null>(null);

// Validation handler
const handleValidation = (errors: Record<string, string>) => {
    validationErrors.value = errors;
};

// Computed
const hasUnsavedChanges = computed(() => {
    if (!originalCharacter.value) return false;
    return JSON.stringify(originalCharacter.value) !== JSON.stringify(character.value);
});

// Field update helper
const updateField = (field: keyof CharacterData, value: any) => {
    (character.value as any)[field] = value;
};

// Helper to convert snake_case from API to camelCase for internal use
const convertSnakeToCamel = (char: Character): CharacterData => {
    return {
        id: char.id,
        project_id: 'test-project',
        name: char.name,
        nickname: char.nickname || '',
        color: char.color,
        age: char.age || null,
        birthDate: char.birth_date || '',  // Convert snake_case to camelCase
        bio: char.bio || '',
        voice_lines: char.voice_lines || [],
        outfits: char.outfits || [],
        expressions: char.expressions?.map((exp: any) => ({
            name: exp.name,
            image_path: exp.image_path || '',
            outfit: exp.outfit || '',
            isDefault: exp.isDefault || false
        })) || []
    };
};

// Helper to convert camelCase to snake_case for API
// const convertCamelToSnake = (char: CharacterData) => {
//     return {
//         id: char.id,
//         project_id: char.project_id,
//         name: char.name,
//         nickname: char.nickname,
//         color: char.color,
//         age: char.age,
//         birth_date: char.birthDate,  // Convert camelCase to snake_case
//         bio: char.bio,
//         voice_lines: char.voice_lines,
//         outfits: char.outfits,
//         expressions: char.expressions
//     };
// };

// Character CRUD operations
const loadCharacter = async (id: string) => {
    try {
        const foundCharacter = await getCharacter(id);

        if (foundCharacter) {
            // Convert from API snake_case to internal camelCase
            character.value = convertSnakeToCamel(foundCharacter);

            // Set metadata
            characterMetadata.value = {
                createdAt: foundCharacter.created_at,
                updatedAt: foundCharacter.updated_at
            };

            // Set default selected expression
            const defaultExp = character.value.expressions.find(exp => exp.isDefault);
            if (defaultExp) {
                selectedExpression.value = defaultExp.name;
            } else if (character.value.expressions.length > 0 && character.value.expressions[0]) {
                selectedExpression.value = character.value.expressions[0].name;
            }

            // Deep copy original for comparison
            originalCharacter.value = JSON.parse(JSON.stringify(character.value));
        } else {
            console.error('Character not found');
            router.push('/characters');
        }
    } catch (error) {
        console.error('Error loading character:', error);
        alert('Failed to load character');
    }
};

const updateCharacter = async () => {
    if (!character.value.name.trim()) {
        alert('Please enter a character name');
        return;
    }

    if (validationErrors.value.name) {
        alert(validationErrors.value.name);
        return;
    }

    try {
        // Prepare data for the service (convert camelCase to snake_case to match Character)
        const charData = {
            name: character.value.name,
            nickname: character.value.nickname,
            color: character.value.color,
            age: character.value.age ?? undefined,
            birth_date: character.value.birthDate,  // Convert camelCase to snake_case
            bio: character.value.bio,
            voice_lines: character.value.voice_lines
                .filter(v => !v._isDeleted)
                .map(({ _isNew, _isDeleted, file, ...voice }) => voice),
            outfits: character.value.outfits
                .filter(o => !o._isDeleted)
                .map(({ _isNew, _isDeleted, ...outfit }) => ({
                    name: outfit.name,
                    default_image: outfit.default_image ?? ''
                })),
            expressions: character.value.expressions
                .filter(e => !e._isDeleted)
                .map(({ _isNew, _isDeleted, file, ...exp }) => exp)
        };

        // TODO: file uploads (charData.expressions[].file / voice_lines[].file) are not
        // sent anywhere yet — out of scope until real backend/file storage exists.
        await updateCharacterService(character.value.id!, charData);
        alert('Character updated successfully!');

        // Update original reference
        originalCharacter.value = JSON.parse(JSON.stringify(character.value));

        // Navigate back to detail view
        router.push(`/characters/${character.value.id}`);
    } catch (error) {
        console.error('Error updating character:', error);
        alert('Failed to update character. Please try again.');
    }
};

const deleteCharacter = async () => {
    if (confirm(`Are you sure you want to delete "${character.value.name}"? This action cannot be undone.`)) {
        try {
            await deleteCharacterService(character.value.id!);
            alert('Character deleted successfully!');
            router.push('/characters');
        } catch (error) {
            console.error('Error deleting character:', error);
            alert('Failed to delete character.');
        }
    }
};

// Asset management methods
const addVoice = () => {
    character.value.voice_lines.push({
        line_name: '',
        audio_path: '',
        _isNew: true
    });
};

const removeVoice = (i: number) => {
    const voice = character.value.voice_lines[i];
    if (voice && voice.line_name && !voice._isNew) {
        voice._isDeleted = true;
        character.value.voice_lines.splice(i, 1);
    } else {
        character.value.voice_lines.splice(i, 1);
    }
};

const updateVoice = (index: number, voice: VoiceLine) => {
    character.value.voice_lines[index] = voice;
};

const addOutfit = () => {
    character.value.outfits.push({
        name: '',
        default_image: '',
        _isNew: true
    });
};

const removeOutfit = (i: number) => {
    const outfit = character.value.outfits[i];
    if (outfit && outfit.name && !outfit._isNew) {
        outfit._isDeleted = true;
        character.value.outfits.splice(i, 1);
    } else {
        character.value.outfits.splice(i, 1);
    }
};

const updateOutfit = (index: number, outfit: Outfit) => {
    character.value.outfits[index] = outfit;
};

const addExpression = () => {
    const newExp: Expression = {
        name: '',
        image_path: '',
        outfit: selectedOutfit.value || '',
        isDefault: character.value.expressions.length === 0,
        _isNew: true
    };
    character.value.expressions.push(newExp);
};

const removeExpression = (i: number) => {
    const expression = character.value.expressions[i];
    if (expression && expression.name && !expression._isNew) {
        expression._isDeleted = true;
        character.value.expressions.splice(i, 1);
    } else {
        character.value.expressions.splice(i, 1);
    }
};

const updateExpression = (index: number, expression: Expression) => {
    character.value.expressions[index] = expression;
};

// Selection methods
const selectOutfit = (outfitName: string) => {
    selectedOutfit.value = outfitName;
};

const selectExpression = (expressionName: string) => {
    selectedExpression.value = expressionName;
};

const setDefaultExpression = (expressionName: string) => {
    character.value.expressions.forEach(exp => {
        exp.isDefault = exp.name === expressionName;
    });
    selectExpression(expressionName);
    console.log(`Set "${expressionName}" as default expression`);
};

// File upload handlers
const handleImageUpload = (files: File[], index: number) => {
    console.log('Uploading images:', files, 'for index:', index);
    if (character.value.expressions[index] && files[0]) {
        const objectUrl = URL.createObjectURL(files[0]);
        character.value.expressions[index].image_path = objectUrl;
        character.value.expressions[index].file = files[0];
    }
};

const handleAudioUpload = (files: File[], index: number) => {
    console.log('Uploading audio files:', files, 'for index:', index);
    if (character.value.voice_lines[index] && files[0]) {
        const objectUrl = URL.createObjectURL(files[0]);
        character.value.voice_lines[index].audio_path = objectUrl;
        character.value.voice_lines[index].file = files[0];
    }
};

// Navigation guards
const saveAndLeave = async () => {
    await updateCharacter();
    closeUnsavedModal();
};

const discardAndLeave = () => {
    showUnsavedModal.value = false;
    if (pendingNavigation.value) {
        discardingChanges.value = true;
        router.push(pendingNavigation.value);
        pendingNavigation.value = null;
    }
};

const closeUnsavedModal = () => {
    showUnsavedModal.value = false;
};

onBeforeRouteLeave((to, from, next) => {
    if (hasUnsavedChanges.value && !discardingChanges.value) {
        showUnsavedModal.value = true;
        pendingNavigation.value = to.fullPath;
        next(false);
    } else {
        next();
    }
});

const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges.value) {
        e.preventDefault();
        e.returnValue = '';
    }
};

onMounted(() => {
    const characterId = route.params.id as string;
    if (characterId) {
        loadCharacter(characterId);
    } else {
        router.push('/characters');
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>