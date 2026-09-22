import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function readSource(path) {
  try {
    return await readFile(new URL(`../${path}`, import.meta.url), 'utf8');
  } catch {
    return null;
  }
}

test('Phase 2 Web composition mounts the shell once and updates presentation without root rebuilds', async () => {
  const [client, webShell, webBinding, webCards] = await Promise.all([
    readSource('packages/client-app/src/index.ts'),
    readSource('packages/ui/src/web-shell.ts'),
    readSource('packages/ui/src/web-game-binding.ts'),
    readSource('packages/ui/src/web-card-presentation.ts'),
  ]);

  assert.ok(client, 'shared client source must exist');
  assert.ok(webShell, 'Phase 2 requires packages/ui/src/web-shell.ts');
  assert.ok(webBinding, 'Phase 2 requires packages/ui/src/web-game-binding.ts');
  assert.ok(webCards, 'Phase 2 requires packages/ui/src/web-card-presentation.ts');

  assert.ok(client.includes('mountWebShell'));
  assert.ok(client.includes('updateWebPresentation'));
  assert.ok(client.includes('function updatePresentation(): void'));
  assert.ok(client.includes('updatePresentation();'));
  assert.equal(client.split('mountWebPresentationController(').length - 1, 1);

  assert.equal(webShell.split('root.innerHTML =').length - 1, 1, 'Web shell may be mounted once');
  assert.equal(webBinding.includes('root.innerHTML ='), false);
  assert.equal(webBinding.includes('replaceChildren('), false);
  assert.equal(webBinding.includes('@cribbit/game-engine'), false);
  assert.equal(webBinding.includes('playable-slice'), false);
  assert.equal(webBinding.includes('isLegalPlay('), false);
  assert.equal(webCards.includes('@cribbit/game-engine'), false);
  assert.equal(webCards.includes('playable-slice'), false);
  assert.equal(webCards.includes('isLegalPlay('), false);
});
