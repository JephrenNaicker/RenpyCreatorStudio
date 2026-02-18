<template>
    <div class="space-y-6">
        <!-- Character Display Area -->
        <div class="bg-gray-900 rounded-lg p-6 min-h-[450px] grid grid-cols-1 md:grid-cols-2 gap-8 relative">

            <!-- Left: Avatar Preview - Centered with larger size -->
            <div class="flex items-center justify-center bg-gray-800/30 rounded-lg p-6">
                <div v-if="currentDisplayImage" class="relative group">
                    <img :src="getImageSrc(currentDisplayImage)" :alt="character.name || 'Character'"
                        class="max-h-80 w-auto object-contain rounded-lg shadow-2xl"
                        :style="{ filter: `drop-shadow(0 8px 24px ${character.color}80)` }" />

                    <!-- Default/Make Default badge on image -->
                    <div class="absolute -bottom-3 -right-3 flex gap-2">
                        <button v-if="currentDisplayImage && !isCurrentImageDefault && selectedExpression"
                            @click="$emit('set-default-expression', selectedExpression)" class="px-3 py-1.5 text-xs rounded-md bg-yellow-600/90 text-black font-medium 
                                   hover:bg-yellow-500 transition-all shadow-xl flex items-center gap-1.5
                                   opacity-0 group-hover:opacity-100 backdrop-blur-sm">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Make Default
                        </button>
                        <span v-if="isCurrentImageDefault" class="px-3 py-1.5 text-xs rounded-md bg-yellow-500 text-black font-medium 
                                   shadow-xl flex items-center gap-1.5">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Default
                        </span>
                    </div>
                </div>

                <!-- Placeholder with better styling - larger -->
                <div v-else class="text-center w-full">
                    <div class="w-64 h-64 mx-auto bg-gray-800 rounded-lg flex flex-col items-center justify-center mb-4 
                                border-2 border-dashed border-gray-700">
                        <svg class="w-20 h-20 text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span class="text-gray-500 text-base">No avatar set</span>
                    </div>
                    <p class="text-sm text-gray-400">Select an expression below to set as avatar</p>
                </div>
            </div>

            <!-- Right: Character Info Panel (unchanged) -->
            <div class="flex flex-col space-y-4">

                <!-- Name Section -->
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <h4 class="text-2xl font-bold text-white">{{ character.name || 'Unnamed Character' }}</h4>
                        <span v-if="character.nickname" class="text-gray-400 text-sm">({{ character.nickname }})</span>
                    </div>

                    <!-- Theme Color Badge -->
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                        :style="{ backgroundColor: character.color + '20', border: `1px solid ${character.color}` }">
                        <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: character.color }"></span>
                        <span class="text-sm" :style="{ color: character.color }">Theme Color</span>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-3 bg-gray-800/50 rounded-lg p-3">
                    <div v-if="character.age" class="text-sm">
                        <span class="text-gray-500 block text-xs">Age</span>
                        <span class="text-white font-medium">{{ character.age }}</span>
                    </div>
                    <div v-if="character.birth_date" class="text-sm">
                        <span class="text-gray-500 block text-xs">Born</span>
                        <span class="text-white font-medium">{{ character.birth_date }}</span>
                    </div>
                    <div class="text-sm">
                        <span class="text-gray-500 block text-xs">Expressions</span>
                        <span class="text-white font-medium">{{ character.expressions.length }}</span>
                    </div>
                    <div class="text-sm">
                        <span class="text-gray-500 block text-xs">Outfits</span>
                        <span class="text-white font-medium">{{ character.outfits.length }}</span>
                    </div>
                </div>

                <!-- Outfit Selector -->
                <div v-if="character.outfits.length > 0" class="space-y-2">
                    <h4 class="text-sm font-medium text-gray-300 flex items-center gap-1">
                        <span>Outfits</span>
                        <span class="text-xs text-gray-500">({{ character.outfits.length }})</span>
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        <button v-for="outfit in character.outfits" :key="outfit.name"
                            @click="$emit('select-outfit', outfit.name)"
                            class="px-3 py-1.5 text-xs rounded-lg transition-all duration-200" :class="[
                                selectedOutfit === outfit.name
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                            ]">
                            {{ outfit.name || 'Unnamed' }}
                        </button>
                    </div>
                </div>

                <!-- Expression Selector -->
                <div v-if="character.expressions.length > 0" class="space-y-2">
                    <div class="flex items-center justify-between">
                        <h4 class="text-sm font-medium text-gray-300 flex items-center gap-1">
                            <span>Expressions</span>
                            <span class="text-xs text-gray-500">({{ character.expressions.length }})</span>
                        </h4>
                        <span v-if="!selectedExpression && hasDefaultExpression"
                            class="text-[10px] px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded-full">
                            Showing default
                        </span>
                    </div>

                    <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin p-1">
                        <button v-for="exp in filteredExpressions" :key="exp.name"
                            @click="$emit('select-expression', exp.name)"
                            class="px-3 py-1.5 text-xs rounded-lg transition-all duration-200 flex items-center gap-1.5"
                            :class="[
                                selectedExpression === exp.name
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                    : exp.isDefault
                                        ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/50 hover:bg-yellow-600/30'
                                        : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:border-gray-600'
                            ]">
                            {{ exp.name || 'Unnamed' }}
                            <span v-if="exp.isDefault" class="text-[10px]">★</span>
                            <span v-if="!exp.image_path" class="text-[10px] opacity-50">(no img)</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>

        <!-- No Assets Message -->
        <div v-if="character.outfits.length === 0 && character.expressions.length === 0"
            class="text-center text-gray-500 py-8 bg-gray-800/30 rounded-lg border border-dashed border-gray-700">
            <svg class="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-gray-400">Add outfits and expressions in the Asset Library below</p>
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
    expressions: Array<{
        name: string;
        image_path: string;
        outfit: string;
        isDefault?: boolean;
    }>;
}

const props = defineProps<{
    character: Character;
    selectedOutfit: string;
    selectedExpression: string;
}>();

const emit = defineEmits<{
    'select-outfit': [outfitName: string];
    'select-expression': [expressionName: string];
    'set-default-expression': [expressionName: string];
}>();

const hasDefaultExpression = computed(() =>
    props.character.expressions.some(e => e.isDefault === true)
);

const isCurrentImageDefault = computed(() => {
    if (props.selectedExpression) {
        const exp = props.character.expressions.find(e => e.name === props.selectedExpression);
        return exp?.isDefault === true;
    }
    // If no expression selected, we're showing default
    return hasDefaultExpression.value;
});

const currentDisplayImage = computed(() => {
    if (props.selectedExpression) {
        const exp = props.character.expressions.find(e => e.name === props.selectedExpression);
        if (exp?.image_path) return exp.image_path;
    }
    const defaultExp = props.character.expressions.find(e => e.isDefault === true);
    if (defaultExp?.image_path) return defaultExp.image_path;

    const firstWithImage = props.character.expressions.find(e => e.image_path);
    return firstWithImage?.image_path || null;
});

const filteredExpressions = computed(() => {
    if (!props.selectedOutfit) return props.character.expressions;
    return props.character.expressions.filter(exp =>
        exp.outfit === props.selectedOutfit || exp.outfit === ''
    );
});

const getImageSrc = (path: string) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) return path;
    return `https://picsum.photos/400/400?random=${encodeURIComponent(path)}`;
};
</script>