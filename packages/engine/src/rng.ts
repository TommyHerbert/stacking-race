/**
 * Deterministic seeded RNG with an explicit cursor for save/load.
 * Each draw advances `cursor` by 1; the same (seed, cursor) always yields
 * the same value.
 */

export type RngState = {
  seed: number;
  cursor: number;
};

/** Mix a seed + cursor into an unsigned 32-bit value (deterministic). */
export function sampleUint32(seed: number, cursor: number): number {
  let t = (Math.imul(seed ^ 0x9e3779b9, cursor + 1) + seed) >>> 0;
  t = Math.imul(t ^ (t >>> 15), 0x85ebca6b) >>> 0;
  t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35) >>> 0;
  return (t ^ (t >>> 16)) >>> 0;
}

export function createRng(seed: number): RngState {
  // Coerce to uint32 so JSON round-trips stay stable.
  return { seed: seed >>> 0, cursor: 0 };
}

export function nextUint32(rng: RngState): { value: number; rng: RngState } {
  const value = sampleUint32(rng.seed, rng.cursor);
  return {
    value,
    rng: { seed: rng.seed, cursor: rng.cursor + 1 },
  };
}

/** Uniform float in [0, 1). */
export function nextFloat(rng: RngState): { value: number; rng: RngState } {
  const { value, rng: next } = nextUint32(rng);
  return { value: value / 0x1_0000_0000, rng: next };
}

/**
 * Uniform integer in [0, maxExclusive).
 * `maxExclusive` must be a positive integer.
 */
export function nextInt(
  rng: RngState,
  maxExclusive: number,
): { value: number; rng: RngState } {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError('nextInt: maxExclusive must be a positive integer');
  }
  const { value, rng: next } = nextUint32(rng);
  return { value: value % maxExclusive, rng: next };
}

/** Convenience: roll 1, 2, or 3 with equal probability. */
export function nextDieFace(rng: RngState): { value: 1 | 2 | 3; rng: RngState } {
  const { value, rng: next } = nextInt(rng, 3);
  return { value: (value + 1) as 1 | 2 | 3, rng: next };
}

export function rngFromGame(seed: number, cursor: number): RngState {
  return { seed: seed >>> 0, cursor };
}
