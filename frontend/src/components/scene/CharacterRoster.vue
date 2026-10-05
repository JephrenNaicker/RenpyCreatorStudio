<!-- frontend/src/components/scene/CharacterRoster.vue -->
<template>
    <div>
        <div class="flex justify-between items-center mb-3">
            <h3 class="m-0 text-slate-50 font-medium">Characters</h3>
            <CharacterPickerDropdown :characters="allCharacters" :selected-character-ids="selectedCharacterIds"
                button-label="" :show-label="false" multi-select @create="$emit('create-character', $event)"
                @update:selectedIds="$emit('add-characters', $event)" />
        </div>
        <div class="mb-6">
            <div v-for="char in characters" :key="char.id"
                class="group flex items-center gap-2 p-2 rounded-md cursor-pointer mb-1 transition-all duration-200 hover:bg-slate-800"
                :class="{ 'bg-sky-400/20 border-l-[3px] border-l-sky-400': selectedCharacterId === char.id }"
                @click="$emit('select-character', char)">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: char.color }" />
                <span class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis text-slate-200">{{ char.name
                }}</span>
                <span class="text-xs opacity-70 shrink-0">{{ char.expressions?.length || 0 }} 😀</span>
                <button
                    class="bg-transparent border-0 px-1.5 py-0.8 cursor-pointer rounded text-xs text-slate-500 opacity-0 transition-all duration-200 shrink-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10"
                    @click.stop="$emit('remove-character', char.id)" title="Remove from project">
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