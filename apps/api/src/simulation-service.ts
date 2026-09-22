import type { AcceptedCommandReceipt, GameCommandPayload } from '@cribbit/contracts';
import {
  isLegalOrdinaryCardPlay,
  projectGameView,
  resolvePlayableEngineCommand,
  runEngineTransition,
  type CanonicalGameState
} from '@cribbit/game-engine';

import type { CommandTransactionPort } from './ports.ts';

function fingerprint(command: GameCommandPayload): string {
  return JSON.stringify(command, Object.keys(command).sort());
}

function botCommand(state: CanonicalGameState, actorPlayerId: string): GameCommandPayload {
  const hand = state.zones.hands[actorPlayerId] ?? [];
  const playable = hand.find((cardInstanceId) =>
    isLegalOrdinaryCardPlay(state, actorPlayerId, cardInstanceId)
  );
  return playable
    ? { kind: 'PLAY_CARD', cardInstanceId: playable }
    : { kind: 'DRAW_CARD' };
}

export async function advanceSimulationBots(input: {
  readonly transactions: CommandTransactionPort;
  readonly sessionId: string;
  readonly humanPlayerId: string;
}): Promise<ReturnType<typeof projectGameView>> {
  const projected = await input.transactions.withSession(input.sessionId, async (transaction) => {
    let state = await transaction.loadCanonicalState();
    let actionCount = 0;

    while (
      state.lifecycle?.phase === 'active' &&
      state.turn?.currentPlayerId &&
      state.turn.currentPlayerId !== input.humanPlayerId
    ) {
      if (actionCount >= 32) throw new Error('SIMULATION_BOT_ADVANCE_LIMIT');
      const actorPlayerId = state.turn.currentPlayerId;
      const command = botCommand(state, actorPlayerId);
      const resolved = resolvePlayableEngineCommand({ actorPlayerId, command });
      const transition = runEngineTransition({
        state,
        command,
        authoritativeInputs: resolved.authoritativeInputs,
        definition: resolved.definition
      });
      if (transition.status === 'rejected') {
        throw new Error(`SIMULATION_BOT_REJECTED:${transition.reason}`);
      }

      const commandId = `simulation-bot:${input.sessionId}:${state.revision}:${actorPlayerId}`;
      const receipt: AcceptedCommandReceipt = {
        commandId,
        commandFingerprint: fingerprint(command),
        sessionId: input.sessionId,
        actorPlayerId,
        acceptedRevision: transition.state.revision
      };
      await transaction.commitAccepted({
        expectedRevision: state.revision,
        nextState: transition.state,
        receipt
      });
      state = transition.state;
      actionCount += 1;
    }

    return projectGameView(state, input.humanPlayerId);
  });

  if (projected === null) throw new Error('SIMULATION_SESSION_NOT_FOUND');
  return projected;
}
