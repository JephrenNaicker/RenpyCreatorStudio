// src/services/api.ts
//
// Axios instance and typed HTTP wrappers for the FastAPI backend.
//
// Each object here (characterAPI, projectAPI, sceneAPI, dialogueAPI) mirrors
// the functions in its corresponding service file. When you're ready to go live,
// replace the dummy-data body in each service function with the matching call here.
//
// Example swap in characterService.ts:
//   Before: return [...dummyCharacters];
//   After:  const res = await characterAPI.getAll(); return res.data;

import axios from 'axios';
import type { Character } from '@/utils/dummyData';
import type { Project } from '@/utils/dummyData';
import type { Scene, DialogueLine, MenuNode } from '@/utils/dummyData';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ─── Characters ───────────────────────────────────────────────────────────────

export const characterAPI = {
    /** GET /api/characters/ */
    getAll: () =>
        api.get<Character[]>('/api/characters/'),

    /** GET /api/characters/:id */
    get: (id: string) =>
        api.get<Character>(`/api/characters/${id}`),

    /** POST /api/characters/ */
    create: (data: Omit<Character, 'id' | 'created_at' | 'updated_at'>) =>
        api.post<Character>('/api/characters/', data),

    /** PATCH /api/characters/:id */
    update: (id: string, data: Partial<Omit<Character, 'id' | 'created_at' | 'updated_at'>>) =>
        api.patch<Character>(`/api/characters/${id}`, data),

    /** DELETE /api/characters/:id */
    delete: (id: string) =>
        api.delete<void>(`/api/characters/${id}`),
};

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projectAPI = {
    /** GET /api/projects/ */
    getAll: () =>
        api.get<Project[]>('/api/projects/'),

    /** GET /api/projects/:id */
    get: (id: string) =>
        api.get<Project>(`/api/projects/${id}`),

    /** POST /api/projects/ */
    create: (data: Omit<Project, 'id' | 'created_at' | 'updated_at'>) =>
        api.post<Project>('/api/projects/', data),

    /** PATCH /api/projects/:id */
    update: (id: string, data: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>) =>
        api.patch<Project>(`/api/projects/${id}`, data),

    /** DELETE /api/projects/:id */
    delete: (id: string) =>
        api.delete<void>(`/api/projects/${id}`),
};

// ─── Scenes ───────────────────────────────────────────────────────────────────

export const sceneAPI = {
    /** GET /api/scenes/?project_id=:projectId */
    getByProject: (projectId: string) =>
        api.get<Scene[]>('/api/scenes/', { params: { project_id: projectId } }),

    /** GET /api/scenes/:id */
    get: (id: string) =>
        api.get<Scene>(`/api/scenes/${id}`),

    /** POST /api/scenes/ */
    create: (data: Omit<Scene, 'id' | 'created_at' | 'updated_at' | 'dialogue_lines'>) =>
        api.post<Scene>('/api/scenes/', data),

    /** PUT /api/scenes/:id  (full scene including dialogue_lines) */
    save: (scene: Scene) =>
        api.put<Scene>(`/api/scenes/${scene.id}`, scene),

    /** DELETE /api/scenes/:id */
    delete: (id: string) =>
        api.delete<void>(`/api/scenes/${id}`),
};

// ─── Export ───────────────────────────────────────────────────────────────────
// Dialogue lines are nested inside scenes and saved via sceneAPI.save.
// This section covers the standalone export endpoint only.

export const exportAPI = {
    /** POST /api/export/:projectId — triggers Ren'Py script generation */
    exportProject: (projectId: string) =>
        api.post<{ download_url: string }>(`/api/export/${projectId}`),
};

export default api;