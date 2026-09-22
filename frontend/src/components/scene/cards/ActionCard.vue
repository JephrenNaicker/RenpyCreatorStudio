<template>
    <div class="dialogue-line is-action" :class="{ selected }" @click="emit('select', index)">
        <!-- Header -->
        <div class="line-header">
            <span class="action-badge">
                🖼️ Background Change
            </span>

            <div class="line-actions">
                <button class="icon-btn" @click.stop="emit('edit', index)" title="Edit">
                    ✏️
                </button>

                <button class="icon-btn danger" @click.stop="emit('delete', index)" title="Delete">
                    🗑️
                </button>
            </div>
        </div>

        <!-- Background Preview -->
        <div class="action-preview">
            <!-- Background Image -->
            <img v-if="line.background_path" :src="getActionThumb(line.background_path)"
                :alt="line.background_name || 'Background'" class="action-preview-img" />

            <!-- Dark Gradient -->
            <div v-if="line.background_path" class="action-preview-overlay"></div>

            <!-- Empty State -->
            <div v-if="!line.background_path" class="action-preview-empty">
                <span>🚫</span>
                <span>No background selected</span>
            </div>

            <!-- Background Name -->
            <div v-if="line.background_path" class="action-name">
                {{ line.background_name || line.background_path || 'No background' }}
            </div>
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

defineProps<Props>();

interface Emits {
    (e: 'select', index: number): void;
    (e: 'edit', index: number): void;
    (e: 'delete', index: number): void;
}

const emit = defineEmits<Emits>();

const getActionThumb = (path?: string) => {
    if (!path) return '';

    if (
        path.startsWith('blob:') ||
        path.startsWith('data:') ||
        path.startsWith('http')
    ) {
        return path;
    }

    return `https://picsum.photos/seed/${encodeURIComponent(path)}/864/100`;
};
</script>

<style scoped>
/* =========================================================
   CARD
   ========================================================= */

.dialogue-line {
    position: relative;

    display: flex;
    flex-direction: column;
    gap: 0.65rem;

    margin-bottom: 1rem;
    padding: 0.9rem 1rem 1rem 1.25rem;

    border-radius: 10px;
    border: 1px solid transparent;
    border-left: 3px solid #2dd4bf;

    background: rgba(255, 255, 255, 0.02);

    cursor: pointer;

    transition:
        background 0.2s ease,
        border-color 0.2s ease,
        transform 0.2s ease;
}

.dialogue-line:hover {
    background: rgba(255, 255, 255, 0.045);
    border-color: rgba(45, 212, 191, 0.35);
}

.dialogue-line.selected {
    background: rgba(45, 212, 191, 0.08);
    border-color: #2dd4bf;
}


/* =========================================================
   HEADER
   ========================================================= */

.line-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    min-width: 0;
}

.action-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;

    padding: 0.25rem 0.65rem;

    border-radius: 999px;

    background: rgba(45, 212, 191, 0.1);
    border: 1px solid rgba(45, 212, 191, 0.15);

    color: #2dd4bf;

    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.025em;

    white-space: nowrap;
}


/* =========================================================
   ACTION BUTTONS
   ========================================================= */

.line-actions {
    display: flex;
    align-items: center;
    gap: 0.3rem;

    margin-left: auto;

    opacity: 0;

    transition: opacity 0.2s ease;
}

.dialogue-line:hover .line-actions,
.dialogue-line.selected .line-actions {
    opacity: 1;
}

.icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 28px;
    height: 28px;

    padding: 0;

    background: transparent;
    border: none;
    border-radius: 5px;

    color: #94a3b8;

    cursor: pointer;

    transition:
        background 0.15s ease,
        color 0.15s ease;
}

.icon-btn:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.1);
}

.icon-btn.danger:hover {
    color: #f87171;
    background: rgba(248, 113, 113, 0.1);
}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

.action-preview {
    position: relative;

    width: 100%;
    height: 100px;

    overflow: hidden;

    border-radius: 7px;
    border: 1px solid #334155;

    background: #0f172a;

    isolation: isolate;

    transition:
        border-color 0.2s ease,
        transform 0.2s ease;
}

.dialogue-line:hover .action-preview {
    border-color: rgba(45, 212, 191, 0.4);
}


/* =========================================================
   BACKGROUND IMAGE
   ========================================================= */

.action-preview-img {
    position: absolute;
    inset: 0;

    width: 100%;
    height: 100%;

    object-fit: cover;

    display: block;

    transition:
        transform 0.4s ease,
        filter 0.3s ease;
}

.dialogue-line:hover .action-preview-img {
    transform: scale(1.025);
}


/* =========================================================
   GRADIENT OVERLAY
   ========================================================= */

/* =========================================================
   GRADIENT OVERLAY
   ========================================================= */

.action-preview-overlay {
    position: absolute;
    inset: 0;

    background:
        linear-gradient(to top,
            rgba(0, 0, 0, 0.85) 0%,
            rgba(0, 0, 0, 0.45) 35%,
            rgba(0, 0, 0, 0.05) 75%);

    z-index: 1;
}


/* =========================================================
   TITLE — BOTTOM LEFT
   ========================================================= */

.action-name {
    position: absolute;

    left: 1rem;
    bottom: 0.65rem;

    z-index: 2;

    max-width: 75%;

    color: #ffffff;

    font-size: 1rem;
    font-weight: 600;

    line-height: 1.25;

    text-shadow:
        0 1px 3px rgba(0, 0, 0, 0.9),
        0 2px 8px rgba(0, 0, 0, 0.6);

    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

.action-preview-empty {
    position: absolute;
    inset: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 0.5rem;

    color: #64748b;

    font-size: 0.8rem;

    background:
        repeating-linear-gradient(45deg,
            #0f172a,
            #0f172a 10px,
            #111c30 10px,
            #111c30 20px);
}

.action-preview-empty span:first-child {
    font-size: 1rem;
    opacity: 0.7;
}
</style>