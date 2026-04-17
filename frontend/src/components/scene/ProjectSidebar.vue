<template>
    <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed }">
        <!-- Sidebar Header with Collapse Button -->
        <div class="sidebar-header">
            <button class="collapse-btn" @click="toggleSidebar"
                :title="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
                <span v-if="isSidebarCollapsed">☰</span>
                <span v-else>←</span>
            </button>
        </div>

        <div v-if="!isSidebarCollapsed" class="sidebar-content">
            <!-- Project Characters (roster) -->
            <div class="roster-header">
                <h3>Characters</h3>
                <button class="icon-button" @click="$emit('add-character')" title="Add character to project">
                    <span class="text-lg">+</span>
                </button>
            </div>
            <div class="character-list">
                <div v-for="char in characters" :key="char.id" class="character-item"
                    :class="{ active: selectedCharacterId === char.id }" @click="$emit('select-character', char)">
                    <span class="color-dot" :style="{ background: char.color }" />
                    <span class="character-name">{{ char.name }}</span>
                    <span class="expression-count">{{ char.expressions?.length || 0 }} 😀</span>
                    <button class="remove-character" @click.stop="confirmRemoveCharacter(char)"
                        title="Remove from project">
                        <span>✕</span>
                    </button>
                </div>
            </div>

            <!-- Scenes -->
            <div class="sidebar-section">
                <div class="section-header">
                    <h4>Scenes</h4>
                    <button class="icon-button" @click="addNewScene" title="Add new scene">
                        <span class="text-lg">+</span>
                    </button>
                </div>

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
                            <div class="scene-main">
                                <!-- Name row -->
                                <div class="scene-top-row">
                                    <div class="scene-content" @click="$emit('select-scene', scene)"
                                        @dblclick.stop="startEditing(scene)">
                                        <span class="scene-icon">🎬</span>
                                        <span class="scene-name">
                                            {{ scene.name || 'Untitled Scene' }}
                                            <span v-if="dirtySceneIds?.has(scene.id)" class="dirty-indicator"
                                                title="Unsaved changes">*</span>
                                        </span>
                                    </div>
                                    <div class="scene-actions">
                                        <button class="rename-scene" @click.stop="startEditing(scene)"
                                            title="Rename scene">
                                            <span>✎</span>
                                        </button>
                                        <button class="delete-scene" @click.stop="confirmDeleteScene(scene)"
                                            title="Delete scene">
                                            <span>✕</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- Cast strip -->
                                <div class="cast-strip">
                                    <!-- Assigned character dots -->
                                    <div class="cast-dots">
                                        <span v-for="charId in scene.character_ids" :key="charId" class="cast-dot"
                                            :style="{ background: getCharacterColor(charId) }"
                                            :title="getCharacterName(charId)" />
                                        <span v-if="scene.character_ids.length === 0" class="cast-empty">
                                            No cast
                                        </span>
                                    </div>

                                    <!-- Add character to scene button -->
                                    <button class="cast-add-btn" @click.stop="togglePicker(scene.id)"
                                        :title="pickerSceneId === scene.id ? 'Close picker' : 'Assign characters to scene'">
                                        <span>{{ pickerSceneId === scene.id ? '−' : '+' }}</span>
                                    </button>
                                </div>

                                <!-- Character picker popover -->
                                <div v-if="pickerSceneId === scene.id" class="char-picker" @click.stop>
                                    <input v-model="pickerSearch" class="picker-search"
                                        placeholder="Search characters..." @click.stop />
                                    <div class="picker-list">
                                        <label v-for="char in filteredPickerCharacters" :key="char.id"
                                            class="picker-row">
                                            <input type="checkbox" :checked="scene.character_ids.includes(char.id)"
                                                @change="toggleCharacterInScene(scene, char.id)"
                                                class="picker-checkbox" />
                                            <span class="cast-dot" :style="{ background: char.color }" />
                                            <span class="picker-name">{{ char.name }}</span>
                                            <span v-if="char.nickname" class="picker-nick">"{{ char.nickname }}"</span>
                                        </label>
                                        <p v-if="filteredPickerCharacters.length === 0" class="picker-empty">
                                            No characters found
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <div v-else class="empty-scenes">
                    <p class="text-sm text-gray-500 text-center py-4">No scenes yet. Click + to add one.</p>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
            <div class="modal-content">
                <h4 class="text-lg font-bold mb-4">
                    {{ charToRemove ? 'Remove Character' : 'Delete Scene' }}
                </h4>
                <p class="mb-6">
                    Are you sure you want to
                    <template v-if="charToRemove">
                        remove "{{ charToRemove.name }}" from the project? They will also be unassigned from all scenes.
                    </template>
                    <template v-else>
                        delete "{{ sceneToDelete?.name || 'Untitled Scene' }}"? This action cannot be undone.
                    </template>
                </p>
                <div class="flex justify-end gap-3">
                    <button class="btn-secondary" @click="cancelDelete">Cancel</button>
                    <button class="btn-danger" @click="charToRemove ? confirmAction() : deleteScene()">
                        {{ charToRemove ? 'Remove' : 'Delete' }}
                    </button>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { Character, Scene } from '@/utils/dummyData';

