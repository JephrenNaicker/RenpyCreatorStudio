<!-- frontend/src/components/scene/SceneWorkspaceHeader.vue -->
<!--
    Top bar of the scene editor workspace: project/scene title and the
    save/export/undo/redo/variables/back action group. Pulled out of
    ProjectSceneEditorView.vue since it's a self-contained unit with no
    dependency on the editor's dialogue state — same rationale as
    DialogueHistory/ProjectSidebar/VariableManager living as their own
    components.
-->
<template>
    <div id="workspace-header" class="border-b border-gray-800 bg-gray-900/50 p-4">
        <div class="flex items-center justify-between flex-wrap gap-4">
            <h2 id="workspace-title" class="text-xl font-semibold text-white flex items-center flex-wrap gap-2">
                {{ projectName ?? 'Scene Editor' }}
                <span v-if="scene" :id="`scene-badge-${scene.id}`"
                    class="text-sm bg-sky-400/20 text-sky-400 px-2 py-1 rounded">
                    🎬 {{ scene.name }}
                </span>
            </h2>

            <div class="flex items-center gap-2" id="workspace-actions">
                <button :id="scene ? `save-scene-${scene.id}` : 'save-scene-disabled'"
                    class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm"
                    @click="emit('save-scene')">
                    💾 Save Scene
                </button>
                <button id="export-scene-btn"
                    class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm"
                    @click="emit('export-scene')">
                    📤 Export
                </button>
                <button id="undo-btn"
                    class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
                    :disabled="!canUndo" :title="canUndo ? 'Undo last change (Ctrl+Z)' : 'Nothing to undo'"
                    @click="emit('undo')">
                    ↩️ Undo
                </button>
                <button id="redo-btn"
                    class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-800"
                    :disabled="!canRedo" :title="canRedo ? 'Redo (Ctrl+Y)' : 'Nothing to redo'" @click="emit('redo')">
                    ↪️ Redo
                </button>
                <button id="manage-variables-btn"
                    class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm"
                    @click="emit('manage-variables')">
                    🧮 Variables
                </button>
                <button id="back-to-project-btn"
                    class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors text-sm ml-auto"
                    @click="emit('back-to-project')">
                    ← Back to Project
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Scene } from '@/types/models';

interface Props {
    projectName?: string | null;
    scene: Scene | null;
    canUndo: boolean;
    canRedo: boolean;
}

interface Emits {
    (e: 'save-scene'): void;
    (e: 'export-scene'): void;
    (e: 'undo'): void;
    (e: 'redo'): void;
    (e: 'manage-variables'): void;
    (e: 'back-to-project'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();
</script>