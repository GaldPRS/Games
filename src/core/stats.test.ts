import { beforeEach, describe, expect, it } from 'vitest';
import { KEYS, storageRemove } from './storage';
import { getStats, recordCompletion } from './stats';
import { todayKey } from './date';

// storage.ts falls back to an in-memory map in Node — reset between tests
beforeEach(() => storageRemove(KEYS.stats('testgame')));

describe('recordCompletion', () => {
  it('sets best time on hint-free solves only', () => {
    recordCompletion('testgame', todayKey(), 60_000, 0);
    expect(getStats('testgame').bestMs).toBe(60_000);
    recordCompletion('testgame', todayKey(), 30_000, 2); // faster but hinted
    expect(getStats('testgame').bestMs).toBe(60_000);
    recordCompletion('testgame', todayKey(), 45_000, 0);
    expect(getStats('testgame').bestMs).toBe(45_000);
  });

  it('still counts completions and totals for hinted solves', () => {
    recordCompletion('testgame', todayKey(), 60_000, 3);
    const s = getStats('testgame');
    expect(s.completed).toBe(1);
    expect(s.totalMs).toBe(60_000);
    expect(s.bestMs).toBeNull();
  });

  it('streak advances once per day regardless of hints', () => {
    recordCompletion('testgame', todayKey(), 60_000, 1);
    expect(getStats('testgame').currentStreak).toBe(1);
    recordCompletion('testgame', todayKey(), 50_000, 0); // same-day again
    expect(getStats('testgame').currentStreak).toBe(1);
  });
});
