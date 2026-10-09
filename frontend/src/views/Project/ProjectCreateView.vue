<template>
    <div class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 pt-10 pb-16 max-sm:px-3 max-sm:pt-6 max-sm:pb-12"
        id="project-create-page">

        <!-- Background atmosphere: faded grid + two soft glows -->
        <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(rgba(165,180,252,0.28)_1.5px,transparent_1.5px)] bg-[size:26px_26px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_80%)]"
            aria-hidden="true" id="bg-grid" />
        <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[420px] rounded-full bg-sky-400/20 blur-3xl pointer-events-none"
            aria-hidden="true" />
        <div class="absolute top-40 -right-24 w-[380px] h-[380px] rounded-full bg-violet-500/25 blur-3xl pointer-events-none"
            aria-hidden="true" />
        <div class="absolute bottom-0 -left-24 w-[360px] h-[360px] rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none"
            aria-hidden="true" />

        <div class="relative max-w-[680px] mx-auto flex flex-col gap-7" id="create-container">

            <!-- Header -->
            <div class="flex items-start gap-4" id="create-header">
                <button type="button"
                    class="group mt-1.5 flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-700 bg-slate-900/60 px-3.5 py-1.5 text-xs text-slate-400 transition-all hover:border-slate-400 hover:text-white"
                    @click="router.back()" id="back-button">
                    <span class="transition-transform group-hover:-translate-x-0.5">←</span>
                    Back
                </button>
                <div class="flex-1" id="header-text">
                    <h1 class="mb-1 bg-gradient-to-r from-sky-200 via-violet-300 to-fuchsia-300 bg-clip-text text-[1.9rem] font-bold tracking-tight text-transparent max-sm:text-2xl"
                        id="create-title">New Project</h1>
                    <p class="text-[0.9rem] text-slate-400" id="create-subtitle">Set the stage for your visual novel
                    </p>
                </div>
            </div>

            <!-- Form card -->
            <form @submit.prevent="createProject"
                class="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50 shadow-2xl shadow-indigo-950/60 ring-1 ring-white/5 backdrop-blur"
                id="create-project-form">

                <!-- Accent line along the top edge of the card -->
                <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent"
                    aria-hidden="true" />

                <!-- Step 1: Identity -->
                <div :class="formSection" id="form-section-identity">
                    <div class="flex items-center gap-3" id="section-label-identity">
                        <span :class="badgeSky" id="section-number-identity">01</span>
                        <span :class="sectionTitle" id="section-title-identity">Identity</span>
                    </div>

                    <div :class="formGroup" id="form-group-name">
                        <label :class="labelClass" for="project-name-input" id="name-label">
                            Project Name <span class="text-sky-400" id="required-star">*</span>
                        </label>
                        <input v-model="project.name" :class="inputClass"
                            placeholder="e.g. Mystic Academy, Crimson Horizons…" required maxlength="80"
                            id="project-name-input" />
                        <span class="-mt-0.5 text-right text-[0.72rem] transition-colors"
                            :class="project.name.length > 60 ? 'text-amber-400' : 'text-slate-400'"
                            id="name-char-counter">
                            {{ project.name.length }}/80
                        </span>
                    </div>
                </div>

                <!-- Divider -->
                <div :class="divider" id="divider-1" />

                <!-- Step 2: Story -->
                <div :class="formSection" id="form-section-story">
                    <div class="flex items-center gap-3" id="section-label-story">
                        <span :class="badgeViolet" id="section-number-story">02</span>
                        <span :class="sectionTitle" id="section-title-story">Story</span>
                    </div>

                    <div :class="formGroup" id="form-group-plot">
                        <label :class="labelClass" for="main-plot-textarea" id="plot-label">Main Plot / Context</label>
                        <textarea v-model="project.main_plot"
                            :class="[inputClass, 'resize-y min-h-[100px] leading-relaxed']" rows="4"
                            placeholder="Short overview of the story world, theme, or premise…" maxlength="500"
                            id="main-plot-textarea" />
                        <span class="-mt-0.5 text-right text-[0.72rem] transition-colors"
                            :class="project.main_plot.length > 400 ? 'text-amber-400' : 'text-slate-400'"
                            id="plot-char-counter">
                            {{ project.main_plot.length }}/500
                        </span>
                    </div>

                    <div :class="formGroup" id="form-group-main-character">
                        <label :class="labelClass" id="main-character-label">
                            Main Character
                            <span class="font-normal text-slate-400" id="optional-badge">(optional)</span>
                        </label>

                        <!-- Trigger button (.char-picker-trigger is a marker class used by handleClickOutside) -->
                        <button type="button"
                            class="char-picker-trigger flex w-full items-center gap-2.5 rounded-lg border bg-slate-900/60 px-3.5 py-2.5 text-left text-[0.9rem] text-slate-100 transition-all hover:border-slate-500"
                            :class="showCharPicker ? 'border-sky-400 ring-4 ring-sky-400/10' : 'border-slate-700'"
                            @click="showCharPicker = !showCharPicker" id="char-picker-trigger">
                            <template v-if="selectedCharacter">
                                <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white/20"
                                    :style="{ background: selectedCharacter.color, boxShadow: `0 0 8px ${selectedCharacter.color}88` }"
                                    id="selected-character-dot" />
                                <span class="text-slate-100" id="selected-character-name">{{
                                    selectedCharacter.name }}</span>
                                <span v-if="selectedCharacter.nickname" class="text-xs italic text-slate-400"
                                    id="selected-character-nickname">"{{ selectedCharacter.nickname }}"</span>
                            </template>
                            <span v-else class="text-slate-400" id="no-character-selected">None — decide
                                later</span>
                            <span class="ml-auto text-xs text-slate-400" id="picker-toggle-icon">{{
                                showCharPicker ? '▲' : '▼' }}</span>
                        </button>

                        <!-- Picker popover (.char-picker is a marker class used by handleClickOutside) -->
                        <div v-if="showCharPicker"
                            class="char-picker mt-1 overflow-hidden rounded-xl border border-slate-600 bg-slate-800 shadow-xl shadow-black/40"
                            id="char-picker-popover">
                            <input v-model="characterSearch"
                                class="w-full border-0 border-b border-slate-700 bg-slate-900 px-3 py-2.5 text-[0.85rem] text-slate-50 placeholder:text-slate-500 focus:outline-none"
                                placeholder="Search characters..." @click.stop id="char-search-input" />
                            <div class="max-h-[180px] overflow-y-auto py-1" id="char-picker-list">
                                <!-- None option -->
                                <label :class="[pickerRow, project.main_character_id === '' ? 'bg-sky-400/10' : '']"
                                    id="char-option-none">
                                    <input type="radio" v-model="project.main_character_id" value=""
                                        class="shrink-0 accent-sky-400" id="char-radio-none" />
                                    <span class="flex-1 text-[0.85rem] text-slate-400" id="char-name-none">None</span>
                                </label>
                                <label v-for="char in filteredCharacters" :key="char.id"
                                    :class="[pickerRow, project.main_character_id === char.id ? 'bg-sky-400/10' : '']"
                                    :id="`char-option-${char.id}`" :data-character-id="char.id">
                                    <input type="radio" v-model="project.main_character_id" :value="char.id"
                                        class="shrink-0 accent-sky-400" :id="`char-radio-${char.id}`" />
                                    <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white/20"
                                        :style="{ background: char.color }" :id="`char-dot-${char.id}`" />
                                    <span class="flex-1 text-[0.85rem] text-slate-200" :id="`char-name-${char.id}`">{{
                                        char.name }}</span>
                                    <span v-if="char.nickname" class="text-xs italic text-slate-400"
                                        :id="`char-nickname-${char.id}`">"{{
                                            char.nickname }}"</span>
                                </label>
                                <p v-if="filteredCharacters.length === 0"
                                    class="p-3 text-center text-[0.8rem] text-slate-400" id="char-picker-empty">No
                                    characters found</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Divider -->
                <div :class="divider" id="divider-2" />

                <!-- Step 3: Tags -->
                <div :class="formSection" id="form-section-tags">
                    <div class="flex items-center gap-3" id="section-label-tags">
                        <span :class="badgeFuchsia" id="section-number-tags">03</span>
                        <span :class="sectionTitle" id="section-title-tags">Tags</span>
                        <span class="ml-auto rounded-full border px-2.5 py-0.5 text-xs tabular-nums transition-colors"
                            :class="project.tags.length >= 5
                                ? 'border-amber-400/30 bg-amber-400/10 text-amber-400'
                                : 'border-slate-600 bg-slate-900/60 text-slate-300'" id="tag-count">{{
                                    project.tags.length }}/5</span>
                    </div>

                    <div :class="formGroup" id="form-group-tags">
                        <div class="flex gap-2" id="tag-input-row">
                            <input v-model="tagInput" :class="[inputClass, 'flex-1']"
                                placeholder="fantasy, romance, sci-fi…" :disabled="project.tags.length >= 5"
                                @keydown.enter.prevent="addTag" id="tag-input" />
                            <button type="button"
                                class="shrink-0 whitespace-nowrap rounded-lg border border-slate-600 bg-slate-800 px-5 text-[0.85rem] font-medium text-slate-300 transition-all enabled:hover:border-sky-400 enabled:hover:text-sky-400 disabled:cursor-not-allowed disabled:opacity-30"
                                @click="addTag" :disabled="project.tags.length >= 5 || !tagInput.trim()"
                                id="add-tag-button">
                                Add
                            </button>
                        </div>

                        <!-- Tag chips -->
                        <Transition enter-active-class="transition-opacity duration-200"
                            leave-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
                            leave-to-class="opacity-0">
                            <div v-if="project.tags.length > 0" class="mt-1 flex flex-wrap gap-2" id="tags-container">
                                <TransitionGroup enter-active-class="transition-all duration-200 ease-out"
                                    leave-active-class="transition-all duration-150 ease-in"
                                    enter-from-class="opacity-0 scale-75" leave-to-class="opacity-0 scale-75">
                                    <span v-for="(tag, index) in project.tags" :key="tag"
                                        :class="['inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-2 text-xs font-medium', tagTints[index % tagTints.length]]"
                                        :id="`tag-chip-${index}`" :data-tag-value="tag">
                                        # {{ tag }}
                                        <button type="button"
                                            class="flex h-4 w-4 items-center justify-center rounded-full text-[0.6rem] leading-none opacity-60 transition-all hover:bg-white/15 hover:opacity-100"
                                            @click="removeTag(index)" title="Remove tag" :id="`remove-tag-${index}`">
                                            ✕
                                        </button>
                                    </span>
                                </TransitionGroup>
                            </div>
                        </Transition>

                        <p v-if="project.tags.length === 0" class="mt-0.5 text-[0.78rem] text-slate-400" id="tags-hint">
                            Add up to 5 genre tags to help organise your projects
                        </p>
                    </div>
                </div>

                <!-- Error message -->
                <div v-if="error" class="px-8 pb-5 max-sm:px-5" id="form-error">
                    <p class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[0.85rem] text-red-400"
                        role="alert">
                        {{ error }}
                    </p>
                </div>

                <!-- Actions -->
                <div class="flex items-center justify-end gap-3 border-t border-slate-700 bg-slate-900/40 px-8 pt-5 pb-7 max-sm:px-5 max-sm:pt-4 max-sm:pb-5"
                    id="form-actions">
                    <button type="button"
                        class="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-400 transition-all hover:border-slate-400 hover:text-slate-200"
                        @click="router.back()" id="cancel-button">
                        Cancel
                    </button>
                    <button type="submit"
                        class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 px-6 py-2.5 text-sm font-semibold tracking-[0.01em] text-slate-900 shadow-lg shadow-violet-500/25 transition-all enabled:hover:-translate-y-px enabled:hover:shadow-fuchsia-400/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                        :disabled="!project.name.trim() || isLoading" id="submit-button">
                        <span v-if="isLoading"
                            class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950"
                            aria-hidden="true" />
                        <span v-else class="text-[0.7rem] opacity-80" id="submit-icon">✦</span>
                        {{ isLoading ? 'Creating…' : 'Create Project' }}
                    </button>
                </div>

            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { Character } from '@/utils/dummyData';
