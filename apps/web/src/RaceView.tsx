import {
  type Action,
  type GameState,
  type PieceColour,
} from '@stacking-race/engine';
import { PIECE_CLASS, shortColour } from './pieceStyle';

type RaceViewProps = {
  game: GameState;
  legal: Action[];
  onAction: (action: Action) => void;
};

function isLegal(legal: Action[], action: Action): boolean {
  return legal.some((entry) => JSON.stringify(entry) === JSON.stringify(action));
}

export function RaceView({ game, legal, onAction }: RaceViewProps) {
  const active =
    game.players.find((player) => player.seat === game.activePlayer) ?? null;

  return (
    <section class="game-race zone" aria-label="Race">
      <h2 class="zone-title">Race</h2>
      <div class="split-row">
        <div class="split-pane">
          <h3 class="pane-title">Hand</h3>
          <div class="chip-row">
            {active == null && <p class="zone-empty">—</p>}
            {active?.raceBetsRemaining.map((colour) => (
              <RaceBetChip
                key={colour}
                colour={colour}
                legal={legal}
                onAction={onAction}
              />
            ))}
            {active != null && active.raceBetsRemaining.length === 0 && (
              <p class="zone-empty">empty</p>
            )}
          </div>
        </div>

        <div class="split-pane">
          <h3 class="pane-title">Stacks</h3>
          <div class="chip-row">
            <span class="chip static">W×{game.raceWinnerPile.length}</span>
            <span class="chip static">L×{game.raceLoserPile.length}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

type RaceBetChipProps = {
  colour: PieceColour;
  legal: Action[];
  onAction: (action: Action) => void;
};

function RaceBetChip({ colour, legal, onAction }: RaceBetChipProps) {
  const win: Action = {
    type: 'place_race_bet',
    colour,
    target: 'winner',
  };
  const lose: Action = {
    type: 'place_race_bet',
    colour,
    target: 'loser',
  };
  const canWin = isLegal(legal, win);
  const canLose = isLegal(legal, lose);

  return (
    <div class="race-bet">
      <div class={PIECE_CLASS[colour]} title={colour} />
      <button
        type="button"
        class="chip action"
        disabled={!canWin}
        onClick={() => onAction(win)}
      >
        {shortColour(colour)}W
      </button>
      <button
        type="button"
        class="chip action"
        disabled={!canLose}
        onClick={() => onAction(lose)}
      >
        {shortColour(colour)}L
      </button>
    </div>
  );
}
