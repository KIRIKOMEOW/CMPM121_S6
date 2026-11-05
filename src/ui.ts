// Frontend: DOM structure, rendering, and purchase feedback.
// Game rules live in state.ts / input.ts / automation.ts / upgrades.ts / save.ts.

import { productionRate } from "./automation.ts";
import { clickPower } from "./input.ts";
import type { GameState } from "./state.ts";
import {
  generatorCost,
  generatorsTotalCost,
  maxAffordableGenerators,
  upgradeCost,
  upgradeData,
  type UpgradeDefinition,
  upgradeLevel,
} from "./upgrades.ts";

export interface UiHandlers {
  /** Manual generation; returns the EU produced by the click. */
  onGenerate: () => number;
  /** Returns whether the purchase succeeded. */
  onBuyGenerator: () => boolean;
  /** Returns how many generators were bought. */
  onBuyMaxGenerators: () => number;
  onBuyUpgrade: (upgrade: UpgradeDefinition) => boolean;
  onReset: () => void;
}

export interface Ui {
  render: (state: GameState) => void;
  /** Floating "+N EU" feedback above the Generate button. */
  popEnergy: (amount: number) => void;
  /** Sync the reactor glow with the current production rate. */
  setPulse: (rate: number) => void;
}

const numberFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function format(value: number): string {
  return numberFormat.format(value);
}

