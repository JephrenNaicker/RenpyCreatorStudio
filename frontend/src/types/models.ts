// src/types/models.ts

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
    character_ids?: string[];
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
    character: {
        id: string;
        name: string;
        color: string;
        is_removed?: boolean;  // For placeholder characters
    } | null;  // Allow null for narrator/action lines
    text: string;
    expression?: string;
    outfit?: string;
    order: number;
    image_position?: ImagePosition;
}

//Image position configuration
export interface ImagePosition {
    position: 'left' | 'center' | 'right' | 'custom';
    custom_x?: number;      // 0.0 to 1.0 (percentage of screen)
    custom_y?: number;      // 0.0 to 1.0
    transform?: TransformConfig;
}

//Transform configuration (for advanced positioning)
export interface TransformConfig {
    zoom?: number;          // 0.5 to 2.0
    rotate?: number;        // degrees
    flip_x?: boolean;       // horizontal flip
    flip_y?: boolean;       // vertical flip
    alpha?: number;         // transparency 0.0 to 1.0
    blend?: 'add' | 'multiply' | 'normal';
}

//Update Scene to support scene-level image defaults
export interface Scene {
    id: string;
    name: string;
    project_id: string;
    character_ids: string[];
    notes?: string;
    dialogue_lines: DialogueLine[];
    created_at: string;
    updated_at: string;
    // NEW: Scene-level default positions
    default_positions?: CharacterDefaultPosition[];
    // NEW: Background image
    background_image?: string;
}

//Default position per character in a scene
export interface CharacterDefaultPosition {
    character_id: string;
    position: 'left' | 'center' | 'right' | 'custom';
    custom_x?: number;
    custom_y?: number;
    transform?: TransformConfig;
}