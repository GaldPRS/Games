import type { QueensPuzzle, QueensState } from './types';

/**
 * One correct move: remove the first misplaced queen if any (mistake fix),
 * else crown the first row still missing its solution queen.
 */
export function applyQueensHint(puzzle: QueensPuzzle, state: QueensState): QueensState | null {
  const { size, solution } = puzzle;
  for (let i = 0; i < state.cells.length; i++) {
    if (state.cells[i] !== 2) continue;
    const row = Math.floor(i / size);
    if (solution[row] !== i % size) {
      const cells = state.cells.slice();
      cells[i] = 0;
      return { cells };
    }
  }
  for (let row = 0; row < size; row++) {
    const target = row * size + solution[row];
    if (state.cells[target] !== 2) {
      const cells = state.cells.slice();
      cells[target] = 2;
      return { cells };
    }
  }
  return null; // fully solved
}
