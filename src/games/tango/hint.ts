import type { TangoPuzzle, TangoState } from './types';

/**
 * One correct move: fix the first wrong non-given cell in reading order,
 * else fill the first empty cell with its solution symbol.
 */
export function applyTangoHint(puzzle: TangoPuzzle, state: TangoState): TangoState | null {
  const { given, solution } = puzzle;
  for (let i = 0; i < state.cells.length; i++) {
    if (given[i] !== null) continue;
    if (state.cells[i] !== null && state.cells[i] !== solution[i]) {
      const cells = state.cells.slice();
      cells[i] = solution[i];
      return { cells };
    }
  }
  for (let i = 0; i < state.cells.length; i++) {
    if (given[i] === null && state.cells[i] === null) {
      const cells = state.cells.slice();
      cells[i] = solution[i];
      return { cells };
    }
  }
  return null;
}
