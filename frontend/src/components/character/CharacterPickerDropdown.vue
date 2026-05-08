<!-- frontend/src/components/character/CharacterPickerDropdown.vue -->
<template>
    <div class="character-picker-dropdown" ref="dropdownContainer">
        <!-- Trigger Button -->
        <button class="trigger-btn" :class="{ active: isOpen }" @click="toggleDropdown" :title="buttonLabel">
            <slot name="trigger">
                <span class="trigger-icon">+</span>
                <span v-if="showLabel" class="trigger-label">{{ buttonLabel }}</span>
            </slot>
        </button>

        <!-- Dropdown Content -->
        <Transition name="dropdown">
            <div v-if="isOpen" class="dropdown-content" ref="dropdownContent">
                <!-- Search Input -->
                <div class="search-section">
                    <input ref="searchInput" v-model="searchQuery" type="text" class="search-input"
                        placeholder="Search or create character..." @keyup.enter="handleCreateNew" />
                </div>

                <!-- Character List -->
                <div class="character-list-section">
                    <div class="list-header">
                        <span class="list-title">Existing Characters</span>
                        <span class="list-count">{{ filteredCharacters.length }}</span>
                    </div>

                    <div v-if="filteredCharacters.length > 0" class="character-list">
                        <div v-for="char in filteredCharacters" :key="char.id" class="character-item"
                            :class="{ selected: isCharacterSelected(char.id) }" @click="selectCharacter(char)">
                            <div class="character-color" :style="{ backgroundColor: char.color }"></div>
                            <div class="character-info">
                                <div class="character-name">{{ char.name }}</div>
                                <div v-if="char.nickname" class="character-nick">"{{ char.nickname }}"</div>
                            </div>
                            <div class="character-stats">
                                <span class="stat-badge">😀 {{ char.expressions?.length || 0 }}</span>
                                <span class="stat-badge">👕 {{ char.outfits?.length || 0 }}</span>
                            </div>
                            <div v-if="isCharacterSelected(char.id)" class="check-icon">✓</div>
                        </div>
                    </div>

                    <div v-else class="empty-state">
                        <span class="empty-icon">🔍</span>
                        <p>No characters found matching "{{ searchQuery }}"</p>
                    </div>
                </div>

                <!-- Create New Character Section -->
                <div class="create-section">
                    <div class="divider"></div>
                    <button class="create-btn" @click="handleCreateNew">
                        <span class="create-icon">✨</span>
                        <span class="create-text">
                            Create new character "{{ searchQuery || 'Untitled' }}"
                        </span>
                    </button>
                </div>
            </div>
        </Transition>

        <!-- Quick Create Modal -->
        <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
            <div class="create-modal">
                <h3 class="modal-title">Create New Character</h3>

                <div class="form-group">
                    <label class="form-label">Character Name *</label>
                    <input v-model="newCharacter.name" type="text" class="form-input" placeholder="e.g., John Smith"
                        @keyup.enter="confirmCreateCharacter" />
                </div>

                <div class="form-group">
                    <label class="form-label">Nickname (Optional)</label>
                    <input v-model="newCharacter.nickname" type="text" class="form-input"
                        placeholder="e.g., The Detective" />
                </div>

                <div class="form-group">
                    <label class="form-label">Color</label>
                    <div class="color-selector">
                        <div v-for="color in presetColors" :key="color" class="color-option"
                            :style="{ backgroundColor: color }" :class="{ active: newCharacter.color === color }"
                            @click="newCharacter.color = color"></div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="btn-secondary" @click="closeCreateModal">Cancel</button>
                    <button class="btn-primary" @click="confirmCreateCharacter" :disabled="!newCharacter.name.trim()">
                        Create Character
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import type { Character } from '@/utils/dummyData';

interface Props {
    characters?: Character[];
    selectedCharacterIds?: string[];
    buttonLabel?: string;
    showLabel?: boolean;
    multiSelect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    characters: () => [],
    selectedCharacterIds: () => [],
    buttonLabel: 'Add Character',
    showLabel: true,
    multiSelect: false,
});

const emit = defineEmits<{
    (e: 'select', character: Character): void;
    (e: 'create', character: Omit<Character, 'id'>): void;
    (e: 'update:selectedIds', ids: string[]): void;
}>();

// Refs for click outside detection
const dropdownContainer = ref<HTMLElement | null>(null);
const dropdownContent = ref<HTMLElement | null>(null);

// Dropdown state
const isOpen = ref(false);
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);

// Create character modal
const showCreateModal = ref(false);
const newCharacter = ref({
    name: '',
    nickname: '',
    color: '#38bdf8',
    bio: '',
    expressions: [],
    outfits: []
});

// Preset colors for quick selection
const presetColors = [
    '#38bdf8', // sky
    '#f87171', // red
    '#34d399', // emerald
    '#fbbf24', // amber
    '#a78bfa', // violet
    '#f472b6', // pink
    '#fb923c', // orange
    '#2dd4bf', // teal
];

// Filtered characters based on search
const filteredCharacters = computed(() => {
    if (!searchQuery.value.trim()) return props.characters;

    const query = searchQuery.value.toLowerCase();
    return props.characters.filter(char =>
        char.name.toLowerCase().includes(query) ||
        char.nickname?.toLowerCase().includes(query)
    );
});

// Check if character is selected
const isCharacterSelected = (charId: string) => {
    return props.selectedCharacterIds?.includes(charId) ?? false;
};

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
    if (isOpen.value && dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
        closeDropdown();
    }
};

