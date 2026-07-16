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
                        <div class="effect-input-wrapper" :class="{ 'has-error': isVariableInvalid(effect.variable) }">
                            <select :value="effect.variable" @change="onEffectVariableChange(expandedIdx, eIdx, $event)"
                                class="effect-select effect-var-select" :id="`effect-var-${eIdx}`">
                                <option value="" disabled>Select variable…</option>
                                <option v-if="effect.variable && isVariableInvalid(effect.variable)"
                                    :value="effect.variable">
                                    {{ effect.variable }} (not in registry)
                                </option>
                                <option v-for="v in props.variables" :key="v.key" :value="v.key">
                                    {{ v.label || v.key }} ({{ v.type }})
                                </option>
                            </select>
                            <div v-if="isVariableInvalid(effect.variable)" class="variable-error">
                                ⚠️ Not in registry
                            </div>
                        </div>

                        <!-- Operation selector - dynamically shows options based on variable type -->
                        <select v-model="effect.operation" class="effect-select" :id="`effect-op-${eIdx}`"
                            :disabled="!getVariableType(effect.variable)">
                            <option v-for="op in getAvailableOperations(effect.variable)" :key="op.value"
                                :value="op.value">
                                {{ op.label }}
                            </option>
                        </select>

                        <!-- Value input - changes based on variable type -->
                        <template v-if="getVariableType(effect.variable) === 'boolean'">
                            <select v-model="effect.value" class="effect-select effect-boolean"
                                :id="`effect-bool-${eIdx}`">
                                <option :value="true">true</option>
                                <option :value="false">false</option>
                            </select>
                        </template>
                        <template v-else-if="getVariableType(effect.variable) === 'string'">
                            <input v-model="effect.value" type="text" class="effect-input effect-val effect-string"
                                placeholder="value" :id="`effect-string-${eIdx}`" />
                        </template>
                        <template v-else-if="effect.operation !== 'toggle'">
                            <input v-model.number="effect.value" type="number" class="effect-input effect-val"
                                placeholder="0" :id="`effect-val-${eIdx}`"
                                :disabled="!getVariableType(effect.variable)" />
                        </template>
                        <template v-else>
                            <span class="effect-toggle-hint" :id="`effect-toggle-hint-${eIdx}`">bool</span>
                        </template>

                        <button class="remove-effect-btn" @click="removeEffect(expandedIdx, eIdx)"
                            :id="`remove-effect-${eIdx}`">✕</button>
                    </div>
                </div>

                <!-- Condition — structured builder, same shape as Effects -->
                <div class="field-group" id="condition-section">
                    <div class="condition-header">
                        <label class="field-label" id="condition-label">
                            Show Condition <span class="field-optional">(future gating — not yet active)</span>
                        </label>
                        <button class="add-effect-btn" @click="addConditionPart(expandedIdx)"
                            :disabled="(expandedChoice._conditionParts?.length ?? 0) >= 5" id="add-condition-btn">
                            + Add Condition
                        </button>
                    </div>

                    <div v-if="!expandedChoice._conditionParts?.length" class="effects-empty" id="condition-empty">
                        No conditions yet — this choice is always shown.
                    </div>

                    <template v-for="(part, pIdx) in expandedChoice._conditionParts" :key="pIdx">
                        <div class="condition-part-row" :id="`condition-part-${pIdx}`">
                            <div class="effect-input-wrapper"
                                :class="{ 'has-error': isVariableInvalid(part.variable) }">
                                <select :value="part.variable"
                                    @change="onConditionVariableChange(expandedIdx, pIdx, $event)"
                                    class="effect-select condition-var-select" :id="`condition-var-${pIdx}`">
                                    <option value="" disabled>Select variable…</option>
                                    <option v-if="part.variable && isVariableInvalid(part.variable)"
                                        :value="part.variable">
                                        {{ part.variable }} (not in registry)
                                    </option>
                                    <option v-for="v in props.variables" :key="v.key" :value="v.key">
                                        {{ v.label || v.key }} ({{ v.type }})
                                    </option>
                                </select>
                                <div v-if="isVariableInvalid(part.variable)" class="variable-error">
                                    ⚠️ Not in registry
                                </div>
                            </div>

                            <select v-model="part.operator" class="effect-select condition-op-select"
                                :disabled="!getVariableType(part.variable)" :id="`condition-op-${pIdx}`">
                                <option v-for="op in getConditionOperators(part.variable)" :key="op.value"
                                    :value="op.value">
                                    {{ op.label }}
                                </option>
                            </select>

                            <select v-if="getVariableType(part.variable) === 'boolean'" v-model="part.value"
                                class="effect-select effect-boolean" :id="`condition-val-${pIdx}`">
                                <option :value="true">true</option>
                                <option :value="false">false</option>
                            </select>
                            <input v-else-if="getVariableType(part.variable) === 'string'" v-model="part.value"
                                type="text" class="effect-input effect-val effect-string" placeholder="value"
                                :id="`condition-val-${pIdx}`" />
                            <input v-else v-model.number="part.value" type="number" class="effect-input effect-val"
                                placeholder="0" :disabled="!getVariableType(part.variable)"
                                :id="`condition-val-${pIdx}`" />

                            <button class="remove-effect-btn" @click="removeConditionPart(expandedIdx, pIdx)"
                                :id="`remove-condition-${pIdx}`">✕</button>
                        </div>

                        <div v-if="pIdx < (expandedChoice._conditionParts?.length ?? 0) - 1" class="logical-op-row">
                            <select v-model="part.logicalOp" class="logical-op-select" :id="`condition-logic-${pIdx}`">
                                <option value="AND">AND</option>
                                <option value="OR">OR</option>
                            </select>
                        </div>
                    </template>

                    <div v-if="legacyConditionNotice" class="condition-hint">
                        <span class="hint-text">
                            💡 Existing free-text condition kept as-is: "{{ expandedChoice?.condition }}". Add a
                            condition above to replace it with structured rules.
                        </span>
                    </div>
                </div>

                <!-- Target scene -->
                <div class="field-group" id="target-section">
                    <label class="field-label" id="target-label">
                        Target Scene ID <span class="field-optional">(optional — for future scene linking)</span>
                    </label>
                    <input :value="expandedChoice.target_scene_id"
                        @input="updateExpandedField('target_scene_id', ($event.target as HTMLInputElement).value)"
                        type="text" class="field-input" placeholder="e.g. scene_3"
                        :id="`target-input-${expandedIdx}`" />
                </div>
            </div>
        </div>

        <button v-if="choices.length < 6" class="add-choice-btn" @click="addChoice" id="add-choice-btn">
            + Add Choice
        </button>

        <!-- Validation summary -->
        <div v-if="validationErrors.length > 0" class="validation-summary">
            <p class="validation-error-text">⚠️ {{ validationErrors.join('; ') }}</p>
        </div>

        <!-- Actions -->
        <div class="action-row" id="menu-actions">
            <button class="btn primary" @click="submit" :disabled="!canSubmit || hasValidationErrors"
                id="submit-menu-btn">
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
import type { MenuNode, MenuChoice, ChoiceEffect, StoryVariable, ConditionPart } from '@/types/models';

