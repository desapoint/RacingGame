from pathlib import Path
p=Path("tests/browser/kia-forte-fire-orange.spec.ts")
s=p.read_text(encoding="utf-8")
s=s.replace("  console.log('Kia canvas probes', stock.probes, 'body', stock.body, 'skirt', stock.skirt);", "  await page.screenshot({ path: 'test-results/kia-probe-screen.png', fullPage: true });\n  console.log('Kia canvas probes', stock.probes, 'body', stock.body, 'skirt', stock.skirt);")
p.write_text(s, encoding="utf-8")
