<!-- frontend/src/components/scene/MenuChoiceEditor.vue -->
<template>
    <div class="flex flex-col gap-4 flex-1" id="menu-choice-editor">

        <!-- Optional prompt -->
        <div class="flex flex-col gap-1.5" id="prompt-group">
            <label class="text-[0.78rem] text-slate-400 font-medium tracking-wide" id="prompt-label">
                Prompt <span class="text-slate-500 font-normal text-[0.72rem]">(optional)</span>
            </label>
            <input v-model="prompt" type="text"
                class="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-50 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                id="menu-prompt-input" placeholder="e.g. How do you respond?" />
        </div>

        <!-- Choices -->
        <div class="flex justify-between items-center" id="choices-header">
            <span class="text-[0.78rem] text-slate-400 font-medium tracking-wide">Choices</span>
            <span class="text-[0.72rem] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full" id="choices-count">
                {{ choices.length }} / 6
            </span>
        </div>

        <div class="flex flex-col gap-2" id="choices-list">
            <div v-for="(choice, idx) in choices" :key="choice.id" class="flex items-center gap-2"
                :id="`choice-row-${idx}`">
                <span
                    class="w-5.5 h-5.5 rounded-full bg-sky-400/15 text-sky-400 text-[0.72rem] font-bold flex items-center justify-center shrink-0"
                    :id="`choice-badge-${idx}`">
                    {{ idx + 1 }}
                </span>

                <input v-model="choice.text" type="text"
                    class="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-50 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                    :placeholder="`Choice ${idx + 1}…`" :id="`choice-text-${idx}`" />

                <button
                    class="bg-transparent border-none text-base cursor-pointer p-1 rounded text-slate-500 hover:bg-sky-400/10 hover:text-sky-400 transition-all shrink-0"
                    :class="{ 'bg-sky-400/10 !text-sky-400': expandedIdx === idx }" @click="toggleAdvanced(idx)"
                    title="Advanced options" :id="`choice-cog-${idx}`">
                    ⚙️
                </button>

                <button v-if="choices.length > 2"
                    class="bg-transparent border-none text-slate-500 cursor-pointer text-xs p-1 rounded hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
                    @click="removeChoice(idx)" title="Remove choice" :id="`choice-remove-${idx}`">
                    ✕
                </button>
            </div>

            <!-- Advanced drawer for expanded choice -->
            <div v-if="expandedIdx !== null && expandedChoice"
                class="bg-white/[0.02] border border-slate-800 rounded-lg p-4 flex flex-col gap-3.5 transition-all"
                :id="`choice-advanced-${expandedIdx}`">
                <div class="flex justify-between items-center">
                    <span class="text-xs text-slate-400 font-semibold">Advanced — Choice {{ expandedIdx + 1 }}</span>
                    <span
                        class="text-[0.68rem] text-slate-400 bg-sky-400/10 border border-sky-400/20 px-2 py-0.5 rounded-full">
                        Stored, not active yet
                    </span>
                </div>

                <!-- Effects -->
                <div class="flex flex-col gap-2" id="effects-section">
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-slate-500 font-medium">Point / Variable Effects</span>
                        <button
                            class="text-[0.72rem] px-2.5 py-1 bg-sky-400/10 border border-sky-400/20 text-sky-400 rounded cursor-pointer hover:bg-sky-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            @click="addEffect(expandedIdx)" :disabled="(expandedChoice.effects?.length ?? 0) >= 5"
                            id="add-effect-btn">
                            + Add Effect
                        </button>
                    </div>

                    <div v-if="!expandedChoice.effects?.length" class="text-xs text-slate-500 italic py-2"
                        id="effects-empty">
                        No effects yet — add one to track points or flags.
                    </div>

                    <div v-for="(effect, eIdx) in expandedChoice.effects" :key="eIdx" class="flex items-center gap-1.5"
                        :id="`effect-row-${eIdx}`">
                        <div class="relative flex-[2]"
                            :class="{ '[&>select]:border-red-500 [&>select]:bg-red-500/5': isVariableInvalid(effect.variable) }">
                            <select :value="effect.variable" @change="onEffectVariableChange(expandedIdx, eIdx, $event)"
                                class="w-full flex-[2] font-mono text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-400 cursor-pointer focus:outline-none focus:border-sky-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                :id="`effect-var-${eIdx}`">
                                <option value="" disabled>Select variable…</option>
                                <option v-if="effect.variable && isVariableInvalid(effect.variable)"
                                    :value="effect.variable">
                                    {{ effect.variable }} (not in registry)
                                </option>
                                <option v-for="v in props.variables" :key="v.key" :value="v.key">
                                    {{ v.label || v.key }} ({{ v.type }})
                                </option>
                            </select>
                            <div v-if="isVariableInvalid(effect.variable)"
                                class="absolute -bottom-4 left-0 text-[0.6rem] text-red-500 whitespace-nowrap">
                                ⚠️ Not in registry
                            </div>
                        </div>

                        <!-- Operation selector -->
                        <select v-model="effect.operation"
                            class="flex-[1.5] bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-400 text-xs cursor-pointer focus:outline-none focus:border-sky-400 disabled:opacity-30 disabled:cursor-not-allowed"
                            :id="`effect-op-${eIdx}`" :disabled="!getVariableType(effect.variable)">
                            <option v-for="op in getAvailableOperations(effect.variable)" :key="op.value"
                                :value="op.value">
                                {{ op.label }}
                            </option>
                        </select>

                        <!-- Value input -->
                        <template v-if="getVariableType(effect.variable) === 'boolean'">
                            <select v-model="effect.value"
                                class="flex-1 max-w-[80px] bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-400 text-xs cursor-pointer focus:outline-none focus:border-sky-400"
                                :id="`effect-bool-${eIdx}`">
                                <option :value="true">true</option>
                                <option :value="false">false</option>
                            </select>
                        </template>
                        <template v-else-if="getVariableType(effect.variable) === 'string'">
                            <input v-model="effect.value" type="text"
                                class="max-w-[120px] bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-50 text-xs focus:outline-none focus:border-sky-400 transition-colors"
                                placeholder="value" :id="`effect-string-${eIdx}`" />
                        </template>
                        <template v-else-if="effect.operation !== 'toggle'">
                            <input v-model.number="effect.value" type="number"
                                class="flex-1 max-w-[72px] bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-50 text-xs focus:outline-none focus:border-sky-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                placeholder="0" :id="`effect-val-${eIdx}`"
                                :disabled="!getVariableType(effect.variable)" />
                        </template>
                        <template v-else>
                            <span class="flex-1 max-w-[72px] text-[0.72rem] text-slate-500 text-center italic"
                                :id="`effect-toggle-hint-${eIdx}`">bool</span>
                        </template>

                        <button
                            class="bg-transparent border-none text-slate-600 hover:text-red-400 hover:bg-red-400/10 cursor-pointer text-xs p-1 rounded transition-all shrink-0"
                            @click="removeEffect(expandedIdx, eIdx)" :id="`remove-effect-${eIdx}`">✕</button>
                    </div>
                </div>

                <!-- Condition — structured builder -->
                <div class="flex flex-col gap-1.5" id="condition-section">
                    <div class="flex justify-between items-center">
                        <label class="text-[0.78rem] text-slate-400 font-medium tracking-wide" id="condition-label">
                            Show Condition <span class="text-slate-500 font-normal text-[0.72rem]">(future gating — not
                                yet
                                active)</span>
                        </label>
                        <button
                            class="text-[0.72rem] px-2.5 py-1 bg-sky-400/10 border border-sky-400/20 text-sky-400 rounded cursor-pointer hover:bg-sky-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            @click="addConditionPart(expandedIdx)"
                            :disabled="(expandedChoice._conditionParts?.length ?? 0) >= 5" id="add-condition-btn">
                            + Add Condition
                        </button>
                    </div>

                    <div v-if="!expandedChoice._conditionParts?.length" class="text-xs text-slate-500 italic py-2"
                        id="condition-empty">
                        No conditions yet — this choice is always shown.
                    </div>

                    <template v-for="(part, pIdx) in expandedChoice._conditionParts" :key="pIdx">
                        <div class="flex items-center gap-1.5" :id="`condition-part-${pIdx}`">
                            <div class="relative flex-[2]"
                                :class="{ '[&>select]:border-red-500 [&>select]:bg-red-500/5': isVariableInvalid(part.variable) }">
                                <select :value="part.variable"
                                    @change="onConditionVariableChange(expandedIdx, pIdx, $event)"
                                    class="w-full flex-[2] font-mono text-xs bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-400 cursor-pointer focus:outline-none focus:border-sky-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                    :id="`condition-var-${pIdx}`">
                                    <option value="" disabled>Select variable…</option>
                                    <option v-if="part.variable && isVariableInvalid(part.variable)"
                                        :value="part.variable">
                                        {{ part.variable }} (not in registry)
                                    </option>
                                    <option v-for="v in props.variables" :key="v.key" :value="v.key">
                                        {{ v.label || v.key }} ({{ v.type }})
                                    </option>
                                </select>
                                <div v-if="isVariableInvalid(part.variable)"
                                    class="absolute -bottom-4 left-0 text-[0.6rem] text-red-500 whitespace-nowrap">
                                    ⚠️ Not in registry
                                </div>
                            </div>

                            <select v-model="part.operator"
                                class="flex-1 max-w-[90px] bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-400 text-xs cursor-pointer focus:outline-none focus:border-sky-400 disabled:opacity-30 disabled:cursor-not-allowed"
                                :disabled="!getVariableType(part.variable)" :id="`condition-op-${pIdx}`">
                                <option v-for="op in getConditionOperators(part.variable)" :key="op.value"
                                    :value="op.value">
                                    {{ op.label }}
                                </option>
                            </select>

                            <select v-if="getVariableType(part.variable) === 'boolean'" v-model="part.value"
                                class="flex-1 max-w-[80px] bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-400 text-xs cursor-pointer focus:outline-none focus:border-sky-400"
                                :id="`condition-val-${pIdx}`">
                                <option :value="true">true</option>
                                <option :value="false">false</option>
                            </select>
                            <input v-else-if="getVariableType(part.variable) === 'string'" v-model="part.value"
                                type="text"
                                class="max-w-[120px] bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-50 text-xs focus:outline-none focus:border-sky-400 transition-colors"
                                placeholder="value" :id="`condition-val-${pIdx}`" />
                            <input v-else v-model.number="part.value" type="number"
                                class="flex-1 max-w-[72px] bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-50 text-xs focus:outline-none focus:border-sky-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                placeholder="0" :disabled="!getVariableType(part.variable)"
                                :id="`condition-val-${pIdx}`" />

                            <button
                                class="bg-transparent border-none text-slate-600 hover:text-red-400 hover:bg-red-400/10 cursor-pointer text-xs p-1 rounded transition-all shrink-0"
                                @click="removeConditionPart(expandedIdx, pIdx)"
                                :id="`remove-condition-${pIdx}`">✕</button>
                        </div>

                        <div v-if="pIdx < (expandedChoice._conditionParts?.length ?? 0) - 1"
                            class="flex justify-center pl-6">
                            <select v-model="part.logicalOp"
                                class="bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[0.68rem] font-bold tracking-wider rounded px-2 py-0.5 cursor-pointer outline-none"
                                :id="`condition-logic-${pIdx}`">
                                <option value="AND">AND</option>
                                <option value="OR">OR</option>
                            </select>
                        </div>
                    </template>

                    <div v-if="legacyConditionNotice" class="mt-0.5">
                        <span class="text-[0.7rem] text-slate-500">
                            💡 Existing free-text condition kept as-is: "{{ expandedChoice?.condition }}". Add a
                            condition above to replace it with structured rules.
                        </span>
                    </div>
                </div>

                <!-- Target scene -->
                <div class="flex flex-col gap-1.5" id="target-section">
                    <label class="text-[0.78rem] text-slate-400 font-medium tracking-wide" id="target-label">
                        Target Scene ID <span class="text-slate-500 font-normal text-[0.72rem]">(optional — for future
                            scene
                            linking)</span>
                    </label>
                    <input :value="expandedChoice.target_scene_id"
                        @input="updateExpandedField('target_scene_id', ($event.target as HTMLInputElement).value)"
                        type="text"
                        class="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-50 text-sm focus:outline-none focus:border-sky-400 transition-colors"
                        placeholder="e.g. scene_3" :id="`target-input-${expandedIdx}`" />
                </div>
            </div>
        </div>

        <button v-if="choices.length < 6"
            class="self-start bg-transparent border border-dashed border-slate-700 text-slate-400 px-4 py-1.5 rounded-md cursor-pointer text-xs hover:border-sky-400 hover:text-sky-400 hover:bg-sky-400/5 transition-all"
            @click="addChoice" id="add-choice-btn">
            + Add Choice
        </button>

        <!-- Validation summary -->
        <div v-if="validationErrors.length > 0" class="bg-red-500/10 border border-red-500/20 rounded-md p-2">
            <p class="text-red-400 text-xs m-0">⚠️ {{ validationErrors.join('; ') }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 flex-wrap mt-auto" id="menu-actions">
            <button
                class="flex-1 min-w-[120px] px-5 py-3 rounded-md cursor-pointer font-medium transition-all text-sm border-none bg-sky-400 text-slate-950 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                @click="submit" :disabled="!canSubmit || hasValidationErrors" id="submit-menu-btn">
                {{ isEditing ? '✓ Update Menu' : '+ Add Menu Node' }}
            </button>
            <button
                class="flex-1 min-w-[120px] px-5 py-3 rounded-md cursor-pointer font-medium transition-all text-sm bg-slate-800 text-slate-200 border border-slate-700 hover:opacity-90 hover:-translate-y-0.5"
                @click="$emit('cancel')" id="cancel-menu-btn">
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

const variableKeys = computed(() => new Set(props.variables.map(v => v.key)));

const isVariableInvalid = (key: string): boolean => {
    if (!key || !key.trim()) return false;
    return !variableKeys.value.has(key.trim());
};

// ─── Condition string <-> ConditionPart[] ──────────────────────────────

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

function parseConditionString(condition: string): ConditionPart[] {
    if (!condition || !condition.trim()) return [];

    const tokens = condition.split(/\s+(AND|OR)\s+/i);
    const parts: ConditionPart[] = [];

    for (let i = 0; i < tokens.length; i += 2) {
        const expr = tokens[i]?.trim();
        if (!expr) continue;

        const match = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
        if (!match) return [];

        const [, variableRaw, operatorRaw, rawValueRaw] = match;
        if (!variableRaw || !operatorRaw || rawValueRaw === undefined) return [];

        const variable = variableRaw;
        const operator = operatorRaw as ConditionPart['operator'];
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