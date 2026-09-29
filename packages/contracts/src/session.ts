import type { GameCommandPayload } from './commands.ts';
import type { GameViewProjection } from './view.ts';

export interface PlayerSessionIdentity {
  readonly sessionId: string;
  readonly playerId: string;
  readonly displayName: string;
}

/** @deprecated The clean runtime no longer carries a per-game secret credential. */
export type PlayerSessionCredential = PlayerSessionIdentity;

export interface SessionProjectionResponse {
  readonly player: PlayerSessionIdentity;
  readonly projection: GameViewProjection;
}

export interface CreateSessionRequest {
  readonly displayName?: string;
}

export interface JoinSessionRequest {
  readonly displayName?: string;
}

export interface ExecuteGameCommandRequest<Command extends GameCommandPayload = GameCommandPayload> {
  readonly commandId?: string;
  readonly expectedRevision: number;
  readonly command: Command;
}

export interface ExecuteGameCommandAcceptedResponse {
  readonly ok: true;
  readonly receipt: {
    readonly commandId: string;
    readonly acceptedRevision: number;
  };
  readonly projection: GameViewProjection;
}

export interface ExecuteGameCommandRejectedResponse {
  readonly ok: false;
  readonly code: string;
  readonly reason?: string;
  readonly currentRevision?: number;
}

export type ExecuteGameCommandResponse =
  | ExecuteGameCommandAcceptedResponse
  | ExecuteGameCommandRejectedResponse;
