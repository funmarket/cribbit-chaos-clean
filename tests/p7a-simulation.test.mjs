import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { createNodeApiHandler } from '../apps/api/src/node-runtime.ts';
import { resetMemorySessions } from '../apps/api/src/memory-session-store.ts';

async function withServer(run) {
  resetMemorySessions();
  const handler = createNodeApiHandler({
    databaseUrl: '',
    checkConnection: async () => { throw new Error('simulation memory test must not touch postgres'); },
    sessionSecret: 'simulation-test-secret'
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

test('QA simulation is a server-owned canonical session with playable human and bot turns', async () => {
  await withServer(async (baseUrl) => {
    const auth = await fetch(`${baseUrl}/api/auth/web/guest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ displayName: 'QA Player' })
    });
    await json(auth);
    const cookie = auth.headers.get('set-cookie').split(';')[0];

    const created = await json(await fetch(`${baseUrl}/api/simulations`, {
      method: 'POST',
      headers: { cookie }
    }));
    assert.match(created.player.sessionId, /^sim-/);
    assert.equal(created.player.playerId, 'p1');
    assert.equal(created.projection.source, 'server');
    assert.equal(created.projection.status, 'active');
    assert.equal(created.projection.players.length, 4);
    assert.equal(created.projection.currentPlayer.hand.length, 7);
    assert.equal(created.projection.currentTurnPlayerId, 'p1');
    assert.equal(created.projection.availableActions.playableCardIds.includes('number_lime_2_01'), true);

    const played = await json(await fetch(
      `${baseUrl}/api/sessions/${created.player.sessionId}/commands`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          commandId: 'qa-play',
          expectedRevision: created.projection.revision,
          command: { kind: 'PLAY_CARD', cardInstanceId: 'number_lime_2_01' }
        })
      }
    ));
    assert.equal(played.ok, true);
    assert.equal(played.projection.source, 'server');
    assert.equal(played.projection.currentPlayer.hand.length, 6);
    assert.equal(played.projection.currentTurnPlayerId, 'p1');
    assert.equal(played.projection.revision, created.projection.revision + 4);

    const drawn = await json(await fetch(
      `${baseUrl}/api/sessions/${created.player.sessionId}/commands`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({
          commandId: 'qa-draw',
          expectedRevision: played.projection.revision,
          command: { kind: 'DRAW_CARD' }
        })
      }
    ));
    assert.equal(drawn.ok, true);
    assert.equal(drawn.projection.currentPlayer.hand.length, 7);
    assert.equal(drawn.projection.currentTurnPlayerId, 'p1');
    assert.equal(drawn.projection.revision, played.projection.revision + 4);

    const readback = await json(await fetch(
      `${baseUrl}/api/sessions/${created.player.sessionId}/projection`,
      { headers: { cookie } }
    ));
    assert.equal(readback.projection.revision, drawn.projection.revision);
    assert.equal(readback.projection.currentPlayer.hand.length, 7);
  });
});
