# V1 verification — 2026-09-29

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


## Sprite-backed roster update — 2026-09-29

- Repository integrity checks confirm 30 cars with unique sprite indexes 1–30, valid starter/loaner references, twenty career events, and three valid rivals for each division.
- The three optimized WebP atlas blobs total 55,586 bytes. Their Git object hashes matched the locally generated bytes before they were attached to the branch.
- A source scan found no remaining legacy `.art`, `bodyPath`, or sedan-renderer references; the old procedural sedan renderer was removed.
- Node, build, and Playwright checks were not rerun in this execution environment because the runtime could not resolve GitHub for a branch checkout. Run `npm test`, `npm run build`, and `npm run test:browser` locally or in CI before merge.
