import { describe, expect, it } from 'vitest';
import {
  IllegalActionError,
  PIECE_COLOURS,
  TRACK_SPACE_COUNT,
  apply,
  createGame,
  legalActions,
} from './index.js';

describe('take leg bet', () => {
  it('lists all available winner and midfield bets at leg start', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    const legBets = legalActions(state).filter(
      (action) =>
        action.type === 'take_winner_bet' || action.type === 'take_midfield_bet',
    );

    expect(legBets).toEqual(
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

describe('place modifier', () => {
  it('allows jump/fall back on empty non-first spaces that are free of adjacency', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    const modifierActions = legalActions(state).filter(
      (action) => action.type === 'place_modifier',
    );

    expect(modifierActions.length).toBeGreaterThan(0);
    expect(
      modifierActions.every(
        (action) =>
          action.type === 'place_modifier' &&
          action.space >= 1 &&
          action.space < TRACK_SPACE_COUNT,
      ),
    ).toBe(true);

    // Space 0 is never legal.
    expect(modifierActions).not.toContainEqual({
      type: 'place_modifier',
      space: 0,
      side: 'jump',
    });

    // Occupied spaces from setup are illegal.
    for (let space = 0; space < TRACK_SPACE_COUNT; space += 1) {
      if (state.track[space]!.stack.length === 0) {
        continue;
      }
      expect(modifierActions).not.toContainEqual({
        type: 'place_modifier',
        space,
        side: 'jump',
      });
    }
  });

  it('places a modifier from hand and advances the turn', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    const target = legalActions(state).find(
      (action) => action.type === 'place_modifier' && action.side === 'jump',
    );
    expect(target?.type).toBe('place_modifier');
    if (target?.type !== 'place_modifier') {
      throw new Error('expected a place_modifier action');
    }

    const next = apply(state, target);
    expect(next.track[target.space]?.modifier).toEqual({
      owner: 'A',
      side: 'jump',
    });
    expect(next.players[0]?.modifierInHand).toBe(false);
    expect(next.activePlayer).toBe('B');
    expect(next.history.at(-1)).toBe(
      `Player A placed jump modifier on space ${target.space + 1}.`,
    );
  });

  it('relocates an existing modifier and blocks adjacent spaces for others', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    const first = legalActions(state).find(
      (action) =>
        action.type === 'place_modifier' &&
        action.space === 5 &&
        action.side === 'fall_back',
    );
    expect(first).toEqual({
      type: 'place_modifier',
      space: 5,
      side: 'fall_back',
    });

    const afterA = apply(state, first!);
    expect(afterA.track[5]?.modifier).toEqual({
      owner: 'A',
      side: 'fall_back',
    });

    const legalForB = legalActions(afterA).filter(
      (action) => action.type === 'place_modifier',
    );
    expect(legalForB).not.toContainEqual({
      type: 'place_modifier',
      space: 4,
      side: 'jump',
    });
    expect(legalForB).not.toContainEqual({
      type: 'place_modifier',
      space: 5,
      side: 'jump',
    });
    expect(legalForB).not.toContainEqual({
      type: 'place_modifier',
      space: 6,
      side: 'jump',
    });

    // Player B places elsewhere, then on A's next turn relocating is allowed.
    const bPlace = legalForB.find(
      (action) => action.type === 'place_modifier' && action.space === 10,
    );
    expect(bPlace).toBeTruthy();
    const afterB = apply(afterA, bPlace!);

    const relocate = legalActions(afterB).find(
      (action) =>
        action.type === 'place_modifier' &&
        action.space === 8 &&
        action.side === 'jump',
    );
    expect(relocate).toBeTruthy();
    const afterRelocate = apply(afterB, relocate!);

    expect(afterRelocate.track[5]?.modifier).toBeUndefined();
    expect(afterRelocate.track[8]?.modifier).toEqual({
      owner: 'A',
      side: 'jump',
    });
    expect(afterRelocate.history.at(-1)).toBe(
      'Player A moved jump modifier on space 9.',
    );
  });
});

describe('take dice', () => {
  it('is legal while dice remain and is deterministic for a fixed seed', () => {
    const a = createGame({ playerCount: 2, rngSeed: 7 });
    const b = createGame({ playerCount: 2, rngSeed: 7 });

    expect(legalActions(a)).toContainEqual({ type: 'take_dice' });

    const afterA = apply(a, { type: 'take_dice' });
    const afterB = apply(b, { type: 'take_dice' });

    expect(afterA.track).toEqual(afterB.track);
    expect(afterA.dicePool).toEqual(afterB.dicePool);
    expect(afterA.diceUsed).toEqual(afterB.diceUsed);
    expect(afterA.rngCursor).toBe(afterB.rngCursor);
    expect(afterA.players[0]?.diceCount).toBe(1);
    expect(afterA.diceRemaining).toBe(4);
    expect(afterA.activePlayer).toBe('B');
  });

  it('enters leg_score after the fifth dice of the leg', () => {
    let state = createGame({ playerCount: 2, rngSeed: 3 });
    for (let i = 0; i < 4; i += 1) {
      state = apply(state, { type: 'take_dice' });
      expect(state.phase).toBe('turn');
    }

    state = apply(state, { type: 'take_dice' });
    expect(state.phase).toBe('leg_score');
    expect(state.diceRemaining).toBe(0);
    expect(state.dicePool).toEqual([]);
    expect(state.diceUsed).toHaveLength(5);
    expect(legalActions(state)).toEqual([]);
  });
});

describe('place race bet', () => {
  it('lists winner and loser placements for each held race bet', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    const raceBets = legalActions(state).filter(
      (action) => action.type === 'place_race_bet',
    );

    expect(raceBets).toEqual(
      PIECE_COLOURS.flatMap((colour) => [
        { type: 'place_race_bet', colour, target: 'winner' },
        { type: 'place_race_bet', colour, target: 'loser' },
      ]),
    );
  });

  it('places a race bet on the overall winner pile and advances the turn', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    const next = apply(state, {
      type: 'place_race_bet',
      colour: 'blue',
      target: 'winner',
    });

    expect(next.raceWinnerPile).toEqual([{ player: 'A', colour: 'blue' }]);
    expect(next.raceLoserPile).toEqual([]);
    expect(next.players[0]?.raceBetsRemaining).not.toContain('blue');
    expect(next.players[0]?.raceBetsRemaining).toHaveLength(4);
    expect(next.activePlayer).toBe('B');
    expect(next.history.at(-1)).toBe(
      'Player A placed blue race bet on overall winner.',
    );
  });

  it('cannot place the same colour twice once it has left the hand', () => {
    const state = createGame({ playerCount: 2, rngSeed: 1 });
    const afterA = apply(state, {
      type: 'place_race_bet',
      colour: 'orange',
      target: 'loser',
    });

    expect(afterA.raceLoserPile).toEqual([{ player: 'A', colour: 'orange' }]);
    expect(afterA.players[0]?.raceBetsRemaining).not.toContain('orange');

    // B's turn: B may still bet orange, but A no longer can.
    expect(legalActions(afterA)).toContainEqual({
      type: 'place_race_bet',
      colour: 'orange',
      target: 'winner',
    });

    const afterB = apply(afterA, {
      type: 'place_race_bet',
      colour: 'blue',
      target: 'winner',
    });
    expect(afterB.activePlayer).toBe('A');
    expect(legalActions(afterB)).not.toContainEqual({
      type: 'place_race_bet',
      colour: 'orange',
      target: 'winner',
    });
    expect(() =>
      apply(afterB, {
        type: 'place_race_bet',
        colour: 'orange',
        target: 'winner',
      }),
    ).toThrow(IllegalActionError);
  });
});
