<!-- frontend/src/components/scene/MenuChoiceEditor.vue -->
<template>
    <div class="menu-choice-editor" id="menu-choice-editor">

        <!-- Optional prompt -->
        <div class="field-group" id="prompt-group">
            <label class="field-label" id="prompt-label">
                Prompt <span class="field-optional">(optional)</span>
            </label>
            <input v-model="prompt" type="text" class="field-input" id="menu-prompt-input"
                placeholder="e.g. How do you respond?" />
        </div>

        <!-- Choices -->
        <div class="choices-header" id="choices-header">
            <span class="field-label">Choices</span>
            <span class="choices-count" id="choices-count">{{ choices.length }} / 6</span>
        </div>

        <div class="choices-list" id="choices-list">
            <div v-for="(choice, idx) in choices" :key="choice.id" class="choice-row" :id="`choice-row-${idx}`">
                <span class="choice-badge" :id="`choice-badge-${idx}`">{{ idx + 1 }}</span>

                <input v-model="choice.text" type="text" class="field-input choice-text-input"
                    :placeholder="`Choice ${idx + 1}…`" :id="`choice-text-${idx}`" />

                <button class="cog-btn" :class="{ active: expandedIdx === idx }" @click="toggleAdvanced(idx)"
                    title="Advanced options" :id="`choice-cog-${idx}`">
                    ⚙️
                </button>

                <button v-if="choices.length > 2" class="remove-choice-btn" @click="removeChoice(idx)"
                    title="Remove choice" :id="`choice-remove-${idx}`">
                    ✕
                </button>
            </div>

            <!-- Advanced drawer for expanded choice -->
            <div v-if="expandedIdx !== null && expandedChoice" class="advanced-panel"
                :id="`choice-advanced-${expandedIdx}`">
                <div class="advanced-header">
                    <span class="advanced-title">Advanced — Choice {{ expandedIdx + 1 }}</span>
                    <span class="advanced-note">Stored, not active yet</span>
                </div>

                <!-- Effects -->
                <div class="effects-section" id="effects-section">
                    <div class="effects-header">
                        <span class="effects-label">Point / Variable Effects</span>
                        <button class="add-effect-btn" @click="addEffect(expandedIdx)"
                            :disabled="(expandedChoice.effects?.length ?? 0) >= 5" id="add-effect-btn">
                            + Add Effect
                        </button>
                    </div>

                    <div v-if="!expandedChoice.effects?.length" class="effects-empty" id="effects-empty">
                        No effects yet — add one to track points or flags.
                    </div>

                    <div v-for="(effect, eIdx) in expandedChoice.effects" :key="eIdx" class="effect-row"
                        :id="`effect-row-${eIdx}`">
                        <input v-model="effect.variable" type="text" class="effect-input effect-var"
                            placeholder="variable_name" :id="`effect-var-${eIdx}`" />

                        <select v-model="effect.operation" class="effect-select" :id="`effect-op-${eIdx}`">
                            <option value="add">+ add</option>
                            <option value="subtract">− subtract</option>
                            <option value="set">= set</option>
                            <option value="toggle">⇄ toggle</option>
                        </select>

                        <input v-if="effect.operation !== 'toggle'" v-model.number="effect.value" type="number"
                            class="effect-input effect-val" placeholder="0" :id="`effect-val-${eIdx}`" />
                        <span v-else class="effect-toggle-hint" :id="`effect-toggle-hint-${eIdx}`">bool</span>

                        <button class="remove-effect-btn" @click="removeEffect(expandedIdx, eIdx)"
                            :id="`remove-effect-${eIdx}`">✕</button>
                    </div>
                </div>

                <!-- Condition (dormant) -->
                <div class="field-group" id="condition-section">
                    <label class="field-label" id="condition-label">
                        Show Condition <span class="field-optional">(dormant — future gating)</span>
                    </label>
                    <input :value="expandedChoice.condition"
                        @input="updateExpandedField('condition', ($event.target as HTMLInputElement).value)" type="text"
                        class="field-input condition-input" placeholder="e.g. affinity_alice >= 10"
                        :id="`condition-input-${expandedIdx}`" />
                </div>

                <!-- Target scene (dormant placeholder, simple text for now) -->
                <div class="field-group" id="target-section">
                    <label class="field-label" id="target-label">
                        Target Scene ID <span class="field-optional">(optional — for later linking)</span>
                    </label>
                    <input :value="expandedChoice.target_scene_id"
                        @input="updateExpandedField('target_scene_id', ($event.target as HTMLInputElement).value)"
                        type="text" class="field-input" placeholder="e.g. cp3" :id="`target-input-${expandedIdx}`" />
                </div>
            </div>
        </div>

        <button v-if="choices.length < 6" class="add-choice-btn" @click="addChoice" id="add-choice-btn">
            + Add Choice
        </button>

        <!-- Actions -->
        <div class="action-row" id="menu-actions">
            <button class="btn primary" @click="submit" :disabled="!canSubmit" id="submit-menu-btn">
                {{ isEditing ? '✓ Update Menu' : '+ Add Menu Node' }}
            </button>
            <button class="btn secondary" @click="$emit('cancel')" id="cancel-menu-btn">
                Cancel
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { MenuNode, MenuChoice, ChoiceEffect } from '@/types/models';

