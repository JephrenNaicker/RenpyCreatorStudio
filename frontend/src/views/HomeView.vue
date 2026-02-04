<template>
  <div class="home-view">
    <div class="hero">
      <h1>Welcome to Ren'Py Creator Studio</h1>
      <p class="subtitle">Create visual novels with drag-and-drop simplicity</p>

      <div class="quick-actions">
        <router-link to="/characters/new" class="action-card">
          <span class="action-icon">👤</span>
          <h3>Create Character</h3>
          <p>Design characters with expressions and outfits</p>
        </router-link>

        <router-link to="/projects/new" class="action-card">
          <span class="action-icon">📁</span>
          <h3>Start New Project</h3>
          <p>Create a new visual novel project</p>
        </router-link>

        <router-link to="/projects" class="action-card">
          <span class="action-icon">📚</span>
          <h3>Browse Projects</h3>
          <p>View and manage your projects</p>
        </router-link>
      </div>
    </div>

    <div class="recent-section">
      <h2>Recent Characters</h2>
      <div class="character-grid">
        <div v-for="char in recentCharacters" :key="char.id" class="character-card">
          <div class="character-color" :style="{ backgroundColor: char.color }"></div>
          <div class="character-info">
            <h4>{{ char.name }}</h4>
            <p class="character-meta">
              {{ char.expressions?.length || 0 }} expressions •
              {{ char.outfits?.length || 0 }} outfits
            </p>
            <p class="character-bio">{{ char.bio?.substring(0, 60) }}...</p>
          </div>
          <div class="character-actions">
            <router-link :to="`/characters/${char.id}`" class="btn-small">View</router-link>
            <router-link :to="`/characters/${char.id}/edit`" class="btn-small secondary">Edit</router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="recent-section">
      <h2>Recent Projects</h2>
      <div class="character-grid">
        <div v-for="project in recentProjects" :key="project.id" class="character-card">
          <div class="character-color" :style="{ backgroundColor: '#38bdf8' }"></div>
          <div class="character-info">
            <h4>{{ project.name }}</h4>
            <p class="character-meta">
              {{ project.tags.join(', ') }}
            </p>
            <p class="character-bio">{{ project.main_plot?.substring(0, 80) }}...</p>
          </div>
          <div class="character-actions">
            <router-link :to="`/projects/${project.id}`" class="btn-small">View</router-link>
            <router-link :to="`/projects/${project.id}/dashboard`" class="btn-small secondary">Dashboard</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dummyCharacters, dummyProjects, type Character, type Project } from '@/utils/dummyData';

// Use dummy data directly
const recentCharacters = ref<Character[]>([]);
const recentProjects = ref<Project[]>([]);

onMounted(() => {
  // Get first 3 characters and projects for the home page
  recentCharacters.value = dummyCharacters.slice(0, 3);
  recentProjects.value = dummyProjects.slice(0, 3);
});
</script>

<style scoped>
.home-view {
  max-width: 1000px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 3rem 0;
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1.2rem;
  color: #94a3b8;
  margin-bottom: 3rem;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.action-card {
  background: #020617;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}

.action-card:hover {
  transform: translateY(-5px);
  border-color: #38bdf8;
  box-shadow: 0 10px 25px rgba(56, 189, 248, 0.2);
}

.action-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.action-card h3 {
  margin-bottom: 0.5rem;
  color: #f8fafc;
}

.action-card p {
  color: #94a3b8;
  font-size: 0.9rem;
}

.recent-section {
  margin-top: 3rem;
}

.recent-section h2 {
  margin-bottom: 1.5rem;
  color: #f8fafc;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.character-card {
  background: #020617;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.character-color {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  margin-bottom: 1rem;
}

.character-info h4 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #f8fafc;
}

.character-meta {
  font-size: 0.85rem;
  color: #38bdf8;
  margin-bottom: 0.75rem;
}

.character-bio {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 1rem;
  flex: 1;
}

.character-actions {
  display: flex;
  gap: 0.5rem;
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

.btn-small.secondary {
  background: transparent;
  border: 1px solid #334155;
  color: #cbd5e1;
}

.btn-small:hover {
  opacity: 0.9;
}
</style>