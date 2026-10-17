import { expect, test } from '@playwright/test';

// S7 (unhappy path): the ballot is private — without a token the API refuses.
test('GET /me/candidates without a token is rejected with 401', async ({ request }) => {
  const res = await request.get('/me/candidates');

  expect(res.status()).toBe(401);
  expect(await res.json()).toEqual({ error: 'authentication required' });
});
