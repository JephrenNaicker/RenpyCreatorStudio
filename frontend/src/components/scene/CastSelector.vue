<!-- frontend/src/components/scene/CastSelector.vue -->
<template>
    <div class="flex flex-col gap-2.5" id="cast-selector">
        <!-- Row 1: Speaker + Outfit side by side -->
        <div class="flex gap-2 items-end" id="selector-row-primary">
            <!-- Speaker DDL -->
            <div class="flex flex-col gap-1 flex-[3] min-w-0" id="select-group">
                <label v-if="label" class="text-[0.72rem] font-semibold text-slate-500 tracking-wider uppercase"
                    :id="`${label.toLowerCase()}-label`">{{ label }}</label>
                <select :value="modelValue"
                    @input="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
                    class="bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.8 text-slate-200 cursor-pointer text-sm transition-colors duration-150 w-full box-border appearance-auto hover:border-slate-700 hover:bg-slate-900/80 focus:outline-none focus:border-sky-400 focus:bg-slate-900/80 focus:ring-2 focus:ring-sky-400/12"
                    :class="{ 'text-slate-500 italic border-slate-800': !selectedCharacter }" id="character-select"
                    :data-test-selected="selectedCharacter?.id || 'narrator'">
                    <option value="" id="option-narrator">— Narrator —</option>
                    <option v-for="character in availableCharacters" :key="character.id" :value="character.id"
                        :style="{ color: character.color }" :id="`option-${character.id}`"
                        :data-character-name="character.name">
                        {{ character.name }}
                    </option>
                </select>
            </div>

            <!-- Outfit DDL (always shown when character selected, hidden when narrator) -->
            <div v-if="showOutfit && selectedCharacter" class="flex flex-col gap-1 flex-[2] min-w-0"
                id="outfit-select-container">
                <label class="text-[0.72rem] font-semibold text-slate-500 tracking-wider uppercase"
                    id="outfit-label">Outfit</label>
                <select v-model="selectedOutfit" @change="handleOutfitChange"
                    class="bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.8 text-slate-200 cursor-pointer text-sm transition-colors duration-150 w-full box-border appearance-auto hover:border-slate-700 hover:bg-slate-900/80 focus:outline-none focus:border-sky-400 focus:bg-slate-900/80 focus:ring-2 focus:ring-sky-400/12"
                    id="outfit-select" :data-test-character-id="selectedCharacter.id">
                    <option v-for="outfit in sortedOutfits" :key="outfit.name" :value="outfit.name"
                        :id="`outfit-option-${outfit.name.toLowerCase().replace(/\s+/g, '-')}`"
                        :data-outfit-name="outfit.name">
                        {{ outfit.name }}{{ outfit.default_image ? ' ✦' : '' }}
                    </option>
                </select>
            </div>

            <!-- Spacer when no character (keeps layout stable) -->
            <div v-if="!selectedCharacter" class="flex flex-col gap-1 flex-[2] min-w-0 invisible" aria-hidden="true">
            </div>
        </div>

        <!-- Row 2: Expression inline pill row -->
        <div v-if="showExpression && selectedCharacter && sortedExpressions.length > 0" class="flex flex-col gap-1.5"
            id="expression-select-container">
            <label class="text-[0.72rem] font-semibold text-slate-500 tracking-wider uppercase"
                id="expression-label">Expression</label>
            <div class="flex flex-wrap gap-1.5" id="expression-pills">
                <button v-for="expr in sortedExpressions" :key="expr.name"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-800 bg-slate-900 text-slate-400 text-[0.78rem] cursor-pointer transition-all duration-150 ease-in-out whitespace-nowrap leading-none hover:border-slate-700 hover:bg-slate-800 hover:text-slate-300"
                    :class="{ '!border-sky-400 !bg-sky-400/12 !text-sky-300': selectedExpression === expr.name }"
                    @click="selectExpression(expr.name)"
                    :id="`expr-pill-${expr.name.toLowerCase().replace(/\s+/g, '-')}`" :title="expr.name" type="button">
                    <span class="text-sm leading-none">{{ getExpressionEmoji(expr.name) }}</span>
                    <span class="text-[0.75rem] font-medium">{{ expr.name }}</span>
                </button>
            </div>
        </div>

        <!-- Character info strip -->
        <div v-if="selectedCharacter"
            class="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] border border-slate-800 rounded-md text-xs flex-wrap"
            id="character-info" :data-character-id="selectedCharacter.id">
            <span class="w-2 h-2 rounded-full border border-white/15 shrink-0"
                :style="{ backgroundColor: selectedCharacter.color }" id="character-color-preview"></span>
            <span class="font-semibold text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis"
                id="character-name-display">{{ selectedCharacter.name }}</span>
            <span v-if="selectedCharacter.nickname" class="text-slate-500 text-[0.75rem] italic whitespace-nowrap"
                id="character-nickname-display">
                "{{ selectedCharacter.nickname }}"
            </span>
            <span v-if="selectedOutfit"
                class="bg-sky-400/10 text-sky-400 px-1.5 py-0.5 rounded text-[0.7rem] whitespace-nowrap border border-sky-400/20"
                id="outfit-badge" :data-outfit="selectedOutfit">
                {{ selectedOutfit }}
            </span>
            <span v-if="selectedExpression"
                class="bg-violet-400/10 text-violet-300 px-1.5 py-0.5 rounded text-[0.7rem] whitespace-nowrap border border-violet-400/20"
                id="expression-badge" :data-expression="selectedExpression">
                {{ getExpressionEmoji(selectedExpression) }} {{ selectedExpression }}
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Character, Expression } from '@/types/models';

