/**
 * Core domain types for Stacking Race.
 * No rules logic here — shape only.
 */

import { ENGINE_VERSION } from './version.js';

export type PlayerSeat = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

/** Five racing piece colours (abstract; not theme-flavoured). */
export type PieceColour = 'blue' | 'green' | 'orange' | 'yellow' | 'white';

export type TrackModifierSide = 'jump' | 'fall_back';

export type GamePhase =
  | 'empty'
  | 'turn'
  | 'leg_score'
  | 'race_score'
  | 'game_over';

export type WinnerBetValue = 5 | 3 | 2;

export type LegBet =
  | { kind: 'winner'; colour: PieceColour; value: WinnerBetValue }
  | { kind: 'midfield'; colour: PieceColour };

export type RaceBetPileEntry = {
  player: PlayerSeat;
  colour: PieceColour;
};

export type TrackModifier = {
  owner: PlayerSeat;
  side: TrackModifierSide;
};

export type TrackSpace = {
  /** Bottom → top. */
  stack: PieceColour[];
  modifier?: TrackModifier;
};

export type PlayerState = {
  seat: PlayerSeat;
  points: number;
  legBets: LegBet[];
  /** Dice tokens taken this leg (each worth +1 at leg scoring). */
  diceCount: number;
  raceBetsRemaining: PieceColour[];
  /** Present when the player's track modifier is not on the board. */
  modifierInHand: boolean;
};

export type GameState = {
  version: typeof ENGINE_VERSION;
  rngSeed: number;
  rngCursor: number;
  playerCount: number;
  activePlayer: PlayerSeat | null;
  startPlayerThisLeg: PlayerSeat | null;
  phase: GamePhase;
  /** Index 0 unused; spaces 1..16 at indices 1..16. */
  track: TrackSpace[];
  /** Piece colours still in the hidden dice pool this leg. */
  dicePool: PieceColour[];
  /** Revealed (used) dice this leg, in reveal order. */
  diceUsed: PieceColour[];
  /** Per colour, remaining winner-bet values top-first. */
  legWinnerBets: Record<PieceColour, WinnerBetValue[]>;
  /** Per colour, whether the midfield bet is still available. */
  legMidfieldBets: Record<PieceColour, boolean>;
  /** Take-dice supply remaining this leg (0..5). */
  diceRemaining: number;
  players: PlayerState[];
  raceWinnerPile: RaceBetPileEntry[];
  raceLoserPile: RaceBetPileEntry[];
  /** Player-facing history lines (glossary terms only). */
  history: string[];
};
