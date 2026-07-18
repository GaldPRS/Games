import { useCallback, useEffect, useRef, useState } from 'react';
import { KEYS, storageGet, storageSet } from '../core/storage';
import { recordCompletion, type GameStats } from '../core/stats';
import type { GameDefinition } from '../games/types';

export interface SessionRecord<S> {
  state: S;
  elapsedMs: number;
  solved: boolean;
  statsRecorded: boolean;
  hintsUsed?: number; // absent in pre-hints sessions → 0
  firstSolvedMs?: number; // preserved across replays for card/archive display
}

interface GameSession<S> {
  state: S;
  solved: boolean;
  elapsedMs: number;
  hintsUsed: number;
  stats: GameStats | null; // set at the moment of solving
  setState(next: S): void;
  /** Apply one hint move; returns false when no hint was available. */
  hint(): boolean;
  /** Reset board and timer to re-solve. Stats/streaks are never re-recorded. */
  replay(): void;
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

  /** Shared move pipeline for taps and hints: persist, detect solve, record stats once. */
  const commitState = useCallback(
    (nextState: S, hintDelta: 0 | 1) => {
      if (!puzzle) return;
      setSession((s) => {
        if (!s || s.solved) return s;
        const elapsedMs = baseElapsedRef.current + (Date.now() - startRef.current);
        const solved = game.isSolved(puzzle, nextState);
        const hintsUsed = (s.hintsUsed ?? 0) + hintDelta;
        const next: SessionRecord<S> = {
          state: nextState,
          elapsedMs,
          solved,
          statsRecorded: s.statsRecorded || solved,
          hintsUsed,
          firstSolvedMs: s.firstSolvedMs ?? (solved ? elapsedMs : undefined),
        };
        storageSet(key, next);
        if (solved && !s.statsRecorded) {
          setStats(recordCompletion(game.id, dateKey, elapsedMs, hintsUsed));
        }
        return next;
      });
    },
    [game, dateKey, key, puzzle],
  );

  const setState = useCallback((nextState: S) => commitState(nextState, 0), [commitState]);

  const hint = useCallback((): boolean => {
    if (!puzzle || !session || session.solved) return false;
    const next = game.applyHint(puzzle, session.state);
    if (next === null) return false;
    commitState(next, 1);
    return true;
  }, [commitState, game, puzzle, session]);

  const replay = useCallback(() => {
    if (!puzzle) return;
    setSession((s) => {
      if (!s) return s;
      baseElapsedRef.current = 0;
      startRef.current = Date.now();
      const next: SessionRecord<S> = {
        state: game.createInitialState(puzzle),
        elapsedMs: 0,
        solved: false,
        statsRecorded: s.statsRecorded, // a replay solve never re-records
        hintsUsed: 0,
        firstSolvedMs: s.firstSolvedMs,
      };
      storageSet(key, next);
      return next;
    });
    setStats(null);
  }, [game, key, puzzle]);

  if (!session) return null;
  return {
    state: session.state,
    solved: session.solved,
    elapsedMs: session.solved
      ? session.elapsedMs
      : baseElapsedRef.current + (Date.now() - startRef.current),
    hintsUsed: session.hintsUsed ?? 0,
    stats,
    setState,
    hint,
    replay,
  };
}

/** Lightweight status read for cards/archive (no session creation). */
export function readSessionStatus(
  gameId: string,
  dateKey: string,
): 'none' | 'inProgress' | { solvedMs: number } {
  const rec = storageGet<SessionRecord<unknown>>(KEYS.session(gameId, dateKey));
  if (!rec) return 'none';
  // once solved, the day stays "done" even while a replay is in progress
  if (rec.solved || rec.statsRecorded) return { solvedMs: rec.firstSolvedMs ?? rec.elapsedMs };
  return 'inProgress';
}
