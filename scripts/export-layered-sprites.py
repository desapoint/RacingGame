#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import re
import shutil
from pathlib import Path

import numpy as np

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
CAR_DIR = ROOT / "src" / "assets" / "cars"
CATALOG = CAR_DIR / "catalog.ts"
OUT = ROOT / "sprite-layer-review"
MISSING_2D = {
    "volkswagen-golf-gti-2024",
    "toyota-gr-corolla-2024",
    "ford-mustang-boss302-1969",
}

def load_specs() -> dict[str, dict]:
    text = CATALOG.read_text(encoding="utf-8")
    specs: dict[str, dict] = {}
    pattern = re.compile(r'^\s*"([^"]+)":\s*\{\s*url:\s*images\[\d+\],\s*\.\.\.(\{.*\})\s*\},?$', re.M)
    for match in pattern.finditer(text):
        specs[match.group(1)] = json.loads(match.group(2))
    if not specs:
        raise RuntimeError("No sprite specs parsed from catalog.ts")
    return specs

def flatten_white_background(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    arr = np.array(rgba, copy=True)
    white = (
        (arr[:, :, 3] > 0)
        & (arr[:, :, 0] > 245)
        & (arr[:, :, 1] > 245)
        & (arr[:, :, 2] > 245)
    )
    arr[white, 3] = 0
    return Image.fromarray(arr, "RGBA")

def cartoonize(img: Image.Image) -> Image.Image:
    rgba = flatten_white_background(img)
    alpha = rgba.getchannel("A")
    rgb = rgba.convert("RGB").filter(ImageFilter.MedianFilter(3))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
    rgb = ImageEnhance.Color(rgb).enhance(1.12)
    rgb = ImageOps.posterize(rgb, 5)
    edges = rgb.filter(ImageFilter.FIND_EDGES).convert("L")
    edges = ImageOps.autocontrast(edges).point(lambda p: 255 if p > 58 else 0)
    outline = Image.new("RGB", rgb.size, (18, 19, 22))
    rgb.paste(outline, mask=edges)
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out

def source_for(key: str) -> tuple[Path, bool]:
    stylized = CAR_DIR / f"{key}-2d.png"
    if stylized.exists():
        return stylized, False
    raw = CAR_DIR / f"{key}.png"
    if raw.exists():
        return raw, True
    raise FileNotFoundError(f"No source sprite for {key}")

def crop_square(img: Image.Image, cx: float, cy: float, radius: float, factor: float = 2.24):
    side = max(8, int(round(radius * factor)))
    left = int(round(cx - side / 2))
    top = int(round(cy - side / 2))
    crop = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    src_box = (max(0, left), max(0, top), min(img.width, left + side), min(img.height, top + side))
    paste_xy = (max(0, -left), max(0, -top))
    if src_box[2] > src_box[0] and src_box[3] > src_box[1]:
        crop.paste(img.crop(src_box), paste_xy)
    return crop, left, top

def hsv_like(r: int, g: int, b: int):
    mx = max(r, g, b)
    mn = min(r, g, b)
    sat = 0 if mx == 0 else (mx - mn) / mx
    val = mx / 255
    return sat, val

def extract_caliper_mask(crop: Image.Image, radius_px: float) -> Image.Image:
    arr = np.asarray(crop.convert("RGBA"))
    h, w = arr.shape[:2]
    yy, xx = np.ogrid[:h, :w]
    rr = np.sqrt((xx + 0.5 - w / 2) ** 2 + (yy + 0.5 - h / 2) ** 2) / max(1.0, radius_px)
    rgb = arr[:, :, :3].astype(np.float32)
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    saturation = np.divide(
        maximum - minimum,
        maximum,
        out=np.zeros_like(maximum),
        where=maximum > 0,
    )
    value = maximum / 255.0
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    mask = (
        (rr <= 0.68)
        & (arr[:, :, 3] >= 40)
        & (saturation > 0.43)
        & (value > 0.28)
        & (lum > 38)
    )
    raw = Image.fromarray((mask.astype(np.uint8) * 255), "L")
    return raw.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(3))

