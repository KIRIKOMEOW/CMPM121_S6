# Power Station

Restore an abandoned power station by generating energy, buying generators, and improving their output. Built with TypeScript, Vite, and Deno.

## How to play

Click **Generate Energy** to produce energy manually. Spend stored energy on generators and upgrades:

| Purchase         | Initial cost | Price growth | Effect                                   |
| ---------------- | ------------ | ------------ | ---------------------------------------- |
| Generator        | 10 EU        | ×1.15        | Adds one generator producing 1 EU/s base |
| Click Power      | 20 EU        | ×1.5         | Adds 1 EU per manual click               |
| Generator Power  | 50 EU        | ×2           | Adds 1 EU/s to each generator            |
| Turbine Overhaul | 100 EU       | ×1.8         | Adds 2 EU/s to each generator            |

Generators produce energy automatically using real elapsed time. The production rate in EU/s is shown in the stats panel. **Buy Max Generators** purchases every generator you can afford at the increasing prices. Upgrade prices are rounded up to whole numbers and displayed on their buttons; buttons are disabled while unaffordable. Spending energy never reduces total energy produced.

Progress is saved automatically to `localStorage` and restored on load; use **Reset Save** to start over.

## Run and build

Install Deno 2.x and Git. From the repository directory:

- Run `deno task setup` once per clone to enable pre-commit checks.
- Run `deno task dev`, then open the local address printed by Vite.
- Run `deno task ci` to check formatting, lint, and TypeScript, then build the production app.
- Run `deno task preview` to serve the latest production build locally.

Run `deno task fmt` to fix formatting before checking again.

## Code navigation

| File                           | Responsibility                                                   |
| ------------------------------ | ---------------------------------------------------------------- |
| `src/state.ts`                 | `GameState` type and initial state                               |
| `src/automation.ts`            | Production-rate calculation and elapsed-time advancement         |
| `src/input.ts`                 | Manual energy generation                                         |
| `src/upgrades.ts`              | Data-driven upgrade definitions, pricing, and purchase logic     |
| `src/save.ts`                  | Automatic save/load via `localStorage`                           |
| `src/main.ts`                  | UI structure, event handlers, rendering, and the production loop |
| `src/style.css`                | Dark industrial theme                                            |
| `.github/workflows/deploy.yml` | Production checks and GitHub Pages deployment                    |

## Data-driven design

Upgrade content (cost, multiplier, target field, amount) lives in a single `upgradeData` array in `src/upgrades.ts`. One shared purchase function handles affordability, payment, level tracking, and effect application for every upgrade, so adding a new upgrade requires only a new entry. Effects are computed cumulatively from purchase levels in `upgradeEffects`.

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da), which has no explicit repository license. No new license is assigned to that material. Dependencies retain their respective licenses.
