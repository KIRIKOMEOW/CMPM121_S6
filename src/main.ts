// Entry point: wires the UI to the game logic and runs the production loop.

import { produce } from "./automation.ts";
import { generateEnergy } from "./input.ts";
import { loadGame, saveGame } from "./save.ts";
import { type GameState, initialState } from "./state.ts";
import { buyGenerator, buyMaxGenerators, buyUpgrade } from "./upgrades.ts";
import { createUi } from "./ui.ts";
import "./style.css";

const root = document.querySelector<HTMLElement>("#app")!;
let state: GameState = loadGame();

const ui = createUi(root, {
  onGenerate: () => {
    const gained = generateEnergy(state);
    saveGame(state);
    ui.render(state);
    return gained;
  },
  onBuyGenerator: () => {
    const bought = buyGenerator(state) === "success";
    saveGame(state);
    ui.render(state);
    return bought;
  },
  onBuyMaxGenerators: () => {
    const bought = buyMaxGenerators(state);
    saveGame(state);
    ui.render(state);
    return bought;
  },
  onBuyUpgrade: (upgrade) => {
    const bought = buyUpgrade(state, upgrade) === "success";
    saveGame(state);
    ui.render(state);
    return bought;
  },
  onReset: () => {
    if (!confirm("Reset all progress?")) return;
    state = initialState();
    saveGame(state);
    ui.render(state);
  },
});

// ---------------------------------------------------------------------------
// Automatic production loop. The timer only schedules updates: energy is
// always produced from the real elapsed time between frames.
// ---------------------------------------------------------------------------

const UPDATE_INTERVAL_MS = 100;
let lastTime = performance.now();

function tick() {
  const now = performance.now();
  const elapsedSeconds = (now - lastTime) / 1000;
  lastTime = now;
  if (elapsedSeconds > 0) {
    produce(state, elapsedSeconds);
    saveGame(state);
    ui.render(state);
  }
}

ui.render(state);
globalThis.setInterval(tick, UPDATE_INTERVAL_MS);
