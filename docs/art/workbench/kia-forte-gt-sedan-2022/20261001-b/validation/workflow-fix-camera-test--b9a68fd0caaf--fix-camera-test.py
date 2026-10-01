from pathlib import Path
p=Path("/home/desapoint/Projets/RacingGame/tests/browser/kia-forte-fire-orange.spec.ts")
s=p.read_text(encoding="utf-8")
start=s.index("  const readVisual = () =>")
end=s.index("  const stock = await readVisual();", start)
block="""  const readVisual = () => page.locator('#garage-canvas').evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const fit = Math.min(700 / 2115, 235 / 678);
    const left = (800 - 2115 * fit) / 2;
    const top = 254 - 678 * fit;
    const toCanvas = (sourceX: number, sourceY: number) => [
      Math.round((112 + 1.1 * (left + (sourceX - 26) * fit)) * canvas.width / 1100),
      Math.round((112 + 1.1 * (top + (sourceY - 31) * fit)) * canvas.height / 460),
    ];
    const pixel = (sourceX: number, sourceY: number) => {
      const [x, y] = toCanvas(sourceX, sourceY);
      return Array.from(ctx.getImageData(x, y, 1, 1).data);
    };
    const wheelRegion = (sourceX: number, sourceY: number, radius: number) => {
      const [centerX, centerY] = toCanvas(sourceX, sourceY);
      const r = Math.round(radius * fit * 1.1 * canvas.width / 1100);
      const region = ctx.getImageData(centerX - r, centerY - r, 2 * r, 2 * r).data;
      const circle: number[] = [];
      for (let y = 0; y < 2 * r; y++) {
        for (let x = 0; x < 2 * r; x++) {
          const dx = x - r, dy = y - r;
          if (dx * dx + dy * dy > (r * 0.9) ** 2) continue;
          circle.push(...region.slice((y * 2 * r + x) * 4, (y * 2 * r + x) * 4 + 4));
        }
      }
      return circle;
    };
    return {
      body: pixel(800, 420),
      skirt: pixel(850, 590),
      wheelA: wheelRegion(430, 540, 162),
      wheelB: wheelRegion(1718, 540, 162),
      pixels: Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data),
    };
  });
"""
s=s[:start]+block+s[end:]
s=s.replace("  await page.screenshot({ path: 'test-results/kia-probe-screen.png', fullPage: true });\n", "")
s=s.replace("  console.log('Kia canvas probes', stock.probes, 'body', stock.body, 'skirt', stock.skirt);\n", "")
s=s.replace("      probes: [[700,240],[800,240],[800,260],[800,280],[800,300],[800,330],[800,360],[800,390],[800,420],[800,450],[900,360],[1000,360]].map(([x,y]) => [x,y,pixel(x,y)]),\n", "")
p.write_text(s, encoding="utf-8")
