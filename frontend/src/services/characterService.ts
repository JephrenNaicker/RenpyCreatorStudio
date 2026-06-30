// src/services/characterService.ts
//
// Data-access layer for characters. Backed by dummy data for now — every
// function is async so call sites already match what real API calls
// (services/api.ts) will look like once the FastAPI backend is wired up.

import { dummyCharacters, type Character } from '@/utils/dummyData';

/**
 * Get all characters.
 */
export async function getCharacters(): Promise<Character[]> {
    return [...dummyCharacters];
}

/**
 * Get a single character by id.
 */
export async function getCharacter(id: string): Promise<Character | null> {
    return dummyCharacters.find(c => c.id === id) ?? null;
}

/**
 * Create a new character.
 */
export async function createCharacter(
    data: Omit<Character, 'id' | 'created_at' | 'updated_at'>
): Promise<Character> {
    const now = new Date().toISOString();
    const newCharacter: Character = {
        ...data,
        id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: now,
        updated_at: now,
    };
    dummyCharacters.push(newCharacter);
    return newCharacter;
}

/**
 * Update an existing character (partial patch merged onto the existing record).
 */
export async function updateCharacter(
    id: string,
    data: Partial<Omit<Character, 'id' | 'created_at' | 'updated_at'>>
): Promise<Character | null> {
    const index = dummyCharacters.findIndex(c => c.id === id);
    if (index === -1) return null;

    const updated: Character = {
        ...dummyCharacters[index]!,
        ...data,
        updated_at: new Date().toISOString(),
    };
    dummyCharacters[index] = updated;
    return updated;
}

/**
 * Delete a character by id.
 *
 * Note: this only removes the character record itself. Cleaning up
 * references to this character in scenes/projects (e.g. the removal-modal
 * flow in ProjectSceneEditorView) is a separate, higher-level operation and
 * stays out of this service.
 */
export async function deleteCharacter(id: string): Promise<void> {
    const index = dummyCharacters.findIndex(c => c.id === id);
    if (index !== -1) {
        dummyCharacters.splice(index, 1);
    }
}