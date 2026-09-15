import type { CanonicalGameState, CardInstanceId } from './state.ts';

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
  readonly cardConservation: 'preserve' | 'allow-change';
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

function cardIds(state: CanonicalGameState): readonly CardInstanceId[] {
  return [
    ...state.zones.drawPile,
    ...state.zones.discardPile,
    ...Object.values(state.zones.hands).flat()
  ];
}

function assertUniqueCardIds(state: CanonicalGameState): void {
  const ids = cardIds(state);
  if (new Set(ids).size !== ids.length) {
    throw new Error('Canonical state contains duplicate physical card instance IDs');
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
  assertUniqueCardIds(input.state);

  const isolatedState = structuredClone(input.state);
  const proposed = input.definition.apply({
    state: isolatedState,
    command: input.command,
    authoritativeInputs: input.authoritativeInputs
  });

  if (proposed.status === 'rejected') {
    return {
      status: 'rejected',
      state: input.state,
      reason: proposed.reason,
      ruleRefs: [...input.definition.ruleRefs]
    };
  }

  const nextState: CanonicalGameState = {
    ...proposed.state,
    revision: input.state.revision + 1
  };

  assertUniqueCardIds(nextState);
  if (input.definition.cardConservation === 'preserve') {
    assertCardConservation(input.state, nextState);
  }

  return {
    status: 'accepted',
    state: nextState,
    effects: structuredClone(proposed.effects),
    ruleRefs: [...input.definition.ruleRefs]
  };
}
