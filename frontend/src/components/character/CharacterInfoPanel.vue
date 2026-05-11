<template>
    <form class="space-y-4" @submit.prevent>
        <!-- Name -->
        <div class="space-y-1">
            <label :for="fieldIds.name" class="input-label">Character Name *</label>
            <input :id="fieldIds.name" :value="name" @input="handleInput($event, 'name')" class="input"
                placeholder="Enter character name" required :aria-required="true"
                :aria-describedby="nameError ? `${fieldIds.name}-error` : undefined" />
            <div v-if="nameError" :id="`${fieldIds.name}-error`" class="text-red-400 text-xs mt-1">
                {{ nameError }}
            </div>
        </div>

        <!-- Nickname -->
        <div class="space-y-1">
            <label :for="fieldIds.nickname" class="input-label">Display Name / Alias</label>
            <input :id="fieldIds.nickname" :value="nickname" @input="handleInput($event, 'nickname')" class="input"
                placeholder="Optional nickname" />
            <p class="text-xs text-gray-500">Used as the character's display name in dialogue</p>
        </div>

        <!-- Color Picker -->
        <div class="space-y-1">
            <label :for="fieldIds.color" class="input-label">Theme Color</label>
            <div class="flex items-center gap-3">
                <div class="relative">
                    <!-- Hidden color input -->
                    <input :id="fieldIds.color" type="color" :value="color" @input="handleColorInput($event)"
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <!-- Visible color display -->
                    <div
                        class="flex items-center gap-2 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-500 transition-colors">
                        <span class="w-6 h-6 rounded border border-gray-600" :style="{ backgroundColor: color }"></span>
                        <span class="text-sm text-gray-200 font-mono select-all">{{ color.toUpperCase() }}</span>
                    </div>
                </div>
                <button type="button" @click="showColorPresets = !showColorPresets"
                    class="text-xs text-sky-400 hover:text-sky-300">
                    {{ showColorPresets ? 'Hide' : 'Show' }} Presets
                </button>
            </div>

            <!-- Color Presets -->
            <div v-if="showColorPresets" class="flex flex-wrap gap-2 mt-2 p-2 bg-gray-800/50 rounded-lg">
                <button v-for="preset in colorPresets" :key="preset.value" type="button"
                    class="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                    :style="{ backgroundColor: preset.value }" :title="preset.name"
                    @click="emit('update:color', preset.value)" />
            </div>
        </div>

        <!-- Age & Birth Date -->
        <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
                <label :for="fieldIds.age" class="input-label">Age</label>
                <input :id="fieldIds.age" type="number" :value="age" @input="handleNumberInput($event, 'age')"
                    class="input" placeholder="Optional" min="0" max="999" />
            </div>

            <div class="space-y-1">
                <label :for="fieldIds.birthDate" class="input-label">Birth Date</label>
                <input :id="fieldIds.birthDate" type="text" :value="birthDate" @input="handleInput($event, 'birthDate')"
                    class="input font-mono" placeholder="MM/DD" maxlength="5" />
                <p class="text-xs text-gray-500">Format: MM/DD (e.g., 12/25)</p>
            </div>
        </div>

        <!-- Bio -->
        <div class="space-y-1">
            <div class="flex justify-between items-center">
                <label :for="fieldIds.bio" class="input-label">Biography</label>
                <span class="text-xs text-gray-500" :class="{ 'text-amber-500': bio.length > maxBioLength }">
                    {{ bio.length }}/{{ maxBioLength }}
                </span>
            </div>
            <textarea :id="fieldIds.bio" :value="bio" @input="handleBioInput($event)" rows="4" class="input"
                placeholder="Character description, personality, background..." :maxlength="maxBioLength" />
        </div>

        <!-- Metadata (for reference) -->
        <div v-if="metadata" class="pt-4 border-t border-gray-700">
            <div class="text-xs text-gray-500 space-y-1">
                <div v-if="metadata.createdAt">
                    <span class="font-medium">Created:</span>
                    {{ formatDate(metadata.createdAt) }}
                </div>
                <div v-if="metadata.updatedAt">
                    <span class="font-medium">Last Updated:</span>
                    {{ formatDate(metadata.updatedAt) }}
                </div>
            </div>
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Define field IDs for better accessibility and testing
const fieldIds = {
    name: 'character-name',
    nickname: 'character-nickname',
    color: 'character-color',
    age: 'character-age',
    birthDate: 'character-birth-date',
    bio: 'character-bio'
};

