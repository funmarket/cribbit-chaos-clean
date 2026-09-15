import type {
  AcceptedCommandReceipt,
  GameCommandPayload
} from '@cribbit/contracts';
import type {
  CanonicalGameState,
  EngineEffect,
  EngineTransitionDefinition,
  PlayerId
} from '@cribbit/game-engine';

export interface AuthenticatedPrincipal {
  readonly principalId: string;
}

export interface AuthenticationPort {
  authenticate(authInput: unknown): Promise<AuthenticatedPrincipal | null>;
}

export interface SessionMembership {
  readonly playerId: PlayerId;
}

export interface AcceptedCommit {
  readonly expectedRevision: number;
  readonly nextState: CanonicalGameState;
  readonly receipt: AcceptedCommandReceipt;
}

export interface CommandSessionTransaction {
  loadMembership(principalId: string): Promise<SessionMembership | null>;
  findAcceptedReceipt(commandId: string): Promise<AcceptedCommandReceipt | null>;
  loadCanonicalState(): Promise<CanonicalGameState>;
  commitAccepted(input: AcceptedCommit): Promise<void>;
}

export interface CommandTransactionPort {
  withSession<Result>(
    sessionId: string,
    operation: (transaction: CommandSessionTransaction) => Promise<Result>
  ): Promise<Result | null>;
}

export interface ResolvedEngineCommand {
  readonly authoritativeInputs: unknown;
  readonly definition: EngineTransitionDefinition<
    GameCommandPayload,
    unknown,
    EngineEffect
  >;
}

export interface EngineCommandResolver {
  resolve(input: {
    readonly actorPlayerId: PlayerId;
    readonly state: CanonicalGameState;
    readonly command: GameCommandPayload;
  }): Promise<ResolvedEngineCommand>;
}

export interface GameCommandServicePorts {
  readonly auth: AuthenticationPort;
  readonly transactions: CommandTransactionPort;
  readonly resolver: EngineCommandResolver;
}