interface Props {
    characters: Character[];
    scenes?: Scene[];
    selectedCharacterId?: string | null;
    selectedSceneId?: string | null;
    dirtySceneIds?: Set<string>;
}

interface Emits {
    (e: 'select-character', character: Character): void;
    (e: 'add-character'): void;
    (e: 'remove-character', characterId: string): void;
    (e: 'select-scene', scene: Scene): void;
    (e: 'add-scene', scene: Scene): void;
    (e: 'delete-scene', sceneId: string): void;
    (e: 'update-scene', scene: Scene): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ── Sidebar collapse state ─────────────────────────────────
const isSidebarCollapsed = ref(false);

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// ── Editing state ──────────────────────────────────────────
const editingSceneId = ref<string | null>(null);
const editingSceneName = ref('');
const editingSceneOriginalName = ref('');
const sceneInput = ref<HTMLInputElement | null>(null);
const didCommit = ref(false);

// ── Delete modal ───────────────────────────────────────────
const showDeleteModal = ref(false);
const sceneToDelete = ref<Scene | null>(null);

const confirmAction = () => {
    if (charToRemove.value) {
        emit('remove-character', charToRemove.value.id);
        charToRemove.value = null;
        showDeleteModal.value = false;
    } else {
        deleteScene();
    }
};

// ── Remove character from project ─────────────────────────
const charToRemove = ref<Character | null>(null);

const confirmRemoveCharacter = (char: Character) => {
    charToRemove.value = char;
    showDeleteModal.value = true;
};

// Update deleteScene to handle both cases:
const deleteScene = () => {
    if (charToRemove.value) {
        emit('remove-character', charToRemove.value.id);
        charToRemove.value = null;
        showDeleteModal.value = false;
        return;
    }
    if (sceneToDelete.value) {
        emit('delete-scene', sceneToDelete.value.id);
        cancelDelete();
    }
};
// ── Character picker popover ───────────────────────────────
const pickerSceneId = ref<string | null>(null);
const pickerSearch = ref('');

const filteredPickerCharacters = computed(() => {
    const q = pickerSearch.value.toLowerCase();
    return q
        ? props.characters.filter(c => c.name.toLowerCase().includes(q) || c.nickname?.toLowerCase().includes(q))
        : props.characters;
});

const togglePicker = (sceneId: string) => {
    if (pickerSceneId.value === sceneId) {
        pickerSceneId.value = null;
        pickerSearch.value = '';
    } else {
        pickerSceneId.value = sceneId;
        pickerSearch.value = '';
    }
};

const toggleCharacterInScene = (scene: Scene, charId: string) => {
    const already = scene.character_ids.includes(charId);
    const updated: Scene = {
        ...scene,
        character_ids: already
            ? scene.character_ids.filter(id => id !== charId)
            : [...scene.character_ids, charId]
    };
    emit('update-scene', updated);
};

// ── Helpers ────────────────────────────────────────────────
const getCharacterColor = (charId: string) =>
    props.characters.find(c => c.id === charId)?.color ?? '#475569';

const getCharacterName = (charId: string) =>
    props.characters.find(c => c.id === charId)?.name ?? 'Unknown';

// ── Scene CRUD ─────────────────────────────────────────────
const addNewScene = () => {
    const now = new Date().toISOString();
    const newScene: Scene = {
        id: Date.now().toString(),
        name: 'New Scene',
        project_id: props.scenes?.[0]?.project_id || 'default-project',
        character_ids: [],
        dialogue_lines: [],
        created_at: now,
        updated_at: now
    };
    emit('add-scene', newScene);
    emit('select-scene', newScene);
    nextTick(() => startEditing(newScene));
};

const startEditing = (scene: Scene) => {
    pickerSceneId.value = null; // close any open picker
    didCommit.value = false;
    editingSceneId.value = scene.id;
    editingSceneName.value = scene.name || '';
    editingSceneOriginalName.value = scene.name || '';
    nextTick(() => {
        const el = Array.isArray(sceneInput.value) ? sceneInput.value[0] : sceneInput.value;
        el?.focus();
        el?.select();
    });
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
    editingSceneOriginalName.value = '';
};

const handleEnterKey = (scene: Scene) => {
    if (didCommit.value) return;
    didCommit.value = true;
    commitSave(scene);
};

const handleBlur = (scene: Scene) => {
    if (didCommit.value) return;
    didCommit.value = true;
    commitSave(scene);
};

const cancelEdit = () => {
    if (didCommit.value) return;
    didCommit.value = true;
    const scene = props.scenes?.find(s => s.id === editingSceneId.value);
    if (scene && editingSceneOriginalName.value === 'New Scene') {
        emit('delete-scene', scene.id);
    }
    editingSceneId.value = null;
    editingSceneName.value = '';
    editingSceneOriginalName.value = '';
};

const confirmDeleteScene = (scene: Scene) => {
    sceneToDelete.value = scene;
    showDeleteModal.value = true;
};

const cancelDelete = () => {
    showDeleteModal.value = false;
    sceneToDelete.value = null;
};

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

/* Sidebar Header */
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

/* Hide content when collapsed */
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

/* Rest of your existing styles remain the same */
.roster-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.roster-header h3 {
    margin: 0;
    color: #f8fafc;
}

.remove-character {
    background: transparent;
    border: none;
    padding: 0.2rem 0.35rem;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #64748b;
    opacity: 0;
    transition: all 0.2s;
    flex-shrink: 0;
}

.character-item:hover .remove-character {
    opacity: 1;
}

.remove-character:hover {
    color: #f87171;
    background: rgba(239, 68, 68, 0.1);
}

.roster-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.roster-header h3 {
    margin: 0;
    color: #f8fafc;
}

h4 {
    margin-bottom: 0;
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
    color: #e2e8f0;
}

.expression-count {
    font-size: 0.8rem;
    opacity: 0.7;
    flex-shrink: 0;
}

/* ── Scenes section ── */
.sidebar-section {
    margin-top: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid #334155;
    flex: 1;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
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
    border-radius: 6px;
    font-size: 0.9rem;
    transition: all 0.2s;
    background: #0f172a;
    border: 1px solid transparent;
}

.scene-item:hover {
    background: #1e293b;
}

.scene-item.active {
    background: rgba(56, 189, 248, 0.1);
    border-color: rgba(56, 189, 248, 0.4);
}

/* ── Scene main layout ── */
.scene-main {
    display: flex;
    flex-direction: column;
}

.scene-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.5rem 0.25rem;
}

