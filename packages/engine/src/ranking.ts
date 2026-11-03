import type { PieceColour } from './constants.js';
import type { GameState } from './types.js';

export type PieceRank = {
  colour: PieceColour;
  /** 1 = lead … 5 = last. */
  rank: number;
};

/**
 * Overall ranking lead-first: crossed finishers first (already lead-first),
 * then on-track pieces by higher space, then higher in stack.
 */
export function rankPiecesLeadFirst(state: GameState): PieceColour[] {
  type OnTrack = { colour: PieceColour; space: number; height: number };
  const onTrack: OnTrack[] = [];

  for (let space = 0; space < state.track.length; space += 1) {
    const stack = state.track[space]!.stack;
    for (let height = 0; height < stack.length; height += 1) {
      onTrack.push({ colour: stack[height]!, space, height });
    }
  }

  onTrack.sort((a, b) => {
    if (a.space !== b.space) {
      return b.space - a.space;
    }
    return b.height - a.height;
  });

  return [...state.crossedFinish, ...onTrack.map((entry) => entry.colour)];
}

/** Map each piece colour to its 1-based rank (1 = lead). */
export function ranksByColour(state: GameState): Record<PieceColour, number> {
  const order = rankPiecesLeadFirst(state);
  const ranks = {} as Record<PieceColour, number>;
  order.forEach((colour, index) => {
    ranks[colour] = index + 1;
  });
  return ranks;
}
