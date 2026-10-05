<!-- frontend/src/components/scene/VariableManager.vue -->
<template>
    <div v-if="open" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
        id="variable-manager-modal" @click.self="handleClose">
        <div class="bg-slate-800 rounded-xl max-w-3xl w-full shadow-2xl max-h-[85vh] flex flex-col border border-slate-700"
            id="variable-manager-container">

            <!-- Header -->
            <div class="p-6 border-b border-slate-700 flex items-center justify-between shrink-0"
                id="variable-manager-header">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">🧮</span>
                    <div>
                        <h3 class="text-xl font-semibold text-slate-100 m-0">Story Variables</h3>
                        <p class="text-sm text-slate-400 m-0 mt-0.5">
                            {{ variables.length }} variable{{ variables.length !== 1 ? 's' : '' }} defined for this
                            project
                        </p>
                    </div>
                </div>
                <button @click="handleClose"
                    class="bg-transparent border-none text-slate-400 hover:text-white text-xl leading-none cursor-pointer p-1 rounded transition-colors"
                    id="variable-manager-close-btn" title="Close">✕</button>
            </div>

            <!-- Body -->
            <div class="p-6 overflow-y-auto flex-1" id="variable-manager-body">

                <div v-if="formError"
                    class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4 flex items-center gap-2"
                    id="variable-form-error">
                    <span>⚠️</span> {{ formError }}
                </div>

                <!-- Create / Edit form -->
                <div v-if="isFormOpen" class="bg-slate-900/90 border border-slate-700 rounded-xl p-5 mb-6 shadow-inner"
                    id="variable-form-panel">
                    <div class="mb-4 pb-2 border-b border-slate-800">
                        <span class="text-sm font-semibold text-slate-200">{{ editingKey ? `Edit "${editingKey}"` :
                            'NewVariable' }}</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold text-slate-300" for="variable-key-input">
                                Key <span class="text-slate-500 font-normal">(snake_case, used in effects &amp;
                                    conditions)</span>
                            </label>
                            <input v-model="formKey" type="text"
                                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all placeholder:text-slate-600"
                                id="variable-key-input" placeholder="e.g. reputation" />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold text-slate-300" for="variable-label-input">
                                Label <span class="text-slate-500 font-normal">(optional)</span>
                            </label>
                            <input v-model="formLabel" type="text"
                                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all placeholder:text-slate-600"
                                id="variable-label-input" placeholder="e.g. Street Reputation" />
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold text-slate-300" for="variable-type-select">Type</label>
                            <select v-model="formType"
                                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all cursor-pointer"
                                id="variable-type-select">
                                <option value="number">Number</option>
                                <option value="boolean">Boolean</option>
                                <option value="string">String</option>
                            </select>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold text-slate-300" for="variable-category-select">
                                Category <span class="text-slate-500 font-normal">(optional)</span>
                            </label>
                            <select v-model="formCategory"
                                class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all cursor-pointer"
                                id="variable-category-select">
                                <option value="">None</option>
                                <option value="affinity">Affinity</option>
                                <option value="flag">Flag</option>
                                <option value="resource">Resource</option>
                                <option value="karma">Karma</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex flex-col gap-1.5 mb-4">
                        <label class="text-xs font-semibold text-slate-300" for="variable-default-input">Default
                            Value</label>
                        <select v-if="formType === 'boolean'" v-model="formDefaultValue"
                            class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all cursor-pointer"
                            id="variable-default-input">
                            <option value="false">false</option>
                            <option value="true">true</option>
                        </select>
                        <input v-else :type="formType === 'number' ? 'number' : 'text'" v-model="formDefaultValue"
                            class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all placeholder:text-slate-600"
                            id="variable-default-input" :placeholder="formType === 'number' ? '0' : 'default text'" />
                    </div>

                    <div v-if="editingKey && renameImpactCount > 0"
                        class="text-xs text-amber-400 mb-3 flex items-center gap-1" id="rename-impact-note">
                        ℹ️ Changing the key will update {{ renameImpactCount }} reference{{ renameImpactCount !== 1 ?
                            's' : '' }} across scenes automatically.
                    </div>

                    <div class="flex items-center gap-3 mt-4">
                        <button @click="submitForm"
                            class="bg-sky-500 hover:bg-sky-400 text-white font-medium px-4 py-2 text-sm rounded-lg transition-colors border-none cursor-pointer"
                            id="variable-form-submit-btn">
                            {{ editingKey ? '✓ Save Changes' : '+ Create Variable' }}
                        </button>
                        <button @click="cancelForm"
                            class="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-4 py-2 text-sm rounded-lg transition-colors border-none cursor-pointer"
                            id="variable-form-cancel-btn">Cancel</button>
                    </div>
                </div>

                <button v-else @click="openCreateForm"
                    class="bg-sky-500 hover:bg-sky-400 text-white font-medium px-4 py-2 text-sm rounded-lg transition-colors border-none cursor-pointer mb-6"
                    id="open-create-variable-btn">
                    + New Variable
                </button>

                <!-- Empty state -->
                <div v-if="variables.length === 0" class="flex flex-col items-center justify-center py-12 text-center"
                    id="variables-empty-state">
                    <div class="text-4xl mb-3">🧮</div>
                    <p class="text-slate-400 text-sm m-0">No variables yet. Create one to start tracking points, flags,
                        or resources.</p>
                </div>

                <!-- Variable list -->
                <div v-else class="flex flex-col gap-3" id="variables-list">
                    <div v-for="variable in variables" :key="variable.key"
                        class="bg-slate-900/60 border border-slate-700/80 rounded-xl p-4 transition-all"
                        :id="`variable-row-${variable.key}`">
                        <div class="flex items-start justify-between gap-3 flex-wrap">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-mono text-sky-400 font-semibold text-sm">{{ variable.key }}</span>
                                    <span v-if="variable.label" class="text-slate-400 text-sm">{{ variable.label
                                    }}</span>
                                    <span
                                        class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-700 text-slate-300">{{
                                            variable.type }}</span>
                                    <span v-if="variable.category"
                                        class="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-950 text-sky-400 border border-sky-800/50">{{
                                            variable.category }}</span>
                                </div>
                                <div class="text-xs text-slate-400 mt-1">
                                    Default: <span class="text-slate-200 font-mono">{{ formatDefault(variable) }}</span>
                                </div>
                            </div>

                            <div class="flex items-center gap-2 shrink-0">
                                <button @click="toggleUsage(variable.key)"
                                    class="px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors border-none"
                                    :class="usageCount(variable.key) > 0 ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-slate-700/60 text-slate-400'"
                                    :id="`usage-toggle-${variable.key}`">
                                    {{ usageCount(variable.key) }} use{{ usageCount(variable.key) !== 1 ? 's' : '' }}
                                    <span v-if="usageCount(variable.key) > 0">{{ expandedUsageKey === variable.key ? '▲'
                                        : '▼' }}</span>
                                </button>
                                <button @click="openEditForm(variable)"
                                    class="bg-transparent border-none text-slate-400 hover:text-slate-100 hover:bg-white/10 p-1.5 rounded transition-all cursor-pointer text-sm"
                                    :id="`edit-variable-${variable.key}`" title="Edit">✏️️</button>
                                <button @click="requestDelete(variable.key)"
                                    class="bg-transparent border-none text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded transition-all cursor-pointer text-sm"
                                    :id="`delete-variable-${variable.key}`" title="Delete">🗑️</button>
                            </div>
                        </div>

                        <!-- Usage breakdown -->
                        <div v-if="expandedUsageKey === variable.key" class="mt-3 pt-3 border-t border-slate-700/70"
                            :id="`usage-panel-${variable.key}`">
                            <div v-if="usageFor(variable.key).length === 0" class="text-xs text-slate-500 italic">
                                Not referenced anywhere yet.
                            </div>
                            <div v-else class="flex flex-col gap-2">
                                <div v-for="(entry, i) in usageFor(variable.key)" :key="i"
                                    class="text-xs bg-slate-950/60 rounded-lg p-2.5 flex items-center gap-2 flex-wrap border border-slate-800">
                                    <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                        :class="entry.role === 'write' ? 'bg-sky-950 text-sky-400 border border-sky-800/50' : 'bg-amber-950 text-amber-400 border border-amber-800/50'">
                                        {{ entry.role === 'write' ? '✎ write' : '👁 read' }}
                                    </span>
                                    <span class="text-slate-200 font-medium">{{ entry.sceneName }}</span>
                                    <span class="text-slate-600">→</span>
                                    <span v-if="entry.menuPrompt" class="text-slate-400 italic">"{{ entry.menuPrompt
                                    }}"</span>
                                    <span v-if="entry.menuPrompt" class="text-slate-600">→</span>
                                    <span class="text-slate-300">{{ entry.choiceText }}</span>
                                    <span
                                        class="text-slate-400 font-mono ml-auto text-[11px] bg-slate-900 px-1.5 py-0.5 rounded">{{
                                            entry.detail }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Delete confirmation / blocked warning -->
                        <div v-if="pendingDeleteKey === variable.key" class="mt-3 pt-3 border-t border-slate-700/70"
                            :id="`delete-confirm-${variable.key}`">
                            <div v-if="usageCount(variable.key) === 0" class="text-xs text-slate-300 mb-2">
                                Delete <span class="font-mono text-sky-400 font-semibold">{{ variable.key }}</span>?
                                This cannot be undone.
                            </div>
                            <div v-else class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-2">
                                <p class="text-amber-400 text-xs font-semibold m-0 mb-1">
                                    ⚠️ Still referenced in {{ usageCount(variable.key) }} place{{
                                        usageCount(variable.key) !== 1 ? 's' : '' }}
                                </p>
                                <p class="text-slate-400 text-[11px] m-0">
                                    Deleting now will leave those effects/conditions pointing at a variable that no
                                    longer exists.
                                </p>
                            </div>
                            <div class="flex items-center gap-2">
                                <button v-if="usageCount(variable.key) === 0" @click="confirmDelete(variable.key)"
                                    class="bg-red-600 hover:bg-red-500 text-white font-medium px-3 py-1 text-xs rounded-md transition-colors border-none cursor-pointer"
                                    :id="`confirm-delete-${variable.key}`">
                                    Delete
                                </button>
                                <button v-else @click="confirmDelete(variable.key, true)"
                                    class="bg-red-600 hover:bg-red-500 text-white font-medium px-3 py-1 text-xs rounded-md transition-colors border-none cursor-pointer"
                                    :id="`force-delete-${variable.key}`">
                                    Delete Anyway
                                </button>
                                <button @click="pendingDeleteKey = null"
                                    class="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-3 py-1 text-xs rounded-md transition-colors border-none cursor-pointer"
                                    :id="`cancel-delete-${variable.key}`">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-6 border-t border-slate-700 flex justify-end shrink-0" id="variable-manager-footer">
                <button @click="handleClose"
                    class="bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium px-4 py-2 text-sm rounded-lg transition-colors border-none cursor-pointer"
                    id="variable-manager-done-btn">Close</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Scene, StoryVariable } from '@/types/models';
