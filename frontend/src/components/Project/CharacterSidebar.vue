<template>
    <aside class="sidebar">
        <h3>Characters</h3>

        <div class="character-list">
            <div v-for="char in characters" :key="char.id" class="character-item"
                :class="{ active: selectedCharacterId === char.id }" @click="$emit('select-character', char)">
                <span class="color-dot" :style="{ background: char.color }" />
                <span class="character-name">{{ char.name }}</span>
                <span class="expression-count">{{ char.expressions?.length || 0 }} 😀</span>
            </div>
        </div>

        <button class="secondary small" @click="$emit('add-character')">
            + Add Character to Project
        </button>

        <div class="sidebar-section">
            <div class="section-header">
                <h4>Scenes</h4>
                <button class="icon-button" @click="addNewScene" title="Add new scene">
                    <span class="text-lg">+</span>
                </button>
            </div>

            <!-- props.scenes is the single source of truth — no localScenes -->
            <div v-if="scenes && scenes.length > 0" class="scene-list">
                <div v-for="scene in scenes" :key="scene.id" class="scene-item" :class="{
                    active: selectedSceneId === scene.id,
                    editing: editingSceneId === scene.id
                }">
                    <!-- Editing mode -->
                    <div v-if="editingSceneId === scene.id" class="scene-edit">
                        <input ref="sceneInput" v-model="editingSceneName" type="text" class="scene-input"
                            placeholder="Scene name" @keyup.enter="handleEnterKey(scene)" @keyup.escape="cancelEdit"
                            @blur="handleBlur(scene)" maxlength="50" />
                    </div>

                    <!-- Display mode -->
                    <template v-else>
                        <div class="scene-content" @click="$emit('select-scene', scene)"
                            @dblclick.stop="startEditing(scene)">
                            <span class="scene-icon">🎬</span>
                            <span class="scene-name">{{ scene.name || 'Untitled Scene' }}</span>
                        </div>
                        <button class="rename-scene" @click.stop="startEditing(scene)" title="Rename scene">
                            <span class="text-gray-400 hover:text-sky-400">✎</span>
                        </button>
                        <button class="delete-scene" @click.stop="confirmDeleteScene(scene)" title="Delete scene">
                            <span class="text-red-400 hover:text-red-300">✕</span>
                        </button>
                    </template>
                </div>
            </div>

            <div v-else class="empty-scenes">
                <p class="text-sm text-gray-500 text-center py-4">No scenes yet. Click + to add one.</p>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
            <div class="modal-content">
                <h4 class="text-lg font-bold mb-4">Delete Scene</h4>
                <p class="mb-6">Are you sure you want to delete "{{ sceneToDelete?.name || 'Untitled Scene' }}"? This
                    action
                    cannot be undone.</p>
                <div class="flex justify-end gap-3">
                    <button class="btn-secondary" @click="cancelDelete">Cancel</button>
                    <button class="btn-danger" @click="deleteScene">Delete</button>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import type { Character, Scene } from '@/utils/dummyData';

interface Props {
    characters: Character[];
    scenes?: Scene[];
    selectedCharacterId?: string | null;
    selectedSceneId?: string | null;
}

