# V1 verification — 2026-09-29

## Expansion preview — 2026-09-30

This is an intermediate build, not the completed 108-entry roster. See [art production status](art/roster.md) for current assets; the historical sections below describe earlier builds.

- The latest checked preview contains 53 selectable entries representing 34 models. It includes all three RAV4 conditions and illustrated versions of the Civic starter, six performance cars, and published expansion entries. Some original cars still await style conversion.
- Build/type checking passes. Release sizes are approximately 2,820 KB for embedded HTML/code/art and 81.0 KB for editable `config.js`. Deployment art totals 2,039 KB. Original PNGs and realistic references are excluded from release bytes.
- All eight existing offline Chromium checks passed in 15.8 seconds. Full races pass from the release, repository root, and a relocated two-file package with spaces and non-ASCII characters, with browser security enabled and no CORS errors. Every currently installed dealership sprite was decoded and drawn offline across five pages.
- The external config edit check still changes starting money and Mazda horsepower without rebuilding HTML. RAV4 factory/condition details, mobile controls, save roundtripping and storage recovery pass. Rendered dealership pages and the condition sheet were visually reviewed.
- A newly added Volvo fuel label initially failed startup validation. It was corrected to the supported `mild hybrid` value, and release packaging now runs the shared startup validator before replacing playable files. The successful run above follows that correction.
- All 30 expansion factory sheets are now authored with sources; the remaining artwork and final roster review are still in progress. No new low-end-device performance claims or cross-browser coverage are made by this preview.

## Build and development

- `npm run build`: TypeScript checking and classic-script release bundling pass.
- Release size: approximately 83 KB for HTML, JavaScript, and CSS combined, before compression. No runtime dependencies, remote assets, or runtime module imports.
- Vite starts from source and serves translated `src/main.ts` without a release build.

## Automated checks

`npm test`: 9 passing checks cover configuration integrity; all twenty career events completed in sequence on Easy with stock cars; losses and locked events; skill, tuning, and upgrade effects; jump-start penalties and pause; offline idle caps and backwards clocks; save validation and unknown IDs; and purchase restrictions.

`npm run test:browser`: 4 passing Chromium tests cover:

1. Opening `dist/index.html` through `file://` with networking disabled; garage upgrades and paint; pointer livery drawing; save export/import; a complete keyboard-driven career race and podium unlock; persistence after reload; no browser errors or HTTP requests.
2. A 390-pixel mobile viewport without page overflow; on-screen launch, shift, nitro, and pause controls.
3. Malformed stored data retained verbatim for export; invalid imports leaving the current profile intact.
4. IndexedDB blocked and localStorage writes failing; visible failure status with gameplay and export still available.

Browser screenshots and exported fixtures are generated in `test-results/`.

## Performance sample and remaining limits

A short sample of the race staging scene in headless Chromium at 1280×720, with DevTools CPU throttling set to 4×, measured 179 frame intervals: mean 16.67 ms, 95th percentile 16.70 ms, maximum 16.80 ms. This is a synthetic scene check, not a physical low-end-device benchmark or a guarantee of full-race frame times.

Remaining manual coverage: representative low-end hardware, mobile Safari, browser-specific `file://` persistence, prolonged progression/economy playtesting, and assistive-technology usability. V1 has one strip, three shared car silhouette families, and no audio. Browser export remains the portable save path.

## Sedan roster update — 2026-09-29

- Added two dedicated sedan profiles, bringing the dealership to fourteen cars. The rebuilt offline release is approximately 86 KB.
- TypeScript checking, release build, and all nine simulation/data checks pass. The content check now enforces at least three cars per division so additional Street cars are allowed.
- Focused offline Chromium checks passed for each new car: dealership listing, purchase with starting credits, correct red/orange default paint, selected-car persistence after reload, and rendering/acceleration in a single race. Both garage profiles were visually inspected.

## Direct-file / CORS verification — 2026-09-29

- `npm run build` passes and emits one self-contained `dist/index.html` (85.6 KB). JavaScript, CSS, configuration, and car artwork are inline. Obsolete generated sibling scripts/styles are removed by the build.
- All six Chromium browser tests pass. Complete races run offline through `file://` from the release, the repository root (which redirects to the release), and a copy of only the HTML in a separate `Drive copy #1 é/Redline game.html` path.
- Tests record console errors, JavaScript exceptions, and failed requests: none occurred. The standalone release requests only its own HTML document. No external stylesheets or script/module elements are present. Browser web security remains enabled.
- The HTTP development entrypoint was also checked in Chromium against Vite: the source TypeScript module and source stylesheet load, the garage renders, and there are no console errors.
- These results verify Chromium. Other browsers' local-file save-storage behavior still varies as described in the playing guide; export/import remains available.

## Editable configuration verification — 2026-09-29

- The release now consists of `index.html` (77.8 KB) and editable `config.js` (16.1 KB), superseding the single-file packaging above. Source configuration remains JSON.
- Build/type checking, all nine simulation/data checks, and all eight Chromium browser tests pass.
- A copied release was edited only through its config: starting funds changed from 8,000 to 12,345 and Mazda horsepower from 250 to 275. The game reflected both changes with identical HTML bytes, no rebuild, and no console errors.
- Complete offline races still pass through the root entrypoint, release, and a relocated two-file package, with no CORS errors or failed requests. The only extra local request is the classic `config.js` script.
- Missing and malformed config objects show readable startup errors. There is no embedded default data hiding a missing release config.

## Reference sprite roster — 2026-09-29

- Replaced the generic car art with eighteen individual generated sprites based on real-car references: fourteen recent models and four classics. The red Mazda3 Turbo and orange Forte GT remain included.
- Inspected every source sprite and the complete rendered dealership roster. Refined wheel centers using native-resolution diagnostic crops; wheel discs sit inside the tire edges. The Corolla and McLaren are mirrored during preparation to face the race direction.
- `npm run assets:prepare` produced 18 transparent WebPs totaling 1,078 KB. `npm run build` passed TypeScript checking and generated `dist/index.html` at 1,520 KB plus `dist/config.js` at 19.6 KB. Source PNGs and web reference photographs are not shipped in the release.
- All eight existing Chromium browser checks passed against the final build. Complete races work from the release, repository root, and relocated two-file package with networking disabled and normal browser security. No CORS errors, JavaScript errors, or failed requests occurred in those flows. Embedded image data URLs are excluded from the assertion that only the HTML and config are external resources.
- Editing the external config still changes starting funds and Mazda horsepower without rebuilding the HTML. Save persistence, customization, mobile controls, and storage-recovery checks passed.
- `test-results/roster.png` captures all eighteen actual dealership canvases. Garage and race screenshots remain in `test-results/`.
- The earlier procedural-art frame-time sample above predates this artwork replacement. This update caches pixel processing outside the race loop, but still needs measurement on representative physical low-end hardware. Other browser engines were not exercised here.

## Integrated branch verification

Before merging the local sprite integration, run `npm run typecheck`, `npm test`, and `npm run build`. The build must remain a two-file offline release (`dist/index.html` plus editable `dist/config.js`), must not require separate runtime images, and must keep the compact sprite payload embedded. Verify the race HUD has no horizontal RPM bar, staging RPM remains fixed at the configured launch value, and the mobile Launch/Shift/Nitrous dock stays reachable without covering the timing slip after the race.
