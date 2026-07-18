import { useMemo } from 'react';
import styles from './confetti.module.css';

const COLORS = ['#7c5cff', '#f4a825', '#ff8b3d', '#16a34a', '#38bdf8', '#ef4444'];

/** Lightweight CSS confetti burst (no library). Purely decorative. */
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${((i * 13) % 40) / 40}s`,
        duration: `${1.6 + ((i * 7) % 10) / 8}s`,
        color: COLORS[i % COLORS.length],
        rot: `${(i * 47) % 360}deg`,
      })),
    [],
  );
  return (
    <div className={styles.confetti} aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={styles.piece}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            background: p.color,
            transform: `rotate(${p.rot})`,
          }}
        />
      ))}
    </div>
  );
}
