// Manual energy generation.

import type { GameState } from "./state.ts";
import { upgradeEffects } from "./upgrades.ts";

/** Energy produced per manual click of "Generate Energy". */
export function clickPower(state: GameState): number {
  return 1 + upgradeEffects(state).clickPower;
}

export function generateEnergy(state: GameState): number {
  const produced = clickPower(state);
  state.energy += produced;
  state.totalEnergy += produced;
  return produced;
}
