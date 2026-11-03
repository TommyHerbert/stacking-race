import {
  PIECE_COLOURS,
  type Action,
  type GameState,
  type PieceColour,
} from '@stacking-race/engine';
import { PIECE_CLASS, shortColour } from './pieceStyle';

type LegViewProps = {
  game: GameState;
  legal: Action[];
  onAction: (action: Action) => void;
};

function isLegal(legal: Action[], action: Action): boolean {
  return legal.some((entry) => JSON.stringify(entry) === JSON.stringify(action));
}

export function LegView({ game, legal, onAction }: LegViewProps) {
  const active =
    game.players.find((player) => player.seat === game.activePlayer) ?? null;

  return (
    <section class="game-leg zone" aria-label="Leg">
      <h2 class="zone-title">Leg</h2>
      <div class="split-row">
        <div class="split-pane">
          <h3 class="pane-title">Hand</h3>
          <div class="chip-row">
            {active == null && <p class="zone-empty">—</p>}
            {active?.legBets.map((bet, index) => (
              <span class="chip static" key={`bet-${index}`}>
                {bet.kind === 'winner'
                  ? `${shortColour(bet.colour)}${bet.value}`
                  : `${shortColour(bet.colour)}M`}
              </span>
            ))}
            {active != null &&
              Array.from({ length: active.diceCount }, (_, index) => (
                <span class="chip static dice" key={`dice-${index}`}>
                  ▢
                </span>
              ))}
            {active?.modifierInHand && (
              <span class="chip static">tile</span>
            )}
            {active != null &&
              active.legBets.length === 0 &&
              active.diceCount === 0 &&
              !active.modifierInHand && (
                <p class="zone-empty">empty</p>
              )}
          </div>
        </div>

        <div class="split-pane">
          <h3 class="pane-title">Stacks</h3>
          <div class="market">
            {PIECE_COLOURS.map((colour) => (
              <ColourMarket
                key={colour}
                colour={colour}
                top={game.legWinnerBets[colour][0]}
                midfield={game.legMidfieldBets[colour]}
                legal={legal}
                onAction={onAction}
              />
            ))}
            <button
              type="button"
              class="chip action dice"
              disabled={!isLegal(legal, { type: 'take_dice' })}
              onClick={() => onAction({ type: 'take_dice' })}
            >
              dice×{game.diceRemaining}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

type ColourMarketProps = {
  colour: PieceColour;
  top: number | undefined;
  midfield: boolean;
  legal: Action[];
  onAction: (action: Action) => void;
};

function ColourMarket({
  colour,
  top,
  midfield,
  legal,
  onAction,
}: ColourMarketProps) {
  const takeWinner: Action = { type: 'take_winner_bet', colour };
  const takeMid: Action = { type: 'take_midfield_bet', colour };

  return (
    <div class="colour-market">
      <div class={PIECE_CLASS[colour]} title={colour} />
      <button
        type="button"
        class="chip action"
        disabled={top == null || !isLegal(legal, takeWinner)}
        onClick={() => onAction(takeWinner)}
      >
        {top ?? '—'}
      </button>
      <button
        type="button"
        class="chip action"
        disabled={!midfield || !isLegal(legal, takeMid)}
        onClick={() => onAction(takeMid)}
      >
        M
      </button>
    </div>
  );
}
