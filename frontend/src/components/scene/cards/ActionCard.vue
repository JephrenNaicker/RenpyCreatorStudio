<template>
    <div class="dialogue-line is-action" :class="{ selected }" @click="emit('select', index)">
        <div class="line-header">
            <span class="action-badge">🖼️ Background Change</span>
            <span class="action-preview">
                <span v-if="line.background_path" class="action-thumb">
                    <img :src="getActionThumb(line.background_path)" alt="" />
                </span>
                <span v-else class="action-thumb action-thumb-none">🚫</span>
                {{ line.background_name || line.background_path || 'No background' }}
            </span>
        </div>

        <div class="line-actions">
            <button class="icon-btn" @click.stop="emit('edit', index)" title="Edit">✏️</button>
            <button class="icon-btn danger" @click.stop="emit('delete', index)" title="Delete">🗑️</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ActionNode } from '@/types/models';

interface Props {
    line: ActionNode;
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

const getActionThumb = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) {
        return path;
    }
    return `https://picsum.photos/seed/${encodeURIComponent(path)}/64/64`;
};
</script>