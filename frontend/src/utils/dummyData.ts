import {
    type Character,
    type Project,
    type Scene,
    type DialogueLine,
    type MenuNode,
    type SceneLine,
    type StoryVariable,
    type ChoiceEffect
} from '@/types/models';

// Define the data arrays
const initialCharacters: Character[] = [
    {
        id: '1',
        name: 'Alice',
        nickname: 'Ali',
        color: '#FF6B6B',
        age: 18,
        birth_date: '03/15',
        bio: 'A cheerful protagonist who loves adventure and has a mysterious past. She recently discovered she has elemental magic powers.',
        voice_lines: [
            { line_name: 'greeting', audio_path: 'audio/alice/greeting.ogg' },
            { line_name: 'surprise', audio_path: 'audio/alice/surprise.ogg' }
        ],
        outfits: [
            { name: 'casual', default_image: 'alice_casual.png' },
            { name: 'school', default_image: 'alice_school.png' },
            { name: 'magical', default_image: 'alice_magical.png' }
        ],
        expressions: [
            { name: 'happy', image_path: 'alice_happy.png', outfit: 'casual' },
            { name: 'sad', image_path: 'alice_sad.png', outfit: 'casual' },
            { name: 'angry', image_path: 'alice_angry.png', outfit: 'casual' },
            { name: 'surprised', image_path: 'alice_surprised.png', outfit: 'casual' },
            { name: 'magical', image_path: 'alice_magical.png', outfit: 'magical' }
        ],
        created_at: '2024-01-10T09:30:00Z',
        updated_at: '2024-01-10T09:30:00Z'
    },
    {
        id: '2',
        name: 'Bob',
        nickname: 'Bobby',
        color: '#4ECDC4',
        age: 17,
        birth_date: '08/22',
        bio: 'The reliable best friend who always has your back. He\'s practical, logical, and surprisingly good at solving puzzles.',
        voice_lines: [
            { line_name: 'greeting', audio_path: 'audio/bob/greeting.ogg' }
        ],
        outfits: [
            { name: 'casual', default_image: 'bob_casual.png' },
            { name: 'school', default_image: 'bob_school.png' }
        ],
        expressions: [
            { name: 'neutral', image_path: 'bob_neutral.png', outfit: 'casual' },
            { name: 'smile', image_path: 'bob_smile.png', outfit: 'casual' },
            { name: 'concerned', image_path: 'bob_concerned.png', outfit: 'casual' }
        ],
        created_at: '2024-01-12T14:20:00Z',
        updated_at: '2024-01-12T14:20:00Z'
    },
    {
        id: '3',
        name: 'Catherine',
        nickname: 'Cat',
        color: '#FFD166',
        age: 19,
        birth_date: '11/03',
        bio: 'Mysterious transfer student with hidden powers. She seems cold at first but has a warm heart.',
        voice_lines: [],
        outfits: [
            { name: 'magical', default_image: 'catherine_magical.png' },
            { name: 'school', default_image: 'catherine_school.png' }
        ],
        expressions: [
            { name: 'serious', image_path: 'catherine_serious.png', outfit: 'magical' },
            { name: 'mysterious', image_path: 'catherine_mysterious.png', outfit: 'magical' },
            { name: 'determined', image_path: 'catherine_determined.png', outfit: 'magical' }
        ],
        created_at: '2024-01-14T11:45:00Z',
        updated_at: '2024-01-14T11:45:00Z'
    },
    {
        id: '4',
        name: 'David',
        nickname: 'Dave',
        color: '#A78BFA',
        age: 17,
        birth_date: '05/19',
        bio: 'The smart but socially awkward class president.',
        voice_lines: [],
        outfits: [
            { name: 'formal', default_image: 'david_formal.png' },
            { name: 'casual', default_image: 'david_casual.png' }
        ],
        expressions: [
            { name: 'thinking', image_path: 'david_thinking.png', outfit: 'formal' },
            { name: 'nervous', image_path: 'david_nervous.png', outfit: 'formal' },
            { name: 'confident', image_path: 'david_confident.png', outfit: 'formal' }
        ],
        created_at: '2024-01-12T10:00:00Z',
        updated_at: '2024-01-12T10:00:00Z'
    }
];

