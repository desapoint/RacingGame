import base64, hashlib, json, re
from pathlib import Path
root=Path('/home/desapoint/Projets/RacingGame')
run=root/'docs/art/workbench/chevrolet-silverado-1500-custom-2025/20261001-a'
def old(pattern):
    paths=list((run/'inputs').glob(pattern))
    assert len(paths)==1,(pattern,paths)
    return paths[0]
def payloads(path):
    return re.findall(r'data:image/webp;base64,([A-Za-z0-9+/=]+)',path.read_text())
p1=root/'src/assets/cars/payloads/chunk-1.ts'
assert p1.read_bytes()==old('previous-payload-chunk-*-chunk-1.ts').read_bytes(),'old chunk-1 changed'
p19=root/'src/assets/cars/payloads/chunk-19.ts'
old19=payloads(old('payload-chunk-19-before-silverado-*-chunk-19.ts'))
new19=payloads(p19)
assert new19[:len(old19)]==old19,'pre-existing chunk-19 WebP payload entries changed'
canonical=(root/'src/assets/cars/optimized/chevrolet-silverado-1500-custom-2025.webp').read_bytes()
assert len(new19)==len(old19)+1 and base64.b64decode(new19[-1])==canonical,'embedded bytes differ from canonical WebP'
old_catalog=old('catalog-before-silverado-runtime-*-catalog.ts').read_text()
new_catalog=(root/'src/assets/cars/catalog.ts').read_text()
def entries(s):
    matches=re.findall(r'^  "([^"]+)": \{ url: images\[(\d+)\], \.\.\.(\{.*\}) \},?$',s,re.M)
    return {key:(int(index),json.loads(spec)) for key,index,spec in matches}
before,after=entries(old_catalog),entries(new_catalog)
assert before.keys() <= after.keys(),'existing catalog entry missing'
assert all(before[k]==after[k] for k in before),'existing catalog metadata changed'
assert 'chevrolet-silverado-1500-custom-2025' in after,'Silverado catalog entry missing'
log=['canonical_webp_sha256='+hashlib.sha256(canonical).hexdigest(),f'canonical_webp_bytes={len(canonical)}',f'preserved_chunk1_payloads={len(payloads(p1))}',f'preserved_chunk19_payloads={len(old19)}',f'new_chunk19_payloads={len(new19)}',f'unchanged_catalog_entries={len(before)}','embedded_webp_byte_equal=true','result=PASS']
out='\n'.join(log)+'\n'
(run/'validation/runtime-integrity.log').write_text(out,encoding='utf-8')
print(out,end='')
