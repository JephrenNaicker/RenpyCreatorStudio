<!-- frontend/src/components/scene/CharacterRoster.vue -->
<template>
    <div class="character-roster">
        <div class="roster-header">
            <h3>Characters</h3>
            <CharacterPickerDropdown :characters="allCharacters" :selected-character-ids="selectedCharacterIds"
                button-label="" :show-label="false" multi-select @create="$emit('create-character', $event)"
                @update:selectedIds="$emit('add-characters', $event)" />
        </div>
        <div class="character-list">
            <div v-for="char in characters" :key="char.id" class="character-item"
                :class="{ active: selectedCharacterId === char.id }" @click="$emit('select-character', char)">
                <span class="color-dot" :style="{ background: char.color }" />
                <span class="character-name">{{ char.name }}</span>
                <span class="expression-count">{{ char.expressions?.length || 0 }} 😀</span>
                <button class="remove-character" @click.stop="$emit('remove-character', char.id)"
                    title="Remove from project">
                    <span>✕</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Character } from '@/utils/dummyData';
import CharacterPickerDropdown from '@/components/character/CharacterPickerDropdown.vue';

interface Props {
    characters: Character[];
    allCharacters?: Character[];
    selectedCharacterId?: string | null;
}

interface Emits {
    (e: 'select-character', character: Character): void;
    (e: 'remove-character', characterId: string): void;
    (e: 'add-characters', characterIds: string[]): void;
    (e: 'create-character', character: Omit<Character, 'id' | 'created_at' | 'updated_at'>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const selectedCharacterIds = computed(() =>
    props.characters.map(c => c.id)
);
</script>

<style scoped>
.roster-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.roster-header h3 {
    margin: 0;
    color: #f8fafc;
}

.character-list {
    margin-bottom: 1.5rem;
}

.character-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 0.25rem;
    transition: all 0.2s;
}

.character-item:hover {
    background: #1e293b;
}

.character-item.active {
    background: rgba(56, 189, 248, 0.2);
    border-left: 3px solid #38bdf8;
}

.color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
}

.character-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #e2e8f0;
}

.expression-count {
    font-size: 0.8rem;
    opacity: 0.7;
    flex-shrink: 0;
}

.remove-character {
    background: transparent;
    border: none;
    padding: 0.2rem 0.35rem;
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #64748b;
    opacity: 0;
    transition: all 0.2s;
    flex-shrink: 0;
}

.character-item:hover .remove-character {
    opacity: 1;
}

.remove-character:hover {
    color: #f87171;
    background: rgba(239, 68, 68, 0.1);
}
</style>