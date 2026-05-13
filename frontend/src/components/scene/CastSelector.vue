<template>
    <div class="speaker-select" id="cast-selector">
        <div class="select-group" id="select-group">
            <label v-if="label" class="select-label" :id="`${label.toLowerCase()}-label`">{{ label }}</label>
            <select :value="modelValue" @input="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
                class="select" :class="{ narrator: !selectedCharacter }" id="character-select"
                :data-test-selected="selectedCharacter?.id || 'narrator'">
                <option value="" id="option-narrator">Narrator</option>
                <option v-for="character in availableCharacters" :key="character.id" :value="character.id"
                    :style="{ color: character.color }" :id="`option-${character.id}`"
                    :data-character-name="character.name">
                    {{ character.name }}
                </option>
            </select>
        </div>

        <div v-if="showExpression && selectedCharacter" class="expression-select" id="expression-select-container">
            <select v-model="selectedExpression" @change="$emit('expression-change', selectedExpression)"
                class="select expression-select-dropdown" id="expression-select"
                :data-test-character-id="selectedCharacter.id">
                <option value="" id="expression-option-default">Default Expression</option>
                <option v-for="expression in selectedCharacter.expressions || []" :key="expression.name"
                    :value="expression.name"
                    :id="`expression-option-${expression.name.toLowerCase().replace(/\s+/g, '-')}`"
                    :data-expression-name="expression.name">
                    {{ expression.name }}
                </option>
            </select>
            <span v-if="selectedExpression" class="expression-emoji" id="expression-emoji"
                :data-expression="selectedExpression">
                {{ getExpressionEmoji(selectedExpression) }}
            </span>
        </div>

        <!-- Make character info more compact -->
        <div v-if="selectedCharacter" class="character-info" id="character-info"
            :data-character-id="selectedCharacter.id">
            <span class="color-preview" :style="{ backgroundColor: selectedCharacter.color }"
                id="character-color-preview"></span>
            <span class="character-name" id="character-name-display">{{ selectedCharacter.name }}</span>
            <span v-if="selectedCharacter.nickname" class="character-nickname" id="character-nickname-display">
                "{{ selectedCharacter.nickname }}"
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Character } from '@/utils/dummyData';

interface Props {
    modelValue: string;
    characters: Character[];
    label?: string;
    showExpression?: boolean;
    sceneCharacterIds?: string[];  // when set, only show these characters in the dropdown
}

interface Emits {
    (e: 'update:modelValue', value: string): void;
    (e: 'expression-change', expression: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    label: 'Speaker',
    showExpression: true,
    sceneCharacterIds: undefined
});

const emit = defineEmits<Emits>();

const selectedExpression = ref('');

// Only show characters assigned to the current scene (falls back to all if not set)
const availableCharacters = computed(() =>
    props.sceneCharacterIds
        ? props.characters.filter(c => props.sceneCharacterIds!.includes(c.id))
        : props.characters
);

const selectedCharacter = computed(() =>
    props.characters.find(c => c.id === props.modelValue)
);

// When speaker changes, reset expression
watch(() => props.modelValue, (newSpeakerId) => {
    if (!newSpeakerId) {
        selectedExpression.value = '';
        emit('expression-change', '');
    }
});

const getExpressionEmoji = (expression: string) => {
    const emojiMap: Record<string, string> = {
        'happy': '😊',
        'sad': '😢',
        'angry': '😠',
        'surprised': '😲',
        'neutral': '😐',
        'smile': '😄',
        'concerned': '😟',
        'serious': '😐',
        'mysterious': '🕵️',
        'determined': '💪',
        'excited': '🤩',
        'tired': '😴',
        'confused': '😕',
        'thinking': '🤔'
    };
    return emojiMap[expression] || '😀';
};

// Expose testing utilities if needed
defineExpose({
    selectedExpression,
    availableCharacters,
    selectedCharacter,
    getExpressionEmoji
});
</script>

<style scoped>
.speaker-select {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    /* Reduced from 0.75rem */
    margin-bottom: 0.5rem;
    /* Add margin to separate from textarea */
}

.select-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.select-label {
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: 500;
}

.select {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: #f8fafc;
    cursor: pointer;
    font-size: 0.9rem;
    transition: border-color 0.2s;
    width: 100%;
    box-sizing: border-box;
}

.select.narrator {
    border-color: #475569;
    font-style: italic;
}

.select:focus {
    outline: none;
    border-color: #38bdf8;
}

.expression-select {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
}

.expression-select-dropdown {
    flex: 1;
    min-width: 0;
    /* Allow shrinking */
}

.expression-emoji {
    font-size: 1.2rem;
    opacity: 0.8;
    flex-shrink: 0;
}

.character-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem;
    /* Reduced from 0.5rem */
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    margin-top: 0.125rem;
    /* Reduced from 0.25rem */
    font-size: 0.85rem;
    /* Slightly smaller */
}

.color-preview {
    width: 10px;
    /* Reduced from 12px */
    height: 10px;
    /* Reduced from 12px */
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
}

.character-name {
    font-weight: 500;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.character-nickname {
    color: #94a3b8;
    font-size: 0.8rem;
    /* Reduced from 0.85rem */
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>