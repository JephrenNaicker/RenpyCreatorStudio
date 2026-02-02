<template>
    <aside class="sidebar">
        <h3>Characters</h3>

        <div class="character-list">
            <div v-for="char in characters" :key="char.id" class="character-item"
                :class="{ active: selectedCharacterId === char.id }" @click="$emit('select-character', char)">
                <span class="color-dot" :style="{ background: char.color }" />
                <span class="character-name">{{ char.name }}</span>
                <span class="expression-count">{{ char.expressions?.length || 0 }} 😀</span>
            </div>
        </div>

        <button class="secondary small" @click="$emit('add-character')">
            + Add Character to Project
        </button>

        <div class="sidebar-section">
            <h4>Recent Scenes</h4>
            <div v-for="scene in scenes" :key="scene.id" class="scene-item" @click="$emit('select-scene', scene)">
                <span class="scene-icon">🎬</span>
                {{ scene.name }}
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import type { Character, Scene } from '@/types';

interface Props {
    characters: Character[];
    scenes?: Scene[];
    selectedCharacterId?: string | null; // Accept null
}

interface Emits {
    (e: 'select-character', character: Character): void;
    (e: 'add-character'): void;
    (e: 'select-scene', scene: Scene): void;
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<style scoped>
.sidebar {
    background: #020617;
    border-right: 1px solid #334155;
    padding: 1rem;
    overflow-y: auto;
    height: 100%;
}

h3,
h4 {
    margin-bottom: 1rem;
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
}

.expression-count {
    font-size: 0.8rem;
    opacity: 0.7;
    flex-shrink: 0;
}

.sidebar-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #334155;
}

.scene-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
}

.scene-item:hover {
    background: #1e293b;
}

.scene-icon {
    opacity: 0.7;
}

.secondary {
    background: #1e293b;
    border: none;
    color: #e2e8f0;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    width: 100%;
    cursor: pointer;
    transition: background 0.2s;
}

.secondary:hover {
    background: #2d3748;
}

.small {
    font-size: 0.85rem;
}
</style>