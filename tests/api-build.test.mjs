import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildApi } from '../tools/build/api.mjs';

test('P5 API build audits a real production module graph', async () => {
  const result = await buildApi();
  assert.equal(result.surface, 'api');
  assert.ok(result.modules >= 1);

  const graph = JSON.parse(await readFile('artifacts/api-graph.json', 'utf8'));
  assert.equal(graph.surface, 'api');
  assert.deepEqual(graph.entries, ['main.js']);
  assert.ok(graph.modules.includes('apps/api/src/main.ts'));
  assert.equal('placeholderOnly' in graph, false);
});
