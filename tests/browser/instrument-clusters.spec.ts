import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const releaseUrl = pathToFileURL(resolve('dist/index.html')).href;
const perimeterStyles = ['rect-24', 'rect-16', 'rect-8', 'rect-track'] as const;

test('custom perimeter gauges share one smooth path and continuous mode removes segmentation', async ({ page, context }) => {
  await context.setOffline(true);
  await page.goto(releaseUrl);

  for (const style of perimeterStyles) {
    await page.locator('[data-action="nav"][data-id="settings"]').click();
    await page.locator('#gauge-style').selectOption(style);
    await page.locator('button[data-action="nav"][data-id="garage"]').click();
    await page.locator('[data-action="quick"]').click();

    const cluster = page.locator(`.perimeter-cluster.${style}`);
    await expect(cluster).toBeVisible();
    const shape = await cluster.locator('#perimeter-rpm-fill').evaluate((node) => ({
      d: node.getAttribute('d'),
      mask: node.getAttribute('mask'),
      corners: node.closest('.perimeter-shell')?.querySelectorAll('.rect-corner').length ?? -1,
      trackDash: node.previousElementSibling?.getAttribute('stroke-dasharray'),
    }));
    expect(shape.d).toContain('Q 30 20 50 20');
    expect(shape.d).toContain('Q 670 20 670 40');
    expect(shape.mask).toContain('perimeter-mask');
    expect(shape.trackDash).toBeTruthy();
    expect(shape.corners).toBe(0);
  }

  await page.locator('[data-action="nav"][data-id="settings"]').click();
  await page.locator('#gauge-style').selectOption('rect-solid');
  await page.locator('button[data-action="nav"][data-id="garage"]').click();
  await page.locator('[data-action="quick"]').click();

  const solid = page.locator('.perimeter-cluster.rect-solid');
  await expect(solid).toBeVisible();
  const solidShape = await solid.locator('#perimeter-rpm-fill').evaluate((node) => ({
    mask: node.getAttribute('mask'),
    trackDash: node.previousElementSibling?.getAttribute('stroke-dasharray'),
  }));
  expect(solidShape.mask).toBeNull();
  expect(solidShape.trackDash).toBeNull();
  await page.screenshot({ path: 'test-results/perimeter-gauge-solid.png', fullPage: true });
});
