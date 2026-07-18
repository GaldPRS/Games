import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatDateKey, isValidDateKey, puzzleNumber, todayKey } from '../core/date';
import { buildShareText, formatTime, shareResult } from '../core/share';
import { effectiveStreak } from '../core/stats';
import { getGame } from '../games/registry';
import { useGameSession } from '../hooks/useGameSession';
import { usePuzzle } from '../hooks/usePuzzle';
import { Confetti } from './Confetti';
import styles from './screens.module.css';

const APP_URL = 'https://galdprs.github.io/Games/';

export function GameScreen() {
  const { gameId, dateKey: dateParam } = useParams();
  const navigate = useNavigate();
  const game = getGame(gameId);
  const dateKey = dateParam && isValidDateKey(dateParam) ? dateParam : todayKey();

  useEffect(() => {
    if (!game) navigate('/', { replace: true });
  }, [game, navigate]);

  if (!game) return null;
  // key forces a clean remount per (game, date) so a stale puzzle/session pair
  // from the previous game never renders against the new game's Board
  return <GameScreenInner key={`${game.id}:${dateKey}`} game={game} dateKey={dateKey} />;
}

function GameScreenInner({
  game,
  dateKey,
}: {
  game: NonNullable<ReturnType<typeof getGame>>;
  dateKey: string;
}) {
  const { puzzle, error } = usePuzzle<unknown>(game.id, dateKey);
  const session = useGameSession(game, dateKey, puzzle);
  const [showHelp, setShowHelp] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [, tick] = useState(0);
  const hintReadyAt = useRef(0); // per-mount cooldown; reload resets it

  // 1s timer repaint while playing
  useEffect(() => {
    if (!session || session.solved) return;
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [session?.solved, session === null]);

  // open win dialog when a solve happens in this session
  useEffect(() => {
    if (session?.solved) setShowWin(true);
  }, [session?.solved]);

  const share = async () => {
    if (!puzzle || !session) return;
    const text = buildShareText(
      game.name,
      puzzleNumber(game.firstDate, dateKey),
      session.elapsedMs,
      game.shareGrid(puzzle, session.state),
      APP_URL,
      session.hintsUsed,
    );
    const how = await shareResult(text);
    if (how === 'copied') {
      setToast('Copied to clipboard!');
      setTimeout(() => setToast(null), 2000);
    }
  };

  const HINT_COOLDOWN_MS = 10_000;
  const cooldownLeft = Math.max(0, hintReadyAt.current - Date.now());
  const useHint = () => {
    if (!session || cooldownLeft > 0) return;
    if (session.hint()) {
      hintReadyAt.current = Date.now() + HINT_COOLDOWN_MS;
      tick((n) => n + 1); // repaint immediately so the countdown shows
    }
  };

  const replay = () => {
    session?.replay();
    hintReadyAt.current = 0;
    setShowWin(false);
  };

  const Board = game.Board;
  return (
    <div className={styles.page}>
      <header className={styles.gameHeader}>
        <Link to="/" className={styles.backBtn} aria-label="Back">
          ←
        </Link>
        <div className={styles.gameTitleWrap}>
          <div className={styles.gameTitle}>{game.name}</div>
          <div className={styles.gameSub}>
            #{puzzleNumber(game.firstDate, dateKey)} · {formatDateKey(dateKey)}
          </div>
        </div>
        <button className={styles.helpBtn} onClick={() => setShowHelp(true)} aria-label="How to play">
          ?
        </button>
      </header>

      {session && (
        <div className={styles.controlRow}>
          <div className={styles.timer}>
            {session.solved ? `Solved in ${formatTime(session.elapsedMs)} 🎉` : formatTime(session.elapsedMs)}
            {session.hintsUsed > 0 && <span className={styles.hintCount}> · 💡{session.hintsUsed}</span>}
          </div>
          {session.solved ? (
            <button className={styles.pillBtn} onClick={replay}>
              ↻ Replay
            </button>
          ) : (
            <button
              className={styles.pillBtn}
              disabled={cooldownLeft > 0}
              onClick={useHint}
              aria-label="Hint"
            >
              💡 {cooldownLeft > 0 ? `${Math.ceil(cooldownLeft / 1000)}s` : 'Hint'}
            </button>
          )}
        </div>
      )}

      <div className={styles.boardWrap}>
        {error && <div className={styles.spinner}>Something went wrong: {error}</div>}
        {!error && (!puzzle || !session) && <div className={styles.spinner}>Preparing today’s puzzle…</div>}
        {puzzle != null && session != null ? (
          <Board puzzle={puzzle} state={session.state} onChange={session.setState} locked={session.solved} />
        ) : null}
      </div>

      {showHelp && (
        <div className={styles.dialogBackdrop} onClick={() => setShowHelp(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogTitle}>How to play</div>
            <ul className={styles.rulesList}>
              {game.rules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <div className={styles.dialogActions}>
              <button className={styles.primaryBtn} onClick={() => setShowHelp(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {showWin && session?.solved && (
        <>
          <Confetti />
          <div className={styles.dialogBackdrop} onClick={() => setShowWin(false)}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dialogTitle}>Brilliant!</div>
              <div className={styles.dialogBig}>🏆</div>
              <div className={styles.dialogMeta}>
                Solved in {formatTime(session.elapsedMs)}
                {session.hintsUsed > 0 && <> · 💡{session.hintsUsed}</>}
                {session.stats && dateKey === todayKey() && (
                  <> · 🔥 {effectiveStreak(session.stats)}-day streak</>
                )}
              </div>
              <div className={styles.dialogActions}>
                <button className={styles.primaryBtn} onClick={share}>
                  Share result
                </button>
                <button className={styles.secondaryBtn} onClick={replay}>
                  ↻ Replay
                </button>
                <Link to="/" className={styles.secondaryBtn}>
                  Back to games
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
