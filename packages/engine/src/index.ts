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

export type { DieFace } from './constants.js';
export {
  DICE_PER_LEG,
  DIE_FACES,
  LEG_DICE_TOKEN_PAYOUT,
  LEG_MIDFIELD_PAYOUT_BY_RANK,
  LEG_WINNER_BET_STACK,
  LEG_WINNER_OTHER_PENALTY,
  LEG_WINNER_SECOND_PAYOUT,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PIECE_COLOURS,
  PLAYER_SEATS,
  RACE_BET_CORRECT_PAYOUTS,
  RACE_BET_WRONG_PENALTY,
  STARTING_POINTS,
  MODIFIER_PAYOUT,
  TRACK_SPACE_COUNT,
  initialLegMidfieldBets,
  initialLegWinnerBets,
  mapByColour,
  spaceIndexFromFace,
  uiSpaceLabel,
} from './constants.js';

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

export { createEmptyGameState } from './state.js';
