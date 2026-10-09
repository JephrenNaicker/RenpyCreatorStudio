<template>
    <div id="project-edit-page"
        class="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 pt-10 pb-16 max-sm:px-3 max-sm:pt-6 max-sm:pb-12">

        <!-- Background atmosphere: polka dots + soft neon glows -->
        <!-- Staggered dots, fading in from the top-right corner -->
        <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(rgba(165,180,252,0.3)_1.5px,transparent_1.5px),radial-gradient(rgba(165,180,252,0.3)_1.5px,transparent_1.5px)] bg-[size:30px_30px] bg-[position:0_0,15px_15px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]"
            aria-hidden="true" />
        <!-- Second, violet-tinted dot cluster in the bottom-left -->
        <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(rgba(196,181,253,0.28)_2px,transparent_2px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_at_bottom_left,black,transparent_55%)]"
            aria-hidden="true" />
        <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[420px] rounded-full bg-sky-400/20 blur-3xl pointer-events-none"
            aria-hidden="true" />
        <div class="absolute top-40 -right-24 w-[380px] h-[380px] rounded-full bg-violet-500/25 blur-3xl pointer-events-none"
            aria-hidden="true" />
        <div class="absolute bottom-0 -left-24 w-[360px] h-[360px] rounded-full bg-fuchsia-500/15 blur-3xl pointer-events-none"
            aria-hidden="true" />

        <div id="edit-container" class="relative max-w-[680px] mx-auto flex flex-col gap-7">

            <!-- Header -->
            <div id="edit-header" class="flex items-start gap-4">
                <button id="back-to-project-btn" type="button"
                    class="group mt-1.5 flex items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-700 bg-slate-800/60 px-3.5 py-1.5 text-xs text-slate-400 transition-all hover:border-slate-400 hover:text-white"
                    @click="router.push(`/projects/${route.params.id}`)">
                    <span class="transition-transform group-hover:-translate-x-0.5">←</span>
                    Back to Project
                </button>
                <div id="header-text" class="flex-1">
                    <h1 id="edit-title"
                        class="mb-1 bg-gradient-to-r from-sky-200 via-violet-300 to-fuchsia-300 bg-clip-text text-[1.9rem] font-bold tracking-tight text-transparent max-sm:text-2xl">
                        Edit Project</h1>
                    <p id="project-subtitle" class="flex flex-wrap items-center gap-2 text-[0.9rem] text-slate-400">
                        {{ project.name || 'Loading…' }}
                        <span v-if="isDirty" id="unsaved-indicator"
                            class="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-xs text-amber-400">
                            Unsaved changes
                        </span>
                    </p>
                </div>
            </div>

            <!-- Form card -->
            <form id="edit-project-form" @submit.prevent="saveProject"
                class="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/50 shadow-2xl shadow-indigo-950/60 ring-1 ring-white/5 backdrop-blur">

                <!-- Accent line along the top edge of the card -->
                <div class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent"
                    aria-hidden="true" />

                <!-- 01 Identity -->
                <div id="identity-section" :class="formSection">
                    <div id="identity-label" class="flex items-center gap-3">
                        <span id="identity-number" :class="badgeSky">01</span>
                        <span id="identity-title" :class="sectionTitle">Identity</span>
                    </div>

                    <div id="name-group" :class="formGroup">
                        <label id="name-label" for="project-name-input" :class="labelClass">
                            Project Name <span id="name-required" class="text-sky-400">*</span>
                        </label>
                        <input id="project-name-input" v-model="project.name" :class="inputClass"
                            placeholder="e.g. Mystic Academy…" required maxlength="80" />
                        <span id="name-char-counter" class="-mt-0.5 text-right text-[0.72rem] transition-colors"
                            :class="project.name.length > 60 ? 'text-amber-400' : 'text-slate-400'">
                            {{ project.name.length }}/80
                        </span>
                    </div>
                </div>

                <div id="divider-1" :class="divider" />

                <!-- 02 Story -->
                <div id="story-section" :class="formSection">
                    <div id="story-label" class="flex items-center gap-3">
                        <span id="story-number" :class="badgeViolet">02</span>
                        <span id="story-title" :class="sectionTitle">Story</span>
                    </div>

                    <div id="plot-group" :class="formGroup">
                        <label id="plot-label" for="main-plot-textarea" :class="labelClass">Main Plot / Context</label>
                        <textarea id="main-plot-textarea" v-model="project.main_plot"
                            :class="[inputClass, 'resize-y min-h-[100px] leading-relaxed']" rows="4"
                            placeholder="Short overview of the story world, theme, or premise…" maxlength="500" />
                        <span id="plot-char-counter" class="-mt-0.5 text-right text-[0.72rem] transition-colors"
                            :class="project.main_plot.length > 400 ? 'text-amber-400' : 'text-slate-400'">
                            {{ project.main_plot.length }}/500
                        </span>
                    </div>

                    <div id="main-character-group" :class="formGroup">
                        <label id="main-character-label" :class="labelClass">
                            Main Character
                            <span id="optional-badge" class="font-normal text-slate-400">(optional)</span>
                        </label>

                        <!-- Trigger (outside-click detection uses #char-picker-trigger / #char-picker-popover) -->
                        <button id="char-picker-trigger" type="button"
                            class="flex w-full items-center gap-2.5 rounded-lg border bg-slate-900/60 px-3.5 py-2.5 text-left text-[0.9rem] text-slate-100 transition-all hover:border-slate-500"
                            :class="showCharPicker ? 'border-sky-400 ring-4 ring-sky-400/10' : 'border-slate-700'"
                            @click="showCharPicker = !showCharPicker">
                            <template v-if="selectedCharacter">
                                <span id="selected-char-dot"
                                    class="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white/20"
                                    :style="{ background: selectedCharacter.color, boxShadow: `0 0 8px ${selectedCharacter.color}88` }" />
                                <span id="selected-char-name" class="text-slate-100">{{ selectedCharacter.name
                                    }}</span>
                                <span v-if="selectedCharacter.nickname" id="selected-char-nickname"
                                    class="text-xs italic text-slate-400">
                                    "{{ selectedCharacter.nickname }}"
                                </span>
                            </template>
                            <span v-else id="no-char-selected" class="text-slate-400">None — decide later</span>
                            <span id="picker-toggle-icon" class="ml-auto text-xs text-slate-400">{{ showCharPicker ?
                                '▲' : '▼' }}</span>
                        </button>

                        <div v-if="showCharPicker" id="char-picker-popover"
                            class="mt-1 overflow-hidden rounded-xl border border-slate-600 bg-slate-800 shadow-xl shadow-black/40">
                            <input id="char-search-input" v-model="characterSearch"
                                class="w-full border-0 border-b border-slate-700 bg-slate-900 px-3 py-2.5 text-[0.85rem] text-slate-50 placeholder:text-slate-500 focus:outline-none"
                                placeholder="Search characters..." @click.stop />
                            <div id="char-picker-list" class="max-h-[180px] overflow-y-auto py-1">
                                <label id="char-option-none"
                                    :class="[pickerRow, project.main_character_id === '' ? 'bg-sky-400/10' : '']">
                                    <input id="char-radio-none" type="radio" v-model="project.main_character_id"
                                        value="" class="shrink-0 accent-sky-400" />
                                    <span id="char-name-none" class="flex-1 text-[0.85rem] text-slate-400">None</span>
                                </label>
                                <label v-for="char in filteredCharacters" :key="char.id" :id="`char-option-${char.id}`"
                                    :class="[pickerRow, project.main_character_id === char.id ? 'bg-sky-400/10' : '']">
                                    <input :id="`char-radio-${char.id}`" type="radio"
                                        v-model="project.main_character_id" :value="char.id"
                                        class="shrink-0 accent-sky-400" />
                                    <span :id="`char-dot-${char.id}`"
                                        class="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-white/20"
                                        :style="{ background: char.color }" />
                                    <span :id="`char-name-${char.id}`" class="flex-1 text-[0.85rem] text-slate-200">{{
                                        char.name }}</span>
                                    <span v-if="char.nickname" :id="`char-nickname-${char.id}`"
                                        class="text-xs italic text-slate-400">"{{
                                            char.nickname }}"</span>
                                </label>
                                <p v-if="filteredCharacters.length === 0" id="char-picker-empty"
                                    class="p-3 text-center text-[0.8rem] text-slate-400">
                                    No characters found
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="divider-2" :class="divider" />

                <!-- 03 Tags -->
                <div id="tags-section" :class="formSection">
                    <div id="tags-label" class="flex items-center gap-3">
                        <span id="tags-number" :class="badgeFuchsia">03</span>
                        <span id="tags-title" :class="sectionTitle">Tags</span>
                        <span id="tags-count"
                            class="ml-auto rounded-full border px-2.5 py-0.5 text-xs tabular-nums transition-colors"
                            :class="project.tags.length >= 5
                                ? 'border-amber-400/30 bg-amber-400/10 text-amber-400'
                                : 'border-slate-600 bg-slate-900/60 text-slate-300'">{{ project.tags.length
                                }}/5</span>
                    </div>

                    <div id="tags-group" :class="formGroup">
                        <div id="tag-input-row" class="flex gap-2">
                            <input id="tag-input" v-model="tagInput" :class="[inputClass, 'flex-1']"
                                placeholder="fantasy, romance, sci-fi…" :disabled="project.tags.length >= 5"
                                @keydown.enter.prevent="addTag" />
                            <button id="add-tag-btn" type="button"
                                class="shrink-0 whitespace-nowrap rounded-lg border border-slate-600 bg-slate-800 px-5 text-[0.85rem] font-medium text-slate-300 transition-all enabled:hover:border-sky-400 enabled:hover:text-sky-400 disabled:cursor-not-allowed disabled:opacity-30"
                                @click="addTag" :disabled="project.tags.length >= 5 || !tagInput.trim()">
                                Add
                            </button>
                        </div>

                        <Transition enter-active-class="transition-opacity duration-200"
                            leave-active-class="transition-opacity duration-200" enter-from-class="opacity-0"
                            leave-to-class="opacity-0">
                            <div v-if="project.tags.length > 0" id="tags-container" class="mt-1 flex flex-wrap gap-2">
                                <TransitionGroup enter-active-class="transition-all duration-200 ease-out"
                                    leave-active-class="transition-all duration-150 ease-in"
                                    enter-from-class="opacity-0 scale-75" leave-to-class="opacity-0 scale-75">
                                    <span v-for="(tag, index) in project.tags" :key="tag" :id="`tag-chip-${index}`"
                                        :class="['inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-2 text-xs font-medium', tagTints[index % tagTints.length]]">
                                        # {{ tag }}
                                        <button :id="`remove-tag-${index}`" type="button"
                                            class="flex h-4 w-4 items-center justify-center rounded-full text-[0.6rem] leading-none opacity-60 transition-all hover:bg-white/15 hover:opacity-100"
                                            @click="removeTag(index)" title="Remove tag">
                                            ✕
                                        </button>
                                    </span>
                                </TransitionGroup>
                            </div>
                        </Transition>

                        <p v-if="project.tags.length === 0" id="tags-hint" class="mt-0.5 text-[0.78rem] text-slate-400">
                            Add up to 5 genre tags to help organise your projects
                        </p>
                    </div>
                </div>

                <!-- Error message -->
                <div v-if="error" id="form-error" class="px-8 pb-5 max-sm:px-5">
                    <p role="alert"
                        class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-[0.85rem] text-red-400">
                        {{ error }}
                    </p>
                </div>

                <!-- Actions -->
                <div id="form-actions"
                    class="flex items-center justify-end gap-3 border-t border-slate-700 bg-slate-900/40 px-8 pt-5 pb-7 max-sm:px-5 max-sm:pt-4 max-sm:pb-5">
                    <button id="cancel-edit-btn" type="button"
                        class="rounded-lg border border-slate-700 px-5 py-2.5 text-sm text-slate-400 transition-all hover:border-slate-400 hover:text-slate-200"
                        @click="router.push(`/projects/${route.params.id}`)">
                        Cancel
                    </button>
                    <button id="save-project-btn" type="submit"
                        class="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 px-6 py-2.5 text-sm font-semibold tracking-[0.01em] text-slate-900 shadow-lg shadow-violet-500/25 transition-all enabled:hover:-translate-y-px enabled:hover:shadow-fuchsia-400/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                        :disabled="!project.name.trim()">
                        <span id="submit-icon" class="text-[0.7rem] opacity-80">✦</span>
                        Save Changes
                    </button>
                </div>

            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Character } from '@/utils/dummyData';
