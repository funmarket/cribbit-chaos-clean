import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixturePreview } from '../packages/client-app/src/fixture-preview.ts';
import { updateWebPresentation } from '../packages/ui/src/web-game-binding.ts';

function node() {
  return {
    textContent: '',
    innerHTML: '',
    disabled: false,
    hidden: false,
    attributes: new Map(),
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
  };
}

function createRoot() {
  const selectors = [
    '#revisionLabel',
    '#modeBadge',
    '#phaseTrack',
    '#gameRoomName',
    '#gameRoomMeta',
    '#currentTurnName',
    '#timerValue',
    '#stageChip',
    '#boardPhaseLabel',
    '#activeChallengeTitle',
    '#activeChallengeCopy',
    '#playerList',
    '#discardSlot',
    '#drawPileCount',
    '#handCount',
    '#handScroll',
    '#statsGrid',
    '#champPanel',
    '#directionLabel',
    '#phoneRevision',
    '#authorityCopy',
    '#startGameButton',
    '[data-action="join-room"]',
    '[data-clean-start-game]',
  ];
  const nodes = new Map(selectors.map(selector => [selector, node()]));
  const drawControls = [node(), node()];
  const queried = [];

  return {
    nodes,
    drawControls,
    queried,
    querySelector(selector) {
      queried.push(selector);
      return nodes.get(selector) ?? null;
    },
    querySelectorAll(selector) {
      queried.push(selector);
      if (selector === '[data-draw-control]') return drawControls;
      return [];
    },
  };
}

test('Phase 3 binds the full server projection into donor game nodes without rebuilding the shell', () => {
  const root = createRoot();
  const projection = createFixturePreview().projection;

  updateWebPresentation(root, { projection, busy: false, error: null });

  assert.equal(root.nodes.get('#revisionLabel').textContent, 'Server rev 0');
  assert.equal(root.nodes.get('#modeBadge').textContent, 'Party');
  assert.ok(root.nodes.get('#phaseTrack').innerHTML.includes('active'));
  assert.equal(root.nodes.get('#gameRoomName').textContent, 'Night Squad');
  assert.ok(root.nodes.get('#gameRoomMeta').textContent.includes('4 players'));
  assert.equal(root.nodes.get('#currentTurnName').textContent, 'You');
  assert.equal(root.nodes.get('#timerValue').textContent, '—');
  assert.equal(root.nodes.get('#stageChip').textContent, 'active');
  assert.equal(root.nodes.get('#boardPhaseLabel').textContent, 'Play / Draw');
  assert.equal(root.nodes.get('#activeChallengeTitle').textContent, 'Play or draw');
  assert.ok(root.nodes.get('#activeChallengeCopy').textContent.includes('Match the active color'));
  assert.ok(root.nodes.get('#playerList').innerHTML.includes('player-row is-current is-you'));
  assert.ok(root.nodes.get('#playerList').innerHTML.includes('Maya'));
  assert.ok(root.nodes.get('#discardSlot').innerHTML.includes('discard-cyan-7'));
  assert.equal(root.nodes.get('#drawPileCount').textContent, '79 left');
  assert.equal(root.nodes.get('#handCount').textContent, '7 cards');
  assert.ok(root.nodes.get('#handScroll').innerHTML.includes('c-lime-7'));
  assert.ok(root.nodes.get('#handScroll').innerHTML.includes('data-legal="true"'));
  assert.ok(root.nodes.get('#handScroll').innerHTML.includes('c-orange-2'));
  assert.ok(root.nodes.get('#handScroll').innerHTML.includes('data-legal="false"'));
  assert.ok(root.nodes.get('#statsGrid').innerHTML.includes('Revision'));
  assert.ok(root.nodes.get('#statsGrid').innerHTML.includes('79'));
  assert.equal(root.nodes.get('#champPanel').innerHTML, '');
  assert.equal(root.nodes.get('#directionLabel').textContent, 'Clockwise');
  assert.equal(root.drawControls.every(control => control.disabled === false), true);

  for (const forbidden of ['header', 'nav', '#cardDialog', '#flowDialog', '[data-view="rooms"]', '[data-view="board"]']) {
    assert.equal(root.queried.includes(forbidden), false, `Phase 3 binder must not touch ${forbidden}`);
  }
});

test('Phase 3 winner presentation comes only from the server projection', () => {
  const root = createRoot();
  const projection = createFixturePreview('resolved').projection;

  updateWebPresentation(root, { projection, busy: false, error: null });

  assert.ok(root.nodes.get('#champPanel').innerHTML.includes('WINNER'));
  assert.ok(root.nodes.get('#champPanel').innerHTML.includes('Maya'));
  assert.equal(root.drawControls.every(control => control.disabled === true), true);
});
