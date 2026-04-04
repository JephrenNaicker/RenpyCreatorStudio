<template>
    <div class="create-page">

        <!-- Background grid atmosphere -->
        <div class="bg-grid" aria-hidden="true" />

        <div class="create-container">

            <!-- Header -->
            <div class="create-header">
                <button class="back-btn" @click="router.back()">
                    ← Back
                </button>
                <div class="header-text">
                    <h1 class="create-title">New Project</h1>
                    <p class="create-subtitle">Set the stage for your visual novel</p>
                </div>
            </div>

            <!-- Form card -->
            <form @submit.prevent="createProject" class="create-card">

                <!-- Step 1: Identity -->
                <div class="form-section">
                    <div class="section-label">
                        <span class="section-number">01</span>
                        <span class="section-title">Identity</span>
                    </div>

                    <div class="form-group">
                        <label class="input-label">
                            Project Name <span class="required">*</span>
                        </label>
                        <input v-model="project.name" class="input" placeholder="e.g. Mystic Academy, Crimson Horizons…"
                            required maxlength="80" />
                        <span class="char-counter" :class="{ 'character-counter-warning': project.name.length > 60 }">
                            {{ project.name.length }}/80
                        </span>
                    </div>
                </div>

                <!-- Divider -->
                <div class="section-divider" />

                <!-- Step 2: Story -->
                <div class="form-section">
                    <div class="section-label">
                        <span class="section-number">02</span>
                        <span class="section-title">Story</span>
                    </div>

                    <div class="form-group">
                        <label class="input-label">Main Plot / Context</label>
                        <textarea v-model="project.main_plot" class="input plot-textarea" rows="4"
                            placeholder="Short overview of the story world, theme, or premise…" maxlength="500" />
                        <span class="char-counter"
                            :class="{ 'character-counter-warning': project.main_plot.length > 400 }">
                            {{ project.main_plot.length }}/500
                        </span>
                    </div>

                    <div class="form-group">
                        <label class="input-label">
                            Main Character
                            <span class="text-gray-500 font-normal">(optional)</span>
                        </label>

                        <!-- Trigger button -->
                        <button type="button" class="char-picker-trigger" @click="showCharPicker = !showCharPicker">
                            <template v-if="selectedCharacter">
                                <span class="cast-dot" :style="{ background: selectedCharacter.color }" />
                                <span class="picker-name">{{ selectedCharacter.name }}</span>
                                <span v-if="selectedCharacter.nickname" class="picker-nick">"{{
                                    selectedCharacter.nickname }}"</span>
                            </template>
                            <span v-else class="text-gray-500">None — decide later</span>
                            <span class="ml-auto text-gray-500 text-xs">{{ showCharPicker ? '▲' : '▼' }}</span>
                        </button>

                        <!-- Picker popover -->
                        <div v-if="showCharPicker" class="char-picker">
                            <input v-model="characterSearch" class="picker-search" placeholder="Search characters..."
                                @click.stop />
                            <div class="picker-list">
                                <!-- None option -->
                                <label class="picker-row">
                                    <input type="radio" v-model="project.main_character_id" value=""
                                        class="picker-checkbox" />
                                    <span class="picker-name text-gray-500">None</span>
                                </label>
                                <label v-for="char in filteredCharacters" :key="char.id" class="picker-row">
                                    <input type="radio" v-model="project.main_character_id" :value="char.id"
                                        class="picker-checkbox" />
                                    <span class="cast-dot" :style="{ background: char.color }" />
                                    <span class="picker-name">{{ char.name }}</span>
                                    <span v-if="char.nickname" class="picker-nick">"{{ char.nickname }}"</span>
                                </label>
                                <p v-if="filteredCharacters.length === 0" class="picker-empty">No characters found</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Divider -->
                <div class="section-divider" />

                <!-- Step 3: Tags -->
                <div class="form-section">
                    <div class="section-label">
                        <span class="section-number">03</span>
                        <span class="section-title">Tags</span>
                        <span class="tag-count">{{ project.tags.length }}/5</span>
                    </div>

                    <div class="form-group">
                        <div class="tag-input-row">
                            <input v-model="tagInput" class="input tag-input" placeholder="fantasy, romance, sci-fi…"
                                :disabled="project.tags.length >= 5" @keydown.enter.prevent="addTag" />
                            <button type="button" class="add-tag-btn" @click="addTag"
                                :disabled="project.tags.length >= 5 || !tagInput.trim()">
                                Add
                            </button>
                        </div>

                        <!-- Tag chips -->
                        <Transition name="fade">
                            <div v-if="project.tags.length > 0" class="tag-row">
                                <TransitionGroup name="tag">
                                    <span v-for="(tag, index) in project.tags" :key="tag" class="tag-chip">
                                        # {{ tag }}
                                        <button type="button" class="tag-remove" @click="removeTag(index)"
                                            title="Remove tag">
                                            ✕
                                        </button>
                                    </span>
                                </TransitionGroup>
                            </div>
                        </Transition>

                        <p v-if="project.tags.length === 0" class="input-hint">
                            Add up to 5 genre tags to help organise your projects
                        </p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="form-actions">
                    <button type="button" class="cancel-btn" @click="router.back()">
                        Cancel
                    </button>
                    <button type="submit" class="submit-btn" :disabled="!project.name.trim()">
                        <span class="submit-icon">✦</span>
                        Create Project
                    </button>
                </div>

            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { dummyCharacters } from '@/utils/dummyData';