// Toggle dropdown
const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
    if (isOpen.value) {
        nextTick(() => {
            searchInput.value?.focus();
        });
    }
};

// Close dropdown
const closeDropdown = () => {
    isOpen.value = false;
    searchQuery.value = '';
};

// Select character
const selectCharacter = (character: Character) => {
    if (props.multiSelect) {
        const newIds = isCharacterSelected(character.id)
            ? props.selectedCharacterIds.filter(id => id !== character.id)
            : [...props.selectedCharacterIds, character.id];
        emit('update:selectedIds', newIds);
    } else {
        emit('select', character);
        closeDropdown();
    }
};

// Handle create new
const handleCreateNew = () => {
    if (searchQuery.value.trim()) {
        newCharacter.value.name = searchQuery.value;
    }
    showCreateModal.value = true;
    closeDropdown();
};

// Confirm create character
const confirmCreateCharacter = async () => {
    if (!newCharacter.value.name.trim()) return;

    const characterData: Omit<Character, 'id'> = {
        name: newCharacter.value.name.trim(),
        nickname: newCharacter.value.nickname || undefined,
        color: newCharacter.value.color,
        bio: newCharacter.value.bio,
        expressions: [],
        outfits: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    emit('create', characterData);
    closeCreateModal();
};

// Close create modal
const closeCreateModal = () => {
    showCreateModal.value = false;
    newCharacter.value = {
        name: '',
        nickname: '',
        color: '#38bdf8',
        bio: '',
        expressions: [],
        outfits: []
    };
};

// Lifecycle hooks for click outside
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.character-picker-dropdown {
    position: relative;
    display: inline-block;
}

.trigger-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #e2e8f0;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
}

.trigger-btn:hover {
    background: #2d3748;
    border-color: #38bdf8;
    color: #38bdf8;
}

.trigger-btn.active {
    background: #38bdf8;
    border-color: #38bdf8;
    color: #0f172a;
}

.trigger-icon {
    font-size: 1.1rem;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.dropdown-content {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 360px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    overflow: hidden;
    z-index: 100;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
}

/* Search section */
.search-section {
    padding: 0.75rem;
    border-bottom: 1px solid #334155;
}

.search-input {
    width: 100%;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: #f8fafc;
    font-size: 0.875rem;
    outline: none;
    transition: all 0.2s;
}

.search-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.1);
}

/* Character list section */
.character-list-section {
    max-height: 320px;
    overflow-y: auto;
}

.list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: #0f172a;
    border-bottom: 1px solid #334155;
}

.list-title {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #94a3b8;
}

.list-count {
    font-size: 0.75rem;
    color: #64748b;
    background: #1e293b;
    padding: 0.125rem 0.375rem;
    border-radius: 10px;
}

.character-list {
    display: flex;
    flex-direction: column;
}

.character-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    cursor: pointer;
    transition: all 0.15s;
    border-left: 3px solid transparent;
}

.character-item:hover {
    background: #2d3748;
}

.character-item.selected {
    background: rgba(56, 189, 248, 0.1);
    border-left-color: #38bdf8;
}

.character-color {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.character-info {
    flex: 1;
    min-width: 0;
}

.character-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.character-nick {
    font-size: 0.75rem;
    color: #38bdf8;
    font-style: italic;
}

.character-stats {
    display: flex;
    gap: 0.375rem;
    flex-shrink: 0;
}

.stat-badge {
    font-size: 0.7rem;
    padding: 0.125rem 0.375rem;
    background: rgba(56, 189, 248, 0.1);
    border-radius: 4px;
    color: #38bdf8;
}

.check-icon {
    color: #38bdf8;
    font-weight: bold;
    font-size: 1rem;
    flex-shrink: 0;
}

.empty-state {
    text-align: center;
    padding: 2rem 1rem;
    color: #64748b;
}

.empty-icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
    opacity: 0.5;
}

.empty-state p {
    font-size: 0.875rem;
}

/* Create section */
.create-section {
    border-top: 1px solid #334155;
    padding: 0.75rem;
}

.divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #334155, transparent);
    margin-bottom: 0.75rem;
}

.create-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
}

.create-btn:hover {
    background: #2d3748;
    border-color: #38bdf8;
    color: #38bdf8;
}

.create-icon {
    font-size: 1rem;
}

/* Modal styles */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.create-modal {
    background: #1e293b;
    border-radius: 12px;
    padding: 1.5rem;
    width: 400px;
    max-width: 90%;
    border: 1px solid #334155;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
}

.modal-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #f8fafc;
    margin-bottom: 1rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #cbd5e1;
    margin-bottom: 0.375rem;
}

.form-input {
    width: 100%;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: #f8fafc;
    font-size: 0.875rem;
    outline: none;
    transition: all 0.2s;
}

.form-input:focus {
    border-color: #38bdf8;
    box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.1);
}

.color-selector {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.color-option {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
}

.color-option:hover {
    transform: scale(1.1);
}

.color-option.active {
    border-color: white;
    box-shadow: 0 0 0 2px #38bdf8;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
}

.btn-secondary {
    padding: 0.5rem 1rem;
    background: #334155;
    border: none;
    border-radius: 6px;
    color: #e2e8f0;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-secondary:hover {
    background: #475569;
}

.btn-primary {
    padding: 0.5rem 1rem;
    background: #38bdf8;
    border: none;
    border-radius: 6px;
    color: #0f172a;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
    background: #0ea5e9;
    transform: translateY(-1px);
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>