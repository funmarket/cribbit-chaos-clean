export type GameId = string;
export type PlayerId = string;
export type CardInstanceId = string;
export type RootFlowId = string;
export type StageId = string;
export type ContinuationId = string;
export type EffectId = string;
export type DeadlineId = string;
export type SubmissionId = string;

export type CanonicalGamePhase = 'waiting' | 'active' | 'resolved';
export type CanonicalDirection = 'clockwise' | 'counterclockwise';
export type CanonicalCardColor = 'lime' | 'orange' | 'cyan' | 'purple' | null;

export interface CanonicalPlayerState {
  readonly playerId: PlayerId;
  readonly seat: number;
  readonly displayName?: string;
}

export interface CanonicalTurnState {
  readonly currentPlayerId: PlayerId;
  readonly direction: CanonicalDirection;
  readonly activeColor: CanonicalCardColor;
  readonly round: number;
}

export interface CanonicalGameLifecycle {
  readonly phase: CanonicalGamePhase;
  readonly hostPlayerId: PlayerId | null;
}

export interface CanonicalZones {
  readonly drawPile: readonly CardInstanceId[];
  readonly discardPile: readonly CardInstanceId[];
  readonly hands: Readonly<Record<PlayerId, readonly CardInstanceId[]>>;
}

export interface CanonicalSealedSubmission {
  readonly submissionId: SubmissionId;
  readonly participantId: PlayerId;
  readonly payload: unknown;
}

export interface CanonicalParticipantStage {
  readonly stageId: StageId;
  readonly eligibleParticipantIds: readonly PlayerId[];
  readonly acceptedSubmissions: readonly CanonicalSealedSubmission[];
  readonly pendingParticipantIds: readonly PlayerId[];
  readonly deadlineId: DeadlineId | null;
  readonly completionPolicyRef: string;
}

export interface CanonicalRootFlow {
  readonly rootFlowId: RootFlowId;
  readonly stage: CanonicalParticipantStage;
  readonly continuationIds: readonly ContinuationId[];
}

export interface CanonicalContinuation {
  readonly continuationId: ContinuationId;
  readonly rootFlowId: RootFlowId;
  readonly suspendedStageId: StageId;
  readonly resumeStageId: StageId;
}

export type RecipientScope =
  | { readonly kind: 'public' }
  | { readonly kind: 'players'; readonly playerIds: readonly PlayerId[] };

export interface CanonicalPersistentEffect {
  readonly effectId: EffectId;
  readonly effectKind: string;
  readonly sourceCardInstanceId: CardInstanceId | null;
  readonly subjectPlayerIds: readonly PlayerId[];
  readonly deadlineId: DeadlineId | null;
  readonly audience: RecipientScope;
}

export interface CanonicalDeadline {
  readonly deadlineId: DeadlineId;
  readonly dueAtEpochMs: number;
  readonly owner:
    | { readonly kind: 'root-flow'; readonly refId: RootFlowId }
    | { readonly kind: 'stage'; readonly refId: StageId }
    | { readonly kind: 'persistent-effect'; readonly refId: EffectId };
  readonly audience: RecipientScope;
}

export type WinnerBoundaryState =
  | { readonly status: 'blocked'; readonly blockerRefs: readonly string[] }
  | { readonly status: 'ready' }
  | { readonly status: 'declared'; readonly winnerPlayerId: PlayerId };

export interface CanonicalGameState {
  readonly gameId: GameId;
  readonly revision: number;
  readonly players: readonly CanonicalPlayerState[];
  readonly zones: CanonicalZones;
  readonly rootFlow: CanonicalRootFlow | null;
  readonly continuations: readonly CanonicalContinuation[];
  readonly persistentEffects: readonly CanonicalPersistentEffect[];
  readonly deadlines: readonly CanonicalDeadline[];
  readonly winnerBoundary: WinnerBoundaryState;
  readonly lifecycle?: CanonicalGameLifecycle;
  readonly turn?: CanonicalTurnState | null;
}