interface Props {
    editingNode?: MenuNode | null;
    lineCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
    editingNode: null,
    lineCount: 0,
});

const emit = defineEmits<{
    (e: 'add-menu', node: MenuNode): void;
    (e: 'update-menu', node: MenuNode): void;
    (e: 'cancel'): void;
}>();

const isEditing = computed(() => !!props.editingNode);

const prompt = ref('');
const choices = ref<MenuChoice[]>(makeDefaultChoices());
const expandedIdx = ref<number | null>(null);

function makeDefaultChoices(): MenuChoice[] {
    return [
        { id: uid(), text: '', effects: [], condition: '' },
        { id: uid(), text: '', effects: [], condition: '' },
    ];
}

function uid(): string {
    return `choice_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

const canSubmit = computed(() => choices.value.filter(c => c.text.trim()).length >= 2);

const expandedChoice = computed<MenuChoice | null>(() => {
    if (expandedIdx.value === null) return null;
    return choices.value[expandedIdx.value] ?? null;
});

// Writes directly into the underlying choices array — avoids v-model on a
// computed/optional-chained path, which Vue's template compiler rejects as
// an invalid assignment target.
function updateExpandedField(field: 'condition' | 'target_scene_id', value: string) {
    if (expandedIdx.value === null) return;
    const choice = choices.value[expandedIdx.value];
    if (!choice) return;
    choice[field] = value;
}

function addChoice() {
    if (choices.value.length >= 6) return;
    choices.value.push({ id: uid(), text: '', effects: [], condition: '' });
}

function removeChoice(idx: number) {
    choices.value.splice(idx, 1);
    if (expandedIdx.value === idx) expandedIdx.value = null;
    else if (expandedIdx.value !== null && expandedIdx.value > idx) expandedIdx.value--;
}

function toggleAdvanced(idx: number) {
    expandedIdx.value = expandedIdx.value === idx ? null : idx;
}

function addEffect(choiceIdx: number) {
    const choice = choices.value[choiceIdx];
    if (!choice) return;
    if (!choice.effects) choice.effects = [];
    if (choice.effects.length >= 5) return;
    const effect: ChoiceEffect = { variable: '', operation: 'add', value: 1 };
    choice.effects.push(effect);
}

function removeEffect(choiceIdx: number, effectIdx: number) {
    const choice = choices.value[choiceIdx];
    if (choice?.effects) {
        choice.effects.splice(effectIdx, 1);
    }
}

function submit() {
    if (!canSubmit.value) return;

    const cleanChoices: MenuChoice[] = choices.value
        .filter(c => c.text.trim())
        .map(c => ({
            ...c,
            text: c.text.trim(),
            condition: c.condition?.trim() || undefined,
            target_scene_id: c.target_scene_id?.trim() || undefined,
            effects: (c.effects ?? []).filter(e => e.variable.trim()),
        }));

    const node: MenuNode = {
        id: isEditing.value ? props.editingNode!.id : `menu_${Date.now()}`,
        type: 'menu',
        order: isEditing.value ? props.editingNode!.order : props.lineCount + 1,
        prompt: prompt.value.trim() || undefined,
        choices: cleanChoices,
    };

    if (isEditing.value) {
        emit('update-menu', node);
    } else {
        emit('add-menu', node);
        reset();
    }
}

function reset() {
    prompt.value = '';
    choices.value = makeDefaultChoices();
    expandedIdx.value = null;
}

// Load existing node when editing
watch(() => props.editingNode, (node) => {
    if (!node) {
        reset();
        return;
    }
    prompt.value = node.prompt ?? '';
    choices.value = node.choices.map(c => ({
        ...c,
        effects: c.effects ? [...c.effects] : [],
        condition: c.condition ?? '',
        target_scene_id: c.target_scene_id ?? '',
    }));
    expandedIdx.value = null;
}, { immediate: true });

defineExpose({ reset });
</script>

<style scoped>
.menu-choice-editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
}

/* Fields */
.field-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
}

.field-label {
    font-size: 0.78rem;
    color: #94a3b8;
    font-weight: 500;
    letter-spacing: 0.02em;
}

.field-optional {
    color: #475569;
    font-weight: 400;
    font-size: 0.72rem;
}

.field-input {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: #f8fafc;
    font-size: 0.875rem;
    transition: border-color 0.2s;
    width: 100%;
    box-sizing: border-box;
}

.field-input:focus {
    outline: none;
    border-color: #38bdf8;
}

/* Choices */
.choices-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.choices-count {
    font-size: 0.72rem;
    color: #475569;
    background: rgba(255, 255, 255, 0.04);
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
}

.choices-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.choice-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.choice-badge {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    font-size: 0.72rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.choice-text-input {
    flex: 1;
}

.cog-btn {
    background: transparent;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 4px;
    color: #64748b;
    transition: all 0.2s;
    flex-shrink: 0;
}

.cog-btn:hover,
.cog-btn.active {
    background: rgba(56, 189, 248, 0.1);
    color: #38bdf8;
}

.remove-choice-btn {
    background: transparent;
    border: none;
    color: #475569;
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0.3rem;
    border-radius: 4px;
    transition: all 0.2s;
    flex-shrink: 0;
}

.remove-choice-btn:hover {
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
}

/* Advanced panel */
.advanced-panel {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    animation: fadeSlideIn 0.15s ease-out;
}

@keyframes fadeSlideIn {
    from {
        opacity: 0;
        transform: translateY(-6px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.advanced-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.advanced-title {
    font-size: 0.8rem;
    color: #94a3b8;
    font-weight: 600;
}

.advanced-note {
    font-size: 0.68rem;
    color: #334155;
    background: rgba(56, 189, 248, 0.07);
    border: 1px solid rgba(56, 189, 248, 0.15);
    padding: 0.1rem 0.45rem;
    border-radius: 10px;
}

/* Effects */
.effects-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.effects-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.effects-label {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
}

.add-effect-btn {
    font-size: 0.72rem;
    padding: 0.2rem 0.6rem;
    background: rgba(56, 189, 248, 0.1);
    border: 1px solid rgba(56, 189, 248, 0.2);
    color: #38bdf8;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.add-effect-btn:hover:not(:disabled) {
    background: rgba(56, 189, 248, 0.2);
}

.add-effect-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.effects-empty {
    font-size: 0.75rem;
    color: #334155;
    font-style: italic;
    padding: 0.5rem 0;
}

.effect-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.effect-input {
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 4px;
    padding: 0.35rem 0.5rem;
    color: #f8fafc;
    font-size: 0.78rem;
    transition: border-color 0.2s;
    box-sizing: border-box;
}

.effect-input:focus {
    outline: none;
    border-color: #38bdf8;
}

.effect-var {
    flex: 2;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
}

.effect-val {
    flex: 1;
    max-width: 72px;
}

.effect-select {
    flex: 1.5;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 4px;
    padding: 0.35rem 0.4rem;
    color: #94a3b8;
    font-size: 0.75rem;
    cursor: pointer;
}

.effect-toggle-hint {
    flex: 1;
    max-width: 72px;
    font-size: 0.72rem;
    color: #475569;
    text-align: center;
    font-style: italic;
}

.remove-effect-btn {
    background: transparent;
    border: none;
    color: #334155;
    cursor: pointer;
    font-size: 0.75rem;
    padding: 0.2rem 0.35rem;
    border-radius: 3px;
    transition: all 0.2s;
    flex-shrink: 0;
}

.remove-effect-btn:hover {
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
}

.condition-input,
.target-input {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
}

/* Add choice button */
.add-choice-btn {
    align-self: flex-start;
    background: transparent;
    border: 1px dashed #334155;
    color: #64748b;
    padding: 0.4rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
}

.add-choice-btn:hover {
    border-color: #38bdf8;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.05);
}

/* Actions */
.action-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: auto;
}

.btn {
    padding: 0.75rem 1.25rem;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    border: none;
    font-size: 0.9rem;
    flex: 1;
    min-width: 120px;
}

.btn.primary {
    background: #38bdf8;
    color: #020617;
}

.btn.primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn.secondary {
    background: #1e293b;
    color: #e2e8f0;
    border: 1px solid #334155;
}

.btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
}
</style>