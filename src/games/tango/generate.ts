import { shuffle, type Rng } from '../../core/rng';
import { countTangoSolutions } from './solve';
import type { TangoCell, TangoConstraint, TangoPuzzle, TangoSymbol } from './types';

const SIZE = 6;

/** Build a complete valid grid by randomized backtracking. */
function fullGrid(rng: Rng): TangoSymbol[] | null {
  const n = SIZE * SIZE;
  const cells: TangoCell[] = new Array(n).fill(null);
  const half = SIZE / 2;

  const ok = (i: number): boolean => {
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    const v = cells[i];
    if (c >= 2 && cells[i - 1] === v && cells[i - 2] === v) return false;
    if (r >= 2 && cells[i - SIZE] === v && cells[i - 2 * SIZE] === v) return false;
    let rowCount = 0;
    let colCount = 0;
    for (let k = 0; k <= c; k++) if (cells[r * SIZE + k] === v) rowCount++;
    for (let k = 0; k <= r; k++) if (cells[k * SIZE + c] === v) colCount++;
    return rowCount <= half && colCount <= half;
  };

  let nodes = 0;
  const dfs = (i: number): boolean => {
    if (++nodes > 20000) return false; // deterministic budget; burn the attempt
    if (i === n) return true;
    const order = shuffle(rng, [0, 1] as TangoSymbol[]);
    for (const v of order) {
      cells[i] = v;
      if (ok(i) && dfs(i + 1)) return true;
      cells[i] = null;
    }
    return false;
  };
  return dfs(0) ? (cells as TangoSymbol[]) : null;
}

interface Clue {
  type: 'given' | 'constraint';
  cell?: number;
  constraint?: TangoConstraint;
}

export function tryGenerateTango(rng: Rng, _attempt: number): TangoPuzzle | null {
  const solution = fullGrid(rng);
  if (!solution) return null;
  const n = SIZE * SIZE;

  // Candidate clues: every cell as a given, every adjacent pair as eq/ne.
  const candidates: Clue[] = [];
  for (let i = 0; i < n; i++) candidates.push({ type: 'given', cell: i });
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    for (const j of [c < SIZE - 1 ? i + 1 : -1, r < SIZE - 1 ? i + SIZE : -1]) {
      if (j < 0) continue;
      candidates.push({
        type: 'constraint',
        constraint: { a: i, b: j, kind: solution[i] === solution[j] ? 'eq' : 'ne' },
      });
    }
  }
  shuffle(rng, candidates);

  const given: TangoCell[] = new Array(n).fill(null);
  const constraints: TangoConstraint[] = [];
  const active: Clue[] = [];

  const apply = (clue: Clue) => {
    if (clue.type === 'given') given[clue.cell!] = solution[clue.cell!];
    else constraints.push(clue.constraint!);
    active.push(clue);
  };
  const unapply = (clue: Clue) => {
    if (clue.type === 'given') given[clue.cell!] = null;
    else constraints.splice(constraints.indexOf(clue.constraint!), 1);
    active.splice(active.indexOf(clue), 1);
  };

  // Seed with a small starter set, then add until unique.
  let ci = 0;
  for (; ci < 8; ci++) apply(candidates[ci]);
  while (countTangoSolutions(SIZE, given, constraints) > 1) {
    if (ci >= candidates.length) return null;
    apply(candidates[ci++]);
  }

  // Minimize: drop clues that aren't needed for uniqueness.
  for (const clue of shuffle(rng, active.slice())) {
    unapply(clue);
    if (countTangoSolutions(SIZE, given, constraints) !== 1) apply(clue);
  }

  // Difficulty band: reject degenerate results and let the attempt loop resample.
  const givenCount = given.filter((v) => v !== null).length;
  if (givenCount < 2 || givenCount > 8) return null;
  if (constraints.length < 2 || constraints.length > 9) return null;

  return { size: SIZE, given, constraints, solution };
}
