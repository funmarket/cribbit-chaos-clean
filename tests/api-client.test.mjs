import test from 'node:test';
import assert from 'node:assert/strict';

import { CribbitApiError, createCribbitApiClient } from '../packages/api-client/src/index.ts';

test('API client preserves structured server rejection codes', async () => {
  const requests = [];
  const client = createCribbitApiClient({
    baseUrl: 'https://example.test/api',
    fetchImpl: async (input, init) => {
      requests.push({ input: String(input), init });
      return new Response(JSON.stringify({ ok: false, code: 'SESSION_NOT_FOUND' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    },
  });

  await assert.rejects(
    () => client.joinSession({ sessionId: 'FAKE1234', displayName: 'Player 2' }),
    (error) => {
      assert.ok(error instanceof CribbitApiError);
      assert.equal(error.status, 400);
      assert.equal(error.code, 'SESSION_NOT_FOUND');
      assert.deepEqual(error.payload, { ok: false, code: 'SESSION_NOT_FOUND' });
      return true;
    },
  );

  assert.equal(requests.length, 1);
  assert.equal(requests[0].input, 'https://example.test/api/sessions/FAKE1234/join');
  assert.equal(requests[0].init?.method, 'POST');
});

test('client-app maps known room join rejection codes to product-facing copy', async () => {
  const fs = await import('node:fs/promises');
  const clientSource = await fs.readFile(new URL('../packages/client-app/src/index.ts', import.meta.url), 'utf8');

  assert.match(clientSource, /SESSION_NOT_FOUND'\) return 'Room not found\. Check the room code and try again\.'/);
  assert.match(clientSource, /SESSION_ALREADY_STARTED'\) return 'That room has already started and cannot accept new players\.'/);
  assert.match(clientSource, /PLAYER_ALREADY_JOINED'\) return 'This player is already in the room\.'/);
  assert.doesNotMatch(clientSource, /return error\.message;\s*\n\s*}\s*\n\s*if \(error instanceof CribbitApiError/);
});
