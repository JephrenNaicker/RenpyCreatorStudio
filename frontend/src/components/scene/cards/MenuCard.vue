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