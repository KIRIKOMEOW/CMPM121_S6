// Game state for the Power Station incremental game.

export interface GameState {
  /** Energy currently stored and available to spend. */
  energy: number;
  /** Total energy ever produced. Never decreases when spending. */
  totalEnergy: number;
  /** Number of automatic generators owned. */
  generators: number;
  /** Purchase count of each upgrade, keyed by upgrade id. */
  upgrades: Record<string, number>;
}

export function initialState(): GameState {
  return {
    energy: 0,
    totalEnergy: 0,
    generators: 0,
    upgrades: {},
  };
}
