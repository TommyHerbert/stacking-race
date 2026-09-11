/**
 * Pure rules engine for Stacking Race.
 * No UI dependencies. Rules/setup land in later commits.
 */

export { ENGINE_VERSION } from './version.js';

export type {
  GamePhase,
  GameState,
  LegBet,
  PieceColour,
  PlayerSeat,
  PlayerState,
  RaceBetPileEntry,
  TrackModifier,
  TrackModifierSide,
  TrackSpace,
  WinnerBetValue,
} from './types.js';

export type { RngState } from './rng.js';
export {
  createRng,
  nextDieFace,
  nextFloat,
  nextInt,
  nextUint32,
  rngFromGame,
  sampleUint32,
} from './rng.js';

export {
  createEmptyGameState,
  EMPTY_STATE_PIECE_COLOURS,
  EMPTY_STATE_TRACK_SPACE_COUNT,
} from './state.js';
