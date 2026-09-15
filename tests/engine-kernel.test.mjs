import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  replayEngineTransitions,
  runEngineTransition,
  validateCanonicalState
} from '../packages/game-engine/src/kernel.ts';

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

function moveTopDrawDefinition() {
  return {
    ruleRefs: ['RULE-PROVENANCE'],
    cardConservation: 'preserve',
    apply({ state, authoritativeInputs }) {
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
        effects: [{ kind: 'test-card-moved', card, nonce: authoritativeInputs.nonce }]
      };
    }
  };
}

test('P4 kernel applies an accepted transition without mutating caller inputs and owns the revision increment', () => {
  const initial = canonicalState();
  const command = { kind: 'TEST_MOVE_CARD', nested: { value: 'keep' } };
  const authoritativeInputs = { nonce: 'fixed-input', nested: { value: 'keep' } };
  const before = structuredClone({ initial, command, authoritativeInputs });

  const result = runEngineTransition({
    state: initial,
    command,
    authoritativeInputs,
    definition: moveTopDrawDefinition()
  });

  assert.equal(result.status, 'accepted');
  assert.equal(result.state.revision, 8);
  assert.deepEqual(result.state.zones.drawPile, ['card-b']);
  assert.deepEqual(result.state.zones.discardPile, ['card-c', 'card-a']);
  assert.deepEqual(result.effects, [
    { kind: 'test-card-moved', card: 'card-a', nonce: 'fixed-input' }
  ]);
  assert.deepEqual(result.ruleRefs, ['RULE-PROVENANCE']);
  assert.deepEqual({ initial, command, authoritativeInputs }, before);
});

test('P4 rejected transitions preserve canonical state and revision', () => {
  const initial = canonicalState();
  const result = runEngineTransition({
    state: initial,
    command: { kind: 'TEST_REJECT' },
    authoritativeInputs: {},
    definition: {
      ruleRefs: ['RULE-PROVENANCE'],
      cardConservation: 'preserve',
      apply() {
        return { status: 'rejected', reason: 'ILLEGAL_TRANSITION' };
      }
    }
  });

  assert.deepEqual(result, {
    status: 'rejected',
    state: initial,
    reason: 'ILLEGAL_TRANSITION',
    ruleRefs: ['RULE-PROVENANCE']
  });
});

test('P4 replay is deterministic for the same initial state, commands, and authoritative inputs', () => {
  const initial = canonicalState();
  const steps = [
    {
      command: { kind: 'TEST_MOVE_CARD' },
      authoritativeInputs: { nonce: 'one' },
      definition: moveTopDrawDefinition()
    },
    {
      command: { kind: 'TEST_MOVE_CARD' },
      authoritativeInputs: { nonce: 'two' },
      definition: moveTopDrawDefinition()
    }
  ];

  const first = replayEngineTransitions({ state: initial, steps });
  const second = replayEngineTransitions({ state: initial, steps });

  assert.deepEqual(first, second);
  assert.equal(first.state.revision, 9);
  assert.deepEqual(first.state.zones.drawPile, []);
  assert.deepEqual(first.transitions.map((entry) => entry.effects[0].nonce), ['one', 'two']);
  assert.deepEqual(initial, canonicalState());
});

test('P4 conservation gate rejects lost, duplicated, or substituted physical cards', () => {
  const initial = canonicalState();
  assert.throws(
    () => runEngineTransition({
      state: initial,
      command: { kind: 'TEST_LOSE_CARD' },
      authoritativeInputs: {},
      definition: {
        ruleRefs: ['RULE-DECK'],
        cardConservation: 'preserve',
        apply({ state }) {
          return {
            status: 'accepted',
            state: {
              ...state,
              zones: { ...state.zones, drawPile: state.zones.drawPile.slice(1) }
            },
            effects: []
          };
        }
      }
    }),
    /card conservation/
  );

  const duplicate = canonicalState();
  duplicate.zones.hands.p2.push('card-a');
  assert.throws(() => validateCanonicalState(duplicate), /duplicate physical card/);
});

test('P4 canonical invariant validation rejects broken root-flow and continuation structure', () => {
  const state = canonicalState();
  state.rootFlow = {
    rootFlowId: 'root-1',
    stage: {
      stageId: 'stage-1',
      eligibleParticipantIds: ['p1', 'missing-player'],
      acceptedSubmissions: [],
      pendingParticipantIds: ['missing-player'],
      deadlineId: null,
      completionPolicyRef: 'RULE-DUEL'
    },
    continuationIds: ['continuation-1']
  };
  state.continuations = [];

  assert.throws(() => validateCanonicalState(state), /unknown player missing-player/);

  const orphan = canonicalState();
  orphan.continuations = [{
    continuationId: 'continuation-1',
    rootFlowId: 'root-1',
    suspendedStageId: 'stage-0',
    resumeStageId: 'stage-2'
  }];
  assert.throws(() => validateCanonicalState(orphan), /continuation without an active root flow/);
});

test('P4 winner ordering rejects declaration while required root-flow resolution remains active', () => {
  const state = canonicalState();
  state.rootFlow = {
    rootFlowId: 'root-1',
    stage: {
      stageId: 'stage-1',
      eligibleParticipantIds: ['p1'],
      acceptedSubmissions: [],
      pendingParticipantIds: ['p1'],
      deadlineId: null,
      completionPolicyRef: 'RULE-CONTINUATION'
    },
    continuationIds: []
  };
  state.winnerBoundary = { status: 'declared', winnerPlayerId: 'p1' };

  assert.throws(() => validateCanonicalState(state), /winner cannot be declared while a root flow is active/);
});

test('P4 executable transition definitions require explicit approved provenance references', () => {
  assert.throws(
    () => runEngineTransition({
      state: canonicalState(),
      command: { kind: 'TEST_NO_PROVENANCE' },
      authoritativeInputs: {},
      definition: {
        ruleRefs: [],
        cardConservation: 'preserve',
        apply({ state }) {
          return { status: 'accepted', state, effects: [] };
        }
      }
    }),
    /rule provenance/
  );
});

test('P4 kernel source has no transport, persistence, platform, clock, or random authority', async () => {
  const source = await readFile('packages/game-engine/src/kernel.ts', 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(|\bWebSocket\b|\bXMLHttpRequest\b/);
  assert.doesNotMatch(source, /Telegram|initData|prisma|postgres|database/i);
  assert.doesNotMatch(source, /\b(?:localStorage|sessionStorage|indexedDB)\b/);
  assert.doesNotMatch(source, /Math\.random|Date\.now|crypto\.random/i);
});
