# Drag Racing Game — Implementation Handoff

## Purpose and delivery target

Build a desktop-first, two-dimensional drag racing game inspired by the quick races, garage progression, and career ladder of *Drag Racer V2*. The art uses stylized side profiles based on modern performance car shapes. The game must run on modest hardware and ship as a static package that starts when its HTML entrypoint is opened directly, without a server or network connection.

This document is the implementation specification prepared during the planning phase. A playable v1 now implements this handoff; see [getting-started.md](getting-started.md) for the shipped scope and run instructions.

## Player experience

### Main loop and racing

The player moves among the garage, career ladder, race, results, jobs, single races, and settings. The garage shows the current car, performance, installed parts, paint, wheels, and livery. Results clearly show reaction time, elapsed time, trap speed, placement, and rewards.

Each race is a short side-view, two-lane quarter-mile drag race. Keep simulation approachable and timing-focused instead of building a full vehicle physics simulator:

- The player times the launch using an RPM/launch indicator, shifts manually through a visible shift window, and can use nitro when equipped.
- Desktop controls: Space launches, Up or Shift changes gear, and N uses nitro. Show the same actions as labeled touch controls; keep the input layer independent of the race simulation.
- Use a fixed-step simulation with `requestAnimationFrame` rendering. Clamp large frame deltas and pause race updates when the page is hidden. Render only the track and cars needed for the current view.
- Race results come from simulated elapsed time and distance, with launch, shift, tune, parts, car stats, rival behavior, and selected difficulty affecting the outcome.

### Difficulty, career, and rivals

Offer Easy, Normal, and Hard, changeable before any race without resetting career progress. Difficulty changes rival performance, launch reaction, shift accuracy, and mistake ranges. Do not reduce payouts on Easy; difficulty must not create a progression or currency trap.

The first career content set has four divisions—Street, Club, Pro, and Elite—with five sequential events per division, the fifth acting as its final. Players race every event in order and need a podium finish to unlock the next. Attempts are unlimited and have no entry fee. Events define eligible classes, parts or rating restrictions, opponent IDs, rewards, and unlock conditions in data.

Rivals are authored characters with stable IDs, names, cars, tunes, and racing profiles. Profiles describe launch timing, shift tendency, nitro use, and consistency. Rivals should feel distinct through authored race behavior and configurable stats; do not use rubber-banding or generative services.

### Recovery economy and idle income

Use one in-game currency. Do not charge mandatory race entry, repair, or retry fees. Keep a free, non-sellable loaner available for repeatable jobs and single races. Jobs pay a modest participation reward even when the player loses, with additional placement bonuses. This gives players a repeatable way to earn money or test a setup without risking career progress.

Add a small, upgradeable idle operation that accrues currency while the game is closed. On return, calculate elapsed time from the saved UTC timestamp and credit `min(rate × elapsed, remaining capacity)`. Clamp negative time to zero and effective offline time to 12 hours. Idle facility levels are finite and each level raises its hourly rate and stored-currency cap. Configure rates and capacities so the maximum offline claim at any level is no more than one low-tier job participation payout. This keeps idle earnings useful but secondary.

### Cars, parts, and appearance

The current roster uses eighteen real-car counterparts: fourteen recent models and four recognizable classics, superseding the initial fictional-car proposal at the user’s request. Each division has at least three models. Each car definition has a stable ID, model year, era, class, purchase price, performance stats, and an individual art ID. See car-art.md for reference sources and generation records.

Define five upgrade slots: engine, transmission, tires, nitro, and weight reduction. Parts have configurable prices, class limits, stat changes, and unlock requirements. Provide two setup controls—launch RPM and final-drive ratio—with ranges and event restrictions defined in game data. Parts and tuning must affect the race simulation consistently.

Construct each side-profile car from independent layers: shadow, rear wheel, body silhouette and paint masks, glass/trim/details, livery, and front wheel. Paint masks divide the body into named regions. Wheels are separate assets so rims can be swapped and wheel rotation can follow car speed.

