import {
  addWaitingPlayer,
  createWaitingGameState,
  projectGameView,
  startPlayableGame,
  validateCanonicalState,
  type CanonicalGameState,
  type GameViewProjection
} from '@cribbit/game-engine';
import type { AcceptedCommandReceipt, GameCommandPayload } from '@cribbit/contracts';
import type {
  CommandSessionTransaction,
  CommandTransactionPort,
  SessionMembership
} from './ports.ts';

interface MemorySession {
  state: CanonicalGameState;
  members: Array<{ principalId: string; playerId: string; displayName: string }>;
  receipts: Map<string, AcceptedCommandReceipt>;
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

const sessions = new Map<string, MemorySession>();

function cloneState(state: CanonicalGameState): CanonicalGameState {
  return structuredClone(state);
}

export function resetMemorySessions(): void {
  sessions.clear();
}

export function createMemorySessionStore() {
  return {
    async createSession(input: {
      readonly sessionId: string;
      readonly principalId: string;
      readonly playerId: string;
      readonly displayName: string;
    }): Promise<CreatedSessionRecord> {
      const state = createWaitingGameState({
        sessionId: input.sessionId,
        hostPlayerId: input.playerId,
        hostDisplayName: input.displayName
      });
      validateCanonicalState(state);
      sessions.set(input.sessionId, {
        state,
        members: [{ principalId: input.principalId, playerId: input.playerId, displayName: input.displayName }],
        receipts: new Map()
      });
      return {
        sessionId: input.sessionId,
        playerId: input.playerId,
        projection: projectGameView(state, input.playerId)
      };
    },

    async joinSession(input: {
      readonly sessionId: string;
      readonly principalId: string;
      readonly playerId: string;
      readonly displayName: string;
    }): Promise<SessionStoreResult<CreatedSessionRecord>> {
      const session = sessions.get(input.sessionId);
      if (!session) return { status: 'rejected', reason: 'SESSION_NOT_FOUND' };
      const added = addWaitingPlayer({
        state: session.state,
        playerId: input.playerId,
        displayName: input.displayName
      });
      if (added.status === 'rejected') return { status: 'rejected', reason: added.reason };
      session.state = added.state;
      session.members.push({
        principalId: input.principalId,
        playerId: input.playerId,
        displayName: input.displayName
      });
      return {
        status: 'accepted',
        value: {
          sessionId: input.sessionId,
          playerId: input.playerId,
          projection: projectGameView(session.state, input.playerId)
        }
      };
    },

    async loadForPrincipal(sessionId: string, principalId: string): Promise<LoadedPlayerSession | null> {
      const session = sessions.get(sessionId);
      if (!session) return null;
      const member = session.members.find((entry) => entry.principalId === principalId);
      if (!member) return null;
      return {
        playerId: member.playerId,
        state: cloneState(session.state),
        projection: projectGameView(session.state, member.playerId)
      };
    },

    async startSession(input: {
      readonly sessionId: string;
      readonly principalId: string;
      readonly shuffledDeck: readonly string[];
    }): Promise<SessionStoreResult<{ projection: GameViewProjection }>> {
      const session = sessions.get(input.sessionId);
      if (!session) return { status: 'rejected', reason: 'SESSION_NOT_FOUND' };
      const member = session.members.find((entry) => entry.principalId === input.principalId);
      if (!member) return { status: 'rejected', reason: 'NOT_SESSION_MEMBER' };
      if (session.state.lifecycle?.hostPlayerId !== member.playerId) {
        return { status: 'rejected', reason: 'ONLY_HOST_CAN_START' };
      }
      const started = startPlayableGame({ state: session.state, shuffledDeck: input.shuffledDeck });
      if (started.status === 'rejected') return { status: 'rejected', reason: started.reason };
      session.state = started.state;
      return {
        status: 'accepted',
        value: { projection: projectGameView(session.state, member.playerId) }
      };
    },

    memberCount(sessionId: string): number {
      return sessions.get(sessionId)?.members.length ?? 0;
    }
  };
}

export function createMemoryCommandTransactionPort(): CommandTransactionPort {
  return {
    async withSession<T>(sessionId: string, run: (transaction: CommandSessionTransaction) => Promise<T>): Promise<T | null> {
      const session = sessions.get(sessionId);
      if (!session) return null;
      const transaction: CommandSessionTransaction = {
        async loadMembership(principalId: string): Promise<SessionMembership | null> {
          const member = session.members.find((entry) => entry.principalId === principalId);
          return member ? { playerId: member.playerId } : null;
        },
        async loadCanonicalState() {
          return cloneState(session.state);
        },
        async findAcceptedReceipt(commandId: string) {
          return session.receipts.get(commandId) ?? null;
        },
        async commitAccepted(input) {
          if (session.state.revision !== input.expectedRevision) {
            throw new Error('SESSION_REVISION_CONFLICT');
          }
          validateCanonicalState(input.nextState);
          session.state = cloneState(input.nextState);
          session.receipts.set(input.receipt.commandId, input.receipt);
        }
      };
      return run(transaction);
    }
  };
}

export type { GameCommandPayload };
