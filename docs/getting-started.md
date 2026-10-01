# Redline — Drag Club v1

A lightweight, desktop-first quarter-mile drag racer. Pick a car, build a setup, and climb from Street to Elite. Everything runs locally; there are no accounts, entry fees, or network requests.

## Play the release

Double-click `dist/index.html` in a modern browser. Keep the editable `dist/config.js` and the `dist/assets/` directory beside it. Copy the release package together anywhere on your drive and open the HTML through `file://` without a server or internet connection. The game loads configuration as a classic local script; no browser security flags or CORS extensions are needed.

Double-clicking the repository's root `index.html` also works: it opens the built `dist/index.html`. Run `npm run build` first if the release is missing or you have changed the source.

For development, with Node.js 22.12 or newer:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Source edits update without a release build.

To produce a release:

```sh
npm run build
```

This type-checks the source and uses esbuild to embed the game script and CSS into `dist/index.html`. It also generates a readable `dist/config.js` from the source JSON and copies the optimized car atlases into `dist/assets/`. Distribute the HTML, config, and assets directory together.

## Edit the configuration

- **Playing the built release:** Edit the JSON-style object in `dist/config.js`, save it, and reload the HTML. No rebuild is needed. Leave the `globalThis.REDLINE_CONFIG =` assignment and final semicolon in place.
- **Developing the game:** Edit `src/data/game-data.json`. Vite reads this JSON directly, and `npm run build` regenerates `dist/config.js` from it. A rebuild replaces any edits made only to the release config.

Cars, prices, performance values, parts, rewards, rivals, difficulty, tuning, and idle income all live in this configuration. See [configuration.md](configuration.md) for field meanings and editing examples.

## First race

1. Start with the 2021 Mazda Mazda3 and 8,000 credits. Upgrades are optional for the first event.
2. Choose **Career**, select a difficulty, and start **First light**. Easy changes rival pace but keeps the same rewards.
3. Wait for the lights to turn green, then press **Space**. Launching before green adds a 0.75-second penalty; press again on green to launch.
4. Press **Up** or **Shift** in the green RPM window (6,100–6,800 RPM). All cars have six gears. Early or late shifts cost time.
5. If nitrous is installed, press **N** after launch. **Esc** pauses and resumes. The labeled buttons support touch and mouse.
6. Finish in the top three to unlock the next event. Your race is ranked against three simulated rivals; the first rival appears in the other lane. Total time, including reaction, determines placement.

Garage launch RPM changes the preferred launch window. Final drive trades top speed for acceleration. Engine, transmission, tire, nitro, and weight upgrades affect the same simulation used in every race.

## What is included

- Four divisions with five sequential events each and a 30-car sprite-backed roster spanning modern performance cars and classic race-prepped models.
- Career, single races, results, and two repeatable paid jobs.
- Five upgrade slots, three stages per slot, and two tuning controls.
- Independent body and lower-trim paint, three wheel styles, and a freehand vector livery editor. Drawings are clipped to the body; undo and clear are available.
- A free loaner job with a guaranteed participation payout, even in last place.
- A three-level workshop with limited offline earnings. Claim its bank in **Jobs & workshop**.
- Autosave, save export/import with preview, and recovery of unreadable stored data.
- Responsive menus, touch race buttons, reduced-motion settings, and automatic pause when the page is hidden.

## Save behavior

Progress is saved to IndexedDB, with localStorage as a fallback. The footer reports whether saving worked. Browsers differ in how they handle local-file storage, so use **Settings → Export save** for a portable backup.

Import validates the file and previews its version, balance, cars, and progression before replacement. The active profile is replaced only after storage commits successfully. Unknown car and part IDs remain in the save for future recovery. Unreadable stored data pauses autosaving; export the original before explicitly replacing it.

Schema 1 is the first public format. There are no earlier released schemas to migrate. The repository contains a version dispatch point for future deterministic migrations; unsupported schemas are preserved for recovery.

Idle earnings accrue from a saved UTC timestamp, use at most 12 hours per absence, and stop at the facility's cap. A backwards system clock earns nothing and does not lower the timestamp. Even the largest bank is smaller than a basic job's participation payout.

## Checks

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

The browser tests open the built HTML through `file://` with network access disabled. Screenshots and exported-save fixtures are written into `test-results/`.

## Source map

| Location | Responsibility |
| --- | --- |
| `src/main.ts` | App lifecycle, navigation, fixed-step loop, UI coordination |
| `src/data/game-data.json` | Cars, parts, events, rivals, rewards, difficulty, tuning, idle economy |
| `src/data/config.ts` | Typed config indexes and startup validation |
| `src/game/` | Pure race simulation, garage operations, progression, economy |
| `src/render/` | Canvas scenery and sprite-backed layered car rendering |
| `src/input/` | Keyboard-to-action mapping |
| `src/ui/` | Menu templates and pointer livery editing |
| `src/storage/` | Save validation, persistence, import/export, recovery |
| `scripts/build.mjs` | Offline release packaging |

## V1 scope

The art uses three optimized local WebP atlases: 30 body sprites, matching paint masks, and separate wheels. The renderer keeps wheels and paint/livery layers independent so customization and wheel rotation still work. One industrial night strip serves every event. There is no sound, online multiplayer, or controller support. Balance is an initial pass and should be tuned through playtesting. Modest-hardware performance still needs validation on a representative physical device.
