from pathlib import Path
p=Path("/home/desapoint/Projets/RacingGame/docs/art/workbench/kia-forte-gt-sedan-2022/20261001-b/validation/archive-final.py")
s=p.read_text(encoding="utf-8").replace('("final-source", "canonical-selected-kia-png"', '("cartoon-candidates", "canonical-selected-kia-png"')
p.write_text(s,encoding="utf-8")
