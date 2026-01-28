<template>
    <div class="page">
        <div class="card">
            <h2>Create Character</h2>

            <form @submit.prevent="createCharacter">
                <!-- Basic Info -->
                <div class="section">
                    <div class="field">
                        <label>Name</label>
                        <input v-model="character.name" placeholder="Character name" required />
                    </div>

                    <div class="field">
                        <label>Nickname / Display Name</label>
                        <input v-model="character.nickname"
                            placeholder="Optional display name (alias, short name, etc.)" />
                    </div>

                    <div class="color-row">
                        <input type="color" v-model="character.color" />

                        <span class="color-preview" :style="{ backgroundColor: character.color }" />

                        <span class="color-code">{{ character.color }}</span>
                    </div>

                    <div class="field-row">
                        <div class="field">
                            <label>Age (optional)</label>
                            <input type="number" v-model="character.age" placeholder="e.g. 25" />
                        </div>

                        <div class="field">
                            <label>Birth Date (Month/Day)</label>
                            <input type="text" v-model="character.birth_date" placeholder="MM/DD e.g. 03/15"
                                pattern="\d{1,2}/\d{1,2}" title="Enter month and day like: 03/15 or 3/15"
                                class="date-input" />
                            <p class="hint">Format: Month/Day (e.g., 01/31, 12/25, 3/15)</p>
                        </div>
                    </div>

                    <div class="field collapsible" :class="{ collapsed: sections.collapsed.bio }">
                        <div class="section-header" @click="toggleSection('bio')">
                            <label>Bio / Description</label>
                            <span class="collapse-icon">{{ sections.collapsed.bio ? '▶' : '▼' }}</span>
                        </div>
                        <textarea v-if="!sections.collapsed.bio" v-model="character.bio" rows="3"
                            placeholder="Short character background or personality description" />
                    </div>
                </div>

                <!-- Voice Lines (collapsible) -->
                <div class="section collapsible" :class="{ collapsed: sections.collapsed.voice }">
                    <div class="section-header" @click="toggleSection('voice')">
                        <h3>Voice Lines (optional)</h3>
                        <span class="collapse-icon">{{ sections.collapsed.voice ? '▶' : '▼' }}</span>
                    </div>

                    <div v-if="!sections.collapsed.voice">
                        <p class="hint">Each voice line links a name to an audio file.</p>

                        <div v-for="(voice, index) in character.voice_lines" :key="index" class="expression-row">
                            <input v-model="voice.line_name" placeholder="Line name (e.g. greeting)" />
                            <input v-model="voice.audio_path" placeholder="Audio file path" />
                            <button type="button" class="danger" @click="removeVoice(index)">✕</button>
                        </div>

                        <button type="button" class="secondary" @click="addVoice">
                            + Add Voice Line
                        </button>
                    </div>
                </div>

                <!-- Outfits (collapsible) -->
                <div class="section collapsible" :class="{ collapsed: sections.collapsed.outfits }">
                    <div class="section-header" @click="toggleSection('outfits')">
                        <h3>👕 Outfits / Tags</h3>
                        <span class="collapse-icon">{{ sections.collapsed.outfits ? '▶' : '▼' }}</span>
                    </div>

                    <div v-if="!sections.collapsed.outfits">
                        <p class="hint">Used to group expressions (casual, formal, battle, etc.).</p>

                        <div v-for="(outfit, index) in character.outfits" :key="index" class="expression-row">
                            <input v-model="outfit.name" placeholder="Outfit name" />
                            <input v-model="outfit.default_image" placeholder="Default image (optional)" />
                            <button type="button" class="danger" @click="removeOutfit(index)">✕</button>
                        </div>

                        <button type="button" class="secondary" @click="addOutfit">
                            + Add Outfit
                        </button>
                    </div>
                </div>

                <!-- Expressions (collapsible) -->
                <div class="section collapsible" :class="{ collapsed: sections.collapsed.expressions }">
                    <div class="section-header" @click="toggleSection('expressions')">
                        <h3>🧩 Expressions</h3>
                        <span class="collapse-icon">{{ sections.collapsed.expressions ? '▶' : '▼' }}</span>
                    </div>

                    <div v-if="!sections.collapsed.expressions">
                        <div v-for="(exp, index) in character.expressions" :key="index" class="expression-row">
                            <input v-model="exp.name" placeholder="Expression name" />
                            <input v-model="exp.image_path" placeholder="Image path (optional)" />
                            <select v-model="exp.outfit" class="outfit-select">
                                <option value="">Default (no outfit)</option>
                                <option v-for="outfit in character.outfits" :key="outfit.name" :value="outfit.name">
                                    {{ outfit.name }}
                                </option>
                            </select>
                            <button type="button" class="danger" @click="removeExpression(index)">✕</button>
                        </div>

                        <button type="button" class="secondary" @click="addExpression">
                            + Add Expression
                        </button>
                    </div>
                </div>

                <!-- Submit -->
                <div class="actions">
                    <button type="submit" class="primary">Create Character</button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { characterAPI } from '@/services/api';

