import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Generation must be a pure function of the seed: identical output on every
 * device, forever. Ban nondeterminism sources from solver/generator code.
 */
describe('generation code determinism', () => {
  const gamesDir = dirname(fileURLToPath(import.meta.url));
  const files: string[] = [];
  for (const game of readdirSync(gamesDir, { withFileTypes: true })) {
    if (!game.isDirectory()) continue;
    for (const name of ['generate.ts', 'solve.ts', 'validate.ts']) {
      try {
        files.push(join(gamesDir, game.name, name));
        readFileSync(files[files.length - 1]);
      } catch {
        files.pop();
      }
    }
  }
  files.push(join(gamesDir, '..', 'core', 'rng.ts'), join(gamesDir, '..', 'core', 'generateDaily.ts'));

  it('finds the generation sources', () => {
    expect(files.length).toBeGreaterThanOrEqual(8);
  });

  it.each(files)('%s has no Math.random / Date.now / performance.now calls', (file) => {
    const src = readFileSync(file, 'utf8');
    expect(src).not.toMatch(/Math\.random\(/);
    expect(src).not.toMatch(/Date\.now\(/);
    expect(src).not.toMatch(/performance\.now\(/);
    expect(src).not.toMatch(/new Date\(/);
  });
});
