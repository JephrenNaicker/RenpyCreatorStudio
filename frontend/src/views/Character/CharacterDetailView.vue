<template>
    <div v-if="character" class="max-w-[1200px] mx-auto">
        <!-- Character Header -->
        <div class="flex justify-between items-center flex-wrap gap-6 mb-8 pb-6 border-b border-slate-700">
            <div class="flex items-center gap-6">
                <div class="w-[60px] h-[60px] rounded-xl" :style="{ backgroundColor: character.color }"
                    :aria-label="`Character color: ${character.color}`"></div>
                <div>
                    <h1 id="character-name" class="text-[2.5rem] font-bold text-slate-50 mb-1">{{ character.name }}
                    </h1>
                    <p v-if="character.nickname" id="character-nickname" class="text-[1.2rem] text-sky-400 italic">
                        "{{ character.nickname }}"
                    </p>
                </div>
            </div>

            <div class="flex gap-4">
                <router-link :id="`edit-character-${character.id}`" :to="`/characters/${character.id}/edit`"
                    :class="[btnBase, btnPrimary]" aria-label="Edit character">
                    <span>✏️</span>
                    Edit Character
                </router-link>
                <button id="btn-back-to-list" :class="[btnBase, btnSecondary]" @click="goBack"
                    aria-label="Go back to characters list">
                    ← Back to List
                </button>
            </div>
        </div>

        <!-- Character Info Grid -->
        <div class="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-6 mt-8">
            <!-- Basic Info Card -->
            <div :class="card">
                <h3 :class="cardTitle">Basic Information</h3>
                <div :class="infoItem">
                    <span :class="infoLabel">Name:</span>
                    <span id="detail-character-name" class="text-slate-50">{{ character.name }}</span>
                </div>
                <div v-if="character.nickname" :class="infoItem">
                    <span :class="infoLabel">Nickname:</span>
                    <span id="detail-character-nickname" class="text-slate-50">{{ character.nickname }}</span>
                </div>
                <div :class="infoItem">
                    <span :class="infoLabel">Color:</span>
                    <div class="flex items-center gap-3">
                        <span class="w-6 h-6 rounded border border-slate-600"
                            :style="{ backgroundColor: character.color }"
                            :aria-label="`Color preview: ${character.color}`"></span>
                        <span id="character-color-code" class="font-mono text-[0.9rem] text-slate-300">{{
                            character.color }}</span>
                    </div>
                </div>
                <div v-if="character.age" :class="infoItem">
                    <span :class="infoLabel">Age:</span>
                    <span id="character-age" class="text-slate-50">{{ character.age }}</span>
                </div>
                <div v-if="character.birth_date" :class="infoItem">
                    <span :class="infoLabel">Birth Date:</span>
                    <span id="character-birth-date" class="text-slate-50">{{ character.birth_date }}</span>
                </div>
                <div v-if="zodiacSign" :class="infoItem">
                    <span :class="infoLabel">Zodiac Sign:</span>
                    <span id="character-zodiac" class="inline-flex items-center gap-2 cursor-help text-slate-50"
                        :title="zodiacSign.dateRange">
                        <span class="text-[1.15rem] text-sky-400 leading-none" aria-hidden="true">{{
                            zodiacSign.symbol }}</span>
                        {{ zodiacSign.name }}
                    </span>
                </div>
            </div>

            <!-- Bio Card -->
            <div v-if="character.bio" :class="card">
                <h3 :class="cardTitle">Bio / Description</h3>
                <p id="character-bio" class="text-slate-300 leading-relaxed">{{ character.bio }}</p>
            </div>

            <!-- Expressions Card -->
            <div :class="card">
                <h3 :class="cardTitle">Expressions ({{ character.expressions?.length || 0 }})</h3>
                <div v-if="character.expressions && character.expressions.length > 0"
                    class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4">
                    <div v-for="(exp, expIndex) in character.expressions" :id="`expression-item-${expIndex}`"
                        :key="exp.name"
                        class="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors duration-200">
                        <div class="text-2xl">😀</div>
                        <div class="flex flex-col">
                            <span :id="`expression-name-${expIndex}`" class="font-medium text-slate-50">{{ exp.name
                                }}</span>
                            <span v-if="exp.outfit" :id="`expression-outfit-${expIndex}`"
                                class="text-[0.8rem] text-sky-400">{{ exp.outfit }}</span>
                        </div>
                    </div>
                </div>
                <p v-else id="no-expressions-message" :class="emptyMessage">No expressions added yet.</p>
            </div>

            <!-- Outfits Card -->
            <div :class="card">
                <h3 :class="cardTitle">Outfits ({{ character.outfits?.length || 0 }})</h3>
                <div v-if="character.outfits && character.outfits.length > 0" class="flex flex-col gap-3">
                    <div v-for="(outfit, outfitIndex) in character.outfits" :id="`outfit-item-${outfitIndex}`"
                        :key="outfit.name" class="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <span class="text-[1.2rem]">👕</span>
                        <span :id="`outfit-name-${outfitIndex}`" class="text-slate-50">{{ outfit.name }}</span>
                    </div>
                </div>
                <p v-else id="no-outfits-message" :class="emptyMessage">No outfits added yet.</p>
            </div>

            <!-- Voice Lines Card -->
            <div v-if="character.voice_lines && character.voice_lines.length > 0" :class="card">
                <h3 :class="cardTitle">Voice Lines ({{ character.voice_lines.length }})</h3>
                <div class="flex flex-col gap-3">
                    <div v-for="(voice, voiceIndex) in character.voice_lines" :id="`voice-item-${voiceIndex}`"
                        :key="voice.line_name" class="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <span :id="`voice-name-${voiceIndex}`" class="font-medium text-slate-50">{{ voice.line_name
                            }}</span>
                        <span :id="`voice-path-${voiceIndex}`" class="font-mono text-[0.85rem] text-slate-400">{{
                            voice.audio_path }}</span>
                    </div>
                </div>
            </div>

            <!-- Export Card -->
            <div :class="card">
                <h3 :class="cardTitle">Ren'Py Export</h3>
                <p class="text-slate-400 mb-6">Export this character to Ren'Py format.</p>
                <div class="flex gap-4">
                    <button id="btn-preview-export" :class="[btnBase, btnSecondary]" @click="showExportPreview"
                        aria-label="Preview Ren'Py export code">
                        Preview Code
                    </button>
                    <button id="btn-export-character" :class="[btnBase, btnPrimary]" @click="exportCharacter"
                        aria-label="Export character to .rpy file">
                        Export to .rpy
                    </button>
                </div>
            </div>
        </div>

        <!-- Export Modal -->
        <div v-if="showExportModal"
            class="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] backdrop-blur-sm"
            @click.self="closeExportModal">
            <div class="bg-slate-950 border border-slate-700 rounded-2xl w-[90%] max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden"
                role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="flex justify-between items-center p-6 border-b border-slate-700">
                    <h3 id="modal-title" class="m-0 text-[1.17rem] font-bold text-slate-50">Ren'Py Export Preview</h3>
                    <button id="btn-close-modal"
                        class="bg-transparent text-2xl text-slate-400 hover:text-slate-50 cursor-pointer p-1"
                        @click="closeExportModal" aria-label="Close modal">
                        ✕
                    </button>
                </div>
                <div class="flex-1 overflow-auto p-6">
                    <pre id="export-code-preview"
                        class="bg-slate-900 border border-slate-700 rounded-lg p-6 font-['Courier_New',monospace] text-[0.9rem] text-slate-300 leading-normal overflow-auto max-h-[400px]">{{ exportCode }}</pre>
                </div>
                <div class="flex justify-end gap-4 p-6 border-t border-slate-700">
                    <button id="btn-modal-close" :class="[btnBase, btnSecondary]" @click="closeExportModal">
                        Close
                    </button>
                    <button id="btn-copy-to-clipboard" :class="[btnBase, btnPrimary]" @click="copyToClipboard"
                        aria-label="Copy export code to clipboard">
                        Copy to Clipboard
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading State -->
    <div v-else class="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <div class="w-[50px] h-[50px] border-[3px] border-slate-700 border-t-sky-400 rounded-full animate-spin"
            role="status" aria-label="Loading"></div>
        <p id="loading-message" class="text-slate-400 text-[1.1rem]">Loading character...</p>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCharacter } from '@/services/characterService';
