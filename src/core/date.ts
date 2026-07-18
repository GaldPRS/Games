/**
 * Date keys are YYYY-MM-DD in the user's LOCAL timezone — the puzzle flips
 * at local midnight, matching the NYT/LinkedIn convention.
 */

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = parseDateKey(key);
  return toDateKey(d) === key;
}

/** Parse a dateKey to a local-midnight Date. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

/** Puzzle number: 1-based count of days since the game's firstDate. */
export function puzzleNumber(firstDate: string, dateKey: string): number {
  const ms = parseDateKey(dateKey).getTime() - parseDateKey(firstDate).getTime();
  return Math.round(ms / 86400000) + 1;
}

export function compareDateKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function formatDateKey(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
