export type TangoSymbol = 0 | 1; // 0 = sun, 1 = moon
export type TangoCell = TangoSymbol | null;

export interface TangoConstraint {
  a: number; // cell index
  b: number; // right or below neighbor of a
  kind: 'eq' | 'ne';
}

export interface TangoPuzzle {
  size: number; // 6
  given: TangoCell[]; // length size*size; non-null cells are locked
  constraints: TangoConstraint[];
  solution: TangoSymbol[];
}

export interface TangoState {
  cells: TangoCell[]; // includes givens (immutable in UI)
}
