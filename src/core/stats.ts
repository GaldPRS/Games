import { addDays, todayKey } from './date';
import { KEYS, storageGet, storageSet } from './storage';

export interface GameStats {
  completed: number;
  currentStreak: number;
  maxStreak: number;
  lastCompletedDate: string | null; // last date whose own-day puzzle was solved
  bestMs: number | null;
  totalMs: number;
}

const EMPTY: GameStats = {
  completed: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastCompletedDate: null,
  bestMs: null,
  totalMs: 0,
};

export function getStats(gameId: string): GameStats {
  return storageGet<GameStats>(KEYS.stats(gameId)) ?? { ...EMPTY };
}

/**
 * Record a completed puzzle. Streaks only advance when the puzzle is solved
 * on its own date — archive replays count toward totals but not streaks.
 */
export function recordCompletion(gameId: string, dateKey: string, elapsedMs: number): GameStats {
  const stats = getStats(gameId);
  stats.completed += 1;
  stats.totalMs += elapsedMs;
  if (stats.bestMs === null || elapsedMs < stats.bestMs) stats.bestMs = elapsedMs;

  const isToday = dateKey === todayKey();
  if (isToday && stats.lastCompletedDate !== dateKey) {
    stats.currentStreak =
      stats.lastCompletedDate === addDays(dateKey, -1) ? stats.currentStreak + 1 : 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.lastCompletedDate = dateKey;
  }
  storageSet(KEYS.stats(gameId), stats);
  return stats;
}

/** Current streak display: broken if the chain doesn't reach yesterday/today. */
export function effectiveStreak(stats: GameStats): number {
  if (!stats.lastCompletedDate) return 0;
  const today = todayKey();
  if (stats.lastCompletedDate === today || stats.lastCompletedDate === addDays(today, -1)) {
    return stats.currentStreak;
  }
  return 0;
}
