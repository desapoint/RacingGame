import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const releaseUrl = pathToFileURL(resolve('dist/index.html')).href;
const id = 'kia-forte-gt-sedan-2022';
const stockOrange = '#a92811';

test('Kia Fire Orange stock sprite keeps its black GT side skirt through repaint, livery, and offline racing', async ({
  page,
  context,
}) => {
  await context.setOffline(true);
  await page.clock.install();
  const network: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('data:') && !request.url().startsWith('file:'))
      network.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('requestfailed', (request) =>
    errors.push(`${request.url()}: ${request.failure()?.errorText}`),
  );

  await page.goto(releaseUrl);
  await page.locator('[data-action="nav"][data-id="dealership"]').click();
  await page.locator('#dealer-search').fill('2022 Kia Forte GT');
  const card = page.locator('.dealer-card').filter({ hasText: '2022 Kia Forte GT Sedan' });
  await expect(card).toBeVisible();
  await expect(page.locator('#car-loading')).toHaveText('');
  await expect(card.locator('.dealer-canvas')).toHaveAttribute('data-car', id);
  await card.locator('[data-action="buy-car"]').click();

  await page.locator('button[data-action="nav"][data-id="garage"]').click();
  await expect(page.locator('#car-select')).toHaveValue(id);
  await expect(page.locator('#garage-canvas')).toBeVisible();
  await expect(page.locator('#body-color')).toHaveValue(stockOrange);

  const readVisual = () =>
    page.locator('#garage-canvas').evaluate((node) => {
      const canvas = node as HTMLCanvasElement;
      const ctx = canvas.getContext('2d')!;
      const fit = Math.min(700 / 2115, 235 / 678);
      const left = (800 - 2115 * fit) / 2;
      const top = 254 - 678 * fit;
      const toCanvas = (sourceX: number, sourceY: number) => [
        Math.round(((112 + 1.1 * (left + (sourceX - 26) * fit)) * canvas.width) / 1100),
        Math.round(((112 + 1.1 * (top + (sourceY - 31) * fit)) * canvas.height) / 460),
      ];
      const pixel = (sourceX: number, sourceY: number) => {
        const [x, y] = toCanvas(sourceX, sourceY);
        return Array.from(ctx.getImageData(x, y, 1, 1).data);
      };
      const wheelRegion = (sourceX: number, sourceY: number, radius: number) => {
        const [centerX, centerY] = toCanvas(sourceX, sourceY);
        const r = Math.round((radius * fit * 1.1 * canvas.width) / 1100);
        const region = ctx.getImageData(centerX - r, centerY - r, 2 * r, 2 * r).data;
        const circle: number[] = [];
        for (let y = 0; y < 2 * r; y++) {
          for (let x = 0; x < 2 * r; x++) {
            const dx = x - r,
              dy = y - r;
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
  const stock = await readVisual();
  expect(stock.body[3]).toBeGreaterThan(240);
  expect(stock.body[0]).toBeGreaterThan(150);
  expect(stock.body[1]).toBeLessThan(90);
  expect(stock.body[2]).toBeLessThan(60);
  expect(stock.skirt[3]).toBeGreaterThan(240);
  expect(Math.max(...stock.skirt.slice(0, 3))).toBeLessThan(55);
  await page.screenshot({ path: 'test-results/kia-stock-fire-orange.png', fullPage: true });

  await page.locator('#body-color').fill('#2d73cc');
  await page.locator('#body-color').dispatchEvent('change');
  await page.waitForTimeout(100);
  const repainted = await readVisual();
  const changed = (a: number[], b: number[]) => a.filter((value, i) => value !== b[i]).length;
  expect(changed(stock.pixels, repainted.pixels)).toBeGreaterThan(5000);
  expect(repainted.skirt).toEqual(stock.skirt);
  expect(repainted.wheelA).toEqual(stock.wheelA);
  expect(repainted.wheelB).toEqual(stock.wheelB);
  await page.screenshot({ path: 'test-results/kia-repaint.png', fullPage: true });

  await page.locator('[data-action="editor"]').click();
  const bounds = await page.locator('#garage-canvas').boundingBox();
  await page.mouse.move(bounds!.x + bounds!.width * 0.18, bounds!.y + bounds!.height * 0.57);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width * 0.82, bounds!.y + bounds!.height * 0.57, {
    steps: 12,
  });
  await page.mouse.up();
  await page.mouse.move(bounds!.x + bounds!.width * 0.18, bounds!.y + bounds!.height * 0.76);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width * 0.82, bounds!.y + bounds!.height * 0.76, {
    steps: 12,
  });
  await page.mouse.up();
  await expect(page.locator('[data-action="undo"]')).toBeEnabled();
  const livery = await readVisual();
  expect(changed(repainted.pixels, livery.pixels)).toBeGreaterThan(100);
  expect(livery.skirt).toEqual(stock.skirt);
  expect(livery.wheelA).toEqual(stock.wheelA);
  expect(livery.wheelB).toEqual(stock.wheelB);
  await page.screenshot({ path: 'test-results/kia-livery.png', fullPage: true });

  await page.locator('button[data-action="nav"][data-id="garage"]').click();
  await page.locator('[data-action="quick"]').click();
  await expect(page.locator('#race-canvas')).toBeVisible();
  await page.clock.runFor(3500);
  await page.keyboard.press('Space');
  for (let tick = 0; tick < 300 && !(await page.locator('#race-results').count()); tick++) {
    const rpm = Number((await page.locator('#rpm').innerText()).replace(/[^0-9]/g, ''));
    if (rpm >= 6200) await page.keyboard.press('ArrowUp');
    await page.clock.runFor(100);
  }
  await expect(page.locator('#race-results')).toBeVisible();
  await page.screenshot({ path: 'test-results/kia-race-results.png', fullPage: true });
  expect(errors).toEqual([]);
  expect(network).toEqual([]);
});
