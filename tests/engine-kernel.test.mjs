import test from 'node:test';
import assert from 'node:assert/strict';

import { runEngineTransition } from '../packages/game-engine/src/kernel.ts';

function canonicalState() {
  return {
    gameId: 'game-p4',
    revision: 7,
    players: [
      { playerId: 'p1', seat: 0 },
      { playerId: 'p2', seat: 1 }
    ],
    zones: {
      drawPile: ['card-a', 'card-b'],
      discardPile: ['card-c'],
      hands: {
        p1: ['card-d'],
        p2: ['card-e']
      }
    },
    rootFlow: null,
    continuations: [],
    persistentEffects: [],
    deadlines: [],
    winnerBoundary: { status: 'ready' }
  };
}

test('P4 kernel applies an accepted transition without mutating input and owns the revision increment', () => {
  const initial = canonicalState();
  const before = structuredClone(initial);
  const definition = {
    ruleRefs: ['RULE-PROVENANCE'],
    cardConservation: 'preserve',
    apply({ state }) {
      const [card, ...remaining] = state.zones.drawPile;
      return {
        status: 'accepted',
        state: {
          ...state,
          zones: {
            ...state.zones,
            drawPile: remaining,
            discardPile: [...state.zones.discardPile, card]
          }
        },
        effects: [{ kind: 'test-card-moved', card }]
      };
    }
  };

  const result = runEngineTransition({
    state: initial,
    command: { kind: 'TEST_MOVE_CARD' },
    authoritativeInputs: { nonce: 'fixed-input' },
    definition
  });

  assert.equal(result.status, 'accepted');
  assert.equal(result.state.revision, 8);
  assert.deepEqual(result.state.zones.drawPile, ['card-b']);
  assert.deepEqual(result.state.zones.discardPile, ['card-c', 'card-a']);
  assert.deepEqual(result.effects, [{ kind: 'test-card-moved', card: 'card-a' }]);
  assert.deepEqual(result.ruleRefs, ['RULE-PROVENANCE']);
  assert.deepEqual(initial, before);
});
