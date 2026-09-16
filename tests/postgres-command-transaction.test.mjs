import test from 'node:test';
import assert from 'node:assert/strict';

import * as database from '../packages/database/src/index.ts';
import { withIsolatedP6Database } from './postgres-test-harness.mjs';

const connectionString = process.env.POSTGRES_URL;
const dbTest = connectionString ? test : test.skip;

function canonicalState(revision = 7) {
  return {
    gameId: 'game-p6',
    revision,
    players: [
      { playerId: 'p1', seat: 0 },
      { playerId: 'p2', seat: 1 }
    ],
    zones: {
      drawPile: ['card-a', 'card-b'],
      discardPile: ['card-c'],
      hands: { p1: ['card-d'], p2: ['card-e'] }
    },
    rootFlow: null,
    continuations: [],
    persistentEffects: [],
    deadlines: [],
    winnerBoundary: { status: 'ready' }
  };
}

async function withFreshDatabase(run) {
  return withIsolatedP6Database(connectionString, async (pool) => {
    await pool.query(
      'insert into game_sessions (session_id, canonical_state, revision) values ($1, $2::jsonb, $3)',
      ['session-1', JSON.stringify(canonicalState()), 7]
    );
    await pool.query(
      'insert into game_session_memberships (session_id, principal_id, player_id) values ($1, $2, $3)',
      ['session-1', 'principal-1', 'p1']
    );
    return run(pool);
  });
}

function receipt(overrides = {}) {
  return {
    commandId: 'cmd-1',
    commandFingerprint: 'fp-1',
    sessionId: 'session-1',
    actorPlayerId: 'p1',
    acceptedRevision: 8,
    ...overrides
  };
}

dbTest('P6 PostgreSQL transaction returns null for a missing session and loads membership/state for an existing session', async () => {
  assert.equal(typeof database.createPostgresCommandTransactionPort, 'function');
  await withFreshDatabase(async (pool) => {
    const transactions = database.createPostgresCommandTransactionPort(pool);
    assert.equal(await transactions.withSession('missing', async () => 'unexpected'), null);

    const loaded = await transactions.withSession('session-1', async (tx) => ({
      member: await tx.loadMembership('principal-1'),
      outsider: await tx.loadMembership('principal-x'),
      state: await tx.loadCanonicalState()
    }));

    assert.deepEqual(loaded.member, { playerId: 'p1' });
    assert.equal(loaded.outsider, null);
    assert.deepEqual(loaded.state, canonicalState());
  });
});

dbTest('P6 accepted commit atomically writes canonical state, receipt, and a private-data-free outbox signal', async () => {
  assert.equal(typeof database.createPostgresCommandTransactionPort, 'function');
  await withFreshDatabase(async (pool) => {
    const transactions = database.createPostgresCommandTransactionPort(pool);
    const nextState = canonicalState(8);

    await transactions.withSession('session-1', (tx) => tx.commitAccepted({
      expectedRevision: 7,
      nextState,
      receipt: receipt()
    }));

    const session = await pool.query('select canonical_state, revision from game_sessions where session_id = $1', ['session-1']);
    assert.equal(Number(session.rows[0].revision), 8);
    assert.deepEqual(session.rows[0].canonical_state, nextState);

    const receipts = await pool.query('select command_id, command_fingerprint, actor_player_id, accepted_revision from accepted_command_receipts');
    assert.deepEqual(receipts.rows, [{
      command_id: 'cmd-1',
      command_fingerprint: 'fp-1',
      actor_player_id: 'p1',
      accepted_revision: '8'
    }]);

    const outbox = await pool.query('select accepted_revision, audience, payload from game_outbox');
    assert.equal(outbox.rows.length, 1);
    assert.equal(Number(outbox.rows[0].accepted_revision), 8);
    assert.deepEqual(outbox.rows[0].audience, { kind: 'session' });
    assert.deepEqual(outbox.rows[0].payload, {
      kind: 'SESSION_REVISION_COMMITTED',
      sessionId: 'session-1',
      revision: 8
    });
    assert.equal(JSON.stringify(outbox.rows[0]).includes('card-d'), false);
    assert.equal(JSON.stringify(outbox.rows[0]).includes('card-e'), false);
  });
});

dbTest('P6 accepted receipt lookup survives transaction boundaries', async () => {
  assert.equal(typeof database.createPostgresCommandTransactionPort, 'function');
  await withFreshDatabase(async (pool) => {
    const transactions = database.createPostgresCommandTransactionPort(pool);
    await transactions.withSession('session-1', (tx) => tx.commitAccepted({
      expectedRevision: 7,
      nextState: canonicalState(8),
      receipt: receipt()
    }));

    const stored = await transactions.withSession('session-1', (tx) => tx.findAcceptedReceipt('cmd-1'));
    assert.deepEqual(stored, receipt());
  });
});

dbTest('P6 failed receipt insert rolls back the state update and outbox insert', async () => {
  assert.equal(typeof database.createPostgresCommandTransactionPort, 'function');
  await withFreshDatabase(async (pool) => {
    await pool.query(
      `insert into accepted_command_receipts
        (session_id, command_id, command_fingerprint, actor_player_id, accepted_revision)
       values ($1, $2, $3, $4, $5)`,
      ['session-1', 'cmd-1', 'existing-fp', 'p1', 7]
    );

    const transactions = database.createPostgresCommandTransactionPort(pool);
    await assert.rejects(
      transactions.withSession('session-1', (tx) => tx.commitAccepted({
        expectedRevision: 7,
        nextState: canonicalState(8),
        receipt: receipt()
      }))
    );

    const session = await pool.query('select canonical_state, revision from game_sessions where session_id = $1', ['session-1']);
    assert.equal(Number(session.rows[0].revision), 7);
    assert.deepEqual(session.rows[0].canonical_state, canonicalState(7));
    assert.equal(Number((await pool.query('select count(*) from game_outbox')).rows[0].count), 0);
    assert.equal(Number((await pool.query('select count(*) from accepted_command_receipts')).rows[0].count), 1);
  });
});
