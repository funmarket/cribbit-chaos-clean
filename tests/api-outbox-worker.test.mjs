import test from 'node:test';
import assert from 'node:assert/strict';

import * as api from '../apps/api/src/outbox-worker.ts';

function canonicalState(revision = 9) {
  return {
    gameId: 'game-outbox',
    revision,
    players: [
      { playerId: 'p1', seat: 0 },
      { playerId: 'p2', seat: 1 }
    ],
    zones: {
      drawPile: ['draw-secret'],
      discardPile: ['discard-visible'],
      hands: { p1: ['p1-secret'], p2: ['p2-secret'] }
    },
    rootFlow: null,
    continuations: [],
    persistentEffects: [],
    deadlines: [],
    winnerBoundary: { status: 'ready' }
  };
}

function harness(options = {}) {
  const calls = { claims: [], loads: [], publications: [], marked: [], released: [] };
  const claim = options.claim === undefined
    ? { outboxId: '42', sessionId: 'session-1', acceptedRevision: 8, leaseToken: 'lease-1' }
    : options.claim;

  const store = {
    async claimNext(input) {
      calls.claims.push(structuredClone(input));
      return claim === null ? null : structuredClone(claim);
    },
    async loadProjectionSource(sessionId) {
      calls.loads.push(sessionId);
      return {
        state: structuredClone(options.state ?? canonicalState()),
        playerIds: [...(options.playerIds ?? ['p1', 'p2'])]
      };
    },
    async markPublished(input) {
      calls.marked.push(structuredClone(input));
    },
    async releaseClaim(input) {
      calls.released.push(structuredClone(input));
    }
  };

  const publisher = {
    async publish(publication) {
      calls.publications.push(structuredClone(publication));
      if (options.failPublicationId === publication.publicationId) {
        throw new Error('transport unavailable');
      }
    }
  };

  const worker = api.createOutboxWorker({
    store,
    publisher,
    leaseTokenFactory: () => 'lease-1',
    leaseDurationMs: 30_000
  });

  return { worker, calls };
}

test('P6 outbox worker publishes only P3 projections with stable recipient publication IDs, then marks the lease published', async () => {
  assert.equal(typeof api.createOutboxWorker, 'function');
  const { worker, calls } = harness();

  const result = await worker.runOnce();

  assert.deepEqual(result, { status: 'published', outboxId: '42', publicationCount: 3 });
  assert.deepEqual(calls.claims, [{ leaseToken: 'lease-1', leaseDurationMs: 30_000 }]);
  assert.deepEqual(calls.loads, ['session-1']);
  assert.deepEqual(calls.marked, [{ outboxId: '42', leaseToken: 'lease-1' }]);
  assert.deepEqual(calls.released, []);

  assert.deepEqual(
    calls.publications.map((publication) => publication.publicationId),
    ['outbox:42:public', 'outbox:42:player:p1', 'outbox:42:player:p2']
  );
  assert.deepEqual(
    calls.publications.map((publication) => publication.projection.audience),
    [{ kind: 'public' }, { kind: 'player', playerId: 'p1' }, { kind: 'player', playerId: 'p2' }]
  );

  const serializedPublic = JSON.stringify(calls.publications[0]);
  assert.equal(serializedPublic.includes('p1-secret'), false);
  assert.equal(serializedPublic.includes('p2-secret'), false);
  const serializedP1 = JSON.stringify(calls.publications[1]);
  assert.equal(serializedP1.includes('p1-secret'), true);
  assert.equal(serializedP1.includes('p2-secret'), false);
  const serializedP2 = JSON.stringify(calls.publications[2]);
  assert.equal(serializedP2.includes('p1-secret'), false);
  assert.equal(serializedP2.includes('p2-secret'), true);
});

test('P6 outbox worker may publish the latest committed projection for an older committed revision signal', async () => {
  assert.equal(typeof api.createOutboxWorker, 'function');
  const { worker, calls } = harness({ state: canonicalState(11) });

  await worker.runOnce();

  assert.equal(calls.publications.length, 3);
  assert.equal(calls.publications.every((publication) => publication.projection.revision === 11), true);
  assert.deepEqual(calls.marked, [{ outboxId: '42', leaseToken: 'lease-1' }]);
});

test('P6 outbox worker fails closed if storage returns a snapshot older than the committed outbox revision', async () => {
  assert.equal(typeof api.createOutboxWorker, 'function');
  const { worker, calls } = harness({ state: canonicalState(7) });

  await assert.rejects(worker.runOnce(), /older than committed outbox revision/i);

  assert.equal(calls.publications.length, 0);
  assert.deepEqual(calls.marked, []);
  assert.deepEqual(calls.released, [{ outboxId: '42', leaseToken: 'lease-1' }]);
});

test('P6 outbox worker releases a lease after publication failure and keeps stable IDs for safe retry', async () => {
  assert.equal(typeof api.createOutboxWorker, 'function');
  const first = harness({ failPublicationId: 'outbox:42:player:p2' });

  await assert.rejects(first.worker.runOnce(), /transport unavailable/);

  assert.deepEqual(
    first.calls.publications.map((publication) => publication.publicationId),
    ['outbox:42:public', 'outbox:42:player:p1', 'outbox:42:player:p2']
  );
  assert.deepEqual(first.calls.marked, []);
  assert.deepEqual(first.calls.released, [{ outboxId: '42', leaseToken: 'lease-1' }]);

  const retry = harness();
  await retry.worker.runOnce();
  assert.deepEqual(
    retry.calls.publications.map((publication) => publication.publicationId),
    ['outbox:42:public', 'outbox:42:player:p1', 'outbox:42:player:p2']
  );
});

test('P6 outbox worker is idle when no committed outbox row is claimable', async () => {
  assert.equal(typeof api.createOutboxWorker, 'function');
  const { worker, calls } = harness({ claim: null });

  assert.deepEqual(await worker.runOnce(), { status: 'idle' });
  assert.deepEqual(calls.loads, []);
  assert.deepEqual(calls.publications, []);
  assert.deepEqual(calls.marked, []);
  assert.deepEqual(calls.released, []);
});
