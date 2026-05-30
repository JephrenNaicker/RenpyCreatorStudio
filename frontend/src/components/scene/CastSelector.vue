<template>
    <div class="cast-selector" id="cast-selector">
        <!-- Row 1: Speaker + Outfit side by side -->
        <div class="selector-row" id="selector-row-primary">
            <!-- Speaker DDL -->
            <div class="field-group speaker-group" id="select-group">
                <label v-if="label" class="field-label" :id="`${label.toLowerCase()}-label`">{{ label }}</label>
                <select :value="modelValue"
                    @input="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)" class="field-select"
                    :class="{ narrator: !selectedCharacter }" id="character-select"
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
            <div v-if="showOutfit && selectedCharacter" class="field-group outfit-group" id="outfit-select-container">
                <label class="field-label" id="outfit-label">Outfit</label>
                <select v-model="selectedOutfit" @change="handleOutfitChange" class="field-select" id="outfit-select"
                    :data-test-character-id="selectedCharacter.id">
                    <option v-for="outfit in sortedOutfits" :key="outfit.name" :value="outfit.name"
                        :id="`outfit-option-${outfit.name.toLowerCase().replace(/\s+/g, '-')}`"
                        :data-outfit-name="outfit.name">
                        {{ outfit.name }}{{ outfit.default_image ? ' ✦' : '' }}
                    </option>
                </select>
            </div>

            <!-- Spacer when no character (keeps layout stable) -->
            <div v-if="!selectedCharacter" class="field-group outfit-group narrator-placeholder" aria-hidden="true">
            </div>
        </div>

        <!-- Row 2: Expression inline pill row -->
        <div v-if="showExpression && selectedCharacter && sortedExpressions.length > 0" class="expression-row"
            id="expression-select-container">
            <label class="field-label" id="expression-label">Expression</label>
            <div class="expression-pills" id="expression-pills">
                <button v-for="expr in sortedExpressions" :key="expr.name" class="expr-pill"
                    :class="{ active: selectedExpression === expr.name }" @click="selectExpression(expr.name)"
                    :id="`expr-pill-${expr.name.toLowerCase().replace(/\s+/g, '-')}`" :title="expr.name" type="button">
                    <span class="expr-emoji">{{ getExpressionEmoji(expr.name) }}</span>
                    <span class="expr-name">{{ expr.name }}</span>
                </button>
            </div>
        </div>

        <!-- Character info strip -->
        <div v-if="selectedCharacter" class="character-strip" id="character-info"
            :data-character-id="selectedCharacter.id">
            <span class="char-dot" :style="{ backgroundColor: selectedCharacter.color }"
                id="character-color-preview"></span>
            <span class="char-name" id="character-name-display">{{ selectedCharacter.name }}</span>
            <span v-if="selectedCharacter.nickname" class="char-nick" id="character-nickname-display">
                "{{ selectedCharacter.nickname }}"
            </span>
            <span v-if="selectedOutfit" class="char-badge" id="outfit-badge" :data-outfit="selectedOutfit">
                {{ selectedOutfit }}
            </span>
            <span v-if="selectedExpression" class="char-badge expr-badge" id="expression-badge"
                :data-expression="selectedExpression">
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
    sceneCharacterIds: undefined
});

const emit = defineEmits<Emits>();

const selectedOutfit = ref('');
const selectedExpression = ref('');

// Only show characters assigned to the current scene
const availableCharacters = computed(() => {
    if (!props.sceneCharacterIds || props.sceneCharacterIds.length === 0) {
        return props.characters;
    }
    return props.characters.filter(c => props.sceneCharacterIds!.includes(c.id));
});

const selectedCharacter = computed(() =>
    props.characters.find(c => c.id === props.modelValue)
);

// Outfits sorted alphabetically, filtering out null/empty names
const sortedOutfits = computed(() => {
    if (!selectedCharacter.value) return [];
    return (selectedCharacter.value.outfits || [])
        .filter(o => o && o.name)
        .sort((a, b) => a.name.localeCompare(b.name));
});

// Expressions for the selected outfit, sorted alphabetically
const sortedExpressions = computed((): Expression[] => {
    if (!selectedCharacter.value || !selectedOutfit.value) return [];
    return (selectedCharacter.value.expressions || [])
        .filter(expr => expr.outfit === selectedOutfit.value)
        .sort((a, b) => a.name.localeCompare(b.name));
});

