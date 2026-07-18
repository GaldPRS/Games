import type { GameDefinition } from '../types';
import { ZipBoard } from './ZipGame';
import { tryGenerateZip } from './generate';
import { applyZipHint } from './hint';
import type { ZipPuzzle, ZipState } from './types';
import { isZipSolved } from './validate';

export const zipGame: GameDefinition<ZipPuzzle, ZipState> = {
  id: 'zip',
  name: 'Zip',
  tagline: 'Connect the dots, fill the board',
  color: '#ff8b3d',
  rules: [
    'Draw one continuous line starting at 1.',
    'Hit the numbers in order — 1, 2, 3, …',
    'Fill every cell of the board; the line ends on the last number.',
    'The line cannot cross itself or pass through walls.',
    'Drag to draw. Drag back (or tap Undo) to erase.',
  ],
  firstDate: '2026-07-18',
  tryGenerate: tryGenerateZip,
  createInitialState: (puzzle) => ({ path: [puzzle.waypoints[0]] }),
  isSolved: isZipSolved,
  applyHint: applyZipHint,
  Board: ZipBoard,
  shareGrid: () => '',
};
