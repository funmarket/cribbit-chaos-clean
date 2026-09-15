import test from 'node:test';
import assert from 'node:assert/strict';

import { isAllowedEdge } from '../tools/architecture/policy.mjs';

test('P5 API may reach server contracts/engine but never client or platform workspaces', () => {
  assert.equal(isAllowedEdge('@cribbit/api', '@cribbit/contracts'), true);
  assert.equal(isAllowedEdge('@cribbit/api', '@cribbit/game-engine'), true);
  assert.equal(isAllowedEdge('@cribbit/api', '@cribbit/client-app'), false);
  assert.equal(isAllowedEdge('@cribbit/api', '@cribbit/api-client'), false);
  assert.equal(isAllowedEdge('@cribbit/api', '@cribbit/platform'), false);
  assert.equal(isAllowedEdge('@cribbit/api', '@cribbit/ui'), false);
});
