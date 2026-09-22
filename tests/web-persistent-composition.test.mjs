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

  assert.match(client, /mountWebShell/);
  assert.match(client, /updateWebPresentation/);
  assert.match(client, /function updatePresentation(): void/);
  assert.match(
    client,
    /const setState = (next: Partial<AppState>): void => {s*state = { ...state, ...next };s*updatePresentation();s*};/,
  );
  assert.equal((client.match(/mountWebPresentationController(/g) || []).length, 1);

  assert.equal((webShell.match(/root.innerHTMLs*=/g) || []).length, 1, 'Web shell may be mounted once');
  assert.doesNotMatch(webBinding, /root.innerHTMLs*=|replaceChildren(/);
  assert.doesNotMatch(webBinding, /@cribbit/game-engine|playable-slice|isLegalPlay(/);
  assert.doesNotMatch(webCards, /@cribbit/game-engine|playable-slice|isLegalPlay(/);
});
