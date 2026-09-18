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

test('mobile CSS preserves the old-app safety rail controls', async () => {
  const { GAME_TABLE_STYLES } = await import('../packages/ui/src/styles.ts');
  assert.match(GAME_TABLE_STYLES, /@media\(max-width:379px\)/);
  assert.match(GAME_TABLE_STYLES, /\.tg-safety-bar\{display:grid;grid-template-columns:repeat\(5/);
  const html = renderGameTable(createFixturePreview().projection, createPresentationState());
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
  assert.match(GAME_TABLE_STYLES, /\.tg-hand-rail\{[^}]*overflow-x:auto/);
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

test('P7A old-app reference restore styles setup as Cribbit app shell', async () => {
  const { GAME_TABLE_STYLES } = await import('../packages/ui/src/styles.ts');

  assert.match(GAME_TABLE_STYLES, /--tg-lime:#9cff16/);
  assert.match(GAME_TABLE_STYLES, /--tg-purple:#b34cff/);
  assert.match(GAME_TABLE_STYLES, /\.cribbit-app button\{appearance:none/);
  assert.match(GAME_TABLE_STYLES, /\.tg-room-form\{display:grid;gap:10px\}/);
  assert.match(GAME_TABLE_STYLES, /\.tg-setup-card,\.tg-game-meta,\.tg-player-strip,\.tg-hand/);
  assert.match(GAME_TABLE_STYLES, /\.tg-live-strip\{display:flex/);
  assert.match(GAME_TABLE_STYLES, /@media\(prefers-color-scheme:light\)\{:root\{color-scheme:dark\}/);
  assert.doesNotMatch(GAME_TABLE_STYLES, /centered marketing|border-radius:13px 5px 13px 5px/);
});
