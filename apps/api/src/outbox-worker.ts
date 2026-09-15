import { randomUUID } from 'node:crypto';

import {
  projectGameState,
  type CanonicalGameState,
  type ProjectionRecipient,
  type RecipientGameProjection
} from '@cribbit/game-engine';

export interface OutboxClaim {
  readonly outboxId: string;
  readonly sessionId: string;
  readonly acceptedRevision: number;
  readonly leaseToken: string;
}

export interface OutboxProjectionSource {
  readonly state: CanonicalGameState;
  readonly playerIds: readonly string[];
}

export interface OutboxStorePort {
  claimNext(input: {
    readonly leaseToken: string;
    readonly leaseDurationMs: number;
  }): Promise<OutboxClaim | null>;
  loadProjectionSource(sessionId: string): Promise<OutboxProjectionSource>;
  markPublished(input: {
    readonly outboxId: string;
    readonly leaseToken: string;
  }): Promise<void>;
  releaseClaim(input: {
    readonly outboxId: string;
    readonly leaseToken: string;
  }): Promise<void>;
}

export interface RealtimePublication {
  readonly publicationId: string;
  readonly sessionId: string;
  readonly recipient: ProjectionRecipient;
  readonly projection: RecipientGameProjection;
}

export interface RealtimePublisherPort {
  publish(publication: RealtimePublication): Promise<void>;
}

export interface OutboxWorker {
  runOnce(): Promise<
    | { readonly status: 'idle' }
    | {
        readonly status: 'published';
        readonly outboxId: string;
        readonly publicationCount: number;
      }
  >;
}

function publicationId(outboxId: string, recipient: ProjectionRecipient): string {
  return recipient.kind === 'public'
    ? `outbox:${outboxId}:public`
    : `outbox:${outboxId}:player:${recipient.playerId}`;
}

export function createOutboxWorker(input: {
  readonly store: OutboxStorePort;
  readonly publisher: RealtimePublisherPort;
  readonly leaseTokenFactory?: () => string;
  readonly leaseDurationMs?: number;
}): OutboxWorker {
  const leaseTokenFactory = input.leaseTokenFactory ?? randomUUID;
  const leaseDurationMs = input.leaseDurationMs ?? 30_000;

  if (!Number.isInteger(leaseDurationMs) || leaseDurationMs <= 0) {
    throw new Error('Outbox lease duration must be a positive integer number of milliseconds');
  }

  return {
    async runOnce() {
      const leaseToken = leaseTokenFactory();
      const claim = await input.store.claimNext({ leaseToken, leaseDurationMs });
      if (claim === null) return { status: 'idle' };
      if (claim.leaseToken !== leaseToken) {
        throw new Error('Outbox store returned a claim for a different lease token');
      }

      try {
        const source = await input.store.loadProjectionSource(claim.sessionId);
        if (source.state.revision < claim.acceptedRevision) {
          throw new Error(
            `Projection source revision ${source.state.revision} is older than committed outbox revision ${claim.acceptedRevision}`
          );
        }

        const recipients: ProjectionRecipient[] = [{ kind: 'public' }];
        for (const playerId of new Set(source.playerIds)) {
          recipients.push({ kind: 'player', playerId });
        }

        for (const recipient of recipients) {
          await input.publisher.publish({
            publicationId: publicationId(claim.outboxId, recipient),
            sessionId: claim.sessionId,
            recipient,
            projection: projectGameState(source.state, recipient)
          });
        }

        await input.store.markPublished({
          outboxId: claim.outboxId,
          leaseToken: claim.leaseToken
        });

        return {
          status: 'published',
          outboxId: claim.outboxId,
          publicationCount: recipients.length
        };
      } catch (error) {
        try {
          await input.store.releaseClaim({
            outboxId: claim.outboxId,
            leaseToken: claim.leaseToken
          });
        } catch {
          // Preserve the publication/storage failure; an expired lease remains retryable.
        }
        throw error;
      }
    }
  };
}
