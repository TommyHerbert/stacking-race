import {
  MODIFIER_PAYOUT,
  TRACK_SPACE_COUNT,
  uiSpaceLabel,
  type PieceColour,
  type PlayerSeat,
} from './constants.js';
import type { GameState } from './types.js';

export type MoveResult = {
  state: GameState;
  /** True if the moving unit crossed past the last space. */
  finished: boolean;
  /** Final on-track index, or null if the unit finished off the board. */
  destination: number | null;
  /** Short description for history (no player seat). */
  summary: string;
};

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function findPiece(
  state: GameState,
  colour: PieceColour,
): { space: number; stackIndex: number } {
  for (let space = 0; space < state.track.length; space += 1) {
    const stackIndex = state.track[space]!.stack.indexOf(colour);
    if (stackIndex >= 0) {
      return { space, stackIndex };
    }
  }
  throw new Error(`Piece ${colour} not found on track`);
}

function grantModifierPayout(state: GameState, owner: PlayerSeat): void {
  const player = state.players.find((entry) => entry.seat === owner);
  if (player != null) {
    player.points += MODIFIER_PAYOUT;
  }
}

/**
 * Move `colour` forward by `steps`, carrying every piece stacked above it.
 * Resolves jump / fall-back on the landing space (at most one, by adjacency).
 */
export function movePieceForward(
  state: GameState,
  colour: PieceColour,
  steps: number,
): MoveResult {
  if (!Number.isInteger(steps) || steps <= 0) {
    throw new RangeError('steps must be a positive integer');
  }

  const next = cloneState(state);
  const { space: from, stackIndex } = findPiece(next, colour);
  const source = next.track[from]!;
  const moving = source.stack.splice(stackIndex);

  /** Lead-first among the moving unit (top of stack first). */
  const crossedLeadFirst = [...moving].reverse();

  let destination = from + steps;
  if (destination >= TRACK_SPACE_COUNT) {
    next.crossedFinish = [...crossedLeadFirst, ...next.crossedFinish];
    return {
      state: next,
      finished: true,
      destination: null,
      summary: `${colour} moved ${steps} from space ${uiSpaceLabel(from)} and finished`,
    };
  }

  const landing = next.track[destination]!;
  const modifier = landing.modifier;

  if (modifier?.side === 'jump') {
    grantModifierPayout(next, modifier.owner);
    destination += 1;
    if (destination >= TRACK_SPACE_COUNT) {
      next.crossedFinish = [...crossedLeadFirst, ...next.crossedFinish];
      return {
        state: next,
        finished: true,
        destination: null,
        summary: `${colour} moved ${steps} from space ${uiSpaceLabel(from)}, hit jump, and finished`,
      };
    }
    next.track[destination]!.stack.push(...moving);
    return {
      state: next,
      finished: false,
      destination,
      summary: `${colour} moved ${steps} from space ${uiSpaceLabel(from)} via jump to space ${uiSpaceLabel(destination)}`,
    };
  }

  if (modifier?.side === 'fall_back') {
    grantModifierPayout(next, modifier.owner);
    destination -= 1;
    // Modifiers cannot sit on space 0, so fall-back lands on >= 0.
    next.track[destination]!.stack.unshift(...moving);
    return {
      state: next,
      finished: false,
      destination,
      summary: `${colour} moved ${steps} from space ${uiSpaceLabel(from)} via fall back to space ${uiSpaceLabel(destination)}`,
    };
  }

  landing.stack.push(...moving);
  return {
    state: next,
    finished: false,
    destination,
    summary: `${colour} moved ${steps} from space ${uiSpaceLabel(from)} to space ${uiSpaceLabel(destination)}`,
  };
}
