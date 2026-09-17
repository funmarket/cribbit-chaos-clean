import test from 'node:test';
import assert from 'node:assert/strict';

import * as database from '../packages/database/src/index.ts';
import { createGameCommandService } from '../apps/api/src/command-service.ts';
import { withIsolatedP6Database } from './postgres-test-harness.mjs';

const connectionString = process.env.POSTGRES_URL;
const dbTest = connectionString ? test : test.skip;

function canonicalState(revision = 7) {
  return {
    gameId: 'game-p6-concurrency',
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

function receipt(commandId, fingerprint) {
  return {
    commandId,
    commandFingerprint: fingerprint,
    sessionId: 'session-1',
    actorPlayerId: 'p1',
    acceptedRevision: 8
  };
}

dbTest('P6 serializes concurrent writers so only one commit from the same expected revision succeeds', async () => {
  await withFreshDatabase(async (pool) => {
    const transactions = database.createPostgresCommandTransactionPort(pool);

    const attempt = (commandId, fingerprint) => transactions.withSession('session-1', async (tx) => {
      await tx.loadCanonicalState();
      await tx.commitAccepted({
        expectedRevision: 7,
        nextState: canonicalState(8),
        receipt: receipt(commandId, fingerprint)
      });
      return commandId;
    });

    const results = await Promise.allSettled([
      attempt('cmd-a', 'fp-a'),
      attempt('cmd-b', 'fp-b')
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    assert.equal(fulfilled.length, 1);
    assert.equal(rejected.length, 1);
    assert.equal(rejected[0].reason instanceof database.RevisionConflictError, true);

    const session = await pool.query('select revision from game_sessions where session_id = $1', ['session-1']);
    assert.equal(Number(session.rows[0].revision), 8);
    assert.equal(Number((await pool.query('select count(*) from accepted_command_receipts')).rows[0].count), 1);
    assert.equal(Number((await pool.query('select count(*) from game_outbox')).rows[0].count), 1);
  });
});

dbTest('P6 same-command retry through GameCommandService reuses the persisted receipt without another outbox row', async () => {
  await withFreshDatabase(async (pool) => {
    const transactions = database.createPostgresCommandTransactionPort(pool);
    const service = createGameCommandService({
      auth: {
        async authenticate() {
          return { principalId: 'principal-1' };
        }
      },
      transactions,
      resolver: {
        async resolve() {
          return {
            authoritativeInputs: { trusted: true },
            definition: {
              ruleRefs: ['P6-IDEMPOTENCY-TEST'],
              cardConservation: 'preserve',
              apply({ state }) {
                return { status: 'accepted', state, effects: [] };
              }
            }
          };
        }
      }
    });

    const request = {
      authInput: { kind: 'test' },
      envelope: {
        commandId: 'cmd-retry',
        commandFingerprint: 'fp-retry',
        sessionId: 'session-1',
        expectedRevision: 7,
        command: { kind: 'TEST_COMMAND' }
      }
    };

    const first = await service.execute(request);
    const second = await service.execute(request);

    assert.equal(first.status, 'accepted');
    assert.equal(second.status, 'accepted');
    assert.deepEqual(second.receipt, first.receipt);
    assert.equal(second.projection.revision, 8);
    assert.equal(Number((await pool.query('select count(*) from accepted_command_receipts')).rows[0].count), 1);
    assert.equal(Number((await pool.query('select count(*) from game_outbox')).rows[0].count), 1);
  });
});
