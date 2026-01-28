import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000', // FastAPI default port
    headers: {
        'Content-Type': 'application/json',
    },
});

// Character API calls
export const characterAPI = {
    create: (characterData: any) => api.post('/api/characters/', characterData),
    getByProject: (projectId: string) => api.get(`/api/characters/${projectId}`),
    get: (characterId: string) => api.get(`/api/characters/character/${characterId}`),
    update: (characterId: string, data: any) => api.put(`/api/characters/${characterId}`, data),
    delete: (characterId: string) => api.delete(`/api/characters/${characterId}`),
};

// Dialogue API calls
export const dialogueAPI = {
    addLine: (projectId: string, lineData: any) =>
        api.post(`/api/dialogue/${projectId}/lines`, lineData),
    getLines: (projectId: string) =>
        api.get(`/api/dialogue/${projectId}/lines`),
    export: (projectId: string) =>
        api.post(`/api/export/${projectId}`),
};

export default api;