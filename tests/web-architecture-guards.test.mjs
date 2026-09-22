import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

function between(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  assert.notEqual(start, -1, `missing start marker: ${startMarker}`);
  const end = text.indexOf(endMarker, start);
  assert.notEqual(end, -1, `missing end marker: ${endMarker}`);
  return text.slice(start, end);
}

test('Phase 8 forbids recurring Web root rebuilds outside one-time shell mount and final teardown', async () => {
  const [client, shell, binding] = await Promise.all([
    source('packages/client-app/src/index.ts'),
    source('packages/ui/src/web-shell.ts'),
    source('packages/ui/src/web-game-binding.ts'),
  ]);

  const webUpdate = between(
    client,
    'function updatePresentation(): void',
    'function renderTelegram(): void',
  );

  assert.equal(webUpdate.includes('root.innerHTML ='), false);
  assert.equal(webUpdate.includes('replaceChildren('), false);
  assert.equal(binding.includes('root.innerHTML ='), false);
  assert.equal(binding.includes('replaceChildren('), false);

  assert.equal(shell.split('root.innerHTML =').length - 1, 1, 'Web shell mounts donor DOM exactly once');
  assert.equal(shell.split('root.replaceChildren()').length - 1, 1, 'Web shell clears root only during final teardown');
});

test('Phase 8 keeps the Web presentation controller persistent across projection updates', async () => {
  const client = await source('packages/client-app/src/index.ts');
  const webUpdate = between(
    client,
    'function updatePresentation(): void',
    'function renderTelegram(): void',
  );

  assert.equal(client.split('mountWebPresentationController(').length - 1, 1);
  assert.equal(client.split('unmountWebPresentation?.()').length - 1, 1, 'controller teardown occurs only at app teardown');
  assert.equal(webUpdate.includes('mountWebPresentationController('), false);
  assert.equal(webUpdate.includes('unmountWebPresentation'), false);
});

test('Phase 8 keeps is-game-view ownership out of game-table mount and replacement code', async () => {
  const [uiIndex, controller] = await Promise.all([
    source('packages/ui/src/index.ts'),
    source('packages/ui/src/web-controller.ts'),
  ]);

  assert.equal(uiIndex.includes('is-game-view'), false, 'game-table mount/unmount must never own is-game-view');
  assert.ok(
    controller.includes("body.classList.toggle('is-game-view', next === 'game')"),
    'navigation controller remains the is-game-view owner',
  );
});

test('Phase 8 keeps Web and Telegram on separate presentation renderers', async () => {
  const client = await source('packages/client-app/src/index.ts');

  const webUpdate = between(
    client,
    'function updatePresentation(): void',
    'function renderTelegram(): void',
  );
  const telegramRenderer = between(
    client,
    'function renderTelegram(): void',
    "if (platform.kind === 'web') {",
  );

  assert.ok(webUpdate.includes('updateWebPresentation(root,'));
  assert.ok(webUpdate.includes('renderTelegram();'));
  assert.equal(webUpdate.includes('mountGameTable('), false);
  assert.equal(webUpdate.includes('root.innerHTML ='), false);

  assert.ok(telegramRenderer.includes("mountGameTable(target, state.projection, { onDraw: drawCard, onPlay: playCard }, 'telegram')"));
  assert.ok(telegramRenderer.includes('root.innerHTML ='));
  assert.equal(telegramRenderer.includes('updateWebPresentation('), false);
});

test('Phase 8 keeps every staged donor UI file pinned to the immutable donor hash manifest', async () => {
  const manifest = JSON.parse(await source('packages/ui/src/old-ui-source/manifest.json'));
  const pinned = 'funmarket/cribbit-chaos@95febd07e4d739c96843fcc4a02f070eb3c623c0';

  assert.ok(Array.isArray(manifest));
  assert.ok(manifest.length > 0);

  for (const entry of manifest) {
    assert.equal(entry.source, pinned, `${entry.path} donor ref drifted`);

    const bytes = await readFile(new URL(
      `../packages/ui/src/old-ui-source/${entry.stored_as}`,
      import.meta.url,
    ));
    const sha256 = createHash('sha256').update(bytes).digest('hex');

    assert.equal(bytes.length, entry.bytes, `${entry.path} byte count drifted`);
    assert.equal(sha256, entry.sha256, `${entry.path} content hash drifted`);
  }
});
