import test from 'node:test';
import assert from 'node:assert/strict';

import * as database from '../packages/database/src/index.ts';
import { withIsolatedP6Database } from './postgres-test-harness.mjs';

const connectionString = process.env.POSTGRES_URL;
const dbTest = connectionString ? test : test.skip;

function canonicalState(revision = 8) {
  return {
    gameId: 'game-p6-outbox',
    revision,
    players: [
      { playerId: 'p2', seat: 0 },
      { playerId: 'p1', seat: 1 }
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

async function seedSession(pool, revision = 8) {
  const state = canonicalState(revision);
  await pool.query(
    'insert into game_sessions (session_id, canonical_state, revision) values ($1, $2::jsonb, $3)',
    ['session-1', JSON.stringify(state), revision]
  );
  await pool.query(
    `insert into game_session_memberships (session_id, principal_id, player_id)
     values ($1, $2, $3), ($1, $4, $5)`,
    ['session-1', 'principal-1', 'p1', 'principal-2', 'p2']
  );
  return state;
}

async function insertSignal(pool, revision = 8, overrides = {}) {
  const audience = overrides.audience ?? { kind: 'session' };
  const payload = overrides.payload ?? {
    kind: 'SESSION_REVISION_COMMITTED',
    sessionId: 'session-1',
    revision
  };
  const result = await pool.query(
    `insert into game_outbox (session_id, accepted_revision, audience, payload)
     values ($1, $2, $3::jsonb, $4::jsonb)
     returning outbox_id`,
    ['session-1', revision, JSON.stringify(audience), JSON.stringify(payload)]
  );
  return String(result.rows[0].outbox_id);
}

dbTest('P6 PostgreSQL outbox store leases one committed signal at a time and release makes it claimable again', async () => {
  assert.equal(typeof database.createPostgresOutboxStore, 'function');
  await withIsolatedP6Database(connectionString, async (pool) => {
    await seedSession(pool);
    const outboxId = await insertSignal(pool);
    const store = database.createPostgresOutboxStore(pool);

    const first = await store.claimNext({ leaseToken: 'lease-a', leaseDurationMs: 30_000 });
    assert.deepEqual(first, {
      outboxId,
      sessionId: 'session-1',
      acceptedRevision: 8,
      leaseToken: 'lease-a'
    });

    assert.equal(
      await store.claimNext({ leaseToken: 'lease-b', leaseDurationMs: 30_000 }),
      null
    );

    await store.releaseClaim({ outboxId, leaseToken: 'lease-a' });
    assert.deepEqual(
      await store.claimNext({ leaseToken: 'lease-b', leaseDurationMs: 30_000 }),
      {
        outboxId,
        sessionId: 'session-1',
        acceptedRevision: 8,
        leaseToken: 'lease-b'
      }
    );
  });
});

dbTest('P6 PostgreSQL outbox store publishes only with the owning lease and published rows are never reclaimed', async () => {
  assert.equal(typeof database.createPostgresOutboxStore, 'function');
  await withIsolatedP6Database(connectionString, async (pool) => {
    await seedSession(pool);
    const outboxId = await insertSignal(pool);
    const store = database.createPostgresOutboxStore(pool);

    await store.claimNext({ leaseToken: 'lease-owner', leaseDurationMs: 30_000 });
    await assert.rejects(
      store.markPublished({ outboxId, leaseToken: 'wrong-lease' }),
      /lease/i
    );

    await store.markPublished({ outboxId, leaseToken: 'lease-owner' });
    assert.equal(
      await store.claimNext({ leaseToken: 'lease-next', leaseDurationMs: 30_000 }),
      null
    );

    const row = await pool.query(
      'select published_at, lease_token, lease_expires_at from game_outbox where outbox_id = $1',
      [outboxId]
    );
    assert.notEqual(row.rows[0].published_at, null);
    assert.equal(row.rows[0].lease_token, null);
    assert.equal(row.rows[0].lease_expires_at, null);
  });
});

dbTest('P6 PostgreSQL outbox store loads a validated canonical snapshot and deterministic current member order', async () => {
  assert.equal(typeof database.createPostgresOutboxStore, 'function');
  await withIsolatedP6Database(connectionString, async (pool) => {
    const state = await seedSession(pool, 11);
    const store = database.createPostgresOutboxStore(pool);

    const source = await store.loadProjectionSource('session-1');
    assert.deepEqual(source.state, state);
    assert.deepEqual(source.playerIds, ['p2', 'p1']);

    await pool.query('update game_sessions set revision = 12 where session_id = $1', ['session-1']);
    await assert.rejects(store.loadProjectionSource('session-1'), /revision/i);
  });
});

dbTest('P6 PostgreSQL outbox store fails closed on malformed or non-session revision signals', async () => {
  assert.equal(typeof database.createPostgresOutboxStore, 'function');
  await withIsolatedP6Database(connectionString, async (pool) => {
    await seedSession(pool);
    await insertSignal(pool, 8, {
      payload: { kind: 'UNAPPROVED_EVENT', sessionId: 'session-1', revision: 8 }
    });
    const store = database.createPostgresOutboxStore(pool);

    await assert.rejects(
      store.claimNext({ leaseToken: 'lease-a', leaseDurationMs: 30_000 }),
      /outbox signal/i
    );

    const row = await pool.query('select lease_token, published_at from game_outbox');
    assert.equal(row.rows[0].lease_token, null);
    assert.equal(row.rows[0].published_at, null);
  });
});
