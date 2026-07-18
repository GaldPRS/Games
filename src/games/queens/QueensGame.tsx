import { useMemo } from 'react';
import type { GameBoardProps } from '../types';
import type { QueensPuzzle, QueensState } from './types';
import { findQueensConflicts } from './validate';
import styles from './queens.module.css';

// Distinguishable region palette that works in both themes (up to 9 regions).
const REGION_COLORS = [
  '#b9a7f5',
  '#f5c07a',
  '#8fc7f0',
  '#9fd8a4',
  '#f2ec9a',
  '#f0958f',
  '#cba07a',
  '#d7dbe0',
  '#a8b5a0',
];

export function QueensBoard({ puzzle, state, onChange, locked }: GameBoardProps<QueensPuzzle, QueensState>) {
  const { size, regions } = puzzle;
  const conflicts = useMemo(() => findQueensConflicts(puzzle, state), [puzzle, state]);

  const tap = (i: number) => {
    if (locked) return;
    const cells = state.cells.slice();
    cells[i] = ((cells[i] + 1) % 3) as QueensState['cells'][number];
    onChange({ cells });
  };

  // thicker borders on region boundaries
  const borderFor = (i: number): React.CSSProperties => {
    const r = Math.floor(i / size);
    const c = i % size;
    const line = 'var(--board-line)';
    const s: React.CSSProperties = {};
    if (c === size - 1 || regions[i] !== regions[i + 1]) s.borderRight = `2px solid ${line}`;
    if (r === size - 1 || regions[i] !== regions[i + size]) s.borderBottom = `2px solid ${line}`;
    return s;
  };

  return (
    <div
      className={styles.board}
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      role="grid"
      aria-label="Queens board"
    >
      {state.cells.map((v, i) => (
        <button
          key={i}
          role="gridcell"
          aria-label={`cell ${i}`}
          className={[styles.cell, conflicts.has(i) ? styles.error : ''].join(' ')}
          style={{ background: REGION_COLORS[regions[i] % 9], ...borderFor(i) }}
          onClick={() => tap(i)}
        >
          {v === 1 && <span className={styles.mark}>✕</span>}
          {v === 2 && <span className={styles.queen}>👑</span>}
        </button>
      ))}
    </div>
  );
}
