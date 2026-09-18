import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

import { Pool } from 'pg';
import { createNodeApiHandler } from '../apps/api/src/node-runtime.ts';
import { createCribbitApiClient } from '../packages/api-client/src/index.ts';
import {
  isLegalOrdinaryCardPlay,
  projectGameView,
  resolvePlayableEngineCommand,
  runEngineTransition
} from '../packages/game-engine/src/index.ts';
import { withIsolatedP6Database } from './postgres-test-harness.mjs';

const connectionString = process.env.POSTGRES_URL;
const dbTest = connectionString ? test : test.skip;

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

async function json(response) {
  const body = await response.json();
  assert.ok(response.ok, JSON.stringify(body));
  return body;
}

function activeState(overrides = {}) {
  return {
    gameId: 'slice-test',
    revision: 2,
    players: [
      { playerId: 'p1', seat: 0, displayName: 'Ada' },
      { playerId: 'p2', seat: 1, displayName: 'Ben' }
    ],
    zones: {
      drawPile: ['number_cyan_5_01'],
      discardPile: ['number_lime_1_01'],
      hands: { p1: ['number_lime_2_01'], p2: ['number_orange_9_01'] }
    },
    rootFlow: null,
    continuations: [],
    persistentEffects: [],
    deadlines: [],
    winnerBoundary: { status: 'ready' },
    lifecycle: { phase: 'active', hostPlayerId: 'p1' },
    turn: { currentPlayerId: 'p1', direction: 'clockwise', activeColor: 'lime', round: 1 },
    ...overrides
  };
}

