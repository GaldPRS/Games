/**
 * Typed localStorage wrapper. Never throws: falls back to an in-memory map
 * when storage is unavailable or full. All keys are prefixed and versioned.
 */

const memory = new Map<string, string>();

function rawGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function rawSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

function rawRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    memory.delete(key);
  }
}

export function storageGet<T>(key: string): T | null {
  const raw = rawGet(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    rawRemove(key);
    return null;
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    rawSet(key, JSON.stringify(value));
  } catch {
    // full or serialization failure — app must keep working without persistence
  }
}

export function storageRemove(key: string): void {
  rawRemove(key);
}

export function storageKeys(prefix: string): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keys.push(k);
    }
  } catch {
    for (const k of memory.keys()) if (k.startsWith(prefix)) keys.push(k);
  }
  return keys;
}

export const KEYS = {
  puzzle: (gameId: string, dateKey: string) => `dg.puzzle.v1.${gameId}.${dateKey}`,
  session: (gameId: string, dateKey: string) => `dg.session.v1.${gameId}.${dateKey}`,
  stats: (gameId: string) => `dg.stats.v1.${gameId}`,
  settings: 'dg.settings.v1',
} as const;

/** Drop cached puzzles/sessions whose dateKey (key suffix) is older than cutoff. */
export function pruneOldEntries(prefix: string, cutoffDateKey: string): void {
  for (const key of storageKeys(prefix)) {
    const dateKey = key.slice(key.length - 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey) && dateKey < cutoffDateKey) rawRemove(key);
  }
}