// Color presets with names for better UX
const colorPresets = [
    { name: 'Sky Blue', value: '#38bdf8' },
    { name: 'Red', value: '#f87171' },
    { name: 'Emerald', value: '#34d399' },
    { name: 'Amber', value: '#fbbf24' },
    { name: 'Violet', value: '#a78bfa' },
    { name: 'Pink', value: '#f472b6' },
    { name: 'Orange', value: '#fb923c' },
    { name: 'Teal', value: '#2dd4bf' },
    { name: 'Purple', value: '#c084fc' },
    { name: 'Rose', value: '#fb7185' },
    { name: 'Indigo', value: '#818cf8' },
    { name: 'Lime', value: '#a3e635' }
];

const maxBioLength = 660;
const showColorPresets = ref(false);

// Props with proper typing
interface Props {
    name: string;
    nickname?: string;
    color: string;
    age?: number | null;
    birthDate?: string;
    bio?: string;
    characterId?: string; // Adding ID for reference
    metadata?: {
        createdAt?: string;
        updatedAt?: string;
    };
}

const props = withDefaults(defineProps<Props>(), {
    name: '',
    nickname: '',
    color: '#38bdf8',
    age: null,
    birthDate: '',
    bio: '',
    characterId: undefined,
    metadata: undefined
});

const emit = defineEmits<{
    'update:name': [value: string];
    'update:nickname': [value: string];
    'update:color': [value: string];
    'update:age': [value: number | null];
    'update:birthDate': [value: string];
    'update:bio': [value: string];
    'validate': [errors: Record<string, string>];
}>();

// Validation
const nameError = computed(() => {
    if (!props.name.trim()) return 'Character name is required';
    if (props.name.length < 2) return 'Name must be at least 2 characters';
    if (props.name.length > 50) return 'Name must be less than 50 characters';
    return null;
});

// Helper methods with better error handling
const handleInput = (event: Event, field: 'name' | 'nickname' | 'birthDate') => {
    const target = event.target as HTMLInputElement;
    if (target) {
        let value = target.value;

        // Special handling for birth date
        if (field === 'birthDate') {
            value = formatBirthDate(value);
        }

        if (field === 'name') {
            emit('update:name', value);
        } else if (field === 'nickname') {
            emit('update:nickname', value);
        } else if (field === 'birthDate') {
            emit('update:birthDate', value);
        }

        triggerValidation();
    }
};

const handleColorInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target) {
        emit('update:color', target.value);
    }
};

const handleNumberInput = (event: Event, field: 'age') => {
    const target = event.target as HTMLInputElement;
    if (target) {
        let value: number | null = target.value ? parseInt(target.value) : null;

        // Validate age range
        if (value !== null && (value < 0 || value > 999)) {
            value = null;
        }

        emit(`update:${field}`, value);
        triggerValidation();
    }
};

const handleBioInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
        const value = target.value.slice(0, maxBioLength);
        emit('update:bio', value);
        triggerValidation();
    }
};

// Format birth date as user types (MM/DD)
const formatBirthDate = (value: string): string => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');

    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;

    // Format as MM/DD
    const month = digits.slice(0, 2);
    const day = digits.slice(2, 4);

    // Validate month (01-12)
    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > 12) return month;

    return `${month}/${day}`;
};

// Trigger validation and send to parent
const triggerValidation = () => {
    const errors: Record<string, string> = {};

    if (nameError.value) {
        errors.name = nameError.value;
    }

    emit('validate', errors);
};

// Format date for display
const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};
</script>

<style scoped>
.input-label {
    @apply text-sm font-medium text-gray-300 block;
}

.input {
    @apply w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-500;
    @apply focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent;
    @apply transition-all duration-200;
}

.input:hover:not(:disabled) {
    @apply border-gray-500;
}

.input:disabled {
    @apply opacity-50 cursor-not-allowed;
}

/* Remove number input spinners */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type="number"] {
    -moz-appearance: textfield;
}
</style>