import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Pool } from 'pg';
import type { GameCommandPayload } from '@cribbit/contracts';
import { canonicalDeckInstanceIds, resolvePlayableEngineCommand } from '@cribbit/game-engine';
import { createIdentityStore, createPostgresCommandTransactionPort, createPostgresSessionStore, type IdentityStore } from '@cribbit/database';
import { createGameCommandService } from './command-service.ts';
import { createMemoryIdentityStore } from './memory-identity-store.ts';
import { createMemoryCommandTransactionPort, createMemorySessionStore } from './memory-session-store.ts';
import {
  AuthContextError,
  clearSessionCookie,
  resolveAuthContext,
  sessionTokenFromRequest,
  setSessionCookie,
  telegramInitDataFromRequest
} from './auth-context.ts';
import {
  AuthServiceError,
  claimTelegramLink,
  ensureTelegramAccount,
  issueTelegramLinkCode,
  loginWebAccount,
  registerWebAccount
} from './auth-routes.ts';

export interface NodeApiRuntimeDependencies {
  readonly databaseUrl: string;
  readonly checkConnection: (connectionString: string) => Promise<void>;
  readonly pool?: Pool;
  readonly telegramBotToken?: string;
  readonly telegramMaxAgeSeconds?: number;
  readonly sessionSecret?: string;
  readonly frontendOrigins?: readonly string[];
  readonly secureCookies?: boolean;
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

function safeDisplayName(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'displayName' in body && typeof body.displayName === 'string') {
    const cleaned = body.displayName.trim().slice(0, 32);
    if (cleaned) return cleaned;
  }
  return fallback;
}

function bodyString(body: unknown, key: string): string {
  if (!body || typeof body !== 'object' || !(key in body) || typeof (body as Record<string, unknown>)[key] !== 'string') return '';
  return String((body as Record<string, unknown>)[key]);
}

function stableFingerprint(command: GameCommandPayload): string {
  return JSON.stringify(command, Object.keys(command).sort());
}

function shuffledDeck(): readonly string[] {
  const deck = [...canonicalDeckInstanceIds()];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [deck[index], deck[target]] = [deck[target], deck[index]];
  }
  return deck;
}

function sessionRoute(pathname: string): { sessionId: string; action: 'join' | 'projection' | 'start' | 'commands' } | null {
  const match = /^\/api\/sessions\/([^/]+)\/(join|projection|start|commands)$/.exec(pathname);
  if (!match) return null;
  return { sessionId: decodeURIComponent(match[1]), action: match[2] as 'join' | 'projection' | 'start' | 'commands' };
}

function applyCors(request: IncomingMessage, response: ServerResponse, allowedOrigins: readonly string[]): boolean {
  const origin = typeof request.headers.origin === 'string' ? request.headers.origin : '';
  if (!origin) return true;
  if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) return false;
  response.setHeader('access-control-allow-origin', origin);
  response.setHeader('access-control-allow-credentials', 'true');
  response.setHeader('access-control-allow-headers', 'content-type, authorization');
  response.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  response.setHeader('vary', 'Origin');
  return true;
}

