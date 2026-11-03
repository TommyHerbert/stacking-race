import {
  PIECE_COLOURS,
  TRACK_SPACE_COUNT,
  uiSpaceLabel,
  type PieceColour,
  type PlayerSeat,
} from './constants.js';
import type { GameState, TrackModifierSide } from './types.js';

/**
 * Player-chosen turn actions.
 * Implemented: take leg bets, place/move track modifier.
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

function findModifierSpace(state: GameState, owner: PlayerSeat): number | null {
  for (let space = 0; space < state.track.length; space += 1) {
    if (state.track[space]?.modifier?.owner === owner) {
      return space;
    }
  }
  return null;
}

/**
 * Whether `space` may receive a track modifier, assuming the active player's
 * existing modifier (if any) has already been conceptually removed.
 */
function isLegalModifierSpace(state: GameState, space: number): boolean {
  if (!Number.isInteger(space) || space < 1 || space >= TRACK_SPACE_COUNT) {
    return false;
  }

  const cell = state.track[space];
  if (cell == null || cell.stack.length > 0 || cell.modifier != null) {
    return false;
  }

  const left = state.track[space - 1];
  const right = state.track[space + 1];
  if (left?.modifier != null || right?.modifier != null) {
    return false;
  }

  return true;
}

function boardWithoutOwnerModifier(
  state: GameState,
  owner: PlayerSeat,
): GameState {
  const cleared = cloneState(state);
  const existing = findModifierSpace(cleared, owner);
  if (existing != null) {
    delete cleared.track[existing]!.modifier;
  }
  return cleared;
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

function legalModifierActions(state: GameState): Action[] {
  const seat = state.activePlayer;
  if (seat == null) {
    return [];
  }

  const board = boardWithoutOwnerModifier(state, seat);
  const actions: Action[] = [];
  const sides: TrackModifierSide[] = ['jump', 'fall_back'];

  for (let space = 1; space < TRACK_SPACE_COUNT; space += 1) {
    if (!isLegalModifierSpace(board, space)) {
      continue;
    }
    for (const side of sides) {
      actions.push({ type: 'place_modifier', space, side });
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

  return [...legalLegBetActions(state), ...legalModifierActions(state)];
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

function sideLabel(side: TrackModifierSide): string {
  return side === 'jump' ? 'jump' : 'fall back';
}

function applyPlaceModifier(
  state: GameState,
  space: number,
  side: TrackModifierSide,
): GameState {
  const next = cloneState(state);
  const player = activePlayerState(next);
  const previous = findModifierSpace(next, player.seat);
  if (previous != null) {
    delete next.track[previous]!.modifier;
  }

  // Re-check on the post-removal board (mirrors legalActions).
  if (!isLegalModifierSpace(next, space)) {
    throw new IllegalActionError(`Illegal modifier space ${space}`);
  }

  next.track[space]!.modifier = { owner: player.seat, side };
  player.modifierInHand = false;

  const verb = previous == null ? 'placed' : 'moved';
  next.history.push(
    `Player ${player.seat} ${verb} ${sideLabel(side)} modifier on space ${uiSpaceLabel(space)}.`,
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
    case 'place_modifier':
      return applyPlaceModifier(state, action.space, action.side);
    default:
      throw new IllegalActionError(`Unhandled action: ${action.type}`);
  }
}
