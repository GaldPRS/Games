import { splitmix32, type Rng } from './rng';
import { hashSeed } from './seed';

export interface GenerationResult<P> {
  puzzle: P;
  attempt: number;
}

export type TryGenerate<P> = (rng: Rng, attempt: number) => P | null;

/**
 * Deterministic daily generation: the attempt counter is folded into the
 * seed, so every client walks the identical attempt sequence and lands on
 * the identical puzzle. tryGenerate must be a pure function of (rng, attempt)
 * and all its internal cutoffs must be counted (attempts / search nodes),
 * never wall-clock time.
 */
export function generateDaily<P>(
  gameId: string,
  dateKey: string,
  tryGenerate: TryGenerate<P>,
  maxAttempts = 200,
): GenerationResult<P> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rng = splitmix32(hashSeed(dateKey, gameId, attempt));
    const puzzle = tryGenerate(rng, attempt);
    if (puzzle !== null) return { puzzle, attempt };
  }
  throw new Error(`Puzzle generation exhausted ${maxAttempts} attempts for ${gameId} ${dateKey}`);
}
