import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { P6_MIGRATION_SQL } from '../packages/database/src/index.ts';

test('P6 deadline worker routes explicit jobs through GameCommandService and owns no canonical-state mutation path', async () => {
  const source = await readFile(
    new URL('../apps/api/src/deadline-worker.ts', import.meta.url),
    'utf8'
  );

  assert.match(source, /commandService\.execute\s*\(/);
  assert.doesNotMatch(source, /loadCanonicalState|commitAccepted|game_sessions|canonical_state/);
  assert.doesNotMatch(source, /DEADLINE_EXPIRED|TIMEOUT_EXPIRED/);
});

test('P6 outbox worker publishes recipient projections rather than canonical state', async () => {
  const source = await readFile(
    new URL('../apps/api/src/outbox-worker.ts', import.meta.url),
    'utf8'
  );

  assert.match(source, /projection:\s*projectGameState\(source\.state,\s*recipient\)/);
  assert.doesNotMatch(source, /projection:\s*source\.state/);
  assert.doesNotMatch(source, /publisher\.publish\(source\.state/);
});

test('P6 executable migration and checked-in SQL migration stay byte-equivalent', async () => {
  const sql = await readFile(
    new URL('../packages/database/migrations/0001_p6_server_infrastructure.sql', import.meta.url),
    'utf8'
  );

  assert.equal(P6_MIGRATION_SQL, sql);
});
