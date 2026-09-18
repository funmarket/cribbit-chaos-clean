import test from 'node:test';
import assert from 'node:assert/strict';

import { createGameCommandService } from '../apps/api/src/command-service.ts';

function canonicalState(revision = 7) {
  return {
    gameId: 'game-p5',
    revision,
    players: [
      { playerId: 'p1', seat: 0, displayName: 'One' },
      { playerId: 'p2', seat: 1, displayName: 'Two' }
    ],
    zones: {
      drawPile: ['card-a', 'card-b'],
      discardPile: ['card-c'],
      hands: { p1: ['card-d'], p2: ['card-e'] }
    },
    rootFlow: null,
    continuations: [],
    persistentEffects: [],
    deadlines: [],
    winnerBoundary: { status: 'ready' },
    lifecycle: { phase: 'active', hostPlayerId: 'p1' },
    turn: { currentPlayerId: 'p1', direction: 'clockwise', activeColor: null, round: 1 }
  };
}

function acceptedDefinition() {
  return {
    ruleRefs: ['P5-TEST-RULE'],
    cardConservation: 'preserve',
    apply({ state }) {
      return { status: 'accepted', state, effects: [] };
    }
  };
}

function rejectedDefinition() {
  return {
    ruleRefs: ['P5-TEST-RULE'],
    cardConservation: 'preserve',
    apply() {
      return { status: 'rejected', reason: 'NOT_LEGAL_NOW' };
    }
  };
}

function envelope(overrides = {}) {
  return {
    commandId: 'cmd-1',
    commandFingerprint: 'fp-1',
    sessionId: 'session-1',
    expectedRevision: 7,
    command: { kind: 'TEST_COMMAND' },
    ...overrides
  };
}

function harness(options = {}) {
  const calls = { transactions: 0, membership: 0, receipts: 0, state: 0, commits: 0, resolves: 0 };
  const state = options.state ?? canonicalState();
  let committed = null;

  const tx = {
    async loadMembership(principalId) {
      calls.membership += 1;
      return options.membership === undefined ? { playerId: 'p1' } : options.membership;
    },
    async findAcceptedReceipt(commandId) {
      calls.receipts += 1;
      return options.receipt ?? null;
    },
    async loadCanonicalState() {
      calls.state += 1;
      return structuredClone(state);
    },
    async commitAccepted(input) {
      calls.commits += 1;
      committed = structuredClone(input);
    }
  };

  const ports = {
    auth: {
      async authenticate(authInput) {
        return options.principal === undefined ? { principalId: 'principal-1' } : options.principal;
      }
    },
    transactions: {
      async withSession(sessionId, operation) {
        calls.transactions += 1;
        if (options.sessionMissing) return null;
        return operation(tx);
      }
    },
    resolver: {
      async resolve(input) {
        calls.resolves += 1;
        if (options.onResolve) options.onResolve(input);
        return {
          authoritativeInputs: { trusted: true },
          definition: options.definition ?? acceptedDefinition()
        };
      }
    }
  };

  return { service: createGameCommandService(ports), calls, getCommitted: () => committed };
}

test('P5 rejects unauthenticated callers before opening a session transaction', async () => {
  const { service, calls } = harness({ principal: null });
  const result = await service.execute({ authInput: null, envelope: envelope() });
  assert.deepEqual(result, { status: 'rejected', code: 'UNAUTHENTICATED' });
  assert.equal(calls.transactions, 0);
  assert.equal(calls.resolves, 0);
});

test('P5 distinguishes a missing session from a non-member', async () => {
  const missing = harness({ sessionMissing: true });
  assert.deepEqual(
    await missing.service.execute({ authInput: {}, envelope: envelope() }),
    { status: 'rejected', code: 'SESSION_NOT_FOUND' }
  );

  const outsider = harness({ membership: null });
  assert.deepEqual(
    await outsider.service.execute({ authInput: {}, envelope: envelope() }),
    { status: 'rejected', code: 'NOT_SESSION_MEMBER' }
  );
  assert.equal(outsider.calls.resolves, 0);
});

