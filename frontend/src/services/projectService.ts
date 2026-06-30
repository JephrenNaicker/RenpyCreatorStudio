// src/services/projectService.ts
//
// Data-access layer for projects. Backed by dummy data for now — every
// function is async so call sites already match what real API calls
// (services/api.ts) will look like once the FastAPI backend is wired up.

import { dummyProjects, type Project } from '@/utils/dummyData';

/**
 * Get all projects.
 */
export async function getAllProjects(): Promise<Project[]> {
    return [...dummyProjects];
}

/**
 * Get a single project by id.
 */
export async function getProject(id: string): Promise<Project | null> {
    return dummyProjects.find(p => p.id === id) ?? null;
}

/**
 * Create a new project.
 */
export async function createProject(
    data: Omit<Project, 'id' | 'created_at' | 'updated_at'>
): Promise<Project> {
    const now = new Date().toISOString();
    const newProject: Project = {
        ...data,
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: now,
        updated_at: now,
    };
    dummyProjects.push(newProject);
    return newProject;
}

/**
 * Update an existing project (partial patch merged onto the existing record).
 */
export async function updateProject(
    id: string,
    data: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
): Promise<Project | null> {
    const index = dummyProjects.findIndex(p => p.id === id);
    if (index === -1) return null;

    const updated: Project = {
        ...dummyProjects[index]!,
        ...data,
        updated_at: new Date().toISOString(),
    };
    dummyProjects[index] = updated;
    return updated;
}

/**
 * Delete a project by id.
 */
export async function deleteProject(id: string): Promise<void> {
    const index = dummyProjects.findIndex(p => p.id === id);
    if (index !== -1) {
        dummyProjects.splice(index, 1);
    }
}