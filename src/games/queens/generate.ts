import { nextInt, shuffle, type Rng } from '../../core/rng';
import { orthoNeighbors } from '../../core/grid';
import { countQueensSolutions } from './solve';
import type { QueensPuzzle } from './types';

/** Place one queen per row/col with no adjacency between consecutive rows. */
function placeQueens(rng: Rng, size: number): number[] | null {
  const cols: number[] = [];
  let nodes = 0;
  const dfs = (row: number, used: number): boolean => {
    if (++nodes > 5000) return false;
    if (row === size) return true;
    const prev = row > 0 ? cols[row - 1] : -99;
    for (const c of shuffle(rng, Array.from({ length: size }, (_, i) => i))) {
      if (used & (1 << c)) continue;
      if (Math.abs(c - prev) <= 1) continue;
      cols.push(c);
      if (dfs(row + 1, used | (1 << c))) return true;
      cols.pop();
    }
    return false;
  };
  return dfs(0, 0) ? cols : null;
}

/**
 * Grow contiguous regions from the queen cells via weighted randomized
 * multi-source flood fill. Each region gets a growth weight so sizes vary.
 */
function growRegions(rng: Rng, size: number, queens: number[]): number[] {
  const n = size * size;
  const regions = new Array<number>(n).fill(-1);
  const weights = queens.map(() => 1 + nextInt(rng, 4));
  // frontier entries: cell to claim, region claiming it (weighted duplicates)
  let frontier: { cell: number; region: number }[] = [];

  const pushNeighbors = (cell: number, region: number) => {
    for (const nb of orthoNeighbors(cell, size)) {
      if (regions[nb] === -1) {
        for (let w = 0; w < weights[region]; w++) frontier.push({ cell: nb, region });
      }
    }
  };

  queens.forEach((col, row) => {
    const cell = row * size + col;
    regions[cell] = row;
  });
  queens.forEach((col, row) => pushNeighbors(row * size + col, row));

  let assigned = size;
  while (assigned < n) {
    if (frontier.length === 0) {
      // stale-only frontier (all entries claimed): rebuild from region boundary
      for (let i = 0; i < n; i++) {
        if (regions[i] !== -1) pushNeighbors(i, regions[i]);
      }
      if (frontier.length === 0) break; // unreachable on a connected grid
      continue;
    }
    const k = nextInt(rng, frontier.length);
    const { cell, region } = frontier[k];
    frontier[k] = frontier[frontier.length - 1];
    frontier.pop();
    if (regions[cell] !== -1) continue; // already claimed; stale entry
    regions[cell] = region;
    assigned++;
    pushNeighbors(cell, region);
    // periodically drop stale entries to keep the frontier bounded
    if (frontier.length > n * 8) frontier = frontier.filter((f) => regions[f.cell] === -1);
  }
  return regions;
}

export function tryGenerateQueens(rng: Rng, attempt: number): QueensPuzzle | null {
  const size = attempt < 600 ? 8 : 7; // deterministic relaxation ladder
  const queens = placeQueens(rng, size);
  if (!queens) return null;
  const regions = growRegions(rng, size, queens);
  if (regions.includes(-1)) return null;
  if (countQueensSolutions(size, regions) !== 1) return null;
  return { size, regions, solution: queens };
}
