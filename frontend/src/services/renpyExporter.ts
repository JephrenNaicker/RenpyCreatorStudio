// frontend/src/services/renpyExporter.ts
//
// Turns scenes into Ren'Py script (.rpy).
//
// Jump model: a MenuChoice may carry `target_line_id` (a line in the SAME scene).
// Labels are generated at export time, only for lines that are actually jumped to,
// so nothing extra is stored and reordering/inserting lines can't break anything.
// A choice with no target "falls through" to whatever follows the menu, exactly
// like a Ren'Py menu block that ends without a `jump`.

import type {
    ActionNode,
    Character,
    CharacterState,
    ChoiceEffect,
    DialogueLine,
    MenuChoice,
    MenuNode,
    Scene,
    SceneLine,
    StoryVariable,
} from '@/types/models';

// ─── Public types ────────────────────────────────────────────────────────────

export interface ExportIssue {
    level: 'error' | 'warning';
    sceneId: string;
    sceneName: string;
    lineId?: string;
    message: string;
}

export interface ExportContext {
    characters: Character[];
    variables: StoryVariable[];
}

export interface SceneExport {
    label: string;
    code: string;
    issues: ExportIssue[];
}

export interface ProjectExport {
    code: string;
    issues: ExportIssue[];
    hasErrors: boolean;
}

/** Shared across scenes in one export so labels / image names stay unique project-wide. */
export interface ExportRegistry {
    usedLabels: Set<string>;
    backgroundByPath: Map<string, string>;   // path -> image name
    backgroundNames: Set<string>;
}

export const createRegistry = (): ExportRegistry => ({
    usedLabels: new Set(['start']),           // `label start` is emitted by exportProject
    backgroundByPath: new Map(),
    backgroundNames: new Set(),
});

// ─── Small helpers ───────────────────────────────────────────────────────────

const isMenu = (l: SceneLine): l is MenuNode => l.type === 'menu';
const isAction = (l: SceneLine): l is ActionNode => l.type === 'action';

const RESERVED = [
    'and', 'as', 'assert', 'class', 'def', 'del', 'elif', 'else', 'except', 'false', 'finally',
    'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'none', 'not', 'or', 'pass',
    'raise', 'return', 'true', 'try', 'while', 'with', 'yield',
    // Ren'Py built-ins a character variable must not shadow
    'left', 'right', 'center', 'truecenter', 'narrator', 'config', 'store', 'renpy',
    'persistent', 'black', 'fade', 'dissolve', 'start',
];

const IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** lower_snake identifier, never empty, never starting with a digit. */
function ident(raw: string, fallback: string): string {
    let s = raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!s) s = fallback;
    if (/^[0-9]/.test(s)) s = `n_${s}`;
    return s;
}

function unique(base: string, used: Set<string>): string {
    let name = base;
    let n = 2;
    while (used.has(name)) name = `${base}_${n++}`;
    used.add(name);
    return name;
}

/** Python/Ren'Py string literal. `[` and `{` are left alone on purpose so writers can use [vars] and {i} tags. */
const pyStr = (s: string): string =>
    `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n')}"`;

const isTempUrl = (p: string) => /^(blob:|data:|https?:)/.test(p);

type VarType = StoryVariable['type'];

