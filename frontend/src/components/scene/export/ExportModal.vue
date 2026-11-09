<!-- frontend/src/components/scene/export/ExportModal.vue -->
<!--
    Review step of the Ren'Py export: options, issues and a per-file code
    preview, then Download ZIP. Selection happens in the sidebar (SceneManager)
    or via the header's single-scene shortcut - this modal never edits scene
    data. All generation is delegated to renpyExportService (pure), and the
    parent persists the ExportRecords we emit.
-->
<template>
    <div v-if="open" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="close"
        id="export-modal">
        <div class="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl"
            id="export-modal-card">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
                <div class="flex items-center gap-3">
                    <span class="text-2xl">📤</span>
                    <div>
                        <h3 class="text-lg font-semibold text-slate-50 m-0">Export to Ren'Py</h3>
                        <p class="text-xs text-slate-400 m-0">
                            {{ orderedSceneIds.length }} scene{{ orderedSceneIds.length !== 1 ? 's' : '' }} selected
                        </p>
                    </div>
                </div>
                <button
                    class="bg-transparent border-none text-slate-400 hover:text-slate-100 text-xl cursor-pointer px-2"
                    @click="close" title="Close" id="export-close-x">✕</button>
            </div>

            <div class="flex flex-1 min-h-0">
                <!-- Left: scenes, options, issues -->
                <aside class="w-80 shrink-0 border-r border-slate-700 overflow-y-auto p-4 flex flex-col gap-5"
                    id="export-sidebar">

                    <!-- Scenes -->
                    <section>
                        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide m-0 mb-2">Scenes</h4>
                        <ul class="m-0 p-0 list-none flex flex-col gap-1">
                            <li v-for="id in orderedSceneIds" :key="id"
                                class="text-xs text-slate-200 bg-slate-800/70 rounded px-2 py-1 truncate">
                                🎬 {{ sceneName(id) }}
                            </li>
                        </ul>
                    </section>

                    <!-- Options -->
                    <section class="flex flex-col gap-3">
                        <div class="flex flex-col gap-1">
                            <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide m-0">Options</h4>
                            <p class="text-[11px] text-slate-500 m-0 leading-snug" id="export-defaults-hint">
                                Starts from your project defaults; changes here apply to this export only.
                                <button type="button"
                                    class="text-sky-400 hover:text-sky-300 whitespace-nowrap bg-transparent border-0 p-0 cursor-pointer text-[11px]"
                                    id="export-open-setup" @click="emit('open-setup')">
                                    Edit defaults in Setup &amp; Exports
                                </button>
                            </p>
                        </div>

                        <label class="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                            <input type="checkbox" class="accent-sky-400 mt-0.5 cursor-pointer"
                                :checked="options.includeShared"
                                @change="setOption('includeShared', ($event.target as HTMLInputElement).checked)" />
                            <span>
                                Include shared files
                                <span class="block text-slate-500">characters.rpy, images.rpy, variables.rpy (names,
                                    paths and defaults come from Setup)</span>
                            </span>
                        </label>

                        <div class="flex flex-col gap-1.5">
                            <label class="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                                <input type="checkbox" class="accent-sky-400 mt-0.5 cursor-pointer"
                                    :checked="startEnabled"
                                    @change="toggleStart(($event.target as HTMLInputElement).checked)" />
                                <span>
                                    Generate script.rpy
                                    <span class="block text-slate-500">
                                        {{ scriptAlreadyExported ? 'Already exported before - usually not needed again.'
                                            : 'Adds label start: that jumps to the scene below.' }}
                                    </span>
                                </span>
                            </label>
                            <select v-if="startEnabled" :value="options.startSceneId"
                                class="ml-6 bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                                @change="setOption('startSceneId', ($event.target as HTMLSelectElement).value)">
                                <option v-for="id in orderedSceneIds" :key="id" :value="id">{{ sceneName(id) }}
                                </option>
                            </select>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="text-xs text-slate-300" for="export-scene-end">When a scene finishes</label>
                            <select id="export-scene-end" :value="options.sceneEnd"
                                class="bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                                @change="setOption('sceneEnd', ($event.target as HTMLSelectElement).value as ExportOptions['sceneEnd'])">
                                <option value="return">Return (end)</option>
                                <option value="next_in_order">Jump to the next scene in order</option>
                            </select>
                        </div>

                        <label class="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                            <input type="checkbox" class="accent-sky-400 mt-0.5 cursor-pointer"
                                :checked="options.stubMissingScenes"
                                @change="setOption('stubMissingScenes', ($event.target as HTMLInputElement).checked)" />
                            <span>
                                Placeholders for scenes not exported
                                <span class="block text-slate-500">Keeps jumps valid so the game still runs.</span>
                            </span>
                        </label>

                        <label class="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                            <input type="checkbox" class="accent-sky-400 mt-0.5 cursor-pointer"
                                :checked="options.declareUndefinedVariables"
                                @change="setOption('declareUndefinedVariables', ($event.target as HTMLInputElement).checked)" />
                            <span>
                                Auto-declare undefined variables
                                <span class="block text-slate-500">Used in choices but missing from the variable
                                    list.</span>
                            </span>
                        </label>

                        <label class="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
                            <input type="checkbox" v-model="skipUpToDate"
                                class="accent-sky-400 mt-0.5 cursor-pointer" />
                            <span>
                                Skip files already exported and unchanged
                                <span class="block text-slate-500">{{ upToDateCount }} of {{ result.files.length }}
                                    files.</span>
                            </span>
                        </label>
                    </section>

                    <!-- Issues -->
                    <section class="flex flex-col gap-2" id="export-issues">
                        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide m-0">
                            Issues
                            <span class="text-slate-500 normal-case font-normal">
                                ({{ errorCount }} errors, {{ warningCount }} warnings)
                            </span>
                        </h4>
                        <p v-if="result.issues.length === 0" class="text-xs text-emerald-400 m-0">
                            ✓ No problems found.
                        </p>
                        <ul v-else class="m-0 p-0 list-none flex flex-col gap-1.5">
                            <li v-for="(iss, i) in result.issues" :key="i">
                                <component :is="canJump(iss) ? 'button' : 'div'" type="button"
                                    class="w-full text-left rounded-md border px-2.5 py-2 text-xs leading-snug flex gap-2 items-start"
                                    :class="[issueClass(iss.severity), canJump(iss) ? 'cursor-pointer hover:brightness-125' : '']"
                                    @click="canJump(iss) && jumpTo(iss)">
                                    <span class="shrink-0">{{ issueIcon(iss.severity) }}</span>
                                    <span class="flex-1 min-w-0">
                                        <span v-if="iss.sceneId" class="block text-[10px] opacity-70 truncate">
                                            {{ sceneName(iss.sceneId) }}{{ canJump(iss) ? ' - click to open line' : ''
                                            }}
                                        </span>
                                        {{ iss.message }}
                                    </span>
                                </component>
                            </li>
                        </ul>
                    </section>
                </aside>

                <!-- Right: file tabs + preview -->
                <section class="flex-1 min-w-0 flex flex-col" id="export-preview">
                    <div v-if="visibleFiles.length === 0"
                        class="flex-1 flex items-center justify-center text-sm text-slate-500 p-6 text-center">
                        {{ result.files.length > 0
                            ? 'Every file is already exported and unchanged. Untick "Skip files..." to preview them.'
                            : 'Nothing to export with the current options.' }}
                    </div>

                    <template v-else>
                        <div class="flex gap-1 px-4 pt-3 border-b border-slate-700 overflow-x-auto shrink-0"
                            id="export-tabs">
                            <button v-for="f in visibleFiles" :key="f.path" type="button"
                                class="shrink-0 flex items-center gap-2 px-3 py-2 text-xs rounded-t-md border border-b-0 cursor-pointer transition-colors"
                                :class="activeFile?.path === f.path
                                    ? 'bg-slate-950 border-slate-700 text-slate-50'
                                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200'"
                                @click="activePath = f.path">
                                <span class="font-mono">{{ baseName(f.path) }}</span>
                                <span class="text-[10px] leading-none px-1.5 py-1 rounded border"
                                    :class="statusMeta(statusOf(f)).cls">
                                    {{ statusMeta(statusOf(f)).label }}
                                </span>
                            </button>
                        </div>

                        <div class="flex items-center justify-between px-4 py-2 text-[11px] text-slate-500 shrink-0">
                            <span class="font-mono truncate">{{ activeFile?.path }}</span>
                            <div class="flex items-center gap-3">
                                <span v-if="lastExportedLabel(activeFile)">{{ lastExportedLabel(activeFile) }}</span>
                                <button type="button"
                                    class="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded px-2 py-0.5 cursor-pointer"
                                    @click="copyActive">
                                    {{ copied ? 'Copied ✓' : 'Copy' }}
                                </button>
                            </div>
                        </div>

                        <pre class="flex-1 min-h-0 overflow-auto m-0 mx-4 mb-4 p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-200 font-mono whitespace-pre"
                            id="export-code">{{ activeFile?.content }}</pre>
                    </template>
                </section>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between gap-4 px-6 py-4 border-t border-slate-700 shrink-0"
                id="export-footer-bar">
                <p class="text-xs text-slate-500 m-0">
                    {{ visibleFiles.length }} file{{ visibleFiles.length !== 1 ? 's' : '' }} will be saved in a ZIP
                    (game/ folder).
                    <span v-if="errorCount > 0" class="text-red-400">Fix the errors first, or download anyway.</span>
                </p>
                <div class="flex items-center gap-3">
                    <button
                        class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm border border-slate-700 transition-colors cursor-pointer"
                        @click="close" id="export-cancel-btn">
                        Close
                    </button>
                    <button
                        class="px-4 py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-semibold rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        :disabled="visibleFiles.length === 0 || downloading" @click="download" id="export-download-btn">
                        {{ downloading ? 'Preparing...' : errorCount > 0 ? 'Download anyway' : 'Download ZIP' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Character, Project, Scene } from '@/types/models';
import {
    exportProject,
    optionsFromSettings,
    recordExport,
    SHARED_PATHS,
} from '@/services/renpyExportService';
import type {
    ExportFile,
    ExportIssue,
    ExportOptions,
    ExportRecords,
    ExportStatus,
    IssueSeverity,
} from '@/services/renpyExportService';
import { downloadZip } from '@/services/zipService';

interface Props {
    open: boolean;
    project: Project | null;
    scenes: Scene[]; // sidebar order, unsaved drafts already merged in by the parent
    characters: Character[];
    sceneIds: string[]; // scenes to export (any order)
    records: ExportRecords; // what has been downloaded before
    options: ExportOptions; // v-model:options (sceneIds is overridden here)
}

interface Emits {
    (e: 'update:open', open: boolean): void;
    (e: 'update:options', options: ExportOptions): void;
    (e: 'open-setup'): void;
    (e: 'exported', records: ExportRecords): void;
    (e: 'goto-issue', payload: { sceneId: string; lineId: string }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const skipUpToDate = ref(false);
const activePath = ref<string | null>(null);
const downloading = ref(false);
const copied = ref(false);

const close = () => emit('update:open', false);

const setOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    emit('update:options', { ...props.options, [key]: value });
};

// Selected scenes in sidebar order.
const orderedSceneIds = computed(() =>
    props.scenes.filter(s => props.sceneIds.includes(s.id)).map(s => s.id)
);

const sceneName = (id: string) => props.scenes.find(s => s.id === id)?.name || 'Untitled Scene';

// ── Generation (pure; recomputed whenever scenes/options change) ──
const result = computed(() => {
    if (!props.open || !props.project) return { files: [] as ExportFile[], issues: [] as ExportIssue[] };
    return exportProject({
        project: props.project,
        scenes: props.scenes,
        characters: props.characters,
        options: { ...props.options, sceneIds: orderedSceneIds.value },
    });
});

const statusOf = (f: ExportFile): ExportStatus => {
    const r = props.records[f.path];
    if (!r) return 'never';
    return r.hash === f.hash ? 'up_to_date' : 'changed';
};

const upToDateCount = computed(() => result.value.files.filter(f => statusOf(f) === 'up_to_date').length);

const visibleFiles = computed(() =>
    skipUpToDate.value ? result.value.files.filter(f => statusOf(f) !== 'up_to_date') : result.value.files
);

const activeFile = computed(
    () => visibleFiles.value.find(f => f.path === activePath.value) ?? visibleFiles.value[0] ?? null
);

// ── script.rpy option ──
const startEnabled = computed(() => !!props.options.startSceneId);
const scriptAlreadyExported = computed(() => !!props.records[SHARED_PATHS.script]);

const toggleStart = (on: boolean) => setOption('startSceneId', on ? orderedSceneIds.value[0] : undefined);

// Fresh defaults every time the modal opens: run options are re-seeded from the
// project's Setup defaults, and `label start` is only offered when script.rpy has
// never been exported.
watch(
    () => props.open,
    open => {
        if (!open) return;
        skipUpToDate.value = false;
        activePath.value = null;
        copied.value = false;
        // One merged emit: sequential setOption() calls would each spread the same
        // stale props.options and the first patch would be lost.
        emit('update:options', {
            ...props.options,
            ...optionsFromSettings(props.project?.export_settings),
            startSceneId: scriptAlreadyExported.value ? undefined : orderedSceneIds.value[0],
        });
    }
);

// ── Issues ──
const errorCount = computed(() => result.value.issues.filter(i => i.severity === 'error').length);
const warningCount = computed(() => result.value.issues.filter(i => i.severity === 'warning').length);

const canJump = (i: ExportIssue) => !!i.sceneId && !!i.lineId;

const jumpTo = (i: ExportIssue) => {
    if (!i.sceneId || !i.lineId) return;
    emit('goto-issue', { sceneId: i.sceneId, lineId: i.lineId });
    close();
};

const issueIcon = (s: IssueSeverity) => (s === 'error' ? '⛔' : s === 'warning' ? '⚠️' : 'ℹ️');

const issueClass = (s: IssueSeverity) =>
    s === 'error'
        ? 'bg-red-500/10 border-red-500/30 text-red-200'
        : s === 'warning'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            : 'bg-sky-500/10 border-sky-500/30 text-sky-200';

// ── File tab helpers ──
const baseName = (path: string) => path.split('/').pop() ?? path;

const statusMeta = (s: ExportStatus) =>
    s === 'never'
        ? { label: 'New', cls: 'text-slate-400 bg-slate-800 border-slate-700' }
        : s === 'changed'
            ? { label: 'Changed', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' }
            : { label: 'Up to date', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };

const lastExportedLabel = (f: ExportFile | null) => {
    const r = f ? props.records[f.path] : undefined;
    return r ? `Last exported ${new Date(r.exported_at).toLocaleString()}` : '';
};

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

// ── Download ──
const download = async () => {
    if (!props.project || visibleFiles.value.length === 0) return;
    downloading.value = true;
    try {
        const slug = props.project.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'project';
        await downloadZip(visibleFiles.value, `${slug}_renpy.zip`);
        // Only now do we claim these files were exported.
        emit('exported', recordExport(props.records, visibleFiles.value));
    } catch (err) {
        console.error('Export failed:', err);
    } finally {
        downloading.value = false;
    }
};
</script>