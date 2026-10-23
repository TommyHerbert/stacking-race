import { describe, expect, it } from 'vitest';
import {
  DICE_PER_LEG,
  LEG_WINNER_BET_STACK,
  PIECE_COLOURS,
  TRACK_SPACE_COUNT,
  createGame,
} from './index.js';

describe('createGame', () => {
  it('is deterministic for a fixed seed', () => {
    const a = createGame({ playerCount: 3, rngSeed: 12345 });
    const b = createGame({ playerCount: 3, rngSeed: 12345 });

    expect(a.track).toEqual(b.track);
    expect(a.rngCursor).toBe(b.rngCursor);
    expect(a.history).toEqual(b.history);
  });

  it('places each piece once, refills dice, and starts player A', () => {
    const state = createGame({ playerCount: 4, rngSeed: 99 });

    const placed = state.track.flatMap((space) => space.stack);
    expect(placed).toHaveLength(PIECE_COLOURS.length);
    expect(new Set(placed)).toEqual(new Set(PIECE_COLOURS));

    // From index -1, faces 1..3 only reach spaces 0..2.
    for (let i = 3; i < TRACK_SPACE_COUNT; i += 1) {
      expect(state.track[i]?.stack).toEqual([]);
    }

    expect(state.players).toHaveLength(4);
    expect(state.phase).toBe('turn');
    expect(state.activePlayer).toBe('A');
    expect(state.startPlayerThisLeg).toBe('A');
    expect(state.dicePool).toEqual([...PIECE_COLOURS]);
    expect(state.diceUsed).toEqual([]);
    expect(state.diceRemaining).toBe(DICE_PER_LEG);
    expect(state.legWinnerBets.blue).toEqual([...LEG_WINNER_BET_STACK]);
    expect(state.legMidfieldBets.white).toBe(true);
  });
});