const router = useRouter();

const showCharPicker = ref(false);
const characterSearch = ref('');

const filteredCharacters = computed(() => {
    const q = characterSearch.value.toLowerCase();
    return q
        ? dummyCharacters.filter(c =>
            c.name.toLowerCase().includes(q) ||
            c.nickname?.toLowerCase().includes(q)
        )
        : dummyCharacters;
});

const selectedCharacter = computed(() =>
    dummyCharacters.find(c => c.id === project.value.main_character_id)
);

const project = ref({
    name: '',
    main_plot: '',
    main_character_id: '',
    tags: [] as string[]
});

const tagInput = ref('');

const addTag = () => {
    const trimmed = tagInput.value.trim().toLowerCase();
    if (!trimmed || project.value.tags.length >= 5) return;
    if (project.value.tags.includes(trimmed)) return; // no dupes
    project.value.tags.push(trimmed);
    tagInput.value = '';
};

const removeTag = (index: number) => {
    project.value.tags.splice(index, 1);
};

const createProject = async () => {
    console.log('Creating project:', project.value);
    // TODO: API call
    router.push('/projects');
};
</script>

<style scoped>
/* ── Page shell ── */
.create-page {
    min-height: 100vh;
    background: #020617;
    padding: 2.5rem 1rem 4rem;
    position: relative;
    overflow: hidden;
}

.bg-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(to right, rgba(51, 65, 85, 0.15) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(51, 65, 85, 0.15) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
}

/* Soft radial glow behind the card */
.create-page::before {
    content: '';
    position: absolute;
    top: -10%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 400px;
    background: radial-gradient(ellipse, rgba(56, 189, 248, 0.06) 0%, transparent 70%);
    pointer-events: none;
}

/* ── Container ── */
.create-container {
    position: relative;
    max-width: 680px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
}

/* ── Header ── */
.create-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.back-btn {
    background: transparent;
    border: 1px solid #1e293b;
    color: #64748b;
    padding: 0.4rem 0.85rem;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    margin-top: 0.35rem;
}

.back-btn:hover {
    border-color: #334155;
    color: #94a3b8;
}

.header-text {
    flex: 1;
}

.create-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.25rem;
    letter-spacing: -0.02em;
}

.create-subtitle {
    color: #475569;
    font-size: 0.9rem;
    margin: 0;
}

/* ── Card ── */
.create-card {
    background: #0a1628;
    border: 1px solid #1e293b;
    border-radius: 16px;
    padding: 0;
    overflow: hidden;
    box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.04), 0 24px 48px rgba(0, 0, 0, 0.4);
}

/* ── Form sections ── */
.form-section {
    padding: 1.75rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.section-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #1e293b 20%, #1e293b 80%, transparent);
}

.section-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.section-number {
    font-size: 0.7rem;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.1em;
    font-variant-numeric: tabular-nums;
    opacity: 0.7;
}

