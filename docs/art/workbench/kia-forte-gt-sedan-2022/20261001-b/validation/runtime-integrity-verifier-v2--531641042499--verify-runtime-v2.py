from __future__ import annotations
import base64, hashlib, json, subprocess
from pathlib import Path
root = Path("/home/desapoint/Projets/RacingGame")
run = root / "docs/art/workbench/kia-forte-gt-sedan-2022/20261001-b"
report = {}
def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()
def images(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    start = text.index("const payload = ") + len("const payload = ")
    end = text.index(";\nexport default payload;", start)
    return json.loads(text[start:end])
def catalog(path: Path):
    rows = {}
    decoder = json.JSONDecoder()
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith('  "') or "url: images[" not in line:
            continue
        sprite_id = line.split('"', 2)[1]
        image_index = int(line.split("images[", 1)[1].split("]", 1)[0])
        suffix = line.split("...", 1)[1].strip()
        spec, _ = decoder.raw_decode(suffix)
        rows[sprite_id] = (image_index, spec)
    return rows

canonical_png = (root / "src/assets/cars/kia-forte-gt-sedan-2022-2d.png").read_bytes()
archived_candidate = next((run / "cartoon-candidates").glob("attempt-03-fire-orange*attempt-03.png")).read_bytes()
assert sha(canonical_png) == sha(archived_candidate), "Canonical PNG differs from the selected archived candidate"
report["canonicalPngSha256"] = sha(canonical_png)
report["selectedCandidateByteEqual"] = True

metadata = json.loads((root / "src/assets/cars/street-metadata.json").read_text(encoding="utf-8"))["kia-forte-gt-sedan-2022"]
config = json.loads((root / "src/data/game-data.json").read_text(encoding="utf-8"))
car = next(c for c in config["cars"] if c["id"] == "kia-forte-gt-sedan-2022")
assert metadata["paintColor"] == car["color"] == "#a92811"
assert [metadata["width"], metadata["height"]] == [2170, 725]
assert metadata["bounds"] == [26, 31, 2115, 678]
assert metadata["wheels"] == [{"x":430,"y":540,"radius":162},{"x":1718,"y":540,"radius":162}]
report["stockColorMetadataConfigMatch"] = metadata["paintColor"]

webp_path = root / "src/assets/cars/optimized/kia-forte-gt-sedan-2022.webp"
webp = webp_path.read_bytes()
curr_chunk1_path = root / "src/assets/cars/payloads/chunk-1.ts"
curr_chunk1 = images(curr_chunk1_path)
url = curr_chunk1[1]
prefix, encoded = url.split(",", 1)
assert prefix == "data:image/webp;base64"
embedded = base64.b64decode(encoded, validate=True)
assert embedded == webp, "Embedded WebP differs from canonical optimized WebP"
report["canonicalWebpSha256"] = sha(webp)
report["canonicalWebpBytes"] = len(webp)
report["embeddedWebpExact"] = True

prior_catalog_file = next((run / "inputs").glob("prior-catalog*catalog.ts"))
before_rows = catalog(prior_catalog_file)
after_rows = catalog(root / "src/assets/cars/catalog.ts")
assert len(before_rows) == 60, f"Expected 60 mappings before Kia integration, found {len(before_rows)}"
unchanged = 0
for sprite_id, row in before_rows.items():
    if sprite_id == "kia-forte-gt-sedan-2022":
        continue
    assert after_rows.get(sprite_id) == row, f"Existing mapping changed: {sprite_id}"
    unchanged += 1
assert unchanged == 59 and len(after_rows) == len(before_rows)
assert after_rows["kia-forte-gt-sedan-2022"][0] == before_rows["kia-forte-gt-sedan-2022"][0] == 4
assert after_rows["kia-forte-gt-sedan-2022"][1]["paintColor"] == metadata["paintColor"]
assert after_rows["kia-forte-gt-sedan-2022"][1]["bounds"] == metadata["bounds"]
report["unchangedCatalogMappings"] = unchanged

prior_chunk1_file = next((run / "inputs").glob("prior-payload-chunk-1*chunk-1.ts"))
prior_chunk1 = images(prior_chunk1_file)
assert len(prior_chunk1) == len(curr_chunk1) == 3
assert curr_chunk1[0] == prior_chunk1[0] and curr_chunk1[2] == prior_chunk1[2]
report["preexistingChunk1UnchangedSha256"] = {str(i): sha(curr_chunk1[i].encode()) for i in (0, 2)}

prior_silverado_chunk19 = root / "docs/art/workbench/chevrolet-silverado-1500-custom-2025/20261001-a/runtime/final-payload-chunk-19--b19efca7847d--chunk-19.ts"
current_chunk19 = root / "src/assets/cars/payloads/chunk-19.ts"
assert current_chunk19.read_bytes() == prior_silverado_chunk19.read_bytes(), "Silverado's previous chunk-19 payload changed"
report["silveradoChunk19PreservedSha256"] = sha(current_chunk19.read_bytes())

unchanged_chunks = []
for path in sorted((root / "src/assets/cars/payloads").glob("chunk-*.ts")):
    chunk_index = int(path.stem.split("-")[1])
    if chunk_index in (1, 19):
        continue
    rel = path.relative_to(root).as_posix()
    head = subprocess.run(["git", "show", f"HEAD:{rel}"], check=True, stdout=subprocess.PIPE).stdout
    assert path.read_bytes() == head, f"Unrelated payload changed: {path.name}"
    unchanged_chunks.append(chunk_index)
report["otherRuntimeChunksUnchangedFromHead"] = unchanged_chunks

for dist_path in (root / "dist/index.html", root / "dist/config.js"):
    if dist_path.exists() and encoded.encode("ascii") in dist_path.read_bytes():
        report["releaseContainsExactKiaWebp"] = str(dist_path.relative_to(root))
        break
else:
    raise AssertionError("Offline release does not contain exact Kia WebP bytes")
assert "1 passed" in (run / "validation/final-kia-browser.log").read_text(encoding="utf-8")
assert "# pass 15" in (run / "validation/final-unit-tests.log").read_text(encoding="utf-8")
assert "Offline release: dist/index.html" in (run / "validation/final-build.log").read_text(encoding="utf-8")
report["focusedBrowser"] = "1 passed; offline request, console, and request-failure assertions passed"
report["unitTests"] = "15 passed"
report["build"] = "passed"
report["status"] = "PASS"
(run / "validation/runtime-integrity.log").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, indent=2))
