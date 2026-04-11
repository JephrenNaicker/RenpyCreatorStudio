<template>
    <div v-if="project" class="project-detail-view">
        <!-- Project Header -->
        <div class="project-header">
            <div class="header-left">
                <h1>{{ project.name }}</h1>
                <div class="project-tags">
                    <span v-for="tag in project.tags" :key="tag" class="tag">
                        {{ tag }}
                    </span>
                    <span class="project-date">Created {{ formatDate(project.created_at) }}</span>
                </div>
            </div>

            <div class="header-actions">
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
        <div class="project-content">
            <!-- Left Column -->
            <div class="content-left">
                <!-- Project Overview -->
                <div class="info-card">
                    <h3>📖 Project Overview</h3>
                    <p class="project-plot">{{ project.main_plot }}</p>

                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-value">{{ characterCount }}</span>
                            <span class="stat-label">Characters</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">{{ sceneCount }}</span>
                            <span class="stat-label">Scenes</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">{{ dialogueLines }}</span>
                            <span class="stat-label">Dialogue Lines</span>
                        </div>
                    </div>
                </div>

                <!-- Main Character -->
                <div v-if="mainCharacter" class="info-card">
                    <h3>🌟 Main Character</h3>
                    <div class="character-card">
                        <div class="character-color" :style="{ backgroundColor: mainCharacter.color }"></div>
                        <div class="character-info">
                            <h4>{{ mainCharacter.name }}</h4>
                            <p v-if="mainCharacter.nickname" class="character-nickname">
                                "{{ mainCharacter.nickname }}"
                            </p>
                            <p class="character-meta">
                                {{ mainCharacter.expressions?.length || 0 }} expressions •
                                {{ mainCharacter.outfits?.length || 0 }} outfits
                            </p>
                            <p class="character-bio">{{ truncateText(mainCharacter.bio, 120) }}</p>
                        </div>
                        <router-link :to="`/characters/${mainCharacter.id}`" class="btn-small">
                            View
                        </router-link>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="info-card">
                    <h3>📅 Recent Activity</h3>
                    <div class="activity-list">
                        <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
                            <span class="activity-icon">{{ activity.icon }}</span>
                            <div class="activity-content">
                                <p class="activity-text">{{ activity.text }}</p>
                                <span class="activity-time">{{ activity.time }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="content-right">
                <!-- Project Characters -->
                <div class="info-card">
                    <div class="card-header-row">
                        <h3>👥 Project Characters</h3>
                        <router-link to="/characters" class="btn-small">
                            + Add Character
                        </router-link>
                    </div>

                    <div v-if="projectCharacters.length > 0" class="characters-list">
                        <div v-for="character in projectCharacters" :key="character.id" class="character-row">
                            <div class="character-preview">
                                <div class="character-color-dot" :style="{ backgroundColor: character.color }"></div>
                                <span class="character-name">{{ character.name }}</span>
                                <span v-if="character.nickname" class="character-nickname-small">
                                    ({{ character.nickname }})
                                </span>
                            </div>
                            <div class="character-stats">
                                <span class="stat-badge">😀 {{ character.expressions?.length || 0 }}</span>
                                <span class="stat-badge">👕 {{ character.outfits?.length || 0 }}</span>
                            </div>
                        </div>
                    </div>
                    <p v-else class="empty-message">No characters assigned to this project yet.</p>
                </div>

                <!-- Quick Actions -->
                <div class="info-card">
                    <h3>⚡ Quick Actions</h3>
                    <div class="quick-actions">
                        <button @click="startDialogue" class="quick-action-btn">
                            <span class="action-icon">💬</span>
                            <span class="action-text">Write Dialogue</span>
                        </button>
                        <button @click="addScene" class="quick-action-btn">
                            <span class="action-icon">🎬</span>
                            <span class="action-text">Add Scene</span>
                        </button>
                        <button @click="exportProject" class="quick-action-btn">
                            <span class="action-icon">📤</span>
                            <span class="action-text">Export Project</span>
                        </button>
                        <button @click="manageAssets" class="quick-action-btn">
                            <span class="action-icon">🖼️</span>
                            <span class="action-text">Manage Assets</span>
                        </button>
                    </div>
                </div>

                <!-- Export Status -->
                <div class="info-card">
                    <h3>📊 Export Status</h3>
                    <div class="export-status">
                        <div class="status-item">
                            <span class="status-label">Ren'Py Script:</span>
                            <span class="status-value ready">Ready</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Character Definitions:</span>
                            <span class="status-value ready">Ready</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Asset References:</span>
                            <span class="status-value missing">Missing 3</span>
                        </div>
                        <div class="status-item">
                            <span class="status-label">Scene Transitions:</span>
                            <span class="status-value pending">Pending</span>
                        </div>
                    </div>
                    <button class="btn-primary full-width" @click="runExport">
                        🚀 Export Complete Project
                    </button>
                </div>
            </div>
        </div>
    </div>
    <div v-else class="project-detail-view">
        <div class="info-card">
            <h3>Project Not Found</h3>
            <p>The project you're looking for doesn't exist.</p>
            <router-link to="/projects" class="btn-primary">Back to Projects</router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

const startDialogue = () => router.push(`/projects/${project.value.id}/dashboard`);
const addScene = () => router.push(`/projects/${project.value.id}/dashboard`);
const exportProject = () => alert('Export feature coming soon!');
const manageAssets = () => alert('Asset management coming soon!');
const runExport = () => alert('Export feature coming soon!');
</script>

<style scoped>
.project-detail-view {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

.project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #334155;
    flex-wrap: wrap;
    gap: 1.5rem;
}

.header-left h1 {
    font-size: 2.5rem;
    color: #f8fafc;
    margin-bottom: 0.5rem;
}

.project-tags {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
}

.tag {
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.85rem;
    font-weight: 500;
}

.project-date {
    color: #94a3b8;
    font-size: 0.9rem;
}

.header-actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-danger {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
}

.btn-primary {
    background: #38bdf8;
    color: #020617;
}

.btn-secondary {
    background: transparent;
    border: 1px solid #334155;
    color: #cbd5e1;
}

.btn-danger {
    background: transparent;
    border: 1px solid #7f1d1d;
    color: #fecaca;
}

.btn-primary:hover,
.btn-secondary:hover,
.btn-danger:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

/* Project Content Layout */
.project-content {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;
}

/* Left Column */
.content-left {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.info-card {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.5rem;
}

.info-card h3 {
    font-size: 1.25rem;
    color: #f8fafc;
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.project-plot {
    color: #cbd5e1;
    line-height: 1.6;
    margin-bottom: 1.5rem;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: 1rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #38bdf8;
}

.stat-label {
    font-size: 0.9rem;
    color: #94a3b8;
    margin-top: 0.25rem;
}

/* Character Card in Main Character Section */
.character-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border-left: 4px solid #FF6B6B;
}

.character-color {
    width: 40px;
    height: 40px;
    border-radius: 8px;
}

.character-info {
    flex: 1;
}

.character-info h4 {
    font-size: 1.1rem;
    color: #f8fafc;
    margin-bottom: 0.25rem;
}

.character-nickname {
    color: #38bdf8;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
    font-style: italic;
}

.character-meta {
    color: #94a3b8;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
}

.character-bio {
    color: #cbd5e1;
    font-size: 0.9rem;
    line-height: 1.4;
}

.btn-small {
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.85rem;
    background: #38bdf8;
    color: #020617;
    border: none;
    cursor: pointer;
}

/* Activity List */
.activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.75rem;
    border-radius: 8px;
    transition: background 0.2s;
}

.activity-item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.activity-icon {
    font-size: 1.2rem;
    opacity: 0.8;
}

.activity-content {
    flex: 1;
}

.activity-text {
    color: #f8fafc;
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
}

.activity-time {
    color: #94a3b8;
    font-size: 0.8rem;
}

/* Right Column */
.content-right {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.card-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
}

.characters-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.character-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    transition: background 0.2s;
}

