<!-- frontend/src/components/character/CharacterSetupView.vue -->
<!--
    Setup & Exports — project-wide Ren'Py configuration.

    Owns everything that is true for the WHOLE project (character tags, variable
    defaults, folder conventions, default export behaviour) and persists it on
    Project.export_settings / Project.variables. It never builds .rpy text itself:
    the preview below is renpyExportService.exportSharedFiles(), i.e. exactly what
    ExportModal produces. ExportModal keeps only per-run choices (which scenes,
    script.rpy, skip up-to-date) and starts from the defaults saved here.

    Controlled component: the scene editor owns the project and persists it. This view
    only edits local drafts and emits `save`, so ExportModal and the sidebar badges see
    the new settings the moment the parent updates currentProject.
-->
<template>
    <div class="max-w-[1200px] mx-auto p-6" id="setup-exports">
        <div v-if="!project" :class="card" id="setup-loading">
            <p class="text-slate-400 m-0">Loading project setup…</p>
        </div>

        <template v-else>
            <!-- Header -->
            <div class="flex justify-between items-center flex-wrap gap-6 mb-8 pb-6 border-b border-slate-700"
                id="setup-header">
                <div>
                    <h1 class="text-[2.5rem] font-bold text-slate-50 mb-1">Setup &amp; Exports</h1>
                    <p class="text-slate-400 m-0 max-w-2xl">
                        Ren'Py settings for <span class="text-sky-400">{{ project.name }}</span>. Scenes are exported
                        from the scene editor and use everything you set here.
                    </p>
                </div>
                <div class="flex gap-3 items-center flex-wrap">
                    <span v-if="savedFlash" class="text-sm text-emerald-400" id="setup-saved">Saved ✓</span>
                    <span v-else-if="isDirty" class="text-sm text-amber-400" id="setup-dirty">Unsaved changes</span>
                    <button v-if="isDirty" :class="[btnBase, btnSecondary]" @click="resetDrafts" id="setup-discard">
                        Discard
                    </button>
                    <button :class="[btnBase, btnPrimary]" :disabled="!isDirty || saving" @click="save" id="setup-save">
                        {{ saving ? 'Saving…' : 'Save changes' }}
                    </button>
                </div>
            </div>

            <p v-if="saveError" class="text-red-400 text-sm mb-4" id="setup-save-error">{{ saveError }}</p>

            <!-- Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" id="setup-stats">
                <div v-for="stat in stats" :key="stat.label"
                    class="bg-slate-950 border border-slate-700 rounded-xl p-4">
                    <div class="text-2xl font-bold text-sky-400">{{ stat.value }}</div>
                    <div class="text-slate-400 text-sm">{{ stat.label }}</div>
                </div>
            </div>

            <div class="flex flex-col gap-6">
                <!-- Characters -->
                <section :class="card" id="setup-characters">
                    <h3 :class="cardTitle">Characters</h3>
                    <p :class="cardHint">
                        The tag is the short name used in the script (<code :class="code">alice "Hello"</code>,
                        <code :class="code">show alice happy</code>). Leave it blank to generate one from the
                        character's name.
                    </p>

                    <p v-if="roster.length === 0" class="text-slate-500 text-sm m-0">
                        No characters in this project yet.
                    </p>

                    <div v-else class="flex flex-col divide-y divide-slate-800">
                        <div v-for="c in roster" :key="c.id"
                            class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_240px_auto] items-start gap-3 md:gap-4 py-3"
                            :id="`setup-char-${c.id}`">
                            <div class="flex items-center gap-3 min-w-0 pt-1.5">
                                <span class="w-3 h-3 rounded-full border border-white/15 shrink-0"
                                    :style="{ background: c.color }" />
                                <span class="text-slate-100 font-medium truncate">{{ c.name }}</span>
                                <span v-if="c.nickname" class="text-slate-500 text-sm italic truncate">
                                    "{{ c.nickname }}"
                                </span>
                            </div>

                            <div class="flex flex-col gap-1">
                                <input type="text" :value="tagValue(c.id)" :placeholder="autoTags.get(c.id)?.tag"
                                    spellcheck="false" autocomplete="off"
                                    :class="[input, 'font-mono', tagProblem(c.id) ? '!border-amber-500/60' : '']"
                                    :aria-label="`Ren'Py tag for ${c.name}`"
                                    @input="setTag(c.id, ($event.target as HTMLInputElement).value)" />
                                <span v-if="tagProblem(c.id)" class="text-xs text-amber-400">{{ tagProblem(c.id)
                                }}</span>
                                <span v-else-if="tagValue(c.id)" class="text-xs text-slate-500">
                                    Exports as <code :class="code">{{ resolvedTags.get(c.id)?.tag }}</code>
                                </span>
                            </div>

                            <div class="flex items-center gap-2 text-xs text-slate-400 md:pt-2">
                                <span :class="pill">{{ c.expressions?.length ?? 0 }} expressions</span>
                                <span :class="pill">{{ c.outfits?.length ?? 0 }} outfits</span>
                                <span :class="pill">{{ c.voice_lines?.length ?? 0 }} voice</span>
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Variables -->
                <section :class="card" id="setup-variables">
                    <h3 :class="cardTitle">Variable defaults</h3>
                    <p :class="cardHint">
                        Starting values written to <code :class="code">variables.rpy</code> as
                        <code :class="code">default</code> statements. Create, rename and delete variables from
                        <em>Story Variables</em> in the scene editor.
                    </p>

                    <!-- Used in scenes but not registered -->
                    <div v-if="undeclared.length" class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4"
                        id="setup-undeclared">
                        <div class="flex items-start justify-between gap-3 flex-wrap">
                            <p class="text-amber-400 font-medium text-sm m-0">
                                {{ undeclared.length }} variable{{ undeclared.length !== 1 ? 's' : '' }} used in
                                choices but not in this list
                            </p>
                            <button :class="[btnBase, btnSecondary, '!py-1 !px-3 !text-xs']" @click="addUndeclared()"
                                id="setup-add-all-undeclared">
                                Add all
                            </button>
                        </div>
                        <ul class="list-none p-0 m-0 mt-3 flex flex-wrap gap-2">
                            <li v-for="u in undeclared" :key="u.key"
                                class="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-md pl-2 pr-1 py-1">
                                <code :class="code">{{ u.key }}</code>
                                <span class="text-[11px] text-slate-500">{{ u.type }}</span>
                                <button
                                    class="text-xs text-sky-400 hover:text-sky-300 bg-transparent border-0 cursor-pointer px-1"
                                    @click="addUndeclared([u.key])" :aria-label="`Add ${u.key} to the variable list`">
                                    Add
                                </button>
                            </li>
                        </ul>
                        <p class="text-xs text-slate-400 m-0 mt-3">
                            {{ declareUndefinedOn
                                ? 'They are auto-declared on export, but adding them lets you choose their defaults.'
                                : 'Auto-declare is off, so the game will crash when these are used.' }}
                        </p>
                    </div>

                    <p v-if="variablesDraft.length === 0" class="text-slate-500 text-sm m-0">
                        No variables yet.
                    </p>

                    <div v-else class="overflow-x-auto">
                        <table class="w-full text-sm border-collapse">
                            <thead>
                                <tr class="text-left text-slate-400 text-xs border-b border-slate-700">
                                    <th class="font-medium py-2 pr-4">Variable</th>
                                    <th class="font-medium py-2 pr-4">Type</th>
                                    <th class="font-medium py-2 pr-4">Default value</th>
                                    <th class="font-medium py-2">Category</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800">
                                <tr v-for="v in variablesDraft" :key="v.key" :id="`setup-var-${v.key}`">
                                    <td class="py-2 pr-4">
                                        <code :class="code">{{ v.key }}</code>
                                        <span v-if="v.label" class="block text-xs text-slate-500">{{ v.label }}</span>
                                    </td>
                                    <td class="py-2 pr-4 text-slate-400">{{ v.type }}</td>
                                    <td class="py-2 pr-4">
                                        <select v-if="v.type === 'boolean'" :value="String(v.default_value)"
                                            :class="[input, 'w-32']" :aria-label="`Default for ${v.key}`"
                                            @change="onVarChange(v, $event)">
                                            <option value="false">False</option>
                                            <option value="true">True</option>
                                        </select>
                                        <input v-else :type="v.type === 'number' ? 'number' : 'text'"
                                            :value="v.default_value as string | number" :class="[input, 'w-40']"
                                            :aria-label="`Default for ${v.key}`" @change="onVarChange(v, $event)" />
                                    </td>
                                    <td class="py-2 text-slate-400">{{ v.category ?? '—' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <!-- Export defaults -->
                <section :class="card" id="setup-defaults">
                    <h3 :class="cardTitle">Export defaults</h3>
                    <p :class="cardHint">
                        Each export starts from these. The export dialog can still override them for a single run.
                    </p>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        <label class="flex flex-col gap-1.5 text-sm">
                            <span class="text-slate-200 font-medium">When a scene ends</span>
                            <select :value="draftOptions.sceneEnd" :class="input" id="setup-scene-end"
                                @change="setSetting('scene_end', ($event.target as HTMLSelectElement).value as 'return' | 'next_in_order')">
                                <option value="return">Return to the caller</option>
                                <option value="next_in_order">Continue to the next scene in order</option>
                            </select>
                        </label>

                        <div class="flex flex-col gap-3 text-sm">
                            <label class="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" class="accent-sky-400 mt-0.5 cursor-pointer"
                                    :checked="draftOptions.stubMissingScenes" id="setup-stub-missing"
                                    @change="setSetting('stub_missing_scenes', ($event.target as HTMLInputElement).checked)" />
                                <span>
                                    <span class="text-slate-200">Placeholder labels for scenes not in the export</span>
                                    <span class="block text-xs text-slate-500">Keeps jumps to unexported scenes from
                                        crashing the game.</span>
                                </span>
                            </label>
                            <label class="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" class="accent-sky-400 mt-0.5 cursor-pointer"
                                    :checked="draftOptions.declareUndefinedVariables" id="setup-declare-undefined"
                                    @change="setSetting('declare_undefined_variables', ($event.target as HTMLInputElement).checked)" />
                                <span>
                                    <span class="text-slate-200">Auto-declare variables missing from the list</span>
                                    <span class="block text-xs text-slate-500">Adds a <code :class="code">default</code>
                                        for anything choices use.</span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <h4 class="text-sm font-semibold text-slate-200 mt-6 mb-1">Asset folders</h4>
                    <p :class="cardHint">Paths inside the Ren'Py <code :class="code">game/</code> folder where exported
                        files expect your assets.</p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label v-for="f in folderFields" :key="f.key" class="flex flex-col gap-1.5 text-sm">
                            <span class="text-slate-200 font-medium">{{ f.label }}</span>
                            <input type="text" :value="settingsDraft.asset_folders?.[f.key] ?? ''"
                                :placeholder="f.placeholder" spellcheck="false" :class="[input, 'font-mono']"
                                :id="`setup-folder-${f.key}`"
                                @input="setFolder(f.key, ($event.target as HTMLInputElement).value)" />
                        </label>
                    </div>
                </section>

                <!-- Shared files preview -->
                <section :class="card" id="setup-preview">
                    <div class="flex items-start justify-between gap-4 flex-wrap mb-1">
                        <h3 :class="[cardTitle, '!mb-0']">Generated shared files</h3>
                        <div class="flex gap-2">
                            <button :class="[btnBase, btnSecondary, '!py-1.5 !px-3 !text-xs']" @click="copyActive"
                                :disabled="!activeFile" id="setup-copy">
                                {{ copied ? 'Copied ✓' : 'Copy' }}
                            </button>
                            <button :class="[btnBase, btnPrimary, '!py-1.5 !px-3 !text-xs']"
                                :disabled="!shared?.files.length" @click="downloadShared" id="setup-download">
                                Download shared files (.zip)
                            </button>
                        </div>
                    </div>
                    <p :class="cardHint">
                        Live preview of what the export dialog writes for <code :class="code">characters.rpy</code>,
                        <code :class="code">images.rpy</code> and <code :class="code">variables.rpy</code>, including
                        your unsaved changes. Downloading here doesn't mark files as exported; scenes are exported from
                        the scene editor.
                    </p>

                    <ul v-if="shared?.issues.length" class="list-none p-0 m-0 mb-4 flex flex-col gap-1.5"
                        id="setup-issues">
                        <li v-for="(i, idx) in shared.issues" :key="idx" class="text-xs rounded-md border px-3 py-2"
                            :class="issueClass(i.severity)">
                            {{ i.message }}
                        </li>
                    </ul>

                    <div class="flex gap-1 border-b border-slate-700 mb-0 overflow-x-auto" role="tablist">
                        <button v-for="f in shared?.files ?? []" :key="f.path" role="tab"
                            :aria-selected="activeFile?.path === f.path"
                            class="px-4 py-2 text-xs font-mono border-0 bg-transparent cursor-pointer -mb-px border-b-2 transition-colors"
                            :class="activeFile?.path === f.path
                                ? 'text-sky-400 border-sky-400'
                                : 'text-slate-400 border-transparent hover:text-slate-200'"
                            @click="activePath = f.path">
                            {{ f.path.replace('game/', '') }}
                        </button>
                    </div>
                    <pre class="bg-slate-900 border border-slate-700 border-t-0 rounded-b-lg p-4 m-0 text-xs text-slate-200 font-mono overflow-auto max-h-[420px] whitespace-pre"
                        id="setup-code">{{ activeFile?.content ?? '' }}</pre>
                </section>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue';
import type { Character, ExportSettings, Project, Scene, StoryVariable } from '@/types/models';
import { createVariable } from '@/services/VariableManagerService';
import {
    exportSharedFiles,
    isValidTag,
    optionsFromSettings,
    resolveCharacterTags,
    safeTag,
} from '@/services/renpyExportService';
import type { IssueSeverity } from '@/services/renpyExportService';
import { downloadZip } from '@/services/zipService';

interface Props {
    project: Project | null;
    characters: Character[];
    // Pass the editor's scenes-with-drafts so the preview matches the export dialog.
    scenes: Scene[];
    saving?: boolean;
    saveError?: string | null;
}
const props = withDefaults(defineProps<Props>(), { saving: false, saveError: null });

const emit = defineEmits<{
    (e: 'save', payload: { export_settings: ExportSettings; variables: StoryVariable[] }): void;
    (e: 'dirty-change', dirty: boolean): void;
}>();

const project = computed(() => props.project);
const roster = computed(() => props.characters);
const scenes = computed(() => props.scenes);

// ── Shared Tailwind class strings (same look as the rest of the editor) ──
const card = 'bg-slate-950 border border-slate-700 rounded-xl p-6';
const cardTitle = 'text-slate-50 font-semibold text-lg m-0 mb-1';
const cardHint = 'text-slate-400 text-sm m-0 mb-4';
const input =
    'w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-slate-50 text-sm focus:outline-none focus:border-sky-400 transition-colors';
const code = 'font-mono text-[0.85em] text-sky-300 bg-sky-400/10 rounded px-1 py-0.5';
const pill = 'bg-slate-900 border border-slate-800 rounded-full px-2.5 py-1 whitespace-nowrap';
const btnBase =
    'py-2 px-5 rounded-md font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const btnPrimary = 'bg-sky-400 text-slate-950 border-0 hover:enabled:opacity-90';
const btnSecondary = 'bg-slate-800 text-slate-200 border border-slate-700 hover:enabled:bg-slate-700';

// ── Drafts (edited locally, persisted by the parent after `save`) ──
const settingsDraft = ref<ExportSettings>({});
const variablesDraft = ref<StoryVariable[]>([]);
const savedFlash = ref(false);

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// Drops empty overrides so "blank" really means "use the default".
const cleanSettings = (s: ExportSettings): ExportSettings => {
    const out: ExportSettings = {};
    if (s.scene_end) out.scene_end = s.scene_end;
    if (s.stub_missing_scenes !== undefined) out.stub_missing_scenes = s.stub_missing_scenes;
    if (s.declare_undefined_variables !== undefined) out.declare_undefined_variables = s.declare_undefined_variables;

    const tags = Object.fromEntries(Object.entries(s.character_tags ?? {}).filter(([, v]) => v.trim()));
    if (Object.keys(tags).length) out.character_tags = tags;

    const folders = Object.fromEntries(
        Object.entries(s.asset_folders ?? {}).filter(([, v]) => typeof v === 'string' && v.trim())
    ) as NonNullable<ExportSettings['asset_folders']>;
    if (Object.keys(folders).length) out.asset_folders = folders;
    return out;
};

const resetDrafts = () => {
    settingsDraft.value = clone(props.project?.export_settings ?? {});
    variablesDraft.value = clone(props.project?.variables ?? []);
};

const signature = (settings: ExportSettings | undefined, variables: StoryVariable[] | undefined) =>
    JSON.stringify([cleanSettings(settings ?? {}), variables ?? []]);

const draftSig = computed(() => signature(settingsDraft.value, variablesDraft.value));
const savedSig = computed(() => signature(props.project?.export_settings, props.project?.variables));
const isDirty = computed(() => !!props.project && draftSig.value !== savedSig.value);

resetDrafts();
let baseline = savedSig.value;

// The parent replaces `project` after a save, and also when unrelated things change
// (character roster, export history). Only overwrite the drafts when that can't
// discard unsaved edits: they were untouched, or they now equal what was saved.
watch(
    () => props.project,
    () => {
        const incoming = savedSig.value;
        if (draftSig.value === baseline || draftSig.value === incoming) resetDrafts();
        baseline = incoming;
    }
);

watch(isDirty, dirty => emit('dirty-change', dirty), { immediate: true });
onUnmounted(() => emit('dirty-change', false));

const save = () => {
    if (!props.project || !isDirty.value) return;
    emit('save', {
        export_settings: cleanSettings(settingsDraft.value),
        variables: clone(variablesDraft.value),
    });
};

// "Saved ✓" once the parent finishes a save without an error.
watch(
    () => props.saving,
    (now, was) => {
        if (was && !now && !props.saveError) {
            savedFlash.value = true;
            setTimeout(() => (savedFlash.value = false), 2000);
        }
    }
);

// ── Stats ──
const stats = computed(() => [
    { label: 'Characters', value: roster.value.length },
    { label: 'Expressions', value: roster.value.reduce((n, c) => n + (c.expressions?.length ?? 0), 0) },
    { label: 'Voice lines', value: roster.value.reduce((n, c) => n + (c.voice_lines?.length ?? 0), 0) },
    { label: 'Variables', value: variablesDraft.value.length },
]);

// ── Character tags ──
const resolvedTags = computed(() => resolveCharacterTags(roster.value, settingsDraft.value.character_tags));
const autoTags = computed(() => resolveCharacterTags(roster.value));
const tagValue = (id: string) => settingsDraft.value.character_tags?.[id] ?? '';

const setTag = (id: string, raw: string) => {
    const value = raw.trim().toLowerCase();
    const next = { ...(settingsDraft.value.character_tags ?? {}) };
    if (value) next[id] = value;
    else delete next[id];
    settingsDraft.value = { ...settingsDraft.value, character_tags: next };
};

const tagProblem = (id: string): string | null => {
    const raw = tagValue(id);
    if (raw && !isValidTag(raw)) {
        return `Use lowercase letters, numbers and _ (not starting with a number, and not a Ren'Py keyword). Exports as "${safeTag(raw)}".`;
    }
    if (resolvedTags.value.get(id)?.deduped) {
        return `Already used by another character. Exports as "${resolvedTags.value.get(id)?.tag}".`;
    }
    return null;
};

// ── Variable defaults ──
const onVarChange = (v: StoryVariable, e: Event) => {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    let value: number | boolean | string;
    if (v.type === 'number') {
        const n = (el as HTMLInputElement).valueAsNumber;
        value = Number.isFinite(n) ? n : 0;
    } else if (v.type === 'boolean') {
        value = el.value === 'true';
    } else {
        value = el.value;
    }
    variablesDraft.value = variablesDraft.value.map(x => (x.key === v.key ? { ...x, default_value: value } : x));
};

const humanize = (key: string) => {
    const s = key.replace(/_/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
};

const addUndeclared = (keys?: string[]) => {
    let next = variablesDraft.value;
    for (const u of undeclared.value) {
        if (keys && !keys.includes(u.key)) continue;
        try {
            next = createVariable(next, {
                key: u.key,
                type: u.type,
                default_value: u.type === 'number' ? 0 : u.type === 'boolean' ? false : '',
                label: humanize(u.key),
                category: 'other',
            });
        } catch (err) {
            // Key isn't a valid registry key (e.g. odd characters in legacy data) - leave it auto-declared.
            console.warn(`Could not add "${u.key}" to the variable list:`, err);
        }
    }
    variablesDraft.value = next;
};

// ── Export defaults ──
const draftOptions = computed(() => optionsFromSettings(settingsDraft.value) as Required<ReturnType<typeof optionsFromSettings>>);
const declareUndefinedOn = computed(() => draftOptions.value.declareUndefinedVariables);

const setSetting = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    settingsDraft.value = { ...settingsDraft.value, [key]: value };
};

const folderFields = [
    { key: 'images', label: 'Character sprites', placeholder: 'images' },
    { key: 'backgrounds', label: 'Backgrounds', placeholder: 'images/bg' },
    { key: 'audio', label: 'Music & voice', placeholder: 'audio' },
] as const;

const setFolder = (key: (typeof folderFields)[number]['key'], value: string) => {
    settingsDraft.value = {
        ...settingsDraft.value,
        asset_folders: { ...(settingsDraft.value.asset_folders ?? {}), [key]: value },
    };
};

// ── Shared files preview (the service is the only thing that writes .rpy) ──
const shared = computed(() => {
    if (!project.value) return null;
    return exportSharedFiles({
        project: {
            ...project.value,
            variables: variablesDraft.value,
            export_settings: cleanSettings(settingsDraft.value),
        },
        scenes: scenes.value,
        characters: roster.value,
    });
});

const undeclared = computed(() => shared.value?.undeclaredVariables ?? []);

const activePath = ref<string | null>(null);
const activeFile = computed(
    () => shared.value?.files.find(f => f.path === activePath.value) ?? shared.value?.files[0] ?? null
);

const copied = ref(false);
const copyActive = async () => {
    if (!activeFile.value) return;
    try {
        await navigator.clipboard.writeText(activeFile.value.content);
        copied.value = true;
        setTimeout(() => (copied.value = false), 1500);
    } catch (err) {
        console.error('Copy failed:', err);
    }
};

const downloadShared = async () => {
    if (!project.value || !shared.value?.files.length) return;
    const slug =
        project.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'project';
    await downloadZip(shared.value.files, `${slug}_renpy_shared.zip`);
};

const issueClass = (s: IssueSeverity) =>
    s === 'error'
        ? 'text-red-300 bg-red-500/10 border-red-500/30'
        : s === 'warning'
            ? 'text-amber-300 bg-amber-500/10 border-amber-500/30'
            : 'text-slate-300 bg-slate-800 border-slate-700';
</script>