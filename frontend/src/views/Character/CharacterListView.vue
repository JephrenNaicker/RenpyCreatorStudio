<template>
    <div class="max-w-7xl mx-auto px-4 py-8" id="character-list-view">
        <!-- Header -->
        <div class="page-header" id="character-list-header">
            <h1 class="text-3xl font-bold text-white" id="character-list-title">Characters</h1>
            <div class="header-actions">
                <router-link to="/characters/new" class="btn-primary flex items-center gap-2" id="new-character-btn">
                    <span>➕</span>
                    New Character
                </router-link>
                <div class="search-box" id="search-box">
                    <input v-model="searchQuery" placeholder="Search characters..." class="input pl-10 w-full sm:w-64"
                        id="search-input" />
                    <span class="search-icon" id="search-icon">🔍</span>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="panel mb-8" id="filters-panel">
            <div class="flex flex-wrap gap-6">
                <div class="filter-group" id="sort-filter-group">
                    <label class="input-label" id="sort-label">Sort by:</label>
                    <select v-model="sortBy" class="filter-select" id="sort-select">
                        <option value="name" id="sort-option-name">Name (A-Z)</option>
                        <option value="name-desc" id="sort-option-name-desc">Name (Z-A)</option>
                        <option value="recent" id="sort-option-recent">Recently Updated</option>
                        <option value="created" id="sort-option-created">Date Created</option>
                    </select>
                </div>

                <div class="filter-group" id="filter-group">
                    <label class="input-label" id="filter-label">Filter by:</label>
                    <select v-model="filterBy" class="filter-select" id="filter-select">
                        <option value="all" id="filter-option-all">All Characters</option>
                        <optgroup label="Expressions" id="filter-group-expressions">
                            <option value="with-expressions" id="filter-option-with-expressions">With
                                Expressions</option>
                            <option value="without-expressions" id="filter-option-without-expressions">Without
                                Expressions</option>
                        </optgroup>
                        <optgroup label="Outfits" id="filter-group-outfits">
                            <option value="with-outfits" id="filter-option-with-outfits">With Outfits</option>
                            <option value="without-outfits" id="filter-option-without-outfits">Without Outfits
                            </option>
                        </optgroup>
                        <optgroup label="Voice" id="filter-group-voice">
                            <option value="with-voice" id="filter-option-with-voice">With Voice Lines</option>
                            <option value="without-voice" id="filter-option-without-voice">Without Voice Lines
                            </option>
                        </optgroup>
                    </select>
                </div>
            </div>
        </div>

        <!-- Character Grid -->
        <div v-if="filteredCharacters.length > 0" class="character-grid" id="character-grid">
            <div v-for="character in filteredCharacters" :key="character.id" class="tool-card tool-card-hover"
                :id="`character-card-${character.id}`" :data-character-id="character.id"
                :data-character-name="character.name">
                <!-- Character Color Bar -->
                <div class="character-color-bar" :style="{ backgroundColor: character.color }"
                    :id="`character-color-bar-${character.id}`"></div>

                <!-- Avatar & Basic Info -->
                <div class="flex items-start gap-4 mb-4">
                    <div class="character-avatar" :style="{ backgroundColor: character.color + '40' }"
                        :id="`character-avatar-${character.id}`">
                        {{ character.name.charAt(0) }}
                    </div>
                    <div>
                        <h3 class="character-name-display" :id="`character-name-${character.id}`">
                            {{ character.name }}
                        </h3>
                        <p v-if="character.nickname" class="character-nickname"
                            :id="`character-nickname-${character.id}`">
                            "{{ character.nickname }}"
                        </p>
                    </div>
                </div>

                <!-- Meta Info -->
                <div class="flex gap-4 mb-4" :id="`character-meta-${character.id}`">
                    <div class="character-meta-item" :id="`character-expressions-count-${character.id}`">
                        <span>😀</span>
                        <span>{{ character.expressions?.length || 0 }}</span>
                    </div>
                    <div class="character-meta-item" :id="`character-outfits-count-${character.id}`">
                        <span>👕</span>
                        <span>{{ character.outfits?.length || 0 }}</span>
                    </div>
                    <div class="character-meta-item" :id="`character-voice-count-${character.id}`">
                        <span>🔊</span>
                        <span>{{ character.voice_lines?.length || 0 }}</span>
                    </div>
                </div>

                <!-- Bio -->
                <div v-if="character.bio" class="min-h-[4.5rem] mb-6" :id="`character-bio-${character.id}`">
                    <p class="text-sm text-gray-400 line-clamp-3">
                        {{ character.bio }}
                    </p>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 pt-4 border-t border-gray-700" :id="`character-actions-${character.id}`">
                    <router-link :to="`/characters/${character.id}`" class="btn-primary flex-1 text-center"
                        :id="`view-character-btn-${character.id}`">
                        View
                    </router-link>
                    <router-link :to="`/characters/${character.id}/edit`" class="btn-secondary flex-1 text-center"
                        :id="`edit-character-btn-${character.id}`">
                        Edit
                    </router-link>
                    <button @click="deleteCharacter(character.id)" class="btn-danger flex-1 text-center"
                        :id="`delete-character-btn-${character.id}`">
                        Delete
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state mt-12" id="empty-state">
            <div class="empty-icon" id="empty-state-icon">👤</div>
            <h3 class="subsection-title" id="empty-state-title">No characters found</h3>
            <p class="text-gray-400 mb-6" id="empty-state-message">Get started by creating your first character
            </p>
            <router-link to="/characters/new" class="btn-primary" id="empty-state-create-btn">
                Create Your First Character
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { getCharacters, deleteCharacter as deleteCharacterService } from '@/services/characterService';
import type { Character } from '@/utils/dummyData';

// Reactive data
const characters = ref<Character[]>([]);
const searchQuery = ref('');
const sortBy = ref('name');
const filterBy = ref('all');
const isLoading = ref(false);
const error = ref<string | null>(null);

// Load characters via the character service
const loadCharacters = async () => {
    isLoading.value = true;
    error.value = null;

    try {
        characters.value = await getCharacters();
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

// Delete character with confirmation and service call
const deleteCharacter = async (id: string) => {
    const confirmMessage = `Are you sure you want to delete this character?`;
    if (confirm(confirmMessage)) {
        try {
            // Find character before deletion for potential logging
            const characterToDelete = characters.value.find(c => c.id === id);

            await deleteCharacterService(id);

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