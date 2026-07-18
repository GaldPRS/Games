import { useMemo } from 'react';
import type { GameBoardProps } from '../types';
import type { TangoPuzzle, TangoState } from './types';
import { findTangoErrors } from './validate';
import styles from './tango.module.css';

const SUN = '☀️';
const MOON = '🌙';

export function TangoBoard({ puzzle, state, onChange, locked }: GameBoardProps<TangoPuzzle, TangoState>) {
  const { size, given, constraints } = puzzle;
  const errors = useMemo(() => findTangoErrors(puzzle, state), [puzzle, state]);

  const tap = (i: number) => {
    if (locked || given[i] !== null) return;
    const cells = state.cells.slice();
    cells[i] = cells[i] === null ? 0 : cells[i] === 0 ? 1 : null;
    onChange({ cells });
  };

  return (
    <div
      className={styles.board}
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      role="grid"
      aria-label="Tango board"
    >
      {state.cells.map((v, i) => {
        const isGiven = given[i] !== null;
        const cls = [
          styles.cell,
          isGiven ? styles.given : '',
          errors.cells.has(i) ? styles.error : '',
        ].join(' ');
        return (
          <button key={i} className={cls} onClick={() => tap(i)} aria-label={`cell ${i}`} role="gridcell">
            <span className={styles.symbol}>{v === 0 ? SUN : v === 1 ? MOON : ''}</span>
            {constraints.map((con, k) => {
              if (con.a !== i) return null;
              const horizontal = con.b === i + 1;
              const violated = errors.constraints.has(k);
              return (
                <span
                  key={k}
                  className={[
                    styles.glyph,
                    horizontal ? styles.glyphRight : styles.glyphBottom,
                    violated ? styles.glyphError : '',
                  ].join(' ')}
                >
                  {con.kind === 'eq' ? '=' : '×'}
                </span>
              );
            })}
          </button>
        );
      })}
    </div>
  );
}
