import { describe, expect, it } from 'vitest';
import { nextInt, shuffle, splitmix32 } from './rng';
import { hashSeed } from './seed';

describe('splitmix32', () => {
  it('produces the golden sequence for seed 1 (guards against algorithm edits)', () => {
    const rng = splitmix32(1);
    const seq = Array.from({ length: 5 }, () => rng());
    // Golden values captured at implementation time; any change to the RNG
    // changes every published daily puzzle and must be a conscious decision.
    expect(seq).toMatchInlineSnapshot(`
      [
        0.3678755429573357,
        0.08161311969161034,
        0.8205357783008367,
        0.7012168897781521,
        0.14991333335638046,
      ]
    `);
  });

  it('is deterministic for equal seeds and distinct for different seeds', () => {
    const a = splitmix32(42);
    const b = splitmix32(42);
    const c = splitmix32(43);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    const seqC = Array.from({ length: 20 }, () => c());
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
  });

  it('stays in [0, 1)', () => {
    const rng = splitmix32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('nextInt / shuffle', () => {
  it('nextInt stays in range', () => {
    const rng = splitmix32(5);
    for (let i = 0; i < 1000; i++) {
      const v = nextInt(rng, 9);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(9);
    }
  });

  it('shuffle is deterministic and a permutation', () => {
    const a = shuffle(splitmix32(9), [1, 2, 3, 4, 5, 6, 7, 8]);
    const b = shuffle(splitmix32(9), [1, 2, 3, 4, 5, 6, 7, 8]);
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('hashSeed', () => {
  it('differs across date, game, and attempt', () => {
    const base = hashSeed('2026-07-18', 'queens', 0);
    expect(hashSeed('2026-07-19', 'queens', 0)).not.toBe(base);
    expect(hashSeed('2026-07-18', 'tango', 0)).not.toBe(base);
    expect(hashSeed('2026-07-18', 'queens', 1)).not.toBe(base);
  });

  it('is a stable uint32', () => {
    const h = hashSeed('2026-01-01', 'zip', 3);
    expect(h).toBe(hashSeed('2026-01-01', 'zip', 3));
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
    expect(Number.isInteger(h)).toBe(true);
  });
});
