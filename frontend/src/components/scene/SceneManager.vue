<!-- frontend/src/components/sidebar/SceneManager.vue -->
<template>
    <div class="flex flex-col gap-3" id="scene-manager">
        <!-- Section Header -->
        <div class="flex justify-between items-center" id="scene-manager-header">
            <h4 class="m-0 font-bold text-slate-50 text-sm tracking-wide">Scenes</h4>
            <button
                class="bg-slate-800 border border-slate-700 text-slate-200 w-7 h-7 rounded-md flex items-center justify-center cursor-pointer transition-all hover:bg-slate-700 hover:border-slate-600 hover:scale-105"
                @click="$emit('add-scene')" title="Add new scene" id="add-scene-btn">
                <span class="text-base font-semibold">+</span>
            </button>
        </div>

        <!-- Scene List -->
        <div v-if="scenes && scenes.length > 0" class="flex flex-col gap-2" id="scene-list">
            <div v-for="scene in scenes" :key="scene.id"
                class="group rounded-lg text-sm transition-all bg-slate-900 border border-transparent hover:bg-slate-800/80"
                :class="{
                    '!bg-sky-400/10 !border-sky-400/40': selectedSceneId === scene.id,
                    'ring-1 ring-sky-400': editingSceneId === scene.id
                }" :id="`scene-item-${scene.id}`">

                <!-- Editing mode -->
                <div v-if="editingSceneId === scene.id" class="p-2 flex-1" :id="`scene-edit-${scene.id}`">
                    <input ref="sceneInput" v-model="editingSceneName" type="text"
                        class="w-full bg-slate-950 border border-sky-400 rounded px-2.5 py-1 text-slate-50 text-xs outline-none focus:ring-2 focus:ring-sky-400/20"
                        placeholder="Scene name" @keyup.enter="handleEnterKey(scene)" @keyup.escape="cancelEdit"
                        @blur="handleBlur(scene)" maxlength="50" :id="`scene-input-${scene.id}`" />
                </div>

                <!-- Display mode -->
                <template v-else>
                    <div class="flex flex-col" :id="`scene-main-${scene.id}`">
                        <div class="flex items-center justify-between px-2.5 pt-2 pb-1"
                            :id="`scene-top-row-${scene.id}`">
                            <div class="flex items-center gap-2 flex-1 overflow-hidden cursor-pointer"
                                @click="$emit('select-scene', scene)" @dblclick.stop="startEditing(scene)"
                                :id="`scene-content-${scene.id}`">
                                <span class="opacity-70 shrink-0 text-xs">🎬</span>
                                <span class="truncate text-slate-200 text-xs font-medium"
                                    :id="`scene-name-${scene.id}`">
                                    {{ scene.name || 'Untitled Scene' }}
                                    <span v-if="dirtySceneIds?.has(scene.id)" class="text-sky-400 font-bold ml-0.5"
                                        title="Unsaved changes">*</span>
                                </span>
                            </div>
                            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                :id="`scene-actions-${scene.id}`">
                                <button
                                    class="bg-transparent border-none px-1.5 py-0.5 cursor-pointer rounded text-xs text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-colors"
                                    @click.stop="startEditing(scene)" title="Rename scene"
                                    :id="`rename-scene-${scene.id}`">
                                    <span>✎</span>
                                </button>
                                <button
                                    class="bg-transparent border-none px-1.5 py-0.5 cursor-pointer rounded text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    @click.stop="$emit('delete-scene', scene.id)" title="Delete scene"
                                    :id="`delete-scene-${scene.id}`">
                                    <span>✕</span>
                                </button>
                            </div>
                        </div>

                        <!-- Cast strip for scene characters -->
                        <div class="flex items-center gap-1.5 px-2.5 pb-2 pt-1" :id="`cast-strip-${scene.id}`">
                            <div class="flex items-center gap-1 flex-1 flex-wrap" :id="`cast-dots-${scene.id}`">
                                <span v-for="charId in scene.character_ids" :key="charId"
                                    class="w-2.5 h-2.5 rounded-full border border-white/15 shrink-0 inline-block transition-transform hover:scale-125"
                                    :style="{ background: getCharacterColor(charId) }"
                                    :title="getCharacterName(charId)" />
                                <span v-if="scene.character_ids.length === 0" class="text-xs text-slate-500 italic"
                                    :id="`cast-empty-${scene.id}`">
                                    No cast
                                </span>
                            </div>

                            <!-- Add character to scene button -->
                            <button
                                class="bg-slate-800 border border-slate-700 text-slate-400 w-5 h-5 rounded text-xs flex items-center justify-center cursor-pointer shrink-0 transition-all leading-none hover:bg-slate-700 hover:text-sky-400 hover:border-sky-400"
                                @click.stop="togglePicker(scene.id)"
                                :title="pickerSceneId === scene.id ? 'Close picker' : 'Assign characters to scene'"
                                :id="`toggle-picker-btn-${scene.id}`">
                                <span>{{ pickerSceneId === scene.id ? '−' : '+' }}</span>
                            </button>
                        </div>

                        <!-- Character picker popover -->
                        <div v-if="pickerSceneId === scene.id"
                            class="mx-2 mb-2 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-lg"
                            @click.stop :id="`char-picker-${scene.id}`">
                            <input v-model="pickerSearch"
                                class="w-full bg-slate-900 border-b border-slate-700 px-3 py-1.5 text-slate-50 text-xs outline-none placeholder:text-slate-500 focus:border-sky-400"
                                placeholder="Search characters..." @click.stop :id="`picker-search-${scene.id}`" />
                            <div class="max-h-44 overflow-y-auto py-1" :id="`picker-list-${scene.id}`">
                                <label v-for="char in filteredPickerCharacters" :key="char.id"
                                    class="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/5 transition-colors"
                                    :id="`picker-row-${char.id}`">
                                    <input type="checkbox" :checked="scene.character_ids.includes(char.id)"
                                        @change="$emit('update-scene', { ...scene, character_ids: toggleCharacterInScene(scene, char.id) })"
                                        class="accent-sky-400 shrink-0 cursor-pointer" />
                                    <span class="w-2.5 h-2.5 rounded-full border border-white/15 shrink-0 inline-block"
                                        :style="{ background: char.color }" />
                                    <span class="text-slate-200 text-xs flex-1 truncate">{{ char.name }}</span>
                                    <span v-if="char.nickname" class="text-slate-500 text-[11px] italic truncate">"{{
                                        char.nickname }}"</span>
                                </label>
                                <p v-if="filteredPickerCharacters.length === 0"
                                    class="text-slate-500 text-xs text-center p-3 m-0" :id="`picker-empty-${scene.id}`">
                                    No characters found
                                </p>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <div v-else class="text-slate-500 text-xs text-center py-4" id="empty-scenes">
            No scenes yet. Click + to add one.
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { Character, Scene } from '@/utils/dummyData';

