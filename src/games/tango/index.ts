import type { GameDefinition } from '../types';
import { TangoBoard } from './TangoGame';
import { tryGenerateTango } from './generate';
import { applyTangoHint } from './hint';
import type { TangoPuzzle, TangoState } from './types';
import { isTangoSolved } from './validate';

export const FIRST_DATE = '2026-07-18';

export const tangoGame: GameDefinition<TangoPuzzle, TangoState> = {
  id: 'tango',
  name: 'Tango',
  tagline: 'Balance sun and moon',
  color: '#f4a825',
  rules: [
    'Fill the grid so every cell contains a sun or a moon.',
    'Each row and column has an equal number of suns and moons.',
    'No more than two of the same symbol may touch in a row or column.',
    'Cells joined by = must match; cells joined by × must differ.',
    'Pre-filled cells are locked. Tap a cell to cycle sun → moon → empty.',
  ],
  firstDate: FIRST_DATE,
  tryGenerate: tryGenerateTango,
  createInitialState: (puzzle) => ({ cells: puzzle.given.slice() }),
  isSolved: isTangoSolved,
  applyHint: applyTangoHint,
  Board: TangoBoard,
  shareGrid: (puzzle, state) => {
    const rows: string[] = [];
    for (let r = 0; r < puzzle.size; r++) {
      let row = '';
      for (let c = 0; c < puzzle.size; c++) {
        row += state.cells[r * puzzle.size + c] === 0 ? '🟡' : '🟣';
      }
      rows.push(row);
    }
    return rows.join('\n');
  },
};
