<template>
    <div v-if="project" class="max-w-[1400px] mx-auto p-8 px-4">
        <!-- Project Header -->
        <div class="flex justify-between items-start mb-8 pb-6 border-b border-gray-700 flex-wrap gap-6">
            <div class="header-left">
                <h1 class="text-4xl text-slate-50 mb-2">{{ project.name }}</h1>
                <div class="flex items-center gap-3 flex-wrap">
                    <span v-for="tag in project.tags" :key="tag"
                        class="bg-sky-400/20 text-sky-400 px-3 py-1 rounded-full text-sm font-medium">
                        {{ tag }}
                    </span>
                    <span class="text-slate-400 text-sm">Created {{ formatDate(project.created_at) }}</span>
                </div>
            </div>

            <div class="flex gap-4 flex-wrap">
                <router-link :to="`/projects/${project.id}/scenes`" class="btn-primary">
                    📝 Open Scene Editor
                </router-link>
                <router-link :to="`/projects/${project.id}/edit`" class="btn-secondary">
                    ✏️ Edit Project
                </router-link>
                <button class="btn-danger" @click="deleteProject">
                    🗑️ Delete
                </button>
            </div>
        </div>

        <!-- Project Content -->
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
            <!-- Left Column -->
            <div class="flex flex-col gap-6">
                <!-- Project Overview -->
                <div class="card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2">📖 Project Overview</h3>
                    <p class="text-slate-300 leading-relaxed mb-6">{{ project.main_plot }}</p>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <div class="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                            <span class="text-3xl font-bold text-sky-400">{{ characterCount }}</span>
                            <span class="text-sm text-slate-400 mt-1">Characters</span>
                        </div>
                        <div class="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                            <span class="text-3xl font-bold text-sky-400">{{ sceneCount }}</span>
                            <span class="text-sm text-slate-400 mt-1">Scenes</span>
                        </div>
                        <div class="flex flex-col items-center p-4 bg-white/5 rounded-lg">
                            <span class="text-3xl font-bold text-sky-400">{{ dialogueLines }}</span>
                            <span class="text-sm text-slate-400 mt-1">Dialogue Lines</span>
                        </div>
                    </div>
                </div>

                <!-- Main Character -->
                <div v-if="mainCharacter" class="card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2">🌟 Main Character</h3>
                    <div class="flex items-center gap-4 p-4 bg-white/5 rounded-lg border-l-4"
                        :style="{ borderLeftColor: mainCharacter.color }">
                        <div class="w-10 h-10 rounded-lg" :style="{ backgroundColor: mainCharacter.color }"></div>
                        <div class="flex-1">
                            <h4 class="text-lg text-slate-50 mb-1">{{ mainCharacter.name }}</h4>
                            <p v-if="mainCharacter.nickname" class="text-sky-400 text-sm italic mb-2">
                                "{{ mainCharacter.nickname }}"
                            </p>
                            <p class="text-slate-400 text-sm mb-2">
                                {{ mainCharacter.expressions?.length || 0 }} expressions •
                                {{ mainCharacter.outfits?.length || 0 }} outfits
                            </p>
                            <p class="text-slate-300 text-sm leading-relaxed">{{ truncateText(mainCharacter.bio, 120) }}
                            </p>
                        </div>
                        <router-link :to="`/characters/${mainCharacter.id}`" class="btn-small bg-sky-400 text-gray-900">
                            View
                        </router-link>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2">📅 Recent Activity</h3>
                    <div class="flex flex-col gap-4">
                        <div v-for="activity in recentActivity" :key="activity.id"
                            class="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
                            <span class="text-xl opacity-80">{{ activity.icon }}</span>
                            <div class="flex-1">
                                <p class="text-slate-50 text-sm mb-1">{{ activity.text }}</p>
                                <span class="text-slate-400 text-xs">{{ activity.time }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="flex flex-col gap-6">
                <!-- Project Characters -->
                <div class="card">
                    <div class="flex justify-between items-center mb-5">
                        <h3 class="text-xl text-slate-50 flex items-center gap-2">👥 Project Characters</h3>
                        <CharacterPickerDropdown :characters="allCharacters"
                            :selected-character-ids="projectCharacterIds" button-label="Add Character"
                            :show-label="true" multi-select @create="handleCreateCharacter"
                            @update:selectedIds="handleAddCharactersToProject" />
                    </div>

                    <div v-if="projectCharacters.length > 0" class="flex flex-col gap-3">
                        <div v-for="character in projectCharacters" :key="character.id"
                            class="flex justify-between items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                            <div class="flex items-center gap-3">
                                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: character.color }"></div>
                                <span class="text-slate-50 font-medium">{{ character.name }}</span>
                                <span v-if="character.nickname" class="text-slate-400 text-sm italic">
                                    ({{ character.nickname }})
                                </span>
                            </div>
                            <div class="flex gap-2">
                                <span class="bg-sky-400/10 text-sky-400 px-2 py-1 rounded-full text-xs">😀 {{
                                    character.expressions?.length || 0 }}</span>
                                <span class="bg-sky-400/10 text-sky-400 px-2 py-1 rounded-full text-xs">👕 {{
                                    character.outfits?.length || 0 }}</span>
                            </div>
                        </div>
                    </div>
                    <p v-else class="text-slate-500 italic text-center py-8">No characters assigned to this project yet.
                    </p>
                </div>

                <!-- Quick Actions -->
                <div class="card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2">⚡ Quick Actions</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <button @click="startDialogue"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5">
                            <span class="text-3xl">💬</span>
                            <span class="text-sm text-center">Write Dialogue</span>
                        </button>
                        <button @click="addScene"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5">
                            <span class="text-3xl">🎬</span>
                            <span class="text-sm text-center">Add Scene</span>
                        </button>
                        <button @click="exportProject"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5">
                            <span class="text-3xl">📤</span>
                            <span class="text-sm text-center">Export Project</span>
                        </button>
                        <button @click="manageAssets"
                            class="flex flex-col items-center gap-3 p-6 bg-white/5 border border-gray-700 rounded-xl text-slate-300 hover:bg-sky-400/10 hover:border-sky-400 hover:text-slate-50 transition-all hover:-translate-y-0.5">
                            <span class="text-3xl">🖼️</span>
                            <span class="text-sm text-center">Manage Assets</span>
                        </button>
                    </div>
                </div>

                <!-- Export Status -->
                <div class="card">
                    <h3 class="text-xl text-slate-50 mb-5 flex items-center gap-2">📊 Export Status</h3>
                    <div class="flex flex-col gap-3 mb-6">
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span class="text-slate-300 text-sm">Ren'Py Script:</span>
                            <span
                                class="text-sm font-medium px-3 py-1 rounded-full bg-green-500/20 text-green-400">Ready</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span class="text-slate-300 text-sm">Character Definitions:</span>
                            <span
                                class="text-sm font-medium px-3 py-1 rounded-full bg-green-500/20 text-green-400">Ready</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span class="text-slate-300 text-sm">Asset References:</span>
                            <span class="text-sm font-medium px-3 py-1 rounded-full bg-red-500/20 text-red-400">Missing
                                3</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                            <span class="text-slate-300 text-sm">Scene Transitions:</span>
                            <span
                                class="text-sm font-medium px-3 py-1 rounded-full bg-amber-500/20 text-amber-400">Pending</span>
                        </div>
                    </div>
                    <button class="btn-primary w-full justify-center" @click="runExport">
                        🚀 Export Complete Project
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div v-else class="max-w-[1400px] mx-auto p-8 px-4">
        <div class="card">
            <h3 class="text-xl text-slate-50 mb-4">Project Not Found</h3>
            <p class="text-slate-400 mb-4">The project you're looking for doesn't exist.</p>
            <router-link to="/projects" class="btn-primary inline-block">Back to Projects</router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CharacterPickerDropdown from '@/components/character/CharacterPickerDropdown.vue';
