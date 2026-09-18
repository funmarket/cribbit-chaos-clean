import type {
  DrawCardCommandPayload,
  ExecuteGameCommandResponse,
  GameViewProjection,
  JoinSessionRequest,
  PlayerSessionCredential,
  PlayCardCommandPayload,
  SessionProjectionResponse
} from '@cribbit/contracts';

export interface CribbitApiClientOptions {
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
}

export interface CribbitApiClient {
  createSession(input: { readonly displayName: string }): Promise<SessionProjectionResponse>;
  joinSession(input: { readonly sessionId: string; readonly displayName: string }): Promise<SessionProjectionResponse>;
  getProjection(credential: PlayerSessionCredential): Promise<GameViewProjection>;
  startGame(credential: PlayerSessionCredential): Promise<GameViewProjection>;
  drawCard(credential: PlayerSessionCredential, expectedRevision: number, commandId?: string): Promise<ExecuteGameCommandResponse>;
  playCard(credential: PlayerSessionCredential, expectedRevision: number, cardInstanceId: string, commandId?: string): Promise<ExecuteGameCommandResponse>;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function decodeJson<T>(response: Response): Promise<T> {
  const payload = await response.json() as T;
  if (!response.ok) throw Object.assign(new Error(`Cribbit API request failed with ${response.status}`), { payload, status: response.status });
  return payload;
}

export function createCribbitApiClient(options: CribbitApiClientOptions = {}): CribbitApiClient {
  const baseUrl = options.baseUrl ?? '/api';
  const fetchImpl = options.fetchImpl ?? fetch;
  const jsonHeaders = { 'content-type': 'application/json' } as const;
  const authHeaders = (credential: PlayerSessionCredential) => ({ 'x-cribbit-credential': credential.credential });

  async function command(credential: PlayerSessionCredential, body: { readonly commandId?: string; readonly expectedRevision: number; readonly command: DrawCardCommandPayload | PlayCardCommandPayload }): Promise<ExecuteGameCommandResponse> {
    const response = await fetchImpl(joinUrl(baseUrl, `/sessions/${encodeURIComponent(credential.sessionId)}/commands`), {
      method: 'POST',
      headers: { ...jsonHeaders, ...authHeaders(credential) },
      body: JSON.stringify(body)
    });
    return decodeJson<ExecuteGameCommandResponse>(response);
  }

  return {
    async createSession(input) {
      const response = await fetchImpl(joinUrl(baseUrl, '/sessions'), {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ displayName: input.displayName })
      });
      return decodeJson<SessionProjectionResponse>(response);
    },

    async joinSession(input) {
      const request: JoinSessionRequest = { displayName: input.displayName };
      const response = await fetchImpl(joinUrl(baseUrl, `/sessions/${encodeURIComponent(input.sessionId)}/join`), {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(request)
      });
      return decodeJson<SessionProjectionResponse>(response);
    },

    async getProjection(credential) {
      const response = await fetchImpl(joinUrl(baseUrl, `/sessions/${encodeURIComponent(credential.sessionId)}/projection`), {
        method: 'GET',
        headers: authHeaders(credential)
      });
      const payload = await decodeJson<{ readonly projection: GameViewProjection }>(response);
      return payload.projection;
    },

    async startGame(credential) {
      const response = await fetchImpl(joinUrl(baseUrl, `/sessions/${encodeURIComponent(credential.sessionId)}/start`), {
        method: 'POST',
        headers: authHeaders(credential)
      });
      const payload = await decodeJson<{ readonly projection: GameViewProjection }>(response);
      return payload.projection;
    },

    drawCard(credential, expectedRevision, commandId) {
      return command(credential, { commandId, expectedRevision, command: { kind: 'DRAW_CARD' } });
    },

    playCard(credential, expectedRevision, cardInstanceId, commandId) {
      return command(credential, { commandId, expectedRevision, command: { kind: 'PLAY_CARD', cardInstanceId } });
    }
  };
}
