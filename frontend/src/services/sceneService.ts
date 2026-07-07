// src/services/sceneService.ts
//
// Data-access layer for scenes. Every function returns a Promise so call
// sites already look like real network calls — when the FastAPI backend
// is ready, only the bodies below change, not the components that use them.

import { dummyScenes, type Scene } from '@/utils/dummyData';

/**
 * Get all scenes belonging to a project.
 */
export async function getScenesByProject(projectId: string): Promise<Scene[]> {
    return dummyScenes.filter(s => s.project_id === projectId);
}

/**
 * Get a single scene by id.
 */
export async function getScene(sceneId: string): Promise<Scene | null> {
    return dummyScenes.find(s => s.id === sceneId) ?? null;
}

/**
 * Persist a scene (create or update — dummy data treats both the same way).
 * Returns the saved scene with an updated `updated_at` timestamp.
 */
export async function saveScene(scene: Scene): Promise<Scene> {
    const updated: Scene = {
        ...scene,
        updated_at: new Date().toISOString(),
    };

    const index = dummyScenes.findIndex(s => s.id === scene.id);
    if (index !== -1) {
        dummyScenes[index] = updated;
    } else {
        dummyScenes.push(updated);
    }

    return updated;
}

/**
 * Create a brand new scene for a project.
 */
/**
 * Create a brand new scene for a project.
 * The service handles:
 * - Generating a unique ID
 * - Setting created_at and updated_at timestamps
 * - Initializing dialogue_lines as empty array
 */
export async function createScene(
    data: Omit<Scene, 'id' | 'created_at' | 'updated_at' | 'dialogue_lines'>
): Promise<Scene> {
    const now = new Date().toISOString();
    const newScene: Scene = {
        ...data,
        id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dialogue_lines: [],
        created_at: now,
        updated_at: now,
    };
    dummyScenes.push(newScene);
    return newScene;
}

/**
 * Delete a scene by id.
 */
export async function deleteScene(sceneId: string): Promise<void> {
    const index = dummyScenes.findIndex(s => s.id === sceneId);
    if (index !== -1) {
        dummyScenes.splice(index, 1);
    }
}