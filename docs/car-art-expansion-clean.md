# Expansion clean car sprites

These originals are clean, right-facing, orthographic side-profile cutouts with transparent alpha. Variants are produced by separate consumer agents from these assets. Clean-sprite generation uses the built-in `image_gen` tool in default image-generation mode with `transparent_background: true` and local web reference pixels passed via `referenced_image_paths`; no CLI/API fallback is used.

Factory records are U.S.-market specs and carry source URLs in `src/data/expansion-models.json`. Factory specifications remain the same for condition variants. The `notes` field records conversions or limits where the source does not split a spec by drivetrain. Wheel metadata uses source-image pixels; `radius` is an inset tire radius for overlay cropping.

## 2024 Toyota RAV4 XLE AWD

- Stable ID: `toyota-rav4-xle-awd-2024`
- Original: `src/assets/cars/toyota-rav4-xle-awd-2024.png` (1774×887 RGBA)
- Viewed pixel reference: `src/assets/cars/reference/toyota-rav4-xle-awd-2024.png`
- Reference: [McClure Toyota 2024 RAV4 XLE AWD catalog](https://www.mccluretoyota.com/en/new-catalog/toyota/2024-toyota-rav4-xle-id25737), [reference image](https://img.sm360.ca/ir/w640h390c/images/newcar/ca/2024/toyota/rav4/xle-/suv/exteriorColors/2024_toyota_rav4-2-xle-awd_ext_001_01g3.png)
- Factory spec sources: [Toyota 2024 RAV4 eBrochure](https://www.toyota.com/content/dam/toyota/brochures/pdf/2024/rav4_ebrochure.pdf), [Toyota USA Newsroom](https://pressroom.toyota.com/2024-toyota-rav4-go-wild-in-style/), [WhichTrim XLE AWD specs](https://www.whichtrim.com/toyota/rav4/2024/xle-awd/)
- Verified factory facts: 2.5L gas I4, 203 hp, 184 lb-ft (249 Nm), eight-speed automatic, five seats, 180.9-inch length, 105.9-inch wheelbase. Toyota lists 3,405 lb for the XLE grade without distinguishing drivetrains; the 3,515 lb AWD value (1,594 kg) is sourced from WhichTrim. Wheel centers: (362, 588) and (1412, 588); inset radius 96 px. Alpha bounds at 50% threshold: [16, 134, 1738, 645].

Final generation prompt:

> Create a clean high-detail game sprite based on this exact real 2024 Toyota RAV4 XLE AWD reference photo. Show one 2024 RAV4 XLE AWD, dark saturated blue paint, five-door compact family SUV, authentic 2019–2024 XA50 facelift side silhouette and proportions, roof rails, body cladding, XLE 17-inch silver five-spoke wheels and 2024 lamps. Pure orthographic side profile, front facing right, full vehicle visible, centered, wheels included and unobstructed. Crisp polished automotive illustration with realistic details, keep this recognizable exact trim/model, not an Adventure, Hybrid, Prime, or generic crossover. Transparent alpha cutout only: no checkerboard, environment, ground, reflection, shadow, or text, logos as text, watermark.

## 2024 Honda CR-V EX-L AWD 1.5T (`honda-crv-exl-awd-2024`)

- Reference image downloaded and inspected: [LeDé Sports Honda side profile](https://img.sm360.ca/ir/w640h390c/images/newcar/ca/2024/honda/cr-v/ex-l/suv/exteriorColors/2024_honda_cr-v_ex-l_001_b-640m.png), from [2024 CR-V EX-L listing](https://www.ledesporthonda.ca/en/new-catalog/honda/2024-honda-cr-v-ex-l-id25384).
- Factory specifications: [Honda Information Center](https://www.hondainfocenter.com/2024/CR-V/Feature-Guide/Specifications/) and [2024 feature guide by trim](https://www.hondainfocenter.com/-/media/Honda-Sales-Tool-Media-Folder/Images/2024-CR-V/PDFs/2024-CR-V-Features-by-Trim.ashx).
- Prompt (built-in imagegen mode; reference passed as local image): “Use case: product-mockup. Asset type: clean transparent side-view sprite for a lightweight 2D racing game. Input image: reference photo of the exact 2024 Honda CR-V EX-L AWD, use for model and trim silhouette. Subject: one 2024 Honda CR-V EX-L AWD 1.5T, deep saturated blue paint, five-door compact family SUV with the recognizable 2023+ sixth-generation long hood, upright cabin, black lower cladding, slim headlamps, distinctive rear quarter window and 18-inch EX-L wheels. Composition: pure orthographic side profile facing right, whole vehicle centered with margin, wheels visible unobstructed. Style: crisp realistic automotive illustration retaining exact real model proportions and trim cues. Backdrop: true transparent alpha only. Avoid ground, shadows, reflections, scenery, text, watermark, extra objects, generic SUV proportions.”
- Output: `src/assets/cars/honda-crv-exl-awd-2024.png`, 1774×887 RGBA; wheel hubs visually inspected at native size and recorded in `expansion-clean-metadata.json`.

## 2024 Mazda CX-5 Turbo Premium AWD (`mazda-cx5-turbo-premium-2024`)

- Reference downloaded and inspected: [2024 Mazda CX-5 Turbo Signature side profile](https://di-uploads-pod38.dealerinspire.com/theautobarnmazdaofevanston/uploads/2024/05/2024-Mazda-CX-5-2.5-Turbo-Signature-In-Machine-Gray-Metallic-Banner.jpg), from [Autobarn Mazda review](https://www.mazdaofchicagoland.com/cx-5-turbo-signature-model-review/). Reference is the same 2024 Turbo body generation and powertrain family; trim-specific grille/wheel differences are not asserted.
- Specs: [Mazda USA 2024 CX-5 specification deck](https://filecache.mediaroom.com/mr5mr_mazdausa2/223259/download/2024%20CX-5%20Spec%20Deck.pdf) and [Mazda USA newsroom](https://news.mazdausa.com/vehicles-2024-cx-5). Turbo Premium facts: 256 hp, 320 lb-ft (434 Nm), AWD, 6-speed automatic, 180.1-inch length, 106.2-inch wheelbase, 5 passenger. Curb weight left null because deck extraction does not unambiguously map weight to Turbo Premium column.
- Prompt (built-in imagegen mode; downloaded reference passed): “Use case: product-mockup. Asset type: transparent side-view sprite for a 2D racing game. Input image: Mazda CX-5 2.5 Turbo trim profile reference, preserve this exact generation's silhouette and proportion. Subject: 2024 Mazda CX-5 2.5 Turbo Premium AWD, saturated red paint, compact five-door SUV, long sculpted hood, rounded Mazda nose, tapered rear quarter glass, black arch cladding, premium 19-inch multi-spoke wheels and signature lamps. Composition: pure orthographic side profile facing right, entire car centered, both wheels unobstructed. Style: crisp realistic automotive illustration, recognizable production shape. Backdrop: true transparent alpha only. Avoid ground, shadows, reflections, scenery, labels, text, watermark, other cars.”
- Output: `src/assets/cars/mazda-cx5-turbo-premium-2024.png`, 2172×724 RGBA; wheel centers inspected at native size, recorded in metadata.

## 2024 Subaru Forester Sport AWD (`subaru-forester-sport-2024`)

- Exact trim reference downloaded and inspected: [2024 Forester Sport side view](https://img.sm360.ca/ir/w640h390c/images/newcar/ca/2024/subaru/forester/sport/suv/exteriorColors/2024_subaru_forester_sport_ext_001_4s.png), from [Beauce Subaru 2024 Sport catalog](https://www.beaucesubaru.com/en/new-catalog/subaru/2024-subaru-forester-sport-id26957).
- Factory facts: [Subaru 2024 Forester brochure](https://www.subaru.com/content/dam/subaru/downloads/pdf/brochures/2024/2024_Forester_Brochure_101023.pdf).
- Prompt (built-in imagegen mode, exact reference passed locally): “Use case: product-mockup. Asset type: transparent side profile sprite for a 2D racing game. Input image: exact 2024 Subaru Forester Sport side profile reference; preserve fifth-generation SK body shape and Sport exterior details. Subject: 2024 Subaru Forester Sport AWD, saturated bright blue paint, compact boxy five-door SUV, high roof, tall windows, squared wheel arches, black cladding, Sport orange lower-body accents, black 18-inch wheels, distinctive lamps. Composition: orthographic pure side profile facing right, full vehicle centered, wheels included. Crisp realistic automotive illustration closely matching actual production proportions. True transparent alpha background only. Avoid ground, shadow, environment, text, logos, watermark or any additional vehicle.”
- Output: `src/assets/cars/subaru-forester-sport-2024.png`, 1606×979 RGBA; native image reviewed, with wheel metadata recorded.

## 2024 Kia Telluride SX AWD (`kia-telluride-sx-awd-2024`)

- Studio side reference downloaded/viewed: [2024 Telluride SX Limited catalog image](https://img.sm360.ca/images/newcar/ca/2024/kia/telluride/sx-limited-/suv/main/2024_KIA_Telluride_SX-Limitee_MAIN.png), listed by [Groupe Simpson](https://www.groupesimpson.com/fr/catalogue-neuf/kia/kia-telluride-sx-limited-2024-id25475). The initial J.D. Power image URL was blocked by a challenge page; this exact-generation catalog profile was used instead.
- Factory specs: [Kia 2024 specifications](https://www.kiamedia.com/us/en/models/telluride/2024/specifications) and [2024 overview](https://www.kiamedia.com/us/en/models/telluride/2024).
- Prompt (built-in imagegen mode, viewed reference passed locally): “Use case: product-mockup. Asset type: transparent side-profile sprite for a lightweight 2D racing game. Input image: exact 2024 Kia Telluride SX Limited side reference, preserve this generation's long three-row SUV profile, roofline, window shapes and details. Subject: 2024 Kia Telluride SX AWD, saturated deep blue metallic paint, large boxy 3-row midsize SUV, upright squared grille, vertical rear lamp, roof rails, chrome window surround, 20-inch dark multi-spoke wheels, unmistakably Telluride. Composition: pure orthographic side profile facing right, full vehicle centered and wheels unobstructed. Crisp realistic automotive game illustration with correct real production proportions. True transparent alpha only, no floor/ground, shadows, reflection, scenery, lettering, logos or extra vehicles.”
- Output: `src/assets/cars/kia-telluride-sx-awd-2024.png`, 1682×935 RGBA.

## 2024 Hyundai Palisade Calligraphy AWD

- Stable ID: `hyundai-palisade-calligraphy-2024`
- Original: `src/assets/cars/hyundai-palisade-calligraphy-2024.png` (1774×887 RGBA)
- Viewed pixel reference: `src/assets/cars/reference/hyundai-palisade-calligraphy-2024.png`
- Reference: [Hyundai Palisade preferred side profile catalog image](https://img.sm360.ca/ir/w640h390c/images/newcar/ca/2024/hyundai/palisade/preferred-/suv/exteriorColors/2024_palisade_1-preferred_ext_001_p7v.png)
- Prompt: Orthographic, right-facing, clean dark gray Palisade side-profile game sprite. Preserved the long three-row body, squared wheel arches, vertical lighting character, high beltline, rear quarter glass and roof rails; transparent background, no ground or extra objects.
- Native alpha bounds: [23, 158, 1748, 786]. Wheel hubs: (398, 640) and (1368, 640), radius 128 px.
- Factory data: Hyundai USA 2024 Palisade specifications. Factory curb mass remains null because an AWD Calligraphy-specific primary figure was not verified.

## New realistic-reference prompt records

These expansion references were generated from the archived real side-profile photos under `docs/art/references/`. Each companion JSON in `docs/art/realistic/` contains measured image bounds and wheel geometry; the ready marker publishes the realistic-reference stage. Exact prompts are recorded per model in `docs/art/prompts/`. Add the separate Standard 2D prompt record when that gameplay sprite is generated.

| Model | Reference image | Realistic prompt |
| --- | --- | --- |
| 2024 Volkswagen Jetta Sport | `docs/art/references/volkswagen-jetta-sport-2024-reference.webp` | [`volkswagen-jetta-sport-2024.realistic.txt`](art/prompts/volkswagen-jetta-sport-2024.realistic.txt) |
| 2024 Toyota Sienna XLE | `docs/art/references/toyota-sienna-xle-2024-reference.png` | [`toyota-sienna-xle-2024.realistic.txt`](art/prompts/toyota-sienna-xle-2024.realistic.txt) |
| 2024 Honda Odyssey EX-L | `docs/art/references/honda-odyssey-exl-2024-reference.png` | [`honda-odyssey-exl-2024.realistic.txt`](art/prompts/honda-odyssey-exl-2024.realistic.txt) |
| 2024 Subaru Outback Wilderness | `docs/art/references/subaru-outback-wilderness-2024-reference.jpg` | [`subaru-outback-wilderness-2024.realistic.txt`](art/prompts/subaru-outback-wilderness-2024.realistic.txt) |
| 2024 Ford F-150 XLT V8 | `docs/art/references/ford-f150-xlt-v8-2024-reference.png` | [`ford-f150-xlt-v8-2024.realistic.txt`](art/prompts/ford-f150-xlt-v8-2024.realistic.txt) |
| 2024 Toyota Tacoma TRD Off-Road | `docs/art/references/toyota-tacoma-trd-offroad-2024-reference.jpg` | [`toyota-tacoma-trd-offroad-2024.realistic.txt`](art/prompts/toyota-tacoma-trd-offroad-2024.realistic.txt) |

| 2024 Ford Maverick XL Hybrid | `docs/art/references/ford-maverick-xl-hybrid-2024-reference.png` | [`ford-maverick-xl-hybrid-2024.realistic.txt`](art/prompts/ford-maverick-xl-hybrid-2024.realistic.txt) |
