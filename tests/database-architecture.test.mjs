import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

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
