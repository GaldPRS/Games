/**
 * Worker-safe generator map: imports ONLY pure generate modules, never the
 * registry (which pulls in React components).
 */
import type { TryGenerate } from '../core/generateDaily';
import { tryGenerateQueens } from './queens/generate';
import { tryGenerateTango } from './tango/generate';
import { tryGenerateZip } from './zip/generate';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GENERATORS: Record<string, { tryGenerate: TryGenerate<any>; maxAttempts: number }> = {
  queens: { tryGenerate: tryGenerateQueens, maxAttempts: 1000 },
  tango: { tryGenerate: tryGenerateTango, maxAttempts: 200 },
  zip: { tryGenerate: tryGenerateZip, maxAttempts: 200 },
};
