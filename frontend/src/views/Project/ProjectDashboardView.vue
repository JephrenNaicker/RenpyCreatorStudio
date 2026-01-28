<template>
    <div class="dashboard">
        <!-- Left Panel -->
        <aside class="sidebar">
            <h3>Characters</h3>

            <div v-for="char in characters" :key="char.id" class="character-item" @click="selectCharacter(char)"
                :class="{ active: selectedCharacter?.id === char.id }">
                <span class="color-dot" :style="{ background: char.color }" />
                {{ char.name }}
                <span class="expression-count">{{ char.expressions?.length || 0 }} 😀</span>
            </div>

            <button class="secondary small" @click="addCharacter">
                + Add Character to Project
            </button>

            <div class="sidebar-section">
                <h4>Recent Scenes</h4>
                <div v-for="scene in recentScenes" :key="scene.id" class="scene-item">
                    <span class="scene-icon">🎬</span>
                    {{ scene.name }}
                </div>
            </div>
        </aside>

        <!-- Main Panel -->
        <main class="workspace">
            <div class="workspace-header">
                <h2>{{ selectedCharacter ? `Writing as ${selectedCharacter.name}` : 'Continue Writing' }}</h2>
                <div class="character-expressions" v-if="selectedCharacter">
                    <button v-for="exp in selectedCharacter.expressions" :key="exp" class="expression-btn"
                        @click="setExpression(exp)">
                        {{ getEmoji(exp) }} {{ exp }}
                    </button>
                </div>
            </div>

            <div class="dialogue-editor">
                <div class="dialogue-history">
                    <div v-for="(line, index) in dialogueLines" :key="index" class="dialogue-line">
                        <div class="speaker" :style="{ color: line.character?.color }">
                            {{ line.character?.name || 'Narrator' }}:
                        </div>
                        <div class="text">{{ line.text }}</div>
                        <div class="expression" v-if="line.expression">
                            {{ getEmoji(line.expression) }}
                        </div>
                    </div>
                </div>

                <div class="dialogue-input">
                    <div class="input-header">
                        <select v-model="currentSpeaker" class="speaker-select">
                            <option value="">Narrator</option>
                            <option v-for="char in characters" :key="char.id" :value="char.id">
                                {{ char.name }}
                            </option>
                        </select>

                        <select v-if="currentSpeakerChar" v-model="currentExpression" class="expression-select">
                            <option value="">Default</option>
                            <option v-for="exp in currentSpeakerChar.expressions" :key="exp" :value="exp">
                                {{ exp }}
                            </option>
                        </select>
                    </div>

                    <textarea v-model="currentText" placeholder="Type dialogue here..."
                        @keydown.enter.prevent="addDialogueLine" rows="3" />

                    <div class="input-actions">
                        <button class="primary" @click="addDialogueLine">
                            Add Line
                        </button>
                        <button class="secondary" @click="addMenu">
                            Add Menu Choice
                        </button>
                        <button class="secondary" @click="saveScene">
                            Save Scene
                        </button>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const characters = ref([
    { id: '1', name: 'Alice', color: '#f87171', expressions: ['happy', 'sad', 'angry', 'surprised'] },
    { id: '2', name: 'Bob', color: '#60a5fa', expressions: ['neutral', 'smile', 'concerned'] },
    { id: '3', name: 'Catherine', color: '#a78bfa', expressions: ['serious', 'mysterious', 'determined'] }
]);

const recentScenes = ref([
    { id: '1', name: 'First Encounter' },
    { id: '2', name: 'The Library' },
    { id: '3', name: 'Training Grounds' }
]);

const selectedCharacter = ref<any>(null);
const currentSpeaker = ref('');
const currentExpression = ref('');
const currentText = ref('');
const dialogueLines = ref([
    { character: characters.value[0], text: 'Welcome to Mystic Academy!', expression: 'happy' },
    { character: characters.value[1], text: 'Thanks! I\'m excited to be here.', expression: 'smile' },
    { character: characters.value[2], text: 'Be careful, not everything is as it seems here...', expression: 'mysterious' }
]);

