import json
from pathlib import Path
root=Path('/home/desapoint/Projets/RacingGame')
path=root/'src/data/game-data.json'
data=json.loads(path.read_text(encoding='utf-8'))
data['cars']=[car for car in data['cars'] if car['id']!='toyota-prius-xle-2024-rusty']
car=next(car for car in data['cars'] if car['id']=='chevrolet-silverado-1500-custom-2025')
car.update(name='2025 Chevrolet Silverado 1500 Custom',tagline='TurboMax torque. Full-size presence.')
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
