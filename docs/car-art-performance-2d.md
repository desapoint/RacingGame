# Performance-car 2D sprite conversions

The realistic originals remain archived in `docs/art/realistic/`. The six game sprites below were converted with the built-in imagegen tool using each exact model PNG as the edit target and `docs/art/style-reference/sports-car-side-sprite-atlas.png` as a style reference. A second targeted built-in edit removed an unwanted backdrop from the Porsche output; its initial generated output was not used as the game sprite.

Shared prompt: Convert the exact supplied production-car sprite into a clean illustrated 2D racing-game sprite. Preserve model-specific silhouette, proportions, paint hue, facing, and wheel locations. Match the atlas with crisp black outlines, simplified body shapes, broad cel-shaded color regions, restrained highlights, and clean shaded windows. Remove photoreal reflections and tiny details. Keep one complete car with two intact tires and hubs. Keep original canvas and vehicle framing. Require genuine transparent alpha; exclude scenery, ground, floor, shadow, glow, gradient, backdrop, text, extra cars, atlas grid, and other objects. The atlas is style-only; its individual cars and background are not to be copied.

| ID | Model details preserved | Facing | Reference image |
| --- | --- | --- | --- |
| `porsche-911-turbo-s-2024` | Blue 911 Turbo S silhouette, rear wing, proportions, hubs | right | `docs/art/realistic/porsche-911-turbo-s-2024.png` |
| `nissan-gtr-nismo-2024` | Blue GT-R Nismo, rear wing, red trim, proportions, hubs | right | `docs/art/realistic/nissan-gtr-nismo-2024.png` |
| `chevrolet-corvette-z06-2024` | Yellow C8 Corvette Z06, side intake, proportions, hubs | right | `docs/art/realistic/chevrolet-corvette-z06-2024.png` |
| `ferrari-296-gtb-2024` | Red Ferrari 296 GTB silhouette, side intake, proportions, hubs | right | `docs/art/realistic/ferrari-296-gtb-2024.png` |
| `lamborghini-revuelto-2024` | Green angular Revuelto silhouette and proportions, hubs | right | `docs/art/realistic/lamborghini-revuelto-2024.png` |
| `mclaren-750s-2024` | Orange 750S silhouette, proportions, hubs | left | `docs/art/realistic/mclaren-750s-2024.png` |

Game outputs are `<id>-2d.png` in `src/assets/cars/`. `src/assets/cars/performance-metadata.json` records each final file, native PNG dimensions, measured alpha bounds, wheel geometry, original paint hue, facing, references, and `renderStyle: "cartoon-2d"`.
