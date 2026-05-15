<template>
  <div class="max-w-6xl mx-auto px-4" id="home-view">
    <!-- Hero Section -->
    <div class="text-center py-16" id="hero-section">
      <h1 class="text-5xl font-extrabold mb-4 bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent"
        id="hero-title">
        Welcome to Ren'Py Creator Studio
      </h1>
      <p class="text-gray-400 text-lg mb-12" id="hero-subtitle">
        Create visual novels with drag-and-drop simplicity
      </p>

      <!-- Quick Actions -->
      <div class="grid gap-6 md:grid-cols-3" id="quick-actions">
        <router-link to="/characters/new"
          class="tool-card tool-card-hover flex flex-col items-start gap-3 hover:scale-105" id="create-character-card">
          <span class="text-4xl" id="create-character-icon">👤</span>
          <h3 class="text-white text-xl font-semibold" id="create-character-title">Create Character</h3>
          <p class="text-gray-400 text-sm" id="create-character-description">Design characters with expressions and
            outfits</p>
        </router-link>

        <router-link to="/projects/new" class="tool-card tool-card-hover transform hover:-translate-y-1"
          id="create-project-card">
          <span class="text-4xl block mb-4" id="create-project-icon">📁</span>
          <h3 class="text-white font-semibold mb-1 text-xl" id="create-project-title">Start New Project</h3>
          <p class="text-gray-400 text-sm" id="create-project-description">Create a new visual novel project</p>
        </router-link>

        <router-link to="/projects" class="tool-card tool-card-hover transform hover:-translate-y-1"
          id="browse-projects-card">
          <span class="text-4xl block mb-4" id="browse-projects-icon">📚</span>
          <h3 class="text-white font-semibold mb-1 text-xl" id="browse-projects-title">Browse Projects</h3>
          <p class="text-gray-400 text-sm" id="browse-projects-description">View and manage your projects</p>
        </router-link>
      </div>
    </div>

    <!-- Recent Characters -->
    <div class="mb-12" id="recent-characters-section">
      <h2 class="section-title" id="recent-characters-title">Recent Characters</h2>
      <div class="grid gap-6 md:grid-cols-3" id="recent-characters-list">
        <div v-for="char in recentCharacters" :key="char.id" class="tool-card tool-card-hover flex flex-col"
          :id="`character-card-${char.id}`">
          <div :style="{ backgroundColor: char.color }" class="h-1 w-full rounded mb-4"
            :id="`character-color-bar-${char.id}`"></div>
          <div class="flex-1">
            <h4 class="text-white font-semibold text-lg mb-1" :id="`character-name-${char.id}`">{{ char.name }}</h4>
            <p class="text-sky-400 text-sm mb-2" :id="`character-stats-${char.id}`">
              {{ char.expressions?.length || 0 }} expressions • {{ char.outfits?.length || 0 }} outfits
            </p>
            <p class="text-gray-400 text-sm" :id="`character-bio-${char.id}`">{{ char.bio?.substring(0, 60) }}...</p>
          </div>
          <div class="mt-4 flex gap-2" :id="`character-actions-${char.id}`">
            <router-link :to="`/characters/${char.id}`" class="btn-primary hover:opacity-90"
              :id="`view-character-btn-${char.id}`">
              View
            </router-link>
            <router-link :to="`/characters/${char.id}/edit`" class="btn-secondary"
              :id="`edit-character-btn-${char.id}`">
              Edit
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Projects -->
    <div id="recent-projects-section">
      <h2 class="section-title" id="recent-projects-title">Recent Projects</h2>
      <div class="grid gap-6 md:grid-cols-3" id="recent-projects-list">
        <div v-for="project in recentProjects" :key="project.id" class="tool-card tool-card-hover flex flex-col"
          :id="`project-card-${project.id}`">
          <div class="h-1 w-full rounded mb-4" style="background-color: #38bdf8;"
            :id="`project-color-bar-${project.id}`"></div>
          <div class="flex-1">
            <h4 class="text-white font-semibold text-lg mb-1" :id="`project-name-${project.id}`">{{ project.name }}</h4>
            <p class="text-sky-400 text-sm mb-2" :id="`project-tags-${project.id}`">{{ project.tags.join(', ') }}</p>
            <p class="text-gray-400 text-sm" :id="`project-plot-${project.id}`">{{ project.main_plot?.substring(0, 80)
            }}...</p>
          </div>
          <div class="mt-4 flex gap-2" :id="`project-actions-${project.id}`">
            <router-link :to="`/projects/${project.id}`" class="btn-primary hover:opacity-90"
              :id="`view-project-btn-${project.id}`">
              View
            </router-link>
            <router-link :to="`/projects/${project.id}/scenes`" class="btn-secondary"
              :id="`edit-project-scenes-btn-${project.id}`">
              Scene Editor
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dummyCharacters, dummyProjects, type Character, type Project } from '@/utils/dummyData';

const recentCharacters = ref<Character[]>([]);
const recentProjects = ref<Project[]>([]);

onMounted(() => {
  recentCharacters.value = dummyCharacters.slice(0, 3);
  recentProjects.value = dummyProjects.slice(0, 3);
});
</script>