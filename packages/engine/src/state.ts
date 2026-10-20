import {
  TRACK_SPACE_COUNT,
  mapByColour,
} from './constants.js';
import type { GameState, TrackSpace } from './types.js';
import { ENGINE_VERSION } from './version.js';

function emptyTrack(): TrackSpace[] {
  return Array.from({ length: TRACK_SPACE_COUNT }, () => ({ stack: [] }));
}

/**
 * Structurally valid blank state — not a started game.
 * Setup (players, dice pool, bets, positions) arrives in a later commit.
 */
export function createEmptyGameState(rngSeed: number): GameState {
  return {
    version: ENGINE_VERSION,
    rngSeed: rngSeed >>> 0,
    rngCursor: 0,
    playerCount: 0,
    activePlayer: null,
    startPlayerThisLeg: null,
    phase: 'empty',
    track: emptyTrack(),
    dicePool: [],
    diceUsed: [],
    legWinnerBets: mapByColour(() => []),
    legMidfieldBets: mapByColour(() => false),
    diceRemaining: 0,
    players: [],
    raceWinnerPile: [],
    raceLoserPile: [],
    history: [],
  };
}
