// src/services/dialogueService.ts
//
// Factory and utility layer for dialogue lines and menu nodes.
//
// Dialogue lines are NOT a standalone resource — they are nested inside a Scene
// and only persisted when sceneService.saveScene() is called with the full scene.
// This service has no async calls and no dummy data access. It handles:
//   - Constructing properly-shaped DialogueLine / MenuNode objects with IDs
//   - Pure array operations (reorder, update position, update visibility)
//
// When the FastAPI backend arrives, these factories stay as-is. The only change
// will be that the parent view calls sceneService.saveScene() more eagerly.

import type {
    DialogueLine,
    MenuNode,
    MenuChoice,
    ActionNode,
    SceneLine,
} from '@/types/models';
import type { ImagePosition } from '@/types/models';

// ─── ID generators ────────────────────────────────────────────────────────────

const generateLineId = (): string =>
    `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateMenuId = (): string =>
    `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateChoiceId = (): string =>
    `choice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateActionId = (): string =>
    `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─── Factories ────────────────────────────────────────────────────────────────

/**
 * Build a new DialogueLine with a generated ID and correct order.
 * Strips any UI-only fields before constructing the stored shape.
 */
export function createDialogueLine(
    data: Omit<DialogueLine, 'id' | 'order' | 'type'>,
    order: number
): DialogueLine {
    return {
        ...data,
        id: generateLineId(),
        type: 'dialogue',
        order,
    };
}

/**
 * Build a new MenuNode with a generated ID and correct order.
 * Ensures every choice has an id if one was not provided.
 */
export function createMenuNode(
    data: Omit<MenuNode, 'id' | 'order' | 'type'>,
    order: number
): MenuNode {
    return {
        ...data,
        id: generateMenuId(),
        type: 'menu',
        order,
        choices: (data.choices || []).map(choice => ({
            ...choice,
            id: choice.id || generateChoiceId(),
        })),
    };
}

/**
 * Build the mandatory "background: none" action node every scene must open
 * with. Always order 1, always at index 0 — see `is_initial` on ActionNode.
 */
export function createInitialBackgroundNode(): ActionNode {
    return {
        id: generateActionId(),
        type: 'action',
        order: 1,
        action_type: 'background_change',
        background_path: undefined,
        background_name: undefined,
        transition: 'instant',
        is_initial: true,
    };
}

/**
 * Guarantee `lines` opens with the initial background node. Used both when
 * creating a scene and defensively when loading one (older/dummy scenes may
 * predate this requirement) — a no-op if it's already there.
 */
export function ensureInitialBackgroundLine(lines: SceneLine[]): SceneLine[] {
    const first = lines[0];
    const hasInitial = !!first && first.type === 'action' && (first as ActionNode).is_initial;
    if (hasInitial) return lines;
    return reorderLines([createInitialBackgroundNode(), ...lines]);
}

// ─── Array utilities ──────────────────────────────────────────────────────────

/**
 * Re-assign sequential `order` values after an insertion or deletion.
 * Returns a new array — does not mutate the input.
 */
export function reorderLines(lines: SceneLine[]): SceneLine[] {
    return lines.map((line, idx) => ({ ...line, order: idx + 1 }));
}

/**
 * Return a new lines array with the position updated at `index`.
 * Menu nodes are passed through unchanged (they have no image_position).
 */
export function applyLinePosition(
    lines: SceneLine[],
    index: number,
    position: ImagePosition | undefined
): SceneLine[] {
    return lines.map((line, i) => {
        if (i !== index || line.type === 'menu') return line;
        return { ...(line as DialogueLine), image_position: position };
    });
}

/**
 * Return a new lines array with the speaker visibility updated at `index`.
 * Menu nodes are passed through unchanged (they have no speaker).
 */
export function applyLineVisibility(
    lines: SceneLine[],
    index: number,
    visible: boolean
): SceneLine[] {
    return lines.map((line, i) => {
        if (i !== index || line.type === 'menu') return line;
        return { ...(line as DialogueLine), speaker_visible: visible };
    });
}

/*
 * Return a new lines array with the line at `index` replaced.
 * Used by the edit flow in DialogueEditor / ProjectSceneEditorView.
 */

export function replaceLine(
    lines: SceneLine[],
    index: number,
    updated: SceneLine
): SceneLine[] {
    return lines.map((line, i) => (i === index ? updated : line));
}

/**
 * Return a new lines array with the line at `index` removed,
 * with order values re-assigned.
 */
export function deleteLine(lines: SceneLine[], index: number): SceneLine[] {
    const target = lines[index];
    if (index === 0 && target?.type === 'action' && (target as ActionNode).is_initial) {
        // Required line — every scene must keep its opening background set.
        // The UI already hides the delete affordance for it; this is the
        // data-layer backstop in case something else calls deleteLine directly.
        return lines;
    }
    const filtered = lines.filter((_, i) => i !== index);
    return reorderLines(filtered);
}