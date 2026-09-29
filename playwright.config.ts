import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 45_000,
  fullyParallel: false,
  use: { browserName: 'chromium', headless: true, viewport: { width: 1440, height: 1000 } },
});
