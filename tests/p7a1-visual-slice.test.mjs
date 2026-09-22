import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixturePreview } from '../packages/client-app/src/fixture-preview.ts';
import { createPresentationState, renderCribbitHome, renderCribbitLobby, renderGameTable } from '../packages/ui/src/game-table.ts';

function orderedMarkers(html, markers) {
  let cursor = -1;
  for (const marker of markers) {
    const next = html.indexOf(marker, cursor + 1);
    assert.notEqual(next, -1, `missing marker: ${marker}`);
    assert.ok(next > cursor, `marker out of order: ${marker}`);
    cursor = next;
  }
}

test('fixture projection renders players, hand, controls and current turn', () => {
  const preview = createFixturePreview();
  const state = createPresentationState();
  const html = renderGameTable(preview.projection, state);
  assert.match(html, /Night Squad/);
  assert.match(html, /Maya/);
  assert.match(html, /Rami/);
  assert.match(html, /class="player-row is-current is-you"/);
  assert.match(html, /Pass/);
  assert.match(html, /Rewind/);
  assert.match(html, /Nope Card/);
  assert.match(html, /Draw/);
  assert.match(html, /Your hand/);
});

test('selected card state is presentation-only', () => {
  const preview = createFixturePreview();
  const before = JSON.stringify(preview.projection);
  const firstCard = preview.projection.currentPlayer.hand[0].instanceId;
  const selected = createPresentationState({ selectedCardId: firstCard });
  const html = renderGameTable(preview.projection, selected);
  assert.match(html, new RegExp(`data-card-id="${firstCard}"[^>]*data-selected="true"`));
  assert.equal(JSON.stringify(preview.projection), before);
});

test('old dialog shells remain template-owned without changing projection', () => {
  const preview = createFixturePreview();
  const before = JSON.stringify(preview.projection);
  const open = createPresentationState({ openEffect: 'Truth' });
  const closed = createPresentationState({ openEffect: null });
  assert.match(renderGameTable(preview.projection, open), /id="cardDialog"/);
  assert.match(renderGameTable(preview.projection, closed), /id="flowDialog"/);
  assert.equal(JSON.stringify(preview.projection), before);
});

test('winner/status state renders from projection', () => {
  const preview = createFixturePreview('resolved');
  const html = renderGameTable(preview.projection, createPresentationState());
  assert.match(html, /WINNER/);
  assert.match(html, /Maya/);
  assert.match(html, /Resolved/);
});

test('fixture is deeply frozen and exposes no authoritative transition methods', () => {
  const preview = createFixturePreview();
  assert.equal(Object.isFrozen(preview.projection), true);
  assert.equal(Object.isFrozen(preview.projection.players), true);
  assert.equal(Object.isFrozen(preview.projection.currentPlayer.hand), true);
  assert.deepEqual(Object.keys(preview).sort(), ['projection']);
});

