<template>
    <form class="space-y-4">
        <!-- Name -->
        <div class="space-y-1">
            <label class="input-label">Character Name *</label>
            <input :value="name" @input="handleInput($event, 'name')" class="input" placeholder="Enter character name"
                required />
        </div>

        <!-- Nickname -->
        <div class="space-y-1">
            <label class="input-label">Display Name / Alias</label>
            <input :value="nickname" @input="handleInput($event, 'nickname')" class="input"
                placeholder="Optional nickname" />
        </div>

        <!-- Color Picker -->
        <div class="space-y-1">
            <label class="input-label">Theme Color</label>
            <div class="flex items-center gap-3">
                <input type="color" :value="color" @input="handleColorInput($event)"
                    class="h-10 w-14 bg-transparent border border-gray-600 rounded cursor-pointer" />
                <span class="w-8 h-8 rounded border border-gray-600" :style="{ backgroundColor: color }" />
                <span class="text-sm text-gray-400">{{ color }}</span>
            </div>
        </div>

        <!-- Age & Birth Date -->
        <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
                <label class="input-label">Age</label>
                <input type="number" :value="age" @input="handleNumberInput($event, 'age')" class="input"
                    placeholder="Optional" min="0" />
            </div>

            <div class="space-y-1">
                <label class="input-label">Birth Date</label>
                <input type="text" :value="birth_date" @input="handleInput($event, 'birth_date')"
                    class="input font-mono" placeholder="MM/DD" />
                <p class="text-xs text-gray-500">Format: Month/Day</p>
            </div>
        </div>

        <!-- Bio -->
        <div class="space-y-1">
            <label class="input-label">Biography</label>
            <textarea :value="bio" @input="handleInput($event, 'bio')" rows="4" class="input"
                placeholder="Character description, personality, background..." />
        </div>
    </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    name: string;
    nickname: string;
    color: string;
    age: number | null;
    birth_date: string;
    bio: string;
}>();

const emit = defineEmits<{
    'update:name': [value: string];
    'update:nickname': [value: string];
    'update:color': [value: string];
    'update:age': [value: number | null];
    'update:birth_date': [value: string];
    'update:bio': [value: string];
}>();

// Helper methods to handle events with proper typing
const handleInput = (event: Event, field: 'name' | 'nickname' | 'birth_date' | 'bio') => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (target) {
        emit(`update:${field}` as any, target.value);
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
        const value = target.value ? parseInt(target.value) : null;
        emit(`update:${field}` as any, value);
    }
};
</script>