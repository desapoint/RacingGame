from pathlib import Path
import subprocess
root = Path("/home/desapoint/Projets/RacingGame")
run_rel = Path("docs/art/workbench/kia-forte-gt-sedan-2022/20261001-b")
run = root / run_rel
helper = "/mnt/c/Users/jason/.codex/skills/racing-car-sprites/scripts/archive_sprite_run.py"
artifacts = [
    ("cartoon-candidates", "canonical-selected-kia-png", "src/assets/cars/kia-forte-gt-sedan-2022-2d.png", None),
    ("metadata", "selected-native-geometry", f"{run_rel}/metadata/selected-geometry.json", None),
    ("previews", "final-wheel-geometry-overlay", f"{run_rel}/previews/final-geometry.png", None),
    ("metadata", "final-street-metadata", "src/assets/cars/street-metadata.json", None),
    ("metadata", "final-stock-config", "src/data/game-data.json", None),
    ("runtime", "final-catalog", "src/assets/cars/catalog.ts", None),
    ("runtime", "final-payload-chunk-1", "src/assets/cars/payloads/chunk-1.ts", None),
    ("runtime", "final-optimized-kia-webp", "src/assets/cars/optimized/kia-forte-gt-sedan-2022.webp", None),
    ("runtime", "built-offline-index", "dist/index.html", None),
    ("runtime", "built-offline-config", "dist/config.js", None),
    ("validation", "focused-kia-browser-test-source", "tests/browser/kia-forte-fire-orange.spec.ts", None),
    ("validation", "build-log", f"{run_rel}/validation/final-build.log", None),
    ("validation", "unit-test-log", f"{run_rel}/validation/final-unit-tests.log", None),
    ("validation", "focused-browser-log", f"{run_rel}/validation/final-kia-browser.log", None),
    ("validation", "runtime-integrity-log", f"{run_rel}/validation/runtime-integrity.log", None),
    ("validation", "runtime-integrity-verifier-v2", f"{run_rel}/validation/verify-runtime-v2.py", None),
    ("validation", "runtime-integrity-parser-fix", f"{run_rel}/validation/fix-integrity-parser.py", None),
    ("validation", "runtime-packager", f"{run_rel}/validation/package-kia-runtime.py", None),
    ("validation", "metadata-updater", f"{run_rel}/validation/update-kia-metadata-v2.py", None),
    ("validation", "camera-and-wheel-test-fix", f"{run_rel}/validation/fix-camera-test.py", None),
    ("validation", "livery-skirt-test-extension", f"{run_rel}/validation/add-livery-stroke.py", None),
]
for filename in ("kia-stock-fire-orange.png", "kia-repaint.png", "kia-livery.png", "kia-race-results.png"):
    artifacts.append(("validation", f"browser-{filename.removesuffix('.png')}", f"{run_rel}/validation/screenshots/{filename}", None))
for stage, role, file, url in artifacts:
    args = ["python3", helper, "add", "--run-dir", str(run_rel), "--stage", stage, "--role", role, "--file", str(file)]
    if url:
        args += ["--source-url", url]
    subprocess.run(args, cwd=root, check=True, stdout=subprocess.DEVNULL)
    print(f"archived {stage}:{role} <- {file}")