// Project 2 variables for the choice system
const project2Variables: StoryVariable[] = [
    {
        key: 'reputation',
        type: 'number',
        default_value: 0,
        label: 'Street Reputation',
        category: 'affinity'
    },
    {
        key: 'corruption_evidence',
        type: 'number',
        default_value: 0,
        label: 'Corruption Evidence Collected',
        category: 'resource'
    },
    {
        key: 'trust_nexus',
        type: 'number',
        default_value: 0,
        label: 'Trust with Nexus',
        category: 'affinity'
    },
    {
        key: 'met_mysterious_hacker',
        type: 'boolean',
        default_value: false,
        label: 'Met Mysterious Hacker',
        category: 'flag'
    },
    {
        key: 'rebel_alliance',
        type: 'boolean',
        default_value: false,
        label: 'Allied with Rebels',
        category: 'flag'
    },
    {
        key: 'insider_alliance',
        type: 'boolean',
        default_value: false,
        label: 'Has Insider Contact',
        category: 'flag'
    },
    {
        key: 'whistleblower_alliance',
        type: 'boolean',
        default_value: false,
        label: 'Chose Whistleblower Path',
        category: 'flag'
    }
];

const initialProjects: Project[] = [
    {
        id: '1',
        name: 'Mystic Academy',
        main_plot: 'A mysterious school hiding magical secrets where students discover their supernatural abilities while navigating teenage drama and ancient prophecies.',
        main_character_id: '1',
        character_ids: ['1', '2', '3', '4'],
        tags: ['fantasy', 'school', 'mystery', 'magic'],
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:45:00Z',
        variables: [] // Project 1 doesn't use variables yet
    },
    {
        id: '2',
        name: 'Cyberpunk Dreams',
        main_plot: 'In a dystopian future, a hacker uncovers a conspiracy that could change the fate of the city.',
        main_character_id: '2',
        character_ids: ['2', '4'],
        tags: ['sci-fi', 'cyberpunk', 'thriller', 'choices-matter'],
        created_at: '2024-01-18T16:20:00Z',
        updated_at: '2024-01-19T09:15:00Z',
        variables: project2Variables
    }
];

// Scene 4: Neon Alleyway - Opening with choices
const scene4Lines: SceneLine[] = [
    // Opening dialogue
    {
        id: 's4_line_1',
        type: 'dialogue',
        character: {
            id: '2',
            name: 'Bob',
            color: '#4ECDC4'
        },
        text: "The rain pours down on the neon-lit streets of Neo-Tokyo. I just got a tip about a major corporate cover-up.",
        expression: 'neutral',
        order: 1
    },
    {
        id: 's4_line_2',
        type: 'dialogue',
        character: {
            id: '2',
            name: 'Bob',
            color: '#4ECDC4'
        },
        text: "The message was anonymous: 'Meet me at the old arcade. I have the files you need.'",
        expression: 'thinking',
        order: 2
    },
    {
        id: 's4_line_3',
        type: 'dialogue',
        character: null, // Narrator
        text: "As you approach the arcade, you notice two figures watching from the shadows.",
        order: 3
    },
    // First choice menu
    {
        id: 's4_menu_1',
        type: 'menu',
        order: 4,
        prompt: "What do you do?",
        choices: [
            {
                id: 'choice_1',
                text: "Confront them directly - show you're not afraid",
                target_scene_id: '4', // Stay in same scene, different branch
                effects: [
                    { variable: 'reputation', operation: 'add', value: 10 },
                    { variable: 'corruption_evidence', operation: 'add', value: 0 }
                ]
            },
            {
                id: 'choice_2',
                text: "Find another entrance - avoid potential trouble",
                target_scene_id: '5', // Jump to hideout scene
                effects: [
                    { variable: 'reputation', operation: 'add', value: 5 },
                    { variable: 'corruption_evidence', operation: 'add', value: 0 }
                ],
                condition: "reputation >= 0" // Always available
            },
            {
                id: 'choice_3',
                text: "Call for backup from your contact",
                target_scene_id: '4',
                effects: [
                    { variable: 'trust_nexus', operation: 'add', value: 5 },
                    { variable: 'reputation', operation: 'subtract', value: 5 }
                ]
            }
        ]
    },
    // Follow-up dialogue after choice 1
    {
        id: 's4_line_4',
        type: 'dialogue',
        character: {
            id: '2',
            name: 'Bob',
            color: '#4ECDC4'
        },
        text: "The figures turn out to be corporate security. They demand to know what you're doing here.",
        expression: 'concerned',
        order: 5
    },
    // Second choice menu
    {
        id: 's4_menu_2',
        type: 'menu',
        order: 6,
        prompt: "How do you respond?",
        choices: [
            {
                id: 'choice_4',
                text: "Lie - say you're just looking for a lost pet",
                target_scene_id: '5',
                effects: [
                    { variable: 'reputation', operation: 'subtract', value: 5 },
                    { variable: 'corruption_evidence', operation: 'add', value: 0 }
                ]
            },
            {
                id: 'choice_5',
                text: "Fight back - hack their coms to cause confusion",
                target_scene_id: '5',
                effects: [
                    { variable: 'reputation', operation: 'add', value: 15 },
                    { variable: 'corruption_evidence', operation: 'add', value: 5 }
                ],
                condition: "reputation >= 10" // Only available if reputation is high enough
            },
            {
                id: 'choice_6',
                text: "Bribe them with credits",
                target_scene_id: '5',
                effects: [
                    { variable: 'reputation', operation: 'add', value: 0 },
                    { variable: 'corruption_evidence', operation: 'add', value: 10 }
                ]
            }
        ]
    }
];

