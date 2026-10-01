# Car artwork

## Roster and source records

The original roster contains eighteen real-car counterparts. The expansion adds thirty more models, each with Standard, Neglected and Rusty artwork. Factory sheets identify the real counterparts; race performance and condition losses remain arcade values. See [roster-expansion.md](roster-expansion.md).

Luna agents using medium reasoning researched and inspected web reference photographs and used the **built-in imagegen tool** to generate each model separately. Source links, input notes, and the prompt set are recorded by batch:

- [Street cars and Mustang](car-art-street.md): Civic Si, Golf GTI, GR Corolla, red Mazda3 Turbo sedan, orange Forte GT sedan, Mustang Boss 302.
- [Club cars and Japanese classics](car-art-club.md): M3 Competition, RS3 sedan, A45 S, RX-7 FD, Supra RZ, Skyline GT-R R34.
- [Performance cars](car-art-performance.md): 911 Turbo S, GT-R Nismo, Corvette Z06, 296 GTB, Revuelto, 750S.
- [Performance 2D conversion prompts](car-art-performance-2d.md): the illustrated versions of those six models.
- [Expansion clean cars](car-art-expansion-clean.md), [neglected variants](car-art-expansion-used.md), and [rusty variants](car-art-expansion-rusty.md).

Realistic sprites are retained in [the documentation art archive](art/README.md). Game sprites are then transformed into a flatter illustrated 2D style matching the user's `car-game-assets.zip`. Fine trim, badges, and reflections can differ from a production car. The distinctive body profile is the primary recognition cue.

## Files

- `docs/art/realistic/<model-id>.png`: retained realistic model reference.
- `src/assets/cars/<model-id>-2d.png`: illustrated game source artwork (condition IDs include `-used` or `-rusty`).
- `src/assets/cars/reference/`: retained Street-batch reference inputs; other batches record their source URLs in the linked notes. References are never imported into the game bundle.
- `src/assets/cars/*-metadata.json`: source dimensions, visible bounds, wheel disc coordinates, original paint hue, orientation, and reference URLs.
- `src/assets/cars/optimized/<model-id>.webp`: compact deployment copies with alpha, at most 800 × 400 pixels.
- `src/assets/cars/geometry-overrides.json`: final measured corrections, applied after batch metadata.
- `src/assets/cars/catalog.ts`: generated imports and sprite geometry.

To regenerate deployment copies after changing source artwork or metadata, install ImageMagick's `convert` command and run:

```sh
npm run assets:prepare
npm run build
```

Normal development and release builds use the prepared WebPs and do not require ImageMagick. Original PNGs and downloaded references are excluded from the release.

## Runtime parts

`src/render/car.ts` prepares an 800 × 300 canonical canvas when a sprite is needed for the garage, current dealership page, or race. A bounded cache retains at most twelve prepared sprites. The image's own aspect ratio and wheelbase are retained. Left-facing sources are mirrored during preparation, with wheel coordinates transformed with them.

Wheel discs are extracted into independent small canvases and removed from the body layer. The outer tire edges remain static where necessary to avoid rotating fenders. Wheel rotation and replacement rims use these per-model centers.

`src/render/sprite-paint.ts` derives a paint mask from the source hue and connected painted panels. Paint changes preserve shading. Livery strokes are clipped to that mask; glass, tires, and most fixed trim are excluded. These masks are derived from artwork rather than hand-authored exact part boundaries, so small body details may retain their original color.

Painted bodies and livery composites are cached until customization changes. Racing draws the cached body and two wheel discs; it does no pixel processing per frame. The release embeds all deployment images as data URLs and reads configuration with a classic local script, preserving direct `file://` launch without external image requests or canvas tainting.
