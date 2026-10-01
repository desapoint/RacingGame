# Cars, specifications and condition

The expansion plan adds 30 real models to the original 18. It spans compact and three-row family SUVs, sedans, hatchbacks, a wagon, minivans, pickups, electric crossovers, a convertible and sports coupes. Each new model has three independently illustrated purchase entries: Standard, Neglected and Rusty. The completed target is 48 models and 108 selectable cars.

## Browsing

The dealership initially shows Standard cars. Search by name, engine or segment; filter by category and condition; sort by roster order, price, power or name. Twelve cars appear per page. **Specs & condition** opens a factory sheet and condition comparison from either the dealership or garage.

Each sheet identifies model year, trim, market, category, engine, energy type, drivetrain, transmission, passenger capacity, horsepower, torque and curb weight. Available dimensions are included. Linked source documents and notes explain conversions, fuel requirements and market differences. Unconfirmed values remain `null` and display as not verified in the referenced source. A published dry or tare weight is not silently treated as curb weight. Passenger-door counts exclude hatches and tailgates.

Factory sheets describe production counterparts. Shared six-speed race controls, speed ceilings, acceleration, grip, prices and condition penalties remain arcade balance. Power conversions use mechanical horsepower; original PS/CV or kW ratings are recorded in notes. The original 18 cars retain their existing game balance and stable IDs.

## Wear affects racing

| Condition | Power | Acceleration | Speed ceiling | Grip | Extra shift delay | Price |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Standard | 100% | 100% | 100% | 100% | 0 s | 100% |
| Neglected | 88% | 85% | 93% | 88% | 0.07 s | 62% |
| Rusty | 65% | 62% | 80% | 70% | 0.18 s | 30% |

These are fictional game condition states, including for recent models. Neglected cars show faded paint, dirt, scratches and small dents. Rusty cars show deep dents, localized severe corrosion, rust holes and worn trim. Body panels retain paint in every condition; whole bare-steel doors or other stripped panels are excluded, as clarified by the user. Both retain the identifiable body and independently rotating wheels. Repainting does not repair mechanical condition. Upgrades apply to each condition's reduced starting values. Mass and race division remain the same across a model's variants.

## Data and asset workflow

- `src/data/expansion-plan.json`: the 30 stable base IDs and categories.
- `src/data/original-models.json`: source-backed sheets for the existing 18 models.
- `src/data/expansion-models.json`: source-backed sheets for the new models.
- `src/data/condition-profiles.json`: assembly multipliers above.
- `src/data/game-data.json`: assembled, editable game configuration.
- `src/assets/cars/expansion-*-metadata.json`: per-condition sprite geometry and provenance.
- `src/assets/cars/geometry-overrides.json`: legacy realistic-sprite corrections. Final 2D sprites use their own measured metadata; the legacy overrides do not apply to them.

Three Luna medium workers form a producer/consumer pipeline. The clean worker archives a realistic PNG under `docs/art/realistic/` and publishes `src/assets/cars/ready/<id>.json` with its `realisticFile` path and source geometry. The clean worker then derives a cartoon-like 2D Standard sprite. The neglected and rusty workers independently watch that directory and derive their stylized versions from the realistic reference plus the supplied style atlas. Completion markers (`<id>-standard.done.json`, `<id>-used.done.json`, `<id>-rusty.done.json`) identify final 2D outputs. They do not depend on chat handoffs. Markers are authoring artifacts, never browser dependencies. See [the art archive guide](art/README.md).

After every input is complete:

```sh
npm run roster:assemble
npm run assets:prepare
npm run build
node scripts/write-art-index.mjs
node scripts/write-art-gallery.mjs
```

The assembler requires at least 30 planned models, a factory record and all three final 2D sprites for each, plus final 2D artwork for the original 18. `node scripts/assemble-roster.mjs --partial` is only for intermediate previews; it excludes unfinished expansion artwork, including superseded realistic wear studies. Reassembly is idempotent, preserves original IDs and replaces expansion entries from the source sheets and condition profiles. Missing factory curb weights use a documented category estimate for game mass; the factory sheet remains unverified for that value. The release build runs the startup data validator before replacing playable files.

The generated `dist/config.js` remains directly editable. Assembly multipliers are authoring inputs; to edit an already built release, change the explicit performance fields on its car entries.

For artwork measurement, `node scripts/inspect-car-geometry.mjs expansion-clean` produces a diagnostic sheet in `/tmp`; use `expansion-used` or `expansion-rusty` for the condition batches. Green circles must be centered on the actual hubs and stay inside each tire. Facing and alpha bounds are measured on each output, including edited variants.

The [local comparison gallery](art/gallery.html) shows a model's realistic reference beside its published Standard, Neglected and Rusty illustrations. It opens through `file://`, loads at most four images per view, and marks unfinished assets as Pending. Regenerate it and the publication index after each artwork batch.

## Runtime budget

Deployment sprites are at most 800 × 400 WebP with alpha. Original PNGs remain intact in the repository. The release embeds deployment bytes; only `config.js` is a separate runtime file. At most 12 prepared sprites and eight painted appearances are retained. The garage loads its selected car, dealership loads its visible page, and racing prepares the two visible cars before simulation starts. No per-frame pixel scans or remote requests are added.

See the [clean](car-art-expansion-clean.md), [neglected](car-art-expansion-used.md), and [rusty](car-art-expansion-rusty.md) source and prompt records. All sprites use the built-in image generation tool.
