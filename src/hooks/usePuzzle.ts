import { useEffect, useState } from 'react';
import { generateDaily, type GenerationResult } from '../core/generateDaily';
import { GENERATORS } from '../games/generators';
import { KEYS, storageGet, storageSet } from '../core/storage';

interface PuzzleStatus<P> {
  puzzle: P | null;
  error: string | null;
}

/** Load today's (or an archive date's) puzzle: cache-first, generate on miss. */
export function usePuzzle<P>(gameId: string, dateKey: string): PuzzleStatus<P> {
  const [status, setStatus] = useState<PuzzleStatus<P>>({ puzzle: null, error: null });

  useEffect(() => {
    setStatus({ puzzle: null, error: null });
    const key = KEYS.puzzle(gameId, dateKey);
    const cached = storageGet<GenerationResult<P>>(key);
    if (cached?.puzzle) {
      setStatus({ puzzle: cached.puzzle, error: null });
      return;
    }
    let cancelled = false;
    // generation is fast (<100 ms typical); defer a tick so the spinner paints
    const t = setTimeout(() => {
      try {
        const gen = GENERATORS[gameId];
        if (!gen) throw new Error(`unknown game ${gameId}`);
        const result = generateDaily<P>(gameId, dateKey, gen.tryGenerate, gen.maxAttempts);
        storageSet(key, result);
        if (!cancelled) setStatus({ puzzle: result.puzzle, error: null });
      } catch (e) {
        if (!cancelled) setStatus({ puzzle: null, error: String(e) });
      }
    }, 30);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [gameId, dateKey]);

  return status;
}
