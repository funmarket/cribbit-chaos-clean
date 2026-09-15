import type {
  CanonicalGameState,
  CardInstanceId,
  PlayerId,
  RecipientScope
} from './state.ts';

export interface EngineCommand {
  readonly kind: string;
}

export interface EngineEffect {
  readonly kind: string;
  readonly [key: string]: unknown;
}

export interface EngineTransitionContext<
  Command extends EngineCommand,
  Inputs
> {
  readonly state: CanonicalGameState;
  readonly command: Command;
  readonly authoritativeInputs: Inputs;
}

export type ProposedEngineTransition<Effect extends EngineEffect> =
  | {
      readonly status: 'accepted';
      readonly state: CanonicalGameState;
      readonly effects: readonly Effect[];
    }
  | {
      readonly status: 'rejected';
      readonly reason: string;
    };

export interface EngineTransitionDefinition<
  Command extends EngineCommand,
  Inputs,
  Effect extends EngineEffect
> {
  readonly ruleRefs: readonly string[];
  readonly cardConservation: 'preserve';
  readonly apply: (
    context: EngineTransitionContext<Command, Inputs>
  ) => ProposedEngineTransition<Effect>;
}

export type EngineTransitionResult<Effect extends EngineEffect> =
  | {
      readonly status: 'accepted';
      readonly state: CanonicalGameState;
      readonly effects: readonly Effect[];
      readonly ruleRefs: readonly string[];
    }
  | {
      readonly status: 'rejected';
      readonly state: CanonicalGameState;
      readonly reason: string;
      readonly ruleRefs: readonly string[];
    };

export interface EngineReplayStep {
  readonly command: EngineCommand;
  readonly authoritativeInputs: unknown;
  readonly definition: EngineTransitionDefinition<EngineCommand, any, EngineEffect>;
}

export interface EngineReplayResult {
  readonly state: CanonicalGameState;
  readonly transitions: readonly EngineTransitionResult<EngineEffect>[];
}

function assertUnique<T>(values: readonly T[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`Canonical state contains duplicate ${label}`);
  }
}

function cardIds(state: CanonicalGameState): readonly CardInstanceId[] {
  return [
    ...state.zones.drawPile,
    ...state.zones.discardPile,
    ...Object.values(state.zones.hands).flat()
  ];
}

function assertKnownPlayer(
  playerIds: ReadonlySet<PlayerId>,
  playerId: PlayerId,
  context: string
): void {
  if (!playerIds.has(playerId)) {
    throw new Error(`${context} references unknown player ${playerId}`);
  }
}

function validateRecipientScope(
  scope: RecipientScope,
  playerIds: ReadonlySet<PlayerId>,
  context: string
): void {
  if (scope.kind === 'public') return;
  assertUnique(scope.playerIds, `${context} audience player ID`);
  for (const playerId of scope.playerIds) {
    assertKnownPlayer(playerIds, playerId, context);
  }
}

