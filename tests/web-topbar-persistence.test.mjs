import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Phase 7 keeps the Web topbar mounted and gives is-game-view ownership only to navigation', async () => {
  const [clientSource, shellSource, controllerSource, uiIndexSource, stylesSource] = await Promise.all([
    readFile(new URL('../packages/client-app/src/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../packages/ui/src/web-shell.ts', import.meta.url), 'utf8'),
    readFile(new URL('../packages/ui/src/web-controller.ts', import.meta.url), 'utf8'),
    readFile(new URL('../packages/ui/src/index.ts', import.meta.url), 'utf8'),
    readFile(new URL('../packages/ui/src/styles.ts', import.meta.url), 'utf8'),
  ]);

  assert.equal(clientSource.split('mountWebShell(root)').length - 1, 1, 'Web donor shell/header mounts once');

  const updateStart = clientSource.indexOf('function updatePresentation(): void');
  const telegramStart = clientSource.indexOf('function renderTelegram(): void', updateStart);
  assert.notEqual(updateStart, -1, 'Web presentation updater must exist');
  assert.notEqual(telegramStart, -1, 'Telegram renderer boundary must exist');
  const updatePresentation = clientSource.slice(updateStart, telegramStart);
  assert.equal(
    updatePresentation.includes('setWebShellView('),
    false,
    'gameplay/API/poll projection updates must not change Web navigation or is-game-view',
  );

  assert.equal(
    shellSource.includes("body.classList.toggle('is-game-view'"),
    false,
    'Web shell setup must not own navigation state',
  );
  assert.equal(
    uiIndexSource.includes('ownsGameViewClass'),
    false,
    'game-table mount/unmount must not own is-game-view',
  );
  assert.equal(
    uiIndexSource.includes("body.classList.add('is-game-view')"),
    false,
    'game renderer must not add is-game-view',
  );
  assert.equal(
    uiIndexSource.includes("body.classList.remove('is-game-view')"),
    false,
    'game renderer must not remove is-game-view',
  );

  assert.ok(
    controllerSource.includes("body.classList.toggle('is-game-view', next === 'game')"),
    'navigation controller must own is-game-view transitions',
  );

  const adapterStart = stylesSource.indexOf('const CLEAN_BINDING_ADAPTER_CSS');
  assert.notEqual(adapterStart, -1, 'CLEAN adapter CSS must exist');
  const adapterCss = stylesSource.slice(adapterStart);
  assert.ok(
    adapterCss.includes('.app-header{height:var(--header-h);min-height:var(--header-h)}'),
    'CLEAN adapter must lock global header height',
  );
  assert.ok(
    adapterCss.includes('.app-header__inner{height:var(--header-h);min-height:var(--header-h)}'),
    'CLEAN adapter must lock inner header height',
  );

  const webStyleList = stylesSource.indexOf('export const WEB_GAME_TABLE_STYLES');
  const donorCssEntry = stylesSource.indexOf('OLD_PACKAGES_UI_SRC_STYLES_CSS', webStyleList);
  const adapterEntry = stylesSource.indexOf('CLEAN_BINDING_ADAPTER_CSS', webStyleList);
  assert.ok(donorCssEntry !== -1 && adapterEntry > donorCssEntry, 'CLEAN header adapter must load after donor CSS');
});
