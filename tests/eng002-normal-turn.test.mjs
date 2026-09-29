import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalDeckInstanceIds,
  createWaitingGameState,
  isLegalCardPlay,
  projectGameView,
  resolvePlayableEngineCommand,
  runEngineTransition,
  startPlayableGame
} from '../packages/game-engine/src/index.ts';

function activeState(overrides = {}) {
  return {
    gameId: 'eng002-game',
    revision: 4,
    players: [
      { playerId: 'p1', seat: 0, displayName: 'Ada' },
      { playerId: 'p2', seat: 1, displayName: 'Ben' }
    ],
    zones: {
      drawPile: ['number_cyan_5_01'],
      discardPile: ['number_lime_1_01'],
      hands: { p1: ['number_lime_2_01', 'skip_01'], p2: [] },
      ...(overrides.zones ?? {})
    },
    rootFlow: null,
    continuations: [],
    persistentEffects: [],
    deadlines: [],
    winnerBoundary: { status: 'ready' },
    lifecycle: { phase: 'active', hostPlayerId: 'p1' },
    turn: { currentPlayerId: 'p1', direction: 'clockwise', activeColor: 'lime', round: 1 },
    ...overrides
  };
}

test('ENG-002 opening setup may deal a Special and never auto-triggers it', () => {
  const waiting = createWaitingGameState({ sessionId: 'opening-special', hostPlayerId: 'p1', hostDisplayName: 'Ada' });
  const joined = {
    ...waiting,
    players: [...waiting.players, { playerId: 'p2', seat: 1, displayName: 'Ben' }],
    zones: { ...waiting.zones, hands: { ...waiting.zones.hands, p2: [] } }
  };
  const deck = canonicalDeckInstanceIds().filter((id) => id !== 'skip_01');
  deck.unshift('skip_01');
  const started = startPlayableGame({ state: joined, shuffledDeck: deck });
  assert.equal(started.status, 'accepted');
  assert.equal(started.state.zones.hands.p1.includes('skip_01'), true);
  assert.equal(started.state.rootFlow, null);
  assert.equal(started.state.lifecycle?.phase, 'active');
});

test('ENG-002 permits a canonical Special over a regular Play pile top', () => {
  const state = activeState();
  assert.equal(isLegalCardPlay(state, 'p1', 'skip_01'), true);
  const projection = projectGameView(state, 'p1');
  assert.equal(projection.availableActions.playableCardIds.includes('skip_01'), true);
});

test('ENG-002 blocks direct Special stacking after a preceding Special', () => {
  const state = activeState({
    zones: {
      drawPile: ['number_cyan_5_01'],
      discardPile: ['number_lime_1_01', 'skip_01'],
      hands: { p1: ['reverse_01'], p2: [] }
    }
  });
  assert.equal(isLegalCardPlay(state, 'p1', 'reverse_01'), false);
});

test('ENG-002 accepts a Special at the engine boundary without inventing its family resolution', () => {
  const state = activeState({ zones: { drawPile: ['number_cyan_5_01'], discardPile: ['number_lime_1_01'], hands: { p1: ['skip_01'], p2: [] } } });
  const command = { kind: 'PLAY_CARD', cardInstanceId: 'skip_01' };
  const transition = runEngineTransition({
    state,
    command,
    ...resolvePlayableEngineCommand({ actorPlayerId: 'p1', command })
  });
  assert.equal(transition.status, 'accepted');
  assert.deepEqual(transition.state.zones.hands.p1, []);
  assert.equal(transition.state.zones.discardPile.at(-1), 'skip_01');
  assert.equal(transition.state.rootFlow?.stage.completionPolicyRef, 'SPECIAL_RESOLUTION:skip');
  assert.equal(transition.state.winnerBoundary.status, 'ready');
});

test('ENG-002 keeps voluntary Draw available despite a legal hand play and ends the turn', () => {
  const state = activeState();
  const projection = projectGameView(state, 'p1');
  assert.equal(projection.availableActions.canDraw, true);
  const command = { kind: 'DRAW_CARD' };
  const transition = runEngineTransition({
    state,
    command,
    ...resolvePlayableEngineCommand({ actorPlayerId: 'p1', command })
  });
  assert.equal(transition.status, 'accepted');
  assert.deepEqual(transition.state.zones.hands.p1, ['number_lime_2_01', 'skip_01', 'number_cyan_5_01']);
  assert.equal(transition.state.turn?.currentPlayerId, 'p2');
  assert.equal(projectGameView(transition.state, 'p1').availableActions.playableCardIds.includes('number_cyan_5_01'), false);
});
