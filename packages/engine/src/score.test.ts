import { describe, expect, it } from 'vitest';
import {
  applyLegScoring,
  applyRaceBetScoring,
  createEmptyGameState,
  rankPiecesLeadFirst,
  resolveLegEnd,
  resolveRaceEnd,
} from './index.js';
import type { GameState } from './types.js';

function scoredBoard(setup: (state: GameState) => void): GameState {
  const state = createEmptyGameState(1);
  state.phase = 'turn';
  state.activePlayer = 'A';
  state.startPlayerThisLeg = 'A';
  state.diceRemaining = 0;
  state.players = [
    {
      seat: 'A',
      points: 3,
      legBets: [],
      diceCount: 0,
      raceBetsRemaining: [],
      modifierInHand: false,
    },
    {
      seat: 'B',
      points: 1,
      legBets: [],
      diceCount: 0,
      raceBetsRemaining: [],
      modifierInHand: false,
    },
  ];
  setup(state);
  return state;
}

describe('rankPiecesLeadFirst', () => {
  it('orders by space then stack height, with crossed finishers first', () => {
    const state = scoredBoard((draft) => {
      draft.crossedFinish = ['white'];
      draft.track[5]!.stack = ['yellow', 'blue'];
      draft.track[3]!.stack = ['orange', 'green'];
    });

    expect(rankPiecesLeadFirst(state)).toEqual([
      'white',
      'blue',
      'yellow',
      'green',
      'orange',
    ]);
  });
});

describe('applyLegScoring', () => {
  it('pays winner, midfield, and dice tokens with a zero floor', () => {
    const state = scoredBoard((draft) => {
      draft.track[4]!.stack = ['blue'];
      draft.track[3]!.stack = ['green'];
      draft.track[2]!.stack = ['orange'];
      draft.track[1]!.stack = ['yellow'];
      draft.track[0]!.stack = ['white'];
      draft.players[0]!.legBets = [
        { kind: 'winner', colour: 'blue', value: 5 },
        { kind: 'midfield', colour: 'orange' },
        { kind: 'winner', colour: 'white', value: 2 },
      ];
      draft.players[0]!.diceCount = 2;
      draft.players[1]!.points = 0;
      draft.players[1]!.legBets = [
        { kind: 'winner', colour: 'white', value: 3 },
      ];
    });

    const next = applyLegScoring(state);
    // A: +5 (blue 1st) +2 (orange 3rd midfield) -1 (white 5th winner) +2 dice = +8 → 11
    expect(next.players[0]?.points).toBe(11);
    // B: -1 on white but floored at 0
    expect(next.players[1]?.points).toBe(0);
  });
});

describe('applyRaceBetScoring', () => {
  it('pays correct race bets in place order and penalises misses', () => {
    const state = scoredBoard((draft) => {
      draft.track[2]!.stack = ['blue'];
      draft.track[0]!.stack = ['white'];
      draft.track[1]!.stack = ['green', 'orange', 'yellow'];
      draft.raceWinnerPile = [
        { player: 'A', colour: 'blue' },
        { player: 'B', colour: 'green' },
        { player: 'A', colour: 'blue' },
      ];
      draft.raceLoserPile = [
        { player: 'B', colour: 'white' },
        { player: 'A', colour: 'blue' },
      ];
    });

    const next = applyRaceBetScoring(state);
    // Winner blue: A gets 8 then 5; B -1 on green
    // Loser white: B gets 8; A -1 on blue
    // A: 3+8+5-1 = 15; B: 1-1+8 = 8
    expect(next.players[0]?.points).toBe(15);
    expect(next.players[1]?.points).toBe(8);
  });
});

describe('resolveLegEnd / resolveRaceEnd', () => {
  it('passes the start marker, cleans markets, and resumes the next leg', () => {
    const state = scoredBoard((draft) => {
      draft.activePlayer = 'B';
      draft.startPlayerThisLeg = 'A';
      // Bottom → top: blue is lead.
      draft.track[1]!.stack = ['white', 'yellow', 'orange', 'green', 'blue'];
      draft.track[3]!.modifier = { owner: 'A', side: 'jump' };
      draft.players[0]!.legBets = [
        { kind: 'winner', colour: 'blue', value: 5 },
      ];
      draft.players[0]!.diceCount = 1;
      draft.diceRemaining = 0;
      draft.dicePool = [];
      draft.diceUsed = ['blue', 'green', 'orange', 'yellow', 'white'];
    });

    const next = resolveLegEnd(state);
    expect(next.phase).toBe('turn');
    expect(next.startPlayerThisLeg).toBe('A');
    expect(next.activePlayer).toBe('A');
    expect(next.diceRemaining).toBe(5);
    expect(next.legWinnerBets.blue).toEqual([5, 3, 2, 2]);
    expect(next.track[3]?.modifier).toBeUndefined();
    expect(next.players[0]?.modifierInHand).toBe(true);
    expect(next.players[0]?.legBets).toEqual([]);
    expect(next.players[0]?.points).toBe(3 + 5 + 1);
  });

  it('ends the game after final leg scoring and race bets', () => {
    const state = scoredBoard((draft) => {
      draft.crossedFinish = ['blue'];
      draft.track[0]!.stack = ['white'];
      draft.track[1]!.stack = ['green', 'orange', 'yellow'];
      draft.players[0]!.diceCount = 1;
      draft.raceWinnerPile = [{ player: 'A', colour: 'blue' }];
      draft.raceLoserPile = [{ player: 'B', colour: 'white' }];
    });

    const next = resolveRaceEnd(state);
    expect(next.phase).toBe('game_over');
    // A: 3 +1 dice +8 race winner = 12; B: 1 +8 race loser = 9
    expect(next.players[0]?.points).toBe(12);
    expect(next.players[1]?.points).toBe(9);
    expect(next.history.at(-1)).toContain('Player A wins');
  });
});