export function validateCanonicalState(state: CanonicalGameState): void {
  if (!Number.isSafeInteger(state.revision) || state.revision < 0) {
    throw new Error('Canonical state revision must be a non-negative safe integer');
  }

  const playerIds = state.players.map((player) => player.playerId);
  const seats = state.players.map((player) => player.seat);
  assertUnique(playerIds, 'player ID');
  assertUnique(seats, 'player seat');
  const knownPlayers = new Set(playerIds);

  for (const playerId of playerIds) {
    if (state.zones.hands[playerId] === undefined) {
      throw new Error(`Canonical state is missing a hand for player ${playerId}`);
    }
  }
  for (const playerId of Object.keys(state.zones.hands)) {
    assertKnownPlayer(knownPlayers, playerId, 'Canonical hand map');
  }

  assertUnique(cardIds(state), 'physical card instance ID');

  const continuationIds = state.continuations.map(
    (continuation) => continuation.continuationId
  );
  assertUnique(continuationIds, 'continuation ID');

  if (state.rootFlow === null) {
    if (state.continuations.length > 0) {
      throw new Error('Canonical state contains a continuation without an active root flow');
    }
  } else {
    const rootFlow = state.rootFlow;
    const stage = rootFlow.stage;
    assertUnique(rootFlow.continuationIds, 'root-flow continuation ID');
    assertUnique(stage.eligibleParticipantIds, 'eligible participant ID');
    assertUnique(stage.pendingParticipantIds, 'pending participant ID');
    assertUnique(
      stage.acceptedSubmissions.map((submission) => submission.submissionId),
      'sealed submission ID'
    );

    const eligible = new Set(stage.eligibleParticipantIds);
    for (const playerId of stage.eligibleParticipantIds) {
      assertKnownPlayer(knownPlayers, playerId, 'Root-flow stage');
    }
    for (const playerId of stage.pendingParticipantIds) {
      assertKnownPlayer(knownPlayers, playerId, 'Root-flow stage');
      if (!eligible.has(playerId)) {
        throw new Error(`Pending participant ${playerId} is not eligible for the active stage`);
      }
    }
    for (const submission of stage.acceptedSubmissions) {
      assertKnownPlayer(knownPlayers, submission.participantId, 'Sealed submission');
      if (!eligible.has(submission.participantId)) {
        throw new Error(
          `Sealed submission participant ${submission.participantId} is not eligible for the active stage`
        );
      }
    }

    const listedContinuations = new Set(rootFlow.continuationIds);
    const actualContinuations = new Set(continuationIds);
    for (const continuation of state.continuations) {
      if (continuation.rootFlowId !== rootFlow.rootFlowId) {
        throw new Error(
          `Continuation ${continuation.continuationId} references a different root flow`
        );
      }
      if (!listedContinuations.has(continuation.continuationId)) {
        throw new Error(
          `Continuation ${continuation.continuationId} is not listed by the active root flow`
        );
      }
    }
    for (const continuationId of rootFlow.continuationIds) {
      if (!actualContinuations.has(continuationId)) {
        throw new Error(`Root flow references missing continuation ${continuationId}`);
      }
    }
  }

  const effectIds = state.persistentEffects.map((effect) => effect.effectId);
  assertUnique(effectIds, 'persistent effect ID');
  const knownEffects = new Set(effectIds);

  const deadlineIds = state.deadlines.map((deadline) => deadline.deadlineId);
  assertUnique(deadlineIds, 'deadline ID');
  const deadlinesById = new Map(
    state.deadlines.map((deadline) => [deadline.deadlineId, deadline] as const)
  );

  if (state.rootFlow?.stage.deadlineId !== null && state.rootFlow?.stage.deadlineId !== undefined) {
    const stage = state.rootFlow.stage;
    const deadline = deadlinesById.get(stage.deadlineId);
    if (deadline === undefined) {
      throw new Error(`Root-flow stage deadline ${stage.deadlineId} is missing`);
    }
    if (deadline.owner.kind !== 'stage' || deadline.owner.refId !== stage.stageId) {
      throw new Error(
        `Deadline ${stage.deadlineId} does not belong to root-flow stage ${stage.stageId}`
      );
    }
  }

  for (const effect of state.persistentEffects) {
    assertUnique(effect.subjectPlayerIds, `persistent effect ${effect.effectId} subject player ID`);
    for (const playerId of effect.subjectPlayerIds) {
      assertKnownPlayer(knownPlayers, playerId, `Persistent effect ${effect.effectId}`);
    }
    validateRecipientScope(effect.audience, knownPlayers, `Persistent effect ${effect.effectId}`);
    if (effect.deadlineId !== null) {
      const deadline = deadlinesById.get(effect.deadlineId);
      if (deadline === undefined) {
        throw new Error(`Persistent effect deadline ${effect.deadlineId} is missing`);
      }
      if (
        deadline.owner.kind !== 'persistent-effect' ||
        deadline.owner.refId !== effect.effectId
      ) {
        throw new Error(
          `Deadline ${effect.deadlineId} does not belong to persistent effect ${effect.effectId}`
        );
      }
    }
  }

  for (const deadline of state.deadlines) {
    validateRecipientScope(deadline.audience, knownPlayers, `Deadline ${deadline.deadlineId}`);
    if (deadline.owner.kind === 'root-flow') {
      if (state.rootFlow?.rootFlowId !== deadline.owner.refId) {
        throw new Error(`Deadline ${deadline.deadlineId} references an unknown root flow`);
      }
    } else if (deadline.owner.kind === 'stage') {
      if (state.rootFlow?.stage.stageId !== deadline.owner.refId) {
        throw new Error(`Deadline ${deadline.deadlineId} references an unknown stage`);
      }
    } else if (!knownEffects.has(deadline.owner.refId)) {
      throw new Error(`Deadline ${deadline.deadlineId} references an unknown persistent effect`);
    }
  }

  if (state.winnerBoundary.status === 'declared') {
    assertKnownPlayer(
      knownPlayers,
      state.winnerBoundary.winnerPlayerId,
      'Winner boundary'
    );
    if (state.rootFlow !== null) {
      throw new Error('A winner cannot be declared while a root flow is active');
    }
    if (state.continuations.length > 0) {
      throw new Error('A winner cannot be declared while continuations remain unresolved');
    }
  }
}

