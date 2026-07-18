import { describe, expect, it } from 'vitest';
import { addDays, compareDateKeys, isValidDateKey, parseDateKey, puzzleNumber, toDateKey } from './date';

describe('date keys', () => {
  it('round-trips and validates', () => {
    expect(toDateKey(parseDateKey('2026-07-18'))).toBe('2026-07-18');
    expect(isValidDateKey('2026-07-18')).toBe(true);
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('garbage')).toBe(false);
  });

  it('addDays crosses month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
  });

  it('puzzleNumber is 1-based and DST-safe', () => {
    expect(puzzleNumber('2026-07-18', '2026-07-18')).toBe(1);
    expect(puzzleNumber('2026-07-18', '2026-07-19')).toBe(2);
    expect(puzzleNumber('2026-01-01', '2026-12-31')).toBe(365);
  });

  it('compares lexicographically', () => {
    expect(compareDateKeys('2026-07-18', '2026-07-19')).toBe(-1);
    expect(compareDateKeys('2026-07-19', '2026-07-18')).toBe(1);
    expect(compareDateKeys('2026-07-18', '2026-07-18')).toBe(0);
  });
});