interface Props {
    editingNode?: MenuNode | null;
    lineCount?: number;
    variables?: StoryVariable[];
}

const props = withDefaults(defineProps<Props>(), {
    editingNode: null,
    lineCount: 0,
    variables: () => []
});

const emit = defineEmits<{
    (e: 'add-menu', node: MenuNode): void;
    (e: 'update-menu', node: MenuNode): void;
    (e: 'cancel'): void;
}>();

// ─── State ──────────────────────────────────────────────────────────────

const isEditing = computed(() => !!props.editingNode);

const prompt = ref('');
const choices = ref<MenuChoice[]>(makeDefaultChoices());
const expandedIdx = ref<number | null>(null);

// ─── Helpers ────────────────────────────────────────────────────────────

function makeDefaultChoices(): MenuChoice[] {
    return [
        { id: uid(), text: '', effects: [], condition: '', _conditionParts: [] },
        { id: uid(), text: '', effects: [], condition: '', _conditionParts: [] },
    ];
}

function uid(): string {
    return `choice_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// ─── Variable Type Helpers ────────────────────────────────────────────

const variableMap = computed(() => {
    const map = new Map<string, StoryVariable>();
    props.variables.forEach(v => map.set(v.key, v));
    return map;
});

const getVariableType = (key: string): StoryVariable['type'] | null => {
    if (!key || !key.trim()) return null;
    const variable = variableMap.value.get(key.trim());
    return variable?.type ?? null;
};

// ─── Operation Helpers (Effects — add/subtract/set/toggle) ────────────

interface EffectOperationOption {
    value: ChoiceEffect['operation'];
    label: string;
}

const getAvailableOperations = (key: string): EffectOperationOption[] => {
    const type = getVariableType(key);

    switch (type) {
        case 'number':
            return [
                { value: 'add', label: '+ add' },
                { value: 'subtract', label: '− subtract' },
                { value: 'set', label: '= set' },
            ];
        case 'boolean':
            return [
                { value: 'set', label: '= set' },
                { value: 'toggle', label: '⇄ toggle' },
            ];
        case 'string':
            return [
                { value: 'set', label: '= set' },
            ];
        default:
            // No variable selected yet — show the full set, disabled via the select itself
            return [
                { value: 'add', label: '+ add' },
                { value: 'subtract', label: '− subtract' },
                { value: 'set', label: '= set' },
                { value: 'toggle', label: '⇄ toggle' },
            ];
    }
};

// ─── Condition Operator Helpers (comparisons — =, !=, >=, <=, >, <) ───

interface ConditionOperatorOption {
    value: ConditionPart['operator'];
    label: string;
}

const getConditionOperators = (key: string): ConditionOperatorOption[] => {
    const type = getVariableType(key);

    switch (type) {
        case 'number':
            return [
                { value: '>', label: '>' },
                { value: '>=', label: '≥' },
                { value: '<', label: '<' },
                { value: '<=', label: '≤' },
                { value: '==', label: '=' },
                { value: '!=', label: '≠' },
            ];
        case 'boolean':
            return [
                { value: '==', label: 'is' },
                { value: '!=', label: 'is not' },
            ];
        case 'string':
            return [
                { value: '==', label: '=' },
                { value: '!=', label: '≠' },
            ];
        default:
            // No variable selected yet — show the full comparison set, disabled via the select itself
            return [
                { value: '>', label: '>' },
                { value: '>=', label: '≥' },
                { value: '<', label: '<' },
                { value: '<=', label: '≤' },
                { value: '==', label: '=' },
                { value: '!=', label: '≠' },
            ];
    }
};

// ─── Variable Validation ──────────────────────────────────────────────
// "Invalid" here means "references a key that isn't in the registry" —
// covers both stale/typo'd legacy data and anything a rename cascade
// (VariableManagerService) missed.

const variableKeys = computed(() => new Set(props.variables.map(v => v.key)));

const isVariableInvalid = (key: string): boolean => {
    if (!key || !key.trim()) return false; // not yet selected — not an error, just incomplete
    return !variableKeys.value.has(key.trim());
};

// ─── Condition string <-> ConditionPart[] ──────────────────────────────
// `condition` stays the canonical dormant/stored string (what a future
// evaluator reads). `_conditionParts` is the structured editing view.
// We serialize parts -> string on submit, and best-effort parse
// string -> parts on load (for data that predates the structured builder).

function formatConditionValue(type: StoryVariable['type'] | null, value: unknown): string {
    if (type === 'string') return `"${String(value ?? '').replace(/"/g, '\\"')}"`;
    if (type === 'boolean') return value ? 'true' : 'false';
    return String(value ?? 0);
}

