import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { ALLOWED_EDGES, WORKSPACES } from '../tools/architecture/policy.mjs';

const CLIENTS = [
  '@cribbit/web',
  '@cribbit/telegram',
  '@cribbit/client-app',
  '@cribbit/ui',
  '@cribbit/api-client'
];

test('P6 declares a server-only database workspace reachable by API only', async () => {
  assert.equal(WORKSPACES['@cribbit/database'], 'packages/database');
  assert.equal(ALLOWED_EDGES['@cribbit/api'].includes('@cribbit/database'), true);
  assert.deepEqual(ALLOWED_EDGES['@cribbit/database'], [
    '@cribbit/contracts',
    '@cribbit/game-engine'
  ]);
  for (const workspace of CLIENTS) {
    assert.equal(
      ALLOWED_EDGES[workspace].includes('@cribbit/database'),
      false,
      `${workspace} must not depend on the database workspace`
    );
  }
});

test('P6 migration owns sessions, memberships, receipts, outbox, and explicit deadline command jobs', async () => {
  const sql = await readFile(
    new URL('../packages/database/migrations/0001_p6_server_infrastructure.sql', import.meta.url),
    'utf8'
  );
  for (const table of [
    'game_sessions',
    'game_session_memberships',
    'accepted_command_receipts',
    'game_outbox',
    'game_deadline_jobs'
  ]) {
    assert.match(sql, new RegExp(`create\\s+table\\s+${table}`, 'i'));
  }
  assert.match(sql, /primary\s+key\s*\(session_id,\s*command_id\)/i);
  assert.match(sql, /published_at\s+timestamptz\s+null/i);
  assert.match(sql, /status\s+text\s+not\s+null/i);
  assert.match(sql, /principal_id\s+text\s+not\s+null/i);
  assert.match(sql, /expected_revision\s+bigint\s+not\s+null\s+check\s*\(expected_revision\s*>=\s*0\)/i);
  assert.match(sql, /command_payload\s+jsonb\s+not\s+null/i);
});
