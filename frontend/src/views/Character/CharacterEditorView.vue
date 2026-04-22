<template>
    <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- Header with Update Button -->
        <div class="action-bar mb-8">
            <div>
                <h1 class="section-title mb-0">Edit Character</h1>
                <p class="text-gray-400 text-sm">Update your character's appearance, expressions, and voice lines</p>
            </div>
            <div class="flex gap-3">
                <button type="button" @click="deleteCharacter" class="btn-danger px-6 py-3 text-base font-medium">
                    Delete Character
                </button>
                <button type="button" @click="updateCharacter" class="btn-primary px-6 py-3 text-base font-medium"
                    :disabled="!character.name.trim()"
                    :class="{ 'opacity-50 cursor-not-allowed': !character.name.trim() }">
                    Update Character
                </button>
            </div>
        </div>

        <!-- 3-Panel Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Panel 1: Character Info (Left) -->
            <div class="lg:col-span-1">
                <div class="panel h-full">
                    <div class="panel-header">
                        <h3 class="panel-title">Character Info</h3>
                    </div>
                    <CharacterInfoPanel :name="character.name" :nickname="character.nickname" :color="character.color"
                        :age="character.age" :birth_date="character.birth_date" :bio="character.bio"
                        @update:name="updateField('name', $event)" @update:nickname="updateField('nickname', $event)"
                        @update:color="updateField('color', $event)" @update:age="updateField('age', $event)"
                        @update:birth_date="updateField('birth_date', $event)"
                        @update:bio="updateField('bio', $event)" />
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
                            <span v-if="hasUnsavedChanges" class="text-xs text-yellow-400">* Unsaved changes</span>
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
                        @upload-audio="handleAudioUpload" @select-preview-expression="selectExpression"
                        @update-expression="updateExpression" @update-outfit="updateOutfit"
                        @update-voice="updateVoice" />
                </div>
            </div>
        </div>

        <!-- Unsaved Changes Warning Modal -->
        <div v-if="showUnsavedModal" class="modal-overlay" @click.self="closeUnsavedModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>Unsaved Changes</h3>
                    <button class="modal-close" @click="closeUnsavedModal">✕</button>
                </div>
                <div class="modal-content">
                    <p>You have unsaved changes. Do you want to save them before leaving?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" @click="discardAndLeave">Discard</button>
                    <button class="btn-secondary" @click="closeUnsavedModal">Cancel</button>
                    <button class="btn-primary" @click="saveAndLeave">Save & Leave</button>
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
import { dummyCharacters, type Character } from '@/utils/dummyData';

const route = useRoute();
const router = useRouter();

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
    default_image: string;
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
    birth_date: string;
    bio: string;
    voice_lines: VoiceLine[];
    outfits: Outfit[];
    expressions: Expression[];
}

// Original character data for comparison
const originalCharacter = ref<CharacterData | null>(null);
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
const selectedOutfit = ref<string>('');
const selectedExpression = ref<string>('');
const showUnsavedModal = ref(false);
const pendingNavigation = ref<string | null>(null);

// Computed
const hasUnsavedChanges = computed(() => {
    if (!originalCharacter.value) return false;
    return JSON.stringify(originalCharacter.value) !== JSON.stringify(character.value);
});

// Field update helper
const updateField = (field: keyof CharacterData, value: any) => {
    (character.value as any)[field] = value;
};