test('mobile CSS preserves the extracted old-app safety rail controls', async () => {
  const { GAME_TABLE_STYLES } = await import('../packages/ui/src/styles.ts');
  assert.match(GAME_TABLE_STYLES, /@media \(max-width: 379px\)/);
  assert.match(GAME_TABLE_STYLES, /\.tg-safety-bar \{\s*display: grid;\s*grid-template-columns: repeat\(4/);
  assert.match(GAME_TABLE_STYLES, /\.cribbit-clean-web-table \.tg-safety-bar,\.cribbit-clean-telegram-table \.tg-safety-bar\{display:grid;grid-template-columns:repeat\(5/);
  const html = renderGameTable(createFixturePreview().projection, createPresentationState(), 'telegram');
  for (const label of ['Pass','Rewind','Draw']) assert.match(html, new RegExp(`>${label}<`));
  assert.doesNotMatch(html, /<nav class="tg-safety-bar"[\s\S]*?>Play</);
});

test('P7A playable parity keeps old Web board, player strip and hand rail visible', async () => {
  const { GAME_TABLE_STYLES } = await import('../packages/ui/src/styles.ts');
  const html = renderGameTable(createFixturePreview().projection, createPresentationState());

  assert.match(html, /id="gameLayout"/);
  assert.match(html, /id="leftRail"/);
  assert.match(html, /class="desktop-gameboard"/);
  assert.match(html, /id="handScroll"/);
  assert.match(html, /class="desktop-safety-bar"/);

  assert.match(GAME_TABLE_STYLES, /\.tg-board__piles/);
  assert.match(GAME_TABLE_STYLES, /\.tg-player-rail/);
  assert.doesNotMatch(GAME_TABLE_STYLES, /\.game-rail--left\{display:none\}/);
  assert.match(GAME_TABLE_STYLES, /\.tg-hand-rail\s*\{[^}]*overflow-x:\s*auto/);
});

test('P7A Web and Telegram card faces keep their donor-specific canonical contracts', async () => {
  const { GAME_TABLE_STYLES } = await import('../packages/ui/src/styles.ts');
  const { renderWebProjectionCard } = await import('../packages/ui/src/web-card-presentation.ts');
  const projection = createFixturePreview().projection;
  const card = projection.currentPlayer.hand[0];

  const webHtml = renderWebProjectionCard(card, true, true);
  assert.match(webHtml, /class="game-card cc-has-canonical-face"/);
  assert.match(webHtml, /<img class="cc-canonical-card-face" src="\/assets\/CHAOS-133-V1\/cards\//);
  assert.match(webHtml, /data-card-id="c-lime-7"/);
  assert.match(webHtml, /data-family="number"/);
  assert.doesNotMatch(webHtml, /game-card__art/);

  const telegramHtml = renderGameTable(projection, createPresentationState(), 'telegram');
  assert.match(telegramHtml, /class="game-card__art"/);
  assert.match(telegramHtml, /src="\/assets\/CHAOS-133-V1\/cards\//);
  assert.match(GAME_TABLE_STYLES, /\.game-card__art/);
  assert.match(GAME_TABLE_STYLES, /object-fit:contain/);
});

test('P7A setup and lobby screens inject shared CHAOS styles before rendering', async () => {
  const clientSource = await import('node:fs/promises').then(fs => fs.readFile(new URL('../packages/client-app/src/index.ts', import.meta.url), 'utf8'));
  assert.match(clientSource, /import \{[^}]*ensureCribbitStyles[^}]*renderCribbitHome[^}]*renderCribbitLobby/);
  assert.match(clientSource, /ensureCribbitStyles\('web'\)/);
  assert.match(clientSource, /function renderTelegram\(\): void \{\s*ensureCribbitStyles\('telegram'\);/);
});

test('P7A full extraction composes exact old UI source files and clean binding adapters', async () => {
  const [{ GAME_TABLE_STYLES }, sourceText, fs] = await Promise.all([
    import('../packages/ui/src/styles.ts'),
    import('../packages/ui/src/old-ui-source/source-text.ts'),
    import('node:fs/promises'),
  ]);
  const manifest = JSON.parse(await fs.readFile(new URL('../packages/ui/src/old-ui-source/manifest.json', import.meta.url), 'utf8'));
  const manifestByPath = new Map(manifest.map(entry => [entry.path, entry]));

  for (const requiredPath of [
    'packages/ui/src/template.html',
    'packages/ui/src/styles.css',
    'packages/ui/src/compact-cards.css',
    'packages/ui/src/draw-pile-card-back.css',
    'apps/web/src/web-game.css',
    'apps/web/src/web-compact.css',
    'apps/web/src/canonical-hero-cards.css',
    'apps/web/src/canonical-board-cards.css',
    'apps/telegram/src/styles/telegram.css',
    'apps/telegram/src/styles/game.css',
    'apps/telegram/src/styles/cards.css',
    'apps/telegram/src/styles/contextual.css',
    'apps/telegram/src/styles/hardening.css',
  ]) {
    assert.equal(manifestByPath.get(requiredPath)?.status, 'copied-verbatim-ui-source', `${requiredPath} is copied as active UI source`);
  }

  for (const requiredReferencePath of [
    'apps/web/src/main.ts',
    'apps/telegram/src/bootstrapTelegram.ts',
    'apps/telegram/src/gameView.ts',
  ]) {
    const entry = manifestByPath.get(requiredReferencePath);
    assert.equal(entry?.status, 'copied-verbatim-inert-reference', `${requiredReferencePath} is copied as inert UI/template reference`);
    assert.match(entry?.stored_as ?? '', /\.source\.txt$/);
  }

  assert.match(GAME_TABLE_STYLES, /--tg-lime: #9cff16/);
  assert.match(GAME_TABLE_STYLES, /\.cc-web-hero/);
  assert.match(GAME_TABLE_STYLES, /\.product-nav/);
  assert.match(GAME_TABLE_STYLES, /\.desktop-gameboard/);
  assert.match(GAME_TABLE_STYLES, /\.tg-room-form/);
  assert.match(GAME_TABLE_STYLES, /\.tg-game-meta/);
  assert.match(GAME_TABLE_STYLES, /Clean-app binding adapters/);
  assert.match(sourceText.OLD_PACKAGES_UI_SRC_TEMPLATE_HTML, /data-nav="board"/);
  assert.doesNotMatch(GAME_TABLE_STYLES, /centered marketing|border-radius:13px 5px 13px 5px/);
});

test('Web shell and live game keep the extracted old template structure active', async () => {
  const { OLD_PACKAGES_UI_SRC_TEMPLATE_HTML } = await import('../packages/ui/src/old-ui-source/source-text.ts');
  const preview = createFixturePreview();
  const homeHtml = renderCribbitHome({ busy: false, error: null, surface: 'web' });
  assert.match(homeHtml, /<a class="button cc-web-create" href="#roomCreation">Create a game<\/a>/);
  assert.match(homeHtml, /id="startGameButton"[^>]*data-action="demo-game"[^>]*>[\s\S]*Start simulated game<\/button>/);
  assert.doesNotMatch(homeHtml, />Create Game<\/button>/);
  const lobbyHtml = renderCribbitLobby(preview.projection, { busy: false, error: null, surface: 'web' });
  assert.match(lobbyHtml, /id="startGameButton"[^>]*data-action="demo-game"[^>]*>[\s\S]*Start simulated game<\/button>/);
  assert.match(lobbyHtml, /data-action="start-game"[^>]*>Start Game<\/button>/);
  const gameHtml = renderGameTable(preview.projection, createPresentationState(), 'web');

  for (const marker of ['data-nav="lobby"', 'data-nav="rooms"', 'data-nav="board"', 'data-nav="library"', 'data-nav="create"', 'data-nav="call"', 'data-nav="lab"', 'id="mobileNavDialog"', 'id="cardDialog"', 'id="flowDialog"', 'id="reconnectDialog"']) {
    assert.match(homeHtml, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `home preserves ${marker}`);
  }
  assert.match(homeHtml, /class="cc-web-hero"/);
  assert.match(homeHtml, /Your friends<br>/);
  assert.match(homeHtml, /cc-web-card-reverse-confession/);
  assert.match(gameHtml, /<section class="view" data-view="lobby"/);
  assert.match(gameHtml, /<section class="view is-active" data-view="game"/);
  orderedMarkers(gameHtml, ['id="leftRail"', 'id="gameStage"', 'class="desktop-gameboard"', 'id="discardSlot"', 'id="drawPileVisual"', 'id="handScroll"', 'class="desktop-safety-bar"', 'id="rightRail"', 'id="activityDock"']);
  assert.match(lobbyHtml, /data-view="lobby"/);
  assert.match(lobbyHtml, /data-view="game"/);
  assert.match(OLD_PACKAGES_UI_SRC_TEMPLATE_HTML, /id="drawPileVisual"/);
  assert.doesNotMatch(gameHtml, /cribbit-clean-web-table|Old UI surface; clean API commands underneath|Railway authority/);
});

test('Telegram setup and game actively hydrate extracted old presentation templates', async () => {
  const [{ OLD_TELEGRAM_ROOM_CREATION_TEMPLATE, OLD_TELEGRAM_GAME_TEMPLATE }, fs] = await Promise.all([
    import('../packages/ui/src/old-ui-source/telegram-templates.ts'),
    import('node:fs/promises'),
  ]);
  const rendererSource = await fs.readFile(new URL('../packages/ui/src/game-table.ts', import.meta.url), 'utf8');
  const preview = createFixturePreview();
  const setupHtml = renderCribbitHome({ busy: false, error: null, surface: 'telegram' });
  const gameHtml = renderGameTable(preview.projection, createPresentationState(), 'telegram');

  assert.match(rendererSource, /OLD_TELEGRAM_ROOM_CREATION_TEMPLATE/);
  assert.match(rendererSource, /OLD_TELEGRAM_GAME_TEMPLATE/);
  assert.doesNotMatch(
    rendererSource.slice(rendererSource.indexOf('function telegramRoomCreation'), rendererSource.indexOf('function telegramGameTemplate')),
    /<main class="tg-app tg-room-page"/,
  );
  assert.doesNotMatch(
    rendererSource.slice(rendererSource.indexOf('function telegramGameTemplate'), rendererSource.indexOf('export function GameTable')),
    /<main class="tg-app tg-game-page"/,
  );

  orderedMarkers(OLD_TELEGRAM_ROOM_CREATION_TEMPLATE, ['tg-app tg-room-page', 'tg-app__header', 'tg-room-hero', 'tg-room-form', 'tg-setup-card', 'tg-grid-2', 'tg-select', 'tg-mode-grid', 'tg-count-grid', 'tg-source-grid', 'tg-toggle-row', 'tg-switch', 'tg-join-row', 'tg-action-status', 'tg-primary-actions']);
  orderedMarkers(OLD_TELEGRAM_GAME_TEMPLATE, ['tg-app tg-game-page', 'tg-game-header', 'tg-live-strip', 'tg-game-meta', 'tg-timer-ring', 'tg-board__piles', 'tg-board-zone--discard', 'tg-board-zone--draw', 'tg-player-strip', '{{ACTIVE_STATE}}', 'tg-hand', 'tg-safety-bar', 'tg-action-status']);

  orderedMarkers(setupHtml, ['tg-app tg-room-page', 'tg-app__header', 'tg-room-hero', 'tg-room-form', 'tg-setup-card', 'tg-grid-2', 'tg-select', 'tg-mode-grid', 'tg-mode-card', 'tg-count-grid', 'tg-count-chip', 'tg-source-grid', 'tg-source-card', 'tg-toggle-row', 'tg-switch', 'tg-join-row', 'tg-action-status', 'tg-primary-actions']);
  orderedMarkers(gameHtml, ['tg-app tg-game-page', 'tg-game-header', 'tg-live-strip', 'tg-game-meta', 'tg-timer-ring', 'tg-board__piles', 'tg-board-zone--discard', 'tg-board-zone--draw', 'tg-player-strip', 'tg-hand', 'tg-safety-bar', 'tg-action-status']);
  assert.match(gameHtml, /<small>SEC<\/small>/);
  assert.match(gameHtml, /data-card-kind=/);
  assert.match(gameHtml, /data-legal=/);
  assert.match(gameHtml, /game-card__legal-badge[^>]*>LEGAL<\/span>/);
  assert.match(gameHtml, /tg-shared-card-back--board/);
  assert.doesNotMatch(gameHtml, /<small>REV<\/small>|cribbit-clean-telegram-table|Projection readback only/);
});


test('Web presentation controller is actively exported and wired without old gameplay authority', async () => {
  const fs = await import('node:fs/promises');
  const [uiIndex, clientSource, controllerSource] = await Promise.all([
    fs.readFile(new URL('../packages/ui/src/index.ts', import.meta.url), 'utf8'),
    fs.readFile(new URL('../packages/client-app/src/index.ts', import.meta.url), 'utf8'),
    fs.readFile(new URL('../packages/ui/src/web-controller.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(uiIndex, /export \* from '\.\/web-controller\.ts';/);
  assert.match(clientSource, /mountWebPresentationController/);
  assert.match(clientSource, /platform\.kind === 'web'/);
  assert.match(controllerSource, /closest<HTMLElement>\('\[data-nav\]'\)/);
  assert.match(controllerSource, /open-mobile-nav/);
  assert.match(controllerSource, /open-global-search/);
  assert.match(controllerSource, /open-notifications/);
  assert.match(controllerSource, /open-profile/);
  assert.match(controllerSource, /data-board-tab/);
  assert.match(controllerSource, /data-library-tab/);
  assert.match(controllerSource, /data-create-destination/);
  assert.match(controllerSource, /data-room-category/);
  assert.doesNotMatch(controllerSource, /legacy-runtime|canonical-game-runtime|@cribbit\/game-engine|playable-slice/);
});

test('Web controller keeps persistent prompt/library mutations disabled until clean server APIs own them', async () => {
  const fs = await import('node:fs/promises');
  const controllerSource = await fs.readFile(new URL('../packages/ui/src/web-controller.ts', import.meta.url), 'utf8');

  assert.match(controllerSource, /Server-backed library persistence is not connected yet/);
  assert.match(controllerSource, /Server-backed room-pool persistence is not connected yet/);
  assert.match(controllerSource, /persistent prompt creation will only be enabled through the clean server API/);
  assert.doesNotMatch(controllerSource, /localStorage|sessionStorage/);
});


test('Web room creation CTA preserves the old anchor and is wired to the setup section', async () => {
  const fs = await import('node:fs/promises');
  const clientSource = await fs.readFile(new URL('../packages/client-app/src/index.ts', import.meta.url), 'utf8');
  assert.match(clientSource, /a\.cc-web-create\[href="#roomCreation"\]/);
  assert.match(clientSource, /#roomCreation/);
  assert.match(clientSource, /scrollIntoView\(\{ block: 'start', behavior: 'smooth' \}\)/);
});

test('Start simulated game uses the clean server API and the normal command handlers', async () => {
  const fs = await import('node:fs/promises');
  const clientSource = await fs.readFile(new URL('../packages/client-app/src/index.ts', import.meta.url), 'utf8');

  assert.match(clientSource, /api\.createSimulation\(\)/);
  assert.match(clientSource, /function bindWebCommands\(\): \(\) => void/);
  assert.match(clientSource, /action === 'demo-game'[\s\S]*startSimulation\(\)/);
  assert.match(clientSource, /action === 'start-game'[\s\S]*startGame\(\)/);
  assert.doesNotMatch(clientSource, /simulationProjection|createFixturePreview\(\)\.projection/);
  assert.match(clientSource, /mountGameTable\(target, state\.projection, \{ onDraw: drawCard, onPlay: playCard \}, 'telegram'\)/);
  assert.match(clientSource, /updateWebPresentation\(root,/);
  assert.doesNotMatch(clientSource, /legacy-runtime|canonical-game-runtime|@cribbit\/game-engine/);
});

test('Web view selection survives clean-client updates without remounting the shell', async () => {
  const fs = await import('node:fs/promises');
  const [clientSource, controllerSource] = await Promise.all([
    fs.readFile(new URL('../packages/client-app/src/index.ts', import.meta.url), 'utf8'),
    fs.readFile(new URL('../packages/ui/src/web-controller.ts', import.meta.url), 'utf8'),
  ]);

  assert.match(controllerSource, /initialView\?: WebProductView/);
  assert.match(controllerSource, /onViewChange\?: \(view: WebProductView\) => void/);
  assert.match(controllerSource, /options\.onViewChange\?\.\(next\)/);
  assert.match(controllerSource, /showView\(state\.view\);/);

  assert.match(clientSource, /let webView: WebProductView = 'lobby';/);
  assert.equal((clientSource.match(/initialView: webView/g) || []).length, 1);
  assert.equal((clientSource.match(/mountWebPresentationController\(/g) || []).length, 1);
  assert.doesNotMatch(clientSource, /setWebShellView\(root, webView\)/);
  assert.match(clientSource, /onViewChange: \(nextView\) => \{[\s\S]*webView = nextView;[\s\S]*updatePresentation\(\);[\s\S]*\}/);
  assert.match(clientSource, /window\.setInterval\(\(\) => \{ void refreshProjection\(\); \}, 1500\)/);
  assert.match(clientSource, /state\.projection\?\.revision === projection\.revision && state\.error === null/);
});

test('Telegram setup controls have an active clean presentation controller', async () => {
  const fs = await import('node:fs/promises');
  const [{ createTelegramPresentationDraft }, clientSource, controllerSource] = await Promise.all([
    import('../packages/ui/src/telegram-controller.ts'),
    fs.readFile(new URL('../packages/client-app/src/index.ts', import.meta.url), 'utf8'),
    fs.readFile(new URL('../packages/ui/src/telegram-controller.ts', import.meta.url), 'utf8'),
  ]);

  assert.deepEqual(createTelegramPresentationDraft('Tester'), {
    profileName: 'Tester',
    roomName: 'Night Squad',
    world: 'clean',
    ceiling: 3,
    mode: 'party',
    playerCount: 5,
    sources: { original: true, community: true, house: true, live: true },
    qaHand: true,
  });

  for (const marker of [
    '[data-mode]',
    '[data-player-count]',
    '[data-source]',
    '[data-world]',
    '[data-ceiling]',
    '[data-qa-hand]',
    '[data-join-code]',
    '[data-tg-back]',
  ]) {
    const escaped = marker.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
    assert.match(controllerSource, new RegExp(escaped));
  }

  assert.match(controllerSource, /Fast head-to-head pacing\./);
  assert.match(controllerSource, /Balanced teaching format\./);
  assert.match(controllerSource, /Primary social format\./);
  assert.match(controllerSource, /Shorter timers, more anti-downtime\./);
  assert.match(controllerSource, /event\.key !== 'Enter'/);
  assert.match(controllerSource, /data-tg-menu/);
  assert.match(controllerSource, /data-game-info/);
  assert.match(controllerSource, /showPopup/);
  assert.match(controllerSource, /data-tg-menu-fallback/);
  const templateSource = await fs.readFile(new URL('../packages/ui/src/old-ui-source/telegram-templates.ts', import.meta.url), 'utf8');
  assert.match(templateSource, /aria-label="Menu" data-tg-menu>•••<\/button>/);
  assert.doesNotMatch(templateSource, /Menu unavailable|aria-disabled="true"[^>]*data-tg-menu/);
  assert.match(clientSource, /mountTelegramPresentationController\(root, telegramDraft,/);
  assert.match(clientSource, /mountTelegramTopMenuController/);
  assert.match(clientSource, /data-action="demo-game"/);
  assert.doesNotMatch(controllerSource, /legacy-runtime|canonical-game-runtime|@cribbit\/game-engine|backendGame|simulation\.ts/);
  assert.match(controllerSource, /Start Simulation/);
  assert.match(controllerSource, /Room Setup/);
  assert.match(controllerSource, /Account: Reconnect/);
  assert.match(controllerSource, /Close App/);
});
