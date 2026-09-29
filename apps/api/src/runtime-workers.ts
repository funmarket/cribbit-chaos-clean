import type { Pool } from 'pg';
import { createPostgresCommandTransactionPort, createPostgresDeadlineStore } from '@cribbit/database';
import { resolvePlayableEngineCommand } from '@cribbit/game-engine';
import { createGameCommandService } from './command-service.ts';
import { createDeadlineWorker, type DeadlineWorker } from './deadline-worker.ts';

export interface RuntimeWorkerHandle {
  readonly worker: DeadlineWorker;
  readonly stop: () => void;
}

export function startDeadlineWorker(input: {
  readonly pool: Pool;
  readonly intervalMs?: number;
  readonly onError?: (error: unknown) => void;
}): RuntimeWorkerHandle {
  const intervalMs = input.intervalMs ?? 1_000;
  if (!Number.isInteger(intervalMs) || intervalMs <= 0) throw new Error('Worker interval must be a positive integer number of milliseconds');

  const commandService = createGameCommandService({
    auth: {
      async authenticate(authInput) {
        if (!authInput || typeof authInput !== 'object' || typeof (authInput as { principalId?: unknown }).principalId !== 'string') return null;
        return { principalId: (authInput as { principalId: string }).principalId };
      }
    },
    transactions: createPostgresCommandTransactionPort(input.pool),
    resolver: {
      async resolve(command) {
        return resolvePlayableEngineCommand(command);
      }
    }
  });
  const worker = createDeadlineWorker({
    store: createPostgresDeadlineStore(input.pool),
    commandService,
    trustedAuthInputFactory: (job) => ({ principalId: job.principalId }),
    leaseTokenFactory: () => `deadline-worker:${process.pid}:${Date.now()}:${Math.random()}`
  });

  let running = true;
  const tick = async (): Promise<void> => {
    if (!running) return;
    try { await worker.runOnce(); }
    catch (error) { input.onError?.(error); }
  };
  const timer = setInterval(() => { void tick(); }, intervalMs);
  timer.unref?.();
  void tick();
  return { worker, stop: () => { running = false; clearInterval(timer); } };
}
