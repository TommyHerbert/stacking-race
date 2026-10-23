import { describe, expect, it } from 'vitest';
import {
  IllegalActionError,
  PIECE_COLOURS,
  apply,
  createGame,
  legalActions,
} from './index.js';

describe('legalActions / apply (unimplemented families)', () => {
  it('rejects action families that are not implemented yet', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    expect(() => apply(state, { type: 'take_dice' })).toThrow(IllegalActionError);
    expect(() =>
      apply(state, {
        type: 'place_modifier',
        space: 2,
        side: 'jump',
      }),
    ).toThrow(IllegalActionError);
  });
});

describe('take leg bet', () => {
  it('lists all available winner and midfield bets at leg start', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    const legal = legalActions(state);

    expect(legal).toEqual(
      PIECE_COLOURS.flatMap((colour) => [
        { type: 'take_winner_bet', colour },
        { type: 'take_midfield_bet', colour },
      ]),
    );
  });

  it('takes the top winner bet, records history, and advances the turn', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    const next = apply(state, { type: 'take_winner_bet', colour: 'blue' });

    expect(state.legWinnerBets.blue).toEqual([5, 3, 2, 2]);
    expect(next.legWinnerBets.blue).toEqual([3, 2, 2]);
    expect(next.players[0]?.legBets).toEqual([
      { kind: 'winner', colour: 'blue', value: 5 },
    ]);
    expect(next.activePlayer).toBe('B');
    expect(next.history.at(-1)).toBe(
      'Player A took blue winner bet (5).',
    );
  });

  it('takes a midfield bet once, then removes it from legal actions', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    const afterA = apply(state, { type: 'take_midfield_bet', colour: 'green' });

    expect(afterA.legMidfieldBets.green).toBe(false);
    expect(afterA.players[0]?.legBets).toEqual([
      { kind: 'midfield', colour: 'green' },
    ]);
    expect(afterA.activePlayer).toBe('B');

    const legalForB = legalActions(afterA);
    expect(legalForB).not.toContainEqual({
      type: 'take_midfield_bet',
      colour: 'green',
    });
    expect(() =>
      apply(afterA, { type: 'take_midfield_bet', colour: 'green' }),
    ).toThrow(IllegalActionError);
  });
});
