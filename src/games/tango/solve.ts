import type { TangoCell, TangoConstraint, TangoSymbol } from './types';

/**
 * Check a partial grid for violations at the given cell only (incremental).
 * Rules: max 2 identical in any run of 3; row/col counts of each symbol ≤ size/2;
 * eq/ne constraints between adjacent cells.
 */
function cellOk(
  cells: TangoCell[],
  size: number,
  i: number,
  constraintsByCell: TangoConstraint[][],
): boolean {
  const r = Math.floor(i / size);
  const c = i % size;
  const half = size / 2;
  const v = cells[i];

  // no-3-in-a-row: check every window of 3 containing i
  for (let dc = -2; dc <= 0; dc++) {
    const c0 = c + dc;
    if (c0 < 0 || c0 + 2 >= size) continue;
    const a = cells[r * size + c0];
    const b = cells[r * size + c0 + 1];
    const d = cells[r * size + c0 + 2];
    if (a !== null && a === b && b === d) return false;
  }
  for (let dr = -2; dr <= 0; dr++) {
    const r0 = r + dr;
    if (r0 < 0 || r0 + 2 >= size) continue;
    const a = cells[r0 * size + c];
    const b = cells[(r0 + 1) * size + c];
    const d = cells[(r0 + 2) * size + c];
    if (a !== null && a === b && b === d) return false;
  }

  // count limits
  let rowCount = 0;
  let colCount = 0;
  for (let k = 0; k < size; k++) {
    if (cells[r * size + k] === v) rowCount++;
    if (cells[k * size + c] === v) colCount++;
  }
  if (rowCount > half || colCount > half) return false;

  // constraints touching this cell
  for (const con of constraintsByCell[i]) {
    const va = cells[con.a];
    const vb = cells[con.b];
    if (va === null || vb === null) continue;
    if (con.kind === 'eq' && va !== vb) return false;
    if (con.kind === 'ne' && va === vb) return false;
  }
  return true;
}

export function indexConstraints(size: number, constraints: TangoConstraint[]): TangoConstraint[][] {
  const byCell: TangoConstraint[][] = Array.from({ length: size * size }, () => []);
  for (const con of constraints) {
    byCell[con.a].push(con);
    byCell[con.b].push(con);
  }
  return byCell;
}

/** Count solutions, early-exiting at `limit` (default 2). */
export function countTangoSolutions(
  size: number,
  given: TangoCell[],
  constraints: TangoConstraint[],
  limit = 2,
  out?: TangoSymbol[],
): number {
  const cells: TangoCell[] = given.slice();
  const byCell = indexConstraints(size, constraints);
  const open: number[] = [];
  for (let i = 0; i < cells.length; i++) if (cells[i] === null) open.push(i);

  // validate givens themselves
  for (let i = 0; i < cells.length; i++) {
    if (cells[i] !== null && !cellOk(cells, size, i, byCell)) return 0;
  }

  let count = 0;
  const dfs = (k: number): void => {
    if (count >= limit) return;
    if (k === open.length) {
      count++;
      if (count === 1 && out) {
        for (let i = 0; i < cells.length; i++) out[i] = cells[i] as TangoSymbol;
      }
      return;
    }
    const i = open[k];
    for (const v of [0, 1] as TangoSymbol[]) {
      cells[i] = v;
      if (cellOk(cells, size, i, byCell)) dfs(k + 1);
      cells[i] = null;
      if (count >= limit) return;
    }
  };
  dfs(0);
  return count;
}