// Scene 5: The Hideout - Multiple branching paths with variable checks
const scene5Lines: SceneLine[] = [
    {
        id: 's5_line_1',
        type: 'dialogue',
        character: {
            id: '4',
            name: 'David',
            color: '#A78BFA'
        },
        text: "You made it! I was starting to get worried.",
        expression: 'nervous',
        order: 1
    },
    {
        id: 's5_line_2',
        type: 'dialogue',
        character: {
            id: '2',
            name: 'Bob',
            color: '#4ECDC4'
        },
        text: "What do you have for me, Dave? Your message sounded urgent.",
        expression: 'neutral',
        order: 2
    },
    {
        id: 's5_line_3',
        type: 'dialogue',
        character: {
            id: '4',
            name: 'David',
            color: '#A78BFA'
        },
        text: "I found something big. Nexus Corp is planning to release a virus that'll give them control over every device in the city.",
        expression: 'thinking',
        order: 3
    },
    // Conditional dialogue based on reputation
    {
        id: 's5_line_4',
        type: 'dialogue',
        character: {
            id: '2',
            name: 'Bob',
            color: '#4ECDC4'
        },
        text: "That's massive! We need to stop them. But we need more evidence first.",
        expression: 'determined',
        order: 4
    },
    // Major branching choice
    {
        id: 's5_menu_1',
        type: 'menu',
        order: 5,
        prompt: "What's your plan?",
        choices: [
            {
                id: 'choice_7',
                text: "Infiltrate Nexus Corp headquarters directly - risky but fast",
                target_scene_id: '4', // Loop back to alleyway for second approach
                effects: [
                    { variable: 'reputation', operation: 'add', value: 20 },
                    { variable: 'corruption_evidence', operation: 'add', value: 25 },
                    { variable: 'rebel_alliance', operation: 'set', value: true }
                ],
                condition: "reputation >= 15" // Only if you're bold enough
            },
            {
                id: 'choice_8',
                text: "Find a mole inside the corporation",
                target_scene_id: '4',
                effects: [
                    { variable: 'reputation', operation: 'add', value: 5 },
                    { variable: 'trust_nexus', operation: 'add', value: 20 },
                    { variable: 'corruption_evidence', operation: 'add', value: 15 },
                    { variable: 'insider_alliance', operation: 'set', value: true }
                ]
            },
            {
                id: 'choice_9',
                text: "Go public with what you have - let the people decide",
                target_scene_id: '4',
                effects: [
                    { variable: 'reputation', operation: 'add', value: 30 },
                    { variable: 'corruption_evidence', operation: 'add', value: 10 },
                    { variable: 'whistleblower_alliance', operation: 'set', value: true }
                ],
                condition: "corruption_evidence >= 10" // Need some proof first
            }
        ]
    },
    // Alternative path based on meeting a mysterious hacker (flag condition)
    {
        id: 's5_menu_2',
        type: 'menu',
        order: 6,
        prompt: "A mysterious message appears on your device: 'I can help you take down Nexus, but it'll cost you.'",
        choices: [
            {
                id: 'choice_10',
                text: "Accept the hacker's help - trust them",
                target_scene_id: '4',
                effects: [
                    { variable: 'met_mysterious_hacker', operation: 'set', value: true },
                    { variable: 'reputation', operation: 'add', value: 25 },
                    { variable: 'corruption_evidence', operation: 'add', value: 30 }
                ],
                condition: "trust_nexus <= 10" // Only if you're desperate
            },
            {
                id: 'choice_11',
                text: "Decline - too risky to trust strangers",
                target_scene_id: '4',
                effects: [
                    { variable: 'met_mysterious_hacker', operation: 'set', value: false },
                    { variable: 'trust_nexus', operation: 'add', value: 5 }
                ]
            }
        ]
    }
];

