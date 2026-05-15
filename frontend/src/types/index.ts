// src/types/index.ts

export interface VoiceLine {
    line_name: string;
    audio_path: string;
}

export interface Outfit {
    name: string;
    default_image: string;
}

export interface Expression {
    name: string;
    image_path: string;
    outfit: string;
}

export interface Character {
    id: string;
    name: string;
    nickname?: string;
    color: string;
    age?: number;
    birth_date?: string;
    bio?: string;
    voice_lines?: VoiceLine[];
    outfits?: Outfit[];
    expressions?: Expression[];
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: string;
    name: string;
    main_plot: string;
    main_character_id?: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface DialogueLineCharacter {
    id: string;
    name: string;
    color: string;
}

export interface DialogueLine {
    id: string;
    character?: DialogueLineCharacter;
    text: string;
    expression?: string;
    order: number;
}

export interface Scene {
    id: string;
    name: string;
    project_id: string;
    character_ids: string[];
    notes?: string;
    dialogue_lines: DialogueLine[];
    created_at: string;
    updated_at: string;
}