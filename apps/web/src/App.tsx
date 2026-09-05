import { ENGINE_VERSION } from '@stacking-race/engine';

/**
 * Phone-portrait shell only. Menu / game UI arrive in later commits.
 */
export function App() {
  return (
    <div class="device-frame">
      <main class="phone-shell">
        <h1 class="brand">Stacking Race</h1>
        <p class="placeholder">Framework shell — game UI not wired yet.</p>
        <p class="meta">engine v{ENGINE_VERSION}</p>
      </main>
    </div>
  );
}