import { getProject, updateProject } from '@/services/projectService';
import { getCharacters } from '@/services/characterService';

const route = useRoute();
const router = useRouter();

// --- Shared Tailwind class strings (full literals so Tailwind's scanner picks them up) ---
const formSection = 'flex flex-col gap-5 px-8 py-7 max-sm:px-5 max-sm:py-5';
const formGroup = 'flex flex-col gap-1.5';
const divider = 'h-px bg-gradient-to-r from-transparent via-slate-600/60 to-transparent';
const sectionTitle = 'text-xs font-semibold uppercase tracking-[0.08em] text-slate-300';
const labelClass = 'text-sm font-medium text-slate-300';
const inputClass =
    'w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3.5 py-2.5 text-[0.9rem] text-slate-100 ' +
    'placeholder:text-slate-500 transition-all hover:border-slate-500 ' +
    'focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/10 ' +
    'disabled:cursor-not-allowed disabled:opacity-40';
const pickerRow = 'flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-white/5';
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

// State
const showCharPicker = ref(false);
const characterSearch = ref('');
const tagInput = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);
const isDirty = ref(false);

// Project data
const project = ref({
    name: '',
    main_plot: '',
    main_character_id: '',
    tags: [] as string[]
});

// Original project data for change detection
const originalProject = ref({
    name: '',
    main_plot: '',
    main_character_id: '',
    tags: [] as string[]
});

