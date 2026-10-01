from pathlib import Path
p=Path("/home/desapoint/Projets/RacingGame/docs/art/workbench/kia-forte-gt-sedan-2022/20261001-b/validation/verify-runtime-v2.py")
s=p.read_text(encoding="utf-8")
s=s.replace('end = text.index(";", start)', 'end = text.index(";\\nexport default payload;", start)')
p.write_text(s, encoding="utf-8")