.scene-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    overflow: hidden;
    cursor: pointer;
}

.scene-icon {
    opacity: 0.7;
    flex-shrink: 0;
}

.scene-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #e2e8f0;
}

.dirty-indicator {
    color: #38bdf8;
    font-weight: bold;
    margin-left: 2px;
}

.scene-actions {
    display: flex;
    gap: 0.25rem;
    opacity: 0;
    transition: opacity 0.2s;
    flex-shrink: 0;
}

.scene-item:hover .scene-actions {
    opacity: 1;
}

.rename-scene,
.delete-scene {
    background: transparent;
    border: none;
    padding: 0.2rem 0.35rem;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.85rem;
    transition: all 0.2s;
}

.rename-scene {
    color: #64748b;
}

.rename-scene:hover {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
}

.delete-scene {
    color: #64748b;
}

.delete-scene:hover {
    color: #f87171;
    background: rgba(239, 68, 68, 0.1);
}

/* ── Cast strip ── */
.cast-strip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.25rem 0.5rem 0.5rem;
}

.cast-dots {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex: 1;
    flex-wrap: wrap;
}

.cast-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
    display: inline-block;
}

.cast-empty {
    font-size: 0.75rem;
    color: #475569;
    font-style: italic;
}

.cast-add-btn {
    background: #1e293b;
    border: 1px solid #334155;
    color: #94a3b8;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    font-size: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s;
    line-height: 1;
}

.cast-add-btn:hover {
    background: #2d3748;
    color: #38bdf8;
    border-color: #38bdf8;
}

/* ── Character picker popover ── */
.char-picker {
    margin: 0 0.5rem 0.5rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    overflow: hidden;
}

.picker-search {
    width: 100%;
    background: #0f172a;
    border: none;
    border-bottom: 1px solid #334155;
    padding: 0.5rem 0.75rem;
    color: #f8fafc;
    font-size: 0.85rem;
    outline: none;
    box-sizing: border-box;
}

.picker-search::placeholder {
    color: #475569;
}

.picker-list {
    max-height: 180px;
    overflow-y: auto;
    padding: 0.25rem 0;
}

.picker-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    transition: background 0.15s;
}

.picker-row:hover {
    background: rgba(255, 255, 255, 0.05);
}

.picker-checkbox {
    accent-color: #38bdf8;
    flex-shrink: 0;
}

.picker-name {
    color: #e2e8f0;
    font-size: 0.85rem;
    flex: 1;
}

.picker-nick {
    color: #64748b;
    font-size: 0.75rem;
    font-style: italic;
}

.picker-empty {
    color: #475569;
    font-size: 0.8rem;
    text-align: center;
    padding: 0.75rem;
}

/* ── Scene edit input ── */
.scene-edit {
    flex: 1;
    padding: 0.5rem;
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
    box-sizing: border-box;
}

.scene-input:focus {
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

/* ── Empty state ── */
.empty-scenes {
    color: #6b7280;
}

/* ── Modal ── */
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