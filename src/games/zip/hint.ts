import type { ZipPuzzle, ZipState } from './types';

const EXTEND_BY = 3;

/**
 * One correct move: truncate the drawn path to its longest prefix that
 * matches the solution (undoing any divergence), then extend along the
 * solution by up to EXTEND_BY cells.
 */
export function applyZipHint(puzzle: ZipPuzzle, state: ZipState): ZipState | null {
  const { solution } = puzzle;
  let prefix = 0;
  while (
    prefix < state.path.length &&
    prefix < solution.length &&
    state.path[prefix] === solution[prefix]
  ) {
    prefix++;
  }
  if (prefix === solution.length) return null; // solved
  return { path: solution.slice(0, Math.min(solution.length, prefix + EXTEND_BY)) };
}
