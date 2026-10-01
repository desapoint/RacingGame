# Decisions

This file records decisions that future changes need to preserve or deliberately revise. Add a dated entry when making such a decision; update an existing entry if the decision changes.

## 2026-09-29 — Project foundations

- **Web racing game:** The game runs in a web browser. Browser compatibility and straightforward access are core requirements.
- **2D game:** Gameplay and rendering are two-dimensional.
- **Low hardware demand:** The game must run easily on low-end hardware. Choose rendering, assets, and effects with runtime cost in mind, and check performance on modest devices as the game develops.
- **Open the final HTML file to play:** The distributed game must work by opening its HTML entrypoint directly in a browser, including through `file://`, without a running server or network connection. Development may use compilation, bundling, and optimization commands. Verify the final package by opening its HTML file locally.
- **Use existing libraries where appropriate:** Prefer established libraries for frameworks, icons, and other common needs when they suit the game and its performance target.
- **Structured code:** Split implementation into focused files and classes with clear responsibilities. Keep game logic, rendering, and input concerns distinct.
- **Documentation location:** Keep game documentation in `docs/`. Record decisions that need to be maintained in this file.

## 2026-09-29 — Development and release stack

- **TypeScript source and Canvas 2D rendering:** Use TypeScript modules and focused classes for game code, and the browser's 2D Canvas API for rendering. This supports the planned code structure while keeping the runtime small for low-end hardware.
- **Development mode:** Run the source through a local development server that translates TypeScript on demand. Testing during development does not require a manual production build. TypeScript still needs translation before a browser can run it.
- **Release mode:** Bundle the modules into a classic browser script, with no runtime module imports, so the distributed HTML entrypoint works directly from `file://`. Keep required assets local and avoid runtime network requests. Build tools are development dependencies only.
- **Build tools:** Use Vite for the development server and esbuild to produce the release IIFE bundle. This keeps source modules convenient during development and avoids runtime ES modules in the directly opened release HTML.

See [game-plan.md](game-plan.md) for the product and implementation handoff.

## 2026-09-29 — Playable v1

- **Redline — Drag Club:** The first release implements the drag-racing handoff, with four divisions, twenty events, twelve fictional cars, garage upgrades, tuning, cosmetic editing, jobs, and a workshop. Easy keeps the same payouts; all retries and single races are free.
- **Four-driver timing field, two visible lanes:** Each event simulates the player and three authored rivals independently. Total finish time, including reaction, determines podium placement. Only the featured rival is drawn beside the player. This preserves the two-lane side view and meaningful first-through-fourth progression without additional rendering work. The UI explains the timing field and results list every driver.
- **Small procedural artwork:** Car profiles use three reusable local Path2D silhouette families, layered paint and trim, clipped vector marks, and independently rotating wheels. Static race scenery is drawn once to a cached canvas. No runtime asset downloads, fonts, framework, physics engine, or icon library are needed for this scope. Preserve replaceable geometry and separate rendering responsibilities as art expands.
- **Fixed simulation cost:** Simulation advances at 120 Hz in a requestAnimationFrame accumulator, with frame deltas capped at 100 ms. HUD updates are limited to 20 Hz. Canvas resolution caps device pixel ratio at 1.5. Hidden pages pause the race until explicitly resumed; reduced motion disables track scrolling and wheel rotation.
- **First public save schema:** Version 1 is the only released schema. Validation runs before loading or committing; unknown owned IDs are retained. Future migrations must validate each supported source schema and final output, advance deterministically on a clone, and commit before replacing the previous valid save. Do not invent a legacy format solely for migration tests.
- **Guarded recovery:** IndexedDB is primary and localStorage is a fallback. If either stored candidate is malformed, retain its raw contents and pause autosaving until an explicit recovery choice. Imports show a preview and replace the current session only after a successful storage commit. Keep save export available even when all persistence is blocked.
- **Idle clock high-water mark:** Backwards clock movement does not reduce the saved timestamp. This prevents replaying already credited intervals after the clock catches up. Offline calculation caps elapsed time at twelve hours and facility banks remain below one basic job participation payout.