const character = ref({
    project_id: 'test-project',
    name: '',
    nickname: '',
    color: '#FFFFFF',
    age: null as number | null,
    birth_date: '' as string,
    bio: '',
    voice_lines: [] as Array<{ line_name: string; audio_path: string }>,
    outfits: [] as Array<{ name: string; default_image: string }>,
    expressions: [] as Array<{
        name: string;
        image_path: string;
        outfit: string;
    }>
});

const sections = ref({
    collapsed: {
        bio: false,
        voice: false,
        outfits: false,
        expressions: false
    }
});

const toggleSection = (sectionName: keyof typeof sections.value.collapsed) => {
    sections.value.collapsed[sectionName] = !sections.value.collapsed[sectionName];
};

const addVoice = () => {
    character.value.voice_lines.push({ line_name: '', audio_path: '' });
};

const removeVoice = (i: number) => {
    character.value.voice_lines.splice(i, 1);
};

const addOutfit = () => {
    character.value.outfits.push({ name: '', default_image: '' });
};

const removeOutfit = (i: number) => {
    character.value.outfits.splice(i, 1);
};

const addExpression = () => {
    character.value.expressions.push({ name: '', image_path: '', outfit: '' });
};

const removeExpression = (i: number) => {
    character.value.expressions.splice(i, 1);
};

const createCharacter = async () => {
    try {
        await characterAPI.create(character.value);
    } catch (error) {
        console.error('Error creating character:', error);
    }
};
</script>

<style scoped>
.page {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 3rem 1rem;
    background: #0f172a;
}

.card {
    width: 100%;
    max-width: 760px;
    background: #020617;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.section {
    margin-bottom: 2rem;
}

.collapsible {
    transition: all 0.3s ease;
}

.collapsible.collapsed {
    margin-bottom: 0.5rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 0.5rem 0;
    border-bottom: 1px solid #334155;
    margin-bottom: 1rem;
}

.section-header:hover {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 0.5rem;
}

.collapse-icon {
    color: #94a3b8;
    font-size: 0.9rem;
    user-select: none;
}

.color-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.color-preview {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid #475569;
}

.color-code {
    font-size: 0.75rem;
    opacity: 0.7;
}

.field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin-bottom: 1rem;
}

.date-input {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 0.55rem 0.65rem;
    color: #f8fafc;
    font-family: monospace;
}

.hint {
    font-size: 0.75rem;
    opacity: 0.6;
    margin-top: 0.25rem;
    margin-bottom: 1rem;
}

input,
textarea,
select {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 0.55rem 0.65rem;
    color: #f8fafc;
}

.outfit-select {
    width: 100%;
    cursor: pointer;
}

.expression-row {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1fr auto;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    align-items: center;
}

button {
    border: none;
    border-radius: 8px;
    padding: 0.5rem 0.9rem;
    cursor: pointer;
    white-space: nowrap;
}

.primary {
    background: #38bdf8;
    color: #020617;
    font-weight: bold;
}

.secondary {
    background: #1e293b;
    color: #e2e8f0;
    border: 1px solid #334155;
}

.danger {
    background: #7f1d1d;
    color: #fecaca;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

.actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid #334155;
}
</style>