.character-row:hover {
    background: rgba(255, 255, 255, 0.1);
}

.character-preview {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.character-color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.character-name {
    color: #f8fafc;
    font-weight: 500;
}

.character-nickname-small {
    color: #94a3b8;
    font-size: 0.85rem;
    font-style: italic;
}

.character-stats {
    display: flex;
    gap: 0.5rem;
}

.stat-badge {
    background: rgba(56, 189, 248, 0.1);
    color: #38bdf8;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.75rem;
}

.empty-message {
    color: #64748b;
    font-style: italic;
    text-align: center;
    padding: 2rem 0;
}

/* Quick Actions */
.quick-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.quick-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid #334155;
    border-radius: 12px;
    color: #cbd5e1;
    cursor: pointer;
    transition: all 0.2s ease;
}

.quick-action-btn:hover {
    background: rgba(56, 189, 248, 0.1);
    border-color: #38bdf8;
    color: #f8fafc;
    transform: translateY(-2px);
}

.action-icon {
    font-size: 2rem;
}

.action-text {
    font-size: 0.9rem;
    text-align: center;
}

/* Export Status */
.export-status {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.status-label {
    color: #cbd5e1;
    font-size: 0.9rem;
}

.status-value {
    font-size: 0.85rem;
    font-weight: 500;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
}

.status-value.ready {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
}

.status-value.missing {
    background: rgba(239, 68, 68, 0.2);
    color: #f87171;
}

.status-value.pending {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
}

.full-width {
    width: 100%;
    justify-content: center;
}

/* Responsive */
@media (max-width: 1024px) {
    .project-content {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .project-header {
        flex-direction: column;
    }

    .header-actions {
        width: 100%;
        justify-content: stretch;
    }

    .btn-primary,
    .btn-secondary,
    .btn-danger {
        flex: 1;
        justify-content: center;
    }

    .stats-grid {
        grid-template-columns: 1fr;
    }

    .quick-actions {
        grid-template-columns: 1fr;
    }
}
</style>