const currentSpeakerChar = computed(() => {
    return characters.value.find(c => c.id === currentSpeaker.value);
});

const selectCharacter = (char: any) => {
    selectedCharacter.value = char;
    currentSpeaker.value = char.id;
};

const addCharacter = () => {
    // TODO: Open character selection modal
    alert('Character selection modal coming soon!');
};

const getEmoji = (expression: string) => {
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
        'determined': '💪'
    };
    return emojiMap[expression] || '😀';
};

const setExpression = (expression: string) => {
    currentExpression.value = expression;
};

const addDialogueLine = () => {
    if (!currentText.value.trim()) return;

    const character = currentSpeakerChar.value || null;

    dialogueLines.value.push({
        character,
        text: currentText.value,
        expression: currentExpression.value
    });

    currentText.value = '';
    currentExpression.value = '';
};

const addMenu = () => {
    // TODO: Implement menu choice
    alert('Menu choice feature coming soon!');
};

const saveScene = () => {
    // TODO: Save scene to backend
    alert('Scene saved!');
};
</script>

<style scoped>
.dashboard {
    display: grid;
    grid-template-columns: 260px 1fr;
    height: calc(100vh - 64px);
}

.sidebar {
    background: #020617;
    border-right: 1px solid #334155;
    padding: 1rem;
    overflow-y: auto;
}

.sidebar h3,
.sidebar h4 {
    margin-bottom: 1rem;
    color: #f8fafc;
}

.character-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 0.25rem;
    transition: all 0.2s;
}

.character-item:hover {
    background: #1e293b;
}

.character-item.active {
    background: rgba(56, 189, 248, 0.2);
    border-left: 3px solid #38bdf8;
}

.color-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.expression-count {
    margin-left: auto;
    font-size: 0.8rem;
    opacity: 0.7;
}

.sidebar-section {
    margin-top: 2rem;
}

.scene-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
}

.scene-item:hover {
    background: #1e293b;
}

.scene-icon {
    opacity: 0.7;
}

.secondary {
    background: #1e293b;
    border: none;
    color: #e2e8f0;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    margin-top: 1rem;
    width: 100%;
    cursor: pointer;
}

.small {
    font-size: 0.85rem;
}

/* Workspace */
.workspace {
    padding: 1.5rem;
    overflow-y: auto;
    background: #0f172a;
}

.workspace-header {
    margin-bottom: 2rem;
}

.workspace-header h2 {
    color: #f8fafc;
    margin-bottom: 1rem;
}

.character-expressions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.expression-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #334155;
    border-radius: 20px;
    padding: 0.4rem 0.8rem;
    color: #cbd5e1;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.expression-btn:hover {
    background: rgba(56, 189, 248, 0.2);
    border-color: #38bdf8;
}

/* Dialogue Editor */
.dialogue-editor {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.dialogue-history {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.5rem;
    max-height: 400px;
    overflow-y: auto;
}

.dialogue-line {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dialogue-line:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
}

.speaker {
    font-weight: bold;
    min-width: 120px;
    padding-top: 0.25rem;
}

.text {
    flex: 1;
    color: #cbd5e1;
    line-height: 1.5;
}

.expression {
    font-size: 1.2rem;
    opacity: 0.8;
}

/* Dialogue Input */
.dialogue-input {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.5rem;
}

.input-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.speaker-select,
.expression-select {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: #f8fafc;
    cursor: pointer;
}

textarea {
    width: 100%;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 1rem;
    color: #f8fafc;
    font-size: 1rem;
    resize: vertical;
    min-height: 80px;
    margin-bottom: 1rem;
}

textarea:focus {
    outline: none;
    border-color: #38bdf8;
}

.input-actions {
    display: flex;
    gap: 0.75rem;
}

.primary {
    background: #38bdf8;
    color: #020617;
    border: none;
    border-radius: 6px;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
    font-weight: 500;
}

.secondary {
    background: #1e293b;
    color: #e2e8f0;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 0.75rem 1.5rem;
    cursor: pointer;
}

.primary:hover,
.secondary:hover {
    opacity: 0.9;
}
</style>