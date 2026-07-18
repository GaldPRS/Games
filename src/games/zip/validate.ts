import { buildAdjacency } from './solve';
import type { ZipPuzzle, ZipState } from './types';

export function isZipSolved(puzzle: ZipPuzzle, state: ZipState): boolean {
  const { size, waypoints, walls } = puzzle;
  const n = size * size;
  const { path } = state;
  if (path.length !== n) return false;
  if (path[0] !== waypoints[0]) return false;
  if (path[n - 1] !== waypoints[waypoints.length - 1]) return false;

  const adj = buildAdjacency(size, walls);
  const seen = new Set<number>();
  let nextWp = 0;
  for (let i = 0; i < n; i++) {
    const cell = path[i];
    if (seen.has(cell)) return false;
    seen.add(cell);
    if (i > 0 && !adj[path[i - 1]].includes(cell)) return false;
    const wp = waypoints.indexOf(cell);
    if (wp !== -1) {
      if (wp !== nextWp) return false;
      nextWp++;
    }
  }
  return nextWp === waypoints.length;
}

/** Can the path be extended from its head to `cell`? (Used by drag logic.) */
export function canExtend(puzzle: ZipPuzzle, state: ZipState, cell: number): boolean {
  const { path } = state;
  if (path.length === 0) return cell === puzzle.waypoints[0];
  if (path.includes(cell)) return false;
  const head = path[path.length - 1];
  const adj = buildAdjacency(puzzle.size, puzzle.walls);
  if (!adj[head].includes(cell)) return false;
  // waypoint ordering
  const wp = puzzle.waypoints.indexOf(cell);
  if (wp !== -1) {
    let visited = 0;
    for (const c of path) if (puzzle.waypoints.includes(c)) visited++;
    if (wp !== visited) return false;
    const isLast = wp === puzzle.waypoints.length - 1;
    if (isLast && path.length !== puzzle.size * puzzle.size - 1) return false;
  }
  return true;
}
