<!-- frontend/src/components/scene/ImagePositionSelector.vue -->
<template>
    <div class="pos-selector" :id="`position-selector-${componentId}`">

        <!-- Character headshot strip -->
        <div class="avatar-strip" :id="`avatar-strip-${componentId}`">
            <div class="avatar" :style="{ background: avatarBg, borderColor: avatarBorder }"
                :id="`avatar-${componentId}`">
                {{ avatarInitial }}
            </div>
            <div class="avatar-info">
                <span class="avatar-name">{{ props.characterName || 'Character' }}</span>
                <span class="avatar-sub">Set stage position</span>
            </div>
            <!-- Mini stage indicator -->
            <div class="mini-stage" :id="`mini-stage-${componentId}`">
                <div class="mini-track">
                    <div class="mini-zone"><span>L</span></div>
                    <div class="mini-zone"><span>C</span></div>
                    <div class="mini-zone"><span>R</span></div>
                </div>
                <div class="mini-marker" :style="miniMarkerStyle" :id="`mini-marker-${componentId}`">
                    {{ miniMarkerIcon }}
                </div>
            </div>
        </div>

        <!-- Position buttons -->
        <div class="pos-row" :id="`pos-row-${componentId}`">
            <button class="pos-btn" :class="{ active: currentPosition === 'left' }" @click="setPosition('left')"
                title="Left aligned" :id="`btn-left-${componentId}`">
                ◀ Left
            </button>
            <button class="pos-btn" :class="{ active: currentPosition === 'center' }" @click="setPosition('center')"
                title="Center aligned" :id="`btn-center-${componentId}`">
                ◆ Center
            </button>
            <button class="pos-btn" :class="{ active: currentPosition === 'right' }" @click="setPosition('right')"
                title="Right aligned" :id="`btn-right-${componentId}`">
                Right ▶
            </button>
            <button class="pos-btn adv-btn" :class="{ active: showAdvanced }" @click="toggleAdvanced"
                title="Transform options" :id="`btn-advanced-${componentId}`">
                ⚙️
            </button>
        </div>

        <!-- Flip chips — always visible -->
        <div class="flip-row" :id="`flip-row-${componentId}`">
            <button class="flip-chip" :class="{ active: localTransform.flip_x }" @click="toggleFlip('x')"
                :id="`chip-flipx-${componentId}`">
                <span class="chip-icon">↔️</span> Flip H
            </button>
            <button class="flip-chip" :class="{ active: localTransform.flip_y }" @click="toggleFlip('y')"
                :id="`chip-flipy-${componentId}`">
                <span class="chip-icon">↕️</span> Flip V
            </button>
        </div>

        <!-- Advanced panel -->
        <div v-if="showAdvanced" class="adv-panel" :id="`adv-panel-${componentId}`">
            <!-- Zoom -->
            <div class="slider-group" :id="`zoom-group-${componentId}`">
                <div class="slider-header">
                    <label :for="`zoom-slider-${componentId}`">Zoom</label>
                    <span class="slider-val">{{ (localTransform.zoom || 1).toFixed(1) }}×</span>
                </div>
                <input type="range" v-model.number="localTransform.zoom" min="0.5" max="2.0" step="0.05"
                    @input="updateTransform" :id="`zoom-slider-${componentId}`" />
            </div>

            <!-- Opacity -->
            <div class="slider-group" :id="`alpha-group-${componentId}`">
                <div class="slider-header">
                    <label :for="`alpha-slider-${componentId}`">Opacity</label>
                    <span class="slider-val">{{ Math.round((localTransform.alpha || 1) * 100) }}%</span>
                </div>
                <input type="range" v-model.number="localTransform.alpha" min="0" max="1" step="0.01"
                    @input="updateTransform" :id="`alpha-slider-${componentId}`" />
            </div>

            <!-- Custom XY (only for custom position) -->
            <div v-if="currentPosition === 'custom'" class="slider-group" :id="`custom-position-${componentId}`">
                <div class="slider-header">
                    <label :for="`custom-x-${componentId}`">X Position</label>
                    <span class="slider-val">{{ (localCustomX || 0.5).toFixed(2) }}</span>
                </div>
                <input type="range" v-model.number="localCustomX" min="0" max="1" step="0.01"
                    @input="updateCustomPosition" :id="`custom-x-${componentId}`" />
                <div class="slider-header" style="margin-top:8px">
                    <label :for="`custom-y-${componentId}`">Y Position</label>
                    <span class="slider-val">{{ (localCustomY || 0.5).toFixed(2) }}</span>
                </div>
                <input type="range" v-model.number="localCustomY" min="0" max="1" step="0.01"
                    @input="updateCustomPosition" :id="`custom-y-${componentId}`" />
            </div>
        </div>

        <!-- Status strip -->
        <div class="status-strip" :id="`status-strip-${componentId}`">
            <div class="s-dot" :style="{ background: props.characterColor || '#38bdf8' }"></div>
            <p class="s-text">
                Position: <span>{{ positionLabel }}</span>
                <template v-if="transformSummary"> · {{ transformSummary }}</template>
                <template v-else> — no transforms</template>
            </p>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