function serializeConditionParts(parts: ConditionPart[]): string {
    return parts
        .filter(p => p.variable && p.operator)
        .map((p, i, arr) => {
            const type = getVariableType(p.variable);
            const segment = `${p.variable} ${p.operator} ${formatConditionValue(type, p.value)}`;
            return i < arr.length - 1 ? `${segment} ${p.logicalOp}` : segment;
        })
        .join(' ');
}

// Only understands the exact format serializeConditionParts produces
// (var OP value [AND|OR] var OP value ...). Anything else — hand-typed
// conditions from before this feature existed — is left alone rather
// than guessed at; legacyConditionNotice surfaces that to the editor.
function parseConditionString(condition: string): ConditionPart[] {
    if (!condition || !condition.trim()) return [];

    const tokens = condition.split(/\s+(AND|OR)\s+/i);
    const parts: ConditionPart[] = [];

    for (let i = 0; i < tokens.length; i += 2) {
        const expr = tokens[i]?.trim();
        if (!expr) continue;

        const match = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
        if (!match) return []; // unparseable — bail out, keep raw string as legacy fallback

        const [, variableRaw, operatorRaw, rawValueRaw] = match;
        if (!variableRaw || !operatorRaw || rawValueRaw === undefined) return [];

        const variable = variableRaw;
        const operator = operatorRaw as ConditionPart['operator']; // safe — regex only matches this exact union
        const type = getVariableType(variable);
        const trimmedValue = rawValueRaw.trim();
        let value: string | number | boolean = trimmedValue;

        if (type === 'boolean') value = trimmedValue === 'true';
        else if (type === 'number') value = parseFloat(trimmedValue) || 0;
        else value = trimmedValue.replace(/^"(.*)"$/, '$1');

        const joinerToken = tokens[i + 1];
        const logicalOp: 'AND' | 'OR' = joinerToken?.toUpperCase() === 'OR' ? 'OR' : 'AND';

        parts.push({ variable, operator, value, logicalOp });
    }

    return parts;
}

