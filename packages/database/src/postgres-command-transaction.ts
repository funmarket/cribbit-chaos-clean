import type { AcceptedCommandReceipt } from '@cribbit/contracts';
import type { CanonicalGameState } from '@cribbit/game-engine';
import { validateCanonicalState } from '@cribbit/game-engine';
import type { Pool, PoolClient } from 'pg';

import { RevisionConflictError } from './errors.ts';

export interface DatabaseSessionMembership {
  readonly playerId: string;
}

export interface DatabaseAcceptedCommit {
  readonly expectedRevision: number;
  readonly nextState: CanonicalGameState;
  readonly receipt: AcceptedCommandReceipt;
}

export interface DatabaseCommandSessionTransaction {
  loadMembership(principalId: string): Promise<DatabaseSessionMembership | null>;
  findAcceptedReceipt(commandId: string): Promise<AcceptedCommandReceipt | null>;
  loadCanonicalState(): Promise<CanonicalGameState>;
  commitAccepted(input: DatabaseAcceptedCommit): Promise<void>;
}

export interface DatabaseCommandTransactionPort {
  withSession<Result>(
    sessionId: string,
    operation: (transaction: DatabaseCommandSessionTransaction) => Promise<Result>
  ): Promise<Result | null>;
}

interface SessionStateRow {
  readonly canonical_state: CanonicalGameState;
  readonly revision: string | number;
}

interface MembershipRow {
  readonly player_id: string;
}

interface ReceiptRow {
  readonly command_id: string;
  readonly command_fingerprint: string;
  readonly actor_player_id: string;
  readonly accepted_revision: string | number;
}

function assertStoredState(row: SessionStateRow): CanonicalGameState {
  const state = row.canonical_state;
  validateCanonicalState(state);
  if (state.revision !== Number(row.revision)) {
    throw new Error('Canonical session row revision does not match canonical state revision');
  }
  return state;
}

function createBoundTransaction(
  client: PoolClient,
  sessionId: string
): DatabaseCommandSessionTransaction {
  return {
    async loadMembership(principalId) {
      const result = await client.query<MembershipRow>(
        `select player_id
           from game_session_memberships
          where session_id = $1 and principal_id = $2`,
        [sessionId, principalId]
      );
      return result.rowCount === 0 ? null : { playerId: result.rows[0].player_id };
    },

    async findAcceptedReceipt(commandId) {
      const result = await client.query<ReceiptRow>(
        `select command_id, command_fingerprint, actor_player_id, accepted_revision
           from accepted_command_receipts
          where session_id = $1 and command_id = $2`,
        [sessionId, commandId]
      );
      if (result.rowCount === 0) return null;
      const row = result.rows[0];
      return {
        commandId: row.command_id,
        commandFingerprint: row.command_fingerprint,
        sessionId,
        actorPlayerId: row.actor_player_id,
        acceptedRevision: Number(row.accepted_revision)
      };
    },

    async loadCanonicalState() {
      const result = await client.query<SessionStateRow>(
        `select canonical_state, revision
           from game_sessions
          where session_id = $1`,
        [sessionId]
      );
      if (result.rowCount !== 1) {
        throw new Error(`Locked session ${sessionId} disappeared during transaction`);
      }
      return structuredClone(assertStoredState(result.rows[0]));
    },

    async commitAccepted(input) {
      validateCanonicalState(input.nextState);
      if (input.nextState.revision !== input.expectedRevision + 1) {
        throw new Error('Accepted canonical state must advance revision by exactly one');
      }
      if (input.receipt.sessionId !== sessionId) {
        throw new Error('Accepted receipt session does not match locked session');
      }
      if (input.receipt.acceptedRevision !== input.nextState.revision) {
        throw new Error('Accepted receipt revision does not match next canonical state revision');
      }

      const updated = await client.query(
        `update game_sessions
            set canonical_state = $1::jsonb,
                revision = $2,
                updated_at = now()
          where session_id = $3 and revision = $4`,
        [
          JSON.stringify(input.nextState),
          input.nextState.revision,
          sessionId,
          input.expectedRevision
        ]
      );
      if (updated.rowCount !== 1) {
        throw new RevisionConflictError(input.expectedRevision);
      }

      await client.query(
        `insert into accepted_command_receipts
          (session_id, command_id, command_fingerprint, actor_player_id, accepted_revision)
         values ($1, $2, $3, $4, $5)`,
        [
          sessionId,
          input.receipt.commandId,
          input.receipt.commandFingerprint,
          input.receipt.actorPlayerId,
          input.receipt.acceptedRevision
        ]
      );

      await client.query(
        `insert into game_outbox (session_id, accepted_revision, audience, payload)
         values ($1, $2, $3::jsonb, $4::jsonb)`,
        [
          sessionId,
          input.nextState.revision,
          JSON.stringify({ kind: 'session' }),
          JSON.stringify({
            kind: 'SESSION_REVISION_COMMITTED',
            sessionId,
            revision: input.nextState.revision
          })
        ]
      );
    }
  };
}

export function createPostgresCommandTransactionPort(
  pool: Pool
): DatabaseCommandTransactionPort {
  return {
    async withSession(sessionId, operation) {
      const client = await pool.connect();
      try {
        await client.query('begin');
        const locked = await client.query(
          `select session_id
             from game_sessions
            where session_id = $1
            for update`,
          [sessionId]
        );
        if (locked.rowCount !== 1) {
          await client.query('rollback');
          return null;
        }

        const result = await operation(createBoundTransaction(client, sessionId));
        await client.query('commit');
        return result;
      } catch (error) {
        try {
          await client.query('rollback');
        } catch {
          // Preserve the original transaction error.
        }
        throw error;
      } finally {
        client.release();
      }
    }
  };
}
