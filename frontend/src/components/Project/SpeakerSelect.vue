<template>
    <div class="speaker-select">
        <div class="select-group">
            <label v-if="label" class="select-label">{{ label }}</label>
            <select :value="modelValue" @input="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
                class="select" :class="{ narrator: !selectedCharacter }">
                <option value="">Narrator</option>
                <option v-for="character in characters" :key="character.id" :value="character.id"
                    :style="{ color: character.color }">
                    {{ character.name }}
                </option>
            </select>
        </div>

        <div v-if="showExpression && selectedCharacter" class="expression-select">
            <select v-model="selectedExpression" @change="$emit('expression-change', selectedExpression)"
                class="select expression-select-dropdown">
                <option value="">Default Expression</option>
                <option v-for="expression in selectedCharacter.expressions || []" :key="expression" :value="expression">
                    {{ expression }}
                </option>
            </select>
            <span v-if="selectedExpression" class="expression-emoji">
                {{ getExpressionEmoji(selectedExpression) }}
            </span>
        </div>

        <!-- Make character info more compact -->
        <div v-if="selectedCharacter" class="character-info">
            <span class="color-preview" :style="{ backgroundColor: selectedCharacter.color }"></span>
            <span class="character-name">{{ selectedCharacter.name }}</span>
            <span v-if="selectedCharacter.nickname" class="character-nickname">
                "{{ selectedCharacter.nickname }}"
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

interface Character {
    id: string;
    name: string;
    nickname?: string;
    color: string;
    expressions?: string[];
}

interface Props {
    modelValue: string;  // Selected character ID
    characters: Character[];
    label?: string;
    showExpression?: boolean;
}

interface Emits {
    (e: 'update:modelValue', value: string): void;
    (e: 'expression-change', expression: string): void;
}

const props = withDefaults(defineProps<Props>(), {
    label: 'Speaker',
    showExpression: true
});

const emit = defineEmits<Emits>();

const selectedExpression = ref('');

const selectedCharacter = computed(() => {
    return props.characters.find(c => c.id === props.modelValue);
});

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