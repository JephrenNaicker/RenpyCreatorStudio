// frontend/src/services/VariableManagerService.ts
//
// Manages the project-level StoryVariable registry, plus cross-scene
// usage scanning so VariableManager.vue can show "where is this used"
// before allowing a rename or delete.
//
// Design notes:
// - All functions here are PURE — they take data in, return new data out.
//   They never fetch or hold state themselves. The calling component
//   (ProjectSceneEditorView.vue) owns the reactive refs (variables, scenes)
//   and re-assigns them with the results, same pattern already used for
//   projectCharacters.value / scenes.value in that file.
// - This mirrors getCharacterUsage() already in ProjectSceneEditorView.vue —
//   same "scan all scenes, flatten, group" shape, just applied to
//   MenuChoice.effects / MenuChoice.condition instead of DialogueLine.character.
// - Only MenuNode/MenuChoice reference variables today (via `effects` and
//   `condition`). DialogueLine has no variable reference — see models.ts.
// - When real persistence (api.ts) exists, only the CRUD functions in the
//   "Persistence" section need to change to hit the backend. The usage-scan
//   section stays client-side regardless, since it just reads scenes
//   already loaded in memory.

import type { Scene, MenuNode, MenuChoice, StoryVariable } from '@/types/models';

// ─── Usage record ──────────────────────────────────────────────────────────

export interface VariableUsage {
    sceneId: string;
    sceneName: string;
    menuNodeId: string;
    menuPrompt?: string;
    choiceId: string;
    choiceText: string;
    role: 'read' | 'write';         // 'read' = appears in a condition, 'write' = appears in an effect
    detail: string;                 // human-readable summary, e.g. "+10 (add)" or "condition: reputation >= 10"
}

export interface DeleteVariableResult {
    success: boolean;
    variables: StoryVariable[];
    blockedBy?: VariableUsage[];    // present only when success === false
}

export interface UpdateVariableResult {
    variables: StoryVariable[];
    scenes: Scene[];                // only differs from input if the key was renamed (cascade)
}

// ─── Validation helpers ─────────────────────────────────────────────────────

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

export function isValidVariableKey(key: string): boolean {
    return KEY_PATTERN.test(key);
}

export function isKeyTaken(variables: StoryVariable[], key: string): boolean {
    return variables.some(v => v.key === key);
}

function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Matches `key` as a whole word only, so "reputation" doesn't also match
// "reputation_bonus" inside a condition string.
function keyRegex(key: string): RegExp {
    return new RegExp(`\\b${escapeRegExp(key)}\\b`, 'g');
}

// ─── Persistence (CRUD) ──────────────────────────────────────────────────
// Dummy-data mutation for now (mirrors handleCreateCharacter in
// ProjectSceneEditorView.vue). Swap the bodies for real api.ts calls later
// without touching call sites — signatures are designed to stay stable.

export function listVariables(variables: StoryVariable[]): StoryVariable[] {
    return [...variables];
}

export function createVariable(
    variables: StoryVariable[],
    variable: StoryVariable
): StoryVariable[] {
    const key = variable.key.trim();

    if (!isValidVariableKey(key)) {
        throw new Error(
            `Invalid variable key "${key}". Use lowercase letters, numbers, and underscores, starting with a letter.`
        );
    }
    if (isKeyTaken(variables, key)) {
        throw new Error(`Variable key "${key}" already exists.`);
    }

    return [...variables, { ...variable, key }];
}

/**
 * Updates a variable's metadata (label, type, default_value, category) and,
 * if `changes.key` differs from the current key, cascades the rename across
 * every effect.variable and condition string in every scene that references
 * the old key. Without the cascade, a rename would silently orphan every
 * existing reference — defeating the point of having a registry at all.
 */
export function updateVariable(
    variables: StoryVariable[],
    scenes: Scene[],
    key: string,
    changes: Partial<StoryVariable>
): UpdateVariableResult {
    const existing = variables.find(v => v.key === key);
    if (!existing) {
        throw new Error(`Variable "${key}" not found.`);
    }

    const newKey = changes.key?.trim();
    const isRename = !!newKey && newKey !== key;

    if (isRename) {
        if (!isValidVariableKey(newKey!)) {
            throw new Error(
                `Invalid variable key "${newKey}". Use lowercase letters, numbers, and underscores, starting with a letter.`
            );
        }
        if (isKeyTaken(variables, newKey!)) {
            throw new Error(`Variable key "${newKey}" already exists.`);
        }
    }

    const updatedVariables = variables.map(v =>
        v.key === key ? { ...v, ...changes, key: isRename ? newKey! : v.key } : v
    );

    const updatedScenes = isRename ? renameVariableInScenes(scenes, key, newKey!) : scenes;

    return { variables: updatedVariables, scenes: updatedScenes };
}

/**
 * Deletes a variable from the registry. Refuses to delete (mirrors the
 * character-removal-modal pattern in ProjectSceneEditorView.vue) if the
 * variable is still referenced anywhere, unless `force` is passed — in
 * which case references are left as dangling strings/keys rather than
 * being rewritten, since there's no safe automatic substitute for a
 * deleted variable the way there is for a renamed one.
 */
