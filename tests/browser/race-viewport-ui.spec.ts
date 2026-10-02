import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const releaseUrl = pathToFileURL(resolve('dist/index.html')).href;

test('desktop race stays inside 16:9 viewport and timing slip overlays the right side', async ({
  page,
  context,
}) => {
  await context.setOffline(true);
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.clock.install();
  await page.goto(releaseUrl);

  await page.locator('[data-action="quick"]').click();
  await expect(page.locator('#app')).toHaveClass(/race-mode/);
  await expect(page.locator('#race-canvas')).toBeVisible();
  await expect(page.locator('.race-instruments')).toBeVisible();
  await expect(page.locator('#shift-lights i')).toHaveCount(7);

  const liveViewport = await page.evaluate(() => ({
    innerWidth,
    innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    scrollX,
    scrollY,
  }));
  expect(liveViewport.scrollWidth).toBeLessThanOrEqual(liveViewport.innerWidth + 1);
  expect(liveViewport.scrollHeight).toBeLessThanOrEqual(liveViewport.innerHeight + 1);
  expect(liveViewport.scrollX).toBe(0);
  expect(liveViewport.scrollY).toBe(0);

  const canvas = await page.locator('#race-canvas').boundingBox();
  const instruments = await page.locator('.race-instruments').boundingBox();
  expect(canvas).not.toBeNull();
  expect(instruments).not.toBeNull();
  expect(instruments!.x).toBeGreaterThan(canvas!.x + canvas!.width * 0.7);

  await page.clock.runFor(3500);
  await page.keyboard.press('Space');
  for (let tick = 0; tick < 300 && !(await page.locator('#race-results').count()); tick++) {
    const rpm = Number((await page.locator('#rpm').innerText()).replace(/[^0-9]/g, ''));
    if (rpm >= 6200) await page.keyboard.press('ArrowUp');
    await page.clock.runFor(100);
  }

  const slip = page.locator('#race-results');
  await expect(slip).toBeVisible();
  await expect(slip.locator('.race-slip-paper')).toContainText('TIME SLIP');
  await expect(slip.locator('.race-slip-paper')).toContainText('FINISH ORDER');

  const slipBox = await slip.boundingBox();
  expect(slipBox).not.toBeNull();
  expect(slipBox!.x).toBeGreaterThan(1600 * 0.65);
  expect(slipBox!.x + slipBox!.width).toBeLessThanOrEqual(1600);

  const resultViewport = await page.evaluate(() => ({
    innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
    scrollY,
  }));
  expect(resultViewport.scrollHeight).toBeLessThanOrEqual(resultViewport.innerHeight + 1);
  expect(resultViewport.scrollY).toBe(0);

  await page.screenshot({ path: 'test-results/race-viewport-slip.png', fullPage: false });
});
