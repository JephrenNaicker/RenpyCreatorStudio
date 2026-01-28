<template>
    <div class="page">
        <div class="card">
            <h2>Create Project</h2>

            <form @submit.prevent="createProject">
                <!-- Name -->
                <div class="field">
                    <label>Project Name *</label>
                    <input v-model="project.name" placeholder="Story or project name" required />
                </div>

                <!-- Plot -->
                <div class="field">
                    <label>Main Plot / Context</label>
                    <textarea v-model="project.main_plot" rows="4"
                        placeholder="Short overview of the story world, theme, or premise" />
                </div>

                <!-- Main Character -->
                <div class="field">
                    <label>Main Character (optional)</label>
                    <select v-model="project.main_character_id">
                        <option value="">None</option>
                        <option v-for="char in characters" :key="char.id" :value="char.id">
                            {{ char.name }}
                        </option>
                    </select>
                </div>

                <!-- Tags -->
                <div class="field">
                    <label>Tags (max 5)</label>

                    <div class="tag-input-row">
                        <input v-model="tagInput" placeholder="Press enter to add tag"
                            @keydown.enter.prevent="addTag" />
                        <button type="button" class="secondary" @click="addTag" :disabled="project.tags.length >= 5">
                            Add
                        </button>
                    </div>

                    <div class="tag-row">
                        <span v-for="(tag, index) in project.tags" :key="tag" class="tag">
                            {{ tag }}
                            <button type="button" @click="removeTag(index)">✕</button>
                        </span>
                    </div>

                    <p class="hint">Examples: fantasy, romance, sci-fi, drama</p>
                </div>

                <!-- Submit -->
                <div class="actions">
                    <button class="primary" type="submit">
                        Create Project
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

/**
 * Mock characters
 * later: load from API
 */
const characters = ref([
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' }
]);

const project = ref({
    name: '',
    main_plot: '',
    main_character_id: '',
    tags: [] as string[]
});

const tagInput = ref('');

const addTag = () => {
    if (!tagInput.value) return;
    if (project.value.tags.length >= 5) return;

    project.value.tags.push(tagInput.value.trim());
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
.page {
    display: flex;
    justify-content: center;
    padding: 3rem 1rem;
}

.card {
    width: 100%;
    max-width: 720px;
    background: #020617;
    padding: 2rem;
    border-radius: 16px;
    border: 1px solid #334155;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 1.2rem;
}

input,
textarea,
select {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 0.6rem;
    color: #f8fafc;
}

.tag-input-row {
    display: flex;
    gap: 0.5rem;
}

.tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.5rem;
}

.tag {
    background: #1e293b;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
}

.tag button {
    margin-left: 0.4rem;
    background: none;
    border: none;
    color: #fca5a5;
    cursor: pointer;
}

.hint {
    font-size: 0.75rem;
    opacity: 0.6;
}

.actions {
    display: flex;
    justify-content: flex-end;
}

.primary {
    background: #38bdf8;
    color: #020617;
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    border: none;
}
</style>
