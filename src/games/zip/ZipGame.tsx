import { useMemo, useRef } from 'react';
import type { GameBoardProps } from '../types';
import type { ZipPuzzle, ZipState } from './types';
import { canExtend } from './validate';
import styles from './zip.module.css';

export function ZipBoard({ puzzle, state, onChange, locked }: GameBoardProps<ZipPuzzle, ZipState>) {
  const { size, waypoints, walls } = puzzle;
  const boardRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const waypointOf = useMemo(() => {
    const m = new Map<number, number>();
    waypoints.forEach((cell, k) => m.set(cell, k + 1));
    return m;
  }, [waypoints]);

  const wallSet = useMemo(
    () => new Set(walls.map((w) => `${Math.min(w.a, w.b)}:${Math.max(w.a, w.b)}`)),
    [walls],
  );

  const applyCell = (cell: number) => {
    if (locked) return;
    const { path } = state;
    const at = path.indexOf(cell);
    if (at !== -1) {
      // dragging back onto an earlier cell truncates the path to it
      if (at < path.length - 1) onChange({ path: path.slice(0, at + 1) });
      return;
    }
    if (canExtend(puzzle, state, cell)) onChange({ path: [...path, cell] });
  };

  const cellFromEvent = (e: React.PointerEvent): number | null => {
    const board = boardRef.current;
    if (!board) return null;
    const rect = board.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
    const c = Math.floor((x / rect.width) * size);
    const r = Math.floor((y / rect.height) * size);
    // hit-slop: ignore touches near cell borders to avoid diagonal skips
    const cx = ((c + 0.5) * rect.width) / size;
    const cy = ((r + 0.5) * rect.height) / size;
    const rad = Math.min(rect.width, rect.height) / size / 2;
    if (Math.hypot(x - cx, y - cy) > rad * 0.85) return null;
    return r * size + c;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    boardRef.current?.setPointerCapture(e.pointerId);
    const cell = cellFromEvent(e);
    if (cell !== null) applyCell(cell);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const cell = cellFromEvent(e);
    if (cell !== null) applyCell(cell);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  // SVG path through cell centers (viewBox in cell units ×100)
  const points = state.path
    .map((cell) => {
      const r = Math.floor(cell / size);
      const c = cell % size;
      return `${c * 100 + 50},${r * 100 + 50}`;
    })
    .join(' ');

  const pathCells = useMemo(() => new Set(state.path), [state.path]);
  const head = state.path[state.path.length - 1];

  return (
    <div className={styles.wrap}>
      <div
        ref={boardRef}
        className={styles.board}
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="grid"
        aria-label="Zip board"
      >
        {Array.from({ length: size * size }, (_, i) => {
          const r = Math.floor(i / size);
          const c = i % size;
          const wallRight = wallSet.has(`${i}:${i + 1}`) && c < size - 1;
          const wallDown = wallSet.has(`${i}:${i + size}`) && r < size - 1;
          const num = waypointOf.get(i);
          return (
            <div
              key={i}
              role="gridcell"
              className={[
                styles.cell,
                pathCells.has(i) ? styles.onPath : '',
                i === head ? styles.head : '',
              ].join(' ')}
              style={{
                borderRight: wallRight ? '4px solid var(--wall)' : undefined,
                borderBottom: wallDown ? '4px solid var(--wall)' : undefined,
              }}
            >
              {num !== undefined && (
                <span className={[styles.badge, pathCells.has(i) ? styles.badgeVisited : ''].join(' ')}>
                  {num}
                </span>
              )}
            </div>
          );
        })}
        <svg
          className={styles.overlay}
          viewBox={`0 0 ${size * 100} ${size * 100}`}
          preserveAspectRatio="none"
        >
          {state.path.length > 1 && (
            <polyline
              points={points}
              fill="none"
              stroke="var(--zip-path)"
              strokeWidth={34}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          )}
        </svg>
      </div>
      <div className={styles.controls}>
        <button
          className={styles.btn}
          disabled={locked || state.path.length === 0}
          onClick={() => onChange({ path: state.path.slice(0, -1) })}
        >
          Undo
        </button>
        <button
          className={styles.btn}
          disabled={locked || state.path.length === 0}
          onClick={() => onChange({ path: [] })}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
