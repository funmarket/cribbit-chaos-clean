import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Phase 4 Web runtime uses one-time donor DOM setup instead of the string-transformation renderer', async () => {
  const [clientSource, shellSource, legacyRendererSource] = await Promise.all([
    readFile(new URL('../packages/client-app/src/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../packages/ui/src/web-shell.ts', import.meta.url), 'utf8'),
    readFile(new URL('../packages/ui/src/game-table.ts', import.meta.url), 'utf8'),
  ]);

  assert.ok(legacyRendererSource.includes('activateWebView('));
  assert.ok(legacyRendererSource.includes('applyOldWebMainPresentation('));
  assert.ok(legacyRendererSource.includes('hydrateWebTemplate('));

  assert.match(shellSource, /function mountCribbitChaosHero\(root: HTMLElement\): void/);
  assert.equal(shellSource.split('mountCribbitChaosHero(root);').length - 1, 1);
  assert.equal(shellSource.includes('activateWebView('), false);
  assert.equal(shellSource.includes('applyOldWebMainPresentation('), false);
  assert.equal(shellSource.includes('hydrateWebTemplate('), false);
  assert.equal(shellSource.includes("from './game-table.ts'"), false);

  const webStart = clientSource.indexOf("if (platform.kind === 'web') {");
  const webEnd = clientSource.indexOf('  } else {', webStart);
  assert.notEqual(webStart, -1, 'Web bootstrap block must exist');
  assert.notEqual(webEnd, -1, 'Web bootstrap block must terminate');
  const webBootstrap = clientSource.slice(webStart, webEnd);

  for (const forbidden of ['renderCribbitHome(', 'renderCribbitLobby(', 'mountGameTable(', 'activateWebView(', 'applyOldWebMainPresentation(', 'hydrateWebTemplate(']) {
    assert.equal(webBootstrap.includes(forbidden), false, `Web bootstrap must not depend on ${forbidden}`);
  }

  assert.ok(webBootstrap.includes('mountWebShell(root)'));
  assert.ok(webBootstrap.includes('updatePresentation()'));
});
