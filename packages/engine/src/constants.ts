/**
 * Rules constants for Stacking Race.
 * Single source of truth for board size, colours, bet values, and payouts.
 */

/** Number of track spaces (engine indices 0 .. TRACK_SPACE_COUNT - 1). */
export const TRACK_SPACE_COUNT = 16 as const;

export const PIECE_COLOURS = [
  'blue',
  'green',
  'orange',
  'yellow',
  'white',
] as const;

export type PieceColour = (typeof PIECE_COLOURS)[number];

export const PLAYER_SEATS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
] as const;

export type PlayerSeat = (typeof PLAYER_SEATS)[number];

export const MIN_PLAYERS = 2 as const;
export const MAX_PLAYERS = 8 as const;

export const STARTING_POINTS = 3 as const;

/** Winner-bet stack per colour, top-first. */
export const LEG_WINNER_BET_STACK = [5, 3, 2, 2] as const;

export type WinnerBetValue = (typeof LEG_WINNER_BET_STACK)[number];

/** Dice actions / pyramid tokens available each leg. */
export const DICE_PER_LEG = 5 as const;

/** Equal-probability die faces. */
export const DIE_FACES = [1, 2, 3] as const;

export type DieFace = (typeof DIE_FACES)[number];

/** Race-bet payouts for correct cards, in place order (first placed first). */
export const RACE_BET_CORRECT_PAYOUTS = [8, 5, 3, 2, 1] as const;

/** Points lost for an incorrect race bet (floored at 0 when applied). */
export const RACE_BET_WRONG_PENALTY = 1 as const;

/** Winner-bet payout when the colour places 2nd. */
export const LEG_WINNER_SECOND_PAYOUT = 1 as const;

/** Winner-bet loss when the colour places 3rd–5th. */
export const LEG_WINNER_OTHER_PENALTY = 1 as const;

/**
 * Midfield-bet payout by finishing rank (1-based index 1..5).
 * 1st/5th −1, 2nd/4th +1, 3rd +2.
 */
export const LEG_MIDFIELD_PAYOUT_BY_RANK = {
  1: -1,
  2: 1,
  3: 2,
  4: 1,
  5: -1,
} as const;

/** Points awarded per dice token at leg scoring. */
export const LEG_DICE_TOKEN_PAYOUT = 1 as const;

/** Points awarded to a track-modifier owner when it is triggered. */
export const TRACK_MODIFIER_TRIGGER_PAYOUT = 1 as const;

/** UI label for an engine space index (0 → "1"). */
export function uiSpaceLabel(index: number): number {
  return index + 1;
}

/** Engine index for a die face / UI space number (1 → 0). */
export function spaceIndexFromFace(face: DieFace): number {
  return face - 1;
}

/** Fresh per-colour map; `factory` runs once per colour (avoids shared refs). */
export function mapByColour<T>(factory: () => T): Record<PieceColour, T> {
  return {
    blue: factory(),
    green: factory(),
    orange: factory(),
    yellow: factory(),
    white: factory(),
  };
}

/** Fresh copy of the initial winner-bet stacks (top-first). */
export function initialLegWinnerBets(): Record<
  PieceColour,
  WinnerBetValue[]
> {
  return mapByColour(() => [...LEG_WINNER_BET_STACK]);
}

/** Fresh midfield availability map (all available). */
export function initialLegMidfieldBets(): Record<PieceColour, boolean> {
  return mapByColour(() => true);
}
