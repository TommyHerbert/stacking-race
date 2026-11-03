import { useState } from 'preact/hooks';
import {
  ENGINE_VERSION,
  MAX_PLAYERS,
  MIN_PLAYERS,
  createGame,
  type GameState,
} from '@stacking-race/engine';
import {
  clearContinueGame,
  hasContinueGame,
  loadContinueGame,
  saveContinueGame,
} from './continueSlot';

type Screen = 'menu' | 'game';

function newRngSeed(): number {
  return (Math.random() * 0x1_0000_0000) >>> 0;
}

/**
 * Menu + a minimal in-game placeholder (full chrome arrives next).
 */
export function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [playerCount, setPlayerCount] = useState(4);
  const [game, setGame] = useState<GameState | null>(null);
  const [canContinue, setCanContinue] = useState(() => hasContinueGame());

  function refreshContinue() {
    setCanContinue(hasContinueGame());
  }

  function startNewGame() {
    const state = createGame({ playerCount, rngSeed: newRngSeed() });
    saveContinueGame(state);
    setGame(state);
    setCanContinue(true);
    setScreen('game');
  }

  function continueGame() {
    const state = loadContinueGame();
    if (state == null) {
      refreshContinue();
      return;
    }
    setGame(state);
    setScreen('game');
  }

  function backToMenu() {
    setScreen('menu');
    setGame(null);
    refreshContinue();
  }

  function abandonAndMenu() {
    clearContinueGame();
    setCanContinue(false);
    backToMenu();
  }

  return (
    <div class="device-frame">
      <main class="phone-shell">
        {screen === 'menu' ? (
          <MenuScreen
            playerCount={playerCount}
            canContinue={canContinue}
            onPlayerCount={setPlayerCount}
            onNewGame={startNewGame}
            onContinue={continueGame}
          />
        ) : (
          <GamePlaceholder
            game={game}
            onBack={backToMenu}
            onAbandon={abandonAndMenu}
          />
        )}
        <p class="meta">engine v{ENGINE_VERSION}</p>
      </main>
    </div>
  );
}

type MenuProps = {
  playerCount: number;
  canContinue: boolean;
  onPlayerCount: (count: number) => void;
  onNewGame: () => void;
  onContinue: () => void;
};

function MenuScreen({
  playerCount,
  canContinue,
  onPlayerCount,
  onNewGame,
  onContinue,
}: MenuProps) {
  const counts = Array.from(
    { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
    (_, i) => MIN_PLAYERS + i,
  );

  return (
    <div class="menu">
      <h1 class="brand">Stacking Race</h1>
      <p class="menu-tagline">Schizolo · pass the device</p>

      <label class="menu-field">
        <span class="menu-label">Players</span>
        <select
          class="menu-select"
          value={playerCount}
          onChange={(event) =>
            onPlayerCount(Number((event.target as HTMLSelectElement).value))
          }
        >
          {counts.map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </label>

      <div class="menu-actions">
        <button type="button" class="menu-button primary" onClick={onNewGame}>
          New game
        </button>
        <button
          type="button"
          class="menu-button"
          onClick={onContinue}
          disabled={!canContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

type GamePlaceholderProps = {
  game: GameState | null;
  onBack: () => void;
  onAbandon: () => void;
};

function GamePlaceholder({ game, onBack, onAbandon }: GamePlaceholderProps) {
  if (game == null) {
    return (
      <div class="game-placeholder">
        <p class="placeholder">No game loaded.</p>
        <button type="button" class="menu-button" onClick={onBack}>
          Back to menu
        </button>
      </div>
    );
  }

  const status =
    game.phase === 'game_over'
      ? 'Game over'
      : game.activePlayer != null
        ? `Player ${game.activePlayer}'s turn`
        : 'Game in progress';

  return (
    <div class="game-placeholder">
      <h1 class="brand">Stacking Race</h1>
      <p class="game-status">{status}</p>
      <p class="placeholder">
        {game.players.length} players · game UI chrome comes next.
      </p>
      <div class="menu-actions">
        <button type="button" class="menu-button" onClick={onBack}>
          Back to menu
        </button>
        <button type="button" class="menu-button danger" onClick={onAbandon}>
          Abandon save
        </button>
      </div>
    </div>
  );
}
