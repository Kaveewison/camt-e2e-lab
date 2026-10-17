import { expect, test } from '@playwright/test';

// Smoke test: proves Playwright can reach the SUT before we write real tests.
test('the election API is up', async ({ request }) => {
  const res = await request.get('/health');

  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ status: 'ok' });
});
