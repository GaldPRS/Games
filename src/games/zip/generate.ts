import { nextInt, shuffle, type Rng } from '../../core/rng';
import { countZipSolutions } from './solve';
import type { ZipPuzzle, ZipWall } from './types';

/**
 * Random Hamiltonian path via backtracking DFS with Warnsdorff ordering
 * (fewest-onward-moves first, random tie-break) and a counted node budget.
 * Warnsdorff makes small-grid Hamiltonian paths near-certain and fast.
 */
function randomHamiltonianPath(rng: Rng, size: number): number[] | null {
  const n = size * size;
  const visited = new Uint8Array(n);
  const path: number[] = [];
  let nodes = 0;

  const neighbors = (i: number): number[] => {
    const r = Math.floor(i / size);
    const c = i % size;
    const out: number[] = [];
    if (r > 0) out.push(i - size);
    if (c < size - 1) out.push(i + 1);
    if (r < size - 1) out.push(i + size);
    if (c > 0) out.push(i - 1);
    return out;
  };
  const onwardDegree = (i: number): number => {
    let d = 0;
    for (const nb of neighbors(i)) if (!visited[nb]) d++;
    return d;
  };

  const dfs = (head: number): boolean => {
    if (++nodes > 50_000) return false;
    if (path.length === n) return true;
    const cand = shuffle(
      rng,
      neighbors(head).filter((nb) => !visited[nb]),
    );
    cand.sort((a, b) => onwardDegree(a) - onwardDegree(b)); // stable: keeps rng tie-break
    for (const nb of cand) {
      visited[nb] = 1;
      path.push(nb);
      if (dfs(nb)) return true;
      visited[nb] = 0;
      path.pop();
    }
    return false;
  };

  const start = nextInt(rng, n);
  visited[start] = 1;
  path.push(start);
  return dfs(start) ? path : null;
}

/** Waypoints at jitter-even positions along the path; first/last always included. */
function pickWaypoints(rng: Rng, path: number[], k: number): number[] {
  const n = path.length;
  const positions = new Set<number>([0, n - 1]);
  const inner = k - 2;
  for (let i = 0; i < inner; i++) {
    const lo = Math.floor(((i + 1) * n) / (inner + 2));
    const hi = Math.floor(((i + 2) * n) / (inner + 2));
    positions.add(Math.min(n - 2, Math.max(1, lo + nextInt(rng, Math.max(1, hi - lo)))));
  }
  return [...positions].sort((a, b) => a - b).map((p) => path[p]);
}

export function tryGenerateZip(rng: Rng, attempt: number): ZipPuzzle | null {
  // deterministic relaxation ladder
  const size = attempt < 100 ? 7 : 6;
  const baseWaypoints = attempt < 50 ? (size === 7 ? 7 : 6) : size === 7 ? 9 : 8;
  const maxWaypoints = 12;
  const maxWalls = 8;

  const path = randomHamiltonianPath(rng, size);
  if (!path) return null;
  const posOf = new Map(path.map((cell, p) => [cell, p]));

  // Edges used by the intended solution (walls must never cut the solution).
  const usedEdges = new Set<string>();
  for (let i = 1; i < path.length; i++) {
    const a = Math.min(path[i - 1], path[i]);
    const b = Math.max(path[i - 1], path[i]);
    usedEdges.add(`${a}:${b}`);
  }

  let waypoints = pickWaypoints(rng, path, baseWaypoints);
  const walls: ZipWall[] = [];

  const addWaypoint = (cell: number): boolean => {
    if (waypoints.includes(cell) || waypoints.length >= maxWaypoints) return false;
    waypoints = [...waypoints, cell].sort((a, b) => posOf.get(a)! - posOf.get(b)!);
    return true;
  };

  for (let round = 0; round < 40; round++) {
    const first: number[] = [];
    const second: number[] = [];
    const result = countZipSolutions({ size, waypoints, walls }, 2, 500_000, first, second);
    if (result === 'budget' || result === 0) return null;
    if (result === 1) return { size, waypoints, walls, solution: path };

    // Two solutions found: the intended path always satisfies the clues, so
    // at least one of them is "the other". Place the next clue exactly where
    // it diverges from the intended path.
    const differs = (s: number[]) => s.some((c, i) => c !== path[i]);
    const other = differs(first) ? first : differs(second) ? second : null;
    if (!other) return null; // defensive; cannot happen

    let d = 0;
    while (other[d] === path[d]) d++;
    // Preferred: wall the edge the divergent solution takes (if unused by ours).
    const wa = Math.min(other[d - 1], other[d]);
    const wb = Math.max(other[d - 1], other[d]);
    if (!usedEdges.has(`${wa}:${wb}`) && walls.length < maxWalls) {
      walls.push({ a: wa, b: wb });
      continue;
    }
    // Else pin the intended cell at the divergence as a waypoint.
    if (addWaypoint(path[d])) continue;
    // Last resort: waypoint the divergent solution's cell (forces its order).
    if (addWaypoint(other[d])) continue;
    return null; // clue caps reached, still ambiguous
  }
  return null;
}
