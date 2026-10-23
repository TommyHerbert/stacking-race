import { PIECE_COLOURS, type PieceColour, type PlayerSeat } from './constants.js';
import type { GameState, TrackModifierSide } from './types.js';

/**
 * Player-chosen turn actions.
 * Implemented so far: take winner / midfield leg bets.
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

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function nextPlayer(state: GameState): PlayerSeat {
  const seats = state.players.map((player) => player.seat);
  const current = state.activePlayer;
  if (current == null) {
    throw new IllegalActionError('No active player');
  }
  const index = seats.indexOf(current);
  if (index < 0) {
    throw new IllegalActionError(`Active player ${current} not in players`);
  }
  return seats[(index + 1) % seats.length]!;
}

function activePlayerState(state: GameState) {
  const seat = state.activePlayer;
  if (seat == null) {
    throw new IllegalActionError('No active player');
  }
  const player = state.players.find((entry) => entry.seat === seat);
  if (player == null) {
    throw new IllegalActionError(`Missing player ${seat}`);
  }
  return player;
}

function legalLegBetActions(state: GameState): Action[] {
  const actions: Action[] = [];

  for (const colour of PIECE_COLOURS) {
    if (state.legWinnerBets[colour].length > 0) {
      actions.push({ type: 'take_winner_bet', colour });
    }
    if (state.legMidfieldBets[colour]) {
      actions.push({ type: 'take_midfield_bet', colour });
    }
  }

  return actions;
}

/**
 * Legal actions for the active player in the current phase.
 */
export function legalActions(state: GameState): Action[] {
  if (state.phase !== 'turn' || state.activePlayer == null) {
    return [];
  }

  return [...legalLegBetActions(state)];
}

function applyTakeWinnerBet(
  state: GameState,
  colour: PieceColour,
): GameState {
  const next = cloneState(state);
  const value = next.legWinnerBets[colour].shift();
  if (value == null) {
    throw new IllegalActionError(`No winner bet left for ${colour}`);
  }

  const player = activePlayerState(next);
  player.legBets.push({ kind: 'winner', colour, value });
  next.history.push(
    `Player ${player.seat} took ${colour} winner bet (${value}).`,
  );
  next.activePlayer = nextPlayer(next);
  return next;
}

function applyTakeMidfieldBet(
  state: GameState,
  colour: PieceColour,
): GameState {
  const next = cloneState(state);
  if (!next.legMidfieldBets[colour]) {
    throw new IllegalActionError(`No midfield bet left for ${colour}`);
  }

  next.legMidfieldBets[colour] = false;
  const player = activePlayerState(next);
  player.legBets.push({ kind: 'midfield', colour });
  next.history.push(
    `Player ${player.seat} took ${colour} midfield bet.`,
  );
  next.activePlayer = nextPlayer(next);
  return next;
}

/**
 * Apply one legal action, returning a new state.
 */
export function apply(state: GameState, action: Action): GameState {
  const legal = legalActions(state);
  if (!legal.some((candidate) => sameAction(candidate, action))) {
    throw new IllegalActionError(
      `Illegal or unimplemented action: ${action.type}`,
    );
  }

  switch (action.type) {
    case 'take_winner_bet':
      return applyTakeWinnerBet(state, action.colour);
    case 'take_midfield_bet':
      return applyTakeMidfieldBet(state, action.colour);
    default:
      throw new IllegalActionError(`Unhandled action: ${action.type}`);
  }
}
