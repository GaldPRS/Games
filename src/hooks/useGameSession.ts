import { useCallback, useEffect, useRef, useState } from 'react';
import { KEYS, storageGet, storageSet } from '../core/storage';
import { recordCompletion, type GameStats } from '../core/stats';
import type { GameDefinition } from '../games/types';

export interface SessionRecord<S> {
  state: S;
  elapsedMs: number;
  solved: boolean;
  statsRecorded: boolean;
}

interface GameSession<S> {
  state: S;
  solved: boolean;
  elapsedMs: number;
  stats: GameStats | null; // set at the moment of solving
  setState(next: S): void;
}

/**
 * Owns board state, elapsed time, autosave, and the solve → stats pipeline
 * for one (game, date). Timer accumulates only while the tab is visible.
 */
export function useGameSession<P, S>(
  game: GameDefinition<P, S>,
  dateKey: string,
  puzzle: P | null,
): GameSession<S> | null {
  const key = KEYS.session(game.id, dateKey);
  const [session, setSession] = useState<SessionRecord<S> | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const startRef = useRef<number>(Date.now());
  const baseElapsedRef = useRef(0);

  // load or create the session when the puzzle arrives
  useEffect(() => {
    if (!puzzle) {
      setSession(null);
      return;
    }
    const existing = storageGet<SessionRecord<S>>(key);
    const rec: SessionRecord<S> = existing ?? {
      state: game.createInitialState(puzzle),
      elapsedMs: 0,
      solved: false,
      statsRecorded: false,
    };
    baseElapsedRef.current = rec.elapsedMs;
    startRef.current = Date.now();
    setSession(rec);
    setStats(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, puzzle]);

  // fold visible time into elapsedMs on hide/unmount
  useEffect(() => {
    const fold = () => {
      baseElapsedRef.current += Date.now() - startRef.current;
      startRef.current = Date.now();
      setSession((s) => {
        if (!s || s.solved) return s;
        const next = { ...s, elapsedMs: baseElapsedRef.current };
        storageSet(key, next);
        return next;
      });
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') fold();
      else startRef.current = Date.now();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [key]);

  const setState = useCallback(
    (nextState: S) => {
      if (!puzzle) return;
      setSession((s) => {
        if (!s || s.solved) return s;
        const elapsedMs = baseElapsedRef.current + (Date.now() - startRef.current);
        const solved = game.isSolved(puzzle, nextState);
        const next: SessionRecord<S> = {
          state: nextState,
          elapsedMs,
          solved,
          statsRecorded: s.statsRecorded || solved,
        };
        storageSet(key, next);
        if (solved && !s.statsRecorded) {
          setStats(recordCompletion(game.id, dateKey, elapsedMs));
        }
        return next;
      });
    },
    [game, dateKey, key, puzzle],
  );

  if (!session) return null;
  return {
    state: session.state,
    solved: session.solved,
    elapsedMs: session.solved
      ? session.elapsedMs
      : baseElapsedRef.current + (Date.now() - startRef.current),
    stats,
    setState,
  };
}

/** Lightweight status read for cards/archive (no session creation). */
export function readSessionStatus(
  gameId: string,
  dateKey: string,
): 'none' | 'inProgress' | { solvedMs: number } {
  const rec = storageGet<SessionRecord<unknown>>(KEYS.session(gameId, dateKey));
  if (!rec) return 'none';
  if (rec.solved) return { solvedMs: rec.elapsedMs };
  return 'inProgress';
}
