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
                <div class="relative">
                    <!-- Hidden color input -->
                    <input type="color" :value="color" @input="handleColorInput($event)"
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <!-- Visible color display -->
                    <div
                        class="flex items-center gap-2 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 cursor-pointer hover:border-gray-500 transition-colors">
                        <span class="w-6 h-6 rounded border border-gray-600" :style="{ backgroundColor: color }"></span>
                        <span class="text-sm text-gray-200 font-mono select-all">{{ color }}</span>
                    </div>
                </div>
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
            <div class="flex justify-between items-center">
                <label class="input-label">Biography</label>
                <span class="text-xs text-gray-500" :class="{ 'text-amber-500': bio.length > 600 }">
                    {{ bio.length }}/660
                </span>
            </div>
            <textarea :value="bio" @input="handleBioInput($event)" rows="4" class="input"
                placeholder="Character description, personality, background..." :maxlength="660" />
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

const handleBioInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
        // Limit to 660 characters
        const value = target.value.slice(0, 660);
        emit('update:bio', value);
    }
};
</script>