<!-- frontend/src/components/scene/VariableManager.vue -->
<template>
    <div v-if="open" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" id="variable-manager-modal"
        @click.self="handleClose">
        <div class="bg-gray-800 rounded-xl max-w-3xl w-full mx-4 shadow-2xl max-h-[85vh] flex flex-col"
            id="variable-manager-container">

            <!-- Header -->
            <div class="p-6 border-b border-gray-700 flex items-center justify-between flex-shrink-0"
                id="variable-manager-header">
                <div class="flex items-center gap-3">
                    <span class="text-3xl">🧮</span>
                    <div>
                        <h3 class="text-xl font-semibold text-white">Story Variables</h3>
                        <p class="text-sm text-gray-400">
                            {{ variables.length }} variable{{ variables.length !== 1 ? 's' : '' }} defined for this
                            project
                        </p>
                    </div>
                </div>
                <button @click="handleClose" class="text-gray-400 hover:text-white text-xl leading-none"
                    id="variable-manager-close-btn" title="Close">✕</button>
            </div>

            <!-- Body -->
            <div class="p-6 overflow-y-auto scrollbar-thin flex-1" id="variable-manager-body">

                <div v-if="formError"
                    class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3 mb-4"
                    id="variable-form-error">
                    ⚠️ {{ formError }}
                </div>

                <!-- Create / Edit form -->
                <div v-if="isFormOpen" class="panel mb-6" id="variable-form-panel">
                    <div class="panel-header">
                        <span class="panel-title">{{ editingKey ? `Edit "${editingKey}"` : 'New Variable' }}</span>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="input-label" for="variable-key-input">
                                Key <span class="text-gray-500">(snake_case, used in effects &amp; conditions)</span>
                            </label>
                            <input v-model="formKey" type="text" class="input font-mono" id="variable-key-input"
                                placeholder="e.g. reputation" />
                        </div>
                        <div class="form-group">
                            <label class="input-label" for="variable-label-input">Label <span
                                    class="text-gray-500">(optional)</span></label>
                            <input v-model="formLabel" type="text" class="input" id="variable-label-input"
                                placeholder="e.g. Street Reputation" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="input-label" for="variable-type-select">Type</label>
                            <select v-model="formType" class="select" id="variable-type-select">
                                <option value="number">Number</option>
                                <option value="boolean">Boolean</option>
                                <option value="string">String</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="input-label" for="variable-category-select">Category <span
                                    class="text-gray-500">(optional)</span></label>
                            <select v-model="formCategory" class="select" id="variable-category-select">
                                <option value="">None</option>
                                <option value="affinity">Affinity</option>
                                <option value="flag">Flag</option>
                                <option value="resource">Resource</option>
                                <option value="karma">Karma</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="input-label" for="variable-default-input">Default Value</label>
                        <select v-if="formType === 'boolean'" v-model="formDefaultValue" class="select"
                            id="variable-default-input">
                            <option value="false">false</option>
                            <option value="true">true</option>
                        </select>
                        <input v-else :type="formType === 'number' ? 'number' : 'text'" v-model="formDefaultValue"
                            class="input" id="variable-default-input"
                            :placeholder="formType === 'number' ? '0' : 'default text'" />
                    </div>

                    <div v-if="editingKey && renameImpactCount > 0" class="text-xs text-amber-400 mb-3"
                        id="rename-impact-note">
                        ℹ️ Changing the key will update {{ renameImpactCount }} reference{{ renameImpactCount !== 1 ?
                            's' : '' }} across scenes automatically.
                    </div>

                    <div class="flex gap-3 mt-2">
                        <button @click="submitForm" class="btn-primary" id="variable-form-submit-btn">
                            {{ editingKey ? '✓ Save Changes' : '+ Create Variable' }}
                        </button>
                        <button @click="cancelForm" class="btn-secondary" id="variable-form-cancel-btn">Cancel</button>
                    </div>
                </div>

                <button v-else @click="openCreateForm" class="btn-primary mb-6" id="open-create-variable-btn">
                    + New Variable
                </button>

                <!-- Empty state -->
                <div v-if="variables.length === 0" class="empty-state" id="variables-empty-state">
                    <div class="empty-icon">🧮</div>
                    <p class="text-gray-400">No variables yet. Create one to start tracking points, flags, or
                        resources.</p>
                </div>

                <!-- Variable list -->
                <div v-else class="flex flex-col gap-3" id="variables-list">
                    <div v-for="variable in variables" :key="variable.key" class="panel"
                        :id="`variable-row-${variable.key}`">
                        <div class="flex items-start justify-between gap-3 flex-wrap">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-mono text-sky-400 font-semibold">{{ variable.key }}</span>
                                    <span v-if="variable.label" class="text-gray-400 text-sm">{{ variable.label
                                    }}</span>
                                    <span class="badge bg-gray-700 text-gray-300">{{ variable.type }}</span>
                                    <span v-if="variable.category" class="badge bg-sky-900/30 text-sky-400">{{
                                        variable.category }}</span>
                                </div>
                                <div class="text-sm text-gray-500 mt-1">
                                    Default: <span class="text-gray-300">{{ formatDefault(variable) }}</span>
                                </div>
                            </div>

                            <div class="flex items-center gap-2 flex-shrink-0">
                                <button @click="toggleUsage(variable.key)"
                                    class="badge cursor-pointer transition-colors"
                                    :class="usageCount(variable.key) > 0 ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-gray-700 text-gray-500'"
                                    :id="`usage-toggle-${variable.key}`">
                                    {{ usageCount(variable.key) }} use{{ usageCount(variable.key) !== 1 ? 's' : '' }}
                                    <span v-if="usageCount(variable.key) > 0">{{ expandedUsageKey === variable.key ? '▲'
                                        : '▼' }}</span>
                                </button>
                                <button @click="openEditForm(variable)" class="icon-btn"
                                    :id="`edit-variable-${variable.key}`" title="Edit">✏️</button>
                                <button @click="requestDelete(variable.key)" class="icon-btn danger"
                                    :id="`delete-variable-${variable.key}`" title="Delete">🗑️</button>
                            </div>
                        </div>

                        <!-- Usage breakdown -->
                        <div v-if="expandedUsageKey === variable.key" class="mt-3 pt-3 border-t border-gray-700"
                            :id="`usage-panel-${variable.key}`">
                            <div v-if="usageFor(variable.key).length === 0" class="text-sm text-gray-500 italic">
                                Not referenced anywhere yet.
                            </div>
                            <div v-else class="flex flex-col gap-2">
                                <div v-for="(entry, i) in usageFor(variable.key)" :key="i"
                                    class="text-sm bg-gray-900/50 rounded-lg p-2 flex items-center gap-2 flex-wrap">
                                    <span class="badge"
                                        :class="entry.role === 'write' ? 'bg-sky-900/30 text-sky-400' : 'bg-amber-900/30 text-amber-400'">
                                        {{ entry.role === 'write' ? '✎ write' : '👁 read' }}
                                    </span>
                                    <span class="text-gray-300">{{ entry.sceneName }}</span>
                                    <span class="text-gray-600">→</span>
                                    <span v-if="entry.menuPrompt" class="text-gray-400 italic">"{{ entry.menuPrompt
                                    }}"</span>
                                    <span class="text-gray-600">→</span>
                                    <span class="text-gray-300">{{ entry.choiceText }}</span>
                                    <span class="text-gray-500 font-mono ml-auto">{{ entry.detail }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Delete confirmation / blocked warning -->
                        <div v-if="pendingDeleteKey === variable.key" class="mt-3 pt-3 border-t border-gray-700"
                            :id="`delete-confirm-${variable.key}`">
                            <div v-if="usageCount(variable.key) === 0" class="text-sm text-gray-300 mb-2">
                                Delete <span class="font-mono text-sky-400">{{ variable.key }}</span>? This cannot be
                                undone.
                            </div>
                            <div v-else class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-2">
                                <p class="text-amber-400 text-sm font-medium mb-1">
                                    ⚠️ Still referenced in {{ usageCount(variable.key) }} place{{
                                        usageCount(variable.key)
                                            !== 1 ? 's' : '' }}
                                </p>
                                <p class="text-gray-400 text-xs">
                                    Deleting now will leave those effects/conditions pointing at a variable that no
                                    longer exists.
                                </p>
                            </div>
                            <div class="flex gap-2">
                                <button v-if="usageCount(variable.key) === 0" @click="confirmDelete(variable.key)"
                                    class="btn-danger btn-small" :id="`confirm-delete-${variable.key}`">
                                    Delete
                                </button>
                                <button v-else @click="confirmDelete(variable.key, true)" class="btn-danger btn-small"
                                    :id="`force-delete-${variable.key}`">
                                    Delete Anyway
                                </button>
                                <button @click="pendingDeleteKey = null" class="btn-secondary btn-small"
                                    :id="`cancel-delete-${variable.key}`">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="p-6 border-t border-gray-700 flex justify-end flex-shrink-0" id="variable-manager-footer">
                <button @click="handleClose" class="btn-secondary" id="variable-manager-done-btn">Close</button>
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
    // if blocked, the panel stays open showing the usage list — no-op here
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

<style scoped>
.icon-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.35rem;
    font-size: 0.9rem;
    border-radius: 4px;
    transition: all 0.2s;
}

.icon-btn:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.1);
}

.icon-btn.danger:hover {
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
}
</style>