.section-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.tag-count {
    margin-left: auto;
    font-size: 0.75rem;
    color: #334155;
}

/* ── Form groups ── */
.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.input-label {
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: 500;
}

.required {
    color: #38bdf8;
}

.optional {
    color: #475569;
    font-size: 0.8rem;
    font-weight: 400;
}

.input {
    background: #060f1e;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 0.65rem 0.9rem;
    color: #f1f5f9;
    font-size: 0.9rem;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
    box-sizing: border-box;
}

.input:focus {
    outline: none;
    border-color: #38bdf8;
    box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.08);
}

.input::placeholder {
    color: #334155;
}

.input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.plot-textarea {
    resize: vertical;
    min-height: 100px;
    line-height: 1.6;
}

.char-counter {
    font-size: 0.72rem;
    color: #334155;
    text-align: right;
    margin-top: -0.1rem;
}

/* ── Select ── */
.select-wrapper {
    position: relative;
}

.select-input {
    appearance: none;
    cursor: pointer;
    padding-right: 2.5rem;
}

.select-arrow {
    position: absolute;
    right: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    color: #475569;
    pointer-events: none;
    font-size: 0.8rem;
}

.select-input option {
    background: #0f172a;
    color: #f1f5f9;
}

/* ── Tags ── */
.tag-input-row {
    display: flex;
    gap: 0.5rem;
}

.tag-input {
    flex: 1;
}

.add-tag-btn {
    background: #0f172a;
    border: 1px solid #1e293b;
    color: #94a3b8;
    padding: 0 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    flex-shrink: 0;
}

.add-tag-btn:hover:not(:disabled) {
    border-color: #38bdf8;
    color: #38bdf8;
}

.add-tag-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.25rem;
}

.tag-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: rgba(56, 189, 248, 0.08);
    border: 1px solid rgba(56, 189, 248, 0.2);
    color: #7dd3fc;
    padding: 0.25rem 0.6rem 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
}

.tag-remove {
    background: transparent;
    border: none;
    color: #38bdf8;
    cursor: pointer;
    font-size: 0.65rem;
    opacity: 0.5;
    padding: 0;
    line-height: 1;
    transition: opacity 0.15s;
}

.tag-remove:hover {
    opacity: 1;
}

.input-hint {
    font-size: 0.78rem;
    color: #334155;
    margin: 0.1rem 0 0;
}

/* ── Actions ── */
.form-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 2rem 1.75rem;
    border-top: 1px solid #0f172a;
    background: rgba(0, 0, 0, 0.2);
}

.cancel-btn {
    background: transparent;
    border: 1px solid #1e293b;
    color: #475569;
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}

.cancel-btn:hover {
    border-color: #334155;
    color: #64748b;
}

.submit-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #38bdf8;
    color: #020617;
    border: none;
    padding: 0.65rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.01em;
}

.submit-btn:hover:not(:disabled) {
    background: #7dd3fc;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
}

.submit-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
}

.submit-icon {
    font-size: 0.7rem;
    opacity: 0.8;
}

/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.tag-enter-active {
    transition: all 0.2s ease;
}

.tag-leave-active {
    transition: all 0.15s ease;
}

.tag-enter-from {
    opacity: 0;
    transform: scale(0.85);
}

.tag-leave-to {
    opacity: 0;
    transform: scale(0.85);
}

.char-picker-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #060f1e;
    border: 1px solid #1e293b;
    border-radius: 8px;
    padding: 0.65rem 0.9rem;
    color: #f1f5f9;
    font-size: 0.9rem;
    cursor: pointer;
    transition: border-color 0.2s;
    text-align: left;
}

.char-picker-trigger:hover {
    border-color: #334155;
}

.char-picker {
    margin-top: 0.35rem;
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

.cast-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
    display: inline-block;
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

/* ── Responsive ── */
@media (max-width: 640px) {
    .create-page {
        padding: 1.5rem 0.75rem 3rem;
    }

    .form-section {
        padding: 1.25rem 1.25rem;
    }

    .form-actions {
        padding: 1rem 1.25rem 1.25rem;
    }

    .create-title {
        font-size: 1.4rem;
    }
}
</style>