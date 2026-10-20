import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  PIECE_COLOURS,
  TRACK_SPACE_COUNT,
  type PieceColour,
} from './constants.js';
import { ENGINE_VERSION } from './version.js';
import type { GameState } from './types.js';

export class GameStateParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameStateParseError';
  }
}

function isPieceColour(value: unknown): value is PieceColour {
  return (
    typeof value === 'string' &&
    (PIECE_COLOURS as readonly string[]).includes(value)
  );
}

function assertGameStateShape(value: unknown): asserts value is GameState {
  if (value === null || typeof value !== 'object') {
    throw new GameStateParseError('Game state must be an object');
  }

  const state = value as GameState;

  if (state.version !== ENGINE_VERSION) {
    throw new GameStateParseError(
      `Unsupported engine version: ${String(state.version)}`,
    );
  }

  if (
    !Number.isInteger(state.playerCount) ||
    state.playerCount < MIN_PLAYERS ||
    state.playerCount > MAX_PLAYERS
  ) {
    throw new GameStateParseError('Invalid playerCount');
  }

  if (!Array.isArray(state.track) || state.track.length !== TRACK_SPACE_COUNT) {
    throw new GameStateParseError(
      `Track must have ${TRACK_SPACE_COUNT} spaces`,
    );
  }

  if (!Array.isArray(state.players) || state.players.length !== state.playerCount) {
    throw new GameStateParseError('players length must match playerCount');
  }

  if (!Array.isArray(state.dicePool) || !state.dicePool.every(isPieceColour)) {
    throw new GameStateParseError('Invalid dicePool');
  }

  if (!Array.isArray(state.history)) {
    throw new GameStateParseError('history must be an array');
  }
}

/** JSON snapshot of a game (for the continue slot / debugging). */
export function serializeGameState(state: GameState): string {
  return JSON.stringify(state);
}

/** Parse and lightly validate a JSON game snapshot. */
export function deserializeGameState(json: string): GameState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new GameStateParseError('Invalid JSON');
  }

  assertGameStateShape(parsed);

  // Round-trip through JSON again so callers get a detached deep copy.
  return JSON.parse(JSON.stringify(parsed)) as GameState;
}
