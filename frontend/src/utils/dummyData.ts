export const dummyCharacters = [
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
        created_at: '2024-01-10T09:30:00Z'
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
        created_at: '2024-01-12T14:20:00Z'
    },
    {
        id: '3',
        name: 'Catherine',
        nickname: 'Cat',
        color: '#FFD166',
        age: 19,
        birth_date: '11/03',
        bio: 'Mysterious transfer student with hidden powers. She seems cold at first but has a warm heart.',
        outfits: [
            { name: 'magical', default_image: 'catherine_magical.png' },
            { name: 'school', default_image: 'catherine_school.png' }
        ],
        expressions: [
            { name: 'serious', image_path: 'catherine_serious.png', outfit: 'magical' },
            { name: 'mysterious', image_path: 'catherine_mysterious.png', outfit: 'magical' },
            { name: 'determined', image_path: 'catherine_determined.png', outfit: 'magical' }
        ],
        created_at: '2024-01-14T11:45:00Z'
    }
];

export const dummyProjects = [
    {
        id: '1',
        name: 'Mystic Academy',
        main_plot: 'A mysterious school hiding magical secrets where students discover their supernatural abilities while navigating teenage drama and ancient prophecies.',
        main_character_id: '1',
        tags: ['fantasy', 'school', 'mystery', 'magic'],
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:45:00Z'
    },
    {
        id: '2',
        name: 'Cyberpunk Dreams',
        main_plot: 'In a dystopian future, a hacker uncovers a conspiracy that could change the fate of the city.',
        main_character_id: '2',
        tags: ['sci-fi', 'cyberpunk', 'thriller'],
        created_at: '2024-01-18T16:20:00Z',
        updated_at: '2024-01-19T09:15:00Z'
    }
];