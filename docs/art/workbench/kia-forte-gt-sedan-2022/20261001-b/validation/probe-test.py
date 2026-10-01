from pathlib import Path
p=Path("tests/browser/kia-forte-fire-orange.spec.ts")
s=p.read_text(encoding="utf-8")
s=s.replace("      body: pixel(800, 300),", "      body: pixel(800, 300),\n      probes: [[700,240],[800,240],[800,260],[800,280],[800,300],[800,330],[800,360],[800,390],[800,420],[800,450],[900,360],[1000,360]].map(([x,y]) => [x,y,pixel(x,y)]),")
s=s.replace("  expect(stock.body[3]).toBeGreaterThan(240);", "  console.log('Kia canvas probes', stock.probes, 'body', stock.body, 'skirt', stock.skirt);\n  expect(stock.body[3]).toBeGreaterThan(240);")
p.write_text(s, encoding="utf-8")
