<template>
    <div class="max-w-7xl mx-auto px-4 py-8" data-testid="character-list-view">
        <!-- Header -->
        <div class="page-header" data-testid="character-list-header">
            <h1 class="text-3xl font-bold text-white" data-testid="character-list-title">Characters</h1>
            <div class="header-actions">
                <router-link to="/characters/new" class="btn-primary flex items-center gap-2"
                    data-testid="new-character-btn">
                    <span>➕</span>
                    New Character
                </router-link>
                <div class="search-box" data-testid="search-box">
                    <input v-model="searchQuery" placeholder="Search characters..." class="input pl-10 w-full sm:w-64"
                        data-testid="search-input" />
                    <span class="search-icon" data-testid="search-icon">🔍</span>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="panel mb-8" data-testid="filters-panel">
            <div class="flex flex-wrap gap-6">
                <div class="filter-group" data-testid="sort-filter-group">
                    <label class="input-label" data-testid="sort-label">Sort by:</label>
                    <select v-model="sortBy" class="filter-select" data-testid="sort-select">
                        <option value="name" data-testid="sort-option-name">Name (A-Z)</option>
                        <option value="name-desc" data-testid="sort-option-name-desc">Name (Z-A)</option>
                        <option value="recent" data-testid="sort-option-recent">Recently Updated</option>
                        <option value="created" data-testid="sort-option-created">Date Created</option>
                    </select>
                </div>

                <div class="filter-group" data-testid="filter-group">
                    <label class="input-label" data-testid="filter-label">Filter by:</label>
                    <select v-model="filterBy" class="filter-select" data-testid="filter-select">
                        <option value="all" data-testid="filter-option-all">All Characters</option>
                        <optgroup label="Expressions" data-testid="filter-group-expressions">
                            <option value="with-expressions" data-testid="filter-option-with-expressions">With
                                Expressions</option>
                            <option value="without-expressions" data-testid="filter-option-without-expressions">Without
                                Expressions</option>
                        </optgroup>
                        <optgroup label="Outfits" data-testid="filter-group-outfits">
                            <option value="with-outfits" data-testid="filter-option-with-outfits">With Outfits</option>
                            <option value="without-outfits" data-testid="filter-option-without-outfits">Without Outfits
                            </option>
                        </optgroup>
                        <optgroup label="Voice" data-testid="filter-group-voice">
                            <option value="with-voice" data-testid="filter-option-with-voice">With Voice Lines</option>
                            <option value="without-voice" data-testid="filter-option-without-voice">Without Voice Lines
                            </option>
                        </optgroup>
                    </select>
                </div>
            </div>
        </div>

        <!-- Character Grid -->
        <div v-if="filteredCharacters.length > 0" class="character-grid" data-testid="character-grid">
            <div v-for="character in filteredCharacters" :key="character.id" class="tool-card tool-card-hover"
                :data-testid="`character-card-${character.id}`" :data-character-id="character.id"
                :data-character-name="character.name">
                <!-- Character Color Bar -->
                <div class="character-color-bar" :style="{ backgroundColor: character.color }"
                    :data-testid="`character-color-bar-${character.id}`"></div>

                <!-- Avatar & Basic Info -->
                <div class="flex items-start gap-4 mb-4">
                    <div class="character-avatar" :style="{ backgroundColor: character.color + '40' }"
                        :data-testid="`character-avatar-${character.id}`">
                        {{ character.name.charAt(0) }}
                    </div>
                    <div>
                        <h3 class="character-name-display" :data-testid="`character-name-${character.id}`">
                            {{ character.name }}
                        </h3>
                        <p v-if="character.nickname" class="character-nickname"
                            :data-testid="`character-nickname-${character.id}`">
                            "{{ character.nickname }}"
                        </p>
                    </div>
                </div>

                <!-- Meta Info -->
                <div class="flex gap-4 mb-4" :data-testid="`character-meta-${character.id}`">
                    <div class="character-meta-item" :data-testid="`character-expressions-count-${character.id}`">
                        <span>😀</span>
                        <span>{{ character.expressions?.length || 0 }}</span>
                    </div>
                    <div class="character-meta-item" :data-testid="`character-outfits-count-${character.id}`">
                        <span>👕</span>
                        <span>{{ character.outfits?.length || 0 }}</span>
                    </div>
                    <div class="character-meta-item" :data-testid="`character-voice-count-${character.id}`">
                        <span>🔊</span>
                        <span>{{ character.voice_lines?.length || 0 }}</span>
                    </div>
                </div>

                <!-- Bio -->
                <div v-if="character.bio" class="min-h-[4.5rem] mb-6" :data-testid="`character-bio-${character.id}`">
                    <p class="text-sm text-gray-400 line-clamp-3">
                        {{ character.bio }}
                    </p>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 pt-4 border-t border-gray-700"
                    :data-testid="`character-actions-${character.id}`">
                    <router-link :to="`/characters/${character.id}`" class="btn-primary flex-1 text-center"
                        :data-testid="`view-character-btn-${character.id}`">
                        View
                    </router-link>
                    <router-link :to="`/characters/${character.id}/edit`" class="btn-secondary flex-1 text-center"
                        :data-testid="`edit-character-btn-${character.id}`">
                        Edit
                    </router-link>
                    <button @click="deleteCharacter(character.id)" class="btn-danger flex-1 text-center"
                        :data-testid="`delete-character-btn-${character.id}`">
                        Delete
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state mt-12" data-testid="empty-state">
            <div class="empty-icon" data-testid="empty-state-icon">👤</div>
            <h3 class="subsection-title" data-testid="empty-state-title">No characters found</h3>
            <p class="text-gray-400 mb-6" data-testid="empty-state-message">Get started by creating your first character
            </p>
            <router-link to="/characters/new" class="btn-primary" data-testid="empty-state-create-btn">
                Create Your First Character
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { dummyCharacters } from '@/utils/dummyData';
import type { Character } from '@/utils/dummyData';

