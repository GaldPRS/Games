/**
 * Seed derivation: hash (dateKey, gameId, attempt) into a uint32 so every
 * client walks the identical attempt sequence for a given date and game.
 * FNV-1a over the joined string — stable, engine-independent.
 */
export function hashSeed(dateKey: string, gameId: string, attempt: number): number {
  const str = `${dateKey}:${gameId}:${attempt}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // final avalanche (xmur3 tail) to spread low-entropy inputs
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}
