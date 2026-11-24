import {
  apply,
  legalActions,
  type Action,
  type GameState,
} from '@stacking-race/engine';
import { useMemo, useState } from 'preact/hooks';
import { LegView } from './LegView';
import { RaceView } from './RaceView';
import { TrackView } from './TrackView';
import { shortColour } from './pieceStyle';

type Panel = 'none' | 'score' | 'opponents' | 'history' | 'options';

type GameScreenProps = {
  game: GameState;
  onGameChange: (state: GameState) => void;
  onBackToMenu: () => void;
};

export function GameScreen({
  game,
  onGameChange,
  onBackToMenu,
}: GameScreenProps) {
  const [panel, setPanel] = useState<Panel>('none');
  const legal = useMemo(() => legalActions(game), [game]);

  function toggle(next: Panel) {
    setPanel((current) => (current === next ? 'none' : next));
  }

  function handleAction(action: Action) {
    if (game.phase !== 'turn') {
      return;
    }
    try {
      onGameChange(apply(game, action));
      setPanel('none');
    } catch {
      // Illegal tap — ignore.
    }
  }

  const active = game.players.find(
    (player) => player.seat === game.activePlayer,
  );
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
          {panel === 'score' && <ScorePanel game={game} />}
          {panel === 'opponents' && <OpponentsPanel game={game} />}
          {panel === 'history' && <HistoryPanel game={game} />}
          {panel === 'options' && (
            <div class="options-panel">
              <button
                type="button"
                class="menu-button"
                onClick={onBackToMenu}
              >
                Back to menu
              </button>
            </div>
          )}
        </section>
      )}

      <p class="game-turn" aria-live="polite">
        {turnLabel}
        {active != null && game.phase === 'turn' && (
          <span class="turn-points"> · {active.points} pts</span>
        )}
      </p>

      <TrackView game={game} legal={legal} onAction={handleAction} />
      <LegView game={game} legal={legal} onAction={handleAction} />
      <RaceView game={game} legal={legal} onAction={handleAction} />
    </div>
  );
}

function ScorePanel({ game }: { game: GameState }) {
  const active = game.activePlayer;
  return (
    <div class="score-panel">
      <p class="panel-lead">
        {active != null
          ? `Player ${active}: ${
              game.players.find((player) => player.seat === active)?.points ?? 0
            } pts`
          : 'Scores'}
      </p>
      <ul class="score-list">
        {game.players.map((player) => (
          <li key={player.seat}>
            <strong>{player.seat}</strong> {player.points}
            {player.seat === active ? ' ←' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OpponentsPanel({ game }: { game: GameState }) {
  return (
    <pre class="opponents-dump">
      {game.players
        .map((player) => {
          const bets = player.legBets
            .map((bet) =>
              bet.kind === 'winner'
                ? `${shortColour(bet.colour)}${bet.value}`
                : `${shortColour(bet.colour)}M`,
            )
            .join(' ');
          const race = player.raceBetsRemaining.map(shortColour).join('');
          const modifier = player.modifierInHand
            ? 'modifier:hand'
            : 'modifier:board';
          return `${player.seat}:${player.points}p dice${player.diceCount} [${bets || '—'}] race(${race || '—'}) ${modifier}`;
        })
        .join('\n')}
      {'\n'}
      track:
      {game.track
        .map((cell, space) => {
          if (cell.stack.length === 0 && cell.modifier == null) {
            return null;
          }
          const stack = cell.stack.map(shortColour).join('');
          const mod =
            cell.modifier == null
              ? ''
              : cell.modifier.side === 'jump'
                ? `↗${cell.modifier.owner}`
                : `↙${cell.modifier.owner}`;
          return ` ${space + 1}:${stack}${mod}`;
        })
        .filter(Boolean)
        .join('')}
      {'\n'}
      W×{game.raceWinnerPile.length} L×{game.raceLoserPile.length}
      {'\n'}
      dice left:{game.dicePool.map(shortColour).join('') || '—'} out:
      {game.diceUsed.map(shortColour).join('') || '—'}
    </pre>
  );
}

function HistoryPanel({ game }: { game: GameState }) {
  return (
    <div class="history-panel">
      {game.history.length === 0 ? (
        <p class="zone-empty">No events yet.</p>
      ) : (
        <ol class="history-list">
          {game.history.map((line, index) => (
            <li key={`${index}-${line}`}>{line}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

function panelButtonClass(active: boolean): string {
  return active ? 'top-button active' : 'top-button';
}
