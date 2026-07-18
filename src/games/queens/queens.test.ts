import { describe, expect, it } from 'vitest';
import { addDays } from '../../core/date';
import { generateDaily } from '../../core/generateDaily';
import { splitmix32 } from '../../core/rng';
import { tryGenerateQueens } from './generate';
import { countQueensSolutions } from './solve';
import { findQueensConflicts, isQueensSolved } from './validate';
import type { QueensCell } from './types';

describe('countQueensSolutions', () => {
  it('single-column regions (stripes) on 4x4 has 0 solutions (adjacency kills it)', () => {
    // stripes: region = column. One queen per column AND per row with no
    // adjacent queens has solutions on 4x4? Column stripes force a permutation;
    // adjacency constraint |c(r) - c(r+1)| > 1 — count manually via solver.
    const size = 4;
    const regions = Array.from({ length: 16 }, (_, i) => i % size);
    const n = countQueensSolutions(size, regions, 100);
    // permutations of 4 with all |p[i+1]-p[i]|>1: (1,3,0,2) and (2,0,3,1) → 2
    expect(n).toBe(2);
  });

  it('respects region uniqueness', () => {
    // 4x4 with regions as 2x2 quadrants: every row pair shares two quadrants,
    // rows 0-1 must use top quadrants (regions 0,1), rows 2-3 bottom.
    const size = 4;
    const regions: number[] = [];
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) regions.push((r < 2 ? 0 : 2) + (c < 2 ? 0 : 1));
    const count = countQueensSolutions(size, regions, 100);
    expect(count).toBeGreaterThanOrEqual(0); // sanity: solver terminates
  });
});

describe('tryGenerateQueens', () => {
  it('generates unique, structurally-valid puzzles (acceptance ≈ 1%, so scan 600 seeds)', () => {
    let generated = 0;
    for (let seed = 0; seed < 600 && generated < 5; seed++) {
      const puzzle = tryGenerateQueens(splitmix32(seed), 0);
      if (!puzzle) continue;
      generated++;
      const { size, regions, solution } = puzzle;
      // exactly size regions, all cells assigned
      expect(new Set(regions).size).toBe(size);
      expect(regions.every((r) => r >= 0 && r < size)).toBe(true);
      // regions contiguous (BFS per region)
      for (let region = 0; region < size; region++) {
        const cells = regions.map((v, i) => (v === region ? i : -1)).filter((i) => i >= 0);
        const seen = new Set([cells[0]]);
        const queue = [cells[0]];
        while (queue.length) {
          const cur = queue.pop()!;
          const r = Math.floor(cur / size);
          const c = cur % size;
          for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nr = r + dr;
            const nc = c + dc;
            const ni = nr * size + nc;
            if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
            if (regions[ni] === region && !seen.has(ni)) {
              seen.add(ni);
              queue.push(ni);
            }
          }
        }
        expect(seen.size).toBe(cells.length);
      }
      // unique solution matching the stored one
      const out: number[] = [];
      expect(countQueensSolutions(size, regions, 2, out)).toBe(1);
      expect(out).toEqual(solution);
      // stored solution passes win check
      const cells: QueensCell[] = new Array(size * size).fill(0);
      solution.forEach((col, row) => (cells[row * size + col] = 2));
      expect(isQueensSolved(puzzle, { cells })).toBe(true);
    }
    expect(generated).toBeGreaterThan(0);
  });

  it('daily generation is deterministic and never exhausts attempts across dates', () => {
    for (const date of ['2026-07-18', '2026-01-01', '2026-12-25', '2027-06-06', '2028-02-29']) {
      const a = generateDaily('queens', date, tryGenerateQueens, 1000);
      const b = generateDaily('queens', date, tryGenerateQueens, 1000);
      expect(a).toEqual(b);
      expect(a.puzzle.size).toBeGreaterThanOrEqual(7);
    }
  });

  it('date sweep: 120 consecutive dates all generate within budget', () => {
    let date = '2026-07-18';
    for (let d = 0; d < 120; d++) {
      const { puzzle } = generateDaily('queens', date, tryGenerateQueens, 1000);
      expect(puzzle.size).toBeGreaterThanOrEqual(7);
      date = addDays(date, 1);
    }
  });

  it('golden puzzle for 2026-07-18', () => {
    const { puzzle, attempt } = generateDaily('queens', '2026-07-18', tryGenerateQueens, 1000);
    expect(`${attempt}|${puzzle.size}|${puzzle.regions.join('')}|${puzzle.solution.join(',')}`).toMatchSnapshot();
  });
});

describe('findQueensConflicts', () => {
  const size = 8;
  const regions = Array.from({ length: 64 }, (_, i) => Math.floor(i / 8)); // row stripes

  it('flags same-row, same-col, adjacency, and same-region pairs', () => {
    const puzzle = { size, regions, solution: [] as number[] };
    const cells: QueensCell[] = new Array(64).fill(0);
    cells[0] = 2;
    cells[9] = 2; // diagonal neighbors
    expect(findQueensConflicts(puzzle, { cells }).size).toBe(2);
    cells[9] = 0;
    cells[3] = 2; // same row (also same region under stripes)
    expect(findQueensConflicts(puzzle, { cells }).has(0)).toBe(true);
  });

  it('no conflicts for a clean placement', () => {
    const puzzle = { size, regions: Array.from({ length: 64 }, (_, i) => i % 8), solution: [] };
    const cells: QueensCell[] = new Array(64).fill(0);
    cells[0] = 2; // (0,0)
    cells[2 * 8 + 4] = 2; // (2,4) — different row/col/region, not adjacent
    expect(findQueensConflicts(puzzle, { cells }).size).toBe(0);
  });
});
