import { describe, expect, it } from 'vitest';
import { createEmptyGameState } from './state.js';
import { movePieceForward } from './move.js';
import type { GameState } from './types.js';

function boardWith(setup: (state: GameState) => void): GameState {
  const state = createEmptyGameState(1);
  state.players = [
    {
      seat: 'A',
      points: 3,
      legBets: [],
      diceCount: 0,
      raceBetsRemaining: [],
      modifierInHand: true,
    },
    {
      seat: 'B',
      points: 3,
      legBets: [],
      diceCount: 0,
      raceBetsRemaining: [],
      modifierInHand: true,
    },
  ];
  setup(state);
  return state;
}

describe('movePieceForward', () => {
  it('moves a piece forward and stacks on top', () => {
    const state = boardWith((draft) => {
      draft.track[1]!.stack = ['blue'];
      draft.track[3]!.stack = ['green'];
    });

    const result = movePieceForward(state, 'blue', 2);
    expect(result.finished).toBe(false);
    expect(result.destination).toBe(3);
    expect(result.state.track[1]!.stack).toEqual([]);
    expect(result.state.track[3]!.stack).toEqual(['green', 'blue']);
  });

  it('carries pieces stacked above the moved colour', () => {
    const state = boardWith((draft) => {
      draft.track[0]!.stack = ['yellow', 'blue', 'white'];
    });

    const result = movePieceForward(state, 'blue', 1);
    expect(result.state.track[0]!.stack).toEqual(['yellow']);
    expect(result.state.track[1]!.stack).toEqual(['blue', 'white']);
  });

  it('applies jump: +1 forward on top and pays the owner', () => {
    const state = boardWith((draft) => {
      draft.track[2]!.stack = ['orange'];
      draft.track[4]!.modifier = { owner: 'B', side: 'jump' };
      draft.track[5]!.stack = ['green'];
    });

    const result = movePieceForward(state, 'orange', 2);
    expect(result.destination).toBe(5);
    expect(result.state.track[4]!.stack).toEqual([]);
    expect(result.state.track[5]!.stack).toEqual(['green', 'orange']);
    expect(result.state.players[1]?.points).toBe(4);
  });

  it('applies fall back: -1 under the stack and pays the owner', () => {
    const state = boardWith((draft) => {
      draft.track[2]!.stack = ['white'];
      draft.track[3]!.stack = ['blue'];
      draft.track[4]!.modifier = { owner: 'A', side: 'fall_back' };
    });

    const result = movePieceForward(state, 'white', 2);
    expect(result.destination).toBe(3);
    expect(result.state.track[4]!.stack).toEqual([]);
    expect(result.state.track[3]!.stack).toEqual(['white', 'blue']);
    expect(result.state.players[0]?.points).toBe(4);
  });

  it('marks finished when movement passes the last space', () => {
    const state = boardWith((draft) => {
      draft.track[14]!.stack = ['yellow', 'blue', 'white'];
    });

    const result = movePieceForward(state, 'blue', 3);
    expect(result.finished).toBe(true);
    expect(result.destination).toBeNull();
    expect(result.state.track[14]!.stack).toEqual(['yellow']);
    // Lead-first among the finishing unit: top of stack first.
    expect(result.state.crossedFinish).toEqual(['white', 'blue']);
  });
});
