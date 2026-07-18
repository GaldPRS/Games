import { generateDaily, type GenerationResult } from './generateDaily';
import { GENERATORS } from '../games/generators';
import type { GenerateRequest, GenerateResponse } from '../workers/generator.worker';

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (r: GenerationResult<unknown>) => void; reject: (e: Error) => void }>();

function getWorker(): Worker | null {
  if (worker) return worker;
  if (typeof Worker === 'undefined') return null;
  try {
    worker = new Worker(new URL('../workers/generator.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (e: MessageEvent<GenerateResponse>) => {
      const req = pending.get(e.data.id);
      if (!req) return;
      pending.delete(e.data.id);
      if (e.data.ok) req.resolve({ puzzle: e.data.puzzle, attempt: e.data.attempt });
      else req.reject(new Error(e.data.error));
    };
    worker.onerror = () => {
      // fail all pending requests; callers fall back to main-thread generation
      for (const [, req] of pending) req.reject(new Error('worker failed'));
      pending.clear();
      worker = null;
    };
    return worker;
  } catch {
    return null;
  }
}

/** Generate on the worker when available; fall back to the main thread. */
export async function generatePuzzle(gameId: string, dateKey: string): Promise<GenerationResult<unknown>> {
  const gen = GENERATORS[gameId];
  if (!gen) throw new Error(`unknown game ${gameId}`);
  const w = getWorker();
  if (w) {
    try {
      return await new Promise<GenerationResult<unknown>>((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { resolve, reject });
        w.postMessage({ id, gameId, dateKey } satisfies GenerateRequest);
      });
    } catch {
      // fall through to main thread
    }
  }
  return generateDaily(gameId, dateKey, gen.tryGenerate, gen.maxAttempts);
}