// Final scene with multiple endings based on variable checks
const scene6Lines: SceneLine[] = [
    {
        id: 's6_line_1',
        type: 'dialogue',
        character: {
            id: '2',
            name: 'Bob',
            color: '#4ECDC4'
        },
        text: "This is it. The moment we've been working toward.",
        expression: 'determined',
        order: 1
    },
    {
        id: 's6_menu_1',
        type: 'menu',
        order: 2,
        prompt: "Make your final choice:",
        choices: [
            {
                id: 'choice_final_1',
                text: "Destroy the Nexus virus at any cost",
                target_scene_id: '6',
                effects: [],
                condition: "reputation >= 20"
            },
            {
                id: 'choice_final_2',
                text: "Expose the corruption to the media",
                target_scene_id: '6',
                effects: [],
                condition: "corruption_evidence >= 25"
            },
            {
                id: 'choice_final_3',
                text: "Take control of the virus yourself",
                target_scene_id: '6',
                effects: [],
                condition: "rebel_alliance == true"
            }
        ]
    },
    {
        id: 's6_line_2',
        type: 'dialogue',
        character: null,
        text: "The future of Neo-Tokyo hangs in the balance...",
        order: 3
    }
];

// Update the scenes array with the new choice-enabled scenes
const initialScenes: Scene[] = [
    {
        id: '1',
        name: 'First Encounter',
        project_id: '1',
        character_ids: ['1', '2', '3'],
        notes: 'Opening scene at the academy gates.',
        dialogue_lines: [
            {
                id: '1',
                character: {
                    id: '1',
                    name: 'Alice',
                    color: '#FF6B6B'
                },
                text: 'Welcome to Mystic Academy!',
                expression: 'happy',
                order: 1
            },
            {
                id: '2',
                character: {
                    id: '2',
                    name: 'Bob',
                    color: '#4ECDC4'
                },
                text: 'Thanks! I\'m excited to be here.',
                expression: 'smile',
                order: 2
            }
        ] as SceneLine[],
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z'
    },
    {
        id: '2',
        name: 'The Library',
        project_id: '1',
        character_ids: ['1', '4'],
        notes: 'Alice discovers the forbidden section.',
        dialogue_lines: [],
        created_at: '2024-01-21T14:30:00Z',
        updated_at: '2024-01-21T14:30:00Z'
    },
    {
        id: '3',
        name: 'Training Grounds',
        project_id: '1',
        character_ids: ['1', '2', '3', '4'],
        dialogue_lines: [],
        created_at: '2024-01-22T09:15:00Z',
        updated_at: '2024-01-22T09:15:00Z'
    },
    {
        id: '4',
        name: 'Neon Alleyway',
        project_id: '2',
        character_ids: ['2', '4'],
        notes: 'Opening chase scene with branching choices. Features reputation system and multiple paths.',
        dialogue_lines: scene4Lines,
        created_at: '2024-01-19T10:00:00Z',
        updated_at: '2024-01-25T10:00:00Z',
        background_image: 'cyberpunk_alley.png'
    },
    {
        id: '5',
        name: 'The Hideout',
        project_id: '2',
        character_ids: ['2', '4'],
        notes: 'Meeting with your contact. Variable-dependent choices and alliance system.',
        dialogue_lines: scene5Lines,
        created_at: '2024-01-19T12:00:00Z',
        updated_at: '2024-01-25T10:00:00Z',
        background_image: 'cyberpunk_hideout.png'
    },
    {
        id: '6',
        name: 'Final Confrontation',
        project_id: '2',
        character_ids: ['2', '4'],
        notes: 'The climax of the Cyberpunk Dreams story. Multiple endings based on player choices.',
        dialogue_lines: scene6Lines,
        created_at: '2024-01-25T11:00:00Z',
        updated_at: '2024-01-25T11:00:00Z',
        background_image: 'nexus_tower.png'
    }
];

// Export the data arrays
export const dummyCharacters: Character[] = initialCharacters;
export const dummyProjects: Project[] = initialProjects;
export const dummyScenes: Scene[] = initialScenes;

// Export types for convenience
export type { Character, Project, Scene, DialogueLine, MenuNode, SceneLine, StoryVariable, ChoiceEffect };