test('P5 derives actor identity from authenticated membership, never payload actor fields', async () => {
  let resolvedActor = null;
  const { service } = harness({
    membership: { playerId: 'p1' },
    onResolve(input) { resolvedActor = input.actorPlayerId; }
  });
  const result = await service.execute({
    authInput: { token: 'server-trusted-input' },
    envelope: envelope({ command: { kind: 'TEST_COMMAND', actorPlayerId: 'p2' } })
  });
  assert.equal(result.status, 'accepted');
  assert.equal(resolvedActor, 'p1');
  assert.equal(result.receipt.actorPlayerId, 'p1');
});

test('P5 rejects stale revision before resolving or running an engine transition', async () => {
  const { service, calls } = harness();
  const result = await service.execute({ authInput: {}, envelope: envelope({ expectedRevision: 6 }) });
  assert.deepEqual(result, {
    status: 'rejected',
    code: 'STALE_REVISION',
    currentRevision: 7
  });
  assert.equal(calls.resolves, 0);
  assert.equal(calls.commits, 0);
});

test('P5 accepted duplicate with same fingerprint returns stored receipt without engine execution', async () => {
  const stored = {
    commandId: 'cmd-1',
    commandFingerprint: 'fp-1',
    sessionId: 'session-1',
    actorPlayerId: 'p1',
    acceptedRevision: 8
  };
  const { service, calls } = harness({ receipt: stored, state: canonicalState(9) });
  const result = await service.execute({ authInput: {}, envelope: envelope({ expectedRevision: 7 }) });
  assert.equal(result.status, 'accepted');
  assert.deepEqual(result.receipt, stored);
  assert.equal(result.projection.revision, 9);
  assert.equal(calls.resolves, 0);
  assert.equal(calls.commits, 0);
});

test('P5 rejects command ID reuse when the accepted receipt fingerprint differs', async () => {
  const stored = {
    commandId: 'cmd-1',
    commandFingerprint: 'different-fingerprint',
    sessionId: 'session-1',
    actorPlayerId: 'p1',
    acceptedRevision: 8
  };
  const { service, calls } = harness({ receipt: stored });
  const result = await service.execute({ authInput: {}, envelope: envelope() });
  assert.deepEqual(result, { status: 'rejected', code: 'COMMAND_ID_CONFLICT' });
  assert.equal(calls.state, 0);
  assert.equal(calls.resolves, 0);
  assert.equal(calls.commits, 0);
});

test('P5 rejects accepted receipt replay by a different authenticated session actor', async () => {
  const stored = {
    commandId: 'cmd-1',
    commandFingerprint: 'fp-1',
    sessionId: 'session-1',
    actorPlayerId: 'p2',
    acceptedRevision: 8
  };
  const { service, calls } = harness({
    receipt: stored,
    membership: { playerId: 'p1' }
  });
  const result = await service.execute({ authInput: {}, envelope: envelope() });
  assert.deepEqual(result, { status: 'rejected', code: 'COMMAND_ID_CONFLICT' });
  assert.equal(calls.state, 0);
  assert.equal(calls.resolves, 0);
  assert.equal(calls.commits, 0);
});

test('P5 rejected engine transition does not create an accepted receipt', async () => {
  const { service, calls } = harness({ definition: rejectedDefinition() });
  const result = await service.execute({ authInput: {}, envelope: envelope() });
  assert.deepEqual(result, {
    status: 'rejected',
    code: 'ENGINE_REJECTED',
    reason: 'NOT_LEGAL_NOW'
  });
  assert.equal(calls.resolves, 1);
  assert.equal(calls.commits, 0);
});

test('P5 accepted transition commits state plus receipt once and returns only the actor projection', async () => {
  const { service, calls, getCommitted } = harness();
  const result = await service.execute({ authInput: {}, envelope: envelope() });
  assert.equal(result.status, 'accepted');
  assert.equal(result.receipt.acceptedRevision, 8);
  assert.equal(result.projection.revision, 8);
  assert.equal(result.projection.source, 'server');
  assert.equal(result.projection.currentPlayer.playerId, 'p1');
  assert.equal(JSON.stringify(result.projection).includes('card-d'), true);
  assert.equal(JSON.stringify(result.projection).includes('card-e'), false);
  assert.equal(calls.resolves, 1);
  assert.equal(calls.commits, 1);
  assert.equal(getCommitted().expectedRevision, 7);
  assert.equal(getCommitted().nextState.revision, 8);
  assert.deepEqual(getCommitted().receipt, result.receipt);
});
