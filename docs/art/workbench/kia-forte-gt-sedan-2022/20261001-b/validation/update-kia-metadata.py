from pathlib import Path
root = Path("/home/desapoint/Projets/RacingGame")
def edit_block(rel, marker, next_marker, edits):
    path = root / rel
    with path.open("r", encoding="utf-8", newline="") as f:
        text = f.read()
    start = text.index(marker)
    end = text.index(next_marker, start)
    block = text[start:end]
    for old, new in edits:
        if old not in block:
            raise SystemExit(f"Expected target snippet missing in {rel}: {old!r}")
        block = block.replace(old, new, 1)
    with path.open("w", encoding="utf-8", newline="") as f:
        f.write(text[:start] + block + text[end:])
edit_block(
    "src/assets/cars/street-metadata.json",
    '  "kia-forte-gt-sedan-2022": {',
    '  "ford-mustang-boss302-1969": {',
    [
        ('    "width": 2172,\n    "height": 724,', '    "width": 2170,\n    "height": 725,'),
        ('      24,\n      31,\n      2122,\n      693', '      26,\n      31,\n      2115,\n      678'),
        ('        "y": 539,', '        "y": 540,'),
        ('        "x": 1720,', '        "x": 1718,'),
        ('    "paintColor": "#e56c12",', '    "paintColor": "#a92811",'),
        ('      "https://images.caricos.com/k/kia/2022_kia_forte/images/2560x1440/2022_kia_forte_12_2560x1440.jpg"\n', '      "https://images.caricos.com/k/kia/2022_kia_forte/images/2560x1440/2022_kia_forte_12_2560x1440.jpg",\n      "https://www.kia.com/us/content/dam/kia/us/brochures/2022-sedans-brochure.pdf"\n'),
        ('    "artworkSource": "User-supplied illustrated sprite, 2026-10-01"', '    "artworkSource": "User-supplied illustrated sprite corrected with OpenAI ImageGen, 2026-10-01; workbench docs/art/workbench/kia-forte-gt-sedan-2022/20261001-b/ preserves the prior and selected stages. Fire Orange hue is a visual approximation sampled from Kia\'s official brochure swatch, not a verified factory RGB value."'),
    ],
)
edit_block(
    "src/data/game-data.json",
    '      "id": "kia-forte-gt-sedan-2022",',
    '      "id": "ford-mustang-boss302-1969",',
    [('      "color": "#e56c12",', '      "color": "#a92811",')],
)
