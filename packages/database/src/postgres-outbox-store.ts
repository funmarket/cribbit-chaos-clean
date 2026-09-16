import {
  validateCanonicalState,
  type CanonicalGameState
} from '@cribbit/game-engine';
import type { Pool, PoolClient } from 'pg';

export interface DatabaseOutboxClaim {
  readonly outboxId: string;
  readonly sessionId: string;
  readonly acceptedRevision: number;
  readonly leaseToken: string;
}

export interface DatabaseOutboxProjectionSource {
  readonly state: CanonicalGameState;
  readonly playerIds: readonly string[];
}

export interface DatabaseOutboxStore {
  claimNext(input: {
    readonly leaseToken: string;
    readonly leaseDurationMs: number;
  }): Promise<DatabaseOutboxClaim | null>;
  loadProjectionSource(sessionId: string): Promise<DatabaseOutboxProjectionSource>;
  markPublished(input: {
    readonly outboxId: string;
    readonly leaseToken: string;
  }): Promise<void>;
  releaseClaim(input: {
    readonly outboxId: string;
    readonly leaseToken: string;
  }): Promise<void>;
}

interface OutboxRow {
  readonly outbox_id: string | number;
  readonly session_id: string;
  readonly accepted_revision: string | number;
  readonly audience: unknown;
  readonly payload: unknown;
}

interface SessionRow {
  readonly canonical_state: CanonicalGameState;
  readonly revision: string | number;
}

interface MembershipRow {
  readonly player_id: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateCommittedRevisionSignal(row: OutboxRow): void {
  if (!isRecord(row.audience) || row.audience.kind !== 'session') {
    throw new Error(`Unsupported outbox signal audience for row ${row.outbox_id}`);
  }
  if (
    !isRecord(row.payload) ||
    row.payload.kind !== 'SESSION_REVISION_COMMITTED' ||
    row.payload.sessionId !== row.session_id ||
    !Number.isSafeInteger(row.payload.revision) ||
    row.payload.revision !== Number(row.accepted_revision)
  ) {
    throw new Error(`Malformed outbox signal for row ${row.outbox_id}`);
  }
}

async function claimNextWithClient(
  client: PoolClient,
  leaseToken: string,
  leaseDurationMs: number
): Promise<DatabaseOutboxClaim | null> {
  await client.query('begin');
  try {
    const candidate = await client.query<OutboxRow>(
      `select outbox_id, session_id, accepted_revision, audience, payload
         from game_outbox
        where published_at is null
          and (lease_expires_at is null or lease_expires_at <= now())
        order by outbox_id
        for update skip locked
        limit 1`
    );

    if (candidate.rowCount !== 1) {
      await client.query('commit');
      return null;
    }

    const row = candidate.rows[0];
    validateCommittedRevisionSignal(row);

    const leased = await client.query(
      `update game_outbox
          set lease_token = $1,
              lease_expires_at = now() + ($2::double precision * interval '1 millisecond')
        where outbox_id = $3
          and published_at is null`,
      [leaseToken, leaseDurationMs, row.outbox_id]
    );
    if (leased.rowCount !== 1) {
      throw new Error(`Outbox lease acquisition lost row ${row.outbox_id}`);
    }

    await client.query('commit');
    return {
      outboxId: String(row.outbox_id),
      sessionId: row.session_id,
      acceptedRevision: Number(row.accepted_revision),
      leaseToken
    };
  } catch (error) {
    try {
      await client.query('rollback');
    } catch {
      // Preserve the original storage error.
    }
    throw error;
  }
}

export function createPostgresOutboxStore(pool: Pool): DatabaseOutboxStore {
  return {
    async claimNext({ leaseToken, leaseDurationMs }) {
      if (leaseToken.length === 0) {
        throw new Error('Outbox lease token must not be empty');
      }
      if (!Number.isInteger(leaseDurationMs) || leaseDurationMs <= 0) {
        throw new Error('Outbox lease duration must be a positive integer number of milliseconds');
      }

      const client = await pool.connect();
      try {
        return await claimNextWithClient(client, leaseToken, leaseDurationMs);
      } finally {
        client.release();
      }
    },

    async loadProjectionSource(sessionId) {
      const sessionResult = await pool.query<SessionRow>(
        `select canonical_state, revision
           from game_sessions
          where session_id = $1`,
        [sessionId]
      );
      if (sessionResult.rowCount !== 1) {
        throw new Error(`Outbox projection session ${sessionId} does not exist`);
      }

      const row = sessionResult.rows[0];
      const state = row.canonical_state;
      validateCanonicalState(state);
      if (state.revision !== Number(row.revision)) {
        throw new Error('Outbox projection source revision does not match canonical session revision');
      }

      const membershipResult = await pool.query<MembershipRow>(
        `select player_id
           from game_session_memberships
          where session_id = $1`,
        [sessionId]
      );
      const memberIds = new Set(membershipResult.rows.map((membership) => membership.player_id));
      for (const playerId of memberIds) {
        if (!state.players.some((player) => player.playerId === playerId)) {
          throw new Error(`Session membership ${playerId} is absent from canonical state`);
        }
      }

      return {
        state: structuredClone(state),
        playerIds: state.players
          .map((player) => player.playerId)
          .filter((playerId) => memberIds.has(playerId))
      };
    },

    async markPublished({ outboxId, leaseToken }) {
      const result = await pool.query(
        `update game_outbox
            set published_at = now(),
                lease_token = null,
                lease_expires_at = null
          where outbox_id = $1
            and published_at is null
            and lease_token = $2
            and lease_expires_at > now()`,
        [outboxId, leaseToken]
      );
      if (result.rowCount !== 1) {
        throw new Error(`Outbox publish lease is not owned for row ${outboxId}`);
      }
    },

    async releaseClaim({ outboxId, leaseToken }) {
      const result = await pool.query(
        `update game_outbox
            set lease_token = null,
                lease_expires_at = null
          where outbox_id = $1
            and published_at is null
            and lease_token = $2`,
        [outboxId, leaseToken]
      );
      if (result.rowCount !== 1) {
        throw new Error(`Outbox release lease is not owned for row ${outboxId}`);
      }
    }
  };
}
