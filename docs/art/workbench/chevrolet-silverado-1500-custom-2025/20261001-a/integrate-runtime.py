import json,re
from pathlib import Path
repo=Path("/home/desapoint/Projets/RacingGame")
scratch=Path("/tmp/silverado-runtime.F622oC/src/assets/cars")
image_id="chevrolet-silverado-1500-custom-2025"
temp_catalog=(scratch/"catalog.ts").read_text()
source_line=next((line for line in temp_catalog.splitlines() if f'"{image_id}":' in line),None)
if not source_line or "images[0]" not in source_line: raise SystemExit("generated new-car catalog entry not found")
entry=source_line.replace("images[0]","images[59]",1).rstrip().rstrip(",")+","
payload_text=(scratch/"payloads/chunk-0.ts").read_text()
payload_match=re.search(r'const payload = (.*);\nexport default payload;',payload_text,re.S)
new_payload=json.loads(payload_match.group(1))
if len(new_payload)!=1: raise SystemExit("expected one generated WebP")
payload_path=repo/"src/assets/cars/payloads/chunk-19.ts"
old_text=payload_path.read_text()
old_match=re.search(r'const payload = (.*);\nexport default payload;',old_text,re.S)
payload=json.loads(old_match.group(1))
if len(payload)!=2: raise SystemExit(f"expected two current items in final chunk; got {len(payload)}")
catalog_path=repo/"src/assets/cars/catalog.ts"
catalog=catalog_path.read_text()
if image_id in catalog: raise SystemExit("new entry already exists")
indices=[int(n) for n in re.findall(r'url: images\[(\d+)\]',catalog)]
if len(indices)!=59 or max(indices)!=58: raise SystemExit(f"unexpected current catalog indexes: count={len(indices)} max={max(indices)}")
if "import payload19 from './payloads/chunk-19';" not in catalog: raise SystemExit("existing final payload import missing")
terminator="};\n"
if not catalog.endswith(terminator): raise SystemExit("unexpected catalog ending")
catalog=catalog[:-len(terminator)] + entry + "\n};\n"
payload.append(new_payload[0])
payload_path.write_text("// High-resolution runtime sprite payload generated from full-resolution source art.\nconst payload = "+json.dumps(payload)+";\nexport default payload;\n")
catalog_path.write_text(catalog)
print(json.dumps({"newImageIndex":59,"payloadCount":len(payload),"entry":entry[:350],"webpDataUrlLength":len(new_payload[0])},indent=2))
