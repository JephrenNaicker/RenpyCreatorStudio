<!-- frontend/src/components/scene/ImagePositionSelector.vue -->
<template>
    <div class="image-position-selector" :id="`position-selector-${componentId}`">
        <!-- Quick position buttons -->
        <div class="position-buttons" :id="`position-buttons-${componentId}`">
            <button @click="setPosition('left')" :class="{ active: currentPosition === 'left' }" title="Left aligned"
                :id="`btn-left-${componentId}`" class="position-btn">
                ◀ Left
            </button>
            <button @click="setPosition('center')" :class="{ active: currentPosition === 'center' }"
                title="Center aligned" :id="`btn-center-${componentId}`" class="position-btn">
                ◆ Center
            </button>
            <button @click="setPosition('right')" :class="{ active: currentPosition === 'right' }" title="Right aligned"
                :id="`btn-right-${componentId}`" class="position-btn">
                Right ▶
            </button>
            <button @click="toggleAdvanced" :class="{ active: showAdvanced }" title="Advanced options"
                :id="`btn-advanced-${componentId}`" class="position-btn advanced-btn">
                ⚙️
            </button>
        </div>

        <!-- Advanced options panel -->
        <div v-if="showAdvanced" class="advanced-panel" :id="`advanced-panel-${componentId}`">
            <!-- Flip checkbox (horizontal) -->
            <label class="flex items-center gap-2 cursor-pointer" :id="`flip-x-label-${componentId}`">
                <input type="checkbox" v-model="localTransform.flip_x" @change="updateTransform"
                    :id="`flip-x-${componentId}`" />
                <span>↔️ Flip Horizontal</span>
            </label>

            <!-- Flip checkbox (vertical) - for later -->
            <label class="flex items-center gap-2 cursor-pointer mt-2" :id="`flip-y-label-${componentId}`">
                <input type="checkbox" v-model="localTransform.flip_y" @change="updateTransform"
                    :id="`flip-y-${componentId}`" />
                <span>↕️ Flip Vertical</span>
            </label>

            <!-- Zoom slider -->
            <div class="slider-group mt-3" :id="`zoom-group-${componentId}`">
                <label class="text-sm text-slate-300">Zoom: {{ localTransform.zoom || 1.0 }}x</label>
                <input type="range" v-model.number="localTransform.zoom" min="0.5" max="2.0" step="0.05"
                    @input="updateTransform" :id="`zoom-slider-${componentId}`" class="w-full" />
            </div>

            <!-- Alpha/Opacity slider -->
            <div class="slider-group mt-3" :id="`alpha-group-${componentId}`">
                <label class="text-sm text-slate-300">Opacity: {{ Math.round((localTransform.alpha || 1) * 100)
                }}%</label>
                <input type="range" v-model.number="localTransform.alpha" min="0" max="1" step="0.01"
                    @input="updateTransform" :id="`alpha-slider-${componentId}`" class="w-full" />
            </div>

            <!-- Custom position (only shown when custom is selected) -->
            <div v-if="currentPosition === 'custom'" class="custom-position mt-3"
                :id="`custom-position-${componentId}`">
                <div class="slider-group">
                    <label class="text-sm text-slate-300">X Position: {{ (localCustomX || 0.5).toFixed(2) }}</label>
                    <input type="range" v-model.number="localCustomX" min="0" max="1" step="0.01"
                        @input="updateCustomPosition" :id="`custom-x-${componentId}`" class="w-full" />
                </div>
                <div class="slider-group mt-2">
                    <label class="text-sm text-slate-300">Y Position: {{ (localCustomY || 0.5).toFixed(2) }}</label>
                    <input type="range" v-model.number="localCustomY" min="0" max="1" step="0.01"
                        @input="updateCustomPosition" :id="`custom-y-${componentId}`" class="w-full" />
                </div>
            </div>

            <!-- Preview area -->
            <div class="preview-area mt-4 pt-3 border-t border-gray-700" :id="`preview-${componentId}`">
                <div class="text-sm text-slate-400 mb-2">Preview:</div>
                <div class="preview-box" :style="previewStyle" :id="`preview-box-${componentId}`">
                    <span class="text-xs">{{ previewCharacterName || 'Character' }}</span>
                </div>
            </div>
        </div>

        <!-- Current position badge -->
        <div v-if="currentPosition && !showAdvanced" class="current-badge mt-2" :id="`badge-${componentId}`">
            <span class="text-xs text-slate-400">Position: </span>
            <span class="text-xs text-sky-400">{{ getPositionLabel() }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

// Types
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

// Props
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

// Emits
const emit = defineEmits<{
    (e: 'update:modelValue', value: ImagePosition | undefined): void;
    (e: 'change', value: ImagePosition | undefined): void;
}>();

// Local state
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

// Computed: Preview character name (truncated)
const previewCharacterName = computed(() => {
    if (!props.characterName) return 'Character';
    return props.characterName.length > 10
        ? props.characterName.substring(0, 8) + '...'
        : props.characterName;
});

// Computed: Preview style for the position visualization
const previewStyle = computed(() => {
    const style: Record<string, string> = {
        backgroundColor: props.characterColor + '33', // Add transparency
        borderColor: props.characterColor,
        transition: 'all 0.2s ease'
    };

    // Apply position
    if (currentPosition.value === 'left') {
        style.marginRight = 'auto';
        style.marginLeft = '0';
    } else if (currentPosition.value === 'center') {
        style.marginLeft = 'auto';
        style.marginRight = 'auto';
    } else if (currentPosition.value === 'right') {
        style.marginLeft = 'auto';
        style.marginRight = '0';
    } else if (currentPosition.value === 'custom') {
        style.marginLeft = `${(localCustomX.value * 100)}%`;
        style.transform = `translateX(-${(localCustomX.value * 100)}%)`;
        style.marginTop = `${(localCustomY.value * 100)}%`;
    }

    // Apply transforms
    if (localTransform.value.flip_x) {
        style.transform = (style.transform || '') + ' scaleX(-1)';
    }
    if (localTransform.value.flip_y) {
        style.transform = (style.transform || '') + ' scaleY(-1)';
    }
    if (localTransform.value.zoom && localTransform.value.zoom !== 1) {
        style.transform = (style.transform || '') + ` scale(${localTransform.value.zoom})`;
    }
    if (localTransform.value.alpha !== undefined && localTransform.value.alpha !== 1) {
        style.opacity = String(localTransform.value.alpha);
    }

    return style;
});

// Methods
const setPosition = (position: 'left' | 'center' | 'right' | 'custom') => {
    currentPosition.value = position;
    emitUpdate();
};

const toggleAdvanced = () => {
    showAdvanced.value = !showAdvanced.value;
};

const updateTransform = () => {
    emitUpdate();
};

const updateCustomPosition = () => {
    if (currentPosition.value === 'custom') {
        emitUpdate();
    }
};

const getPositionLabel = (): string => {
    switch (currentPosition.value) {
        case 'left': return 'Left Aligned';
        case 'center': return 'Centered';
        case 'right': return 'Right Aligned';
        case 'custom': return `Custom (X:${localCustomX.value.toFixed(2)}, Y:${localCustomY.value.toFixed(2)})`;
        default: return 'Not set';
    }
};

const getPositionIcon = (): string => {
    switch (currentPosition.value) {
        case 'left': return '◀';
        case 'center': return '◆';
        case 'right': return '▶';
        case 'custom': return '⚙️';
        default: return '📍';
    }
};

const emitUpdate = () => {
    // Don't emit if position is center with no customizations
    if (currentPosition.value === 'center' &&
        localTransform.value.zoom === 1 &&
        !localTransform.value.flip_x &&
        !localTransform.value.flip_y &&
        localTransform.value.alpha === 1) {
        emit('update:modelValue', undefined);
        emit('change', undefined);
        return;
    }

    const value: ImagePosition = {
        position: currentPosition.value
    };

    if (currentPosition.value === 'custom') {
        value.custom_x = localCustomX.value;
        value.custom_y = localCustomY.value;
    }

    // Only include transform if it has non-default values
    const hasTransform = localTransform.value.zoom !== 1 ||
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
        if (props.modelValue.custom_x !== undefined) {
            localCustomX.value = props.modelValue.custom_x;
        }
        if (props.modelValue.custom_y !== undefined) {
            localCustomY.value = props.modelValue.custom_y;
        }
        if (props.modelValue.transform) {
            localTransform.value = {
                zoom: props.modelValue.transform.zoom || 1,
                flip_x: props.modelValue.transform.flip_x || false,
                flip_y: props.modelValue.transform.flip_y || false,
                alpha: props.modelValue.transform.alpha !== undefined ? props.modelValue.transform.alpha : 1
            };
        }
    } else {
        // Reset to defaults when no model value
        currentPosition.value = 'center';
        localCustomX.value = 0.5;
        localCustomY.value = 0.5;
        localTransform.value = {
            zoom: 1,
            flip_x: false,
            flip_y: false,
            alpha: 1
        };
    }
};

