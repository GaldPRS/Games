/**
 * Deterministic PRNG utilities. Generation code must ONLY draw randomness
 * from these functions — never Math.random — so that a given seed produces
 * the identical puzzle on every device and JS engine (integer-only math).
 */

export type Rng = () => number;

/** splitmix32: 32-bit integer arithmetic only; returns floats in [0, 1). */
export function splitmix32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    t = t ^ (t >>> 15);
    return (t >>> 0) / 4294967296;
  };
}

/** Uniform integer in [0, n). The only sanctioned way to draw ints. */
export function nextInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}

/** In-place Fisher–Yates shuffle; returns the same array for convenience. */
export function shuffle<T>(rng: Rng, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = nextInt(rng, i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
