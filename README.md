# Daily Games

A puzzle app with a fresh set of logic games every day — inspired by the LinkedIn/NYT daily-games format, with fully original implementations.

**Games**

| Game | Goal |
|---|---|
| 👑 **Queens** | Place one crown in every row, column, and color region — no two crowns may touch, even diagonally. |
| 🌗 **Tango** | Fill the grid with suns and moons: equal counts per row/column, never three in a row, and `=` / `×` constraints between cells. |
| 🔗 **Zip** | Draw one continuous line from 1 through every number in order, filling every cell without crossing walls. |

## How it works

- **A new puzzle every day, for everyone, with no server.** Puzzles are generated in the browser from a seed derived from the date (`hash(date, game, attempt)` → seeded PRNG). The generator is fully deterministic — integer-only RNG, no `Math.random`, and every cutoff counted in attempts/search-nodes rather than wall-clock time — so every device produces the identical puzzle for a given date.
- **Guaranteed unique solutions.** Each game ships a solution-counting solver; the generator retries (deterministically) until the day's puzzle has exactly one solution.
- **Offline-first PWA.** Once loaded, the app — and any day's puzzle, past or future — works with no connection. Install it to your home screen from the browser menu.
- **Streaks, stats, archive.** Solve times, streaks (same-day solves only), and a calendar archive to replay any past date. Everything is stored locally.

## Development

```bash
npm install
npm run dev        # local dev server
npx vitest run     # solver/generator/determinism test suite
npm run build      # production build to dist/
npm run preview    # serve the production build
```

**Adding a game**: create `src/games/<id>/` with `types.ts`, `generate.ts` (pure, worker-safe, RNG-only randomness), `solve.ts` (solution counter), `validate.ts`, a board component, and an `index.ts` exporting a `GameDefinition`; register it in `src/games/registry.ts` and `src/games/generators.ts`. The home screen, routing, sessions, stats, archive, and share all pick it up automatically.

**Don't change generation output casually**: golden-snapshot tests pin each generator's output. Changing generation code changes *everyone's* daily puzzle for every date — if a change is intentional, update the snapshots consciously (and consider a `genVersion` in the seed for archive stability).

## Deployment

Pushes to `main` build, test, and deploy to GitHub Pages via `.github/workflows/deploy.yml`.

**One-time setup**: in the repository settings → Pages, set the source to **GitHub Actions**. The app then deploys to `https://galdprs.github.io/Games/`.