const resetToDefault = () => {
    currentPosition.value = 'center';
    localCustomX.value = 0.5;
    localCustomY.value = 0.5;
    localTransform.value = {
        zoom: 1,
        flip_x: false,
        flip_y: false,
        alpha: 1
    };
    showAdvanced.value = false;
    emitUpdate();
};

// Watch for external changes
watch(() => props.modelValue, () => {
    loadFromProps();
}, { deep: true });

// Lifecycle
onMounted(() => {
    loadFromProps();
});

// Expose methods for parent components
defineExpose({
    resetToDefault,
    getCurrentPosition: () => ({
        position: currentPosition.value,
        transform: localTransform.value
    }),
    hasCustomPosition: () => {
        return currentPosition.value !== 'center' ||
            localTransform.value.zoom !== 1 ||
            localTransform.value.flip_x ||
            localTransform.value.flip_y ||
            localTransform.value.alpha !== 1;
    }
});
</script>

<style scoped>
.image-position-selector {
    @apply p-3 bg-gray-800/50 rounded-lg border border-gray-700;
}

.position-buttons {
    @apply flex gap-2 flex-wrap;
}

.position-btn {
    @apply px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-slate-300 rounded-lg transition-all text-sm font-medium;
}

.position-btn.active {
    @apply bg-sky-500/20 text-sky-400 border border-sky-500/50;
}

.advanced-btn {
    @apply ml-auto;
}

.advanced-panel {
    @apply mt-3 p-3 bg-gray-900/50 rounded-lg border border-gray-700;
}

.slider-group {
    @apply flex flex-col gap-1;
}

.slider-group label {
    @apply text-xs text-slate-400;
}

.slider-group input[type="range"] {
    @apply bg-gray-700 rounded-lg appearance-none cursor-pointer h-1;
}

.slider-group input[type="range"]::-webkit-slider-thumb {
    @apply w-3 h-3 bg-sky-400 rounded-full appearance-none cursor-pointer;
}

.preview-area {
    @apply relative;
}

.preview-box {
    @apply w-24 h-16 rounded-lg border-2 flex items-center justify-center text-center p-2;
    background-color: rgba(56, 189, 248, 0.1);
    transition: all 0.2s ease;
}

.current-badge {
    @apply text-center;
}

/* Checkbox styling */
input[type="checkbox"] {
    @apply w-4 h-4 rounded border-gray-600 bg-gray-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-0;
}

/* Custom range styling */
input[type="range"] {
    height: 4px;
    -webkit-appearance: none;
}

input[type="range"]:focus {
    outline: none;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #38bdf8;
    cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.2);
}
</style>