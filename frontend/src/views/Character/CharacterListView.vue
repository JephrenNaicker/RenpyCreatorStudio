[file name]: CharacterListView.vue
<template>
    <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Header -->
        <div class="page-header">
            <h1 class="text-3xl font-bold text-white">Characters</h1>
            <div class="header-actions">
                <router-link to="/characters/new" class="btn-primary flex items-center gap-2">
                    <span>➕</span>
                    New Character
                </router-link>
                <div class="search-box">
                    <input v-model="searchQuery" placeholder="Search characters..."
                        class="input pl-10 w-full sm:w-64" />
                    <span class="search-icon">🔍</span>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="panel mb-8">
            <div class="flex flex-wrap gap-6">
                <div class="filter-group">
                    <label class="input-label">Sort by:</label>
                    <select v-model="sortBy" class="filter-select">
                        <option value="name">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="recent">Recently Updated</option>
                        <option value="created">Date Created</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label class="input-label">Filter by:</label>
                    <select v-model="filterBy" class="filter-select">
                        <option value="all">All Characters</option>
                        <optgroup label="Expressions">
                            <option value="with-expressions">With Expressions</option>
                            <option value="without-expressions">Without Expressions</option>
                        </optgroup>
                        <optgroup label="Outfits">
                            <option value="with-outfits">With Outfits</option>
                            <option value="without-outfits">Without Outfits</option>
                        </optgroup>
                        <optgroup label="Voice">
                            <option value="with-voice">With Voice Lines</option>
                            <option value="without-voice">Without Voice Lines</option>
                        </optgroup>
                    </select>
                </div>
            </div>
        </div>

        <!-- Character Grid -->
        <div v-if="filteredCharacters.length > 0" class="character-grid">
            <div v-for="character in filteredCharacters" :key="character.id" class="tool-card tool-card-hover">
                <!-- Character Color Bar -->
                <div class="character-color-bar" :style="{ backgroundColor: character.color }"></div>

                <!-- Avatar & Basic Info ,darker shading-->
                <div class="flex items-start gap-4 mb-4">
                    <div class="character-avatar" :style="{ backgroundColor: character.color + '40' }">
                        {{ character.name.charAt(0) }}
                    </div>
                    <div>
                        <h3 class="character-name-display">{{ character.name }}</h3>
                        <p v-if="character.nickname" class="character-nickname">
                            "{{ character.nickname }}"
                        </p>
                    </div>
                </div>

                <!-- Meta Info -->
                <div class="flex gap-4 mb-4">
                    <div class="character-meta-item">
                        <span>😀</span>
                        <span>{{ character.expressions?.length || 0 }}</span>
                    </div>
                    <div class="character-meta-item">
                        <span>👕</span>
                        <span>{{ character.outfits?.length || 0 }}</span>
                    </div>
                    <div class="character-meta-item">
                        <span>🔊</span>
                        <span>{{ character.voice_lines?.length || 0 }}</span>
                    </div>
                </div>

                <!-- Bio -->
                <div v-if="character.bio" class="min-h-[4.5rem] mb-6">
                    <p class="text-sm text-gray-400 line-clamp-3">
                        {{ character.bio }}
                    </p>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 pt-4 border-t border-gray-700">
                    <router-link :to="`/characters/${character.id}`" class="btn-primary flex-1 text-center">
                        View
                    </router-link>
                    <router-link :to="`/characters/${character.id}/edit`" class="btn-secondary flex-1 text-center">
                        Edit
                    </router-link>
                    <button @click="deleteCharacter(character.id)" class="btn-danger flex-1 text-center">
                        Delete
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state mt-12">
            <div class="empty-icon">👤</div>
            <h3 class="subsection-title">No characters found</h3>
            <p class="text-gray-400 mb-6">Get started by creating your first character</p>
            <router-link to="/characters/new" class="btn-primary">
                Create Your First Character
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { dummyCharacters } from '@/utils/dummyData';
import type { Character } from '@/utils/dummyData';

const characters = ref<Character[]>(dummyCharacters);
const searchQuery = ref('');
const sortBy = ref('name');
const filterBy = ref('all');

const filteredCharacters = computed(() => {
    let result = [...characters.value];

    // Search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(char =>
            char.name.toLowerCase().includes(query) ||
            (char.nickname && char.nickname.toLowerCase().includes(query)) ||
            (char.bio && char.bio.toLowerCase().includes(query))
        );
    }

    // Type filter
    switch (filterBy.value) {
        case 'with-expressions':
            result = result.filter(c => c.expressions && c.expressions.length > 0);
            break;
        case 'without-expressions':
            result = result.filter(c => !c.expressions || c.expressions.length === 0);
            break;
        case 'with-outfits':
            result = result.filter(c => c.outfits && c.outfits.length > 0);
            break;
        case 'without-outfits':
            result = result.filter(c => !c.outfits || c.outfits.length === 0);
            break;
        case 'with-voice':
            result = result.filter(c => c.voice_lines && c.voice_lines.length > 0);
            break;
        case 'without-voice':
            result = result.filter(c => !c.voice_lines || c.voice_lines.length === 0);
            break;
    }

    // Sort
    result.sort((a, b) => {
        switch (sortBy.value) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'recent':
                return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
            case 'created':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            default:
                return 0;
        }
    });

    return result;
});

const deleteCharacter = (id: string) => {
    if (confirm('Are you sure you want to delete this character?')) {
        characters.value = characters.value.filter(char => char.id !== id);
        // TODO: Call API to delete from backend
    }
};
</script>