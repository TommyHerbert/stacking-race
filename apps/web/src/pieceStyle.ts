import type { PieceColour } from '@stacking-race/engine';

export const PIECE_CLASS: Record<PieceColour, string> = {
  blue: 'piece piece-blue',
  green: 'piece piece-green',
  orange: 'piece piece-orange',
  yellow: 'piece piece-yellow',
  white: 'piece piece-white',
};

export function shortColour(colour: PieceColour): string {
  return colour[0]!.toUpperCase();
}
