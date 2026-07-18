import type { GameDefinition } from '../types';
import { QueensBoard } from './QueensGame';
import { tryGenerateQueens } from './generate';
import type { QueensPuzzle, QueensState } from './types';
import { isQueensSolved } from './validate';

export const QUEENS_REGION_EMOJI = ['🟪', '🟧', '🟦', '🟩', '🟨', '🟥', '🟫', '⬜', '⬛'];

export const queensGame: GameDefinition<QueensPuzzle, QueensState> = {
  id: 'queens',
  name: 'Queens',
  tagline: 'Crown every region',
  color: '#7c5cff',
  rules: [
    'Place exactly one crown in every row, column, and color region.',
    'Crowns may never touch each other — not even diagonally.',
    'Tap a cell to cycle: empty → ✕ (note) → crown.',
    'Use ✕ marks to track cells where a crown is impossible.',
  ],
  firstDate: '2026-07-18',
  maxAttempts: 1000, // acceptance ≈ 1.2%/attempt at ~0.05 ms each
  tryGenerate: tryGenerateQueens,
  createInitialState: (puzzle) => ({ cells: new Array(puzzle.size * puzzle.size).fill(0) }),
  isSolved: isQueensSolved,
  Board: QueensBoard,
  shareGrid: (puzzle, state) => {
    const rows: string[] = [];
    for (let r = 0; r < puzzle.size; r++) {
      let row = '';
      for (let c = 0; c < puzzle.size; c++) {
        const i = r * puzzle.size + c;
        row += state.cells[i] === 2 ? '👑' : QUEENS_REGION_EMOJI[puzzle.regions[i] % 9];
      }
      rows.push(row);
    }
    return rows.join('\n');
  },
};
