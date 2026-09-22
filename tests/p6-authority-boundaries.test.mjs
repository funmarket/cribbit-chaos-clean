import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { readCanonicalMigrations } from '../db/migrate.mjs';

test('deadline worker routes explicit jobs through GameCommandService and owns no canonical-state mutation path', async () => {
  const source = await readFile(new URL('../apps/api/src/deadline-worker.ts', import.meta.url), 'utf8');
  assert.match(source, /commandService\.execute\s*\(/);
  assert.doesNotMatch(source, /loadCanonicalState|commitAccepted|game_sessions|canonical_state/);
});

test('outbox worker publishes recipient projections rather than canonical state', async () => {
  const source = await readFile(new URL('../apps/api/src/outbox-worker.ts', import.meta.url), 'utf8');
  assert.match(source, /projection:\s*projectGameState\(source\.state,\s*recipient\)/);
  assert.doesNotMatch(source, /projection:\s*source\.state/);
});

test('executable canonical migrations stay byte-equivalent to the checked-in migration chain', async () => {
  const [identity, game, migrations] = await Promise.all([
    readFile(new URL('../db/migrations/001_identity.sql', import.meta.url), 'utf8'),
    readFile(new URL('../db/migrations/002_game_core.sql', import.meta.url), 'utf8'),
    readCanonicalMigrations()
  ]);

  assert.deepEqual(
    migrations.map((migration) => migration.name),
    ['001_identity.sql', '002_game_core.sql']
  );
  assert.equal(migrations[0].sql, identity);
  assert.equal(migrations[1].sql, game);
});
