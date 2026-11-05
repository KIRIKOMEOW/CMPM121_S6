// Automatic save/load of game state using localStorage.

import { type GameState, initialState } from "./state.ts";
import { upgradeData } from "./upgrades.ts";

const SAVE_KEY = "power-station-save-v1";

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode, quota): play without saving.
  }
}

export function loadGame(): GameState {
  const state = initialState();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return state;
    const data = JSON.parse(raw) as Partial<GameState>;
    if (typeof data.energy === "number" && data.energy >= 0) {
      state.energy = data.energy;
    }
    if (typeof data.totalEnergy === "number" && data.totalEnergy >= 0) {
      state.totalEnergy = data.totalEnergy;
    }
    if (
      typeof data.generators === "number" &&
      Number.isInteger(data.generators) && data.generators >= 0
    ) {
      state.generators = data.generators;
    }
    if (data.upgrades && typeof data.upgrades === "object") {
      for (const upgrade of upgradeData) {
        const level = data.upgrades[upgrade.id];
        if (
          typeof level === "number" && Number.isInteger(level) && level >= 0
        ) {
          state.upgrades[upgrade.id] = level;
        }
      }
    }
  } catch {
    // Corrupt save: start fresh.
  }
  return state;
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore storage errors.
  }
}