// Available characters
const characters = ref<Character[]>([]);

// Load characters
const loadCharacters = async () => {
    try {
        characters.value = await getCharacters();
    } catch (err) {
        console.error('Failed to load characters:', err);
        error.value = 'Failed to load characters';
    }
};

// Load project data
const loadProject = async () => {
    isLoading.value = true;
    error.value = null;

    try {
        const found = await getProject(route.params.id as string);

        if (found) {
            project.value = {
                name: found.name,
                main_plot: found.main_plot,
                main_character_id: found.main_character_id ?? '',
                tags: [...found.tags]
            };
            originalProject.value = {
                name: found.name,
                main_plot: found.main_plot,
                main_character_id: found.main_character_id ?? '',
                tags: [...found.tags]
            };
        } else {
            error.value = 'Project not found';
        }
    } catch (err) {
        console.error('Failed to load project:', err);
        error.value = 'Failed to load project';
    } finally {
        isLoading.value = false;
    }
};

// Check if form has unsaved changes
const hasUnsavedChanges = computed(() => {
    return JSON.stringify(project.value) !== JSON.stringify(originalProject.value);
});

// Watch for unsaved changes
watch(project, () => {
    isDirty.value = hasUnsavedChanges.value;
}, { deep: true });

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

// Add tag
const addTag = () => {
    const trimmed = tagInput.value.trim().toLowerCase();
    if (!trimmed || project.value.tags.length >= 5) return;
    if (project.value.tags.includes(trimmed)) return;
    project.value.tags.push(trimmed);
    tagInput.value = '';
};

