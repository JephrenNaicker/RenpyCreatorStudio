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
    // Story variables registry — defined at project level, used across all scenes
    variables?: StoryVariable[];
}

export interface DialogueLineCharacter {
    id: string;
    name: string;
    color: string;
}

// ─── Line type discriminator ──────────────────────────────────────────────────
// Every item in a scene's line array is a SceneLine.
// 'dialogue' = normal spoken line (existing behaviour)
// 'menu'     = branching choice node
// 'action'   = future: scene action / stage direction
export type SceneLineType = 'dialogue' | 'menu' | 'action';

// ─── Dialogue line (unchanged shape, type field added) ────────────────────────
export interface DialogueLine {
    id: string;
    type?: SceneLineType;           // defaults to 'dialogue' when absent — keeps dummy data valid
    character: {
        id: string;
        name: string;
        color: string;
        is_removed?: boolean;
    } | null;
    text: string;
    expression?: string;
    outfit?: string;
    order: number;
    image_position?: ImagePosition;
}

// ─── Menu / Choice node ───────────────────────────────────────────────────────
export interface MenuNode {
    id: string;
    type: 'menu';
    order: number;
    prompt?: string;                // Optional question shown above choices
    choices: MenuChoice[];
}

export interface MenuChoice {
    id: string;
    text: string;                   // The option label the player sees

    // Navigation — where this choice leads
    target_scene_id?: string;       // Jump to a different scene entirely
    target_line_id?: string;        // Jump to a specific line within a scene (future)

    // ── Point / variable effects (dormant — stored but not evaluated yet) ──
    effects?: ChoiceEffect[];

    // ── Condition to show this option (dormant — stored but not evaluated yet) ──
    // Example: "affinity_alice >= 10"  |  "karma > 0"
    condition?: string;
}

// ─── Point / variable system ──────────────────────────────────────────────────
// Represents a single side-effect a choice has on story state.
// e.g. { variable: 'affinity_alice', operation: 'add', value: 5 }
export interface ChoiceEffect {
    variable: string;               // Must match a StoryVariable.key in the project
    operation: 'add' | 'subtract' | 'set' | 'toggle';
    value: number | boolean;
}

// Defined once per project — the master registry of all variables.
export interface StoryVariable {
    key: string;                    // Unique snake_case key e.g. "affinity_alice"
    type: 'number' | 'boolean' | 'string';
    default_value: number | boolean | string;
    label?: string;                 // Human-friendly name e.g. "Alice Affinity"
    category?: 'affinity' | 'flag' | 'resource' | 'karma' | 'other';
}

// ─── Union type — use this in Scene.dialogue_lines ────────────────────────────
// A scene line is either a spoken dialogue line OR a menu node.
export type SceneLine = DialogueLine | MenuNode;

// ─── Image & transform (unchanged) ───────────────────────────────────────────
export interface ImagePosition {
    position: 'left' | 'center' | 'right' | 'custom';
    custom_x?: number;
    custom_y?: number;
    transform?: TransformConfig;
}

export interface TransformConfig {
    zoom?: number;
    rotate?: number;
    flip_x?: boolean;
    flip_y?: boolean;
    alpha?: number;
    blend?: 'add' | 'multiply' | 'normal';
}

// ─── Scene (dialogue_lines now accepts the union type) ────────────────────────
export interface Scene {
    id: string;
    name: string;
    project_id: string;
    character_ids: string[];
    notes?: string;
    dialogue_lines: SceneLine[];    // ← was DialogueLine[], now the union
    created_at: string;
    updated_at: string;
    default_positions?: CharacterDefaultPosition[];
    background_image?: string;
}

export interface CharacterDefaultPosition {
    character_id: string;
    position: 'left' | 'center' | 'right' | 'custom';
    custom_x?: number;
    custom_y?: number;
    transform?: TransformConfig;
}