import { getZodiacSign } from '@/utils/zodiac';
import type { Character } from '@/utils/dummyData';

const route = useRoute();
const router = useRouter();

// --- Shared Tailwind class strings (full literals so Tailwind's scanner picks them up) ---
// Named locally (not "btn-primary" etc.) so they don't collide with the global component classes in tailwind.css.
const btnBase =
    'px-6 py-3 rounded-lg no-underline font-bold cursor-pointer flex items-center gap-2 transition-opacity hover:opacity-90';
const btnPrimary = 'bg-sky-400 text-slate-950';
const btnSecondary = 'bg-transparent border border-slate-700 text-slate-300';
const card = 'bg-slate-950 border border-slate-700 rounded-xl p-6';
const cardTitle = 'text-xl font-bold text-slate-50 mb-6 pb-3 border-b border-slate-700';
const infoItem = 'flex justify-between items-center mb-4 py-2';
const infoLabel = 'text-slate-400 font-medium';
const emptyMessage = 'text-slate-500 italic text-center py-8';

// Loaded async via characterService — starts null, populated on mount
const character = ref<Character | null>(null);

// Derived, not stored — always reflects the current birth_date
const zodiacSign = computed(() => getZodiacSign(character.value?.birth_date));

const loadCharacter = async (id: string) => {
    character.value = await getCharacter(id);
};

const showExportModal = ref(false);
const exportCode = ref('');

const goBack = () => {
    router.push('/characters');
};

const showExportPreview = () => {
    if (!character.value) return;
    const c = character.value;
    const varName = c.name.toLowerCase().replace(/\s+/g, '_');
    const expressions = (c.expressions ?? [])
        .map(e => `image ${varName} ${e.name.toLowerCase().replace(/\s+/g, '_')} = "${e.image_path}"`)
        .join('\n');

    exportCode.value = `# Ren'Py Character Definition
define ${varName} = Character(
    "${c.name}",
    color="${c.color}",
    what_prefix='"',
    what_suffix='"',
)

# Expressions
${expressions || '# No expressions defined yet'}

# Usage in script
label start:
    ${varName} "Hello, I'm ${c.name}!"`;

    showExportModal.value = true;
};

const closeExportModal = () => {
    showExportModal.value = false;
};

const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(exportCode.value);
        alert('Code copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard. Please try again.');
    }
};

const exportCharacter = () => {
    // TODO: Implement actual export functionality
    alert('Export feature coming soon!');
    showExportPreview();
};

onMounted(() => {
    const id = route.params.id as string;
    if (id) {
        loadCharacter(id);
    }
});
</script>