import type { GameDefinition } from './types';
import { queensGame } from './queens';
import { tangoGame } from './tango';
import { zipGame } from './zip';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GAMES: GameDefinition<any, any>[] = [queensGame, tangoGame, zipGame];

export function getGame(id: string | undefined): GameDefinition<unknown, unknown> | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return GAMES.find((g) => g.id === id) as GameDefinition<any, any> | undefined;
}
