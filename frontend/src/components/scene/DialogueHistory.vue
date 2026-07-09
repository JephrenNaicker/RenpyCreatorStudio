<template>
    <div class="dialogue-history-container">
        <div class="dialogue-history-header">
            <h4>Dialogue History<span v-if="isDirty" class="dirty-indicator" title="Unsaved changes"> *</span></h4>
            <span class="line-count">{{ dialogueLines.length }} lines</span>
        </div>
        <div class="dialogue-history">
            <div v-for="(line, index) in dialogueLines" :key="line.id || index" class="dialogue-line" :class="{
                narrator: line.type !== 'menu' && !(line as DialogueLine).character,
                selected: selectedLineIndex === index,
                'has-position': line.type !== 'menu' && !!(line as DialogueLine).image_position,
                'is-menu': line.type === 'menu',
                'is-hidden': line.type !== 'menu' && (line as DialogueLine).speaker_visible === false
            }" :style="getLineStyle(line)" @click="handleSelectLine(index)">

                <!-- ── Menu node row ─────────────────────────────────── -->
                <template v-if="line.type === 'menu'">
                    <div class="line-header">
                        <span class="menu-badge">🔀 Menu</span>
                        <span v-if="(line as MenuNode).prompt" class="menu-prompt">
                            "{{ (line as MenuNode).prompt }}"
                        </span>
                        <span class="menu-count">{{ (line as MenuNode).choices.length }} choices</span>
                    </div>
                    <div class="menu-choices-preview">
                        <span v-for="(choice, ci) in (line as MenuNode).choices" :key="choice.id" class="choice-chip">
                            {{ ci + 1 }}. {{ choice.text }}
                            <span v-if="choice.effects && choice.effects.length" class="effect-dot"
                                :title="`${choice.effects.length} effect(s)`">●</span>
                        </span>
                    </div>
                </template>

                <!-- ── Dialogue line row ─────────────────────────────── -->
                <template v-else>
                    <div class="line-header">
                        <div class="speaker" :style="{ color: (line as DialogueLine).character?.color || '#94a3b8' }">
                            {{ (line as DialogueLine).character?.name || 'Narrator' }}
                        </div>

                        <!-- Visibility toggle — only for named characters, not Narrator -->
                        <VisibilityToggle v-if="(line as DialogueLine).character"
                            :model-value="(line as DialogueLine).speaker_visible === false"
                            @change="(hidden) => updateVisibility(index, hidden)" @click.stop />

                        <div v-if="(line as DialogueLine).expression" class="expression">
                            {{ getExpressionEmoji((line as DialogueLine).expression!) }}
                            <span class="expression-name">{{ (line as DialogueLine).expression }}</span>
                        </div>
                        <!-- Position indicator button -->
                        <button class="position-indicator" @click.stop="togglePositionSelector(index)"
                            :class="{ active: activePositionLineIndex === index }"
                            :title="getPositionTooltip((line as DialogueLine).image_position)">
                            {{ getPositionIcon((line as DialogueLine).image_position) }}
                        </button>
                    </div>
                    <div class="text">{{ (line as DialogueLine).text }}</div>
                </template>

                <!-- ── Shared actions (edit/delete work for both types) ── -->
                <div class="line-actions">
                    <button class="icon-btn" @click.stop="handleEditLine(index)" title="Edit">
                        ✏️
                    </button>
                    <button class="icon-btn danger" @click.stop="handleDeleteLine(index)" title="Delete">
                        🗑️
                    </button>
                </div>

                <!-- Position Selector Popup (dialogue lines only) -->
                <div v-if="activePositionLineIndex === index && line.type !== 'menu'" class="position-selector-popup"
                    @click.stop>
                    <ImagePositionSelector :model-value="(line as DialogueLine).image_position"
                        :character-name="(line as DialogueLine).character?.name"
                        :character-color="(line as DialogueLine).character?.color"
                        @update:model-value="(pos) => updateLinePosition(index, pos)"
                        @change="(pos) => updateLinePosition(index, pos)" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import ImagePositionSelector from '@/components/scene/ImagePositionSelector.vue';
