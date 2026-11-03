import {
  DICE_PER_LEG,
  LEG_DICE_TOKEN_PAYOUT,
  LEG_MIDFIELD_PAYOUT_BY_RANK,
  LEG_WINNER_OTHER_PENALTY,
  LEG_WINNER_SECOND_PAYOUT,
  PIECE_COLOURS,
  RACE_BET_CORRECT_PAYOUTS,
  RACE_BET_WRONG_PENALTY,
  initialLegMidfieldBets,
  initialLegWinnerBets,
  type PieceColour,
  type PlayerSeat,
} from './constants.js';
import { ranksByColour, rankPiecesLeadFirst } from './ranking.js';
import type { GameState, PlayerState } from './types.js';

function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function addPoints(player: PlayerState, delta: number): void {
  player.points = Math.max(0, player.points + delta);
}

function playerBySeat(state: GameState, seat: PlayerSeat): PlayerState {
  const player = state.players.find((entry) => entry.seat === seat);
  if (player == null) {
    throw new Error(`Missing player ${seat}`);
  }
  return player;
}

function nextSeat(state: GameState, current: PlayerSeat): PlayerSeat {
  const seats = state.players.map((player) => player.seat);
  const index = seats.indexOf(current);
  return seats[(index + 1) % seats.length]!;
}

/** Apply leg-bet and dice-token payouts for the current leg. */
export function applyLegScoring(state: GameState): GameState {
  const next = cloneState(state);
  const ranks = ranksByColour(next);

  for (const player of next.players) {
    for (const bet of player.legBets) {
      const rank = ranks[bet.colour];
      if (bet.kind === 'winner') {
        if (rank === 1) {
          addPoints(player, bet.value);
        } else if (rank === 2) {
          addPoints(player, LEG_WINNER_SECOND_PAYOUT);
        } else {
          addPoints(player, -LEG_WINNER_OTHER_PENALTY);
        }
      } else {
        const payout =
          LEG_MIDFIELD_PAYOUT_BY_RANK[
            rank as keyof typeof LEG_MIDFIELD_PAYOUT_BY_RANK
          ];
        addPoints(player, payout);
      }
    }

    addPoints(player, player.diceCount * LEG_DICE_TOKEN_PAYOUT);
  }

  const lead = rankPiecesLeadFirst(next)[0];
  next.history.push(
    `Leg scored. Lead: ${lead}.`,
  );
  return next;
}

function scoreRacePile(
  state: GameState,
  pile: { player: PlayerSeat; colour: PieceColour }[],
  actual: PieceColour,
  label: 'winner' | 'loser',
): void {
  let correctIndex = 0;
  for (const entry of pile) {
    const player = playerBySeat(state, entry.player);
    if (entry.colour === actual) {
      const payout =
        RACE_BET_CORRECT_PAYOUTS[
          Math.min(correctIndex, RACE_BET_CORRECT_PAYOUTS.length - 1)
        ]!;
      addPoints(player, payout);
      correctIndex += 1;
    } else {
      addPoints(player, -RACE_BET_WRONG_PENALTY);
    }
  }
  state.history.push(
    `Overall ${label} is ${actual}.`,
  );
}

/** Score overall winner/loser race-bet piles. */
export function applyRaceBetScoring(state: GameState): GameState {
  const next = cloneState(state);
  const order = rankPiecesLeadFirst(next);
  const winner = order[0]!;
  const loser = order[order.length - 1]!;

  scoreRacePile(next, next.raceWinnerPile, winner, 'winner');
  scoreRacePile(next, next.raceLoserPile, loser, 'loser');
  return next;
}

/** Reset leg markets, dice, modifiers, and player leg holdings. */
export function cleanupAfterLeg(state: GameState): GameState {
  const next = cloneState(state);

  next.legWinnerBets = initialLegWinnerBets();
  next.legMidfieldBets = initialLegMidfieldBets();
  next.diceRemaining = DICE_PER_LEG;
  next.dicePool = [...PIECE_COLOURS];
  next.diceUsed = [];

  for (const space of next.track) {
    delete space.modifier;
  }
  for (const player of next.players) {
    player.legBets = [];
    player.diceCount = 0;
    player.modifierInHand = true;
  }

  return next;
}

/**
 * End-of-leg resolution: pass start marker, score, cleanup, resume turns.
 */
export function resolveLegEnd(state: GameState): GameState {
  let next = cloneState(state);
  const previousActive = next.activePlayer;
  if (previousActive == null) {
    throw new Error('resolveLegEnd requires an active player');
  }

  next.startPlayerThisLeg = nextSeat(next, previousActive);
  next = applyLegScoring(next);
  next = cleanupAfterLeg(next);
  next.activePlayer = next.startPlayerThisLeg;
  next.phase = 'turn';
  next.history.push(
    `New leg. Player ${next.activePlayer} begins.`,
  );
  return next;
}

/**
 * Race end: final leg scoring, then race-bet scoring, then game over.
 */
export function resolveRaceEnd(state: GameState): GameState {
  let next = applyLegScoring(state);
  next = applyRaceBetScoring(next);
  next.phase = 'game_over';

  const top = Math.max(...next.players.map((player) => player.points));
  const winners = next.players
    .filter((player) => player.points === top)
    .map((player) => player.seat);
  next.history.push(
    winners.length === 1
      ? `Game over. Player ${winners[0]} wins with ${top} points.`
      : `Game over. Shared victory: ${winners.join(', ')} with ${top} points.`,
  );
  return next;
}
