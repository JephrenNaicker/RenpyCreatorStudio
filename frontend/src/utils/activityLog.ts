// frontend/src/utils/activityLog.ts
//
// Lightweight, localStorage-backed activity log.
//
// This is meant to be combined with activity *derived* from timestamps
// already on the data (Character.created_at/updated_at, Scene.created_at/
// updated_at, Project.updated_at) rather than replacing it — derived
// activity covers "what changed and when" for free from existing fields,
// while this log covers actions whose effect on the data doesn't carry a
// timestamp of its own (e.g. "added an existing character to this
// project", "removed a character and reassigned their lines").
//
// Usage from a view, right after a mutation succeeds:
//   import { logActivity, getActivityLog } from '@/utils/activityLog';
//   logActivity(project.value.id, { icon: '👤', text: `Added character "${name}" to project` });

export interface ActivityEntry {
    id: string;
    icon: string;
    text: string;
    timestamp: number; // epoch ms
}

const STORAGE_PREFIX = 'renpy_editor_activity_log_';
const MAX_ENTRIES_PER_PROJECT = 50;

const storageKey = (projectId: string) => `${STORAGE_PREFIX}${projectId}`;

/** Returns everything logged for a project, newest first. */
export const getActivityLog = (projectId: string): ActivityEntry[] => {
    if (!projectId) return [];
    try {
        const raw = localStorage.getItem(storageKey(projectId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.warn('Failed to read activity log:', err);
        return [];
    }
};

/** Appends a new entry (timestamped now) and persists it. Returns the entry, or null if it couldn't be saved. */
export const logActivity = (
    projectId: string,
    entry: { icon: string; text: string }
): ActivityEntry | null => {
    if (!projectId) return null;
    try {
        const newEntry: ActivityEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            icon: entry.icon,
            text: entry.text,
            timestamp: Date.now()
        };
        const existing = getActivityLog(projectId);
        const updated = [newEntry, ...existing].slice(0, MAX_ENTRIES_PER_PROJECT);
        localStorage.setItem(storageKey(projectId), JSON.stringify(updated));
        return newEntry;
    } catch (err) {
        console.warn('Failed to write activity log:', err);
        return null;
    }
};

/** Clears the log for a project. Exposed mainly for testing/debugging. */
export const clearActivityLog = (projectId: string): void => {
    if (!projectId) return;
    try {
        localStorage.removeItem(storageKey(projectId));
    } catch (err) {
        console.warn('Failed to clear activity log:', err);
    }
};

/** Human-friendly "2 hours ago" style formatting shared by anything that renders an ActivityEntry. */
export const formatRelativeTime = (timestamp: number): string => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec} second${diffSec !== 1 ? 's' : ''} ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;

    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;

    const diffYear = Math.floor(diffMonth / 12);
    return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
};