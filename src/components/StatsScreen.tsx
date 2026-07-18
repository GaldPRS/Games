import { Link } from 'react-router-dom';
import { formatTime } from '../core/share';
import { effectiveStreak, getStats } from '../core/stats';
import { GAMES } from '../games/registry';
import styles from './screens.module.css';

export function StatsScreen() {
  return (
    <div className={styles.page}>
      <header className={styles.gameHeader}>
        <Link to="/" className={styles.backBtn} aria-label="Back">
          ←
        </Link>
        <div className={styles.gameTitleWrap}>
          <div className={styles.gameTitle}>Stats</div>
        </div>
        <span />
      </header>

      <div className={styles.statCards}>
        {GAMES.map((g) => {
          const s = getStats(g.id);
          return (
            <div key={g.id} className={styles.statCard}>
              <strong style={{ color: g.color }}>{g.name}</strong>
              <div className={styles.statGrid}>
                <div>
                  <div className={styles.statVal}>{s.completed}</div>
                  <div className={styles.statLabel}>Solved</div>
                </div>
                <div>
                  <div className={styles.statVal}>{effectiveStreak(s)}</div>
                  <div className={styles.statLabel}>Streak</div>
                </div>
                <div>
                  <div className={styles.statVal}>{s.maxStreak}</div>
                  <div className={styles.statLabel}>Best streak</div>
                </div>
                <div>
                  <div className={styles.statVal}>{s.bestMs !== null ? formatTime(s.bestMs) : '—'}</div>
                  <div className={styles.statLabel}>Best time</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