import VisibilityToggle from '@/components/scene/VisibilityToggle.vue';
import type { DialogueLine, MenuNode, SceneLine } from '@/types/models';
import type { ImagePosition } from '@/components/scene/ImagePositionSelector.vue';

interface Props {
    dialogueLines: SceneLine[];
    selectedLineIndex?: number | null;
    isDirty?: boolean;
}

interface Emits {
    (e: 'select-line', index: number | null): void;
    (e: 'edit-line', index: number): void;
    (e: 'delete-line', index: number): void;
    (e: 'update-line-position', payload: { index: number; position: ImagePosition | undefined }): void;
    (e: 'update-line-visibility', payload: { index: number; visible: boolean }): void;
}

const props = withDefaults(defineProps<Props>(), {
    selectedLineIndex: null,
    isDirty: false
});

const emit = defineEmits<Emits>();

// Position selector state
const activePositionLineIndex = ref<number | null>(null);

// Helper functions
const getExpressionEmoji = (expression: string) => {
    const emojiMap: Record<string, string> = {
        'happy': '😊',
        'sad': '😢',
        'angry': '😠',
        'surprised': '😲',
        'neutral': '😐',
        'smile': '😄',
        'concerned': '😟',
        'serious': '😐',
        'mysterious': '🕵️',
        'determined': '💪',
        'excited': '🤩',
        'tired': '😴',
        'confused': '😕',
        'thinking': '🤔'
    };
    return emojiMap[expression] || '😀';
};

const getPositionIcon = (position: ImagePosition | undefined): string => {
    if (!position) return '📍';
    switch (position.position) {
        case 'left': return '◀📍';
        case 'center': return '◆📍';
        case 'right': return '📍▶';
        case 'custom': return '⚙️📍';
        default: return '📍';
    }
};

const getPositionTooltip = (position: ImagePosition | undefined): string => {
    if (!position) return 'No position set - Click to add position';
    let label = `Position: ${position.position}`;
    if (position.transform?.flip_x) label += ' (Flipped)';
    if (position.transform?.zoom && position.transform.zoom !== 1) label += ` (Zoom: ${position.transform.zoom}x)`;
    return label;
};

// Add this computed style function
const getLineStyle = (line: SceneLine) => {
    // Only apply character color border for dialogue lines with a character
    if (line.type !== 'menu' && (line as DialogueLine).character) {
        const character = (line as DialogueLine).character;
        // If it has a position, use the character's color for the border
        if ((line as DialogueLine).image_position) {
            return {
                borderLeftColor: character?.color || '#38bdf8'
            };
        }
    }
    // For narrator lines without character, keep default or use a neutral color
    if (line.type !== 'menu' && !(line as DialogueLine).character) {
        return {
            borderLeftColor: '#475569' // Same as narrator border
        };
    }
    // For menu nodes, keep amber
    if (line.type === 'menu') {
        return {
            borderLeftColor: '#f59e0b'
        };
    }
    return {};
};

// Event handlers
const handleSelectLine = (index: number) => {
    emit('select-line', index);
};

const handleEditLine = (index: number) => {
    emit('edit-line', index);
};

const handleDeleteLine = (index: number) => {
    emit('delete-line', index);
};

const updateVisibility = (index: number, hidden: boolean) => {
    emit('update-line-visibility', { index, visible: !hidden });
};

const togglePositionSelector = (index: number) => {
    if (activePositionLineIndex.value === index) {
        activePositionLineIndex.value = null;
    } else {
        activePositionLineIndex.value = index;
    }
};

const updateLinePosition = (index: number, position: ImagePosition | undefined) => {
    emit('update-line-position', { index, position });
    // keep popup open so user can continue adjusting — closes on outside click
};

// Close position selector when clicking outside.
// The popup and position button both use @click.stop, so any click that
// reaches the document came from outside those elements.
// We ignore clicks on the dialogue-line card itself so line selection
// doesn't close the popup unexpectedly.
const handleClickOutside = (event: MouseEvent) => {
    if (activePositionLineIndex.value === null) return;
    const target = event.target as HTMLElement;
    // If click is inside any position-selector-popup, do nothing (handled by @click.stop)
    if (target.closest('.position-selector-popup')) return;
    // If click is on the position indicator button, do nothing (toggle handles it)
    if (target.closest('.position-indicator')) return;
    activePositionLineIndex.value = null;
};

