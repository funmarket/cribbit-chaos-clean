import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { createNodeApiHandler } from '../apps/api/src/node-runtime.ts';
import { resetMemorySessions } from '../apps/api/src/memory-session-store.ts';

async function withServer(run) {
  resetMemorySessions();
  const handler = createNodeApiHandler({
    databaseUrl: '',
    checkConnection: async () => {
      throw new Error('memory slice must not touch postgres');
    }
  });
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

async function json(response) {
  const body = await response.json();
  assert.ok(response.ok, JSON.stringify(body));
  return body;
}

test('memory API creates, joins, starts, draws and syncs a second client without Postgres', async () => {
  await withServer(async (baseUrl) => {
    const created = await json(await fetch(`${baseUrl}/api/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Ada' })
    }));
    assert.equal(created.projection.status, 'waiting');

    const joined = await json(await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/join`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'Ben' })
    }));
    assert.equal(joined.projection.players.length, 2);

    const started = await json(await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/start`, {
      method: 'POST',
      headers: { 'x-cribbit-credential': created.credential.credential }
    }));
    assert.equal(started.projection.status, 'active');
    assert.equal(started.projection.currentPlayer.hand.length, 7);
    assert.equal(started.projection.drawPileCount, 118);

    const draw = await json(await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/commands`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-cribbit-credential': created.credential.credential },
      body: JSON.stringify({ expectedRevision: started.projection.revision, command: { kind: 'DRAW_CARD' } })
    }));
    assert.equal(draw.ok, true);
    assert.equal(draw.projection.revision, started.projection.revision + 1);

    const other = await json(await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/projection`, {
      headers: { 'x-cribbit-credential': joined.credential.credential }
    }));
    assert.equal(other.projection.revision, draw.projection.revision);
    assert.equal(other.projection.drawPileCount, draw.projection.drawPileCount);
  });
});
