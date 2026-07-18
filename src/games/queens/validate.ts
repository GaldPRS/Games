import { kingNeighbors } from '../../core/grid';
import type { QueensPuzzle, QueensState } from './types';

/** Cells participating in any rule violation (for red highlighting). */
export function findQueensConflicts(puzzle: QueensPuzzle, state: QueensState): Set<number> {
  const { size, regions } = puzzle;
  const conflicts = new Set<number>();
  const queenCells: number[] = [];
  state.cells.forEach((v, i) => {
    if (v === 2) queenCells.push(i);
  });

  const byRow = new Map<number, number[]>();
  const byCol = new Map<number, number[]>();
  const byRegion = new Map<number, number[]>();
  for (const i of queenCells) {
    const r = Math.floor(i / size);
    const c = i % size;
    (byRow.get(r) ?? byRow.set(r, []).get(r)!).push(i);
    (byCol.get(c) ?? byCol.set(c, []).get(c)!).push(i);
    (byRegion.get(regions[i]) ?? byRegion.set(regions[i], []).get(regions[i])!).push(i);
  }
  for (const group of [...byRow.values(), ...byCol.values(), ...byRegion.values()]) {
    if (group.length > 1) group.forEach((i) => conflicts.add(i));
  }
  for (const i of queenCells) {
    for (const nb of kingNeighbors(i, size)) {
      if (state.cells[nb] === 2) {
        conflicts.add(i);
        conflicts.add(nb);
      }
    }
  }
  return conflicts;
}

export function isQueensSolved(puzzle: QueensPuzzle, state: QueensState): boolean {
  const queenCount = state.cells.filter((v) => v === 2).length;
  return queenCount === puzzle.size && findQueensConflicts(puzzle, state).size === 0;
}
