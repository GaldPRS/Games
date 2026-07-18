import type { TangoCell, TangoConstraint, TangoPuzzle, TangoState } from './types';

export interface TangoErrors {
  /** Cell indices participating in any violation. */
  cells: Set<number>;
  /** Indices into puzzle.constraints that are violated. */
  constraints: Set<number>;
}

export function findTangoErrors(puzzle: TangoPuzzle, state: TangoState): TangoErrors {
  const { size, constraints } = puzzle;
  const cells = state.cells;
  const half = size / 2;
  const errors: TangoErrors = { cells: new Set(), constraints: new Set() };

  const runCheck = (line: number[]) => {
    for (let k = 0; k + 2 < line.length; k++) {
      const [a, b, c] = [line[k], line[k + 1], line[k + 2]];
      if (cells[a] !== null && cells[a] === cells[b] && cells[b] === cells[c]) {
        errors.cells.add(a).add(b).add(c);
      }
    }
    for (const v of [0, 1] as const) {
      if (line.filter((i) => cells[i] === v).length > half) {
        for (const i of line) if (cells[i] === v) errors.cells.add(i);
      }
    }
  };

  for (let r = 0; r < size; r++) runCheck(Array.from({ length: size }, (_, c) => r * size + c));
  for (let c = 0; c < size; c++) runCheck(Array.from({ length: size }, (_, r) => r * size + c));

  constraints.forEach((con: TangoConstraint, k: number) => {
    const va: TangoCell = cells[con.a];
    const vb: TangoCell = cells[con.b];
    if (va === null || vb === null) return;
    const bad = con.kind === 'eq' ? va !== vb : va === vb;
    if (bad) {
      errors.constraints.add(k);
      errors.cells.add(con.a).add(con.b);
    }
  });

  return errors;
}

export function isTangoSolved(puzzle: TangoPuzzle, state: TangoState): boolean {
  if (state.cells.some((c) => c === null)) return false;
  const errors = findTangoErrors(puzzle, state);
  return errors.cells.size === 0 && errors.constraints.size === 0;
}
