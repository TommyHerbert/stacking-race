import type { PieceColour } from './constants.js';
import type { GameState, TrackModifierSide } from './types.js';

/**
 * Player-chosen turn actions.
 * Families are filled in by later commits; the stub returns none as legal.
 */
export type Action =
  | { type: 'take_winner_bet'; colour: PieceColour }
  | { type: 'take_midfield_bet'; colour: PieceColour }
  | { type: 'place_modifier'; space: number; side: TrackModifierSide }
  | { type: 'take_dice' }
  | {
      type: 'place_race_bet';
      colour: PieceColour;
      target: 'winner' | 'loser';
    };

export class IllegalActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IllegalActionError';
  }
}

function sameAction(a: Action, b: Action): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Legal actions for the active player in the current phase.
 * Stub: no action families implemented yet.
 */
export function legalActions(state: GameState): Action[] {
  if (state.phase !== 'turn' || state.activePlayer == null) {
    return [];
  }

  // Intentionally empty until take-bet / modifier / dice / race-bet land.
  return [];
}

/**
 * Apply one legal action, returning a new state.
 * Stub: rejects every action because `legalActions` is empty.
 */
export function apply(state: GameState, action: Action): GameState {
  const legal = legalActions(state);
  if (!legal.some((candidate) => sameAction(candidate, action))) {
    throw new IllegalActionError(
      `Illegal or unimplemented action: ${action.type}`,
    );
  }

  // Reachable only once a family is implemented and listed as legal.
  throw new IllegalActionError(`Unhandled action: ${action.type}`);
}