const legacyConditionNotice = computed(() => {
    if (!expandedChoice.value) return false;
    return !!expandedChoice.value.condition && (expandedChoice.value._conditionParts?.length ?? 0) === 0;
});

// ─── Validation Summary ──────────────────────────────────────────────

const hasValidationErrors = computed(() => {
    for (const choice of choices.value) {
        for (const effect of (choice.effects ?? [])) {
            if (isVariableInvalid(effect.variable)) return true;
        }
        for (const part of (choice._conditionParts ?? [])) {
            if (isVariableInvalid(part.variable)) return true;
        }
    }
    return false;
});

const validationErrors = computed(() => {
    const errors: string[] = [];

    choices.value.forEach((choice, ci) => {
        for (const effect of (choice.effects ?? [])) {
            if (isVariableInvalid(effect.variable)) {
                errors.push(`Choice ${ci + 1}: Unknown variable "${effect.variable}"`);
            }
        }
        for (const part of (choice._conditionParts ?? [])) {
            if (isVariableInvalid(part.variable)) {
                errors.push(`Choice ${ci + 1}: Unknown variable in condition "${part.variable}"`);
            }
        }
    });

    return errors;
});

// ─── Other computed ────────────────────────────────────────────────────

const expandedChoice = computed<MenuChoice | null>(() => {
    if (expandedIdx.value === null) return null;
    return choices.value[expandedIdx.value] ?? null;
});

const canSubmit = computed(() => {
    const hasValidChoices = choices.value.filter(c => c.text.trim()).length >= 2;
    return hasValidChoices && !hasValidationErrors.value;
});

// ─── Methods ──────────────────────────────────────────────────────────

function updateExpandedField(field: 'target_scene_id', value: string) {
    if (expandedIdx.value === null) return;
    const choice = choices.value[expandedIdx.value];
    if (!choice) return;
    choice[field] = value;
}

function addChoice() {
    if (choices.value.length >= 6) return;
    choices.value.push({ id: uid(), text: '', effects: [], condition: '', _conditionParts: [] });
}

function removeChoice(idx: number) {
    choices.value.splice(idx, 1);
    if (expandedIdx.value === idx) expandedIdx.value = null;
    else if (expandedIdx.value !== null && expandedIdx.value > idx) expandedIdx.value--;
}

function toggleAdvanced(idx: number) {
    expandedIdx.value = expandedIdx.value === idx ? null : idx;
}

// ─── Effects ────────────────────────────────────────────────────────

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

// Picking a variable from the dropdown resets operation/value to something
// valid for that variable's type, so you never end up with e.g. "toggle"
// selected against a number.
function onEffectVariableChange(choiceIdx: number, effectIdx: number, event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const effect = choices.value[choiceIdx]?.effects?.[effectIdx];
    if (!effect) return;

    effect.variable = value;
    const type = getVariableType(value);
    const validOps = getAvailableOperations(value).map(o => o.value);
    if (!validOps.includes(effect.operation)) {
        effect.operation = validOps[0] ?? 'add';
    }

    if (type === 'boolean') effect.value = true;
    else if (type === 'string') effect.value = typeof effect.value === 'string' ? effect.value : '';
    else effect.value = typeof effect.value === 'number' ? effect.value : 0;
}