export function createNodeApiHandler({
  databaseUrl,
  checkConnection,
  pool: providedPool,
  telegramBotToken = '',
  telegramMaxAgeSeconds = 3600,
  sessionSecret = 'cribbit-local-link-secret',
  frontendOrigins = [],
  secureCookies = false
}: NodeApiRuntimeDependencies) {
  let pool = providedPool ?? null;
  const memoryStore = createMemorySessionStore();
  const memoryTransactions = createMemoryCommandTransactionPort();
  const memoryIdentity = createMemoryIdentityStore();
  const useMemory = !providedPool && !databaseUrl;
  const requirePool = (): Pool => {
    if (pool) return pool;
    if (!databaseUrl) throw new Error('DATABASE_URL is required for game API routes');
    pool = new Pool({ connectionString: databaseUrl });
    return pool;
  };
  const sessionStore = () => (useMemory ? memoryStore : createPostgresSessionStore(requirePool()));
  const transactions = () => (useMemory ? memoryTransactions : createPostgresCommandTransactionPort(requirePool()));
  const identityStore = (): IdentityStore => (useMemory ? memoryIdentity : createIdentityStore(requirePool()));

  const authContext = (request: IncomingMessage) => resolveAuthContext({
    request,
    identity: identityStore(),
    telegramBotToken,
    telegramMaxAgeSeconds
  });

  return async function nodeApiHandler(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const pathname = url.pathname;

    if (!applyCors(request, response, frontendOrigins)) {
      if (request.method === 'OPTIONS') { response.statusCode = 403; response.end(); return; }
    }

    if (request.method === 'OPTIONS') { response.statusCode = 204; response.end(); return; }

    try {
      if (request.method === 'GET' && pathname === '/__infra/db-health') {
        try { await checkConnection(databaseUrl); response.statusCode = 204; }
        catch { response.statusCode = 503; }
        response.end();
        return;
      }

      if (request.method === 'GET' && pathname === '/api/auth/me') {
        const context = await authContext(request);
        sendJson(response, 200, context ? { user: context.user, transports: context.transports } : null);
        return;
      }

      if (request.method === 'GET' && pathname === '/api/auth/login-methods') {
        const context = await authContext(request);
        if (!context) {
          sendJson(response, 401, { ok: false, code: 'AUTH_REQUIRED' });
          return;
        }
        const methods = await identityStore().findLoginMethods(context.userId);
        if (!methods) {
          sendJson(response, 404, { ok: false, code: 'USER_NOT_FOUND' });
          return;
        }
        let suggestedWebLoginUsername: string | null = null;
        if (!methods.web && methods.telegram?.username) {
          const candidate = methods.telegram.username.trim().toLowerCase();
          if (/^[a-z0-9_.-]{3,48}$/.test(candidate)) {
            const existing = await identityStore().findWebCredential(candidate);
            if (!existing || existing.userId === context.userId) suggestedWebLoginUsername = candidate;
          }
        }
        sendJson(response, 200, { ...methods, suggestedWebLoginUsername });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/auth/web/guest') {
        const existing = await authContext(request);
        if (existing) { sendJson(response, 200, { user: existing.user }); return; }
        const body = await readJson(request);
        const user = await identityStore().createAnonymousUser(safeDisplayName(body, 'Web Player'));
        const token = await identityStore().createAuthSession(user.id, 'web_guest');
        setSessionCookie(response, token, secureCookies);
        sendJson(response, 201, { user });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/auth/web/register') {
        const current = await authContext(request);
        const body = await readJson(request);
        const result = await registerWebAccount({
          identity: identityStore(),
          currentUserId: current?.userId ?? null,
          loginUsername: bodyString(body, 'loginUsername'),
          password: bodyString(body, 'password'),
          displayName: safeDisplayName(body, current?.user.displayName ?? 'Web Player')
        });
        setSessionCookie(response, result.sessionToken, secureCookies);
        sendJson(response, 201, { user: result.user });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/auth/web/login') {
        const body = await readJson(request);
        const result = await loginWebAccount({
          identity: identityStore(),
          loginUsername: bodyString(body, 'loginUsername'),
          password: bodyString(body, 'password')
        });
        setSessionCookie(response, result.sessionToken, secureCookies);
        sendJson(response, 200, { user: result.user });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/auth/logout') {
        const token = sessionTokenFromRequest(request);
        if (token) await identityStore().revokeAuthSession(token);
        clearSessionCookie(response, secureCookies);
        sendJson(response, 200, { ok: true });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/auth/telegram/account') {
        const user = await ensureTelegramAccount({
          identity: identityStore(),
          initData: telegramInitDataFromRequest(request),
          botToken: telegramBotToken,
          maxAgeSeconds: telegramMaxAgeSeconds
        });
        sendJson(response, 200, { user });
        return;
      }

      if (request.method === 'POST' && pathname === '/api/auth/telegram-link/code') {
        const context = await authContext(request);
        if (!context || !context.transports.includes('web')) {
          sendJson(response, 401, { ok: false, code: 'WEB_AUTH_REQUIRED' });
          return;
        }
        sendJson(response, 200, issueTelegramLinkCode(context.userId, sessionSecret));
        return;
      }

      if (request.method === 'POST' && pathname === '/api/auth/telegram-link/claim') {
        const body = await readJson(request);
        const user = await claimTelegramLink({
          identity: identityStore(),
          initData: telegramInitDataFromRequest(request),
          botToken: telegramBotToken,
          maxAgeSeconds: telegramMaxAgeSeconds,
          code: bodyString(body, 'code'),
          secret: sessionSecret
        });
        sendJson(response, 200, { ok: true, user });
        return;
      }

      const requireUser = async () => {
        const context = await authContext(request);
        if (!context) throw new AuthContextError(401, 'AUTH_REQUIRED', 'Authentication required');
        return context;
      };

      if (request.method === 'POST' && pathname === '/api/sessions') {
        const context = await requireUser();
        const body = await readJson(request);
        const sessionId = randomUUID().replaceAll('-', '').slice(0, 8);
        const playerId = 'p1';
        const displayName = safeDisplayName(body, context.user.displayName);
        const created = await sessionStore().createSession({ sessionId, principalId: context.userId, playerId, displayName });
        sendJson(response, 201, {
          player: { sessionId, playerId, displayName },
          projection: created.projection
        });
        return;
      }

      const route = sessionRoute(pathname);
      if (route && request.method === 'POST' && route.action === 'join') {
        const context = await requireUser();
        const body = await readJson(request);
        const existingCount = await sessionStore().memberCount(route.sessionId);
        const playerId = `p${existingCount + 1}`;
        const displayName = safeDisplayName(body, context.user.displayName);
        const joined = await sessionStore().joinSession({ sessionId: route.sessionId, principalId: context.userId, playerId, displayName });
        if (joined.status === 'rejected') { sendJson(response, 400, { ok: false, code: joined.reason }); return; }
        sendJson(response, 200, {
          player: { sessionId: route.sessionId, playerId, displayName },
          projection: joined.value.projection
        });
        return;
      }

      if (route && request.method === 'GET' && route.action === 'projection') {
        const context = await requireUser();
        const loaded = await sessionStore().loadForPrincipal(route.sessionId, context.userId);
        if (!loaded) { sendJson(response, 403, { ok: false, code: 'NOT_SESSION_MEMBER' }); return; }
        sendJson(response, 200, { projection: loaded.projection });
        return;
      }

      if (route && request.method === 'POST' && route.action === 'start') {
        const context = await requireUser();
        const started = await sessionStore().startSession({ sessionId: route.sessionId, principalId: context.userId, shuffledDeck: shuffledDeck() });
        if (started.status === 'rejected') { sendJson(response, 400, { ok: false, code: started.reason }); return; }
        sendJson(response, 200, { projection: started.value.projection });
        return;
      }

      if (route && request.method === 'POST' && route.action === 'commands') {
        const context = await requireUser();
        const body = await readJson(request) as { commandId?: string; expectedRevision?: number; command?: GameCommandPayload };
        if (!body.command || typeof body.expectedRevision !== 'number') {
          sendJson(response, 400, { ok: false, code: 'INVALID_COMMAND_ENVELOPE' });
          return;
        }
        const commandId = body.commandId ?? randomUUID();
        const service = createGameCommandService({
          auth: { async authenticate(authInput) {
            return typeof authInput === 'object' && authInput !== null && 'userId' in authInput && typeof authInput.userId === 'string'
              ? { principalId: authInput.userId }
              : null;
          } },
          transactions: transactions(),
          resolver: { async resolve(input) { return resolvePlayableEngineCommand({ actorPlayerId: input.actorPlayerId, command: input.command }); } }
        });
        const result = await service.execute({
          authInput: { userId: context.userId },
          envelope: {
            commandId,
            commandFingerprint: stableFingerprint(body.command),
            sessionId: route.sessionId,
            expectedRevision: body.expectedRevision,
            command: body.command
          }
        });
        if (result.status === 'accepted') {
          sendJson(response, 200, { ok: true, receipt: { commandId: result.receipt.commandId, acceptedRevision: result.receipt.acceptedRevision }, projection: result.projection });
          return;
        }
        sendJson(response, result.code === 'STALE_REVISION' ? 409 : 400, { ok: false, code: result.code, reason: result.reason, currentRevision: result.currentRevision });
        return;
      }

      response.statusCode = 404;
      response.end();
    } catch (error) {
      if (error instanceof AuthContextError || error instanceof AuthServiceError) {
        sendJson(response, error.status, { ok: false, code: error.code, reason: error.message });
        return;
      }
      sendJson(response, 500, { ok: false, code: 'SERVER_ERROR', reason: error instanceof Error ? error.message : 'Unknown error' });
    }
  };
}