// Auto-select the default/first outfit when character changes
const autoSelectOutfit = () => {
    const outfits = sortedOutfits.value;
    if (!outfits.length) {
        selectedOutfit.value = '';
        return;
    }
    // Prefer the outfit with default_image flag, else first alphabetically
    const defaultOutfit = outfits.find(o => o.default_image) ?? outfits[0];
    selectedOutfit.value = defaultOutfit!.name;
    emit('outfit-change', selectedOutfit.value);
};

// Auto-select default expression for the current outfit
const autoSelectExpression = () => {
    const expressions = sortedExpressions.value;
    if (!expressions.length) {
        selectedExpression.value = '';
        emit('expression-change', '');
        return;
    }
    // Prefer expression with default_image, else first alphabetically
    const defaultExpr = (expressions as any[]).find(e => e.default_image) ?? expressions[0];
    selectedExpression.value = defaultExpr!.name;
    emit('expression-change', selectedExpression.value);
};

const handleOutfitChange = () => {
    selectedExpression.value = '';
    emit('outfit-change', selectedOutfit.value);
    // Auto-select default expression for new outfit
    autoSelectExpression();
};

const selectExpression = (name: string) => {
    selectedExpression.value = name;
    emit('expression-change', name);
};

// When speaker changes, reset and auto-select
watch(() => props.modelValue, (newSpeakerId) => {
    selectedOutfit.value = '';
    selectedExpression.value = '';
    if (newSpeakerId) {
        // Wait for computed to update then auto-select
        setTimeout(() => {
            autoSelectOutfit();
            setTimeout(() => autoSelectExpression(), 0);
        }, 0);
    } else {
        emit('outfit-change', '');
        emit('expression-change', '');
    }
}, { immediate: true });

// When outfit auto-changes, update expressions
watch(() => selectedOutfit.value, () => {
    autoSelectExpression();
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
    getExpressionEmoji
});
</script>

<style scoped>
.cast-selector {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

/* ── Row 1: Speaker + Outfit ─────────────────────── */
.selector-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.speaker-group {
    flex: 3;
    min-width: 0;
}

.outfit-group {
    flex: 2;
    min-width: 0;
}

.narrator-placeholder {
    /* keeps row height stable when no character is selected */
    visibility: hidden;
}

.field-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: #64748b;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}

.field-select {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 6px;
    padding: 0.45rem 0.65rem;
    color: #e2e8f0;
    cursor: pointer;
    font-size: 0.875rem;
    transition: border-color 0.15s, background 0.15s;
    width: 100%;
    box-sizing: border-box;
    appearance: auto;
}

.field-select.narrator {
    color: #64748b;
    font-style: italic;
    border-color: #1e293b;
}

.field-select:hover {
    border-color: #334155;
    background: #111827;
}

.field-select:focus {
    outline: none;
    border-color: #38bdf8;
    background: #111827;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.12);
}

/* ── Row 2: Expression pills ─────────────────────── */
.expression-row {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.expression-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
}

.expr-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.55rem;
    border-radius: 20px;
    border: 1px solid #1e293b;
    background: #0f172a;
    color: #94a3b8;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    line-height: 1;
}

.expr-pill:hover {
    border-color: #334155;
    background: #1e293b;
    color: #cbd5e1;
}

.expr-pill.active {
    border-color: #38bdf8;
    background: rgba(56, 189, 248, 0.12);
    color: #7dd3fc;
}

.expr-emoji {
    font-size: 0.9rem;
    line-height: 1;
}

.expr-name {
    font-size: 0.75rem;
    font-weight: 500;
}

/* ── Character info strip ────────────────────────── */
.character-strip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.5rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid #1e293b;
    border-radius: 6px;
    font-size: 0.8rem;
    flex-wrap: wrap;
}

.char-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
}

.char-name {
    font-weight: 600;
    color: #f1f5f9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.char-nick {
    color: #64748b;
    font-size: 0.75rem;
    font-style: italic;
    white-space: nowrap;
}

.char-badge {
    background: rgba(56, 189, 248, 0.1);
    color: #38bdf8;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-size: 0.7rem;
    white-space: nowrap;
    border: 1px solid rgba(56, 189, 248, 0.2);
}

.expr-badge {
    background: rgba(167, 139, 250, 0.1);
    color: #a78bfa;
    border-color: rgba(167, 139, 250, 0.2);
}
</style>