def make_rotating_rim(crop: Image.Image, radius_px: float, caliper_mask: Image.Image) -> Image.Image:
    rgba = crop.convert("RGBA")
    arr = np.asarray(rgba)
    h, w = arr.shape[:2]
    yy, xx = np.ogrid[:h, :w]
    rr = np.sqrt((xx + 0.5 - w / 2) ** 2 + (yy + 0.5 - h / 2) ** 2) / max(1.0, radius_px)

    rgb = arr[:, :, :3].astype(np.float32)
    lum = 0.299 * rgb[:, :, 0] + 0.587 * rgb[:, :, 1] + 0.114 * rgb[:, :, 2]
    maximum = rgb.max(axis=2)
    minimum = rgb.min(axis=2)
    saturation = np.divide(
        maximum - minimum,
        maximum,
        out=np.zeros_like(maximum),
        where=maximum > 0,
    )
    edge = np.asarray(rgba.convert("L").filter(ImageFilter.FIND_EDGES))
    cal = np.asarray(caliper_mask)

    keep = (
        ((rr >= 0.66) & (rr <= 1.03))
        | (rr <= 0.16)
        | ((rr > 0.16) & (rr < 0.66) & (edge > 32))
        | ((rr > 0.16) & (rr < 0.66) & (lum < 72))
        | ((rr > 0.16) & (rr < 0.66) & (lum > 188) & (edge > 15))
        | ((rr > 0.16) & (rr < 0.66) & (saturation > 0.18) & (edge > 18))
    )
    keep &= (rr <= 1.03) & (arr[:, :, 3] >= 20) & (cal <= 40)
    alpha = np.where(keep, arr[:, :, 3], 0).astype(np.uint8)
    mask = Image.fromarray(alpha, "L").filter(ImageFilter.MaxFilter(3))
    out = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    out.paste(rgba, (0, 0), mask)
    return out

def make_rotor(size: tuple[int, int], radius_px: float) -> Image.Image:
    w, h = size
    cx, cy = w / 2, h / 2
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(out)
    ro = radius_px * .58
    ri = radius_px * .19
    d.ellipse((cx-ro, cy-ro, cx+ro, cy+ro), fill=(148, 151, 154, 255), outline=(67, 70, 74, 255), width=max(2, int(radius_px*.035)))
    d.ellipse((cx-ri, cy-ri, cx+ri, cy+ri), fill=(62, 65, 69, 255), outline=(190, 193, 196, 230), width=max(1, int(radius_px*.018)))
    hole_r = max(1.5, radius_px * .018)
    for i in range(16):
        a = i * math.tau / 16
        hr = radius_px * .45
        x = cx + math.cos(a) * hr
        y = cy + math.sin(a) * hr
        d.ellipse((x-hole_r, y-hole_r, x+hole_r, y+hole_r), fill=(48, 51, 55, 220))
    return out

def make_caliper(crop: Image.Image, caliper_mask: Image.Image, radius_px: float) -> Image.Image:
    out = Image.new("RGBA", crop.size, (0, 0, 0, 0))
    bbox = caliper_mask.getbbox()
    if bbox:
        extracted = Image.new("RGBA", crop.size, (0, 0, 0, 0))
        extracted.paste(crop, (0, 0), caliper_mask)
        return extracted
    # Fallback for neutral/black calipers that cannot be color-isolated.
    w, h = crop.size
    cx, cy = w/2, h/2
    d = ImageDraw.Draw(out)
    rw = radius_px * .18
    rh = radius_px * .32
    x = cx + radius_px * .39
    y = cy
    d.rounded_rectangle((x-rw, y-rh, x+rw, y+rh), radius=max(2, int(rw*.4)),
                        fill=(58, 61, 65, 255), outline=(28, 30, 33, 255),
                        width=max(1, int(radius_px*.025)))
    return out

def paste_local(full: Image.Image, local: Image.Image, left: int, top: int):
    full.alpha_composite(local, (left, top))

def erase_wheel(body: Image.Image, cx: float, cy: float, r: float):
    mask = Image.new("L", body.size, 0)
    d = ImageDraw.Draw(mask)
    rr = r * 1.025
    d.ellipse((cx-rr, cy-rr, cx+rr, cy+rr), fill=255)
    body.paste((0, 0, 0, 0), (0, 0), mask)