See [getting-started.md](getting-started.md) for controls, commands, source layout, and v1 limitations.

## 2026-09-29 — Requested production sedans

- **Expanded roster:** Add the red 2021 Mazda3 Turbo Sedan and orange 2022 Kia Forte GT Sedan alongside the twelve fictional cars, as requested. Both are Street-class purchases available immediately: 7,800 and 6,200 in-game credits respectively. Stable IDs are `mazda3-turbo-sedan-2021` and `kia-forte-gt-sedan-2022`; existing car IDs and saves remain compatible.
- **Original sedan artwork:** Each uses a dedicated local vector silhouette, four-door glass and seams, and distinct lighting/trim details. Reuse existing wheel centers, paint layers, livery clipping, and rendering scale so customization and racing work without new runtime assets or dependencies. Roster counts and garage numbering derive from the data.
- **Arcade balance:** Display 250 HP for the Mazda's premium-fuel specification ([Mazda source](https://news.mazdausa.com/2020-07-08-2021-Mazda3-2-5-Turbo-Refined-Performance)) and 201 HP for the Kia GT ([Kia source](https://www.kiamedia.com/us/en/models/forte/2022)). Mass values are rounded gameplay approximations; acceleration, speed, prices, and the shared six-gear manual race controls follow the game's arcade balance rather than reproducing each road car's exact drivetrain.

## 2026-09-29 — Direct-file entrypoints and standalone release

- **One portable HTML file:** The release now embeds the minified CSS and classic IIFE script directly in `dist/index.html`. Copying that file alone must be sufficient to play. Game data and vector artwork remain bundled; loading the release must not request scripts, styles, JSON, fonts, or images. This supersedes the earlier three-file release packaging.
- **Safe root entrypoint:** Opening the repository's `index.html` through `file://` redirects to `dist/index.html` before any development module is created. Over HTTP, the root entrypoint loads the source stylesheet and TypeScript module through Vite as before. Build the release after source changes before opening it from disk.
- **CORS regression coverage:** Browser checks must watch console errors and failed requests, in addition to JavaScript exceptions. Cover a complete race from the release, the repository root, and an isolated HTML copy in a directory containing spaces, a hash, and a non-ASCII character, with networking disabled and normal browser security settings.

## 2026-09-29 — Externally editable release configuration

- **Two-file release:** The user clarified that configuration must remain an editable JSON or similar file. Distribute `index.html` with a readable `config.js`. This supersedes the single-file requirement above; game code, CSS, and artwork remain embedded in the HTML.
- **JSON source, classic-script release data:** Keep `src/data/game-data.json` as the canonical development config. Build generates `dist/config.js` with `globalThis.REDLINE_CONFIG = <JSON object>;`. The release bundle reads that object instead of embedding a copy. Edits to the release config take effect after reload without a rebuild; subsequent builds regenerate it from the source JSON.
- **Preserve direct-file compatibility:** Load the config using a relative classic `<script src="./config.js">` before the game starts. Do not use `fetch`, XHR, module imports, or `crossorigin` to read local configuration. Copy both release files together. Missing or invalid configuration must show a readable startup error.
- **Verify external edits:** Tests cover changing starting funds and car horsepower in a copied config without modifying HTML, plus missing/invalid config handling and complete offline races from root, release, and relocated two-file packages.

## 2026-09-30 — GitHub Pages deployment

- **Playable web deployment:** Publish the production `dist/` output to GitHub Pages so the current game is playable from the repository's Pages URL without cloning or installing dependencies.
- **Deploy from `main`:** A GitHub Actions workflow runs on pushes to `main` (and manual dispatch), installs locked npm dependencies, runs `npm run build`, uploads only `dist/`, and deploys that artifact to the `github-pages` environment.
- **Offline release remains supported:** GitHub Pages is an additional distribution path. Preserve the existing directly opened two-file release (`dist/index.html` plus `dist/config.js`) and its no-runtime-network requirements.

