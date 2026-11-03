import {
  TRACK_SPACE_COUNT,
  uiSpaceLabel,
  type Action,
  type GameState,
  type TrackModifierSide,
} from '@stacking-race/engine';
import { PIECE_CLASS } from './pieceStyle';

type TrackViewProps = {
  game: GameState;
  legal: Action[];
  onAction: (action: Action) => void;
};

function windowRange(game: GameState): { start: number; end: number } {
  let start = Number(TRACK_SPACE_COUNT);
  let end = -1;

  for (let space = 0; space < TRACK_SPACE_COUNT; space += 1) {
    const cell = game.track[space]!;
    if (cell.stack.length > 0 || cell.modifier != null) {
      start = Math.min(start, space);
      end = Math.max(end, space);
    }
  }

  if (end < 0) {
    return { start: 0, end: Math.min(2, TRACK_SPACE_COUNT - 1) };
  }

  return {
    start,
    end: Math.min(TRACK_SPACE_COUNT - 1, end + 2),
  };
}

export function TrackView({ game, legal, onAction }: TrackViewProps) {
  const { start, end } = windowRange(game);
  const spaces = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const placeable = new Map<number, TrackModifierSide[]>();
  for (const action of legal) {
    if (action.type !== 'place_modifier') {
      continue;
    }
    const sides = placeable.get(action.space) ?? [];
    sides.push(action.side);
    placeable.set(action.space, sides);
  }

  return (
    <section class="game-track zone" aria-label="Track">
      <h2 class="zone-title">Track</h2>
      {game.crossedFinish.length > 0 && (
        <p class="track-finished">
          Finished: {game.crossedFinish.join(', ')}
        </p>
      )}
      <div class="track-line">
        {spaces.map((space) => {
          const cell = game.track[space]!;
          const sides = placeable.get(space);
          return (
            <div class="track-space" key={space}>
              <div class="track-stack">
                {[...cell.stack].reverse().map((colour, index) => (
                  <div
                    key={`${colour}-${index}`}
                    class={PIECE_CLASS[colour]}
                    title={colour}
                  />
                ))}
                {cell.modifier != null && (
                  <div
                    class={`track-modifier side-${cell.modifier.side}`}
                    title={`${cell.modifier.owner} ${cell.modifier.side}`}
                  >
                    {cell.modifier.side === 'jump' ? '↗' : '↙'}
                    <span class="mod-owner">{cell.modifier.owner}</span>
                  </div>
                )}
              </div>
              <div class="track-label">{uiSpaceLabel(space)}</div>
              {sides != null && sides.length > 0 && (
                <div class="track-place">
                  {sides.includes('jump') && (
                    <button
                      type="button"
                      class="chip"
                      onClick={() =>
                        onAction({
                          type: 'place_modifier',
                          space,
                          side: 'jump',
                        })
                      }
                    >
                      ↗
                    </button>
                  )}
                  {sides.includes('fall_back') && (
                    <button
                      type="button"
                      class="chip"
                      onClick={() =>
                        onAction({
                          type: 'place_modifier',
                          space,
                          side: 'fall_back',
                        })
                      }
                    >
                      ↙
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
