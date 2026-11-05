// Data-driven upgrade definitions, pricing, and purchases.

import type { GameState } from "./state.ts";

export interface UpgradeDefinition {
  id: string;
  label: string;
  description: string;
  /** Cost of the first purchase. */
  baseCost: number;
  /** Cost multiplier applied after each purchase. */
  costMultiplier: number;
  /** Which state field the upgrade boosts. */
  target: "clickPower" | "generatorPower" | "turbineOverhaul";
  /** Amount added to the target field per purchase. */
  amount: number;
}

export const upgradeData: UpgradeDefinition[] = [
  {
    id: "clickPower",
    label: "Click Power",
    description: "+1 EU per manual click",
    baseCost: 20,
    costMultiplier: 1.5,
    target: "clickPower",
    amount: 1,
  },
  {
    id: "generatorPower",
    label: "Generator Power",
    description: "+1 EU/s per generator",
    baseCost: 50,
    costMultiplier: 2,
    target: "generatorPower",
    amount: 1,
  },
  {
    id: "turbineOverhaul",
    label: "Turbine Overhaul",
    description: "+2 EU/s per generator",
    baseCost: 100,
    costMultiplier: 1.8,
    target: "turbineOverhaul",
    amount: 2,
  },
];

export interface GeneratorPurchase {
  generatorCost: number;
  generatorMultiplier: number;
}

export const generatorConfig: GeneratorPurchase = {
  generatorCost: 10,
  generatorMultiplier: 1.15,
};

/** Number of times an upgrade has been purchased. */
export function upgradeLevel(state: GameState, id: string): number {
  return state.upgrades[id] ?? 0;
}

/** Cost of the next purchase of an upgrade, rounded up to a whole number. */
export function upgradeCost(
  state: GameState,
  upgrade: UpgradeDefinition,
): number {
  const level = upgradeLevel(state, upgrade.id);
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
}

/** Cost of the next single generator, rounded up to a whole number. */
export function generatorCost(state: GameState): number {
  return Math.ceil(
    generatorConfig.generatorCost *
      Math.pow(generatorConfig.generatorMultiplier, state.generators),
  );
}

/** Sum of costs for buying `count` generators starting from the current price. */
export function generatorsTotalCost(state: GameState, count: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.ceil(
      generatorConfig.generatorCost *
        Math.pow(generatorConfig.generatorMultiplier, state.generators + i),
    );
  }
  return total;
}

/** Largest number of generators affordable with the current energy balance. */
export function maxAffordableGenerators(state: GameState): number {
  let count = 0;
  let spent = 0;
  while (true) {
    const nextCost = Math.ceil(
      generatorConfig.generatorCost *
        Math.pow(generatorConfig.generatorMultiplier, state.generators + count),
    );
    if (spent + nextCost > state.energy) break;
    spent += nextCost;
    count++;
  }
  return count;
}

/** Cumulative effect values from all purchased upgrades. */
export function upgradeEffects(state: GameState): {
  clickPower: number;
  generatorPower: number;
  turbineOverhaul: number;
} {
  const effects = { clickPower: 0, generatorPower: 0, turbineOverhaul: 0 };
  for (const upgrade of upgradeData) {
    effects[upgrade.target] += upgradeLevel(state, upgrade.id) * upgrade.amount;
  }
  return effects;
}

export type PurchaseResult = "success" | "insufficient";

/** Buy one generator if affordable; deducts energy on success. */
export function buyGenerator(state: GameState): PurchaseResult {
  const cost = generatorCost(state);
  if (state.energy < cost) return "insufficient";
  state.energy -= cost;
  state.generators += 1;
  return "success";
}

/** Buy as many generators as affordable; deducts their total cost. */
export function buyMaxGenerators(state: GameState): number {
  const count = maxAffordableGenerators(state);
  if (count === 0) return 0;
  state.energy -= generatorsTotalCost(state, count);
  state.generators += count;
  return count;
}

/** Buy one level of an upgrade if affordable; deducts energy on success. */
export function buyUpgrade(
  state: GameState,
  upgrade: UpgradeDefinition,
): PurchaseResult {
  const cost = upgradeCost(state, upgrade);
  if (state.energy < cost) return "insufficient";
  state.energy -= cost;
  state.upgrades[upgrade.id] = upgradeLevel(state, upgrade.id) + 1;
  return "success";
}
