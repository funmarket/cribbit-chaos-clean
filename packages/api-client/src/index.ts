import type {
  AuthContextView,
  AuthenticatedUser,
  DrawCardCommandPayload,
  ExecuteGameCommandResponse,
  GameViewProjection,
  JoinSessionRequest,
  LoginMethodsView,
  PlayCardCommandPayload,
  SessionProjectionResponse,
  TelegramLinkCodeResponse,
  WebLoginRequest,
  WebRegisterRequest
} from '@cribbit/contracts';

export interface CribbitApiClientOptions {
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
  readonly credentials?: RequestCredentials;
  readonly getAuthHeaders?: () => HeadersInit;
}

export class CribbitApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly payload: unknown;

  constructor(input: { readonly status: number; readonly code?: string | null; readonly payload: unknown }) {
    super(input.code ? `Cribbit API rejected request: ${input.code}` : `Cribbit API request failed with ${input.status}`);
    this.name = 'CribbitApiError';
    this.status = input.status;
    this.code = input.code ?? null;
    this.payload = input.payload;
  }
}

export interface CribbitApiClient {
  getCurrentUser(): Promise<AuthContextView | null>;
  getLoginMethods(): Promise<LoginMethodsView>;
  ensureWebGuest(input: { readonly displayName: string }): Promise<AuthenticatedUser>;
  registerWebAccount(input: WebRegisterRequest): Promise<AuthenticatedUser>;
  loginWebAccount(input: WebLoginRequest): Promise<AuthenticatedUser>;
  ensureTelegramAccount(): Promise<AuthenticatedUser>;
  createTelegramLinkCode(): Promise<TelegramLinkCodeResponse>;
  claimTelegramLink(code: string): Promise<{ readonly ok: true; readonly user: AuthenticatedUser }>;
  logout(): Promise<{ readonly ok: true }>;
  createSession(input: { readonly displayName: string }): Promise<SessionProjectionResponse>;
  createSimulation(): Promise<SessionProjectionResponse>;
  joinSession(input: { readonly sessionId: string; readonly displayName: string }): Promise<SessionProjectionResponse>;
  getProjection(sessionId: string): Promise<GameViewProjection>;
  startGame(sessionId: string): Promise<GameViewProjection>;
  drawCard(sessionId: string, expectedRevision: number, commandId?: string): Promise<ExecuteGameCommandResponse>;
  playCard(sessionId: string, expectedRevision: number, cardInstanceId: string, commandId?: string): Promise<ExecuteGameCommandResponse>;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function decodeJson<T>(response: Response): Promise<T> {
  const payload = await response.json() as T;
  if (!response.ok) {
    const code = payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string'
      ? payload.code
      : null;
    throw new CribbitApiError({ status: response.status, code, payload });
  }
  return payload;
}

export function createCribbitApiClient(options: CribbitApiClientOptions = {}): CribbitApiClient {
  const baseUrl = options.baseUrl ?? '/api';
  const fetchImpl = options.fetchImpl ?? fetch;
  const credentials = options.credentials ?? 'include';
  const dynamicHeaders = () => options.getAuthHeaders?.() ?? {};

  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const headers = new Headers(dynamicHeaders());
    new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    const response = await fetchImpl(joinUrl(baseUrl, path), { ...init, credentials, headers });
    return decodeJson<T>(response);
  };

  async function command(sessionId: string, body: { readonly commandId?: string; readonly expectedRevision: number; readonly command: DrawCardCommandPayload | PlayCardCommandPayload }): Promise<ExecuteGameCommandResponse> {
    return request<ExecuteGameCommandResponse>(`/sessions/${encodeURIComponent(sessionId)}/commands`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  return {
    getCurrentUser: () => request<AuthContextView | null>('/auth/me'),
    getLoginMethods: () => request<LoginMethodsView>('/auth/login-methods'),
    ensureWebGuest: (input) => request<{ readonly user: AuthenticatedUser }>('/auth/web/guest', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input)
    }).then((payload) => payload.user),
    registerWebAccount: (input) => request<{ readonly user: AuthenticatedUser }>('/auth/web/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input)
    }).then((payload) => payload.user),
    loginWebAccount: (input) => request<{ readonly user: AuthenticatedUser }>('/auth/web/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input)
    }).then((payload) => payload.user),
    ensureTelegramAccount: () => request<{ readonly user: AuthenticatedUser }>('/auth/telegram/account', {
      method: 'POST'
    }).then((payload) => payload.user),
    createTelegramLinkCode: () => request<TelegramLinkCodeResponse>('/auth/telegram-link/code', {
      method: 'POST'
    }),
    claimTelegramLink: (code) => request<{ readonly ok: true; readonly user: AuthenticatedUser }>('/auth/telegram-link/claim', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code })
    }),
    logout: () => request<{ readonly ok: true }>('/auth/logout', { method: 'POST' }),

    async createSession(input) {
      return request<SessionProjectionResponse>('/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName: input.displayName })
      });
    },

    async createSimulation() {
      return request<SessionProjectionResponse>('/simulations', {
        method: 'POST'
      });
    },

    async joinSession(input) {
      const body: JoinSessionRequest = { displayName: input.displayName };
      return request<SessionProjectionResponse>(`/sessions/${encodeURIComponent(input.sessionId)}/join`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      });
    },

    async getProjection(sessionId) {
      const payload = await request<{ readonly projection: GameViewProjection }>(`/sessions/${encodeURIComponent(sessionId)}/projection`);
      return payload.projection;
    },

    async startGame(sessionId) {
      const payload = await request<{ readonly projection: GameViewProjection }>(`/sessions/${encodeURIComponent(sessionId)}/start`, {
        method: 'POST'
      });
      return payload.projection;
    },

    drawCard(sessionId, expectedRevision, commandId) {
      return command(sessionId, {
        ...(commandId ? { commandId } : {}),
        expectedRevision,
        command: { kind: 'DRAW_CARD' }
      });
    },

    playCard(sessionId, expectedRevision, cardInstanceId, commandId) {
      return command(sessionId, {
        ...(commandId ? { commandId } : {}),
        expectedRevision,
        command: { kind: 'PLAY_CARD', cardInstanceId }
      });
    }
  };
}
