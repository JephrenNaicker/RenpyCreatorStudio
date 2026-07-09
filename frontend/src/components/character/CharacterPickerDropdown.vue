<!-- frontend/src/components/character/CharacterPickerDropdown.vue -->
<template>
    <div class="character-picker-dropdown" ref="dropdownContainer" id="character-picker-dropdown">
        <!-- Trigger Button -->
        <button class="trigger-btn" :class="{ active: isOpen }" @click="toggleDropdown" :title="buttonLabel"
            :id="`character-picker-trigger-${buttonLabel.replace(/\s/g, '-').toLowerCase()}`">
            <slot name="trigger">
                <span class="trigger-icon" id="trigger-icon">+</span>
                <span v-if="showLabel" class="trigger-label" id="trigger-label">{{ buttonLabel }}</span>
            </slot>
        </button>

        <!-- Dropdown Content (teleported to <body> so it can't be clipped by a scrolling/narrow ancestor) -->
        <Teleport to="body">
            <Transition name="dropdown">
                <div v-if="isOpen" class="dropdown-content" ref="dropdownContent" id="dropdown-content"
                    :style="dropdownStyle">

                    <!-- Search Input -->
                    <div class="search-section" id="search-section">
                        <input ref="searchInput" v-model="searchQuery" type="text" class="search-input"
                            placeholder="Search or create character..." @keyup.enter="handleCreateNew"
                            id="character-search-input" />
                    </div>

                    <!-- Character List -->
                    <div class="character-list-section" id="character-list-section">
                        <div class="list-header" id="list-header">
                            <span class="list-title" id="list-title">Existing Characters</span>
                            <span class="list-count" id="list-count">{{ filteredCharacters.length }}</span>
                        </div>

                        <div v-if="filteredCharacters.length > 0" class="character-list" id="character-list">
                            <div v-for="(char, index) in filteredCharacters" :key="char.id" class="character-item"
                                :class="{ selected: isCharacterSelected(char.id) }" @click="selectCharacter(char)"
                                :id="`character-item-${char.id}`" :data-character-id="char.id"
                                :data-character-name="char.name" :data-selected="isCharacterSelected(char.id)"
                                :data-index="index">
                                <div class="character-color" :style="{ backgroundColor: char.color }"
                                    :id="`character-color-${char.id}`"></div>
                                <div class="character-info" id="character-info">
                                    <div class="character-name" :id="`character-name-${char.id}`">{{ char.name }}
                                    </div>
                                    <div v-if="char.nickname" class="character-nick" :id="`character-nick-${char.id}`">
                                        "{{ char.nickname }}"
                                    </div>
                                </div>
                                <div class="character-stats" :id="`character-stats-${char.id}`">
                                    <span class="stat-badge" :id="`character-expressions-${char.id}`">😀 {{
                                        char.expressions?.length || 0 }}</span>
                                    <span class="stat-badge" :id="`character-outfits-${char.id}`">👕 {{
                                        char.outfits?.length || 0 }}</span>
                                </div>
                                <div v-if="isCharacterSelected(char.id)" class="check-icon" id="check-icon">✓</div>
                            </div>
                        </div>

                        <div v-else class="empty-state" id="empty-state">
                            <span class="empty-icon" id="empty-icon">🔍</span>
                            <p id="empty-message">No characters found matching "{{ searchQuery }}"</p>
                        </div>
                    </div>

                    <!-- Quick Create Character Section -->
                    <div class="create-section" id="create-section">
                        <div class="divider" id="divider"></div>
                        <button class="create-btn" @click="handleCreateNew" id="quick-create-btn">
                            <span class="create-icon" id="create-icon">✨</span>
                            <span class="create-text" id="create-text">
                                Quick Create "{{ searchQuery || 'Character' }}"
                            </span>
                        </button>
                    </div>
                </div>
            </Transition>
        </Teleport>

        <!-- Quick Create Modal -->
        <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal" id="create-modal-overlay">
            <div class="create-modal" id="create-modal">
                <h3 class="modal-title" id="modal-title">Quick Create Character</h3>

                <div class="form-group" id="form-group-name">
                    <label class="form-label" id="name-label">Character Name *</label>
                    <input v-model="newCharacter.name" type="text" class="form-input" placeholder="e.g., John Smith"
                        @keyup.enter="confirmCreateCharacter" id="character-name-input" />
                </div>

                <div class="form-group" id="form-group-nickname">
                    <label class="form-label" id="nickname-label">Nickname (Optional)</label>
                    <input v-model="newCharacter.nickname" type="text" class="form-input"
                        placeholder="e.g., The Detective" id="character-nickname-input" />
                </div>

                <div class="form-group" id="form-group-color">
                    <label class="form-label" id="color-label">Color</label>
                    <div class="color-selector" id="color-selector">
                        <div v-for="(color, index) in presetColors" :key="color" class="color-option"
                            :style="{ backgroundColor: color }" :class="{ active: newCharacter.color === color }"
                            @click="newCharacter.color = color" :id="`color-option-${index}`" :data-color-value="color">
                        </div>
                    </div>
                </div>

                <div class="modal-actions" id="modal-actions">
                    <div class="modal-actions-left" id="modal-actions-left">
                        <button class="btn-advanced" @click="goToAdvancedCreator" id="advanced-creator-btn">
                            <span class="advanced-icon" id="advanced-icon">⚙️</span>
                            Advanced Creation
                        </button>
                    </div>
                    <div class="modal-actions-right" id="modal-actions-right">
                        <button class="btn-secondary" @click="closeCreateModal" id="cancel-create-btn">
                            Cancel
                        </button>
                        <button class="btn-primary" @click="confirmCreateCharacter"
                            :disabled="!newCharacter.name.trim()" id="confirm-create-btn">
                            Quick Create
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { Character } from '@/types/models';

// Props interface
interface Props {
    characters?: Character[];
    selectedCharacterIds?: string[];
    buttonLabel?: string;
    showLabel?: boolean;
    multiSelect?: boolean;
    projectId?: string;
    maxSelections?: number;
}

const props = withDefaults(defineProps<Props>(), {
    characters: () => [],
    selectedCharacterIds: () => [],
    buttonLabel: 'Add Character',
    showLabel: true,
    multiSelect: false,
    projectId: undefined,
    maxSelections: undefined,
});

// Emits
const emit = defineEmits<{
    (e: 'select', character: Character): void;
    (e: 'create', character: Omit<Character, 'id' | 'created_at' | 'updated_at'>): void;
    (e: 'update:selectedIds', ids: string[]): void;
    (e: 'remove', characterId: string): void;
}>();

const router = useRouter();

// DOM refs
const dropdownContainer = ref<HTMLElement | null>(null);
const dropdownContent = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

// Dropdown state
const isOpen = ref(false);
const searchQuery = ref('');

// Teleported dropdown's computed inline position (fixed + viewport-clamped)
const dropdownStyle = ref<Record<string, string>>({});
const DROPDOWN_WIDTH = 380;
const VIEWPORT_MARGIN = 12;
const ESTIMATED_HEIGHT = 420;

// Create character modal
const showCreateModal = ref(false);
const newCharacter = ref({
    name: '',
    nickname: '',
    color: '#38bdf8',
    bio: '',
    voice_lines: [],
    outfits: [],
    expressions: []
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

// Computed: Filtered characters based on search
const filteredCharacters = computed(() => {
    if (!searchQuery.value.trim()) return props.characters;

    const query = searchQuery.value.toLowerCase();
    return props.characters.filter(char =>
        char.name.toLowerCase().includes(query) ||
        (char.nickname && char.nickname.toLowerCase().includes(query))
    );
});

// Computed: Check if max selections reached
const isMaxSelectionsReached = computed(() => {
    if (!props.multiSelect || props.maxSelections === undefined) return false;
    return props.selectedCharacterIds.length >= props.maxSelections;
});

// Methods
const isCharacterSelected = (charId: string): boolean => {
    return props.selectedCharacterIds?.includes(charId) ?? false;
};

// Compute a fixed, viewport-clamped position for the teleported dropdown,
// anchored to wherever the trigger button actually is on screen.
const positionDropdown = (): void => {
    if (!dropdownContainer.value) return;

    const rect = dropdownContainer.value.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: right edge of dropdown aligns with right edge of trigger, opening downward
    let left = rect.right - DROPDOWN_WIDTH;
    let top = rect.bottom + 8;

    // Clamp horizontally so it can never run off either edge
    if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;
    if (left + DROPDOWN_WIDTH > vw - VIEWPORT_MARGIN) {
        left = vw - DROPDOWN_WIDTH - VIEWPORT_MARGIN;
    }

    // Flip above the trigger if there isn't room below
    if (top + ESTIMATED_HEIGHT > vh - VIEWPORT_MARGIN && rect.top - ESTIMATED_HEIGHT > VIEWPORT_MARGIN) {
        top = rect.top - ESTIMATED_HEIGHT - 8;
    }

    dropdownStyle.value = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${DROPDOWN_WIDTH}px`,
        zIndex: '9999'
    };
};

const handleReposition = (): void => {
    if (isOpen.value) positionDropdown();
};

const toggleDropdown = async (): Promise<void> => {
    if (isMaxSelectionsReached.value && !isOpen.value) {
        // Don't open if max selections reached
        return;
    }

    isOpen.value = !isOpen.value;
    if (isOpen.value) {
        positionDropdown();
        await nextTick();
        searchInput.value?.focus();
    }
};

const closeDropdown = (): void => {
    isOpen.value = false;
    searchQuery.value = '';
};

const selectCharacter = (character: Character): void => {
    if (props.multiSelect) {
        // Multi-select mode
        const isSelected = isCharacterSelected(character.id);

        if (isSelected) {
            // Remove character
            const newIds = props.selectedCharacterIds.filter(id => id !== character.id);
            emit('update:selectedIds', newIds);
            emit('remove', character.id);
        } else {
            // Add character - check max limit
            if (props.maxSelections && props.selectedCharacterIds.length >= props.maxSelections) {
                console.warn(`Maximum ${props.maxSelections} selections allowed`);
                return;
            }
            const newIds = [...props.selectedCharacterIds, character.id];
            emit('update:selectedIds', newIds);
            emit('select', character);
        }
    } else {
        // Single-select mode
        emit('select', character);
        closeDropdown();
    }
};

const handleCreateNew = (): void => {
    if (searchQuery.value.trim()) {
        newCharacter.value.name = searchQuery.value;
    }
    showCreateModal.value = true;
    closeDropdown();
};

const goToAdvancedCreator = (): void => {
    closeCreateModal();
    const params = new URLSearchParams();
    if (newCharacter.value.name) params.append('name', newCharacter.value.name);
    if (props.projectId) params.append('projectId', props.projectId);

    const route = `/characters/new${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(route);
};

const confirmCreateCharacter = async (): Promise<void> => {
    if (!newCharacter.value.name.trim()) return;

    const characterData: Omit<Character, 'id' | 'created_at' | 'updated_at'> = {
        name: newCharacter.value.name.trim(),
        nickname: newCharacter.value.nickname || undefined,
        color: newCharacter.value.color,
        bio: newCharacter.value.bio || '',
        voice_lines: [],
        outfits: [],
        expressions: []
    };

    emit('create', characterData);  // ✅ Emits the event
    closeCreateModal();
    searchQuery.value = '';
};

const closeCreateModal = (): void => {
    showCreateModal.value = false;
    newCharacter.value = {
        name: '',
        nickname: '',
        color: '#38bdf8',
        bio: '',
        voice_lines: [],
        outfits: [],
        expressions: []
    };
};

// Handle click outside — must check BOTH the trigger container and the
// teleported dropdown content, since the dropdown now lives in <body>
// and is no longer a DOM descendant of dropdownContainer.
const handleClickOutside = (event: MouseEvent): void => {
    const target = event.target as Node;
    const insideTrigger = dropdownContainer.value?.contains(target) ?? false;
    const insideDropdown = dropdownContent.value?.contains(target) ?? false;

    if (isOpen.value && !insideTrigger && !insideDropdown) {
        closeDropdown();
    }
};

// Watch for selectedCharacterIds changes to close dropdown if needed
watch(() => props.selectedCharacterIds, () => {
    if (!props.multiSelect && props.selectedCharacterIds.length > 0) {
        closeDropdown();
    }
});

// Lifecycle
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true); // capture phase catches sidebar's own scroll
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('resize', handleReposition);
    window.removeEventListener('scroll', handleReposition, true);
});

// Expose methods for testing
defineExpose({
    openDropdown: () => { isOpen.value = true; positionDropdown(); },
    closeDropdown,
    isOpen,
    selectedIds: props.selectedCharacterIds
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

.trigger-label {
    font-weight: 500;
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

/* Position/top/left/width/z-index now come entirely from the :style="dropdownStyle" binding,
   computed in JS against the trigger's real screen position and clamped to the viewport. */
.dropdown-content {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    overflow: hidden;
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
    width: 480px;
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
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
}

.modal-actions-left {
    flex: 1;
}

.modal-actions-right {
    display: flex;
    gap: 0.75rem;
}

.btn-advanced {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid #334155;
    border-radius: 6px;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
}

.btn-advanced:hover {
    background: #2d3748;
    border-color: #38bdf8;
    color: #38bdf8;
    transform: translateY(-1px);
}

.advanced-icon {
    font-size: 1rem;
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

/* Scrollbar styling */
.character-list-section::-webkit-scrollbar {
    width: 6px;
}

.character-list-section::-webkit-scrollbar-track {
    background: #0f172a;
    border-radius: 3px;
}

.character-list-section::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
}

.character-list-section::-webkit-scrollbar-thumb:hover {
    background: #475569;
}
</style>