interface Emits {
    (e: 'select-character', character: Character): void;
    (e: 'add-character'): void;
    (e: 'select-scene', scene: Scene): void;
    (e: 'add-scene', scene: Scene): void;
    (e: 'delete-scene', sceneId: string): void;
    (e: 'update-scene', scene: Scene): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Only editing state lives here — the scenes list is owned entirely by the parent via props
const editingSceneId = ref<string | null>(null);
const editingSceneName = ref('');
const sceneInput = ref<HTMLInputElement | null>(null);
// Prevents @blur double-firing a save after @keyup.enter already committed
const didCommit = ref(false);

// Delete modal state
const showDeleteModal = ref(false);
const sceneToDelete = ref<Scene | null>(null);

const addNewScene = () => {
    const now = new Date().toISOString();
    const newScene: Scene = {
        id: Date.now().toString(),
        name: 'New Scene',
        project_id: props.scenes?.[0]?.project_id || 'default-project',
        dialogue_lines: [],
        created_at: now,
        updated_at: now
    };
    emit('add-scene', newScene);
    emit('select-scene', newScene);
    nextTick(() => startEditing(newScene));
};

// track the name the scene had before editing started
const editingSceneOriginalName = ref('');

const startEditing = (scene: Scene) => {
    didCommit.value = false;
    editingSceneId.value = scene.id;
    editingSceneName.value = scene.name || '';
    editingSceneOriginalName.value = scene.name || '';   // ← store original
    nextTick(() => {
        const el = Array.isArray(sceneInput.value) ? sceneInput.value[0] : sceneInput.value;
        el?.focus();
        el?.select();
    });
};

const cancelEdit = () => {
    if (didCommit.value) return;
    didCommit.value = true;
    // Only delete if it was a brand-new scene that was never saved with a real name
    const scene = props.scenes?.find(s => s.id === editingSceneId.value);
    if (scene && editingSceneOriginalName.value === 'New Scene') {
        emit('delete-scene', scene.id);
    }
    editingSceneId.value = null;
    editingSceneName.value = '';
    editingSceneOriginalName.value = '';
};

const commitSave = (scene: Scene) => {
    const trimmedName = editingSceneName.value.trim();
    if (!trimmedName) {
        emit('delete-scene', scene.id);
    } else if (trimmedName !== scene.name) {
        emit('update-scene', { ...scene, name: trimmedName });
    }
    editingSceneId.value = null;
    editingSceneName.value = '';
};

// Enter key: commit and mark so blur doesn't fire again
const handleEnterKey = (scene: Scene) => {
    if (didCommit.value) return;
    didCommit.value = true;
    commitSave(scene);
};

// Blur: only save if Enter didn't already handle it
const handleBlur = (scene: Scene) => {
    if (didCommit.value) return;
    didCommit.value = true;
    commitSave(scene);
};

const confirmDeleteScene = (scene: Scene) => {
    sceneToDelete.value = scene;
    showDeleteModal.value = true;
};

const cancelDelete = () => {
    showDeleteModal.value = false;
    sceneToDelete.value = null;
};

const deleteScene = () => {
    if (sceneToDelete.value) {
        emit('delete-scene', sceneToDelete.value.id);
        cancelDelete();
    }
};
</script>

<style scoped>
.sidebar {
    background: #020617;
    border-right: 1px solid #334155;
    padding: 1rem;
    overflow-y: auto;
    height: 100%;
    display: flex;
    flex-direction: column;
}

h3,
h4 {
    margin-bottom: 1rem;
    color: #f8fafc;
}

.character-list {
    margin-bottom: 1.5rem;
}

.character-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 0.25rem;
    transition: all 0.2s;
}

.character-item:hover {
    background: #1e293b;
}

.character-item.active {
    background: rgba(56, 189, 248, 0.2);
    border-left: 3px solid #38bdf8;
}

.color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.character-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.expression-count {
    font-size: 0.8rem;
    opacity: 0.7;
    flex-shrink: 0;
}

.sidebar-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #334155;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.section-header h4 {
    margin-bottom: 0;
}

.icon-button {
    background: #1e293b;
    border: none;
    color: #e2e8f0;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.icon-button:hover {
    background: #2d3748;
    transform: scale(1.05);
}

.scene-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.scene-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    background: #0f172a;
}

.scene-item:hover {
    background: #1e293b;
}

.scene-item.active {
    background: rgba(56, 189, 248, 0.2);
    border-left: 3px solid #38bdf8;
}

.scene-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    overflow: hidden;
}

.scene-icon {
    opacity: 0.7;
    flex-shrink: 0;
}

.scene-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.scene-edit {
    flex: 1;
    padding: 0.25rem 0;
}

.scene-input {
    width: 100%;
    background: #0f172a;
    border: 1px solid #38bdf8;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    color: #e2e8f0;
    font-size: 0.9rem;
    outline: none;
}

.scene-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.scene-item.editing {
    background: #1e293b;
    padding: 0.25rem 0.5rem;
}

.rename-scene {
    background: transparent;
    border: none;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
    border-radius: 4px;
    flex-shrink: 0;
}

.scene-item:hover .rename-scene {
    opacity: 0.6;
}

.rename-scene:hover {
    opacity: 1 !important;
    background: rgba(56, 189, 248, 0.1);
}

.delete-scene {
    background: transparent;
    border: none;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    opacity: 0.5;
    transition: opacity 0.2s;
    border-radius: 4px;
    flex-shrink: 0;
}

.delete-scene:hover {
    opacity: 1;
    background: rgba(239, 68, 68, 0.1);
}

.empty-scenes {
    color: #6b7280;
}

.secondary {
    background: #1e293b;
    border: none;
    color: #e2e8f0;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    width: 100%;
    cursor: pointer;
    transition: background 0.2s;
}

.secondary:hover {
    background: #2d3748;
}

.small {
    font-size: 0.85rem;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
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