import { getCharacters } from '@/services/characterService';
import { createProject as createProjectService } from '@/services/projectService';

const router = useRouter();

// --- Shared Tailwind class strings (full literals so Tailwind's scanner picks them up) ---
// Local names on purpose: the global `.input`, `.input-label`, `.form-group` etc. in tailwind.css have different styling.
const formSection = 'flex flex-col gap-5 px-8 py-7 max-sm:px-5 max-sm:py-5';
const formGroup = 'flex flex-col gap-1.5';
const divider = 'h-px bg-gradient-to-r from-transparent via-slate-600/60 to-transparent';
const badgeBase =
    'flex h-7 w-7 items-center justify-center rounded-full border text-[0.7rem] font-bold tabular-nums tracking-wider';
const badgeSky = `${badgeBase} border-sky-400/40 bg-sky-400/15 text-sky-300`;
const badgeViolet = `${badgeBase} border-violet-400/40 bg-violet-400/15 text-violet-300`;
const badgeFuchsia = `${badgeBase} border-fuchsia-400/40 bg-fuchsia-400/15 text-fuchsia-300`;

// Tag chips cycle through three soft neon tints
const tagTints = [
    'border-sky-400/30 bg-sky-400/10 text-sky-200',
    'border-violet-400/30 bg-violet-400/10 text-violet-200',
    'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200',
];
const sectionTitle = 'text-xs font-semibold uppercase tracking-[0.08em] text-slate-300';
const labelClass = 'text-sm font-medium text-slate-300';
const inputClass =
    'w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-[0.9rem] text-slate-100 ' +
    'placeholder:text-slate-500 transition-all hover:border-slate-500 ' +
    'focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 ' +
    'disabled:cursor-not-allowed disabled:opacity-40';
