<template>
    <div class="space-y-6">
        <!-- Character Display Area -->
        <div class="bg-gray-900 rounded-lg p-6 min-h-[300px] flex flex-col items-center justify-center">
            <!-- Placeholder or Character Image -->
            <div v-if="selectedExpressionImage" class="mb-4">
                <img :src="selectedExpressionImage" :alt="selectedExpression || 'Character'"
                    class="max-h-48 rounded-lg shadow-lg"
                    :style="{ filter: `drop-shadow(0 4px 8px ${character.color}40)` }" />
            </div>
            <div v-else class="text-center">
                <div class="w-48 h-48 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                    <span class="text-gray-500">No image selected</span>
                </div>
            </div>

            <!-- Character Info Display -->
            <div class="text-center">
                <div class="flex items-center justify-center gap-2 mb-2">
                    <h4 class="text-xl font-bold text-white">{{ character.name }}</h4>
                    <span v-if="character.nickname" class="text-gray-400">({{ character.nickname }})</span>
                </div>

                <!-- Color Preview -->
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
                    :style="{ backgroundColor: character.color + '20', border: `1px solid ${character.color}` }">
                    <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: character.color }"></span>
                    <span class="text-sm" :style="{ color: character.color }">Theme Color</span>
                </div>

                <!-- Stats -->
                <div class="flex gap-4 text-sm text-gray-400">
                    <span v-if="character.age">Age: {{ character.age }}</span>
                    <span v-if="character.birth_date">Born: {{ character.birth_date }}</span>
                </div>
            </div>
        </div>

        <!-- Outfit Selector -->
        <div v-if="character.outfits.length > 0" class="space-y-2">
            <h4 class="text-sm font-medium text-gray-300">Outfits</h4>
            <div class="flex flex-wrap gap-2">
                <button v-for="outfit in character.outfits" :key="outfit.name"
                    @click="$emit('select-outfit', outfit.name)"
                    class="px-3 py-1.5 text-sm rounded-lg transition-colors" :class="[
                        selectedOutfit === outfit.name
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    ]">
                    {{ outfit.name || 'Unnamed Outfit' }}
                </button>
            </div>
        </div>

        <!-- Expression Selector -->
        <div v-if="character.expressions.length > 0" class="space-y-2">
            <h4 class="text-sm font-medium text-gray-300">Expressions</h4>
            <div class="flex flex-wrap gap-2">
                <button v-for="exp in filteredExpressions" :key="exp.name" @click="$emit('select-expression', exp.name)"
                    class="px-3 py-1.5 text-sm rounded-lg transition-colors" :class="[
                        selectedExpression === exp.name
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    ]">
                    {{ exp.name || 'Unnamed Expression' }}
                </button>
            </div>
        </div>

        <!-- No Assets Message -->
        <div v-if="character.outfits.length === 0 && character.expressions.length === 0"
            class="text-center text-gray-500 py-8">
            <p>Add outfits and expressions in the Asset Library below</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Character {
    name: string;
    nickname: string;
    color: string;
    age: number | null;
    birth_date: string;
    outfits: Array<{ name: string; default_image: string }>;
    expressions: Array<{ name: string; image_path: string; outfit: string }>;
}

const props = defineProps<{
    character: Character;
    selectedOutfit: string;
    selectedExpression: string;
}>();

defineEmits<{
    'select-outfit': [outfitName: string];
    'select-expression': [expressionName: string];
}>();

// Filter expressions by selected outfit
const filteredExpressions = computed(() => {
    if (!props.selectedOutfit) return props.character.expressions;
    return props.character.expressions.filter(exp =>
        exp.outfit === props.selectedOutfit || exp.outfit === ''
    );
});

// Get the selected expression image
const selectedExpressionImage = computed(() => {
    if (!props.selectedExpression) return null;
    const exp = props.character.expressions.find(e => e.name === props.selectedExpression);
    return exp?.image_path || null;
});
</script>