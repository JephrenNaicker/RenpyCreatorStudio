// src/types/index.ts
export interface Character {
    id: string;
    name: string;
    nickname?: string;
    color: string;
    expressions?: string[];
    projectId?: string;
}

export interface DialogueLine {
    id: string;
    character?: {
        id: string;
        name: string;
        color: string;
    };
    text: string;
    expression?: string;
    metadata?: Record<string, any>;
    sceneId?: string;
    order: number;
}

export interface Scene {
    id: string;
    name: string;
    projectId: string;
    dialogue: DialogueLine[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    characters: Character[];
    scenes: Scene[];
    createdAt?: Date;
    updatedAt?: Date;
}