// ── Types ──────────────────────────────────────────────────────────────────
export interface TransformConfig {
    zoom?: number;
    rotate?: number;
    flip_x?: boolean;
    flip_y?: boolean;
    alpha?: number;
}

export interface ImagePosition {
    position: 'left' | 'center' | 'right' | 'custom';
    custom_x?: number;
    custom_y?: number;
    transform?: TransformConfig;
}

// ── Props ──────────────────────────────────────────────────────────────────
interface Props {
    modelValue?: ImagePosition;
    characterName?: string;
    characterColor?: string;
    componentId?: string;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: undefined,
    characterName: 'Character',
    characterColor: '#38bdf8',
    componentId: () => `pos_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
});

// ── Emits ──────────────────────────────────────────────────────────────────
const emit = defineEmits<{
    (e: 'update:modelValue', value: ImagePosition | undefined): void;
    (e: 'change', value: ImagePosition | undefined): void;
}>();

// ── Local state ────────────────────────────────────────────────────────────
const showAdvanced = ref(false);
const currentPosition = ref<'left' | 'center' | 'right' | 'custom'>('center');
const localCustomX = ref<number>(0.5);
const localCustomY = ref<number>(0.5);
const localTransform = ref<TransformConfig>({
    zoom: 1.0,
    flip_x: false,
    flip_y: false,
    alpha: 1.0
});

// ── Avatar computed ────────────────────────────────────────────────────────
const avatarInitial = computed(() => {
    const name = props.characterName || 'C';
    return name.substring(0, 2).toUpperCase();
});

const avatarBg = computed(() => (props.characterColor || '#38bdf8') + '1a');
const avatarBorder = computed(() => (props.characterColor || '#38bdf8') + '55');

// ── Mini stage marker ──────────────────────────────────────────────────────
const MINI_POS: Record<string, { left: string; icon: string }> = {
    left: { left: 'calc(17% - 10px)', icon: '◀' },
    center: { left: 'calc(50% - 10px)', icon: '◆' },
    right: { left: 'calc(83% - 10px)', icon: '▶' },
    custom: { left: 'calc(50% - 10px)', icon: '⚙' },
};

const miniMarkerStyle = computed(() => ({
    left: MINI_POS[currentPosition.value]?.left ?? 'calc(50% - 10px)',
    borderColor: props.characterColor || '#38bdf8',
    color: props.characterColor || '#38bdf8',
    background: (props.characterColor || '#38bdf8') + '1a',
}));

const miniMarkerIcon = computed(() => MINI_POS[currentPosition.value]?.icon ?? '◆');

// ── Status strip computed ──────────────────────────────────────────────────
const positionLabel = computed(() => {
    switch (currentPosition.value) {
        case 'left': return 'Left';
        case 'center': return 'Center';
        case 'right': return 'Right';
        case 'custom': return `Custom (${localCustomX.value.toFixed(2)}, ${localCustomY.value.toFixed(2)})`;
        default: return 'None';
    }
});

const transformSummary = computed(() => {
    const parts: string[] = [];
    if (localTransform.value.flip_x) parts.push('H-flip');
    if (localTransform.value.flip_y) parts.push('V-flip');
    if (localTransform.value.zoom && localTransform.value.zoom !== 1)
        parts.push(`Zoom ${localTransform.value.zoom.toFixed(1)}×`);
    if (localTransform.value.alpha !== undefined && localTransform.value.alpha !== 1)
        parts.push(`Opacity ${Math.round(localTransform.value.alpha * 100)}%`);
    return parts.join(' · ');
});

// ── Methods ────────────────────────────────────────────────────────────────
const setPosition = (position: 'left' | 'center' | 'right' | 'custom') => {
    currentPosition.value = position;
    emitUpdate();
};

const toggleAdvanced = () => {
    showAdvanced.value = !showAdvanced.value;
};

const toggleFlip = (axis: 'x' | 'y') => {
    if (axis === 'x') {
        localTransform.value.flip_x = !localTransform.value.flip_x;
    } else {
        localTransform.value.flip_y = !localTransform.value.flip_y;
    }
    emitUpdate();
};

const updateTransform = () => {
    emitUpdate();
};

const updateCustomPosition = () => {
    if (currentPosition.value === 'custom') {
        emitUpdate();
    }
};

// Kept for backward-compat (parent may call via getPositionLabel)
const getPositionLabel = (): string => positionLabel.value;

const getPositionIcon = (): string => miniMarkerIcon.value;

const emitUpdate = () => {
    // Center with all defaults = no position set
    if (
        currentPosition.value === 'center' &&
        localTransform.value.zoom === 1 &&
        !localTransform.value.flip_x &&
        !localTransform.value.flip_y &&
        localTransform.value.alpha === 1
    ) {
        emit('update:modelValue', undefined);
        emit('change', undefined);
        return;
    }

    const value: ImagePosition = { position: currentPosition.value };

    if (currentPosition.value === 'custom') {
        value.custom_x = localCustomX.value;
        value.custom_y = localCustomY.value;
    }

    const hasTransform =
        localTransform.value.zoom !== 1 ||
        localTransform.value.flip_x ||
        localTransform.value.flip_y ||
        (localTransform.value.alpha !== undefined && localTransform.value.alpha !== 1);

    if (hasTransform) {
        value.transform = { ...localTransform.value };
    }

    emit('update:modelValue', value);
    emit('change', value);
};

const loadFromProps = () => {
    if (props.modelValue) {
        currentPosition.value = props.modelValue.position;
        if (props.modelValue.custom_x !== undefined) localCustomX.value = props.modelValue.custom_x;
        if (props.modelValue.custom_y !== undefined) localCustomY.value = props.modelValue.custom_y;
        if (props.modelValue.transform) {
            localTransform.value = {
                zoom: props.modelValue.transform.zoom ?? 1,
                flip_x: props.modelValue.transform.flip_x ?? false,
                flip_y: props.modelValue.transform.flip_y ?? false,
                alpha: props.modelValue.transform.alpha ?? 1,
            };
        }
    } else {
        currentPosition.value = 'center';
        localCustomX.value = 0.5;
        localCustomY.value = 0.5;
        localTransform.value = { zoom: 1, flip_x: false, flip_y: false, alpha: 1 };
    }
};

const resetToDefault = () => {
    currentPosition.value = 'center';
    localCustomX.value = 0.5;
    localCustomY.value = 0.5;
    localTransform.value = { zoom: 1, flip_x: false, flip_y: false, alpha: 1 };
    showAdvanced.value = false;
    emitUpdate();
};

// ── Watchers & lifecycle ───────────────────────────────────────────────────
watch(() => props.modelValue, () => { loadFromProps(); }, { deep: true });
onMounted(() => { loadFromProps(); });

// ── Expose ─────────────────────────────────────────────────────────────────
defineExpose({
    resetToDefault,
    getCurrentPosition: () => ({ position: currentPosition.value, transform: localTransform.value }),
    hasCustomPosition: () =>
        currentPosition.value !== 'center' ||
        localTransform.value.zoom !== 1 ||
        localTransform.value.flip_x ||
        localTransform.value.flip_y ||
        localTransform.value.alpha !== 1,
});
</script>

<style scoped>
/* ── Root ─────────────────────────────────────────────────────────────── */
.pos-selector {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

/* ── Avatar strip ─────────────────────────────────────────────────────── */
.avatar-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 8px;
}

.avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1.5px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: #e2e8f0;
}

.avatar-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
}

.avatar-name {
    font-size: 12px;
    font-weight: 600;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.avatar-sub {
    font-size: 11px;
    color: #475569;
}

/* ── Mini stage ───────────────────────────────────────────────────────── */
.mini-stage {
    position: relative;
    width: 88px;
    height: 26px;
    background: #060c17;
    border: 1px solid #1e293b;
    border-radius: 6px;
    overflow: hidden;
    flex-shrink: 0;
}

.mini-track {
    position: absolute;
    inset: 0;
    display: flex;
}

.mini-zone {
    flex: 1;
    border-right: 1px dashed rgba(148, 163, 184, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
}

.mini-zone:last-child {
    border-right: none;
}

.mini-zone span {
    font-size: 8px;
    color: rgba(148, 163, 184, 0.2);
    letter-spacing: 0.07em;
    text-transform: uppercase;
}

.mini-marker {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1.5px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: 700;
    transition: left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    pointer-events: none;
}

/* ── Position buttons ─────────────────────────────────────────────────── */
.pos-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 6px;
}

.pos-btn {
    height: 34px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #94a3b8;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    font-family: inherit;
    outline: none;
    position: relative;
    overflow: hidden;
}

.pos-btn:hover {
    background: #1e293b;
    border-color: #475569;
    color: #cbd5e1;
}

.pos-btn.active {
    background: rgba(56, 189, 248, 0.1);
    border-color: #38bdf8;
    color: #38bdf8;
}

.pos-btn.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 15%;
    right: 15%;
    height: 2px;
    background: #38bdf8;
    border-radius: 2px 2px 0 0;
}

.adv-btn {
    width: 34px;
    flex-shrink: 0;
}

/* ── Flip chips ───────────────────────────────────────────────────────── */
.flip-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}

.flip-chip {
    height: 32px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    color: #64748b;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    font-family: inherit;
    outline: none;
    user-select: none;
}

.flip-chip:hover {
    background: #1e293b;
    border-color: #475569;
    color: #94a3b8;
}

.flip-chip.active {
    background: rgba(56, 189, 248, 0.08);
    border-color: rgba(56, 189, 248, 0.35);
    color: #38bdf8;
}

.chip-icon {
    font-size: 13px;
    line-height: 1;
}

/* ── Advanced panel ───────────────────────────────────────────────────── */
.adv-panel {
    border-top: 1px solid #1e293b;
    padding-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.slider-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.slider-header label {
    font-size: 11px;
    color: #475569;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
}

.slider-val {
    font-size: 12px;
    font-weight: 600;
    color: #38bdf8;
    font-variant-numeric: tabular-nums;
}

input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 3px;
    background: #1e293b;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #38bdf8;
    border: 2px solid #020617;
    box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.35);
    cursor: pointer;
    transition: transform 0.12s;
}

input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.25);
}

input[type="range"]::-moz-range-thumb {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #38bdf8;
    border: 2px solid #020617;
    cursor: pointer;
}

/* ── Status strip ─────────────────────────────────────────────────────── */
.status-strip {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 10px;
    background: rgba(56, 189, 248, 0.04);
    border: 1px solid rgba(56, 189, 248, 0.12);
    border-radius: 7px;
}

.s-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    flex-shrink: 0;
}

.s-text {
    font-size: 11px;
    color: #64748b;
    line-height: 1.4;
}

.s-text span {
    color: #38bdf8;
    font-weight: 500;
}
</style>