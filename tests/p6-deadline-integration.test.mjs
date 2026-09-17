import test from 'node:test';
import assert from 'node:assert/strict';

import { createGameCommandService } from '../apps/api/src/command-service.ts';
import { createDeadlineWorker } from '../apps/api/src/deadline-worker.ts';
import {
  createPostgresCommandTransactionPort,
  createPostgresDeadlineStore
} from '../packages/database/src/index.ts';
import { withIsolatedP6Database } from './postgres-test-harness.mjs';

const connectionString = process.env.POSTGRES_URL;
const dbTest = connectionString ? test : test.skip;

function canonicalState() {
  return {
    gameId: 'game-deadline-integration',
    revision: 12,
    players: [{ playerId: 'p1', seat: 0 }],
    zones: {
      drawPile: ['card-a'],
      discardPile: [],
      hands: { p1: [] }
    },
    rootFlow: null,
    continuations: [],
    persistentEffects: [],
    deadlines: [],
    winnerBoundary: { status: 'ready' }
  };
}

dbTest('P6 due deadline flows through the real command service and atomic PostgreSQL command transaction', async () => {
  await withIsolatedP6Database(connectionString, async (pool) => {
    await pool.query(
      `insert into game_sessions (session_id, canonical_state, revision)
       values ($1, $2::jsonb, $3)`,
      ['session-1', JSON.stringify(canonicalState()), 12]
    );
    await pool.query(
      `insert into game_session_memberships (session_id, principal_id, player_id)
       values ($1, $2, $3)`,
      ['session-1', 'principal-1', 'p1']
    );
    await pool.query(
      `insert into game_deadline_jobs
        (deadline_id, session_id, due_at, principal_id, command_id, command_fingerprint,
         expected_revision, command_payload, status)
       values ($1, $2, now() - interval '1 second', $3, $4, $5, $6, $7::jsonb, 'pending')`,
      [
        'deadline-1',
        'session-1',
        'principal-1',
        'cmd-deadline-1',
        'fp-deadline-1',
        12,
        JSON.stringify({ kind: 'EXPLICIT_SCHEDULED_COMMAND' })
      ]
    );

    const commandService = createGameCommandService({
      auth: {
        async authenticate(authInput) {
          if (
            typeof authInput === 'object' &&
            authInput !== null &&
            authInput.kind === 'trusted-deadline' &&
            authInput.principalId === 'principal-1'
          ) {
            return { principalId: 'principal-1' };
          }
          return null;
        }
      },
      transactions: createPostgresCommandTransactionPort(pool),
      resolver: {
        async resolve({ command }) {
          assert.equal(command.kind, 'EXPLICIT_SCHEDULED_COMMAND');
          return {
            authoritativeInputs: { source: 'deadline-integration-test' },
            definition: {
              ruleRefs: ['P6-DEADLINE-INFRASTRUCTURE'],
              cardConservation: 'preserve',
              apply({ state }) {
                return { status: 'accepted', state, effects: [] };
              }
            }
          };
        }
      }
    });

    const worker = createDeadlineWorker({
      store: createPostgresDeadlineStore(pool),
      commandService,
      trustedAuthInputFactory(job) {
        return { kind: 'trusted-deadline', principalId: job.principalId };
      },
      leaseTokenFactory: () => 'lease-integration',
      leaseDurationMs: 30_000
    });

    const result = await worker.runOnce();
    assert.equal(result.status, 'completed');
    assert.equal(result.deadlineId, 'deadline-1');
    assert.equal(result.commandResult.status, 'accepted');
    assert.equal(result.commandResult.receipt.acceptedRevision, 13);

    const session = await pool.query(
      'select revision, canonical_state from game_sessions where session_id = $1',
      ['session-1']
    );
    assert.equal(Number(session.rows[0].revision), 13);
    assert.equal(session.rows[0].canonical_state.revision, 13);

    const receiptCount = await pool.query('select count(*) from accepted_command_receipts');
    const outboxCount = await pool.query('select count(*) from game_outbox');
    const deadline = await pool.query(
      `select status, completed_at, lease_token
         from game_deadline_jobs where deadline_id = 'deadline-1'`
    );
    assert.equal(Number(receiptCount.rows[0].count), 1);
    assert.equal(Number(outboxCount.rows[0].count), 1);
    assert.equal(deadline.rows[0].status, 'completed');
    assert.notEqual(deadline.rows[0].completed_at, null);
    assert.equal(deadline.rows[0].lease_token, null);
  });
});
