import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../apps/api/src/worker.ts';

test('Cloudflare API worker exposes an honest health endpoint without gameplay authority', async () => {
  const response = await worker.fetch(new Request('https://example.test/health'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');

  const body = await response.json();
  assert.deepEqual(body, {
    ok: true,
    service: 'cribbit-chaos-api',
    surface: 'cloudflare-worker',
    gameplay: 'not-enabled'
  });
});

test('Cloudflare API worker fails closed for unimplemented routes instead of faking gameplay', async () => {
  const response = await worker.fetch(new Request('https://example.test/v1/games/demo/commands'));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');

  const body = await response.json();
  assert.deepEqual(body, {
    error: 'API_WORKER_NOT_MIGRATED',
    message: 'Cloudflare API worker entrypoint exists, but gameplay HTTP routes are not enabled yet.'
  });
});
