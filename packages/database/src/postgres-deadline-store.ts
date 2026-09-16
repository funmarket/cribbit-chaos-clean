import type { GameCommandPayload } from '@cribbit/contracts';
import type { Pool, PoolClient } from 'pg';

export interface DatabaseDeadlineJobClaim {
  readonly deadlineId: string;
  readonly sessionId: string;
  readonly principalId: string;
  readonly commandId: string;
  readonly commandFingerprint: string;
  readonly expectedRevision: number;
  readonly command: GameCommandPayload;
  readonly leaseToken: string;
}

export interface DatabaseDeadlineStore {
  claimDue(input: {
    readonly leaseToken: string;
    readonly leaseDurationMs: number;
  }): Promise<DatabaseDeadlineJobClaim | null>;
  markCompleted(input: {
    readonly deadlineId: string;
    readonly leaseToken: string;
  }): Promise<void>;
  releaseClaim(input: {
    readonly deadlineId: string;
    readonly leaseToken: string;
  }): Promise<void>;
}

interface DeadlineRow {
  readonly deadline_id: string;
  readonly session_id: string;
  readonly principal_id: string;
  readonly command_id: string;
  readonly command_fingerprint: string;
  readonly expected_revision: string | number;
  readonly command_payload: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateDeadlineRow(row: DeadlineRow): GameCommandPayload {
  const expectedRevision = Number(row.expected_revision);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    throw new Error(`Invalid expected revision for deadline ${row.deadline_id}`);
  }
  if (
    !isRecord(row.command_payload) ||
    typeof row.command_payload.kind !== 'string' ||
    row.command_payload.kind.length === 0
  ) {
    throw new Error(`Invalid deadline command payload for deadline ${row.deadline_id}`);
  }
  for (const [label, value] of [
    ['principal', row.principal_id],
    ['command', row.command_id],
    ['command fingerprint', row.command_fingerprint]
  ] as const) {
    if (value.length === 0) {
      throw new Error(`Invalid ${label} identifier for deadline ${row.deadline_id}`);
    }
  }
  return structuredClone(row.command_payload) as GameCommandPayload;
}

async function claimDueWithClient(
  client: PoolClient,
  leaseToken: string,
  leaseDurationMs: number
): Promise<DatabaseDeadlineJobClaim | null> {
  await client.query('begin');
  try {
    const result = await client.query<DeadlineRow>(
      `select deadline_id, session_id, principal_id, command_id, command_fingerprint,
              expected_revision, command_payload
         from game_deadline_jobs
        where due_at <= now()
          and status in ('pending', 'leased')
          and (
            status = 'pending'
            or (lease_expires_at is not null and lease_expires_at <= now())
          )
        order by due_at, deadline_id
        for update skip locked
        limit 1`
    );
    if (result.rowCount !== 1) {
      await client.query('commit');
      return null;
    }

    const row = result.rows[0];
    const command = validateDeadlineRow(row);
    const leased = await client.query(
      `update game_deadline_jobs
          set status = 'leased',
              lease_token = $1,
              lease_expires_at = now() + ($2::double precision * interval '1 millisecond')
        where deadline_id = $3
          and status in ('pending', 'leased')`,
      [leaseToken, leaseDurationMs, row.deadline_id]
    );
    if (leased.rowCount !== 1) {
      throw new Error(`Deadline lease acquisition lost job ${row.deadline_id}`);
    }

    await client.query('commit');
    return {
      deadlineId: row.deadline_id,
      sessionId: row.session_id,
      principalId: row.principal_id,
      commandId: row.command_id,
      commandFingerprint: row.command_fingerprint,
      expectedRevision: Number(row.expected_revision),
      command,
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

export function createPostgresDeadlineStore(pool: Pool): DatabaseDeadlineStore {
  return {
    async claimDue({ leaseToken, leaseDurationMs }) {
      if (leaseToken.length === 0) {
        throw new Error('Deadline lease token must not be empty');
      }
      if (!Number.isInteger(leaseDurationMs) || leaseDurationMs <= 0) {
        throw new Error('Deadline lease duration must be a positive integer number of milliseconds');
      }

      const client = await pool.connect();
      try {
        return await claimDueWithClient(client, leaseToken, leaseDurationMs);
      } finally {
        client.release();
      }
    },

    async markCompleted({ deadlineId, leaseToken }) {
      const result = await pool.query(
        `update game_deadline_jobs
            set status = 'completed',
                completed_at = now(),
                lease_token = null,
                lease_expires_at = null
          where deadline_id = $1
            and status = 'leased'
            and lease_token = $2
            and lease_expires_at > now()`,
        [deadlineId, leaseToken]
      );
      if (result.rowCount !== 1) {
        throw new Error(`Deadline completion lease is not owned for job ${deadlineId}`);
      }
    },

    async releaseClaim({ deadlineId, leaseToken }) {
      const result = await pool.query(
        `update game_deadline_jobs
            set status = 'pending',
                lease_token = null,
                lease_expires_at = null
          where deadline_id = $1
            and status = 'leased'
            and lease_token = $2`,
        [deadlineId, leaseToken]
      );
      if (result.rowCount !== 1) {
        throw new Error(`Deadline release lease is not owned for job ${deadlineId}`);
      }
    }
  };
}
