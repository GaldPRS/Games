import type React from 'react';
import type { Rng } from '../core/rng';

export interface GameBoardProps<P, S> {
  puzzle: P;
  state: S;
  onChange(next: S): void;
  /** True once solved — board becomes read-only. */
  locked: boolean;
}

/**
 * The extensibility contract: adding a game = one folder + one registry line.
 * tryGenerate must be pure, DOM-free and worker-safe; all randomness comes
 * from the provided rng; all cutoffs counted in nodes/attempts, never time.
 */
export interface GameDefinition<P = unknown, S = unknown> {
  id: string;
  name: string;
  tagline: string;
  color: string; // accent color for cards/icons
  rules: string[];
  firstDate: string;
  tryGenerate(rng: Rng, attempt: number): P | null;
  createInitialState(puzzle: P): S;
  isSolved(puzzle: P, state: S): boolean;
  Board: React.ComponentType<GameBoardProps<P, S>>;
  shareGrid(puzzle: P, state: S): string;
}
