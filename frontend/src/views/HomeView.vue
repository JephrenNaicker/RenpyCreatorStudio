/<template>
  <div class="max-w-6xl mx-auto px-4">
    <!-- Hero Section -->
    <div class="text-center py-16">
      <h1
        class="text-5xl font-extrabold mb-4 bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
        Welcome to Ren'Py Creator Studio
      </h1>
      <p class="text-gray-400 text-lg mb-12">
        Create visual novels with drag-and-drop simplicity
      </p>

      <!-- Quick Actions -->
      <div class="grid gap-6 md:grid-cols-3">
        <router-link to="/characters/new"
          class="action-card flex flex-col items-start gap-3 p-6 bg-gray-900 border border-gray-700 rounded-xl transition hover:scale-105 hover:border-blue-400 hover:shadow-lg">
          <span class="text-4xl">👤</span>
          <h3 class="text-white text-xl font-semibold">Create Character</h3>
          <p class="text-gray-400 text-sm">Design characters with expressions and outfits</p>
        </router-link>

        <router-link to="/projects/new"
          class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:shadow-lg hover:border-sky-400 transition-transform transform hover:-translate-y-1">
          <span class="text-4xl block mb-4">📁</span>
          <h3 class="text-white font-semibold mb-1 text-xl">Start New Project</h3>
          <p class="text-gray-400 text-sm">Create a new visual novel project</p>
        </router-link>

        <router-link to="/projects"
          class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:shadow-lg hover:border-sky-400 transition-transform transform hover:-translate-y-1">
          <span class="text-4xl block mb-4">📚</span>
          <h3 class="text-white font-semibold mb-1 text-xl">Browse Projects</h3>
          <p class="text-gray-400 text-sm">View and manage your projects</p>
        </router-link>
      </div>
    </div>

    <!-- Recent Characters -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-white mb-6">Recent Characters</h2>
      <div class="grid gap-6 md:grid-cols-3">
        <div v-for="char in recentCharacters" :key="char.id"
          class="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col">
          <div :style="{ backgroundColor: char.color }" class="h-1 w-full rounded mb-4"></div>
          <div class="flex-1">
            <h4 class="text-white font-semibold text-lg mb-1">{{ char.name }}</h4>
            <p class="text-sky-400 text-sm mb-2">
              {{ char.expressions?.length || 0 }} expressions • {{ char.outfits?.length || 0 }} outfits
            </p>
            <p class="text-gray-400 text-sm">{{ char.bio?.substring(0, 60) }}...</p>
          </div>
          <div class="mt-4 flex gap-2">
            <router-link :to="`/characters/${char.id}`"
              class="bg-sky-400 text-gray-900 px-3 py-1 rounded text-sm font-medium hover:opacity-90">
              View
            </router-link>
            <router-link :to="`/characters/${char.id}/edit`"
              class="border border-gray-600 text-gray-300 px-3 py-1 rounded text-sm font-medium hover:bg-gray-800">
              Edit
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Projects -->
    <div>
      <h2 class="text-2xl font-bold text-white mb-6">Recent Projects</h2>
      <div class="grid gap-6 md:grid-cols-3">
        <div v-for="project in recentProjects" :key="project.id"
          class="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col">
          <div class="h-1 w-full rounded mb-4" style="background-color: #38bdf8;"></div>
          <div class="flex-1">
            <h4 class="text-white font-semibold text-lg mb-1">{{ project.name }}</h4>
            <p class="text-sky-400 text-sm mb-2">{{ project.tags.join(', ') }}</p>
            <p class="text-gray-400 text-sm">{{ project.main_plot?.substring(0, 80) }}...</p>
          </div>
          <div class="mt-4 flex gap-2">
            <router-link :to="`/projects/${project.id}`"
              class="bg-sky-400 text-gray-900 px-3 py-1 rounded text-sm font-medium hover:opacity-90">
              View
            </router-link>
            <router-link :to="`/projects/${project.id}/dashboard`"
              class="border border-gray-600 text-gray-300 px-3 py-1 rounded text-sm font-medium hover:bg-gray-800">
              Dashboard
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