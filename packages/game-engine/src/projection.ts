import type {
  CanonicalDeadline,
  CanonicalGameState,
  CanonicalPersistentEffect,
  DeadlineId,
  EffectId,
  PlayerId,
  RecipientScope,
  RootFlowId,
  StageId,
  WinnerBoundaryState
} from './state.ts';

export type ProjectionRecipient =
  | { readonly kind: 'public' }
  | { readonly kind: 'player'; readonly playerId: PlayerId };

export interface PlayerSummaryProjection {
  readonly playerId: PlayerId;
  readonly seat: number;
  readonly handCount: number;
}

export interface ZoneProjection {
  readonly drawPileCount: number;
  readonly discardPileCount: number;
  readonly topDiscardCardId: string | null;
}

export interface RootFlowProjection {
  readonly rootFlowId: RootFlowId;
  readonly stageId: StageId;
  readonly eligibleParticipantCount: number;
  readonly acceptedSubmissionCount: number;
  readonly pendingParticipantCount: number;
  readonly deadlineId: DeadlineId | null;
}

export interface PersistentEffectProjection {
  readonly effectId: EffectId;
  readonly effectKind: string;
  readonly sourceCardInstanceId: string | null;
  readonly subjectPlayerIds: readonly PlayerId[];
  readonly deadlineId: DeadlineId | null;
}

export interface DeadlineProjection {
  readonly deadlineId: DeadlineId;
  readonly dueAtEpochMs: number;
  readonly owner: CanonicalDeadline['owner'];
}

export type WinnerBoundaryProjection =
  | { readonly status: 'blocked' }
  | { readonly status: 'ready' }
  | { readonly status: 'declared'; readonly winnerPlayerId: PlayerId };

interface SharedGameProjection {
  readonly gameId: string;
  readonly revision: number;
  readonly players: readonly PlayerSummaryProjection[];
  readonly zones: ZoneProjection;
  readonly rootFlow: RootFlowProjection | null;
  readonly persistentEffects: readonly PersistentEffectProjection[];
  readonly deadlines: readonly DeadlineProjection[];
  readonly winnerBoundary: WinnerBoundaryProjection;
}

export interface PublicGameProjection extends SharedGameProjection {
  readonly audience: { readonly kind: 'public' };
}

export interface PlayerPrivateProjection {
  readonly playerId: PlayerId;
  readonly hand: readonly string[];
  readonly pendingStageIds: readonly StageId[];
  readonly acceptedSealedSubmissionIds: readonly string[];
}

export interface PlayerGameProjection extends SharedGameProjection {
  readonly audience: { readonly kind: 'player'; readonly playerId: PlayerId };
  readonly private: PlayerPrivateProjection;
}

export type RecipientGameProjection = PublicGameProjection | PlayerGameProjection;

function requireHand(state: CanonicalGameState, playerId: PlayerId): readonly string[] {
  const hand = state.zones.hands[playerId];
  if (hand === undefined) {
    throw new Error(`Canonical state is missing a hand for player ${playerId}`);
  }
  return hand;
}

function scopeAllows(scope: RecipientScope, recipient: ProjectionRecipient): boolean {
  if (scope.kind === 'public') return true;
  return recipient.kind === 'player' && scope.playerIds.includes(recipient.playerId);
}

function projectEffect(effect: CanonicalPersistentEffect): PersistentEffectProjection {
  return {
    effectId: effect.effectId,
    effectKind: effect.effectKind,
    sourceCardInstanceId: effect.sourceCardInstanceId,
    subjectPlayerIds: [...effect.subjectPlayerIds],
    deadlineId: effect.deadlineId
  };
}

function projectDeadline(deadline: CanonicalDeadline): DeadlineProjection {
  return {
    deadlineId: deadline.deadlineId,
    dueAtEpochMs: deadline.dueAtEpochMs,
    owner: { ...deadline.owner }
  };
}

function projectWinnerBoundary(boundary: WinnerBoundaryState): WinnerBoundaryProjection {
  if (boundary.status === 'declared') {
    return { status: 'declared', winnerPlayerId: boundary.winnerPlayerId };
  }
  return { status: boundary.status };
}

function sharedProjection(
  state: CanonicalGameState,
  recipient: ProjectionRecipient
): SharedGameProjection {
  const players = state.players.map((player) => ({
    playerId: player.playerId,
    seat: player.seat,
    handCount: requireHand(state, player.playerId).length
  }));

  const rootFlow = state.rootFlow === null
    ? null
    : {
        rootFlowId: state.rootFlow.rootFlowId,
        stageId: state.rootFlow.stage.stageId,
        eligibleParticipantCount: state.rootFlow.stage.eligibleParticipantIds.length,
        acceptedSubmissionCount: state.rootFlow.stage.acceptedSubmissions.length,
        pendingParticipantCount: state.rootFlow.stage.pendingParticipantIds.length,
        deadlineId: state.rootFlow.stage.deadlineId
      };

  return {
    gameId: state.gameId,
    revision: state.revision,
    players,
    zones: {
      drawPileCount: state.zones.drawPile.length,
      discardPileCount: state.zones.discardPile.length,
      topDiscardCardId: state.zones.discardPile.at(-1) ?? null
    },
    rootFlow,
    persistentEffects: state.persistentEffects
      .filter((effect) => scopeAllows(effect.audience, recipient))
      .map(projectEffect),
    deadlines: state.deadlines
      .filter((deadline) => scopeAllows(deadline.audience, recipient))
      .map(projectDeadline),
    winnerBoundary: projectWinnerBoundary(state.winnerBoundary)
  };
}

export function projectGameState(
  state: CanonicalGameState,
  recipient: ProjectionRecipient
): RecipientGameProjection {
  const shared = sharedProjection(state, recipient);
  if (recipient.kind === 'public') {
    return {
      ...shared,
      audience: { kind: 'public' }
    };
  }

  const hand = requireHand(state, recipient.playerId);
  const stage = state.rootFlow?.stage ?? null;

  return {
    ...shared,
    audience: { kind: 'player', playerId: recipient.playerId },
    private: {
      playerId: recipient.playerId,
      hand: [...hand],
      pendingStageIds:
        stage !== null && stage.pendingParticipantIds.includes(recipient.playerId)
          ? [stage.stageId]
          : [],
      acceptedSealedSubmissionIds:
        stage === null
          ? []
          : stage.acceptedSubmissions
              .filter((submission) => submission.participantId === recipient.playerId)
              .map((submission) => submission.submissionId)
    }
  };
}