export function deleteVariable(
    variables: StoryVariable[],
    scenes: Scene[],
    key: string,
    options: { force?: boolean } = {}
): DeleteVariableResult {
    const usage = getVariableUsage(scenes, key);

    if (usage.length > 0 && !options.force) {
        return { success: false, variables, blockedBy: usage };
    }

    return {
        success: true,
        variables: variables.filter(v => v.key !== key)
    };
}

// ─── Rename cascade (internal) ──────────────────────────────────────────────

function renameVariableInScenes(scenes: Scene[], oldKey: string, newKey: string): Scene[] {
    const regex = keyRegex(oldKey);

    return scenes.map(scene => ({
        ...scene,
        dialogue_lines: scene.dialogue_lines.map(line => {
            if (line.type !== 'menu') return line;
            const menu = line as MenuNode;

            return {
                ...menu,
                choices: menu.choices.map((choice): MenuChoice => ({
                    ...choice,
                    condition: choice.condition
                        ? choice.condition.replace(regex, newKey)
                        : choice.condition,
                    effects: choice.effects?.map(effect =>
                        effect.variable === oldKey ? { ...effect, variable: newKey } : effect
                    )
                }))
            };
        })
    }));
}

// ─── Usage scanning (pure, reads scenes already in memory) ─────────────────

/**
 * Scans every scene for read/write references to a single variable key.
 * Same "scan all scenes, flatten, group" shape as getCharacterUsage() in
 * ProjectSceneEditorView.vue.
 */
export function getVariableUsage(scenes: Scene[], key: string): VariableUsage[] {
    const usage: VariableUsage[] = [];
    const regex = keyRegex(key);

    scenes.forEach(scene => {
        scene.dialogue_lines.forEach(line => {
            if (line.type !== 'menu') return;
            const menu = line as MenuNode;

            menu.choices.forEach(choice => {
                // Writes — effects that target this variable
                choice.effects?.forEach(effect => {
                    if (effect.variable !== key) return;
                    usage.push({
                        sceneId: scene.id,
                        sceneName: scene.name,
                        menuNodeId: menu.id,
                        menuPrompt: menu.prompt,
                        choiceId: choice.id,
                        choiceText: choice.text,
                        role: 'write',
                        detail: describeEffect(effect.operation, effect.value)
                    });
                });

                // Reads — conditions that mention this variable
                if (choice.condition && regex.test(choice.condition)) {
                    usage.push({
                        sceneId: scene.id,
                        sceneName: scene.name,
                        menuNodeId: menu.id,
                        menuPrompt: menu.prompt,
                        choiceId: choice.id,
                        choiceText: choice.text,
                        role: 'read',
                        detail: `condition: ${choice.condition}`
                    });
                }
                // reset lastIndex since regex has the global flag and is reused across choices
                regex.lastIndex = 0;
            });
        });
    });

    return usage;
}

/**
 * Same scan as getVariableUsage, but for every variable in one pass —
 * cheaper than calling getVariableUsage per key when populating the
 * VariableManager.vue list view (e.g. showing a usage count badge per row).
 */
export function getAllVariableUsage(scenes: Scene[]): Record<string, VariableUsage[]> {
    const usageByKey: Record<string, VariableUsage[]> = {};

    const record = (key: string, entry: VariableUsage) => {
        if (!usageByKey[key]) usageByKey[key] = [];
        usageByKey[key].push(entry);
    };

    scenes.forEach(scene => {
        scene.dialogue_lines.forEach(line => {
            if (line.type !== 'menu') return;
            const menu = line as MenuNode;

            menu.choices.forEach(choice => {
                choice.effects?.forEach(effect => {
                    if (!effect.variable) return;
                    record(effect.variable, {
                        sceneId: scene.id,
                        sceneName: scene.name,
                        menuNodeId: menu.id,
                        menuPrompt: menu.prompt,
                        choiceId: choice.id,
                        choiceText: choice.text,
                        role: 'write',
                        detail: describeEffect(effect.operation, effect.value)
                    });
                });

                if (choice.condition) {
                    // naive tokenization — pulls anything shaped like a variable
                    // key out of the condition string to attribute the read
                    const matches = choice.condition.match(/[a-z][a-z0-9_]*/g) ?? [];
                    new Set(matches).forEach(possibleKey => {
                        record(possibleKey, {
                            sceneId: scene.id,
                            sceneName: scene.name,
                            menuNodeId: menu.id,
                            menuPrompt: menu.prompt,
                            choiceId: choice.id,
                            choiceText: choice.text,
                            role: 'read',
                            detail: `condition: ${choice.condition}`
                        });
                    });
                }
            });
        });
    });

    return usageByKey;
}

function describeEffect(operation: string, value: number | boolean): string {
    switch (operation) {
        case 'add': return `+${value}`;
        case 'subtract': return `-${value}`;
        case 'set': return `= ${value}`;
        case 'toggle': return 'toggle';
        default: return String(value);
    }
}