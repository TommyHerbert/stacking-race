import { describe, expect, it } from 'vitest';
import {
  IllegalActionError,
  apply,
  createGame,
  legalActions,
} from './index.js';

describe('actions stub', () => {
  it('lists no legal actions yet during a turn', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    expect(state.phase).toBe('turn');
    expect(legalActions(state)).toEqual([]);
  });

  it('rejects apply until action families are implemented', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    expect(() => apply(state, { type: 'take_dice' })).toThrow(IllegalActionError);
    expect(() =>
      apply(state, { type: 'take_winner_bet', colour: 'blue' }),
    ).toThrow(IllegalActionError);
  });
});
