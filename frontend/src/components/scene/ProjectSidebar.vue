<template>
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }" id="project-sidebar">
        <!-- Sidebar Header -->
        <div class="sidebar-header" id="sidebar-header">
            <button class="collapse-btn" @click="toggleSidebar">
                <span v-if="isSidebarCollapsed">☰</span>
                <span v-else>←</span>
            </button>
        </div>

        <div v-if="!isSidebarCollapsed" class="sidebar-content">
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
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
            <div class="modal-content">
                <h4 class="text-lg font-bold mb-4">
                    Delete Scene
                </h4>
                <p class="mb-6">
                    Are you sure you want to delete "{{ sceneToDelete?.name || 'Untitled Scene' }}"? This action cannot
                    be undone.
                </p>
                <div class="flex justify-end gap-3">
                    <button class="btn-secondary" @click="cancelDelete">Cancel</button>
                    <button class="btn-danger" @click="confirmDeleteScene">Delete</button>
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
    (e: 'add-scene', scene: Scene): void;
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

// Handle add scene from SceneManager
const handleAddScene = () => {
    const now = new Date().toISOString();
    const newScene: Scene = {
        id: Date.now().toString(),
        name: 'New Scene',
        project_id: props.projectId || props.scenes?.[0]?.project_id || 'default-project',
        character_ids: [],
        dialogue_lines: [],
        created_at: now,
        updated_at: now
    };
    emit('add-scene', newScene);
    // After emitting, we need to select the new scene
    // This will be handled by the parent
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

<style scoped>
.sidebar {
    position: relative;
    background: #020617;
    border-right: 1px solid #334155;
    overflow-y: auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    transition: width 0.3s ease;
    width: 280px;
}

.sidebar.collapsed {
    width: 48px;
    min-width: 48px;
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 1rem;
    border-bottom: 1px solid #334155;
    background: #020617;
}

.collapse-btn {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 6px;
    color: #e2e8f0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.1rem;
    flex-shrink: 0;
}

.collapse-btn:hover {
    background: #38bdf8;
    border-color: #38bdf8;
    color: white;
    transform: scale(1.05);
}

.sidebar-content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
}

.collapsed .sidebar-content {
    display: none;
}

.collapsed .sidebar-header {
    justify-content: center;
    padding: 1rem 0;
}

.collapsed .collapse-btn {
    margin: 0;
}

/* Modal styles */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: #1e293b;
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 400px;
    width: 90%;
    border: 1px solid #334155;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    color: #e2e8f0;
}

.btn-secondary {
    background: #334155;
    border: none;
    color: #e2e8f0;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-secondary:hover {
    background: #475569;
}

.btn-danger {
    background: #dc2626;
    border: none;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-danger:hover {
    background: #b91c1c;
}
</style>