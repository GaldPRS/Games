/** Shared grid index helpers. Cells are flat indices into a size×size array. */

export interface Pos {
  r: number;
  c: number;
}

export function idx(r: number, c: number, size: number): number {
  return r * size + c;
}

export function rowOf(i: number, size: number): number {
  return Math.floor(i / size);
}

export function colOf(i: number, size: number): number {
  return i % size;
}

/** Orthogonal neighbors, fixed N/E/S/W order (order matters for determinism). */
export function orthoNeighbors(i: number, size: number): number[] {
  const r = rowOf(i, size);
  const c = colOf(i, size);
  const out: number[] = [];
  if (r > 0) out.push(i - size);
  if (c < size - 1) out.push(i + 1);
  if (r < size - 1) out.push(i + size);
  if (c > 0) out.push(i - 1);
  return out;
}

/** All 8 surrounding neighbors (for Queens adjacency). */
export function kingNeighbors(i: number, size: number): number[] {
  const r = rowOf(i, size);
  const c = colOf(i, size);
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) out.push(idx(nr, nc, size));
    }
  }
  return out;
}
