import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const PINNED_UI_DONOR = 'funmarket/cribbit-chaos@95febd07e4d739c96843fcc4a02f070eb3c623c0';

test('extracted donor UI sources stay pinned and byte-verified against the immutable donor manifest', async () => {
  const manifestUrl = new URL('../packages/ui/src/old-ui-source/manifest.json', import.meta.url);
  const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));

  assert.ok(Array.isArray(manifest));
  assert.ok(manifest.length > 0);

  for (const entry of manifest) {
    assert.equal(entry.source, PINNED_UI_DONOR, `${entry.path} must pin the immutable UI donor SHA`);

    const storedUrl = new URL(`../packages/ui/src/old-ui-source/${entry.stored_as}`, import.meta.url);
    const bytes = await readFile(storedUrl);
    const sha256 = createHash('sha256').update(bytes).digest('hex');

    assert.equal(bytes.length, entry.bytes, `${entry.path} byte count drifted`);
    assert.equal(sha256, entry.sha256, `${entry.path} content hash drifted`);
  }
});
