from pathlib import Path
p=Path("/home/desapoint/Projets/RacingGame/tests/browser/kia-forte-fire-orange.spec.ts")
s=p.read_text(encoding="utf-8")
old="""  await page.mouse.up();
  await expect(page.locator('[data-action="undo"]')).toBeEnabled();
"""
new="""  await page.mouse.up();
  await page.mouse.move(bounds!.x + bounds!.width * 0.18, bounds!.y + bounds!.height * 0.76);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width * 0.82, bounds!.y + bounds!.height * 0.76, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('[data-action="undo"]')).toBeEnabled();
"""
if old not in s: raise SystemExit("Expected livery stroke block missing")
p.write_text(s.replace(old,new,1),encoding="utf-8")
