import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

import { ALLOWED_EDGES, WORKSPACES } from '../tools/architecture/policy.mjs';

const CLIENTS = ['@cribbit/web', '@cribbit/telegram', '@cribbit/client-app', '@cribbit/ui', '@cribbit/api-client'];

test('database remains server-only and unreachable from either frontend', async () => {
  assert.equal(WORKSPACES['@cribbit/database'], 'packages/database');
  assert.equal(ALLOWED_EDGES['@cribbit/api'].includes('@cribbit/database'), true);
  for (const workspace of CLIENTS) {
    assert.equal(ALLOWED_EDGES[workspace].includes('@cribbit/database'), false);
  }
});

test('canonical migrations own one users identity graph and one game persistence model', async () => {
  const identity = await readFile(new URL('../db/migrations/001_identity.sql', import.meta.url), 'utf8');
  const game = await readFile(new URL('../db/migrations/002_game_core.sql', import.meta.url), 'utf8');
  assert.match(identity, /create\s+table\s+if\s+not\s+exists\s+users/i);
  assert.match(identity, /user_identities/i);
  assert.match(identity, /web_credentials/i);
  assert.match(identity, /unique\s*\(provider,\s*provider_user_id\)/i);
  assert.match(game, /game_session_memberships/i);
  assert.match(game, /principal_id\s+text\s+not\s+null\s+references\s+users\(id\)/i);
  assert.doesNotMatch(game, /clean_game_sessions|game_participants|clean_game_commands/i);
});

test('db/migrations is the only canonical migration SQL authority', async () => {
  const migrationDir = new URL('../db/migrations/', import.meta.url);
  const expected = ['001_identity.sql', '002_game_core.sql'];
  const discovered = (await readdir(migrationDir))
    .filter((name) => name.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  assert.deepEqual(discovered, expected);

  const runner = await readFile(new URL('../db/migrate.mjs', import.meta.url), 'utf8');
  assert.match(runner, /readdir\(MIGRATIONS_DIR/);
  assert.match(runner, /readFile\(path\.join\(MIGRATIONS_DIR, name\), 'utf8'\)/);
  assert.doesNotMatch(runner, /create\s+table/i);

  const databaseSourceDir = new URL('../packages/database/src/', import.meta.url);
  for (const name of await readdir(databaseSourceDir)) {
    if (!name.endsWith('.ts')) continue;
    const source = await readFile(new URL(name, databaseSourceDir), 'utf8');
    assert.doesNotMatch(source, /create\s+table/i, `${name} must not own migration SQL`);
  }

  const harness = await readFile(new URL('./postgres-test-harness.mjs', import.meta.url), 'utf8');
  assert.match(harness, /from '\.\.\/db\/migrate\.mjs'/);

  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(packageJson.scripts['db:migrate'], 'node db/migrate.mjs');
});

test('canonical migration runner reads and executes the approved SQL files in lexical order', async () => {
  const { readCanonicalMigrations, applyCanonicalMigrations } = await import('../db/migrate.mjs');
  const migrations = await readCanonicalMigrations();
  assert.deepEqual(
    migrations.map((migration) => migration.name),
    ['001_identity.sql', '002_game_core.sql']
  );

  const executed = [];
  await applyCanonicalMigrations({
    async query(sql) {
      executed.push(sql);
      return {};
    }
  });

  assert.deepEqual(executed, migrations.map((migration) => migration.sql));
});
