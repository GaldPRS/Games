import { describe, expect, it } from 'vitest';
import { generateDaily } from '../../core/generateDaily';
import { splitmix32 } from '../../core/rng';
import { hashSeed } from '../../core/seed';
import { tryGenerateTango } from './generate';
import { countTangoSolutions } from './solve';
import { findTangoErrors, isTangoSolved } from './validate';
import type { TangoCell, TangoSymbol } from './types';

describe('countTangoSolutions', () => {
  it('empty 6x6 grid has many solutions (early exit at 2)', () => {
    const given: TangoCell[] = new Array(36).fill(null);
    expect(countTangoSolutions(6, given, [])).toBe(2);
  });

  it('a fully-given valid grid has exactly 1 solution', () => {
    const given: TangoCell[] = new Array(36).fill(null);
    const solution: TangoSymbol[] = [];
    expect(countTangoSolutions(6, given, [], 2, solution)).toBeGreaterThanOrEqual(1);
    expect(countTangoSolutions(6, solution.slice(), [])).toBe(1);
  });

  it('contradictory givens yield 0 solutions', () => {
    const given: TangoCell[] = new Array(36).fill(null);
    given[0] = 0;
    given[1] = 0;
    given[2] = 0; // three suns in a row
    expect(countTangoSolutions(6, given, [])).toBe(0);
  });

  it('constraints restrict the solution space', () => {
    const given: TangoCell[] = new Array(36).fill(null);
    given[0] = 0;
    // eq forces cell 1 = sun; contradictory ne on same pair kills it
    expect(countTangoSolutions(6, given, [{ a: 0, b: 1, kind: 'eq' }])).toBeGreaterThan(0);
    expect(
      countTangoSolutions(6, given, [
        { a: 0, b: 1, kind: 'eq' },
        { a: 0, b: 1, kind: 'ne' },
      ]),
    ).toBe(0);
  });
});

describe('tryGenerateTango', () => {
  it('generates uniquely-solvable puzzles for 60 seeds', () => {
    for (let seed = 0; seed < 60; seed++) {
      const puzzle = tryGenerateTango(splitmix32(seed), 0);
      if (!puzzle) continue; // attempt loop handles rejections
      expect(countTangoSolutions(puzzle.size, puzzle.given, puzzle.constraints)).toBe(1);
      // givens must match the stored solution
      puzzle.given.forEach((v, i) => {
        if (v !== null) expect(v).toBe(puzzle.solution[i]);
      });
      // solution must satisfy the win condition
      expect(isTangoSolved(puzzle, { cells: puzzle.solution.slice() })).toBe(true);
    }
  });

  it('daily generation succeeds and is deterministic for a spread of dates', () => {
    for (const date of ['2026-07-18', '2026-01-01', '2027-03-14', '2026-11-30']) {
      const a = generateDaily('tango', date, tryGenerateTango);
      const b = generateDaily('tango', date, tryGenerateTango);
      expect(a).toEqual(b);
    }
  });

  it('golden puzzle for 2026-07-18 (generation changes must be conscious)', () => {
    const { puzzle, attempt } = generateDaily('tango', '2026-07-18', tryGenerateTango);
    const digest = `${attempt}|${puzzle.given.map((v) => (v === null ? '.' : v)).join('')}|${puzzle.constraints
      .map((c) => `${c.a}${c.kind === 'eq' ? '=' : 'x'}${c.b}`)
      .join(',')}`;
    expect(digest).toMatchSnapshot();
    // sanity: seed derivation stable
    expect(hashSeed('2026-07-18', 'tango', 0)).toMatchSnapshot();
  });
});

describe('findTangoErrors', () => {
  it('flags triples and count overflows', () => {
    const cells: TangoCell[] = new Array(36).fill(null);
    cells[0] = 0;
    cells[1] = 0;
    cells[2] = 0;
    const errors = findTangoErrors(
      { size: 6, given: new Array(36).fill(null), constraints: [], solution: [] as TangoSymbol[] },
      { cells },
    );
    expect(errors.cells.has(0)).toBe(true);
    expect(errors.cells.has(2)).toBe(true);
  });
});
