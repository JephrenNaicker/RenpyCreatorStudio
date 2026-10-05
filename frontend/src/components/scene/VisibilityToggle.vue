<!-- frontend/src/components/scene/VisibilityToggle.vue -->
<!-- Self-contained visibility toggle for a dialogue line character.
     Keeps its own local state so re-renders from sibling components
     (e.g. ImagePositionSelector) don't reset the displayed value. -->
<template>
    <select
        class="text-[0.72rem] font-semibold px-1.5 py-0.5 rounded border cursor-pointer appearance-none outline-none transition-all shrink-0 hover:border-slate-500"
        :class="isHidden ? 'bg-red-500/15 text-red-400 border-red-500/30' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'"
        :value="isHidden ? 'hide' : 'show'" @change.stop="handleChange(($event.target as HTMLSelectElement).value)"
        @click.stop :title="isHidden ? 'Character hidden — click to show' : 'Character shown — click to hide'">
        <option value="show" class="bg-slate-900 text-slate-100">👁 Shown</option>
        <option value="hide" class="bg-slate-900 text-slate-100">🚫 Hidden</option>
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