function assertRuleProvenance(ruleRefs: readonly string[]): void {
  if (ruleRefs.length === 0 || ruleRefs.some((ref) => ref.trim().length === 0)) {
    throw new Error('Executable engine transition requires explicit rule provenance');
  }
}

function assertCardConservation(
  before: CanonicalGameState,
  after: CanonicalGameState
): void {
  const beforeIds = [...cardIds(before)].sort();
  const afterIds = [...cardIds(after)].sort();
  if (
    beforeIds.length !== afterIds.length ||
    beforeIds.some((id, index) => id !== afterIds[index])
  ) {
    throw new Error('Engine transition violated physical card conservation');
  }
}

export function runEngineTransition<
  Command extends EngineCommand,
  Inputs,
  Effect extends EngineEffect
>(input: {
  readonly state: CanonicalGameState;
  readonly command: Command;
  readonly authoritativeInputs: Inputs;
  readonly definition: EngineTransitionDefinition<Command, Inputs, Effect>;
}): EngineTransitionResult<Effect> {
  validateCanonicalState(input.state);
  assertRuleProvenance(input.definition.ruleRefs);

  const isolatedState = structuredClone(input.state);
  const isolatedCommand = structuredClone(input.command);
  const isolatedInputs = structuredClone(input.authoritativeInputs);
  const proposed = input.definition.apply({
    state: isolatedState,
    command: isolatedCommand,
    authoritativeInputs: isolatedInputs
  });

  if (proposed.status === 'rejected') {
    return {
      status: 'rejected',
      state: structuredClone(input.state),
      reason: proposed.reason,
      ruleRefs: [...input.definition.ruleRefs]
    };
  }

  if (proposed.state.gameId !== input.state.gameId) {
    throw new Error('Engine transition cannot change canonical game identity');
  }

  const nextState: CanonicalGameState = {
    ...proposed.state,
    revision: input.state.revision + 1
  };

  validateCanonicalState(nextState);
  assertCardConservation(input.state, nextState);

  return {
    status: 'accepted',
    state: nextState,
    effects: structuredClone(proposed.effects),
    ruleRefs: [...input.definition.ruleRefs]
  };
}

export function replayEngineTransitions(input: {
  readonly state: CanonicalGameState;
  readonly steps: readonly EngineReplayStep[];
}): EngineReplayResult {
  let state = structuredClone(input.state);
  const transitions: EngineTransitionResult<EngineEffect>[] = [];

  for (const step of input.steps) {
    const result = runEngineTransition({
      state,
      command: step.command,
      authoritativeInputs: step.authoritativeInputs,
      definition: step.definition
    });
    transitions.push(result);
    state = result.state;
  }

  return {
    state,
    transitions
  };
}
