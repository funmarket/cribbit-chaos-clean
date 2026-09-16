import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedNodeBuiltinImport } from '../tools/architecture/policy.mjs';

test('Node builtin imports are reserved to the API runtime workspace', () => {
  assert.equal(isAllowedNodeBuiltinImport('@cribbit/api', 'node:http'), true);
  assert.equal(isAllowedNodeBuiltinImport('@cribbit/web', 'node:http'), false);
  assert.equal(isAllowedNodeBuiltinImport('@cribbit/telegram', 'node:fs'), false);
  assert.equal(isAllowedNodeBuiltinImport('@cribbit/database', 'node:path'), false);
  assert.equal(isAllowedNodeBuiltinImport('@cribbit/api', 'pg'), false);
});
