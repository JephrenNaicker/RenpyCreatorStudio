<template>
    <div class="project-list-view">
        <div class="page-header">
            <h1>Projects</h1>

            <router-link to="/projects/new" class="btn-primary">
                ➕ New Project
            </router-link>
        </div>

        <div v-if="projects.length" class="project-grid">
            <div v-for="project in projects" :key="project.id" class="project-card"
                @click="$router.push(`/projects/${project.id}/dashboard`)">
                <h3>{{ project.name }}</h3>

                <p v-if="project.main_plot" class="project-desc">
                    {{ truncate(project.main_plot, 100) }}
                </p>

                <div class="tag-row">
                    <span v-for="tag in project.tags" :key="tag" class="tag">
                        {{ tag }}
                    </span>
                </div>
            </div>
        </div>

        <div v-else class="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first story project</p>

            <router-link to="/projects/new" class="btn-primary">
                Create Project
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const projects = ref([
    {
        id: '1',
        name: 'Mystic Academy',
        main_plot: 'A mysterious school hiding magical secrets.',
        tags: ['fantasy', 'school', 'mystery']
    }
]);

const truncate = (text: string, len: number) =>
    text.length > len ? text.slice(0, len) + '...' : text;
</script>

<style scoped>
.project-list-view {
    max-width: 1100px;
    margin: 0 auto;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.project-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.5rem;
}

.project-card {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 14px;
    padding: 1.5rem;
    cursor: pointer;
    transition: 0.2s;
}

.project-card:hover {
    border-color: #38bdf8;
    transform: translateY(-4px);
}

.project-desc {
    color: #94a3b8;
    font-size: 0.9rem;
    margin: 0.75rem 0;
}

.tag-row {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
}

.tag {
    background: #1e293b;
    color: #cbd5f5;
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
}

.empty-state {
    text-align: center;
    padding: 4rem;
    border: 2px dashed #334155;
    border-radius: 16px;
}
</style>