// Remove tag
const removeTag = (index: number) => {
    project.value.tags.splice(index, 1);
};

// Close picker when clicking outside
const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (showCharPicker.value &&
        !target.closest('#char-picker-popover') &&
        !target.closest('#char-picker-trigger')) {
        showCharPicker.value = false;
    }
};

// Save project
const saveProject = async () => {
    if (!project.value.name.trim()) return;

    isLoading.value = true;
    error.value = null;

    try {
        const id = route.params.id as string;
        const updated = await updateProject(id, {
            name: project.value.name,
            main_plot: project.value.main_plot,
            main_character_id: project.value.main_character_id || undefined,
            tags: [...project.value.tags]
        });

        if (!updated) {
            error.value = 'Project not found';
            return;
        }

        console.log('Saved project:', updated);

        // Navigate back to project detail
        router.push(`/projects/${route.params.id}`);
    } catch (err) {
        console.error('Failed to save project:', err);
        error.value = 'Failed to save project. Please try again.';
    } finally {
        isLoading.value = false;
    }
};

// Warn before leaving with unsaved changes
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (isDirty.value) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
    }
};

// Reset form (for testing)
const resetForm = () => {
    loadProject();
    tagInput.value = '';
    characterSearch.value = '';
    showCharPicker.value = false;
    isDirty.value = false;
    error.value = null;
};

// Lifecycle
onMounted(() => {
    loadCharacters();
    loadProject();
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('click', handleClickOutside);
});

// Watch for route changes to reload data
watch(() => route.params.id, () => {
    loadProject();
});

// Expose for testing in development
if (import.meta.env.DEV) {
    // @ts-ignore
    window.__PROJECT_EDIT_VIEW__ = {
        resetForm,
        hasUnsavedChanges: () => hasUnsavedChanges.value,
        getProjectData: () => project.value,
        getOriginalData: () => originalProject.value
    };
}
</script>