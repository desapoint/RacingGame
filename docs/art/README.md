# Car art references and game style

The [car art index](roster.md) links each realistic reference and published illustrated variant, with unfinished entries marked Pending.

Open [the comparison gallery](gallery.html) directly from disk to view one model's realistic reference and its three illustrated conditions together. Regenerate it after publishing assets with `node scripts/write-art-gallery.mjs`; it displays at most four local source images at a time.

## Realistic references

`realistic/` preserves a realistic side-profile PNG for every real car model. Each companion `<model-id>.json` records its source geometry and web-reference URLs. Earlier realistic condition studies are also retained, including superseded rusty versions; they are reference material, not necessarily the selected game artwork.

Never overwrite a realistic reference with a stylized image. New models first get a recognizable realistic reference, which is saved here before their game sprites are made.

## Supplied style reference

`style-reference/` contains the unmodified contents of the user's root `car-game-assets.zip`. Its side-profile atlas is the visual guide: crisp dark outlines, simplified reflections, broad shaded paint regions and a drawn 2D appearance. The wheel atlases show separate tire/rim artwork. The supplied roster JSON is retained with the archive; it does not replace the game's expansion plan.

## Game sprites

The game uses separate `<id>-2d.png`, `<id>-used-2d.png` and `<id>-rusty-2d.png` source assets in `src/assets/cars/`, encoded as WebPs for release. Each is generated from the realistic model reference and the supplied style atlas, preserving recognizable proportions while simplifying surface detail. The runtime extracts wheel discs using coordinates measured on each final stylized image.

Standard is clean. Neglected has faded paint, dirt, scuffs and minor dents. Rusty has severe wear, deep dents, localized corrosion and rust holes. **All conditions retain painted panels; no entire bare-steel doors or other stripped panels.** Both wheels remain complete. Only a single car on true transparency appears in each game asset; the atlas background and grid are not reproduced.

Metadata marks a completed game sprite with `renderStyle: "cartoon-2d"` and links its `realisticReference`. Full roster assembly requires this stage for every car, including the original 18. The three Luna medium workers use the built-in image generation tool; prompts and provenance remain in the batch documents linked from [car-art.md](../car-art.md).
