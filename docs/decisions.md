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

## 2026-09-29 — Real counterparts and reference sprites

- **Eighteen real models:** At the user's request, replace the twelve fictional cars with recent real counterparts and add four recognizable classics. Keep the requested 2021 Mazda3 Turbo sedan red and 2022 Forte GT sedan orange. The modern roster uses 2021–2024 models; classics are the 1969 Mustang Boss 302, 1995 RX-7 FD, 1998 Supra RZ, and 1999 Skyline GT-R R34. This supersedes the earlier fictional roster and procedural silhouettes.
- **Individual reference artwork:** The user explicitly requested Luna with medium reasoning to generate sprites from web reference images. Retain generated PNGs, reference provenance, and prompt records in the repository. Embed only compact WebP copies in the release. See [car-art.md](car-art.md) and its batch records.
- **Cached parts:** Prepare body layers, paint masks, and per-model wheel discs once. Preserve model-specific silhouettes and wheel positions; never replace all cars with a shared generic shape. Cache recoloring and livery composites, with no per-frame pixel scans. Generated badges and small trim details remain illustrative.
- **Save continuity:** Keep schema 1; `carAliases` maps retired fictional IDs to replacement models on validated load. Preserve owned upgrades, tuning, cosmetics, and selected ownership. If the replacement is already owned, retain the retired record rather than overwriting either car. Keep unknown IDs recoverable.
- **Offline package remains two files:** Bundle image data, code, and CSS in `dist/index.html`; load the external editable `dist/config.js` as a classic script. No runtime fetch, ES module imports, remote reference URLs, or separate image files are required. Development config remains ordinary JSON.
- **Arcade performance:** Real names and model years identify visual counterparts. Game performance values remain approximate balance data and shared six-gear controls continue to apply across the roster.

## 2026-09-29 — Expanded roster and condition variants

- **Thirty additional real models:** Expand across family SUVs, everyday cars, minivans, pickups, electric crossovers and sports cars. Each new model receives Standard, Neglected and Rusty entries. Preserve the original 18 and their save IDs. The target is 48 base models and 108 selectable cars.
- **Factory sheets separate from game balance:** Identify the exact year, trim and market and retain specification sources. Use `null` for values not verified in the source, and explain horsepower conversions, premium-fuel ratings and weight definitions. Factory data belongs to a shared model record; condition-specific arcade performance belongs to each purchase entry.
- **Wear is mechanical and visual:** Neglected and Rusty use separately generated images and reduced power, acceleration, speed and grip, plus slower shifts and lower prices. These are fictional condition estimates. Repainting or changing wheels does not restore performance; upgrades use the reduced starting values. See [roster-expansion.md](roster-expansion.md) for multipliers.
- **Independent art workers:** At the user's request, three Luna medium agents handle clean, neglected and rusty artwork. Consumers monitor ready markers written only after a clean PNG and its metadata are available. Preserve prompts, web references and source PNGs. Each final image needs its own native wheel coordinates, orientation and alpha bounds.
- **Bounded artwork memory:** Page the dealership at 12 cars, prepare only visible sprites, retain at most 12 prepared sprites and eight painted appearances, and finish loading race sprites before starting simulation. Deploy at most 800 × 400 WebPs while retaining source PNGs. This supersedes decoding the whole roster at startup and the previous 1024 × 512 deployment size.
- **Preserve local launch:** All art remains embedded in the classic-script release; configuration remains external `config.js`. Specification source links are optional user-opened references, never runtime downloads.

## 2026-09-30 — Painted panels on worn cars

- **Retain body paint:** The user clarified that even heavily damaged cars must keep painted body panels. Localized rust, flaking corrosion and rust holes are valid; whole doors, fenders or other panels must not be stripped to bare steel. Revise earlier rusty images with bare-metal replacement panels and apply this constraint to all remaining variants. Severe age should read through dents, worn paint, localized corrosion, damaged trim and holes.

## 2026-09-30 — Realistic references, illustrated game sprites

- **Two art stages:** The user requested that realistic sprites be retained under `docs/` as references, then transformed into less realistic, more cartoon-like 2D game artwork. Preserve a general realistic reference per model at `docs/art/realistic/` before generating its gameplay variants. Earlier realistic condition studies may also remain there.
- **Match the supplied ZIP:** `car-game-assets.zip` at the repository root is the style reference. Its unmodified contents are extracted at `docs/art/style-reference/`. Match crisp outlines, broad shaded color regions and simplified reflections while retaining each real model's distinctive silhouette and proportions. The ZIP does not replace the chosen vehicle roster.
- **All game artwork adopts the style:** Convert the original 18 and every new Standard, Neglected and Rusty entry. Keep two complete wheels in each source sprite for extraction, true transparency and the existing parts/customization workflow. Use separate `-2d.png` filenames; never overwrite the realistic archive. Mark final metadata `renderStyle: "cartoon-2d"` and retain its `realisticReference` path.
- **Pipeline handoff remains filesystem based:** Clean workers publish a realistic-reference marker as soon as that reference is ready. Condition workers can derive their stylized wear variants directly from that realistic model plus the style atlas. A realistic intermediate for each wear condition is optional. Completion markers describe the final 2D stage; full assembly rejects unfinished realistic-only game entries.
- **Incremental releases exclude rejected expansion art:** Partial assembly includes only completed 2D expansion entries, keeping superseded wear studies out of gameplay. The original stable IDs remain available while their art is converted. Release packaging runs the startup config validator before replacing playable files, so invalid incremental factory records cannot silently produce a broken release.

## 2026-10-01 — Integrated local sprite roster with branch work

- **Local roster is the sprite source of truth:** Use the uploaded local project's individual per-car artwork, condition variants, aliases, dealership/spec UI and expanded roster instead of the earlier shared body/paint/wheel atlases.
- **Keep Git/runtime small while art is unfinished:** Full-resolution generation/reference PNGs and test screenshots remain in the local art workbench rather than `main`. The checked-in runtime catalog embeds 256 × 128-or-smaller WebP copies at deliberately low quality. The current embedded sprite payload is under 1 MB and remains fully offline.
- **Preserve established pre-branch behavior:** Keep schema-1 save compatibility, import/export/recovery, the destructive full-progression reset, editable external `config.js`, direct-file release support and the GitHub Pages deployment workflow.
- **Preserve automotive branch work:** Keep the automotive UI, physical drag tree and timing-slip results. The race HUD uses a conventional 0–8 ×1000 RPM tachometer with a fixed redline arc and no horizontal RPM bar.
- **Stable staging and mobile controls:** Before launch, hold the configured launch RPM rather than oscillating. On narrow screens keep Launch, Shift and Nitrous in a safe-area-aware fixed control dock; hide it after the run.
- **Small sprites, large presentation:** Prepare intentionally small WebP sprites once, disable canvas smoothing when enlarging them, and draw race cars larger. This keeps downloads small while maintaining readable silhouettes on desktop and mobile.
