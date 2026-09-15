import test from 'node:test';
import assert from 'node:assert/strict';

import * as database from '../packages/database/src/index.ts';
import { withIsolatedP6Database } from './postgres-test-harness.mjs';

const connectionString = process.env.POSTGRES_URL;
const dbTest = connectionString ? test : test.skip;

async function seedSession(pool) {
  await pool.query(
    `insert into game_sessions (session_id, canonical_state, revision)
     values ($1, $2::jsonb, $3)`,
    ['session-1', JSON.stringify({
      gameId: 'game-deadline',
      revision: 12,
      players: [{ playerId: 'p1', seat: 0 }],
      zones: { drawPile: [], discardPile: [], hands: { p1: [] } },
      rootFlow: null,
      continuations: [],
      persistentEffects: [],
      deadlines: [],
      winnerBoundary: { status: 'ready' }
    }), 12]
  );
}

async function insertJob(pool, overrides = {}) {
  const job = {
    deadlineId: 'deadline-1',
    dueExpression: "now() - interval '1 second'",
    principalId: 'principal-1',
    commandId: 'cmd-deadline-1',
    commandFingerprint: 'fp-deadline-1',
    expectedRevision: 12,
    command: { kind: 'EXPLICIT_SCHEDULED_COMMAND', source: 'approved-rule' },
    ...overrides
  };
  await pool.query(
    `insert into game_deadline_jobs
      (deadline_id, session_id, due_at, principal_id, command_id, command_fingerprint,
       expected_revision, command_payload, status)
     values ($1, 'session-1', ${job.dueExpression}, $2, $3, $4, $5, $6::jsonb, 'pending')`,
    [
      job.deadlineId,
      job.principalId,
      job.commandId,
      job.commandFingerprint,
      job.expectedRevision,
      JSON.stringify(job.command)
    ]
  );
}

dbTest('P6 PostgreSQL deadline store claims only due explicit jobs and release makes the stable command claimable again', async () => {
  assert.equal(typeof database.createPostgresDeadlineStore, 'function');
  await withIsolatedP6Database(connectionString, async (pool) => {
    await seedSession(pool);
    await insertJob(pool);
    await insertJob(pool, {
      deadlineId: 'deadline-future',
      dueExpression: "now() + interval '1 hour'",
      commandId: 'cmd-future'
    });
    const store = database.createPostgresDeadlineStore(pool);

    assert.deepEqual(
      await store.claimDue({ leaseToken: 'lease-a', leaseDurationMs: 30_000 }),
      {
        deadlineId: 'deadline-1',
        sessionId: 'session-1',
        principalId: 'principal-1',
        commandId: 'cmd-deadline-1',
        commandFingerprint: 'fp-deadline-1',
        expectedRevision: 12,
        command: { kind: 'EXPLICIT_SCHEDULED_COMMAND', source: 'approved-rule' },
        leaseToken: 'lease-a'
      }
    );
    assert.equal(
      await store.claimDue({ leaseToken: 'lease-b', leaseDurationMs: 30_000 }),
      null
    );

    await store.releaseClaim({ deadlineId: 'deadline-1', leaseToken: 'lease-a' });
    const retried = await store.claimDue({ leaseToken: 'lease-b', leaseDurationMs: 30_000 });
    assert.equal(retried.commandId, 'cmd-deadline-1');
    assert.equal(retried.commandFingerprint, 'fp-deadline-1');
    assert.equal(retried.expectedRevision, 12);
    assert.equal(retried.leaseToken, 'lease-b');
  });
});

dbTest('P6 PostgreSQL deadline completion requires the active lease and completed jobs are never reclaimed', async () => {
  assert.equal(typeof database.createPostgresDeadlineStore, 'function');
  await withIsolatedP6Database(connectionString, async (pool) => {
    await seedSession(pool);
    await insertJob(pool);
    const store = database.createPostgresDeadlineStore(pool);

    await store.claimDue({ leaseToken: 'lease-owner', leaseDurationMs: 30_000 });
    await assert.rejects(
      store.markCompleted({ deadlineId: 'deadline-1', leaseToken: 'wrong-lease' }),
      /lease/i
    );
    await store.markCompleted({ deadlineId: 'deadline-1', leaseToken: 'lease-owner' });

    assert.equal(
      await store.claimDue({ leaseToken: 'lease-next', leaseDurationMs: 30_000 }),
      null
    );
    const row = await pool.query(
      `select status, completed_at, lease_token, lease_expires_at
         from game_deadline_jobs where deadline_id = 'deadline-1'`
    );
    assert.equal(row.rows[0].status, 'completed');
    assert.notEqual(row.rows[0].completed_at, null);
    assert.equal(row.rows[0].lease_token, null);
    assert.equal(row.rows[0].lease_expires_at, null);
  });
});

dbTest('P6 PostgreSQL deadline store fails closed on a command payload without an explicit command kind', async () => {
  assert.equal(typeof database.createPostgresDeadlineStore, 'function');
  await withIsolatedP6Database(connectionString, async (pool) => {
    await seedSession(pool);
    await insertJob(pool, { command: { source: 'missing-kind' } });
    const store = database.createPostgresDeadlineStore(pool);

    await assert.rejects(
      store.claimDue({ leaseToken: 'lease-a', leaseDurationMs: 30_000 }),
      /deadline command payload/i
    );

    const row = await pool.query(
      `select status, lease_token from game_deadline_jobs where deadline_id = 'deadline-1'`
    );
    assert.equal(row.rows[0].status, 'pending');
    assert.equal(row.rows[0].lease_token, null);
  });
});
