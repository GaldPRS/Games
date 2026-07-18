import type { ZipPuzzle, ZipWall } from './types';

export type ZipSolveResult = 0 | 1 | 2 | 'budget';

/** neighbors[i] = orthogonal neighbors of i with walls removed (fixed N/E/S/W order). */
export function buildAdjacency(size: number, walls: ZipWall[]): number[][] {
  const blocked = new Set(walls.map((w) => `${Math.min(w.a, w.b)}:${Math.max(w.a, w.b)}`));
  const isBlocked = (a: number, b: number) =>
    blocked.has(`${Math.min(a, b)}:${Math.max(a, b)}`);
  const adj: number[][] = [];
  for (let i = 0; i < size * size; i++) {
    const r = Math.floor(i / size);
    const c = i % size;
    const out: number[] = [];
    if (r > 0 && !isBlocked(i, i - size)) out.push(i - size);
    if (c < size - 1 && !isBlocked(i, i + 1)) out.push(i + 1);
    if (r < size - 1 && !isBlocked(i, i + size)) out.push(i + size);
    if (c > 0 && !isBlocked(i, i - 1)) out.push(i - 1);
    adj.push(out);
  }
  return adj;
}

/**
 * Count Hamiltonian paths that start at waypoint 1, visit waypoints in
 * ascending order, cover every cell, and end on the final waypoint.
 * Early-exits at `limit` solutions. All cutoffs are node-COUNTED (never
 * timed) so results are identical on every device.
 */
export function countZipSolutions(
  puzzle: Pick<ZipPuzzle, 'size' | 'waypoints' | 'walls'>,
  limit = 2,
  nodeBudget = 500_000,
  out?: number[],
  outSecond?: number[],
): ZipSolveResult {
  const { size, waypoints, walls } = puzzle;
  const n = size * size;
  const adj = buildAdjacency(size, walls);
  const waypointIndex = new Int16Array(n).fill(-1); // cell -> waypoint ordinal (0-based)
  waypoints.forEach((cell, k) => (waypointIndex[cell] = k));
  const lastWaypoint = waypoints[waypoints.length - 1];

  const visited = new Uint8Array(n);
  const path: number[] = [];
  const reach = new Uint8Array(n); // scratch for flood fill
  const stack = new Int16Array(n);
  let count = 0;
  let nodes = 0;
  let blown = false;

  /** All unvisited cells reachable from head's unvisited neighbors, and goal reachable? */
  const connectivityOk = (head: number, visitedCount: number): boolean => {
    reach.fill(0);
    let top = 0;
    for (const nb of adj[head]) {
      if (!visited[nb] && !reach[nb]) {
        reach[nb] = 1;
        stack[top++] = nb;
      }
    }
    let seen = top;
    if (visitedCount < n && top === 0) return false;
    while (top > 0) {
      const cur = stack[--top];
      for (const nb of adj[cur]) {
        if (!visited[nb] && !reach[nb]) {
          reach[nb] = 1;
          stack[top++] = nb;
          seen++;
        }
      }
    }
    if (seen !== n - visitedCount) return false; // some unvisited cell is cut off
    // degree pruning: any unvisited cell (other than the goal) with fewer than
    // 2 available exits (unvisited or head) is a dead end the path can't thread
    for (let i = 0; i < n; i++) {
      if (visited[i] || i === lastWaypoint) continue;
      let deg = 0;
      for (const nb of adj[i]) if (!visited[nb] || nb === head) deg++;
      if (deg < 2) return false;
    }
    return true;
  };

  const dfs = (head: number, visitedCount: number, nextWp: number): void => {
    if (count >= limit || blown) return;
    if (++nodes > nodeBudget) {
      blown = true;
      return;
    }
    if (visitedCount === n) {
      // path complete; waypoint ordering enforced en route, and the final
      // waypoint is only enterable as the last cell (checked below)
      count++;
      if (count === 1 && out) {
        out.length = 0;
        out.push(...path);
      }
      if (count === 2 && outSecond) {
        outSecond.length = 0;
        outSecond.push(...path);
      }
      return;
    }
    if (!connectivityOk(head, visitedCount)) return;
    for (const nb of adj[head]) {
      if (visited[nb]) continue;
      const wp = waypointIndex[nb];
      if (wp !== -1) {
        if (wp !== nextWp) continue; // out of order
        if (nb === lastWaypoint && visitedCount !== n - 1) continue; // must be final cell
      }
      visited[nb] = 1;
      path.push(nb);
      dfs(nb, visitedCount + 1, wp !== -1 ? nextWp + 1 : nextWp);
      visited[nb] = 0;
      path.pop();
      if (count >= limit || blown) return;
    }
  };

  const start = waypoints[0];
  visited[start] = 1;
  path.push(start);
  dfs(start, 1, 1);

  if (blown) return 'budget';
  return Math.min(count, 2) as 0 | 1 | 2;
}