interface Props {
    modelValue: string;
    characters: Character[];
    label?: string;
    showExpression?: boolean;
    showOutfit?: boolean;
    sceneCharacterIds?: string[];
    externalOutfit?: string;
    externalExpression?: string;
}

interface Emits {
    (e: 'update:modelValue', value: string): void;
    (e: 'expression-change', expression: string): void;
    (e: 'outfit-change', outfit: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    label: 'Speaker',
    showExpression: true,
    showOutfit: true,
    sceneCharacterIds: undefined,
    externalOutfit: '',
    externalExpression: ''
});

const emit = defineEmits<Emits>();

const selectedOutfit = ref('');
const selectedExpression = ref('');

let isExternalUpdate = false;

const availableCharacters = computed(() => {
    if (!props.sceneCharacterIds || props.sceneCharacterIds.length === 0) {
        return props.characters;
    }
    return props.characters.filter(c => props.sceneCharacterIds!.includes(c.id));
});

const selectedCharacter = computed(() =>
    props.characters.find(c => c.id === props.modelValue)
);

const sortedOutfits = computed(() => {
    if (!selectedCharacter.value) return [];
    return (selectedCharacter.value.outfits || [])
        .filter(o => o && o.name)
        .sort((a, b) => a.name.localeCompare(b.name));
});

const sortedExpressions = computed((): Expression[] => {
    if (!selectedCharacter.value || !selectedOutfit.value) return [];
    return (selectedCharacter.value.expressions || [])
        .filter(expr => expr.outfit === selectedOutfit.value)
        .sort((a, b) => a.name.localeCompare(b.name));
});

const autoSelectOutfit = (preferredOutfit?: string) => {
    const outfits = sortedOutfits.value;
    if (!outfits.length) {
        selectedOutfit.value = '';
        emit('outfit-change', '');
        return;
    }

    if (preferredOutfit && outfits.some(o => o.name === preferredOutfit)) {
        selectedOutfit.value = preferredOutfit;
    } else {
        const defaultOutfit = outfits.find(o => o.default_image) ?? outfits[0];
        selectedOutfit.value = defaultOutfit!.name;
    }

    if (!isExternalUpdate) {
        emit('outfit-change', selectedOutfit.value);
    }
};

