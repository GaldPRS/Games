/**
 * Puzzle generation off the main thread. Imports only pure generator code
 * (via generators.ts), never React components.
 */
import { generateDaily } from '../core/generateDaily';
import { GENERATORS } from '../games/generators';

export interface GenerateRequest {
  id: number;
  gameId: string;
  dateKey: string;
}

export type GenerateResponse =
  | { id: number; ok: true; puzzle: unknown; attempt: number }
  | { id: number; ok: false; error: string };

self.onmessage = (e: MessageEvent<GenerateRequest>) => {
  const { id, gameId, dateKey } = e.data;
  try {
    const gen = GENERATORS[gameId];
    if (!gen) throw new Error(`unknown game ${gameId}`);
    const { puzzle, attempt } = generateDaily(gameId, dateKey, gen.tryGenerate, gen.maxAttempts);
    (self as unknown as Worker).postMessage({ id, ok: true, puzzle, attempt } satisfies GenerateResponse);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id, ok: false, error: String(err) } satisfies GenerateResponse);
  }
};