// Character CRUD operations
const loadCharacter = async (id: string) => {
    try {
        // Find character in dummy data
        const foundCharacter = dummyCharacters.find((c: Character) => c.id === id);

        if (foundCharacter) {
            character.value = {
                id: foundCharacter.id,
                project_id: 'test-project',
                name: foundCharacter.name,
                nickname: foundCharacter.nickname || '',
                color: foundCharacter.color,
                age: foundCharacter.age || null,
                birth_date: foundCharacter.birth_date || '',
                bio: foundCharacter.bio || '',
                voice_lines: foundCharacter.voice_lines || [],
                outfits: foundCharacter.outfits || [],
                expressions: foundCharacter.expressions?.map((exp: any) => ({
                    name: exp.name,
                    image_path: exp.image_path || '',
                    outfit: exp.outfit || '',
                    isDefault: exp.name === foundCharacter.expressions?.[0]?.name
                })) || []
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

    try {
        // Prepare data for API
        const charData = {
            id: character.value.id,
            project_id: character.value.project_id,
            name: character.value.name,
            nickname: character.value.nickname,
            color: character.value.color,
            age: character.value.age,
            birth_date: character.value.birth_date,
            bio: character.value.bio,
            voice_lines: character.value.voice_lines
                .filter(v => !v._isDeleted)
                .map(({ _isNew, _isDeleted, file, ...voice }) => voice),
            outfits: character.value.outfits
                .filter(o => !o._isDeleted)
                .map(({ _isNew, _isDeleted, ...outfit }) => outfit),
            expressions: character.value.expressions
                .filter(e => !e._isDeleted)
                .map(({ _isNew, _isDeleted, file, ...exp }) => exp)
        };

        // TODO: Call API to update
        // await characterAPI.update(character.value.id!, charData);

        console.log('Updated character data:', charData);
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
            // TODO: Call API to delete
            // await characterAPI.delete(character.value.id!);
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
// Navigation guards - REPLACE ALL of this section
const saveAndLeave = async () => {
    await updateCharacter();
    closeUnsavedModal();
};

const discardAndLeave = () => {
    // Close modal
    showUnsavedModal.value = false;

    // Navigate immediately
    if (pendingNavigation.value) {
        router.push(pendingNavigation.value);
        pendingNavigation.value = null;
    }
};

const closeUnsavedModal = () => {
    showUnsavedModal.value = false;
    // Don't clear pendingNavigation here - let discardAndLeave handle it
};

onBeforeRouteLeave((to, from, next) => {
    if (hasUnsavedChanges.value) {
        showUnsavedModal.value = true;
        pendingNavigation.value = to.fullPath;
        next(false); // Block navigation until user decides
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

    // Add navigation guard
    window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped>
/* Reuse styles from CharacterCreatorView */
.action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.section-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 0.5rem;
}

.panel {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    overflow: hidden;
}

.panel-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #334155;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.panel-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #f8fafc;
}

.btn-primary {
    background: #38bdf8;
    color: #020617;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0.75rem 1.5rem;
}

.btn-primary:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-danger {
    background: #7f1d1d;
    color: #fecaca;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0.75rem 1.5rem;
}

.btn-danger:hover {
    background: #991b1b;
    transform: translateY(-1px);
}

/* Modal styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #334155;
}

.modal-header h3 {
    color: #f8fafc;
    margin: 0;
}

.modal-close {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
}

.modal-content {
    padding: 1.5rem;
    color: #cbd5e1;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid #334155;
}

.btn-secondary {
    background: transparent;
    border: 1px solid #334155;
    color: #cbd5e1;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
}

/* Utility classes */
.text-gray-400 {
    color: #94a3b8;
}

.text-sm {
    font-size: 0.875rem;
}

.text-xs {
    font-size: 0.75rem;
}

.text-yellow-400 {
    color: #fbbf24;
}

.mb-0 {
    margin-bottom: 0;
}

.mb-8 {
    margin-bottom: 2rem;
}

.px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
}

.px-6 {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
}

.py-3 {
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
}

.py-6 {
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
}

.gap-2 {
    gap: 0.5rem;
}

.gap-3 {
    gap: 0.75rem;
}

.gap-6 {
    gap: 1.5rem;
}

.space-y-6>*+* {
    margin-top: 1.5rem;
}

.grid {
    display: grid;
}

.grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
}

.h-full {
    height: 100%;
}

.max-w-7xl {
    max-width: 80rem;
}

.mx-auto {
    margin-left: auto;
    margin-right: auto;
}

.flex {
    display: flex;
}

.justify-between {
    justify-content: space-between;
}

.items-center {
    align-items: center;
}

.flex-wrap {
    flex-wrap: wrap;
}

.opacity-50 {
    opacity: 0.5;
}

.cursor-not-allowed {
    cursor: not-allowed;
}

@media (min-width: 1024px) {
    .lg\:col-span-1 {
        grid-column: span 1 / span 1;
    }

    .lg\:col-span-2 {
        grid-column: span 2 / span 2;
    }

    .lg\:grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}
</style>