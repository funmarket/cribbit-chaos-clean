import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { createNodeApiHandler } from '../apps/api/src/node-runtime.ts';

async function withServer(handler, run) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('GET /__infra/db-health returns 204 only after PostgreSQL health succeeds', async () => {
  const calls = [];
  const handler = createNodeApiHandler({
    databaseUrl: 'postgres://app-role@db/cribbit',
    checkConnection: async (connectionString) => { calls.push(connectionString); }
  });

  await withServer(handler, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/__infra/db-health`);
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
  });

  assert.deepEqual(calls, ['postgres://app-role@db/cribbit']);
});

test('GET /__infra/db-health returns 503 when PostgreSQL health fails', async () => {
  const handler = createNodeApiHandler({
    databaseUrl: 'postgres://app-role@db/cribbit',
    checkConnection: async () => { throw new Error('unreachable'); }
  });

  await withServer(handler, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/__infra/db-health`);
    assert.equal(response.status, 503);
    assert.equal(await response.text(), '');
  });
});

test('runtime exposes no gameplay or catch-all route', async () => {
  const handler = createNodeApiHandler({
    databaseUrl: 'postgres://app-role@db/cribbit',
    checkConnection: async () => {}
  });

  await withServer(handler, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/game`);
    assert.equal(response.status, 404);
    assert.equal(await response.text(), '');
  });
});
