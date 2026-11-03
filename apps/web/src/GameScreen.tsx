import type { GameState } from '@stacking-race/engine';
import { useState } from 'preact/hooks';

type Panel = 'none' | 'score' | 'opponents' | 'history' | 'options';

type GameScreenProps = {
  game: GameState;
  onBackToMenu: () => void;
  onAbandon: () => void;
};

/**
 * Game chrome: labeled empty zones. Content fills in later commits.
 */
export function GameScreen({
  game,
  onBackToMenu,
  onAbandon,
}: GameScreenProps) {
  const [panel, setPanel] = useState<Panel>('none');

  function toggle(next: Panel) {
    setPanel((current) => (current === next ? 'none' : next));
  }

  const turnLabel =
    game.phase === 'game_over'
      ? 'Game over'
      : game.activePlayer != null
        ? `Player ${game.activePlayer}'s turn`
        : '…';

  return (
    <div class="game-screen">
      <header class="game-top">
        <button
          type="button"
          class={panelButtonClass(panel === 'score')}
          onClick={() => toggle('score')}
        >
          Score
        </button>
        <button
          type="button"
          class={panelButtonClass(panel === 'opponents')}
          onClick={() => toggle('opponents')}
        >
          Opponents
        </button>
        <button
          type="button"
          class={panelButtonClass(panel === 'history')}
          onClick={() => toggle('history')}
        >
          History
        </button>
        <button
          type="button"
          class={panelButtonClass(panel === 'options')}
          onClick={() => toggle('options')}
        >
          Options
        </button>
      </header>

      {panel !== 'none' && (
        <section class="game-panel" aria-label={panel}>
          {panel === 'score' && (
            <p class="zone-empty">Score panel — content next.</p>
          )}
          {panel === 'opponents' && (
            <p class="zone-empty">Opponents panel — content next.</p>
          )}
          {panel === 'history' && (
            <p class="zone-empty">History panel — content next.</p>
          )}
          {panel === 'options' && (
            <div class="options-panel">
              <button
                type="button"
                class="menu-button"
                onClick={onBackToMenu}
              >
                Back to menu
              </button>
              <button
                type="button"
                class="menu-button danger"
                onClick={onAbandon}
              >
                Abandon save
              </button>
            </div>
          )}
        </section>
      )}

      <p class="game-turn" aria-live="polite">
        {turnLabel}
      </p>

      <section class="game-track zone" aria-label="Track">
        <h2 class="zone-title">Track</h2>
        <p class="zone-empty">Number-line arrives next.</p>
      </section>

      <section class="game-leg zone" aria-label="Leg">
        <h2 class="zone-title">Leg</h2>
        <div class="split-row">
          <div class="split-pane">
            <h3 class="pane-title">Hand</h3>
            <p class="zone-empty">—</p>
          </div>
          <div class="split-pane">
            <h3 class="pane-title">Stacks</h3>
            <p class="zone-empty">—</p>
          </div>
        </div>
      </section>

      <section class="game-race zone" aria-label="Race">
        <h2 class="zone-title">Race</h2>
        <div class="split-row">
          <div class="split-pane">
            <h3 class="pane-title">Hand</h3>
            <p class="zone-empty">—</p>
          </div>
          <div class="split-pane">
            <h3 class="pane-title">Stacks</h3>
            <p class="zone-empty">—</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function panelButtonClass(active: boolean): string {
  return active ? 'top-button active' : 'top-button';
}