function pyValue(value: unknown, type?: VarType | null): string {
    const kind: VarType = type ?? (typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string');
    if (kind === 'boolean') return value === true || value === 'true' ? 'True' : 'False';
    if (kind === 'number') return String(Number(value) || 0);
    return pyStr(String(value ?? ''));
}

// ─── Names ───────────────────────────────────────────────────────────────────

export function characterVarNames(characters: Character[]): Map<string, string> {
    const used = new Set(RESERVED);
    const names = new Map<string, string>();
    for (const c of characters) names.set(c.id, unique(ident(c.name, 'char'), used));
    return names;
}

/** `image alice casual happy = "alice_happy.png"` — keyed by the image name. */
export function characterImages(characters: Character[], names: Map<string, string>): Map<string, string> {
    const images = new Map<string, string>();
    for (const c of characters) {
        const tag = names.get(c.id);
        if (!tag) continue;
        for (const o of c.outfits ?? []) {
            if (o.default_image) images.set(`${tag} ${ident(o.name, 'outfit')}`, o.default_image);
        }
        for (const e of c.expressions ?? []) {
            if (!e.image_path) continue;
            const attrs = [e.outfit ? ident(e.outfit, 'outfit') : '', ident(e.name, 'expr')].filter(Boolean);
            images.set([tag, ...attrs].join(' '), e.image_path);
        }
    }
    return images;
}

// ─── Jump targets (also used by the editor UI) ───────────────────────────────

/** Ids of lines that at least one menu choice in this scene jumps to (existing lines only). */
export function collectJumpTargets(lines: SceneLine[]): Set<string> {
    const ids = new Set(lines.map(l => l.id));
    const targets = new Set<string>();
    for (const line of lines) {
        if (!isMenu(line)) continue;
        for (const c of line.choices) {
            if (c.target_line_id && ids.has(c.target_line_id)) targets.add(c.target_line_id);
        }
    }
    return targets;
}

/** Choices that jump to `lineId` — use before deleting a line to warn the user. */
export function findJumpReferrers(lines: SceneLine[], lineId: string): { menuId: string; choiceId: string }[] {
    const refs: { menuId: string; choiceId: string }[] = [];
    for (const line of lines) {
        if (!isMenu(line)) continue;
        for (const c of line.choices) {
            if (c.target_line_id === lineId) refs.push({ menuId: line.id, choiceId: c.id });
        }
    }
    return refs;
}

/** Returns a copy of `lines` where every choice jumping to `lineId` falls through instead. */
export function clearJumpTargets(lines: SceneLine[], lineId: string): SceneLine[] {
    return lines.map(line => {
        if (!isMenu(line) || !line.choices.some(c => c.target_line_id === lineId)) return line;
        return {
            ...line,
            choices: line.choices.map(c => (c.target_line_id === lineId ? { ...c, target_line_id: undefined } : c)),
        };
    });
}

function lineLabels(sceneLabel: string, lines: SceneLine[], used: Set<string>): Map<string, string> {
    const labels = new Map<string, string>();
    lines.forEach((line, i) => {
        // The first line IS the scene label, so jumping to it jumps to the scene start.
        if (i === 0) { labels.set(line.id, sceneLabel); return; }
        labels.set(line.id, unique(`${sceneLabel}_${ident(line.id, 'line')}`, used));
    });
    return labels;
}

// ─── Conditions & effects ────────────────────────────────────────────────────

/** "a >= 1 AND flag == true"  ->  "a >= 1 and flag == True" (string literals untouched). */
function legacyConditionToPython(src: string): string {
    return src
        .split(/("(?:[^"\\]|\\.)*")/)
        .map((chunk, i) => (i % 2 === 1
            ? chunk
            : chunk.replace(/\bAND\b/g, 'and').replace(/\bOR\b/g, 'or').replace(/\btrue\b/gi, 'True').replace(/\bfalse\b/gi, 'False')))
        .join('');
}

function conditionToPython(choice: MenuChoice, vars: Map<string, StoryVariable>): string | null {
    const parts = (choice._conditionParts ?? []).filter(p => p.variable && p.operator);
    if (parts.length > 0) {
        return parts
            .map((p, i, arr) => {
                const seg = `${p.variable} ${p.operator} ${pyValue(p.value, vars.get(p.variable)?.type)}`;
                return i < arr.length - 1 ? `${seg} ${p.logicalOp === 'OR' ? 'or' : 'and'}` : seg;
            })
            .join(' ');
    }
    const legacy = choice.condition?.trim();
    return legacy ? legacyConditionToPython(legacy) : null;
}

function effectToPython(e: ChoiceEffect, vars: Map<string, StoryVariable>): string {
    const type = vars.get(e.variable)?.type;
    switch (e.operation) {
        case 'add': return `$ ${e.variable} += ${pyValue(e.value, 'number')}`;
        case 'subtract': return `$ ${e.variable} -= ${pyValue(e.value, 'number')}`;
        case 'toggle': return `$ ${e.variable} = not ${e.variable}`;
        case 'set':
        default: return `$ ${e.variable} = ${pyValue(e.value, type)}`;
    }
}

// ─── Scene export ────────────────────────────────────────────────────────────

interface Block { label: string; body: string[] }

export function exportScene(scene: Scene, ctx: ExportContext, registry: ExportRegistry = createRegistry()): SceneExport & { images: Map<string, string> } {
    const issues: ExportIssue[] = [];
    const issue = (level: ExportIssue['level'], message: string, lineId?: string) =>
        issues.push({ level, sceneId: scene.id, sceneName: scene.name, lineId, message });

    const vars = new Map(ctx.variables.map(v => [v.key, v]));
    const charById = new Map(ctx.characters.map(c => [c.id, c]));
    const charNames = characterVarNames(ctx.characters);
    const knownImages = characterImages(ctx.characters, charNames);

    const lines = scene.dialogue_lines ?? [];
    const sceneLabel = unique(ident(scene.name, 'scene'), registry.usedLabels);
    const labels = lineLabels(sceneLabel, lines, registry.usedLabels);
    const jumpTargets = collectJumpTargets(lines);

    let skippedVisuals = 0;

    const assetRef = (path: string, what: string, lineId?: string): string => {
        if (isTempUrl(path)) {
            issue('warning', `${what} is a temporary browser URL — replace it with a real file inside game/.`, lineId);
        }
        return pyStr(path);
    };

    const checkVariable = (key: string, where: string, lineId: string): boolean => {
        if (!IDENT_RE.test(key)) { issue('error', `${where}: "${key}" is not a valid variable name.`, lineId); return false; }
        if (!vars.has(key)) { issue('error', `${where}: variable "${key}" is not in the Variables list, so Ren'Py would crash on it.`, lineId); return false; }
        return true;
    };

    // ── menu ──
    const exportMenu = (node: MenuNode): string[] => {
        const out = ['menu:'];
        if (node.prompt?.trim()) out.push(`    ${pyStr(node.prompt.trim())}`);

        let written = 0;
        node.choices.forEach((choice, ci) => {
            const n = ci + 1;
            if (!choice.text.trim()) { issue('warning', `Menu choice ${n} has no text and was skipped.`, node.id); return; }

            const body: string[] = [];

            for (const effect of choice.effects ?? []) {
                if (!effect.variable) continue;
                if (!checkVariable(effect.variable, `Choice ${n} effect`, node.id)) continue;
                body.push(effectToPython(effect, vars));
            }

            if (choice.target_line_id) {
                const label = labels.get(choice.target_line_id);
                if (label) body.push(`jump ${label}`);
                else issue('error', `Choice ${n} jumps to a line that no longer exists.`, node.id);
            }
            // No target: falls through to the line after the menu.

            const parts = (choice._conditionParts ?? []);
            parts.forEach(p => { if (p.variable) checkVariable(p.variable, `Choice ${n} condition`, node.id); });
            const cond = conditionToPython(choice, vars);

            out.push(`    ${pyStr(choice.text.trim())}${cond ? ` if ${cond}` : ''}:`);
            if (body.length === 0) body.push('pass');
            body.forEach(b => out.push(`        ${b}`));
            written++;
        });

        if (written === 0) {
            issue('error', 'Menu has no usable choices.', node.id);
            return [];
        }
        return out;
    };

    // ── background / music ──
    const exportAction = (node: ActionNode): string[] => {
        if (node.action_type === 'music_change') {
            const fade = node.music_fade && node.music_fade > 0 ? node.music_fade : 0;
            if (node.music_mode === 'stop') {
                return [`stop music${fade ? ` fadeout ${fade}` : ''}`];
            }
            if (!node.music_path) {
                issue('warning', 'Music action has no track selected and was skipped.', node.id);
                return [];
            }
            return [`play music ${assetRef(node.music_path, 'Music track', node.id)}${fade ? ` fadein ${fade}` : ''}`];
        }

        const transition = node.transition === 'fade' ? ' with fade' : node.transition === 'dissolve' ? ' with dissolve' : '';
        if (!node.background_path) return [`scene black${transition}`];

        if (isTempUrl(node.background_path)) {
            issue('warning', `Background "${node.background_name ?? node.background_path}" is a temporary browser URL — replace it with a real file inside game/.`, node.id);
        }
        let name = registry.backgroundByPath.get(node.background_path);
        if (!name) {
            const fileBase = (node.background_name || node.background_path.split('/').pop() || 'background').replace(/\.[a-z0-9]+$/i, '');
            name = unique(`bg_${ident(fileBase, 'background')}`, registry.backgroundNames);
            registry.backgroundByPath.set(node.background_path, name);
        }
        return [`scene ${name}${transition}`];
    };

    // ── dialogue (+ best-effort sprite show/hide) ──
    const exportVisuals = (line: DialogueLine): string[] => {
        const states: CharacterState[] = line.character_states?.length
            ? line.character_states
            : line.character
                ? [{
                    character_id: line.character.id,
                    action: line.speaker_visible === false ? 'hide' : 'show',
                    position: line.image_position?.position,
                    expression: line.expression,
                    outfit: line.outfit,
                }]
                : [];

        const out: string[] = [];
        for (const state of states) {
            const char = charById.get(state.character_id);
            const tag = charNames.get(state.character_id);
            if (!char || !tag) continue;

            if (state.action === 'hide') { out.push(`hide ${tag}`); continue; }

            const expr = state.expression ? char.expressions?.find(e => e.name === state.expression) : undefined;
            const outfit = expr?.outfit || state.outfit || '';
            const exprAttr = state.expression ? ident(state.expression, 'expr') : '';
            const outfitAttr = outfit ? ident(outfit, 'outfit') : '';
            const candidates = [[outfitAttr, exprAttr], [exprAttr], [outfitAttr]]
                .map(a => a.filter(Boolean))
                .filter(a => a.length > 0)
                .map(a => [tag, ...a].join(' '));
            const image = candidates.find(c => knownImages.has(c));

            if (!image) {
                // Only worth a warning if the line actually asked for a specific look.
                if (state.expression || state.outfit) skippedVisuals++;
                continue;
            }

            const at = state.position && state.position !== 'custom' ? ` at ${state.position}` : '';
            out.push(`show ${image}${at}`);
        }
        return out;
    };

    const exportDialogue = (line: DialogueLine): string[] => {
        if (!line.text.trim()) {
            issue('warning', 'Empty dialogue line was skipped.', line.id);
            return [];
        }
        const out = exportVisuals(line);
        if (line.voice_path) out.push(`voice ${assetRef(line.voice_path, 'Voice file', line.id)}`);

        let speaker = '';
        if (line.character) {
            if (charById.has(line.character.id)) {
                speaker = `${charNames.get(line.character.id)} `;
            } else {
                issue('warning', `Speaker "${line.character.name}" is no longer in the project — exported with an inline name.`, line.id);
                speaker = `${pyStr(line.character.name.replace(/\[/g, '[['))} `;
            }
        }
        out.push(`${speaker}${pyStr(line.text)}`);
        return out;
    };

    // ── walk the timeline ──
    const blocks: Block[] = [{ label: sceneLabel, body: [] }];
    lines.forEach((line, i) => {
        if (i > 0 && jumpTargets.has(line.id)) {
            blocks.push({ label: labels.get(line.id)!, body: [] });
        }
        const current = blocks[blocks.length - 1]!;
        const stmts = isMenu(line) ? exportMenu(line) : isAction(line) ? exportAction(line) : exportDialogue(line);
        current.body.push(...stmts);
    });
    // Ren'Py would otherwise run on into whichever label follows in the file.
    blocks[blocks.length - 1]!.body.push('return');

    if (skippedVisuals > 0) {
        issue('warning', `${skippedVisuals} sprite show(s) were skipped because no matching expression/outfit image exists.`);
    }

    // Menu statements already carry their own relative indentation; every statement gets one block indent.
    const code = blocks
        .map(b => [`label ${b.label}:`, ...(b.body.length ? b.body : ['pass']).map(s => `    ${s}`)].join('\n'))
        .join('\n\n');

    const images = new Map<string, string>();
    for (const [path, name] of registry.backgroundByPath) images.set(name, path);

    return { label: sceneLabel, code, issues, images };
}

// ─── Project export ──────────────────────────────────────────────────────────

export function exportProject(input: {
    scenes: Scene[];
    characters: Character[];
    variables: StoryVariable[];
}): ProjectExport {
    const { scenes, characters, variables } = input;
    const ctx: ExportContext = { characters, variables };
    const registry = createRegistry();
    const issues: ExportIssue[] = [];

    const sceneOut = scenes.map(scene => {
        const result = exportScene(scene, ctx, registry);
        issues.push(...result.issues);
        return result;
    });

    // ── header: characters, images, variables ──
    const charNames = characterVarNames(characters);
    const header: string[] = [
        '# Generated by the Visual Novel Editor. Re-export to update; manual edits will be overwritten.',
        '',
    ];

    if (characters.length) {
        header.push('# ── Characters ──');
        for (const c of characters) {
            const color = c.color ? `, color=${pyStr(c.color)}` : '';
            header.push(`define ${charNames.get(c.id)} = Character(${pyStr(c.name)}${color})`);
        }
        header.push('');
    }

    const images = characterImages(characters, charNames);
    const bgImages = registry.backgroundByPath;
    if (images.size || bgImages.size) {
        header.push('# ── Images ──');
        for (const [name, path] of images) header.push(`image ${name} = ${pyStr(path)}`);
        for (const [path, name] of bgImages) header.push(`image ${name} = ${pyStr(path)}`);
        header.push('');
    }

    if (variables.length) {
        header.push('# ── Story variables ──');
        for (const v of variables) {
            if (!IDENT_RE.test(v.key)) {
                issues.push({ level: 'error', sceneId: '', sceneName: 'Variables', message: `"${v.key}" is not a valid variable name.` });
                continue;
            }
            header.push(`default ${v.key} = ${pyValue(v.default_value, v.type)}`);
        }
        header.push('');
    }

    const first = sceneOut[0];
    const entry = ['label start:', first ? `    jump ${first.label}` : '    return'];

    const code = [header.join('\n'), entry.join('\n'), ...sceneOut.map(s => s.code)].join('\n\n') + '\n';

    return { code, issues, hasErrors: issues.some(i => i.level === 'error') };
}