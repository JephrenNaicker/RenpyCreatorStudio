<!-- frontend/src/components/scene/ImagePositionSelector.vue -->
<template>
    <div class="bg-slate-950 border border-slate-700 rounded-xl p-3 flex flex-col gap-2.5"
        :id="`position-selector-${componentId}`">

        <!-- Character headshot strip -->
        <div class="flex items-center gap-2.5 p-2 bg-slate-900 border border-slate-800 rounded-lg"
            :id="`avatar-strip-${componentId}`">
            <div class="w-9.5 h-9.5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 text-xs font-bold tracking-wider text-slate-200"
                :style="{ background: avatarBg, borderColor: avatarBorder }" :id="`avatar-${componentId}`">
                {{ avatarInitial }}
            </div>
            <div class="flex flex-col gap-0.5 flex-1 min-w-0">
                <span class="text-xs font-semibold text-slate-200 truncate">{{ props.characterName || 'Character'
                }}</span>
                <span class="text-[11px] text-slate-500">Set stage position</span>
            </div>
            <!-- Mini stage indicator -->
            <div class="relative w-22 h-6.5 bg-[#060c17] border border-slate-800 rounded-md overflow-hidden shrink-0"
                :id="`mini-stage-${componentId}`">
                <div class="absolute inset-0 flex">
                    <div class="flex-1 border-r border-dashed border-slate-400/10 flex items-center justify-center">
                        <span class="text-[8px] text-slate-400/30 tracking-widest uppercase">L</span>
                    </div>
                    <div class="flex-1 border-r border-dashed border-slate-400/10 flex items-center justify-center">
                        <span class="text-[8px] text-slate-400/30 tracking-widest uppercase">C</span>
                    </div>
                    <div class="flex-1 flex items-center justify-center">
                        <span class="text-[8px] text-slate-400/30 tracking-widest uppercase">R</span>
                    </div>
                </div>
                <div class="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center text-[8px] font-bold transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
                    :style="miniMarkerStyle" :id="`mini-marker-${componentId}`">
                    {{ miniMarkerIcon }}
                </div>
            </div>
        </div>

        <!-- Position buttons -->
        <div class="grid grid-cols-[1fr_1fr_1fr_auto] gap-1.5" :id="`pos-row-${componentId}`">
            <button
                class="h-8.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 text-xs font-medium cursor-pointer flex items-center justify-center gap-1 transition-colors hover:bg-slate-800 hover:border-slate-600 hover:text-slate-300 outline-none relative overflow-hidden"
                :class="{ 'bg-sky-400/10 border-sky-400 !text-sky-400 after:content-[\'\'] after:absolute after:bottom-0 after:left-[15%] after:right-[15%] after:h-0.5 after:bg-sky-400 after:rounded-t': currentPosition === 'left' }"
                @click="setPosition('left')" title="Left aligned" :id="`btn-left-${componentId}`">
                ◀ Left
            </button>
            <button
                class="h-8.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 text-xs font-medium cursor-pointer flex items-center justify-center gap-1 transition-colors hover:bg-slate-800 hover:border-slate-600 hover:text-slate-300 outline-none relative overflow-hidden"
                :class="{ 'bg-sky-400/10 border-sky-400 !text-sky-400 after:content-[\'\'] after:absolute after:bottom-0 after:left-[15%] after:right-[15%] after:h-0.5 after:bg-sky-400 after:rounded-t': currentPosition === 'center' }"
                @click="setPosition('center')" title="Center aligned" :id="`btn-center-${componentId}`">
                ◆ Center
            </button>
            <button
                class="h-8.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 text-xs font-medium cursor-pointer flex items-center justify-center gap-1 transition-colors hover:bg-slate-800 hover:border-slate-600 hover:text-slate-300 outline-none relative overflow-hidden"
                :class="{ 'bg-sky-400/10 border-sky-400 !text-sky-400 after:content-[\'\'] after:absolute after:bottom-0 after:left-[15%] after:right-[15%] after:h-0.5 after:bg-sky-400 after:rounded-t': currentPosition === 'right' }"
                @click="setPosition('right')" title="Right aligned" :id="`btn-right-${componentId}`">
                Right ▶
            </button>
            <button
                class="w-8.5 h-8.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 text-xs font-medium cursor-pointer flex items-center justify-center transition-colors hover:bg-slate-800 hover:border-slate-600 hover:text-slate-300 outline-none shrink-0"
                :class="{ 'bg-sky-400/10 border-sky-400 !text-sky-400': showAdvanced }" @click="toggleAdvanced"
                title="Transform options" :id="`btn-advanced-${componentId}`">
                ⚙️
            </button>
        </div>

        <!-- Flip chips -->
        <div class="grid grid-cols-2 gap-1.5" :id="`flip-row-${componentId}`">
            <button
                class="h-8 bg-slate-900 border border-slate-700 rounded-lg text-slate-500 text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors hover:bg-slate-800 hover:border-slate-600 hover:text-slate-400 outline-none select-none"
                :class="{ 'bg-sky-400/10 border-sky-400/35 !text-sky-400': localTransform.flip_x }"
                @click="toggleFlip('x')" :id="`chip-flipx-${componentId}`">
                <span class="text-xs leading-none">↔️️</span> Flip H
            </button>
            <button
                class="h-8 bg-slate-900 border border-slate-700 rounded-lg text-slate-500 text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors hover:bg-slate-800 hover:border-slate-600 hover:text-slate-400 outline-none select-none"
                :class="{ 'bg-sky-400/10 border-sky-400/35 !text-sky-400': localTransform.flip_y }"
                @click="toggleFlip('y')" :id="`chip-flipy-${componentId}`">
                <span class="text-xs leading-none">↕️</span> Flip V
            </button>
        </div>

        <!-- Advanced panel -->
        <div v-if="showAdvanced" class="border-t border-slate-800 pt-2.5 flex flex-col gap-2.5"
            :id="`adv-panel-${componentId}`">
            <!-- Zoom -->
            <div class="flex flex-col gap-1" :id="`zoom-group-${componentId}`">
                <div class="flex justify-between items-center">
                    <label class="text-[11px] text-slate-500 tracking-widest uppercase cursor-pointer"
                        :for="`zoom-slider-${componentId}`">Zoom</label>
                    <span class="text-xs font-semibold text-sky-400 tabular-nums">{{ (localTransform.zoom ||
                        1).toFixed(1) }}×</span>
                </div>
                <input type="range" v-model.number="localTransform.zoom" min="0.5" max="2.0" step="0.05"
                    class="accent-sky-400 w-full h-1 bg-slate-800 rounded cursor-pointer" @input="updateTransform"
                    :id="`zoom-slider-${componentId}`" />
            </div>

            <!-- Opacity -->
            <div class="flex flex-col gap-1" :id="`alpha-group-${componentId}`">
                <div class="flex justify-between items-center">
                    <label class="text-[11px] text-slate-500 tracking-widest uppercase cursor-pointer"
                        :for="`alpha-slider-${componentId}`">Opacity</label>
                    <span class="text-xs font-semibold text-sky-400 tabular-nums">{{ Math.round((localTransform.alpha ||
                        1) * 100) }}%</span>
                </div>
                <input type="range" v-model.number="localTransform.alpha" min="0" max="1" step="0.01"
                    class="accent-sky-400 w-full h-1 bg-slate-800 rounded cursor-pointer" @input="updateTransform"
                    :id="`alpha-slider-${componentId}`" />
            </div>

            <!-- Custom XY (only for custom position) -->
            <div v-if="currentPosition === 'custom'" class="flex flex-col gap-1" :id="`custom-position-${componentId}`">
                <div class="flex justify-between items-center">
                    <label class="text-[11px] text-slate-500 tracking-widest uppercase cursor-pointer"
                        :for="`custom-x-${componentId}`">X Position</label>
                    <span class="text-xs font-semibold text-sky-400 tabular-nums">{{ (localCustomX || 0.5).toFixed(2)
                    }}</span>
                </div>
                <input type="range" v-model.number="localCustomX" min="0" max="1" step="0.01"
                    class="accent-sky-400 w-full h-1 bg-slate-800 rounded cursor-pointer" @input="updateCustomPosition"
                    :id="`custom-x-${componentId}`" />
                <div class="flex justify-between items-center mt-2">
                    <label class="text-[11px] text-slate-500 tracking-widest uppercase cursor-pointer"
                        :for="`custom-y-${componentId}`">Y Position</label>
                    <span class="text-xs font-semibold text-sky-400 tabular-nums">{{ (localCustomY || 0.5).toFixed(2)
                    }}</span>
                </div>
                <input type="range" v-model.number="localCustomY" min="0" max="1" step="0.01"
                    class="accent-sky-400 w-full h-1 bg-slate-800 rounded cursor-pointer" @input="updateCustomPosition"
                    :id="`custom-y-${componentId}`" />
            </div>
        </div>

        <!-- Status strip -->
        <div class="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-400/5 border border-sky-400/15 rounded-md"
            :id="`status-strip-${componentId}`">
            <div class="w-1.5 h-1.5 rounded-full shrink-0" :style="{ background: props.characterColor || '#38bdf8' }">
            </div>
            <p class="text-[11px] text-slate-500 leading-normal">
                Position: <span class="text-sky-400 font-medium">{{ positionLabel }}</span>
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

const getPositionLabel = (): string => positionLabel.value;
const getPositionIcon = (): string => miniMarkerIcon.value;

const emitUpdate = () => {
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