const pickerRow = 'flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-white/5';

// Reactive state
const showCharPicker = ref(false);
const characterSearch = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);
const formTouched = ref(false);

// Project data
const project = ref({
    name: '',
    main_plot: '',
    main_character_id: '',
    tags: [] as string[]
});

const tagInput = ref('');

// Load characters (could be from API)
const characters = ref<Character[]>([]);

const loadCharacters = async () => {
    try {
        characters.value = await getCharacters();
    } catch (err) {
        console.error('Failed to load characters:', err);
        error.value = 'Failed to load characters';
    }
};

// Filtered characters for picker
const filteredCharacters = computed(() => {
    const q = characterSearch.value.toLowerCase();
    return q
        ? characters.value.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.nickname?.toLowerCase().includes(q)
        )
        : characters.value;
});

// Selected character object
const selectedCharacter = computed(() =>
    characters.value.find(c => c.id === project.value.main_character_id)
);

// Form validation
const isFormValid = computed(() => {
    return project.value.name.trim().length > 0;
});

// Auto-save draft to localStorage (for testing)
const saveDraft = () => {
    const draft = {
        name: project.value.name,
        main_plot: project.value.main_plot,
        main_character_id: project.value.main_character_id,
        tags: [...project.value.tags],
        timestamp: Date.now()
    };
    localStorage.setItem('project_draft', JSON.stringify(draft));
};