import {
    createVariable,
    updateVariable,
    deleteVariable,
    getAllVariableUsage,
    type VariableUsage
} from '@/services/VariableManagerService';

interface Props {
    open: boolean;
    variables: StoryVariable[];
    scenes: Scene[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void;
    (e: 'update:variables', value: StoryVariable[]): void;
    (e: 'update:scenes', value: Scene[]): void;
}>();

// ─── Usage (recomputed whenever scenes change) ───────────────────────────
const usageMap = computed<Record<string, VariableUsage[]>>(() => getAllVariableUsage(props.scenes));
const usageFor = (key: string): VariableUsage[] => usageMap.value[key] ?? [];
const usageCount = (key: string): number => usageFor(key).length;

const expandedUsageKey = ref<string | null>(null);
const toggleUsage = (key: string) => {
    expandedUsageKey.value = expandedUsageKey.value === key ? null : key;
};

// ─── Form state ───────────────────────────────────────────────────────────
const isFormOpen = ref(false);
const editingKey = ref<string | null>(null);
const formKey = ref('');
const formLabel = ref('');
const formType = ref<'number' | 'boolean' | 'string'>('number');
const formCategory = ref<StoryVariable['category'] | ''>('');
const formDefaultValue = ref<string>('0'); // raw string; coerced to the right type on submit
const formError = ref<string | null>(null);

// Reset the default-value field to something sensible when switching type,
// but not while we're populating the form from an existing variable.
let isPopulating = false;
watch(formType, (newType) => {
    if (isPopulating) return;
    formDefaultValue.value = newType === 'boolean' ? 'false' : newType === 'number' ? '0' : '';
});

const renameImpactCount = computed(() => {
    if (!editingKey.value) return 0;
    if (formKey.value.trim() === editingKey.value) return 0;
    return usageCount(editingKey.value);
});

const resetForm = () => {
    formKey.value = '';
    formLabel.value = '';
    formType.value = 'number';
    formCategory.value = '';
    formDefaultValue.value = '0';
    formError.value = null;
};

const openCreateForm = () => {
    editingKey.value = null;
    resetForm();
    isFormOpen.value = true;
};

const openEditForm = (variable: StoryVariable) => {
    isPopulating = true;
    editingKey.value = variable.key;
    formKey.value = variable.key;
    formLabel.value = variable.label ?? '';
    formType.value = variable.type;
    formCategory.value = variable.category ?? '';
    formDefaultValue.value = String(variable.default_value);
    formError.value = null;
    isFormOpen.value = true;
    pendingDeleteKey.value = null;
    isPopulating = false;
};

const cancelForm = () => {
    isFormOpen.value = false;
    editingKey.value = null;
    formError.value = null;
};

const coerceDefaultValue = (): number | boolean | string => {
    if (formType.value === 'number') return Number(formDefaultValue.value) || 0;
    if (formType.value === 'boolean') return formDefaultValue.value === 'true';
    return formDefaultValue.value;
};

const submitForm = () => {
    formError.value = null;
    const key = formKey.value.trim();

    if (!key) {
        formError.value = 'Key is required.';
        return;
    }

    try {
        if (editingKey.value === null) {
            const newVariable: StoryVariable = {
                key,
                label: formLabel.value.trim() || undefined,
                type: formType.value,
                category: formCategory.value || undefined,
                default_value: coerceDefaultValue()
            };
            const updated = createVariable(props.variables, newVariable);
            emit('update:variables', updated);
        } else {
            const result = updateVariable(props.variables, props.scenes, editingKey.value, {
                key,
                label: formLabel.value.trim() || undefined,
                type: formType.value,
                category: formCategory.value || undefined,
                default_value: coerceDefaultValue()
            });
            emit('update:variables', result.variables);
            if (result.scenes !== props.scenes) {
                emit('update:scenes', result.scenes);
            }
        }
        isFormOpen.value = false;
        editingKey.value = null;
    } catch (err) {
        formError.value = err instanceof Error ? err.message : 'Something went wrong.';
    }
};

// ─── Delete flow ────────────────────────────────────────────────────────
const pendingDeleteKey = ref<string | null>(null);

const requestDelete = (key: string) => {
    pendingDeleteKey.value = pendingDeleteKey.value === key ? null : key;
    expandedUsageKey.value = usageCount(key) > 0 ? key : expandedUsageKey.value;
};

const confirmDelete = (key: string, force = false) => {
    const result = deleteVariable(props.variables, props.scenes, key, { force });
    if (result.success) {
        emit('update:variables', result.variables);
        pendingDeleteKey.value = null;
        if (expandedUsageKey.value === key) expandedUsageKey.value = null;
    }
};

// ─── Display helpers ────────────────────────────────────────────────────
const formatDefault = (variable: StoryVariable): string => {
    if (variable.type === 'boolean') return variable.default_value ? 'true' : 'false';
    return String(variable.default_value);
};

const handleClose = () => {
    isFormOpen.value = false;
    pendingDeleteKey.value = null;
    expandedUsageKey.value = null;
    emit('update:open', false);
};
</script>