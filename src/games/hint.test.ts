import { describe, expect, it } from 'vitest';
import { generateDaily } from '../core/generateDaily';
import { tryGenerateQueens } from './queens/generate';
import { applyQueensHint } from './queens/hint';
import type { QueensPuzzle, QueensState } from './queens/types';
import { isQueensSolved } from './queens/validate';
import { tryGenerateTango } from './tango/generate';
import { applyTangoHint } from './tango/hint';
import type { TangoPuzzle, TangoState } from './tango/types';
import { isTangoSolved } from './tango/validate';
import { tryGenerateZip } from './zip/generate';
import { applyZipHint } from './zip/hint';
import type { ZipPuzzle, ZipState } from './zip/types';
import { isZipSolved } from './zip/validate';

const DATES = ['2026-07-18', '2026-08-01'];

describe('applyQueensHint', () => {
  const puzzles = DATES.map(
    (d) => generateDaily<QueensPuzzle>('queens', d, tryGenerateQueens, 1000).puzzle,
  );

  it('hints alone solve the puzzle, then return null', () => {
    for (const puzzle of puzzles) {
      let state: QueensState = { cells: new Array(puzzle.size * puzzle.size).fill(0) };
      let steps = 0;
      while (!isQueensSolved(puzzle, state)) {
        const next = applyQueensHint(puzzle, state);
        expect(next).not.toBeNull();
        state = next!;
        expect(++steps).toBeLessThanOrEqual(puzzle.size * puzzle.size);
      }
      expect(applyQueensHint(puzzle, state)).toBeNull();
    }
  });

  it('removes a misplaced queen before placing new ones', () => {
    const puzzle = puzzles[0];
    const wrongCol = (puzzle.solution[0] + 2) % puzzle.size;
    const cells = new Array(puzzle.size * puzzle.size).fill(0);
    cells[wrongCol] = 2; // wrong queen in row 0
    const next = applyQueensHint(puzzle, { cells })!;
    expect(next.cells[wrongCol]).toBe(0);
    expect(next.cells.filter((c) => c === 2).length).toBe(0);
  });
});

describe('applyTangoHint', () => {
  const puzzles = DATES.map(
    (d) => generateDaily<TangoPuzzle>('tango', d, tryGenerateTango).puzzle,
  );

  it('hints alone solve the puzzle, then return null', () => {
    for (const puzzle of puzzles) {
      let state: TangoState = { cells: puzzle.given.slice() };
      let steps = 0;
      while (!isTangoSolved(puzzle, state)) {
        const next = applyTangoHint(puzzle, state);
        expect(next).not.toBeNull();
        state = next!;
        expect(++steps).toBeLessThanOrEqual(36);
      }
      expect(applyTangoHint(puzzle, state)).toBeNull();
    }
  });

  it('fixes a wrong cell before filling empties', () => {
    const puzzle = puzzles[0];
    const i = puzzle.given.findIndex((g) => g === null);
    const cells = puzzle.given.slice();
    cells[i] = puzzle.solution[i] === 0 ? 1 : 0; // deliberately wrong
    const next = applyTangoHint(puzzle, { cells })!;
    expect(next.cells[i]).toBe(puzzle.solution[i]);
  });
});

describe('applyZipHint', () => {
  const puzzles = DATES.map((d) => generateDaily<ZipPuzzle>('zip', d, tryGenerateZip).puzzle);

  it('hints alone solve the puzzle, then return null', () => {
    for (const puzzle of puzzles) {
      let state: ZipState = { path: [puzzle.waypoints[0]] };
      let steps = 0;
      while (!isZipSolved(puzzle, state)) {
        const next = applyZipHint(puzzle, state);
        expect(next).not.toBeNull();
        state = next!;
        expect(++steps).toBeLessThanOrEqual(puzzle.size * puzzle.size);
      }
      expect(applyZipHint(puzzle, state)).toBeNull();
    }
  });

  it('truncates a diverged path back to the solution', () => {
    const puzzle = puzzles[0];
    const sol = puzzle.solution;
    // walk 2 correct cells, then a wrong-but-adjacent cell if one exists
    const path = sol.slice(0, 2);
    const next = applyZipHint(puzzle, { path: [...path, ...path] /* garbage tail */ })!;
    // result must be a strict prefix of the solution, longer than the valid prefix
    expect(next.path.length).toBeGreaterThan(2);
    next.path.forEach((cell, k) => expect(cell).toBe(sol[k]));
  });
});