// Load draft from localStorage
const loadDraft = () => {
    const saved = localStorage.getItem('project_draft');
    if (saved) {
        try {
            const draft = JSON.parse(saved);
            // Only load if less than 24 hours old
            if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
                project.value.name = draft.name || '';
                project.value.main_plot = draft.main_plot || '';
                project.value.main_character_id = draft.main_character_id || '';
                project.value.tags = draft.tags || [];
            }
        } catch (err) {
            console.error('Failed to load draft:', err);
        }
    }
};

// Clear draft
const clearDraft = () => {
    localStorage.removeItem('project_draft');
};

// Watch for changes to auto-save draft (debounced)
let saveTimeout: number;
watch(project, () => {
    if (formTouched.value) {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveDraft();
        }, 500);
    }
}, { deep: true });

// Mark form as touched on first input
const markTouched = () => {
    if (!formTouched.value) {
        formTouched.value = true;
    }
};

// Add tag
const addTag = () => {
    markTouched();
    const trimmed = tagInput.value.trim().toLowerCase();
    if (!trimmed || project.value.tags.length >= 5) return;
    if (project.value.tags.includes(trimmed)) return; // no dupes
    project.value.tags.push(trimmed);
    tagInput.value = '';
};

// Remove tag
const removeTag = (index: number) => {
    markTouched();
    project.value.tags.splice(index, 1);
};

// Create project
const createProject = async () => {
    if (!isFormValid.value) {
        error.value = 'Project name is required';
        return;
    }

    isLoading.value = true;
    error.value = null;

    try {
        const newProject = await createProjectService({
            name: project.value.name,
            main_plot: project.value.main_plot,
            main_character_id: project.value.main_character_id || undefined,
            tags: [...project.value.tags]
        });

        console.log('Created project:', newProject);

        // Clear draft on success
        clearDraft();

        // Redirect to projects list
        router.push('/projects');
    } catch (err) {
        console.error('Failed to create project:', err);
        error.value = 'Failed to create project. Please try again.';
    } finally {
        isLoading.value = false;
    }
};

// Reset form (for testing)
const resetForm = () => {
    project.value = {
        name: '',
        main_plot: '',
        main_character_id: '',
        tags: []
    };
    tagInput.value = '';
    characterSearch.value = '';
    showCharPicker.value = false;
    formTouched.value = false;
    error.value = null;
    clearDraft();
};

// Close picker when clicking outside (for better UX)
// Relies on the .char-picker / .char-picker-trigger marker classes in the template.
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (showCharPicker.value && !target.closest('.char-picker') && !target.closest('.char-picker-trigger')) {
        showCharPicker.value = false;
    }
};

// Lifecycle
onMounted(() => {
    loadCharacters();
    loadDraft();
    document.addEventListener('click', handleClickOutside);
});

// Cleanup
import { onUnmounted } from 'vue';
onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    clearTimeout(saveTimeout);
});

// Expose methods for testing in development
if (import.meta.env.DEV) {
    // @ts-ignore - Expose for testing purposes
    window.__PROJECT_CREATE_VIEW__ = {
        resetForm,
        loadDraft,
        saveDraft,
        clearDraft,
        getProjectData: () => project.value,
        isFormValid: () => isFormValid.value
    };
}
</script>