interface Props {
    scenes: Scene[];
    characters: Character[];
    selectedSceneId?: string | null;
    dirtySceneIds?: Set<string>;
}

interface Emits {
    (e: 'select-scene', scene: Scene): void;
    (e: 'add-scene'): void;
    (e: 'delete-scene', sceneId: string): void;
    (e: 'update-scene', scene: Scene): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// ── Editing state ──
const editingSceneId = ref<string | null>(null);
const editingSceneName = ref('');
const editingSceneOriginalName = ref('');
const sceneInput = ref<HTMLInputElement | null>(null);
const didCommit = ref(false);

// ── Character picker popover ──
const pickerSceneId = ref<string | null>(null);
const pickerSearch = ref('');

const filteredPickerCharacters = computed(() => {
    const q = pickerSearch.value.toLowerCase();
    return q
        ? props.characters.filter(c => c.name.toLowerCase().includes(q) || c.nickname?.toLowerCase().includes(q))
        : props.characters;
});

// ── Helpers ──
const getCharacterColor = (charId: string) =>
    props.characters.find(c => c.id === charId)?.color ?? '#475569';

const getCharacterName = (charId: string) =>
    props.characters.find(c => c.id === charId)?.name ?? 'Unknown';

const toggleCharacterInScene = (scene: Scene, charId: string) => {
    const already = scene.character_ids.includes(charId);
    return already
        ? scene.character_ids.filter(id => id !== charId)
        : [...scene.character_ids, charId];
};

const togglePicker = (sceneId: string) => {
    if (pickerSceneId.value === sceneId) {
        pickerSceneId.value = null;
        pickerSearch.value = '';
    } else {
        pickerSceneId.value = sceneId;
        pickerSearch.value = '';
    }
};

// ── Scene editing ──
const startEditing = (scene: Scene) => {
    pickerSceneId.value = null;
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
</script>