// ─── Condition parts ────────────────────────────────────────────────

function addConditionPart(choiceIdx: number) {
    const choice = choices.value[choiceIdx];
    if (!choice) return;
    if (!choice._conditionParts) choice._conditionParts = [];
    if (choice._conditionParts.length >= 5) return;
    choice._conditionParts.push({ variable: '', operator: '==', value: 0, logicalOp: 'AND' });
}

function removeConditionPart(choiceIdx: number, partIdx: number) {
    choices.value[choiceIdx]?._conditionParts?.splice(partIdx, 1);
}

function onConditionVariableChange(choiceIdx: number, partIdx: number, event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const part = choices.value[choiceIdx]?._conditionParts?.[partIdx];
    if (!part) return;

    part.variable = value;
    const type = getVariableType(value);
    const validOps = getConditionOperators(value).map(o => o.value);
    if (!validOps.includes(part.operator)) {
        part.operator = validOps[0] ?? '==';
    }

    if (type === 'boolean') part.value = true;
    else if (type === 'string') part.value = '';
    else part.value = 0;
}

// ─── Submit ─────────────────────────────────────────────────────────

function submit() {
    if (!canSubmit.value) return;

    const cleanChoices: MenuChoice[] = choices.value
        .filter(c => c.text.trim())
        .map(c => {
            const parts = (c._conditionParts ?? []).filter(p => p.variable && p.operator);
            // Only overwrite the stored condition string when there are structured
            // parts to serialize — otherwise leave any pre-existing legacy string
            // (one that didn't parse back into parts) untouched rather than wiping it.
            const condition = parts.length > 0
                ? serializeConditionParts(parts)
                : (c.condition?.trim() || undefined);

            return {
                ...c,
                text: c.text.trim(),
                condition,
                _conditionParts: parts.length > 0 ? parts : undefined,
                target_scene_id: c.target_scene_id?.trim() || undefined,
                effects: (c.effects ?? [])
                    .filter(e => e.variable.trim() && !isVariableInvalid(e.variable))
                    .map(e => {
                        const varType = getVariableType(e.variable);
                        let value: string | number | boolean = e.value;

                        if (varType === 'number' && typeof e.value === 'string') {
                            value = parseFloat(e.value) || 0;
                        } else if (varType === 'boolean' && typeof e.value === 'string') {
                            value = e.value === 'true';
                        } else if (varType === 'string' && typeof e.value === 'number') {
                            value = String(e.value);
                        }

                        return { ...e, variable: e.variable.trim(), value };
                    }),
            };
        });

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

// ─── Watch for editing ────────────────────────────────────────────────────

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
        _conditionParts: c._conditionParts && c._conditionParts.length > 0
            ? [...c._conditionParts]
            : parseConditionString(c.condition ?? ''),
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

.choices-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.choices-count {
    font-size: 0.72rem;
    color: #64748b;
    background: rgba(255, 255, 255, 0.05);
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

.effects-header,
.condition-header {
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

.effect-row,
.condition-part-row {
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

.effect-val {
    flex: 1;
    max-width: 72px;
}

.effect-string {
    max-width: 120px;
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

.effect-select:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.effect-var-select,
.condition-var-select {
    flex: 2;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
}

.condition-op-select {
    flex: 1;
    max-width: 90px;
}

.effect-boolean {
    flex: 1;
    max-width: 80px;
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

/* Condition logical-op connector between rows */
.logical-op-row {
    display: flex;
    justify-content: center;
    padding-left: 1.5rem;
}

.logical-op-select {
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.25);
    color: #f59e0b;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    border-radius: 4px;
    padding: 0.1rem 0.5rem;
    cursor: pointer;
}

.condition-hint {
    margin-top: 0.15rem;
}

.hint-text {
    font-size: 0.7rem;
    color: #475569;
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

/* Variable validation styles */
.effect-input-wrapper {
    position: relative;
    flex: 2;
}

.effect-input-wrapper.has-error .effect-select {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
}

.variable-error {
    position: absolute;
    bottom: -1.2rem;
    left: 0;
    font-size: 0.6rem;
    color: #ef4444;
    white-space: nowrap;
}

/* Validation summary */
.validation-summary {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
}

.validation-error-text {
    color: #ef4444;
    font-size: 0.78rem;
    margin: 0;
}
</style>