<template>
    <div v-if="character" class="character-detail-view">
        <!-- Character Header -->
        <div class="character-header">
            <div class="header-left">
                <div class="character-color" :style="{ backgroundColor: character.color }"></div>
                <div class="character-title">
                    <h1>{{ character.name }}</h1>
                    <p v-if="character.nickname" class="character-nickname">
                        "{{ character.nickname }}"
                    </p>
                </div>
            </div>

            <div class="header-actions">
                <router-link :to="`/characters/${character.id}/edit`" class="btn-primary">
                    <span class="btn-icon">✏️</span>
                    Edit Character
                </router-link>
                <button class="btn-secondary" @click="goBack">
                    ← Back to List
                </button>
            </div>
        </div>

        <!-- Character Info Grid -->
        <div class="info-grid">
            <!-- Basic Info Card -->
            <div class="info-card">
                <h3 class="card-title">Basic Information</h3>
                <div class="info-item">
                    <span class="info-label">Name:</span>
                    <span class="info-value">{{ character.name }}</span>
                </div>
                <div v-if="character.nickname" class="info-item">
                    <span class="info-label">Nickname:</span>
                    <span class="info-value">{{ character.nickname }}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Color:</span>
                    <div class="color-display">
                        <span class="color-preview" :style="{ backgroundColor: character.color }"></span>
                        <span class="color-code">{{ character.color }}</span>
                    </div>
                </div>
                <div v-if="character.age" class="info-item">
                    <span class="info-label">Age:</span>
                    <span class="info-value">{{ character.age }}</span>
                </div>
                <div v-if="character.birth_date" class="info-item">
                    <span class="info-label">Birth Date:</span>
                    <span class="info-value">{{ character.birth_date }}</span>
                </div>
            </div>

            <!-- Bio Card -->
            <div v-if="character.bio" class="info-card">
                <h3 class="card-title">Bio / Description</h3>
                <p class="bio-text">{{ character.bio }}</p>
            </div>

            <!-- Expressions Card -->
            <div class="info-card">
                <h3 class="card-title">Expressions ({{ character.expressions?.length || 0 }})</h3>
                <div v-if="character.expressions && character.expressions.length > 0" class="expressions-grid">
                    <div v-for="exp in character.expressions" :key="exp.name" class="expression-item">
                        <div class="expression-icon">😀</div>
                        <div class="expression-info">
                            <span class="expression-name">{{ exp.name }}</span>
                            <span v-if="exp.outfit" class="expression-outfit">{{ exp.outfit }}</span>
                        </div>
                    </div>
                </div>
                <p v-else class="empty-message">No expressions added yet.</p>
            </div>

            <!-- Outfits Card -->
            <div class="info-card">
                <h3 class="card-title">Outfits ({{ character.outfits?.length || 0 }})</h3>
                <div v-if="character.outfits && character.outfits.length > 0" class="outfits-list">
                    <div v-for="outfit in character.outfits" :key="outfit.name" class="outfit-item">
                        <span class="outfit-icon">👕</span>
                        <span class="outfit-name">{{ outfit.name }}</span>
                    </div>
                </div>
                <p v-else class="empty-message">No outfits added yet.</p>
            </div>

            <!-- Voice Lines Card -->
            <div v-if="character.voice_lines && character.voice_lines.length > 0" class="info-card">
                <h3 class="card-title">Voice Lines ({{ character.voice_lines.length }})</h3>
                <div class="voice-lines">
                    <div v-for="voice in character.voice_lines" :key="voice.line_name" class="voice-item">
                        <span class="voice-name">{{ voice.line_name }}</span>
                        <span class="voice-path">{{ voice.audio_path }}</span>
                    </div>
                </div>
            </div>

            <!-- Export Card -->
            <div class="info-card">
                <h3 class="card-title">Ren'Py Export</h3>
                <p class="export-description">Export this character to Ren'Py format.</p>
                <div class="export-actions">
                    <button class="btn-secondary" @click="showExportPreview">
                        Preview Code
                    </button>
                    <button class="btn-primary" @click="exportCharacter">
                        Export to .rpy
                    </button>
                </div>
            </div>
        </div>

        <!-- Export Modal -->
        <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>Ren'Py Export Preview</h3>
                    <button class="modal-close" @click="closeExportModal">✕</button>
                </div>
                <div class="modal-content">
                    <pre class="export-code">{{ exportCode }}</pre>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" @click="closeExportModal">Close</button>
                    <button class="btn-primary" @click="copyToClipboard">
                        Copy to Clipboard
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading">
        <div class="spinner"></div>
        <p>Loading character...</p>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const character = ref<any>(null);
const showExportModal = ref(false);
const exportCode = ref('');

