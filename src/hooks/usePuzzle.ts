import { useEffect, useState } from 'react';
import type { GenerationResult } from '../core/generateDaily';
import { KEYS, storageGet, storageSet } from '../core/storage';
import { generatePuzzle } from '../core/workerClient';

interface PuzzleStatus<P> {
  puzzle: P | null;
  error: string | null;
}

/** Load a (game, date) puzzle: cache-first, generate in the worker on miss. */
export function usePuzzle<P>(gameId: string, dateKey: string): PuzzleStatus<P> {
  const [status, setStatus] = useState<PuzzleStatus<P>>(() => {
    const cached = storageGet<GenerationResult<P>>(KEYS.puzzle(gameId, dateKey));
    return { puzzle: cached?.puzzle ?? null, error: null };
  });

  useEffect(() => {
    if (status.puzzle) return;
    let cancelled = false;
    generatePuzzle(gameId, dateKey)
      .then((result) => {
        storageSet(KEYS.puzzle(gameId, dateKey), result);
        if (!cancelled) setStatus({ puzzle: result.puzzle as P, error: null });
      })
      .catch((e) => {
        if (!cancelled) setStatus({ puzzle: null, error: String(e) });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, dateKey]);

  return status;
}

/** Warm the cache for all games for a date (fired from the home screen). */
export function prewarmPuzzles(gameIds: string[], dateKey: string): void {
  for (const gameId of gameIds) {
    if (storageGet(KEYS.puzzle(gameId, dateKey))) continue;
    generatePuzzle(gameId, dateKey)
      .then((result) => storageSet(KEYS.puzzle(gameId, dateKey), result))
      .catch(() => {});
  }
}