export function createUi(root: HTMLElement, handlers: UiHandlers): Ui {
  root.innerHTML = `
    <header class="hud">
      <div class="brand">
        <span class="bolt" aria-hidden="true">⚡</span>
        <h1>Power Station</h1>
      </div>
      <span class="status"><span class="dot" aria-hidden="true"></span>Grid Online</span>
    </header>

    <section class="stats" aria-label="Energy statistics">
      <div class="tile">
        <span class="tile-value" id="stored">0.00</span>
        <span class="tile-label">Stored Energy · EU</span>
      </div>
      <div class="tile">
        <span class="tile-value" id="total">0.00</span>
        <span class="tile-label">Total Produced</span>
      </div>
      <div class="tile">
        <span class="tile-value" id="rate">0.00</span>
        <span class="tile-label">Production · EU/s</span>
      </div>
      <div class="tile">
        <span class="tile-value" id="generators">0</span>
        <span class="tile-label">Generators Online</span>
      </div>
    </section>

    <section class="panel reactor">
      <h2>Reactor Core</h2>
      <button id="generate" class="big-button">
        <span class="glow" aria-hidden="true"></span>
        <span class="big-label">⚡ Generate Energy</span>
        <span class="big-sub" id="click-hint">+1 EU per click</span>
        <span class="fx-layer" id="fx" aria-hidden="true"></span>
      </button>
    </section>

    <section class="panel">
      <h2>Generators</h2>
      <div class="row">
        <button id="buy-generator" class="gen-button">
          <span class="gen-name">Buy Generator</span>
          <span class="gen-meta" id="gen-owned">Owned 0</span>
          <span class="gen-cost" id="gen-cost">10 EU</span>
        </button>
        <button id="buy-max" class="gen-button alt">
          <span class="gen-name">Buy Max Generators</span>
          <span class="gen-meta" id="gen-max-hint">Affordable now: 0</span>
          <span class="gen-cost" id="gen-max-cost">—</span>
        </button>
      </div>
    </section>

    <section class="panel">
      <h2>Upgrades</h2>
      <div id="upgrade-grid" class="upgrade-grid"></div>
    </section>

    <footer>
      <button id="reset" class="reset-button">Reset Save</button>
    </footer>

    <div class="toasts" id="toasts" aria-live="polite"></div>
  `;

  const el = {
    stored: root.querySelector<HTMLElement>("#stored")!,
    total: root.querySelector<HTMLElement>("#total")!,
    rate: root.querySelector<HTMLElement>("#rate")!,
    generators: root.querySelector<HTMLElement>("#generators")!,
    generate: root.querySelector<HTMLButtonElement>("#generate")!,
    fx: root.querySelector<HTMLElement>("#fx")!,
    clickHint: root.querySelector<HTMLElement>("#click-hint")!,
    buyGenerator: root.querySelector<HTMLButtonElement>("#buy-generator")!,
    genOwned: root.querySelector<HTMLElement>("#gen-owned")!,
    genCost: root.querySelector<HTMLElement>("#gen-cost")!,
    buyMax: root.querySelector<HTMLButtonElement>("#buy-max")!,
    genMaxHint: root.querySelector<HTMLElement>("#gen-max-hint")!,
    genMaxCost: root.querySelector<HTMLElement>("#gen-max-cost")!,
    upgradeGrid: root.querySelector<HTMLElement>("#upgrade-grid")!,
    reset: root.querySelector<HTMLButtonElement>("#reset")!,
    toasts: root.querySelector<HTMLElement>("#toasts")!,
  };

  // ---- Upgrade cards (data-driven) -------------------------------------
  const upgradeCards = new Map<
    string,
    { card: HTMLButtonElement; level: HTMLElement; cost: HTMLElement }
  >();

  for (const upgrade of upgradeData) {
    const card = document.createElement("button");
    card.className = "upgrade-card";
    card.innerHTML = `
      <span class="up-head">
        <span class="up-name">${upgrade.label}</span>
        <span class="up-level">Lv 0</span>
      </span>
      <span class="up-desc">${upgrade.description}</span>
      <span class="up-cost">0 EU</span>
    `;
    card.addEventListener("click", () => {
      const bought = handlers.onBuyUpgrade(upgrade);
      if (bought) burst(card);
    });
    upgradeCards.set(upgrade.id, {
      card,
      level: card.querySelector<HTMLElement>(".up-level")!,
      cost: card.querySelector<HTMLElement>(".up-cost")!,
    });
    el.upgradeGrid.appendChild(card);
  }

  // ---- Actions ---------------------------------------------------------
  el.generate.addEventListener("click", () => {
    const gained = handlers.onGenerate();
    burst(el.generate);
    popEnergy(gained);
  });

  el.buyGenerator.addEventListener("click", () => {
    if (handlers.onBuyGenerator()) burst(el.buyGenerator);
  });

  el.buyMax.addEventListener("click", () => {
    const bought = handlers.onBuyMaxGenerators();
    if (bought > 0) {
      burst(el.buyMax);
      toast(`+${bought} generator${bought > 1 ? "s" : ""}`);
    }
  });

  el.reset.addEventListener("click", () => handlers.onReset());

  // ---- Rendering -------------------------------------------------------
  function render(state: GameState) {
    el.stored.textContent = format(state.energy);
    el.total.textContent = format(state.totalEnergy);
    const rate = productionRate(state);
    el.rate.textContent = format(rate);
    el.generators.textContent = String(state.generators);
    setPulse(rate);

    const cost = generatorCost(state);
    el.genCost.textContent = `${cost} EU`;
    el.genOwned.textContent = `Owned ${state.generators}`;
    el.buyGenerator.disabled = state.energy < cost;

    const maxCount = maxAffordableGenerators(state);
    el.buyMax.disabled = maxCount === 0;
    el.genMaxHint.textContent = maxCount > 0
      ? `Buy ${maxCount} now`
      : "Affordable now: 0";
    el.genMaxCost.textContent = maxCount > 0
      ? `${format(generatorsTotalCost(state, maxCount))} EU`
      : "—";

    el.clickHint.textContent = `+${clickPower(state)} EU per click`;

    for (const upgrade of upgradeData) {
      const parts = upgradeCards.get(upgrade.id)!;
      const price = upgradeCost(state, upgrade);
      parts.level.textContent = `Lv ${upgradeLevel(state, upgrade.id)}`;
      parts.cost.textContent = `${format(price)} EU`;
      parts.card.disabled = state.energy < price;
    }
  }

  // ---- Feedback helpers ------------------------------------------------
  function burst(button: HTMLElement) {
    button.classList.remove("burst");
    void button.offsetWidth; // restart the animation
    button.classList.add("burst");
  }

  function popEnergy(amount: number) {
    const span = document.createElement("span");
    span.className = "pop";
    span.textContent = `+${format(amount)}`;
    el.fx.appendChild(span);
    span.addEventListener("animationend", () => span.remove());
  }

  function toast(message: string) {
    const div = document.createElement("div");
    div.className = "toast";
    div.textContent = message;
    el.toasts.appendChild(div);
    div.addEventListener("animationend", () => div.remove());
  }

  function setPulse(rate: number) {
    const seconds = rate <= 0 ? 0 : Math.max(0.35, 6 / (1 + rate));
    root.style.setProperty("--pulse", `${seconds}s`);
    root.classList.toggle("idle", rate <= 0);
  }

  return { render, popEnergy, setPulse };
}
