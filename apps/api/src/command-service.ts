import type {
  CommandServiceResult,
  GameCommandEnvelope,
  GameViewProjection
} from '@cribbit/contracts';
import {
  projectGameView,
  runEngineTransition,
  type CanonicalGameState,
  type PlayerId
} from '@cribbit/game-engine';

import type { GameCommandServicePorts } from './ports.ts';

export interface GameCommandService {
  execute(input: {
    readonly authInput: unknown;
    readonly envelope: GameCommandEnvelope;
  }): Promise<CommandServiceResult<GameViewProjection>>;
}

function projectPlayerState(
  state: CanonicalGameState,
  playerId: PlayerId
): GameViewProjection {
  return projectGameView(state, playerId);
}

export function createGameCommandService(
  ports: GameCommandServicePorts
): GameCommandService {
  return {
    async execute(input) {
      const principal = await ports.auth.authenticate(input.authInput);
      if (principal === null) {
        return { status: 'rejected', code: 'UNAUTHENTICATED' };
      }

      const result = await ports.transactions.withSession(
        input.envelope.sessionId,
        async (transaction) => {
          const membership = await transaction.loadMembership(principal.principalId);
          if (membership === null) {
            return { status: 'rejected', code: 'NOT_SESSION_MEMBER' } as const;
          }

          const priorReceipt = await transaction.findAcceptedReceipt(
            input.envelope.commandId
          );
          if (priorReceipt !== null) {
            if (
              priorReceipt.commandFingerprint !== input.envelope.commandFingerprint ||
              priorReceipt.actorPlayerId !== membership.playerId ||
              priorReceipt.sessionId !== input.envelope.sessionId
            ) {
              return { status: 'rejected', code: 'COMMAND_ID_CONFLICT' } as const;
            }
            const currentState = await transaction.loadCanonicalState();
            return {
              status: 'accepted',
              receipt: priorReceipt,
              projection: projectPlayerState(currentState, membership.playerId)
            } as const;
          }

          const state = await transaction.loadCanonicalState();
          if (state.revision !== input.envelope.expectedRevision) {
            return {
              status: 'rejected',
              code: 'STALE_REVISION',
              currentRevision: state.revision
            } as const;
          }

          const resolved = await ports.resolver.resolve({
            actorPlayerId: membership.playerId,
            state,
            command: input.envelope.command
          });
          const transition = runEngineTransition({
            state,
            command: input.envelope.command,
            authoritativeInputs: resolved.authoritativeInputs,
            definition: resolved.definition
          });

          if (transition.status === 'rejected') {
            return {
              status: 'rejected',
              code: 'ENGINE_REJECTED',
              reason: transition.reason
            } as const;
          }

          const receipt = {
            commandId: input.envelope.commandId,
            commandFingerprint: input.envelope.commandFingerprint,
            sessionId: input.envelope.sessionId,
            actorPlayerId: membership.playerId,
            acceptedRevision: transition.state.revision
          } as const;

          await transaction.commitAccepted({
            expectedRevision: input.envelope.expectedRevision,
            nextState: transition.state,
            receipt
          });

          return {
            status: 'accepted',
            receipt,
            projection: projectPlayerState(transition.state, membership.playerId)
          } as const;
        }
      );

      if (result === null) {
        return { status: 'rejected', code: 'SESSION_NOT_FOUND' };
      }
      return result;
    }
  };
}
