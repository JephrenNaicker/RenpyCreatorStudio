<!-- frontend/src/components/sidebar/ProjectSidebar.vue -->
<template>
    <aside
        class="relative bg-slate-950 border-r border-slate-700/80 overflow-y-auto h-full flex flex-col transition-[width] duration-300 ease-in-out shrink-0"
        :class="isSidebarCollapsed ? 'w-12 min-w-[48px]' : 'w-[280px]'" id="project-sidebar">

        <!-- Sidebar Header -->
        <div class="flex items-center border-b border-slate-700/80 bg-slate-950"
            :class="isSidebarCollapsed ? 'justify-center py-4' : 'justify-start p-4'" id="sidebar-header">
            <button
                class="bg-slate-800 border border-slate-700 rounded-md text-slate-200 w-8 h-8 flex items-center justify-center cursor-pointer transition-all text-base shrink-0 hover:bg-sky-400 hover:border-sky-400 hover:text-white hover:scale-105"
                @click="toggleSidebar" id="toggle-sidebar-btn">
                <span v-if="isSidebarCollapsed">☰</span>
                <span v-else>←</span>
            </button>
        </div>

        <div v-if="!isSidebarCollapsed" class="flex-1 p-4 overflow-y-auto flex flex-col gap-6" id="sidebar-content">
            <!-- Character Roster -->
            <CharacterRoster :characters="characters" :all-characters="allCharacters"
                :selected-character-id="selectedCharacterId"
                @select-character="(char) => $emit('select-character', char)"
                @remove-character="(id) => $emit('remove-character', id)"
                @add-characters="(ids) => $emit('add-characters', ids)"
                @create-character="(char) => $emit('create-character', char)" />

            <!-- Scene Manager -->
            <SceneManager :scenes="scenes || []" :characters="characters" :selected-scene-id="selectedSceneId"
                :dirty-scene-ids="dirtySceneIds" @select-scene="(scene) => $emit('select-scene', scene)"
                @add-scene="handleAddScene" @delete-scene="(id) => $emit('delete-scene', id)"
                @update-scene="(scene) => $emit('update-scene', scene)" />
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4"
            @click.self="cancelDelete" id="delete-modal-overlay">
            <div class="bg-slate-800 rounded-xl p-6 max-w-[400px] w-full border border-slate-700 shadow-2xl text-slate-200 flex flex-col gap-4"
                id="delete-modal-card">
                <h4 class="text-lg font-bold text-slate-50 m-0">
                    Delete Scene
                </h4>
                <p class="text-sm text-slate-300 leading-relaxed m-0">
                    Are you sure you want to delete <span class="font-semibold text-slate-100">"{{ sceneToDelete?.name
                        || 'Untitled Scene' }}"</span>? This action cannot be undone.
                </p>
                <div class="flex justify-end gap-3 mt-2">
                    <button
                        class="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-md transition-colors border-none cursor-pointer text-sm font-medium"
                        @click="cancelDelete" id="cancel-delete-btn">
                        Cancel
                    </button>
                    <button
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors border-none cursor-pointer text-sm font-medium"
                        @click="confirmDeleteScene" id="confirm-delete-btn">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Character, Scene } from '@/utils/dummyData';
import CharacterRoster from './CharacterRoster.vue';
import SceneManager from './SceneManager.vue';

interface Props {
    characters: Character[];
    scenes?: Scene[];
    selectedCharacterId?: string | null;
    selectedSceneId?: string | null;
    dirtySceneIds?: Set<string>;
    allCharacters?: Character[];
    projectId?: string;
}

interface Emits {
    (e: 'select-character', character: Character): void;
    (e: 'remove-character', characterId: string): void;
    (e: 'select-scene', scene: Scene): void;
    (e: 'add-scene', sceneData: Omit<Scene, 'id' | 'created_at' | 'updated_at' | 'dialogue_lines'>): void;
    (e: 'delete-scene', sceneId: string): void;
    (e: 'update-scene', scene: Scene): void;
    (e: 'add-characters', characterIds: string[]): void;
    (e: 'create-character', character: Omit<Character, 'id' | 'created_at' | 'updated_at'>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ── Sidebar collapse state ──
const isSidebarCollapsed = ref(false);

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// ── Delete modal ──
const showDeleteModal = ref(false);
const sceneToDelete = ref<Scene | null>(null);

// Handle add scene from SceneManager - emit minimal data, parent/service handles timestamps
const handleAddScene = () => {
    emit('add-scene', {
        name: 'New Scene',
        project_id: props.projectId || props.scenes?.[0]?.project_id || 'default-project',
        character_ids: []
    });
};

const confirmDeleteScene = () => {
    if (sceneToDelete.value) {
        emit('delete-scene', sceneToDelete.value.id);
        cancelDelete();
    }
};

const cancelDelete = () => {
    showDeleteModal.value = false;
    sceneToDelete.value = null;
};

// Expose a method to open the delete modal from parent if needed
const openDeleteModal = (scene: Scene) => {
    sceneToDelete.value = scene;
    showDeleteModal.value = true;
};

defineExpose({
    openDeleteModal
});
</script>