dbTest('P7A real API creates, joins, starts, draws, persists, rejects stale and syncs two clients', async () => {
  await withIsolatedP6Database(connectionString, async (pool) => {
    const handler = createNodeApiHandler({ databaseUrl: connectionString, checkConnection: async () => {}, pool });
    await withServer(handler, async (baseUrl) => {
      const created = await json(await fetch(`${baseUrl}/api/sessions`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ displayName: 'Ada' })
      }));
      assert.equal(created.projection.status, 'waiting');
      assert.equal(created.projection.players.length, 1);
      assert.equal(created.credential.playerId, 'p1');

      const outsider = await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/projection`);
      assert.equal(outsider.status, 401);

      const joined = await json(await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/join`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ displayName: 'Ben' })
      }));
      assert.equal(joined.credential.playerId, 'p2');
      assert.equal(joined.projection.players.length, 2);

      const aLobby = await json(await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/projection`, {
        headers: { 'x-cribbit-credential': created.credential.credential }
      }));
      assert.equal(aLobby.projection.canStartGame, true);

      const started = await json(await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/start`, {
        method: 'POST', headers: { 'x-cribbit-credential': created.credential.credential }
      }));
      assert.equal(started.projection.status, 'active');
      assert.equal(started.projection.currentPlayer.hand.length, 7);
      assert.equal(started.projection.drawPileCount, 118);
      assert.ok(started.projection.discardCard);

      const bStarted = await json(await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/projection`, {
        headers: { 'x-cribbit-credential': joined.credential.credential }
      }));
      assert.equal(bStarted.projection.players.length, 2);
      assert.equal(bStarted.projection.currentPlayer.hand.length, 7);
      const bPrivateIds = bStarted.projection.currentPlayer.hand.map((card) => card.instanceId);
      assert.equal(bPrivateIds.some((id) => JSON.stringify(started.projection).includes(id)), false);

      const draw = await json(await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/commands`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-cribbit-credential': created.credential.credential },
        body: JSON.stringify({ commandId: 'draw-once', expectedRevision: started.projection.revision, command: { kind: 'DRAW_CARD' } })
      }));
      assert.equal(draw.ok, true);
      assert.equal(draw.projection.revision, started.projection.revision + 1);
      assert.equal(draw.projection.currentPlayer.hand.length, 8);
      assert.equal(draw.projection.drawPileCount, 117);

      const duplicate = await json(await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/commands`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-cribbit-credential': created.credential.credential },
        body: JSON.stringify({ commandId: 'draw-once', expectedRevision: started.projection.revision, command: { kind: 'DRAW_CARD' } })
      }));
      assert.equal(duplicate.ok, true);
      assert.equal(duplicate.receipt.acceptedRevision, draw.receipt.acceptedRevision);

      const wrongTurn = await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/commands`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-cribbit-credential': created.credential.credential },
        body: JSON.stringify({ commandId: 'draw-wrong-turn', expectedRevision: draw.projection.revision, command: { kind: 'DRAW_CARD' } })
      });
      assert.equal(wrongTurn.status, 400);
      assert.match(JSON.stringify(await wrongTurn.json()), /NOT_CURRENT_TURN/);

      const stale = await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/commands`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-cribbit-credential': joined.credential.credential },
        body: JSON.stringify({ commandId: 'stale-command', expectedRevision: started.projection.revision, command: { kind: 'DRAW_CARD' } })
      });
      assert.equal(stale.status, 409);

      const bAfter = await json(await fetch(`${baseUrl}/api/sessions/${created.credential.sessionId}/projection`, {
        headers: { 'x-cribbit-credential': joined.credential.credential }
      }));
      assert.equal(bAfter.projection.revision, draw.projection.revision);
      assert.equal(bAfter.projection.drawPileCount, 117);
    });
  });
});

test('P7A ordinary PLAY_CARD is server-owned: legal play, ownership rejection, and winner boundary', () => {
  const state = activeState();
  assert.equal(isLegalOrdinaryCardPlay(state, 'p1', 'number_lime_2_01'), true);

  const legal = runEngineTransition({
    state,
    command: { kind: 'PLAY_CARD', cardInstanceId: 'number_lime_2_01' },
    ...resolvePlayableEngineCommand({ actorPlayerId: 'p1', command: { kind: 'PLAY_CARD', cardInstanceId: 'number_lime_2_01' } })
  });
  assert.equal(legal.status, 'accepted');
  assert.equal(legal.state.revision, 3);
  assert.equal(legal.state.zones.discardPile.at(-1), 'number_lime_2_01');
  assert.deepEqual(legal.state.winnerBoundary, { status: 'declared', winnerPlayerId: 'p1' });

  const notOwned = runEngineTransition({
    state: activeState({ zones: { drawPile: ['number_cyan_5_01'], discardPile: ['number_lime_1_01'], hands: { p1: ['number_orange_8_01'], p2: ['number_lime_2_01'] } } }),
    command: { kind: 'PLAY_CARD', cardInstanceId: 'number_lime_2_01' },
    ...resolvePlayableEngineCommand({ actorPlayerId: 'p1', command: { kind: 'PLAY_CARD', cardInstanceId: 'number_lime_2_01' } })
  });
  assert.equal(notOwned.status, 'rejected');
  assert.match(notOwned.reason, /ILLEGAL_ORDINARY_PLAY/);
});

test('P7A projection keeps private hands isolated', () => {
  const state = activeState({
    zones: { drawPile: ['number_cyan_5_01'], discardPile: ['number_lime_1_01'], hands: { p1: ['number_lime_2_01'], p2: ['number_orange_9_01', 'number_purple_3_01'] } }
  });
  const p1 = projectGameView(state, 'p1');
  const p2 = projectGameView(state, 'p2');
  assert.deepEqual(p1.currentPlayer.hand.map((card) => card.instanceId), ['number_lime_2_01']);
  assert.deepEqual(p2.currentPlayer.hand.map((card) => card.instanceId), ['number_orange_9_01', 'number_purple_3_01']);
  assert.equal(JSON.stringify(p1).includes('number_orange_9_01'), false);
  assert.equal(JSON.stringify(p2).includes('number_lime_2_01'), false);
});

test('P7A api-client consumes typed session projections and commands through its fetch boundary', async () => {
  const calls = [];
  const fakeFetch = async (url, init = {}) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({
      credential: { sessionId: 'abc123', playerId: 'p1', displayName: 'Ada', credential: 'opaque' },
      projection: { source: 'server', sessionId: 'abc123', roomName: 'Room', modeLabel: 'Test', round: 0, revision: 0, status: 'waiting', connection: 'connected', players: [], currentPlayer: { playerId: 'p1', hand: [] }, drawPileCount: 0, discardCard: null, activeColor: null, direction: 'clockwise', currentTurnPlayerId: null, activeEffect: null, turnLabel: 'Waiting', winner: null, canStartGame: false, availableActions: { canDraw: false, playableCardIds: [] } }
    }), { status: 201, headers: { 'content-type': 'application/json' } });
  };
  const client = createCribbitApiClient({ baseUrl: '/api', fetchImpl: fakeFetch });
  const result = await client.createSession({ displayName: 'Ada' });
  assert.equal(result.credential.credential, 'opaque');
  assert.equal(result.projection.source, 'server');
  assert.equal(calls[0].url, '/api/sessions');
});

test('P7A api-client keeps /api as the default local fallback base URL', async () => {
  const calls = [];
  const fakeFetch = async (url, init = {}) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({
      credential: { sessionId: 'abc123', playerId: 'p1', displayName: 'Ada', credential: 'opaque' },
      projection: { source: 'server', sessionId: 'abc123', roomName: 'Room', modeLabel: 'Test', round: 0, revision: 0, status: 'waiting', connection: 'connected', players: [], currentPlayer: { playerId: 'p1', hand: [] }, drawPileCount: 0, discardCard: null, activeColor: null, direction: 'clockwise', currentTurnPlayerId: null, activeEffect: null, turnLabel: 'Waiting', winner: null, canStartGame: false, availableActions: { canDraw: false, playableCardIds: [] } }
    }), { status: 201, headers: { 'content-type': 'application/json' } });
  };
  const client = createCribbitApiClient({ fetchImpl: fakeFetch });
  await client.createSession({ displayName: 'Ada' });
  assert.equal(calls[0].url, '/api/sessions');
});

test('P7A frontend bootstraps pass VITE_API_URL while preserving an empty-env fallback', async () => {
  const [clientSource, webSource, telegramSource] = await Promise.all([
    readFile('packages/client-app/src/index.ts', 'utf8'),
    readFile('apps/web/src/main.ts', 'utf8'),
    readFile('apps/telegram/src/main.ts', 'utf8')
  ]);

  assert.match(clientSource, /apiBaseUrl\?: string/);
  assert.match(clientSource, /function normalizeApiBaseUrl\(apiBaseUrl: string \| undefined\)/);
  assert.match(clientSource, /if \(normalizedApiBaseUrl\.endsWith\('\/api'\)\) return normalizedApiBaseUrl/);
  assert.match(clientSource, /createCribbitApiClient\(\{ baseUrl: normalizeApiBaseUrl\(options\.apiBaseUrl\) \}\)/);
  for (const source of [webSource, telegramSource]) {
    assert.match(source, /import\.meta\.env\.VITE_API_URL/);
    assert.match(source, /const apiBaseUrl = rawApiBaseUrl\.trim\(\) \|\| undefined/);
    assert.match(source, /bootstrap\(root, .*\(\), \{ apiBaseUrl \}\);/);
  }
});

test('P7A client-app contains orchestration only, not game-rule calculation', async () => {
  const source = await readFile('packages/client-app/src/index.ts', 'utf8');
  assert.doesNotMatch(source, /isLegal|match(?:es)?Color|match(?:es)?Value|winnerBoundary|Math\.random|buildDeck|shuffle/i);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
});
