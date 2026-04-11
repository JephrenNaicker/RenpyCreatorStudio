<template>
    <div class="project-list-view">
        <div class="page-header">
            <h1>Projects</h1>

            <router-link to="/projects/new" class="btn-primary">
                ➕ New Project
            </router-link>
        </div>

        <div v-if="projects.length" class="project-grid">
            <div v-for="project in projects" :key="project.id" class="project-card">
                <!-- Card body (clickable area for detail view) -->
                <div class="card-main" @click="goToDetail(project.id)">
                    <h3>{{ project.name }}</h3>

                    <p v-if="project.main_plot" class="project-desc">
                        {{ truncate(project.main_plot, 100) }}
                    </p>

                    <div class="tag-row">
                        <span v-for="tag in project.tags" :key="tag" class="tag">
                            {{ tag }}
                        </span>
                    </div>

                    <div class="project-meta">
                        <span class="meta-item">
                            📅 {{ formatDate(project.created_at) }}
                        </span>
                        <span v-if="project.main_character_id" class="meta-item">
                            👤 Main Character: {{ getMainCharacterName(project.main_character_id) }}
                        </span>
                    </div>
                </div>

                <!-- 3-dot menu -->
                <div class="card-menu">
                    <button class="menu-trigger" @click.stop="toggleMenu(project.id)">
                        ⋯
                    </button>
                    <div v-if="activeMenu === project.id" class="menu-dropdown" @click.stop>
                        <button @click="goToDetail(project.id)" class="menu-item">
                            📄 Open
                        </button>
                        <button @click="goToScenes(project.id)" class="menu-item">
                            ✍️ Write Scenes
                        </button>
                        <button @click="goToEdit(project.id)" class="menu-item">
                            ✏️ Edit Project
                        </button>
                        <button @click="confirmDelete(project)" class="menu-item delete">
                            🗑️ Delete
                        </button>
                    </div>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { dummyProjects, dummyCharacters, type Project } from '@/utils/dummyData';

const router = useRouter();
const projects = ref<Project[]>([]);
const activeMenu = ref<string | null>(null);

// Close menu when clicking outside
const handleClickOutside = () => {
    if (activeMenu.value) {
        activeMenu.value = null;
    }
};

onMounted(() => {
    projects.value = [...dummyProjects];
    document.addEventListener('click', handleClickOutside);
});

// Navigation functions
const goToDetail = (projectId: string) => {
    router.push(`/projects/${projectId}`);
};

const goToScenes = (projectId: string) => {
    router.push(`/projects/${projectId}/scenes`);
};

const goToEdit = (projectId: string) => {
    router.push(`/projects/${projectId}/edit`);
};

const confirmDelete = (project: Project) => {
    if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
        // TODO: Call API delete
        projects.value = projects.value.filter(p => p.id !== project.id);
    }
    activeMenu.value = null;
};

const toggleMenu = (projectId: string) => {
    activeMenu.value = activeMenu.value === projectId ? null : projectId;
};

// Helper functions
const getMainCharacterName = (characterId: string): string => {
    const character = dummyCharacters.find(c => c.id === characterId);
    return character ? character.name : 'Unknown';
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

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
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.project-card {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 14px;
    position: relative;
    transition: 0.2s;
}

.project-card:hover {
    border-color: #38bdf8;
    transform: translateY(-4px);
}

.card-main {
    padding: 1.5rem;
    cursor: pointer;
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

.project-meta {
    margin-top: 0.75rem;
    font-size: 0.75rem;
    color: #64748b;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.card-menu {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
}

.menu-trigger {
    background: #1e293b;
    border: none;
    color: #94a3b8;
    font-size: 1.5rem;
    line-height: 1;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition: 0.2s;
}

.menu-trigger:hover {
    background: #334155;
    color: #f1f5f9;
}

.menu-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    min-width: 160px;
    z-index: 10;
    overflow: hidden;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.6rem 1rem;
    background: transparent;
    border: none;
    color: #e2e8f0;
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
    transition: 0.1s;
}

.menu-item:hover {
    background: #334155;
}

.menu-item.delete {
    color: #f87171;
}

.menu-item.delete:hover {
    background: #450a0a;
    color: #fecaca;
}

.empty-state {
    text-align: center;
    padding: 4rem;
    border: 2px dashed #334155;
    border-radius: 16px;
}

.btn-primary {
    background: #38bdf8;
    color: #0f172a;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: 0.2s;
}

.btn-primary:hover {
    background: #7dd3fc;
}
</style>