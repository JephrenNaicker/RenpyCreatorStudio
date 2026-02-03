import { createRouter, createWebHistory } from 'vue-router';

// Layout Component - only one needed
import AppLayout from '@/components/layout/AppLayout.vue';

// Views
import HomeView from '../views/HomeView.vue';

// Characters
import CharacterListView from '../views/Character/CharacterListView.vue';
import CharacterDetailView from '../views/Character/CharacterDetailView.vue';
import CharacterCreator from '../views/Character/CharacterCreator.vue';

// Projects
import ProjectListView from '../views/Project/ProjectListView.vue';
import ProjectCreateView from '../views/Project/ProjectCreateView.vue';
import ProjectDetailView from '../views/Project/ProjectDetailView.vue';
import ProjectDashboardView from '../views/Project/ProjectDashboardView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        // Home page
        {
          path: '',
          name: 'home',
          component: HomeView
        },

        // Characters
        {
          path: 'characters',
          name: 'characters',
          component: CharacterListView
        },
        {
          path: 'characters/new',
          name: 'character-new',
          component: CharacterCreator,
          meta: { layout: 'dashboard' }
        },
        {
          path: 'characters/:id',
          name: 'character-detail',
          component: CharacterDetailView,
          props: true,
          meta: { layout: 'dashboard' }
        },
        {
          path: 'characters/:id/edit',
          name: 'character-edit',
          component: CharacterCreator,
          props: true,
          meta: { layout: 'dashboard' }
        },

        // Projects
        {
          path: 'projects',
          name: 'projects',
          component: ProjectListView
        },
        {
          path: 'projects/new',
          name: 'project-new',
          component: ProjectCreateView,
          meta: { layout: 'dashboard' }
        },
        {
          path: 'projects/:id',
          name: 'project-detail',
          component: ProjectDetailView,
          props: true,
          meta: { layout: 'dashboard' }
        },
        {
          path: 'projects/:id/dashboard',
          name: 'project-dashboard',
          component: ProjectDashboardView,
          props: true,
          meta: { layout: 'dashboard' }
        }
      ]
    }
  ]
});

export default router;