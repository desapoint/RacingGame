# Street car sprite references

Six car sprites use real vehicle photography as model references. Five generated PNGs face right in orthographic side view; the 2024 GR Corolla output faces left and is mirrored at runtime. All have transparent alpha. The PNGs are high-resolution originals; the game can scale them down at render time, while the shared metadata supplies source image bounds, stock wheel crop centers and radii, initial paint color, and facing direction.

Generation used the built-in `image_gen` tool in its default image-generation mode, with transparent-background output enabled. It did not use the fallback CLI/API workflow. Each generation call received the local reference image listed in the table through `referenced_image_paths`. Prompts below are the final prompt text sent for each sprite.

Wheel values and bounds are measured/estimated in each full PNG's pixel coordinate system. Wheel centers and radii are practical crop geometry for runtime wheel rotation, so check edge alignment when the rendering integration is complete. The generated sprite contains the original wheels; the runtime should cover/crop those regions consistently when drawing rotating wheel overlays. Paint colors record the generated base paint and can seed a hue-derived paint mask.

The reference photographs below are retained under `src/assets/cars/reference/` for provenance. They are not runtime assets.

| Car | Generated sprite | Reference source |
| --- | --- | --- |
| 2023 Honda Civic Si Sedan | `honda-civic-si-2023.png` | [Cars.com photo](https://platform.cstatic-images.com/xxlarge/in/v2/stock_photos/ab6caf3f-e4cf-49d6-9c2f-867da2fa63bb/ff8ca6d2-32a6-4b44-8f31-66fe236f70f8.png), [model page](https://www.cars.com/research/honda-civic_si-2023/) |
| 2024 Volkswagen Golf GTI | `volkswagen-golf-gti-2024.png` | [Motor1 photo](https://cdn.motor1.com/images/mgl/8AN21W/s1/vw-golf-gti-2024.webp), [AutoEvolution gallery](https://www.autoevolution.com/news/2024-vw-golf-gti-pricing-announced-costs-new-bmw-3-series-money-233882.html) |
| 2024 Toyota GR Corolla | `toyota-gr-corolla-2024.png` | [MotorTrend photo](https://www.motortrend.com/uploads/2023/06/2024-Toyota-GR-Corolla-13.png), [Toyota image album](https://pressroom.toyota.com/album/2024-toyota-gr-corolla/) |
| 2021 Mazda3 Turbo Sedan | `mazda3-turbo-sedan-2021.png` | [Motor1 Turbo photo](https://cdn.motor1.com/images/mgl/b3jkl/s1/2021-mazda3-turbo-first-drive.jpg), [J.D. Power model gallery](https://www.jdpower.com/cars/2021/mazda/mazda3) |
| 2022 Kia Forte GT Sedan | `kia-forte-gt-sedan-2022.png` | [Kia newsroom photo](https://www.kiamedia.com/us/en/media/photos/17929/2022-forte-22), [Caricos GT side photo](https://images.caricos.com/k/kia/2022_kia_forte/images/2560x1440/2022_kia_forte_12_2560x1440.jpg) |
| 1969 Ford Mustang Boss 302 Fastback | `ford-mustang-boss302-1969.png` | [Mecum Boss 302 photo](https://res.cloudinary.com/mecum/image/upload/v1669823128/auctions/fl22/fl0122-494122/1713947_8.jpg), [auction listing](https://www.mecum.com/lots/FL0122-494122/1969-ford-mustang-boss-302-fastback/) |

The generated art follows the real models' side profiles and prominent trim cues. Exact manufacturer emblems are not required; maintain the body proportions and lamps, glass, fender, wheel, roof and deck shapes that make each car recognizable.

## Final prompts

### 2023 Honda Civic Si Sedan

Reference input: `src/assets/cars/reference/honda-civic-si-2023-reference.png`.

> Use the supplied real car photo as visual reference for an accurate 2023 Honda Civic Si sedan game sprite. Pure orthographic side profile, front facing right, four doors, modern 11th-generation Civic Si roofline, long hood, distinctive sharp rear quarter and trunk with subtle spoiler, proper glass and wheel placement. Paint vivid Rallye Red; realistic dark Si wheels and red calipers. Crisp detailed polished illustration sized for a lightweight racing game, no perspective or 3/4 view, vehicle only fully visible and centered. Transparent alpha background with no checkerboard, environment, floor, shadow, text, branding letters, or watermark. Keep recognizable as this exact car.

### 2024 Volkswagen Golf GTI

Reference input: `src/assets/cars/reference/volkswagen-golf-gti-2024-reference.webp`.

> Create a single transparent game sprite closely based on the supplied real reference: 2024 Volkswagen Golf GTI (Mk8 facelift), exact five-door hot hatch side silhouette and proportions. Strict right-facing orthographic side view, red paint, GTI-specific sporty 18-inch alloy wheels with red calipers, characteristic short rear overhang, upright Golf hatch, dark rear spoiler, long cabin glass, red grille accent visible at the front edge, and angular updated lamps. Crisp realistic automotive illustration with clear model details, vehicle only, full car centered and visible. Transparent alpha background, no checkerboard, no ground, no shadow, no scenery, no text, no watermark. Do not draw a Golf R or generic hatchback.

### 2024 Toyota GR Corolla

Reference input: `src/assets/cars/reference/toyota-gr-corolla-2024-reference.png`.

> Use the supplied real photo to make a recognizable 2024 Toyota GR Corolla Circuit Edition sprite. Pure right-facing orthographic side profile, unmistakable wide-bodied GR Corolla five-door hatchback with flared arches, three-cylinder performance hatch stance, side vent behind front wheel, GR rocker marks, big rear roof spoiler, compact steep hatch, dark multi-spoke wheels and red brake calipers. Paint vivid Toyota blue. Keep authentic 2024 GR Corolla proportions/details from the reference, no generic Corolla hatch. Crisp polished detailed racing-game illustration, vehicle only fully visible and centered, transparent alpha background. No checkerboard, ground, shadow, environment, typography, logos as text, or watermark.

The generated Corolla faces left despite the prompt's requested orientation. The `facing: "left"` metadata records the actual PNG orientation; runtime mirroring handles it.

### 2021 Mazda3 Turbo Sedan

Reference input: `src/assets/cars/reference/mazda3-2021-side.jpg`.

> Create a realistic game sprite based closely on the supplied image reference. Exact vehicle: 2021 Mazda3 2.5 Turbo AWD four-door sedan (not hatchback), deep Soul Red, right-facing pure side profile, with black 18-inch alloy wheels like the Turbo trim. Preserve the genuine Mazda3 sedan silhouette, window shape, swept roof, rear shoulder, short trunk and proportions from the reference. Crisp polished, detailed side-view illustration, vehicle only and fully visible, centered. Transparent alpha background; no checker pattern, environment, ground, cast shadow, text, extra objects, watermark. Do not alter the model into a generic sports sedan.

### 2022 Kia Forte GT Sedan

Reference input: `src/assets/cars/reference/kia-forte-2022-official.jpg`; prompt also referenced the [Caricos GT side image](https://images.caricos.com/k/kia/2022_kia_forte/images/2560x1440/2022_kia_forte_12_2560x1440.jpg).

> Generate a polished transparent side-profile game sprite closely matching the supplied official Kia image. Subject is the real 2022 Kia Forte GT four-door sedan (not the GT-Line), painted saturated metallic orange, front facing right, orthographic clean side view. Preserve facelifted 2022 Forte's sloping roof and trunk, long window line, slim angular headlamps, wide tiger-nose fascia form, sport bumpers, red GT calipers and correct five-spoke/turbine 18-inch GT wheels. Use this web side-profile reference for exact model cues: https://images.caricos.com/k/kia/2022_kia_forte/images/2560x1440/2022_kia_forte_12_2560x1440.jpg. Vehicle only fully visible, crisply detailed but natural, centered. True transparent alpha, no checkerboard, background, ground, shadow, text, watermark or extra objects. Must read as 2022 Forte GT, not generic sedan.

### 1969 Ford Mustang Boss 302 Fastback

Reference input: `src/assets/cars/reference/mustang-boss-302-1969-reference.jpg`.

> Make a vintage 2D racing game sprite based closely on the supplied real 1969 Ford Mustang Boss 302 photo. Exact classic Mustang fastback body shape: long flat hood, low roof arcing into fastback rear, short deck, period side windows and rear louver cues, chrome bumpers, 1969 Mustang nose, black Boss 302 hockey-stick side stripe/hood accent and period Magnum 500 style wheels. Deep bright red paint. Strict side-on orthographic, front facing right, no perspective. Preserve the actual proportions and details visible in the reference. Crisp polished detailed but game-readable automotive illustration, car only and fully visible, centered. True transparent alpha, no checkerboard/background/floor/shadow, no added text or watermark.