// Reactive data
const characters = ref<Character[]>([]);
const searchQuery = ref('');
const sortBy = ref('name');
const filterBy = ref('all');
const isLoading = ref(false);
const error = ref<string | null>(null);

// Load characters (with loading state for testing)
const loadCharacters = async () => {
    isLoading.value = true;
    error.value = null;

    try {
        // Simulate API call with dummy data
        // In production, replace with actual API call:
        // const response = await api.getCharacters();
        // characters.value = response.data;

        // Using dummy data for now
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
        characters.value = [...dummyCharacters];
    } catch (err) {
        error.value = 'Failed to load characters';
        console.error('Error loading characters:', err);
    } finally {
        isLoading.value = false;
    }
};

// Load characters on component mount
loadCharacters();

// Watch for deletion to trigger events (useful for testing)
watch(characters, (newVal, oldVal) => {
    if (newVal.length < oldVal.length) {
        // Character was deleted
        const deletedId = oldVal.find(old => !newVal.some(newChar => newChar.id === old.id))?.id;
        if (deletedId) {
            console.log(`Character ${deletedId} deleted`);
            // Emit event or trigger callback if needed
        }
    }
});

// Filtered and sorted characters
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

// Delete character with confirmation and API call
const deleteCharacter = async (id: string) => {
    const confirmMessage = `Are you sure you want to delete this character?`;
    if (confirm(confirmMessage)) {
        try {
            // Find character before deletion for potential logging
            const characterToDelete = characters.value.find(c => c.id === id);

            // TODO: Call API to delete from backend
            // await api.deleteCharacter(id);

            // Update local state
            characters.value = characters.value.filter(char => char.id !== id);

            // Log deletion (useful for testing)
            console.log(`Character ${characterToDelete?.name} (${id}) deleted successfully`);

            // Could emit an event or show a success message here
        } catch (err) {
            console.error('Failed to delete character:', err);
            error.value = 'Failed to delete character';
            // Optionally show error message to user
        }
    }
};

// Helper method to refresh characters (useful for testing)
const refreshCharacters = async () => {
    await loadCharacters();
};

// Helper method to reset filters (useful for testing)
const resetFilters = () => {
    searchQuery.value = '';
    sortBy.value = 'name';
    filterBy.value = 'all';
};

// Expose methods for testing if needed (in development)
if (import.meta.env.DEV) {
    // @ts-ignore - Expose for testing purposes
    window.__CHARACTER_LIST_VIEW__ = {
        resetFilters,
        refreshCharacters,
        getCharacters: () => characters.value,
        getFilteredCharacters: () => filteredCharacters.value
    };
}
</script>