export interface GameCommandPayload {
  readonly kind: string;
  readonly [key: string]: unknown;
}

export interface GameCommandEnvelope<
  Command extends GameCommandPayload = GameCommandPayload
> {
  readonly commandId: string;
  readonly commandFingerprint: string;
  readonly sessionId: string;
  readonly expectedRevision: number;
  readonly command: Command;
}

export interface AcceptedCommandReceipt {
  readonly commandId: string;
  readonly commandFingerprint: string;
  readonly sessionId: string;
  readonly actorPlayerId: string;
  readonly acceptedRevision: number;
}

export type CommandRejectionCode =
  | 'UNAUTHENTICATED'
  | 'SESSION_NOT_FOUND'
  | 'NOT_SESSION_MEMBER'
  | 'COMMAND_ID_CONFLICT'
  | 'STALE_REVISION'
  | 'ENGINE_REJECTED';

export type CommandServiceResult<Projection> =
  | {
      readonly status: 'accepted';
      readonly receipt: AcceptedCommandReceipt;
      readonly projection: Projection;
    }
  | {
      readonly status: 'rejected';
      readonly code: CommandRejectionCode;
      readonly reason?: string;
      readonly currentRevision?: number;
    };