The livery editor supports paint colors and simple freehand/vector marks. Clip marks to the body silhouette so they cannot spill outside the car. Store livery marks as compact vector commands in the save rather than saving a full-canvas bitmap. Keep asset geometry and paint regions easy to replace per car.

## Data, code, and packaging

Use TypeScript source organized by responsibility: app/screens, race simulation, Canvas renderer, input, garage and upgrades, career/jobs, economy/idle, livery editor, save repository, and config validation. Render the race with Canvas 2D; use regular HTML/CSS for menus, status, accessibility, and dialogs. Avoid a runtime UI framework or physics dependency unless profiling shows a concrete need.

Keep editable balance and progression values in one JSON game-data source file. It covers cars, classes, stats, part slots and prices, upgrade effects, restrictions, tuning ranges, career divisions/events, rivals, difficulty profiles, rewards, jobs, and idle rates/caps. Development imports the JSON; the release generates a separate editable `config.js` with the same object and reads it through a classic script tag, allowing edits without rebuilding. Do not fetch configuration at runtime. Define stable IDs, TypeScript types, and startup/development validation for references, ranges, and duplicate IDs. Keep paint masks and sprite geometry in the corresponding local car assets.

Use Vite for local development, where TypeScript is translated as the source is served, and esbuild for the release bundle. The release build embeds the classic IIFE game script, styles, and artwork in `dist/index.html` and emits a neighboring editable `dist/config.js`. Use relative paths, no module script, dynamic import, runtime `fetch`, remote CDN, server API, or network dependency. Keep both release files together when distributing them and verify play by opening `dist/index.html` through `file://`.

## Saves and offline behavior

Autosave to IndexedDB when it is available, with a guarded localStorage fallback. Detect and report storage failures rather than pretending a save succeeded. Provide JSON export and import in the UI so players can back up and move saves between browsers or machines.

Use a versioned save envelope containing format/schema version, app version, save ID, timestamps, and payload. The payload stores currency, cars, installed parts, tuning, career progress/results, settings, livery vector commands, idle facility level/bank, and last-seen timestamp. Store stable config IDs rather than copied definitions. Never reuse a retired ID; preserve unknown owned IDs as unavailable until content mapping or recovery is possible.

Implement ordered, deterministic migrations from each prior schema version. Validate before loading and after every migration. Keep the previous valid save until the migrated save has been committed successfully. If a save is malformed or migration fails, preserve it for export/recovery and explain the choices; never silently start over or overwrite it. Validate imported JSON and preview its save version before replacing the active profile.

Browser storage on `file://` is not guaranteed to behave consistently; MDN specifically notes that localStorage requirements for file URLs are undefined. Treat browser autosave as best-effort in this launch mode, expose save status, and make export/import the portable recovery path. [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

## Acceptance and verification

- Open the release HTML directly with the network disabled; start and finish a race without a server.
- Confirm development runs from source through Vite without a manual production build, and release code contains no runtime module imports.
- Exercise keyboard and touch launch, shift, and nitro input; verify race simulation is independent of the input device.
- Complete all career events in sequence; confirm podium unlocks, non-podium retries, difficulty switching, and no entry/repair fees.
- Spend all available currency, then recover through loaner jobs and single races. Confirm losses still award participation currency.
- Test idle return after short and long absences, repeated reopen, capacity reached, backward system clock, and the 12-hour elapsed-time clamp. Confirm idle claims obey the configured cap.
- Round-trip save export/import; load fixtures from each supported prior schema; test malformed saves and failed storage without losing the recoverable original.
- Verify each paint region changes independently, wheels can be replaced and rotate with speed, and every livery mark remains clipped to the silhouette.
- Profile a race at 1280×720 on modest desktop hardware; target stable 60 FPS and a frame budget of 16.7 ms. Cache static track drawing, cap effective canvas pixel ratio, and avoid per-frame allocations where practical. [MDN: Canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

Local HTML must not depend on ES module loading because browsers can block local module scripts under `file://`. [MDN: JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