// Lifecycle hooks
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.dirty-indicator {
    color: #38bdf8;
    font-weight: bold;
}

.dialogue-history-container {
    flex: 3;
    display: flex;
    flex-direction: column;
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    overflow: hidden;
    min-width: 300px;
}

.dialogue-history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: rgba(255, 255, 255, 0.03);
    border-bottom: 1px solid #334155;
    flex-shrink: 0;
}

.dialogue-history-header h4 {
    color: #f8fafc;
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
}

.line-count {
    color: #94a3b8;
    font-size: 0.85rem;
    background: rgba(56, 189, 248, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
}

.dialogue-history {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    position: relative;
}

/* Dialogue line styles */
.dialogue-line {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.2s;
    cursor: pointer;
    position: relative;
}

.dialogue-line.has-position {
    /* Remove the hardcoded color, will use inline style */
    border-left-width: 3px;
    border-left-style: solid;
}

/* Keep narrator fallback */
.dialogue-line.narrator {
    border-left-color: #475569 !important;
}

/* Keep menu styling */
.dialogue-line.is-menu {
    border-left-color: #f59e0b !important;
}

.dialogue-line:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(56, 189, 248, 0.3);
}

.dialogue-line.selected {
    background: rgba(56, 189, 248, 0.1);
    border-color: #38bdf8;
}

.dialogue-line.narrator {
    border-left-color: #475569;
}

/* Menu node gets a distinct amber accent so it's visually obvious in the list */
.dialogue-line.is-menu {
    border-left: 3px solid #f59e0b;
    background: rgba(245, 158, 11, 0.03);
}

.dialogue-line.is-menu:hover {
    border-color: rgba(245, 158, 11, 0.5);
}

.dialogue-line.is-menu.selected {
    background: rgba(245, 158, 11, 0.08);
    border-color: #f59e0b;
}

.menu-badge {
    font-size: 0.78rem;
    font-weight: 700;
    color: #f59e0b;
    letter-spacing: 0.03em;
}

.menu-prompt {
    flex: 1;
    font-size: 0.82rem;
    color: #94a3b8;
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.menu-count {
    font-size: 0.72rem;
    color: #64748b;
    background: rgba(245, 158, 11, 0.1);
    padding: 0.1rem 0.45rem;
    border-radius: 10px;
}

.menu-choices-preview {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding-left: 0.25rem;
}

.choice-chip {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    color: #cbd5e1;
    padding: 0.2rem 0;
}

.effect-dot {
    color: #38bdf8;
    font-size: 0.6rem;
    opacity: 0.7;
}

.line-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
}

.speaker {
    font-weight: bold;
    font-size: 1rem;
    flex-shrink: 0;
}

.expression {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #94a3b8;
    margin-left: auto;
    flex-shrink: 0;
}

.expression-name {
    font-size: 0.8rem;
    opacity: 0.8;
}

.position-indicator {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    font-size: 0.9rem;
    border-radius: 4px;
    transition: all 0.2s;
}

.position-indicator:hover {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.1);
}

.position-indicator.active {
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.2);
}

.position-selector-popup {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    margin-top: 0.5rem;
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.text {
    color: #cbd5e1;
    line-height: 1.5;
    font-size: 1rem;
    padding: 0.5rem 0;
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

/* Hidden character — dims the card, red left border */
.dialogue-line.is-hidden {
    opacity: 0.55;
    border-left: 3px solid #f87171 !important;
}

.dialogue-line.is-hidden:hover {
    opacity: 0.85;
}

/* Scrollbar */
.dialogue-history::-webkit-scrollbar {
    width: 6px;
}

.dialogue-history::-webkit-scrollbar-track {
    background: #0f172a;
    border-radius: 3px;
}

.dialogue-history::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
}

.dialogue-history::-webkit-scrollbar-thumb:hover {
    background: #475569;
}
</style>