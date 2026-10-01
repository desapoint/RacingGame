from pathlib import Path
import subprocess
root=Path("/home/desapoint/Projets/RacingGame")
run=Path("docs/art/workbench/kia-forte-gt-sedan-2022/20261001-b")
helper="/mnt/c/Users/jason/.codex/skills/racing-car-sprites/scripts/archive_sprite_run.py"
files=[
"archive-final.py","fix-archive-stage.py","verify-runtime.py","verify-runtime-v2.py","fix-integrity-parser.py",
"update-kia-metadata.py","update-kia-metadata-v2.py","package-kia-runtime.py","probe-test.py","probe-screenshot-test.py",
"render-pdf-page.mjs","fix-camera-test.py","add-livery-stroke.py"
]
for name in files:
    rel=run / "validation" / name
    subprocess.run(["python3",helper,"add","--run-dir",str(run),"--stage","validation","--role","workflow-"+name.replace(".py","").replace(".mjs",""),"--file",str(rel)],cwd=root,check=True,stdout=subprocess.DEVNULL)
    print("archived validation/"+name)