// Mock data - will be replaced with API call
const mockCharacter = {
    id: '1',
    name: 'Alice',
    nickname: 'Ali',
    color: '#FF6B6B',
    age: 18,
    birth_date: '03/15',
    bio: 'A cheerful protagonist who loves adventure and has a mysterious past. She always looks on the bright side and has a strong sense of justice.',
    voice_lines: [
        { line_name: 'greeting', audio_path: 'audio/alice/greeting.ogg' },
        { line_name: 'surprise', audio_path: 'audio/alice/surprise.ogg' }
    ],
    outfits: [
        { name: 'casual', default_image: 'alice_casual.png' },
        { name: 'formal', default_image: 'alice_formal.png' }
    ],
    expressions: [
        { name: 'happy', image_path: 'alice_happy.png', outfit: 'casual' },
        { name: 'sad', image_path: 'alice_sad.png', outfit: 'casual' },
        { name: 'angry', image_path: 'alice_angry.png', outfit: 'casual' },
        { name: 'elegant', image_path: 'alice_elegant.png', outfit: 'formal' }
    ]
};

onMounted(() => {
    // TODO: Fetch character from API using route.params.id
    character.value = mockCharacter;
});

const goBack = () => {
    router.push('/characters');
};

const showExportPreview = () => {
    // Generate Ren'Py code
    exportCode.value = `# Ren'Py Character Definition
define ${character.value.name.toLowerCase()} = Character(
    "${character.value.name}",
    color="${character.value.color}",
    what_prefix='"',
    what_suffix='"',
)

# Expressions
image ${character.value.name.toLowerCase()} happy = "alice_happy.png"
image ${character.value.name.toLowerCase()} sad = "alice_sad.png"
image ${character.value.name.toLowerCase()} angry = "alice_angry.png"

# Usage in script
label start:
    ${character.value.name.toLowerCase()} "Hello, I'm ${character.value.name}!"
    ${character.value.name.toLowerCase()} happy "I'm happy to meet you!"
`;
    showExportModal.value = true;
};

const closeExportModal = () => {
    showExportModal.value = false;
};

const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(exportCode.value);
        alert('Code copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy:', err);
    }
};

const exportCharacter = () => {
    // TODO: Implement actual export functionality
    alert('Export feature coming soon!');
    showExportPreview();
};
</script>

<style scoped>
.character-detail-view {
    max-width: 1200px;
    margin: 0 auto;
}

.character-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #334155;
    flex-wrap: wrap;
    gap: 1.5rem;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.character-color {
    width: 60px;
    height: 60px;
    border-radius: 12px;
}

.character-title h1 {
    font-size: 2.5rem;
    color: #f8fafc;
    margin-bottom: 0.25rem;
}

.character-nickname {
    font-size: 1.2rem;
    color: #38bdf8;
    font-style: italic;
}

.header-actions {
    display: flex;
    gap: 1rem;
}

.btn-primary,
.btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: bold;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: opacity 0.2s;
}

.btn-primary {
    background: #38bdf8;
    color: #020617;
}

.btn-secondary {
    background: transparent;
    border: 1px solid #334155;
    color: #cbd5e1;
}

.btn-primary:hover,
.btn-secondary:hover {
    opacity: 0.9;
}

/* Info Grid */
.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}

.info-card {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 1.5rem;
}

.card-title {
    font-size: 1.25rem;
    color: #f8fafc;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #334155;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.5rem 0;
}

.info-label {
    color: #94a3b8;
    font-weight: 500;
}

.info-value {
    color: #f8fafc;
}

.color-display {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.color-preview {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid #475569;
}

.color-code {
    font-family: monospace;
    font-size: 0.9rem;
    color: #cbd5e1;
}

.bio-text {
    color: #cbd5e1;
    line-height: 1.6;
}

.expressions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
}

.expression-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    transition: background 0.2s;
}

.expression-item:hover {
    background: rgba(255, 255, 255, 0.1);
}

.expression-icon {
    font-size: 1.5rem;
}

.expression-info {
    display: flex;
    flex-direction: column;
}

.expression-name {
    font-weight: 500;
    color: #f8fafc;
}

.expression-outfit {
    font-size: 0.8rem;
    color: #38bdf8;
}

.outfits-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.outfit-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.outfit-icon {
    font-size: 1.2rem;
}

.outfit-name {
    color: #f8fafc;
}

.voice-lines {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.voice-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.voice-name {
    color: #f8fafc;
    font-weight: 500;
}

.voice-path {
    font-family: monospace;
    font-size: 0.85rem;
    color: #94a3b8;
}

.export-description {
    color: #94a3b8;
    margin-bottom: 1.5rem;
}

.export-actions {
    display: flex;
    gap: 1rem;
}

.empty-message {
    color: #64748b;
    font-style: italic;
    text-align: center;
    padding: 2rem 0;
}

/* Modal */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
}

.modal {
    background: #020617;
    border: 1px solid #334155;
    border-radius: 16px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #334155;
}

.modal-header h3 {
    color: #f8fafc;
    margin: 0;
}

.modal-close {
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.25rem;
}

.modal-close:hover {
    color: #f8fafc;
}

.modal-content {
    flex: 1;
    overflow: auto;
    padding: 1.5rem;
}

.export-code {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 1.5rem;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    color: #cbd5e1;
    line-height: 1.5;
    overflow: auto;
    max-height: 400px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid #334155;
}

/* Loading State */
.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: 1.5rem;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 3px solid #334155;
    border-top-color: #38bdf8;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading p {
    color: #94a3b8;
    font-size: 1.1rem;
}
</style>