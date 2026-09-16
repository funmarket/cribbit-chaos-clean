import type { CommandServiceResult, GameCommandPayload } from '@cribbit/contracts';
import type { PlayerGameProjection } from '@cribbit/game-engine';

import type { GameCommandService } from './command-service.ts';

export interface DeadlineJobClaim {
  readonly deadlineId: string;
  readonly sessionId: string;
  readonly principalId: string;
  readonly commandId: string;
  readonly commandFingerprint: string;
  readonly expectedRevision: number;
  readonly command: GameCommandPayload;
  readonly leaseToken: string;
}

export interface DeadlineStorePort {
  claimDue(input: {
    readonly leaseToken: string;
    readonly leaseDurationMs: number;
  }): Promise<DeadlineJobClaim | null>;
  markCompleted(input: {
    readonly deadlineId: string;
    readonly leaseToken: string;
  }): Promise<void>;
  releaseClaim(input: {
    readonly deadlineId: string;
    readonly leaseToken: string;
  }): Promise<void>;
}

export interface DeadlineWorker {
  runOnce(): Promise<
    | { readonly status: 'idle' }
    | {
        readonly status: 'completed';
        readonly deadlineId: string;
        readonly commandResult: CommandServiceResult<PlayerGameProjection>;
      }
  >;
}

export function createDeadlineWorker(input: {
  readonly store: DeadlineStorePort;
  readonly commandService: GameCommandService;
  readonly trustedAuthInputFactory: (job: DeadlineJobClaim) => unknown;
  readonly leaseTokenFactory: () => string;
  readonly leaseDurationMs?: number;
}): DeadlineWorker {
  const leaseDurationMs = input.leaseDurationMs ?? 30_000;
  if (!Number.isInteger(leaseDurationMs) || leaseDurationMs <= 0) {
    throw new Error('Deadline lease duration must be a positive integer number of milliseconds');
  }

  return {
    async runOnce() {
      const leaseToken = input.leaseTokenFactory();
      const job = await input.store.claimDue({ leaseToken, leaseDurationMs });
      if (job === null) return { status: 'idle' };
      if (job.leaseToken !== leaseToken) {
        throw new Error('Deadline store returned a claim for a different lease token');
      }

      try {
        const commandResult = await input.commandService.execute({
          authInput: input.trustedAuthInputFactory(job),
          envelope: {
            commandId: job.commandId,
            commandFingerprint: job.commandFingerprint,
            sessionId: job.sessionId,
            expectedRevision: job.expectedRevision,
            command: structuredClone(job.command)
          }
        });

        await input.store.markCompleted({
          deadlineId: job.deadlineId,
          leaseToken: job.leaseToken
        });

        return {
          status: 'completed',
          deadlineId: job.deadlineId,
          commandResult
        };
      } catch (error) {
        try {
          await input.store.releaseClaim({
            deadlineId: job.deadlineId,
            leaseToken: job.leaseToken
          });
        } catch {
          // Preserve the command/storage failure; an expired lease remains retryable.
        }
        throw error;
      }
    }
  };
}
