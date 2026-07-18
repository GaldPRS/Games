import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDateKey, todayKey } from '../core/date';
import { formatTime } from '../core/share';
import { GAMES } from '../games/registry';
import { readSessionStatus } from '../hooks/useGameSession';
import { prewarmPuzzles } from '../hooks/usePuzzle';
import styles from './screens.module.css';

const ICONS: Record<string, string> = { queens: '👑', tango: '🌗', zip: '🔗' };

export function HomeScreen() {
  const date = todayKey();

  // generate today's puzzles in the worker so game screens open instantly
  useEffect(() => {
    prewarmPuzzles(
      GAMES.map((g) => g.id),
      date,
    );
  }, [date]);
  return (
    <div className={styles.page}>
      <header className={styles.homeHeader}>
        <h1 className={styles.homeTitle}>Daily Games</h1>
        <div className={styles.homeDate}>{formatDateKey(date)}</div>
      </header>
      <div className={styles.cards}>
        {GAMES.map((game) => {
          const status = readSessionStatus(game.id, date);
          return (
            <Link key={game.id} to={`/game/${game.id}`} className={styles.card}>
              <div className={styles.cardIcon} style={{ background: game.color }}>
                {ICONS[game.id] ?? '🎮'}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardName}>{game.name}</div>
                <div className={styles.cardTagline}>{game.tagline}</div>
              </div>
              <div
                className={[
                  styles.cardStatus,
                  typeof status === 'object' ? styles.statusDone : '',
                ].join(' ')}
              >
                {typeof status === 'object'
                  ? `✓ ${formatTime(status.solvedMs)}`
                  : status === 'inProgress'
                    ? 'In progress'
                    : 'Play'}
              </div>
            </Link>
          );
        })}
      </div>
      <nav className={styles.navRow}>
        <Link to="/archive" className={styles.navLink}>
          Archive
        </Link>
        <Link to="/stats" className={styles.navLink}>
          Stats
        </Link>
      </nav>
    </div>
  );
}
