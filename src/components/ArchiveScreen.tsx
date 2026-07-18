import { useState } from 'react';
import { Link } from 'react-router-dom';
import { compareDateKeys, parseDateKey, toDateKey, todayKey } from '../core/date';
import { GAMES } from '../games/registry';
import { readSessionStatus } from '../hooks/useGameSession';
import styles from './screens.module.css';

const EARLIEST = GAMES.reduce(
  (min, g) => (compareDateKeys(g.firstDate, min) < 0 ? g.firstDate : min),
  GAMES[0].firstDate,
);

export function ArchiveScreen() {
  const today = todayKey();
  const [year, setYear] = useState(parseDateKey(today).getFullYear());
  const [month, setMonth] = useState(parseDateKey(today).getMonth());
  const [picked, setPicked] = useState<string | null>(null);

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = first.getDay();
  const monthLabel = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setPicked(null);
  };

  return (
    <div className={styles.page}>
      <header className={styles.gameHeader}>
        <Link to="/" className={styles.backBtn} aria-label="Back">
          ←
        </Link>
        <div className={styles.gameTitleWrap}>
          <div className={styles.gameTitle}>Archive</div>
        </div>
        <span />
      </header>

      <div className={styles.monthNav}>
        <button className={styles.backBtn} onClick={() => shift(-1)} aria-label="Previous month">
          ‹
        </button>
        <strong>{monthLabel}</strong>
        <button className={styles.backBtn} onClick={() => shift(1)} aria-label="Next month">
          ›
        </button>
      </div>

      <div className={styles.calendar}>
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`b${i}`} className={styles.calEmpty} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dateKey = toDateKey(new Date(year, month, i + 1));
          const playable =
            compareDateKeys(dateKey, EARLIEST) >= 0 && compareDateKeys(dateKey, today) <= 0;
          if (!playable) {
            return (
              <span key={dateKey} className={styles.calCell} style={{ opacity: 0.35 }}>
                {i + 1}
              </span>
            );
          }
          return (
            <button
              key={dateKey}
              className={[styles.calCell, dateKey === today ? styles.calToday : ''].join(' ')}
              onClick={() => setPicked(picked === dateKey ? null : dateKey)}
            >
              {i + 1}
              <span className={styles.dots}>
                {GAMES.map((g) => {
                  const st = readSessionStatus(g.id, dateKey);
                  return (
                    <span
                      key={g.id}
                      className={styles.dot}
                      style={{ background: typeof st === 'object' ? g.color : 'var(--card-border)' }}
                    />
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>

      {picked && (
        <div className={styles.cards} style={{ marginTop: 20 }}>
          {GAMES.map((g) => {
            const st = readSessionStatus(g.id, picked);
            return (
              <Link key={g.id} to={`/game/${g.id}/${picked}`} className={styles.card}>
                <div className={styles.cardIcon} style={{ background: g.color }}>
                  {g.name[0]}
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardName}>{g.name}</div>
                  <div className={styles.cardTagline}>{picked}</div>
                </div>
                <div className={styles.cardStatus}>{typeof st === 'object' ? '✓' : 'Play'}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
