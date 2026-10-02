<!-- frontend/src/components/scene/cards/MenuCard.vue -->
<template>
    <div class="dialogue-line is-menu" :class="{ selected }" @click="emit('select', index)">
        <div class="line-header">
            <span class="menu-badge">🔀 Menu</span>
            <span v-if="line.prompt" class="menu-prompt">"{{ line.prompt }}"</span>
            <span class="menu-count">{{ line.choices.length }} choices</span>
        </div>

        <div class="menu-choices-preview">
            <span v-for="(choice, ci) in line.choices" :key="choice.id" class="choice-chip">
                {{ ci + 1 }}. {{ choice.text }}
                <span v-if="choice.effects?.length" class="effect-dot"
                    :title="`${choice.effects.length} effect(s)`">●</span>
            </span>
        </div>

        <div class="line-actions">
            <button class="icon-btn" @click.stop="emit('edit', index)" title="Edit">✏️</button>
            <button class="icon-btn danger" @click.stop="emit('delete', index)" title="Delete">🗑️</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { MenuNode } from '@/types/models';

interface Props {
    line: MenuNode;
    index: number;
    selected: boolean;
}

const props = defineProps<Props>();

interface Emits {
    (e: 'select', index: number): void;
    (e: 'edit', index: number): void;
    (e: 'delete', index: number): void;
}

const emit = defineEmits<Emits>();
</script>

<style scoped>
.dialogue-line.is-menu {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background: rgba(168, 85, 247, 0.08);
    border: 1px solid rgba(168, 85, 247, 0.25);
    border-left: 4px solid #c084fc;
    transition: all 0.2s;
    cursor: pointer;
    position: relative;
}

.dialogue-line.is-menu:hover {
    background: rgba(168, 85, 247, 0.14);
    border-color: rgba(168, 85, 247, 0.4);
}

.dialogue-line.is-menu.selected {
    background: rgba(168, 85, 247, 0.2);
    border-color: #c084fc;
    box-shadow: 0 0 12px rgba(192, 132, 252, 0.2);
}

.line-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
}

.menu-badge {
    background: rgba(168, 85, 247, 0.25);
    color: #e9d5ff;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
    border: 1px solid rgba(168, 85, 247, 0.3);
}

.menu-prompt {
    color: #f3e8ff;
    font-weight: 500;
    font-size: 0.95rem;
}

.menu-count {
    color: #a855f7;
    font-size: 0.8rem;
    margin-left: auto;
}

.menu-choices-preview {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.choice-chip {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(168, 85, 247, 0.3);
    color: #cbd5e1;
    font-size: 0.85rem;
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}

.effect-dot {
    color: #38bdf8;
    font-size: 0.7rem;
}

.line-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    opacity: 0;
    transition: opacity 0.2s;
}

.dialogue-line:hover .line-actions {
    opacity: 1;
}

.icon-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.25rem;
    font-size: 0.9rem;
    border-radius: 4px;
    transition: all 0.2s;
}

.icon-btn:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.1);
}

.icon-btn.danger:hover {
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
}
</style>