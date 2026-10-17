import { defineConfig } from '@playwright/test';

// API-level e2e: no browser, Playwright only sends HTTP requests to the SUT.
export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    extraHTTPHeaders: { Accept: 'application/json' },
  },
});
