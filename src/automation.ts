// Automatic production: rates and elapsed-time advancement.

import type { GameState } from "./state.ts";
import { upgradeEffects } from "./upgrades.ts";

/** Energy produced per second by the whole station. */
export function productionRate(state: GameState): number {
  const effects = upgradeEffects(state);
  return state.generators *
    (1 + effects.generatorPower + effects.turbineOverhaul);
}

/**
 * Advance production by the real elapsed time since the last update.
 * Returns the energy produced (the caller adds it to the state).
 */
export function produce(state: GameState, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 0;
  const produced = productionRate(state) * elapsedSeconds;
  state.energy += produced;
  state.totalEnergy += produced;
  return produced;
}
