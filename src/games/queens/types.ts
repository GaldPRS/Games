export type QueensCell = 0 | 1 | 2; // empty | X mark | queen

export interface QueensPuzzle {
  size: number; // 8 or 9
  regions: number[]; // length size*size, region id 0..size-1 per cell
  solution: number[]; // solution[row] = col
}

export interface QueensState {
  cells: QueensCell[];
}
