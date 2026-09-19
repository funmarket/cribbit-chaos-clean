import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixturePreview } from '../packages/client-app/src/fixture-preview.ts';
import { createPresentationState, renderGameTable } from '../packages/ui/src/game-table.ts';

test('fixture projection renders players, hand, controls and current turn', () => {
  const preview = createFixturePreview();
  const state = createPresentationState();
  const html = renderGameTable(preview.projection, state);
  assert.match(html, /Night Squad/);
  assert.match(html, /Maya/);
  assert.match(html, /Rami/);
  assert.match(html, /data-current-turn="true"/);
  assert.match(html, /PASS/);
  assert.match(html, /REWIND/);
  assert.match(html, /NOPE/);
  assert.match(html, /DRAW/);
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

test('special-effect shell opens and closes without changing projection', () => {
  const preview = createFixturePreview();
  const before = JSON.stringify(preview.projection);
  const open = createPresentationState({ openEffect: 'Truth' });
  const closed = createPresentationState({ openEffect: null });
  assert.match(renderGameTable(preview.projection, open), /special-effect-sheet is-open/);
  assert.doesNotMatch(renderGameTable(preview.projection, closed), /special-effect-sheet is-open/);
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
  for (const label of ['PASS','REWIND','NOPE','DRAW','PLAY']) assert.match(html, new RegExp(`>${label}<`));
});

test('P7A playable parity keeps party-table board, player strip and hand rail visible', async () => {
  const { GAME_TABLE_STYLES } = await import('../packages/ui/src/styles.ts');
  const html = renderGameTable(createFixturePreview().projection, createPresentationState());

  assert.match(html, /class="[^"]*tg-board[^"]*"/);
  assert.match(html, /class="[^"]*tg-board__piles[^"]*"/);
  assert.match(html, /class="[^"]*tg-player-strip[^"]*"/);
  assert.match(html, /class="[^"]*tg-player-rail[^"]*"/);
  assert.match(html, /class="[^"]*tg-hand-rail[^"]*"/);

  assert.match(GAME_TABLE_STYLES, /\.tg-board__piles/);
  assert.match(GAME_TABLE_STYLES, /\.tg-player-rail/);
  assert.doesNotMatch(GAME_TABLE_STYLES, /\.game-rail--left\{display:none\}/);
  assert.match(GAME_TABLE_STYLES, /\.tg-hand-rail\s*\{[^}]*overflow-x:\s*auto/);
});

test('P7A card faces render original CHAOS-133 image assets, not text-only placeholders', async () => {
  const { GAME_TABLE_STYLES } = await import('../packages/ui/src/styles.ts');
  const html = renderGameTable(createFixturePreview().projection, createPresentationState());

  assert.match(html, /<img[^>]+class="game-card__art"[^>]+src="\/assets\/CHAOS-133-V1\/cards\//);
  assert.match(html, /alt="[^"]+ card"/);
  assert.match(GAME_TABLE_STYLES, /\.game-card__art/);
  assert.match(GAME_TABLE_STYLES, /object-fit:contain/);
});

test('P7A setup and lobby screens inject shared CHAOS styles before rendering', async () => {
  const clientSource = await import('node:fs/promises').then(fs => fs.readFile(new URL('../packages/client-app/src/index.ts', import.meta.url), 'utf8'));
  assert.match(clientSource, /import \{[^}]*ensureCribbitStyles[^}]*renderCribbitHome[^}]*renderCribbitLobby/);
  assert.match(clientSource, /function render\(\): void \{\s*ensureCribbitStyles\(\);/);
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
