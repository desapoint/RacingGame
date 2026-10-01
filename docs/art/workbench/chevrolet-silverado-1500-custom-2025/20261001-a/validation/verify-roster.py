import json
from pathlib import Path
root=Path('/home/desapoint/Projets/RacingGame')
mid='chevrolet-silverado-1500-custom-2025'
plan=json.loads((root/'src/data/expansion-plan.json').read_text())
metadata=json.loads((root/'src/assets/cars/expansion-clean-metadata.json').read_text())
game=json.loads((root/'src/data/game-data.json').read_text())
entries=[p for p in plan if p['id']==mid]
assert len(entries)==1 and entries[0]['conditions']==['standard']
assert mid in metadata and mid+'-used' not in metadata and mid+'-rusty' not in metadata
cars=[c for c in game['cars'] if c.get('modelId')==mid]
assert len(cars)==1 and cars[0]['condition']=='standard' and cars[0]['id']==mid
log=['expansion_plan_conditions=standard','clean_metadata_variants=1','game_data_entries=1','used_or_rusty_variant=false','result=PASS']
out='\n'.join(log)+'\n'
(root/'docs/art/workbench/chevrolet-silverado-1500-custom-2025/20261001-a/validation/roster-scope.log').write_text(out,encoding='utf-8')
print(out,end='')
