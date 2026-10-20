/**
 * Single continue-slot helpers for the web app (localStorage).
 * Engine owns serialize/deserialize; this module only stores the snapshot.
 */

import {
  deserializeGameState,
  serializeGameState,
  type GameState,
} from '@stacking-race/engine';

export const CONTINUE_STORAGE_KEY = 'stacking-race.continue.v1';

function storage(): Storage | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage;
}

export function hasContinueGame(): boolean {
  const store = storage();
  return store?.getItem(CONTINUE_STORAGE_KEY) != null;
}

export function loadContinueGame(): GameState | null {
  const store = storage();
  const raw = store?.getItem(CONTINUE_STORAGE_KEY);
  if (raw == null) {
    return null;
  }

  try {
    return deserializeGameState(raw);
  } catch {
    // Corrupt slot — clear so the menu can offer a clean new game.
    store?.removeItem(CONTINUE_STORAGE_KEY);
    return null;
  }
}

export function saveContinueGame(state: GameState): void {
  const store = storage();
  store?.setItem(CONTINUE_STORAGE_KEY, serializeGameState(state));
}

export function clearContinueGame(): void {
  storage()?.removeItem(CONTINUE_STORAGE_KEY);
}
