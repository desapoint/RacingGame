import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const releaseUrl = pathToFileURL(resolve('dist/index.html')).href;
const id = 'chevrolet-silverado-1500-custom-2025';

test('Silverado loads offline, keeps black stock paint, repaints only its body, and races', async ({ page, context }) => {
  await context.setOffline(true);
  await page.clock.install();
  const network: string[] = [];
  const errors: string[] = [];
  page.on('request', (request) => { if (!request.url().startsWith('data:') && !request.url().startsWith('file:')) network.push(request.url()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', (request) => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  await page.goto(releaseUrl);
  await page.locator('[data-action="nav"][data-id="dealership"]').click();
  await page.locator('#dealer-search').fill('2025 Chevrolet Silverado');
  const card = page.locator('.dealer-card').filter({ hasText: '2025 Chevrolet Silverado 1500 Custom' });
  await expect(card).toBeVisible();
  await expect(page.locator('#car-loading')).toHaveText('');
  await expect(card.locator('.dealer-canvas')).toHaveAttribute('data-car', id);
  const dealerPixels = await card.locator('canvas').evaluate((node) => {
    const canvas = node as HTMLCanvasElement;
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let opaque = 0, nearBlack = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 200) { opaque++; if (pixels[i - 1] < 65 && pixels[i - 2] < 65 && pixels[i - 3] < 65) nearBlack++; }
    }
    return { opaque, nearBlack };
  });
  expect(dealerPixels.opaque).toBeGreaterThan(1000);
  expect(dealerPixels.nearBlack).toBeGreaterThan(500);
  await card.locator('[data-action="specs"]').click();
  await expect(page.getByRole('dialog')).toContainText('2025 Chevrolet Silverado 1500 Custom');
  await expect(page.getByRole('dialog')).toContainText('310 hp');
  await page.keyboard.press("Escape");
  await expect(page.locator("#modal")).not.toBeVisible();
  await card.locator('[data-action="buy-car"]').click();
  await page.locator('button[data-action="nav"][data-id="garage"]').click();
  await expect(page.locator('#car-select')).toHaveValue(id);
  await expect(page.locator('#garage-canvas')).toBeVisible();
  const read = () => page.locator('#garage-canvas').evaluate((node) => {
    const c = node as HTMLCanvasElement, ctx = c.getContext('2d')!;
    const sx = c.width / 800, sy = c.height / 300;
    const pixel = (x: number, y: number) => [...ctx.getImageData(Math.round(x * sx), Math.round(y * sy), 1, 1).data];
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    return { pixels: [...data], wheelA: pixel(197, 199), wheelB: pixel(605, 199), outside: pixel(30, 170) };
  });
  const stock = await read();
  await page.screenshot({ path: "test-results/silverado-stock-black.png", fullPage: true });
  expect(stock.pixels.length).toBeGreaterThan(0);
  await page.locator('#body-color').fill('#c52d38');
  await page.locator('#body-color').dispatchEvent('change');
  await page.waitForTimeout(100);
  const repainted = await read();
  const changed = (a: number[], b: number[]) => a.filter((value, i) => value !== b[i]).length;
  expect(changed(stock.pixels, repainted.pixels)).toBeGreaterThan(5000);
  expect(repainted.wheelA).toEqual(stock.wheelA);
  expect(repainted.wheelB).toEqual(stock.wheelB);
  expect(repainted.outside).toEqual(stock.outside);
  await page.screenshot({ path: 'test-results/silverado-stock-repaint.png', fullPage: true });
  await page.locator('[data-action="editor"]').click();
  const bounds = await page.locator('#garage-canvas').boundingBox();
  const canvas = page.locator('#garage-canvas');
  await page.mouse.move(bounds!.x + bounds!.width * 0.16, bounds!.y + bounds!.height * 0.66);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width * 0.84, bounds!.y + bounds!.height * 0.66, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('[data-action="undo"]')).toBeEnabled();
  await page.waitForTimeout(100);
  const livery = await read();
  await page.screenshot({ path: "test-results/silverado-livery.png", fullPage: true });
  expect(changed(repainted.pixels, livery.pixels)).toBeGreaterThan(100);
  expect(livery.wheelA).toEqual(repainted.wheelA);
  expect(livery.wheelB).toEqual(repainted.wheelB);
  expect(livery.outside).toEqual(repainted.outside);
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
  expect(errors).toEqual([]);
  expect(network).toEqual([]);
});
