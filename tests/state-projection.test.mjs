import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { projectGameState } from '../packages/game-engine/src/projection.ts';

function canonicalState() {
  return {
    gameId: 'game-1',
    revision: 12,
    players: [
      { playerId: 'p1', seat: 0 },
      { playerId: 'p2', seat: 1 },
      { playerId: 'p3', seat: 2 }
    ],
    zones: {
      drawPile: ['draw-secret-1', 'draw-secret-2'],
      discardPile: ['discard-1', 'discard-2'],
      hands: {
        p1: ['p1-card-1'],
        p2: ['p2-private-card'],
        p3: ['p3-card-1', 'p3-card-2']
      }
    },
    rootFlow: {
      rootFlowId: 'root-1',
      stage: {
        stageId: 'stage-1',
        eligibleParticipantIds: ['p1', 'p2', 'p3'],
        acceptedSubmissions: [
          { submissionId: 'submission-p1', participantId: 'p1', payload: { answer: 'alpha-secret' } },
          { submissionId: 'submission-p2', participantId: 'p2', payload: { choice: 'beta-secret' } }
        ],
        pendingParticipantIds: ['p3'],
        deadlineId: 'deadline-stage',
        completionPolicyRef: 'future-rule-owned-policy'
      },
      continuationIds: ['continuation-1']
    },
    continuations: [
      {
        continuationId: 'continuation-1',
        rootFlowId: 'root-1',
        suspendedStageId: 'stage-0',
        resumeStageId: 'stage-2'
      }
    ],
    persistentEffects: [
      {
        effectId: 'effect-public',
        effectKind: 'future-public-effect',
        sourceCardInstanceId: 'card-public',
        subjectPlayerIds: ['p2'],
        deadlineId: null,
        audience: { kind: 'public' }
      },
      {
        effectId: 'effect-p1-private',
        effectKind: 'future-private-effect',
        sourceCardInstanceId: 'card-private',
        subjectPlayerIds: ['p1'],
        deadlineId: 'deadline-private',
        audience: { kind: 'players', playerIds: ['p1'] }
      }
    ],
    deadlines: [
      {
        deadlineId: 'deadline-public',
        dueAtEpochMs: 2000000,
        owner: { kind: 'root-flow', refId: 'root-1' },
        audience: { kind: 'public' }
      },
      {
        deadlineId: 'deadline-private',
        dueAtEpochMs: 2100000,
        owner: { kind: 'persistent-effect', refId: 'effect-p1-private' },
        audience: { kind: 'players', playerIds: ['p1'] }
      }
    ],
    winnerBoundary: {
      status: 'blocked',
      blockerRefs: ['root-1', 'continuation-1']
    }
  };
}

test('P3 public projection hides private hands and sealed payloads', () => {
  const projection = projectGameState(canonicalState(), { kind: 'public' });
  assert.equal('private' in projection, false);
  assert.deepEqual(projection.players.map((player) => player.handCount), [1, 1, 2]);
  assert.deepEqual(projection.persistentEffects.map((effect) => effect.effectId), ['effect-public']);
  assert.deepEqual(projection.deadlines.map((deadline) => deadline.deadlineId), ['deadline-public']);

  const serialized = JSON.stringify(projection);
  assert.doesNotMatch(serialized, /p1-card-1|p2-private-card|p3-card-1|p3-card-2/);
  assert.doesNotMatch(serialized, /draw-secret-1|draw-secret-2/);
  assert.doesNotMatch(serialized, /alpha-secret|beta-secret|submission-p1|submission-p2/);
});

test('P3 player projection reveals only recipient-owned private state', () => {
  const p1 = projectGameState(canonicalState(), { kind: 'player', playerId: 'p1' });
  const p3 = projectGameState(canonicalState(), { kind: 'player', playerId: 'p3' });

  assert.deepEqual(p1.private.hand, ['p1-card-1']);
  assert.deepEqual(p1.private.acceptedSealedSubmissionIds, ['submission-p1']);
  assert.deepEqual(p1.persistentEffects.map((effect) => effect.effectId), ['effect-public', 'effect-p1-private']);
  assert.deepEqual(p1.deadlines.map((deadline) => deadline.deadlineId), ['deadline-public', 'deadline-private']);

  assert.deepEqual(p3.private.hand, ['p3-card-1', 'p3-card-2']);
  assert.deepEqual(p3.private.pendingStageIds, ['stage-1']);
  assert.deepEqual(p3.private.acceptedSealedSubmissionIds, []);
  assert.deepEqual(p3.persistentEffects.map((effect) => effect.effectId), ['effect-public']);

  assert.doesNotMatch(JSON.stringify(p1), /p2-private-card|p3-card-1|p3-card-2|alpha-secret|beta-secret/);
  assert.doesNotMatch(JSON.stringify(p3), /p1-card-1|p2-private-card|alpha-secret|beta-secret|submission-p1|submission-p2/);
});

test('P3 projections detach arrays from canonical state', () => {
  const state = canonicalState();
  const projection = projectGameState(state, { kind: 'player', playerId: 'p1' });

  projection.private.hand.push('projection-only-card');
  projection.persistentEffects[0].subjectPlayerIds.push('projection-subject');

  assert.deepEqual(state.zones.hands.p1, ['p1-card-1']);
  assert.deepEqual(state.persistentEffects[0].subjectPlayerIds, ['p2']);
});

test('P3 projection fails closed when canonical player has no hand', () => {
  const state = canonicalState();
  delete state.zones.hands.p2;
  assert.throws(() => projectGameState(state, { kind: 'public' }), /missing a hand for player p2/);
});

test('P3 winner boundary is represented, not evaluated', () => {
  const ready = { ...canonicalState(), winnerBoundary: { status: 'ready' } };
  const declared = { ...canonicalState(), winnerBoundary: { status: 'declared', winnerPlayerId: 'p2' } };

  assert.deepEqual(projectGameState(ready, { kind: 'public' }).winnerBoundary, { status: 'ready' });
  assert.deepEqual(projectGameState(declared, { kind: 'public' }).winnerBoundary, {
    status: 'declared',
    winnerPlayerId: 'p2'
  });
});

test('P3 state and projection modules contain no transport, browser, Telegram, or persistence capability', async () => {
  const combined = `${await readFile('packages/game-engine/src/state.ts', 'utf8')}\n${await readFile('packages/game-engine/src/projection.ts', 'utf8')}`;
  assert.doesNotMatch(combined, /\bfetch\s*\(|\bWebSocket\b|\bXMLHttpRequest\b/);
  assert.doesNotMatch(combined, /\b(?:localStorage|sessionStorage|indexedDB)\b/);
  assert.doesNotMatch(combined, /Telegram|initData|prisma|postgres|database/i);
});
