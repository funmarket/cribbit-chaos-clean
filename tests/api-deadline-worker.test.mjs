import test from 'node:test';
import assert from 'node:assert/strict';

import * as api from '../apps/api/src/main.ts';

function deadlineJob(overrides = {}) {
  return {
    deadlineId: 'deadline-1',
    sessionId: 'session-1',
    principalId: 'principal-1',
    commandId: 'cmd-deadline-1',
    commandFingerprint: 'fp-deadline-1',
    expectedRevision: 12,
    command: { kind: 'EXPLICIT_SCHEDULED_COMMAND', source: 'approved-rule' },
    leaseToken: 'lease-1',
    ...overrides
  };
}

function harness(options = {}) {
  const calls = { claims: [], auth: [], executes: [], completed: [], released: [] };
  const claim = options.claim === undefined ? deadlineJob() : options.claim;
  const commandResult = options.commandResult ?? {
    status: 'rejected',
    code: 'STALE_REVISION',
    currentRevision: 13
  };

  const store = {
    async claimDue(input) {
      calls.claims.push(structuredClone(input));
      return claim === null ? null : structuredClone(claim);
    },
    async markCompleted(input) {
      calls.completed.push(structuredClone(input));
    },
    async releaseClaim(input) {
      calls.released.push(structuredClone(input));
    }
  };

  const commandService = {
    async execute(request) {
      calls.executes.push(structuredClone(request));
      if (options.executeError) throw options.executeError;
      return structuredClone(commandResult);
    }
  };

  const worker = api.createDeadlineWorker({
    store,
    commandService,
    trustedAuthInputFactory(job) {
      calls.auth.push(structuredClone(job));
      return { kind: 'trusted-deadline', principalId: job.principalId };
    },
    leaseTokenFactory: () => 'lease-1',
    leaseDurationMs: 30_000
  });

  return { worker, calls, commandResult };
}

test('P6 deadline worker executes an explicitly stored command through the same GameCommandService path', async () => {
  assert.equal(typeof api.createDeadlineWorker, 'function');
  const { worker, calls, commandResult } = harness();

  const result = await worker.runOnce();

  assert.deepEqual(result, {
    status: 'completed',
    deadlineId: 'deadline-1',
    commandResult
  });
  assert.deepEqual(calls.claims, [{ leaseToken: 'lease-1', leaseDurationMs: 30_000 }]);
  assert.equal(calls.auth.length, 1);
  assert.deepEqual(calls.executes, [{
    authInput: { kind: 'trusted-deadline', principalId: 'principal-1' },
    envelope: {
      commandId: 'cmd-deadline-1',
      commandFingerprint: 'fp-deadline-1',
      sessionId: 'session-1',
      expectedRevision: 12,
      command: { kind: 'EXPLICIT_SCHEDULED_COMMAND', source: 'approved-rule' }
    }
  }]);
  assert.deepEqual(calls.completed, [{ deadlineId: 'deadline-1', leaseToken: 'lease-1' }]);
  assert.deepEqual(calls.released, []);
});

test('P6 deadline delivery is complete after a deterministic command-service rejection and does not invent a retry rule', async () => {
  assert.equal(typeof api.createDeadlineWorker, 'function');
  const { worker, calls } = harness({
    commandResult: { status: 'rejected', code: 'ENGINE_REJECTED', reason: 'rule rejected' }
  });

  const result = await worker.runOnce();

  assert.equal(result.status, 'completed');
  assert.equal(result.commandResult.status, 'rejected');
  assert.deepEqual(calls.completed, [{ deadlineId: 'deadline-1', leaseToken: 'lease-1' }]);
  assert.deepEqual(calls.released, []);
});

test('P6 deadline worker releases its lease on execution failure so the same stable command can retry', async () => {
  assert.equal(typeof api.createDeadlineWorker, 'function');
  const { worker, calls } = harness({ executeError: new Error('temporary database failure') });

  await assert.rejects(worker.runOnce(), /temporary database failure/);

  assert.equal(calls.executes.length, 1);
  assert.equal(calls.executes[0].envelope.commandId, 'cmd-deadline-1');
  assert.deepEqual(calls.completed, []);
  assert.deepEqual(calls.released, [{ deadlineId: 'deadline-1', leaseToken: 'lease-1' }]);
});

test('P6 deadline worker is idle when no explicitly scheduled command job is due', async () => {
  assert.equal(typeof api.createDeadlineWorker, 'function');
  const { worker, calls } = harness({ claim: null });

  assert.deepEqual(await worker.runOnce(), { status: 'idle' });
  assert.deepEqual(calls.auth, []);
  assert.deepEqual(calls.executes, []);
  assert.deepEqual(calls.completed, []);
  assert.deepEqual(calls.released, []);
});
