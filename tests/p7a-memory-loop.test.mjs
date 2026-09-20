import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { createNodeApiHandler } from '../apps/api/src/node-runtime.ts';
import { resetMemorySessions } from '../apps/api/src/memory-session-store.ts';

async function withServer(run) {
  resetMemorySessions();
  const handler = createNodeApiHandler({
    databaseUrl: '',
    checkConnection: async () => { throw new Error('memory slice must not touch postgres'); },
    sessionSecret: 'memory-test-secret'
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

async function guest(baseUrl, displayName) {
  const response = await fetch(`${baseUrl}/api/auth/web/guest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName })
  });
  const body = await json(response);
  return { user: body.user, cookie: response.headers.get('set-cookie').split(';')[0] };
}

test('memory API creates, joins, starts, draws and syncs canonical users without per-game credentials', async () => {
  await withServer(async (baseUrl) => {
    const ada = await guest(baseUrl, 'Ada');
    const ben = await guest(baseUrl, 'Ben');

    const created = await json(await fetch(`${baseUrl}/api/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: ada.cookie },
      body: JSON.stringify({ displayName: 'Ada' })
    }));
    assert.equal(created.projection.status, 'waiting');
    assert.equal(created.player.playerId, 'p1');
    assert.equal('credential' in created.player, false);

    const joined = await json(await fetch(`${baseUrl}/api/sessions/${created.player.sessionId}/join`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: ben.cookie },
      body: JSON.stringify({ displayName: 'Ben' })
    }));
    assert.equal(joined.projection.players.length, 2);

    const started = await json(await fetch(`${baseUrl}/api/sessions/${created.player.sessionId}/start`, {
      method: 'POST',
      headers: { cookie: ada.cookie }
    }));
    assert.equal(started.projection.status, 'active');

    const draw = await json(await fetch(`${baseUrl}/api/sessions/${created.player.sessionId}/commands`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: ada.cookie },
      body: JSON.stringify({ expectedRevision: started.projection.revision, command: { kind: 'DRAW_CARD' } })
    }));
    assert.equal(draw.ok, true);

    const other = await json(await fetch(`${baseUrl}/api/sessions/${created.player.sessionId}/projection`, {
      headers: { cookie: ben.cookie }
    }));
    assert.equal(other.projection.revision, draw.projection.revision);
  });
});
