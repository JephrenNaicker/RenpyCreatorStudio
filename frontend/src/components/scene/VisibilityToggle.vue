<!-- components/scene/VisibilityToggle.vue -->
<!-- Self-contained visibility toggle for a dialogue line character.
     Keeps its own local state so re-renders from sibling components
     (e.g. ImagePositionSelector) don't reset the displayed value. -->
<template>
    <select class="visibility-select" :class="isHidden ? 'vis-hidden' : 'vis-shown'" :value="isHidden ? 'hide' : 'show'"
        @change.stop="handleChange(($event.target as HTMLSelectElement).value)" @click.stop
        :title="isHidden ? 'Character hidden — click to show' : 'Character shown — click to hide'">
        <option value="show">👁 Shown</option>
        <option value="hide">🚫 Hidden</option>
    </select>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
    // false or undefined = shown (default), true = hidden
    modelValue?: boolean;
}

interface Emits {
    (e: 'update:modelValue', value: boolean): void;
    (e: 'change', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false
});

const emit = defineEmits<Emits>();

// Local state — initialised from prop, doesn't reset on sibling re-renders
const isHidden = ref(props.modelValue === true);

// Only sync inward when parent explicitly changes the value
watch(() => props.modelValue, (val) => {
    isHidden.value = val === true;
});

const handleChange = (value: string) => {
    isHidden.value = value === 'hide';
    emit('update:modelValue', isHidden.value);
    emit('change', isHidden.value);
};
</script>

<style scoped>
.visibility-select {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    border: 1px solid transparent;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    outline: none;
    transition: all 0.15s;
    flex-shrink: 0;
}

.visibility-select.vis-shown {
    background: rgba(52, 211, 153, 0.12);
    color: #34d399;
    border-color: rgba(52, 211, 153, 0.3);
}

.visibility-select.vis-hidden {
    background: rgba(248, 113, 113, 0.12);
    color: #f87171;
    border-color: rgba(248, 113, 113, 0.3);
}

.visibility-select:hover {
    border-color: #475569;
}

.visibility-select option {
    background: #0f172a;
    color: #f8fafc;
}
</style>