import {
    dummyProjects,
    dummyCharacters,
    dummyScenes,
    type Character,
} from '@/utils/dummyData';

const route = useRoute();
const router = useRouter();

// Find project by route param
const project = computed(() =>
    dummyProjects.find(p => p.id === route.params.id) ?? dummyProjects[0]!
);

// Derive main character from project
const mainCharacter = computed(() =>
    project.value.main_character_id
        ? dummyCharacters.find(c => c.id === project.value.main_character_id) ?? null
        : null
);

// All characters in the project roster
const projectCharacters = computed(() => dummyCharacters);

// Scenes belonging to this project
const projectScenes = computed(() =>
    dummyScenes.filter(s => s.project_id === project.value.id)
);

// Derived stats
const characterCount = computed(() => projectCharacters.value.length);
const sceneCount = computed(() => projectScenes.value.length);
const dialogueLines = computed(() =>
    projectScenes.value.reduce((total, scene) => total + scene.dialogue_lines.length, 0)
);

// Recent activity stays static for now — will come from API later
const recentActivity = ref([
    { id: 1, icon: '💬', text: 'Added dialogue scene "First Encounter"', time: '2 hours ago' },
    { id: 2, icon: '👤', text: 'Created character "Professor Morgan"', time: '1 day ago' },
    { id: 3, icon: '🎬', text: 'Updated scene transitions in Chapter 2', time: '2 days ago' },
    { id: 4, icon: '📝', text: 'Edited main plot description', time: '3 days ago' }
]);

