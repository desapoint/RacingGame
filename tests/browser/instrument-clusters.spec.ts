import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const releaseUrl = pathToFileURL(resolve('dist/index.html')).href;

test('continuous perimeter gauge can be selected and rendered offline', async ({ page, context }) => {
  await context.setOffline(true);
  await page.goto(releaseUrl);

  await page.locator('[data-action="nav"][data-id="settings"]').click();
  await page.locator('#gauge-style').selectOption('rect-solid');
  await page.locator('button[data-action="nav"][data-id="garage"]').click();
  await page.locator('[data-action="quick"]').click();

  const cluster = page.locator('.perimeter-cluster.rect-solid');
  await expect(cluster).toBeVisible();
  await expect(cluster.locator('#perimeter-rpm-fill')).not.toHaveAttribute('mask', /.+/);
  await expect(cluster.locator('.perimeter-shell .rect-corner')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/perimeter-gauge-solid.png', fullPage: true });
});
