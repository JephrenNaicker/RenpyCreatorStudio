<!-- frontend/src/components/character/CharacterSetupView.vue -->
<template>
    <div class="max-w-[1200px] mx-auto p-6">
        <!-- Header Section -->
        <div class="flex justify-between items-center flex-wrap gap-6 mb-8 pb-6 border-b border-slate-700">
            <div>
                <h1 class="text-[2.5rem] font-bold text-slate-50 mb-1">Character Setup & Bulk Preview</h1>
                <p class="text-[1.1rem] text-slate-400">
                    Manage and preview the collective Ren'Py script initialization code for all project characters.
                </p>
            </div>
            <div class="flex gap-4">
                <button :class="[btnBase, btnSecondary]" @click="refreshPreview" aria-label="Refresh code preview">
                    🔄 Refresh Preview
                </button>
                <button :class="[btnBase, btnPrimary]" @click="exportAll" aria-label="Export all characters to .rpy">
                    📁 Export All to .rpy
                </button>
            </div>
        </div>

        <!-- Summary Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div :class="card">
                <span class="text-slate-400 text-sm font-medium">Total Characters</span>
                <p class="text-3xl font-bold text-slate-50 mt-1">{{ characters.length }}</p>
            </div>
            <div :class="card">
                <span class="text-slate-400 text-sm font-medium">Expressions Mapped</span>
                <p class="text-3xl font-bold text-sky-400 mt-1">{{ totalExpressionsCount }}</p>
            </div>
            <div :class="card">
                <span class="text-slate-400 text-sm font-medium">Voice Lines Mapped</span>
                <p class="text-3xl font-bold text-violet-400 mt-1">{{ totalVoiceLinesCount }}</p>
            </div>
            <div :class="card">
                <span class="text-slate-400 text-sm font-medium">Export Status</span>
                <p class="text-3xl font-bold text-emerald-400 mt-1">Ready</p>
            </div>
        </div>

        <!-- Bulk Code Preview Box -->
        <div :class="card">
            <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
                <h3 :class="cardTitle" class="!mb-0 !pb-0 !border-0">Bulk Ren'Py Script Output (`characters_setup.rpy`)
                </h3>
                <button :class="[btnBase, btnSecondary, '!py-2 !px-4 text-sm']" @click="copyToClipboard"
                    aria-label="Copy bulk export code to clipboard">
                    📋 Copy to Clipboard
                </button>
            </div>
            <p class="text-slate-400 text-sm mb-4">
                This script initializes all characters, configures text tags, and binds expression image assets and
                voice lines for your Ren'Py game engine project.
            </p>
            <div class="relative">
                <pre id="bulk-export-code-preview"
                    class="bg-slate-900 border border-slate-700 rounded-lg p-6 font-['Courier_New',monospace] text-[0.9rem] text-slate-300 leading-normal overflow-auto max-h-[550px]">{{ bulkExportCode }}</pre>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { getCharacters } from '@/services/characterService';
import type { Character } from '@/utils/dummyData';

// --- Reusable Tailwind styling constants matching your project design ---
const btnBase =
    'px-6 py-3 rounded-lg no-underline font-bold cursor-pointer flex items-center gap-2 transition-opacity hover:opacity-90';
const btnPrimary = 'bg-sky-400 text-slate-950';
const btnSecondary = 'bg-transparent border border-slate-700 text-slate-300';
const card = 'bg-slate-950 border border-slate-700 rounded-xl p-6';
const cardTitle = 'text-xl font-bold text-slate-50 mb-6 pb-3 border-b border-slate-700';

const characters = ref<Character[]>([]);

// Count total expressions across all characters for summary stats
const totalExpressionsCount = computed(() => {
    return characters.value.reduce((acc, char) => acc + (char.expressions?.length || 0), 0);
});

// Count total voice lines across all characters for summary stats
const totalVoiceLinesCount = computed(() => {
    return characters.value.reduce((acc, char) => acc + (char.voice_lines?.length || 0), 0);
});

// Load all project characters
const loadCharacters = async () => {
    try {
        const data = await getCharacters();
        characters.value = data || [];
        showExportPreview();
    } catch (err) {
        console.error('Failed to load characters for setup panel:', err);
    }
};

const bulkExportCode = ref('');

// Generate bulk export code for all project characters including voice lines
const showExportPreview = () => {
    if (!characters.value.length) {
        bulkExportCode.value = '# No characters found in this project.';
        return;
    }

    let codeOutput = `# ==========================================
# Ren'Py Bulk Character, Asset & Voice Setup Script
# Automatically generated by RenpyCreatorStudio
# ==========================================\n\n`;

    // 1. Character Definitions
    codeOutput += `# --- Character Definitions ---\n`;
    characters.value.forEach((c) => {
        const varName = c.name.toLowerCase().replace(/\s+/g, '_');
        codeOutput += `define ${varName} = Character(\n`;
        codeOutput += `    "${c.name}",\n`;
        codeOutput += `    color="${c.color || '#ffffff'}",\n`;
        if (c.nickname) {
            codeOutput += `    # Nickname: "${c.nickname}"\n`;
        }
        codeOutput += `    what_prefix='"',\n`;
        codeOutput += `    what_suffix='"',\n`;
        codeOutput += `)\n\n`;
    });

    // 2. Expression & Image Mappings
    codeOutput += `# --- Character Expressions & Assets ---\n`;
    characters.value.forEach((c) => {
        const varName = c.name.toLowerCase().replace(/\s+/g, '_');
        if (c.expressions && c.expressions.length > 0) {
            codeOutput += `# ${c.name} Expressions\n`;
            c.expressions.forEach((e) => {
                const expName = e.name.toLowerCase().replace(/\s+/g, '_');
                const imagePath = e.image_path || `images/characters/${varName}/${expName}.png`;
                codeOutput += `image ${varName} ${expName} = "${imagePath}"\n`;
            });
            codeOutput += `\n`;
        }
    });

    // 3. Voice Lines Mapping (Variables / Audio Registry or Documentation comments)
    codeOutput += `# --- Character Voice Lines Registry ---\n`;
    characters.value.forEach((c) => {
        const varName = c.name.toLowerCase().replace(/\s+/g, '_');
        if (c.voice_lines && c.voice_lines.length > 0) {
            codeOutput += `# ${c.name} Voice Clips\n`;
            c.voice_lines.forEach((v) => {
                const lineName = v.line_name.toLowerCase().replace(/\s+/g, '_');
                // Format as a python variable store or voice comment map for script implementation
                codeOutput += `define ${varName}_voice_${lineName} = "${v.audio_path}"\n`;
            });
            codeOutput += `\n`;
        }
    });

    bulkExportCode.value = codeOutput;
};

const refreshPreview = () => {
    loadCharacters();
};

const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(bulkExportCode.value);
        alert('Bulk export code copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy bulk code:', err);
        alert('Failed to copy to clipboard. Please try again.');
    }
};

const exportAll = () => {
    alert('Bulk .rpy file export pipeline coming soon!');
    showExportPreview();
};

onMounted(() => {
    loadCharacters();
});
</script>