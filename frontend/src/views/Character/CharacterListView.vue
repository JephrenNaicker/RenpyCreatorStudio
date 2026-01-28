<template>
    <div class="character-list-view">
        <div class="page-header">
            <h1>Characters</h1>
            <div class="header-actions">
                <router-link to="/characters/new" class="btn-primary">
                    <span class="btn-icon">➕</span>
                    New Character
                </router-link>
                <div class="search-box">
                    <input v-model="searchQuery" placeholder="Search characters..." />
                    <span class="search-icon">🔍</span>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="filters">
            <div class="filter-group">
                <label>Sort by:</label>
                <select v-model="sortBy" class="filter-select">
                    <option value="name">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="recent">Recently Updated</option>
                    <option value="created">Date Created</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Filter by:</label>
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

        <!-- Character Grid -->
        <div v-if="filteredCharacters.length > 0" class="character-grid">
            <div v-for="character in filteredCharacters" :key="character.id" class="character-card">
                <div class="card-header">
                    <div class="character-color" :style="{ backgroundColor: character.color }"></div>
                    <div class="character-avatar">
                        {{ character.name.charAt(0) }}
                    </div>
                </div>

                <div class="card-body">
                    <h3>{{ character.name }}</h3>
                    <p v-if="character.nickname" class="character-nickname">
                        "{{ character.nickname }}"
                    </p>
                    <p class="character-meta">
                        <span class="meta-item">
                            <span class="meta-icon">😀</span>
                            {{ character.expressions?.length || 0 }}
                        </span>
                        <span class="meta-item">
                            <span class="meta-icon">👕</span>
                            {{ character.outfits?.length || 0 }}
                        </span>
                    </p>
                    <p v-if="character.bio" class="character-bio">
                        {{ truncateText(character.bio, 80) }}
                    </p>
                </div>

                <div class="card-footer">
                    <router-link :to="`/characters/${character.id}`" class="btn-small">
                        View
                    </router-link>
                    <router-link :to="`/characters/${character.id}/edit`" class="btn-small secondary">
                        Edit
                    </router-link>
                    <button class="btn-small danger" @click="deleteCharacter(character.id)">
                        Delete
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
            <div class="empty-icon">👤</div>
            <h3>No characters found</h3>
            <p>Get started by creating your first character</p>
            <router-link to="/characters/new" class="btn-primary">
                Create Your First Character
            </router-link>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// Mock data - will be replaced with API call
const characters = ref([
    {
        id: '1',
        name: 'Alice',
        nickname: 'Ali',
        color: '#FF6B6B',
        bio: 'A cheerful protagonist who loves adventure and has a mysterious past.',
        expressions: ['happy', 'sad', 'angry', 'surprised'],
        voice_lines: [
            { line_name: 'Greeting', audio_path: '/audio/hello.wav' }
        ],
        outfits: ['casual', 'formal'],
        updatedAt: '2024-01-15'
    },
    {
        id: '2',
        name: 'Bob',
        nickname: 'Bobby',
        color: '#4ECDC4',
        bio: 'The reliable best friend who always has your back.',
        expressions: ['neutral', 'smile', 'concerned'],
        voice_lines: [],
        outfits: ['school', 'casual'],
        updatedAt: '2024-01-14'
    },
    {
        id: '3',
        name: 'Catherine',
        nickname: 'Cat',
        color: '#FFD166',
        bio: 'Mysterious transfer student with hidden powers.',
        expressions: ['serious', 'surprised', 'determined', 'magical'],
        voice_lines: [],
        outfits: ['magical', 'school'],
        updatedAt: '2024-01-13'
    },
    {
        id: '4',
        name: 'David',
        nickname: 'Dave',
        color: '#A78BFA',
        bio: 'The smart but socially awkward class president.',
        expressions: ['thinking', 'nervous', 'confident'],
        voice_lines: [],
        outfits: ['formal', 'casual'],
        updatedAt: '2024-01-12'
    }
]);

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
            result = result.filter(c => c.expressions?.length > 0);
            break;

        case 'without-expressions':
            result = result.filter(c => !c.expressions || c.expressions.length === 0);
            break;

        case 'with-outfits':
            result = result.filter(c => c.outfits?.length > 0);
            break;

        case 'without-outfits':
            result = result.filter(c => !c.outfits || c.outfits.length === 0);
            break;

        case 'with-voice':
            result = result.filter(c => c.voice_lines?.length > 0);
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
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            case 'created':
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            default:
                return 0;
        }
    });

    return result;
});

const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

const deleteCharacter = (id: string) => {
    if (confirm('Are you sure you want to delete this character?')) {
        characters.value = characters.value.filter(char => char.id !== id);
        // TODO: Call API to delete from backend
    }
};
</script>

<style scoped>
.character-list-view {
    max-width: 1200px;
    margin: 0 auto;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.page-header h1 {
    font-size: 2rem;
    color: #f8fafc;
}

.header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.btn-primary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: #38bdf8;
    color: #020617;
    border-radius: 8px;
    text-decoration: none;
    font-weight: bold;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
}

.btn-primary:hover {
    opacity: 0.9;
}

.search-box {
    position: relative;
}

.search-box input {
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    background: #020617;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #f8fafc;
    width: 250px;
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
}

.filters {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.filter-group label {
    color: #94a3b8;
    font-size: 0.9rem;
}

.filter-select {
    padding: 0.5rem 1rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    color: #f8fafc;
    cursor: pointer;
}

.character-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
}

.character-card {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
}

.character-card:hover {
    border-color: #38bdf8;
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(56, 189, 248, 0.1);
}

.card-header {
    padding: 1.5rem 1.5rem 0.5rem;
    position: relative;
}

.character-color {
    height: 4px;
    border-radius: 2px;
    margin-bottom: 1rem;
}

.character-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #38bdf8, #818cf8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: bold;
    color: #020617;
    margin-bottom: 1rem;
}

.card-body {
    padding: 0 1.5rem;
}

.card-body h3 {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
    color: #f8fafc;
}

.character-nickname {
    color: #38bdf8;
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
    font-style: italic;
}

.character-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
}

.meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.85rem;
    color: #94a3b8;
}

.meta-icon {
    font-size: 0.9rem;
}

.character-bio {
    font-size: 0.9rem;
    color: #94a3b8;
    margin-bottom: 1.5rem;
    line-height: 1.5;
}

.card-footer {
    padding: 1rem 1.5rem 1.5rem;
    display: flex;
    gap: 0.5rem;
    border-top: 1px solid #334155;
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

.btn-small.danger {
    background: transparent;
    border: 1px solid #7f1d1d;
    color: #fecaca;
}

.btn-small:hover {
    opacity: 0.9;
}

.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: #020617;
    border: 2px dashed #334155;
    border-radius: 16px;
    margin-top: 2rem;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    opacity: 0.5;
}

.empty-state h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: #f8fafc;
}

.empty-state p {
    color: #94a3b8;
    margin-bottom: 2rem;
}
</style>