const autoSelectExpression = (preferredExpression?: string) => {
    const expressions = sortedExpressions.value;
    if (!expressions.length) {
        selectedExpression.value = '';
        if (!isExternalUpdate) {
            emit('expression-change', '');
        }
        return;
    }

    if (preferredExpression && expressions.some(e => e.name === preferredExpression)) {
        selectedExpression.value = preferredExpression;
    } else {
        const defaultExpr = (expressions as any[]).find(e => e.default_image) ?? expressions[0];
        selectedExpression.value = defaultExpr!.name;
    }

    if (!isExternalUpdate) {
        emit('expression-change', selectedExpression.value);
    }
};

const handleOutfitChange = () => {
    selectedExpression.value = '';
    emit('outfit-change', selectedOutfit.value);
    autoSelectExpression();
};

const selectExpression = (name: string) => {
    selectedExpression.value = name;
    emit('expression-change', name);
};

watch(() => props.modelValue, (newSpeakerId) => {
    isExternalUpdate = true;
    selectedOutfit.value = '';
    selectedExpression.value = '';

    if (newSpeakerId) {
        setTimeout(() => {
            autoSelectOutfit(props.externalOutfit || undefined);
            setTimeout(() => {
                autoSelectExpression(props.externalExpression || undefined);
            }, 0);
        }, 0);
    } else {
        emit('outfit-change', '');
        emit('expression-change', '');
    }

    setTimeout(() => {
        isExternalUpdate = false;
    }, 100);
}, { immediate: true });

watch(() => props.externalOutfit, (newOutfit) => {
    if (isExternalUpdate) return;
    if (newOutfit && newOutfit !== selectedOutfit.value) {
        isExternalUpdate = true;
        selectedOutfit.value = newOutfit;
        emit('outfit-change', newOutfit);
        setTimeout(() => {
            autoSelectExpression(props.externalExpression || undefined);
        }, 0);
        setTimeout(() => {
            isExternalUpdate = false;
        }, 100);
    }
});

watch(() => props.externalExpression, (newExpression) => {
    if (isExternalUpdate) return;
    if (newExpression && newExpression !== selectedExpression.value) {
        isExternalUpdate = true;
        selectedExpression.value = newExpression;
        emit('expression-change', newExpression);
        setTimeout(() => {
            isExternalUpdate = false;
        }, 100);
    }
});

watch(() => selectedOutfit.value, () => {
    if (!isExternalUpdate) {
        autoSelectExpression(props.externalExpression || undefined);
    }
});

watch(() => props.modelValue, (newSpeakerId, oldSpeakerId) => {
    if (newSpeakerId && newSpeakerId !== oldSpeakerId) {
        const character = props.characters.find(c => c.id === newSpeakerId);
        if (character) {
        }
    }
});

const getExpressionEmoji = (expression: string) => {
    const emojiMap: Record<string, string> = {
        'happy': '😊', 'sad': '😢', 'angry': '😠', 'surprised': '😲',
        'neutral': '😐', 'smile': '😄', 'concerned': '😟', 'serious': '😑',
        'mysterious': '🕵️', 'determined': '💪', 'excited': '🤩', 'tired': '😴',
        'confused': '😕', 'thinking': '🤔', 'laughing': '😂', 'shy': '😳',
        'scared': '😱', 'smug': '😏', 'love': '🥰', 'default': '🎭'
    };
    return emojiMap[expression.toLowerCase()] || '🎭';
};

defineExpose({
    selectedOutfit,
    selectedExpression,
    availableCharacters,
    selectedCharacter,
    sortedExpressions,
    sortedOutfits,
    getExpressionEmoji,
    setOutfit: (outfit: string) => {
        selectedOutfit.value = outfit;
        autoSelectExpression();
    },
    setExpression: (expression: string) => {
        selectedExpression.value = expression;
    }
});
</script>