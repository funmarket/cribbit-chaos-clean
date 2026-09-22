import type { Pool, PoolClient } from 'pg';
import {
  addWaitingPlayer,
  createWaitingGameState,
  projectGameView,
  startPlayableGame,
  validateCanonicalState,
  type CanonicalGameState
} from '@cribbit/game-engine';
import type { GameViewProjection } from '@cribbit/contracts';

interface SessionStateRow {
  readonly canonical_state: CanonicalGameState;
  readonly revision: string | number;
}

interface MembershipRow {
  readonly player_id: string;
}

export interface CreatedSessionRecord {
  readonly sessionId: string;
  readonly playerId: string;
  readonly projection: GameViewProjection;
}

export interface LoadedPlayerSession {
  readonly playerId: string;
  readonly state: CanonicalGameState;
  readonly projection: GameViewProjection;
}

export type SessionStoreResult<T> =
  | { readonly status: 'accepted'; readonly value: T }
  | { readonly status: 'rejected'; readonly reason: string };

function assertStoredState(row: SessionStateRow): CanonicalGameState {
  const state = row.canonical_state;
  validateCanonicalState(state);
  if (state.revision !== Number(row.revision)) throw new Error('Canonical session row revision does not match canonical state revision');
  return structuredClone(state);
}

async function loadLockedState(client: PoolClient, sessionId: string): Promise<CanonicalGameState | null> {
  const result = await client.query<SessionStateRow>(
    'select canonical_state, revision from game_sessions where session_id = $1 for update',
    [sessionId]
  );
  return result.rowCount === 0 ? null : assertStoredState(result.rows[0]);
}

async function updateState(client: PoolClient, state: CanonicalGameState, previousRevision: number): Promise<void> {
  validateCanonicalState(state);
  const result = await client.query(
    `update game_sessions
        set canonical_state = $1::jsonb, revision = $2, updated_at = now()
      where session_id = $3 and revision = $4`,
    [JSON.stringify(state), state.revision, state.gameId, previousRevision]
  );
  if (result.rowCount !== 1) throw new Error('SESSION_REVISION_CONFLICT');
  await client.query(
    `insert into game_outbox (session_id, accepted_revision, audience, payload)
     values ($1, $2, $3::jsonb, $4::jsonb)`,
    [state.gameId, state.revision, JSON.stringify({ kind: 'session' }), JSON.stringify({ kind: 'SESSION_REVISION_COMMITTED', sessionId: state.gameId, revision: state.revision })]
  );
}