onMounted(() => {
    console.log('Loading project:', route.params.id);
});

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
};

const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return '';
    if (!text || text.length <= maxLength) return text ?? '';
    return text.substring(0, maxLength) + '...';
};

const deleteProject = () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        // TODO: API call
        router.push('/projects');
    }
};

const allCharacters = ref<Character[]>(dummyCharacters);

// Track project character IDs
const projectCharacterIds = computed(() =>
    projectCharacters.value.map(c => c.id)
);

// Handle creating a new character
const handleCreateCharacter = async (characterData: Omit<Character, 'id'>) => {
    // Generate a new ID (in real app, this would be from API)
    const newCharacter: Character = {
        ...characterData,
        id: `char_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Add to all characters
    allCharacters.value.push(newCharacter);

    // Auto-add to project characters
    // In a real app, you'd make an API call to associate the character with the project
    console.log('Created new character:', newCharacter);

    // You might want to show a success message
    alert(`Character "${newCharacter.name}" created successfully!`);
};

// Handle adding characters to project
const handleAddCharactersToProject = (characterIds: string[]) => {
    // Get currently selected IDs vs previously selected IDs
    const currentIds = projectCharacters.value.map(c => c.id);
    const addedIds = characterIds.filter(id => !currentIds.includes(id));
    const removedIds = currentIds.filter(id => !characterIds.includes(id));

    // Handle additions
    if (addedIds.length > 0) {
        const addedCharacters = allCharacters.value.filter(c => addedIds.includes(c.id));
        console.log('Added characters to project:', addedCharacters);
        // In a real app, you'd make an API call to associate these characters
        alert(`Added ${addedCharacters.map(c => c.name).join(', ')} to project`);
    }

    // Handle removals
    if (removedIds.length > 0) {
        const removedCharacters = allCharacters.value.filter(c => removedIds.includes(c.id));
        console.log('Removed characters from project:', removedCharacters);
        // In a real app, you'd make an API call to remove these associations
        alert(`Removed ${removedCharacters.map(c => c.name).join(', ')} from project`);
    }
};



const startDialogue = () => router.push(`/projects/${project.value.id}/dashboard`);
const addScene = () => router.push(`/projects/${project.value.id}/dashboard`);
const exportProject = () => alert('Export feature coming soon!');
const manageAssets = () => alert('Asset management coming soon!');
const runExport = () => alert('Export feature coming soon!');
</script>