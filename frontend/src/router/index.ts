import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CharacterListView from '../views/CharacterListView.vue';
import CharacterDetailView from '../views/CharacterDetailView.vue';
import CharacterCreator from '../views/CharacterCreator.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/characters',
      name: 'characters',
      component: CharacterListView
    },
    {
      path: '/characters/new',
      name: 'character-new',
      component: CharacterCreator
    },
    {
      path: '/characters/:id',
      name: 'character-detail',
      component: CharacterDetailView,
      props: true
    },
    {
      path: '/characters/:id/edit',
      name: 'character-edit',
      component: CharacterCreator,
      props: true
    }
  ]
});

export default router;