export function createPostgresSessionStore(pool: Pool) {
  return {
    async createSession(input: { readonly sessionId: string; readonly principalId: string; readonly playerId: string; readonly displayName: string }): Promise<CreatedSessionRecord> {
      const state = createWaitingGameState({ sessionId: input.sessionId, hostPlayerId: input.playerId, hostDisplayName: input.displayName });
      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query(
          'insert into game_sessions (session_id, canonical_state, revision) values ($1, $2::jsonb, $3)',
          [input.sessionId, JSON.stringify(state), state.revision]
        );
        await client.query(
          'insert into game_session_memberships (session_id, principal_id, player_id) values ($1, $2, $3)',
          [input.sessionId, input.principalId, input.playerId]
        );
        await client.query('commit');
        return { sessionId: input.sessionId, playerId: input.playerId, projection: projectGameView(state, input.playerId) };
      } catch (error) {
        try { await client.query('rollback'); } catch {}
        throw error;
      } finally { client.release(); }
    },

    async createSimulationSession(input: {
      readonly sessionId: string;
      readonly principalId: string;
      readonly playerId: string;
      readonly displayName: string;
      readonly botDisplayNames: readonly string[];
      readonly shuffledDeck: readonly string[];
    }): Promise<CreatedSessionRecord> {
      let state = createWaitingGameState({
        sessionId: input.sessionId,
        hostPlayerId: input.playerId,
        hostDisplayName: input.displayName
      });
      for (const [index, displayName] of input.botDisplayNames.entries()) {
        const added = addWaitingPlayer({
          state,
          playerId: `p${index + 2}`,
          displayName
        });
        if (added.status === 'rejected') throw new Error(added.reason);
        state = added.state;
      }
      const started = startPlayableGame({ state, shuffledDeck: input.shuffledDeck });
      if (started.status === 'rejected') throw new Error(started.reason);
      state = started.state;

      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query(
          'insert into game_sessions (session_id, canonical_state, revision) values ($1, $2::jsonb, $3)',
          [input.sessionId, JSON.stringify(state), state.revision]
        );
        await client.query(
          'insert into game_session_memberships (session_id, principal_id, player_id) values ($1, $2, $3)',
          [input.sessionId, input.principalId, input.playerId]
        );
        await client.query('commit');
        return {
          sessionId: input.sessionId,
          playerId: input.playerId,
          projection: projectGameView(state, input.playerId)
        };
      } catch (error) {
        try { await client.query('rollback'); } catch {}
        throw error;
      } finally { client.release(); }
    },

    async joinSession(input: { readonly sessionId: string; readonly principalId: string; readonly playerId: string; readonly displayName: string }): Promise<SessionStoreResult<LoadedPlayerSession>> {
      const client = await pool.connect();
      try {
        await client.query('begin');
        const state = await loadLockedState(client, input.sessionId);
        if (state === null) { await client.query('rollback'); return { status: 'rejected', reason: 'SESSION_NOT_FOUND' }; }
        const existing = await client.query<MembershipRow>(
          'select player_id from game_session_memberships where session_id = $1 and principal_id = $2',
          [input.sessionId, input.principalId]
        );
        if (existing.rowCount) { await client.query('rollback'); return { status: 'rejected', reason: 'PLAYER_ALREADY_JOINED' }; }
        const next = addWaitingPlayer({ state, playerId: input.playerId, displayName: input.displayName });
        if (next.status === 'rejected') { await client.query('rollback'); return next; }
        await updateState(client, next.state, state.revision);
        await client.query(
          'insert into game_session_memberships (session_id, principal_id, player_id) values ($1, $2, $3)',
          [input.sessionId, input.principalId, input.playerId]
        );
        await client.query('commit');
        return { status: 'accepted', value: { playerId: input.playerId, state: next.state, projection: projectGameView(next.state, input.playerId) } };
      } catch (error) {
        try { await client.query('rollback'); } catch {}
        throw error;
      } finally { client.release(); }
    },

    async loadForPrincipal(sessionId: string, principalId: string): Promise<LoadedPlayerSession | null> {
      const membership = await pool.query<MembershipRow>(
        'select player_id from game_session_memberships where session_id = $1 and principal_id = $2',
        [sessionId, principalId]
      );
      if (!membership.rowCount) return null;
      const stateResult = await pool.query<SessionStateRow>(
        'select canonical_state, revision from game_sessions where session_id = $1',
        [sessionId]
      );
      if (!stateResult.rowCount) return null;
      const state = assertStoredState(stateResult.rows[0]);
      const playerId = membership.rows[0].player_id;
      return { playerId, state, projection: projectGameView(state, playerId) };
    },

    async startSession(input: { readonly sessionId: string; readonly principalId: string; readonly shuffledDeck: readonly string[] }): Promise<SessionStoreResult<LoadedPlayerSession>> {
      const client = await pool.connect();
      try {
        await client.query('begin');
        const state = await loadLockedState(client, input.sessionId);
        if (state === null) { await client.query('rollback'); return { status: 'rejected', reason: 'SESSION_NOT_FOUND' }; }
        const membership = await client.query<MembershipRow>(
          'select player_id from game_session_memberships where session_id = $1 and principal_id = $2',
          [input.sessionId, input.principalId]
        );
        if (!membership.rowCount) { await client.query('rollback'); return { status: 'rejected', reason: 'NOT_SESSION_MEMBER' }; }
        const playerId = membership.rows[0].player_id;
        if (state.lifecycle?.hostPlayerId !== playerId) { await client.query('rollback'); return { status: 'rejected', reason: 'START_REQUIRES_HOST' }; }
        const started = startPlayableGame({ state, shuffledDeck: input.shuffledDeck });
        if (started.status === 'rejected') { await client.query('rollback'); return started; }
        await updateState(client, started.state, state.revision);
        await client.query('commit');
        return { status: 'accepted', value: { playerId, state: started.state, projection: projectGameView(started.state, playerId) } };
      } catch (error) {
        try { await client.query('rollback'); } catch {}
        throw error;
      } finally { client.release(); }
    },

    async memberCount(sessionId: string): Promise<number> {
      const result = await pool.query<{ count: string }>(
        'select count(*) from game_session_memberships where session_id = $1',
        [sessionId]
      );
      return Number(result.rows[0]?.count ?? 0);
    }
  };
}
