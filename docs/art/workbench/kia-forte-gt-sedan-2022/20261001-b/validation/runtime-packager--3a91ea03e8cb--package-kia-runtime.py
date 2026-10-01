import base64, hashlib, json
from pathlib import Path
root = Path("/home/desapoint/Projets/RacingGame")
meta = json.loads((root / "src/assets/cars/street-metadata.json").read_text(encoding="utf-8"))
spec = meta["kia-forte-gt-sedan-2022"]
webp_path = root / "src/assets/cars/optimized/kia-forte-gt-sedan-2022.webp"
webp = webp_path.read_bytes()
data_url = "data:image/webp;base64," + base64.b64encode(webp).decode("ascii")
chunk_path = root / "src/assets/cars/payloads/chunk-1.ts"
chunk_original = chunk_path.read_bytes().decode("utf-8")
eol = "\r\n" if "\r\n" in chunk_original else "\n"
chunk = chunk_original.replace("\r\n", "\n")
prefix = "const payload = "
start = chunk.index(prefix) + len(prefix)
end = chunk.index(";\nexport default payload;", start)
images = json.loads(chunk[start:end])
if len(images) != 3:
    raise SystemExit(f"Expected chunk-1 to hold 3 entries, got {len(images)}")
preserved_payload = {i: hashlib.sha256(images[i].encode()).hexdigest() for i in (0, 2)}
images[1] = data_url
chunk_updated = chunk[:start] + json.dumps(images, separators=(",", ":")) + chunk[end:]
chunk_path.write_bytes(chunk_updated.replace("\n", eol).encode("utf-8"))
check = json.loads(chunk_updated[start:start + len(json.dumps(images, separators=(",", ":")))])
if check[1] != data_url or any(hashlib.sha256(check[i].encode()).hexdigest() != preserved_payload[i] for i in (0, 2)):
    raise SystemExit("Payload verification failed")

catalog_path = root / "src/assets/cars/catalog.ts"
catalog_original = catalog_path.read_bytes().decode("utf-8")
cat_eol = "\r\n" if "\r\n" in catalog_original else "\n"
lines = catalog_original.splitlines(keepends=True)
matching = [i for i, line in enumerate(lines) if line.startswith('  "kia-forte-gt-sedan-2022":')]
if len(matching) != 1:
    raise SystemExit(f"Expected one Kia catalog row, got {len(matching)}")
index = matching[0]
old_line = lines[index]
body = {key: spec[key] for key in ("width", "height", "bounds", "wheels", "paintColor", "facing") if key in spec}
row = '  "kia-forte-gt-sedan-2022": { url: images[4], ...' + json.dumps(body, separators=(",", ":"), ensure_ascii=False) + " },"
newline = "\r\n" if old_line.endswith("\r\n") else "\n"
lines[index] = row + newline
catalog_updated = "".join(lines)
catalog_path.write_bytes(catalog_updated.encode("utf-8"))
changed_rows = sum(a != b for a, b in zip(catalog_original.splitlines(), catalog_updated.splitlines()))
if changed_rows != 1:
    raise SystemExit(f"Expected only the Kia catalog line to change, got {changed_rows}")

print(json.dumps({
    "canonicalWebp": str(webp_path),
    "webpBytes": len(webp),
    "webpSha256": hashlib.sha256(webp).hexdigest(),
    "payloadKiaExact": True,
    "payloadUntouchedEntries": preserved_payload,
    "catalogChangedRows": changed_rows,
}, indent=2))