def save_png(img: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", compress_level=3)

def main():
    specs = load_specs()
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    manifest = {"format": 1, "cars": [], "missing2d": sorted(MISSING_2D)}
    missing_dir = OUT / "missing-2d"

    for key, spec in specs.items():
        source, needed_conversion = source_for(key)
        base = Image.open(source).convert("RGBA")
        if needed_conversion:
            base = cartoonize(base)
            save_png(base, missing_dir / f"{key}-2d.png")

        car_dir = OUT / "cars" / key
        car_dir.mkdir(parents=True, exist_ok=True)

        body = base.copy()
        wheels = spec["wheels"]
        for wheel in wheels:
            erase_wheel(body, wheel["x"], wheel["y"], wheel["radius"])
        save_png(body, car_dir / "body.png")

        facing = spec.get("facing", "right")
        ordered = sorted(enumerate(wheels), key=lambda p: p[1]["x"])
        rear_idx, front_idx = (ordered[0][0], ordered[1][0]) if facing == "right" else (ordered[1][0], ordered[0][0])

        preview = body.copy()
        layer_meta = {}
        local_layers = {}

        for index, wheel in enumerate(wheels):
            crop, left, top = crop_square(base, wheel["x"], wheel["y"], wheel["radius"])
            radius_local = wheel["radius"]
            cal_mask = extract_caliper_mask(crop, radius_local)
            rim = make_rotating_rim(crop, radius_local, cal_mask)
            rotor = make_rotor(crop.size, radius_local)
            caliper = make_caliper(crop, cal_mask, radius_local)
            label = "front" if index == front_idx else "rear"

            save_png(rim, car_dir / f"wheel-{label}.png")
            save_png(rotor, car_dir / f"brake-{label}.png")
            save_png(caliper, car_dir / f"caliper-{label}.png")
            local_layers[index] = (rotor, caliper, rim, left, top)
            layer_meta[label] = {
                "center": [wheel["x"], wheel["y"]],
                "radius": wheel["radius"],
                "offset": [left, top],
                "size": list(crop.size),
                "rotation": {"wheel": True, "brakeRotor": True, "caliper": False},
            }

        # Correct z-order: body/fenders, brake rotor, fixed caliper, then rotating tire/rim.
        for i in range(len(wheels)):
            rotor, caliper, rim, left, top = local_layers[i]
            paste_local(preview, rotor, left, top)
            paste_local(preview, caliper, left, top)
            paste_local(preview, rim, left, top)
        save_png(preview, car_dir / "preview.png")

        metadata = {
            "art": key,
            "source": source.relative_to(ROOT).as_posix(),
            "generated2d": needed_conversion,
            "canvas": [base.width, base.height],
            "bounds": spec["bounds"],
            "paintColor": spec["paintColor"],
            "facing": facing,
            "layers": {
                "body": "body.png",
                "front": {
                    "wheel": "wheel-front.png",
                    "brakeRotor": "brake-front.png",
                    "caliper": "caliper-front.png",
                    **layer_meta["front"],
                },
                "rear": {
                    "wheel": "wheel-rear.png",
                    "brakeRotor": "brake-rear.png",
                    "caliper": "caliper-rear.png",
                    **layer_meta["rear"],
                },
            },
        }
        (car_dir / "metadata.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
        manifest["cars"].append({"art": key, "generated2d": needed_conversion, "path": f"cars/{key}"})

    guide = """# RacingGame layered sprite review

This package is for visual inspection before runtime metadata/code changes are committed.

## What is included

- Every current runtime art ID from `src/assets/cars/catalog.ts`.
- The approved `-2d.png` source is used whenever it exists.
- Three missing illustrated sources are generated into `missing-2d/`: Volkswagen Golf GTI 2024, Toyota GR Corolla 2024, and 1969 Ford Mustang Boss 302.
- Every car folder contains a full-size body layer, front/rear tire+rim layers, front/rear brake-rotor layers, fixed front/rear caliper layers, a zero-rotation preview, and metadata with native offsets.

## Layer order

Draw the body first. At each wheel center draw the brake rotor, then the fixed caliper, then the tire/rim. Rotate the tire/rim and brake rotor by wheel angle. Never rotate the caliper.

The current game clips a complete wheel disc from the source image and rotates it, so a visible caliper inside that crop rotates too. This package separates that fixed hardware so the renderer can keep the caliper stationary.

## Manual review

Inspect `cars/<art-id>/preview.png` first. Then inspect each wheel's three local PNGs. Colored source calipers are extracted where possible; dark/neutral calipers use a restrained fallback shape for this review pass. The generated missing 2D cars are intentionally isolated in `missing-2d/` so they can be accepted or replaced independently.

Do not replace the realistic archive. When accepted, copy the missing `-2d.png` files into `src/assets/cars/` and keep the realistic files untouched. The next implementation pass should wire these layer files/offsets into source metadata and rebuild the compact runtime payload rather than performing per-frame image analysis.
"""
    (OUT / "GUIDE.md").write_text(guide, encoding="utf-8")
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()

