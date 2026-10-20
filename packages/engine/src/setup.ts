import {
  DICE_PER_LEG,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PIECE_COLOURS,
  PLAYER_SEATS,
  STARTING_POINTS,
  initialLegMidfieldBets,
  initialLegWinnerBets,
  uiSpaceLabel,
  type PieceColour,
} from './constants.js';
import {
  createRng,
  nextDieFace,
  nextInt,
  type RngState,
} from './rng.js';
import { createEmptyGameState } from './state.js';
import type { GameState, PlayerState } from './types.js';

export type CreateGameOptions = {
  playerCount: number;
  rngSeed: number;
};

function assertPlayerCount(playerCount: number): void {
  if (
    !Number.isInteger(playerCount) ||
    playerCount < MIN_PLAYERS ||
    playerCount > MAX_PLAYERS
  ) {
    throw new RangeError(
      `playerCount must be an integer from ${MIN_PLAYERS} to ${MAX_PLAYERS}`,
    );
  }
}

function createPlayers(playerCount: number): PlayerState[] {
  return PLAYER_SEATS.slice(0, playerCount).map((seat) => ({
    seat,
    points: STARTING_POINTS,
    legBets: [],
    diceCount: 0,
    raceBetsRemaining: [...PIECE_COLOURS],
    modifierInHand: true,
  }));
}

/**
 * Draw one die colour from the pool (uniform among remaining), then remove it.
 */
function drawDieColour(
  rng: RngState,
  pool: PieceColour[],
): { colour: PieceColour; pool: PieceColour[]; rng: RngState } {
  const { value: index, rng: rngAfterPick } = nextInt(rng, pool.length);
  const colour = pool[index]!;
  const nextPool = pool.filter((_, i) => i !== index);
  return { colour, pool: nextPool, rng: rngAfterPick };
}

/**
 * Place a piece that conceptually starts at index -1, moving forward by `face`.
 * Lands on top of any existing stack.
 */
function placeFromOffTrack(
  state: GameState,
  colour: PieceColour,
  face: number,
): number {
  const destination = -1 + face;
  state.track[destination]!.stack.push(colour);
  return destination;
}

/**
 * Start a new game: players, markets, setup rolls (draw → roll → place),
 * then refill the dice pool for the first leg. Player A always begins.
 */
export function createGame(options: CreateGameOptions): GameState {
  assertPlayerCount(options.playerCount);

  const state = createEmptyGameState(options.rngSeed);
  let rng = createRng(options.rngSeed);

  state.playerCount = options.playerCount;
  state.players = createPlayers(options.playerCount);
  state.activePlayer = 'A';
  state.startPlayerThisLeg = 'A';
  state.phase = 'turn';
  state.legWinnerBets = initialLegWinnerBets();
  state.legMidfieldBets = initialLegMidfieldBets();
  state.diceRemaining = DICE_PER_LEG;

  state.history.push(
    `Game started with ${options.playerCount} players. Player A begins.`,
  );

  let pool: PieceColour[] = [...PIECE_COLOURS];
  for (let i = 0; i < PIECE_COLOURS.length; i += 1) {
    const drawn = drawDieColour(rng, pool);
    rng = drawn.rng;
    pool = drawn.pool;

    const rolled = nextDieFace(rng);
    rng = rolled.rng;

    const destination = placeFromOffTrack(state, drawn.colour, rolled.value);
    state.history.push(
      `Setup: ${drawn.colour} rolled ${rolled.value} to space ${uiSpaceLabel(destination)}.`,
    );
  }

  // Return all dice to the hidden pool for the first leg.
  state.dicePool = [...PIECE_COLOURS];
  state.diceUsed = [];
  state.rngCursor = rng.cursor;

  return state;
}
