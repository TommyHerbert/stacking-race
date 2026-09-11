import type {
  GameState,
  PieceColour,
  TrackSpace,
  WinnerBetValue,
} from './types.js';
import { ENGINE_VERSION } from './version.js';
const TRACK_SPACE_COUNT = 16;

const PIECE_COLOURS = [
  'blue',
  'green',
  'orange',
  'yellow',
  'white',
] as const satisfies readonly PieceColour[];

function emptyTrack(): TrackSpace[] {
  const track: TrackSpace[] = [{ stack: [] }];
  for (let space = 1; space <= TRACK_SPACE_COUNT; space += 1) {
    track[space] = { stack: [] };
  }
  return track;
}

function emptyLegWinnerBets(): Record<PieceColour, WinnerBetValue[]> {
  return {
    blue: [],
    green: [],
    orange: [],
    yellow: [],
    white: [],
  };
}

function emptyLegMidfieldBets(): Record<PieceColour, boolean> {
  return {
    blue: false,
    green: false,
    orange: false,
    yellow: false,
    white: false,
  };
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
    legWinnerBets: emptyLegWinnerBets(),
    legMidfieldBets: emptyLegMidfieldBets(),
    diceRemaining: 0,
    players: [],
    raceWinnerPile: [],
    raceLoserPile: [],
    history: [],
  };
}

/** Exported for tests / upcoming constants commit; not player-facing. */
export const EMPTY_STATE_TRACK_SPACE_COUNT = TRACK_SPACE_COUNT;
export const EMPTY_STATE_PIECE_COLOURS = PIECE_COLOURS;
