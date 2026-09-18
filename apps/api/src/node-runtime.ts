import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Pool } from 'pg';
import type { GameCommandPayload } from '@cribbit/contracts';
import {
  canonicalDeckInstanceIds,
  resolvePlayableEngineCommand
} from '@cribbit/game-engine';
import {
  createPostgresCommandTransactionPort,
  createPostgresSessionStore
} from '@cribbit/database';

import { createGameCommandService } from './command-service.ts';
import {
  createMemoryCommandTransactionPort,
  createMemorySessionStore
} from './memory-session-store.ts';

export interface NodeApiRuntimeDependencies {
  readonly databaseUrl: string;
  readonly checkConnection: (connectionString: string) => Promise<void>;
  readonly pool?: Pool;
}

function credentialFrom(request: IncomingMessage): string | null {
  const explicit = request.headers['x-cribbit-credential'];
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim();
  const auth = request.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice('Bearer '.length).trim() || null;
  return null;
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
  response.setHeader('access-control-allow-origin', '*');
  response.setHeader('access-control-allow-headers', 'content-type, x-cribbit-credential, authorization');
  response.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  response.end(JSON.stringify(body));
}

function safeDisplayName(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'displayName' in body && typeof body.displayName === 'string') {
    const cleaned = body.displayName.trim().slice(0, 32);
    if (cleaned) return cleaned;
  }
  return fallback;
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

export function createNodeApiHandler({
  databaseUrl,
  checkConnection,
  pool: providedPool
}: NodeApiRuntimeDependencies) {
  let pool = providedPool ?? null;
  const memoryStore = createMemorySessionStore();
  const memoryTransactions = createMemoryCommandTransactionPort();
  const useMemory = !providedPool && !databaseUrl;
  const requirePool = (): Pool => {
    if (pool) return pool;
    if (!databaseUrl) throw new Error('DATABASE_URL is required for game API routes');
    pool = new Pool({ connectionString: databaseUrl });
    return pool;
  };
  const sessionStore = () => (useMemory ? memoryStore : createPostgresSessionStore(requirePool()));
  const transactions = () => (useMemory ? memoryTransactions : createPostgresCommandTransactionPort(requirePool()));

  return async function nodeApiHandler(
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const pathname = url.pathname;

    if (request.method === 'OPTIONS') {
      response.statusCode = 204;
      response.setHeader('access-control-allow-origin', '*');
      response.setHeader('access-control-allow-headers', 'content-type, x-cribbit-credential, authorization');
      response.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
      response.end();
      return;
    }

    if (request.method === 'GET' && pathname === '/__infra/db-health') {
      try {
        await checkConnection(databaseUrl);
        response.statusCode = 204;
      } catch {
        response.statusCode = 503;
      }
      response.end();
      return;
    }

    try {
      if (request.method === 'POST' && pathname === '/api/sessions') {
        const body = await readJson(request);
        const sessionId = randomUUID().slice(0, 8);
        const playerId = 'p1';
        const credential = randomUUID();
        const displayName = safeDisplayName(body, 'Player 1');
        const created = await sessionStore().createSession({ sessionId, principalId: credential, playerId, displayName });
        sendJson(response, 201, {
          credential: { sessionId, playerId, displayName, credential },
          projection: created.projection
        });
        return;
      }

      const route = sessionRoute(pathname);
      if (route && request.method === 'POST' && route.action === 'join') {
        const body = await readJson(request);
        const credential = randomUUID();
        const existingCount = useMemory
          ? memoryStore.memberCount(route.sessionId)
          : Number((await requirePool().query<{ count: string }>(
            `select count(*) from game_session_memberships where session_id = $1`,
            [route.sessionId]
          )).rows[0]?.count ?? 0);
        const playerId = `p${existingCount + 1}`;
        const displayName = safeDisplayName(body, `Player ${playerId.slice(1)}`);
        const joined = await sessionStore().joinSession({ sessionId: route.sessionId, principalId: credential, playerId, displayName });
        if (joined.status === 'rejected') { sendJson(response, 400, { ok: false, code: joined.reason }); return; }
        sendJson(response, 200, {
          credential: { sessionId: route.sessionId, playerId, displayName, credential },
          projection: joined.value.projection
        });
        return;
      }

      if (route && request.method === 'GET' && route.action === 'projection') {
        const credential = credentialFrom(request);
        if (!credential) { sendJson(response, 401, { ok: false, code: 'UNAUTHENTICATED' }); return; }
        const loaded = await sessionStore().loadForPrincipal(route.sessionId, credential);
        if (!loaded) { sendJson(response, 403, { ok: false, code: 'NOT_SESSION_MEMBER' }); return; }
        sendJson(response, 200, { projection: loaded.projection });
        return;
      }

      if (route && request.method === 'POST' && route.action === 'start') {
        const credential = credentialFrom(request);
        if (!credential) { sendJson(response, 401, { ok: false, code: 'UNAUTHENTICATED' }); return; }
        const started = await sessionStore().startSession({
          sessionId: route.sessionId,
          principalId: credential,
          shuffledDeck: shuffledDeck()
        });
        if (started.status === 'rejected') { sendJson(response, 400, { ok: false, code: started.reason }); return; }
        sendJson(response, 200, { projection: started.value.projection });
        return;
      }

      if (route && request.method === 'POST' && route.action === 'commands') {
        const credential = credentialFrom(request);
        if (!credential) { sendJson(response, 401, { ok: false, code: 'UNAUTHENTICATED' }); return; }
        const body = await readJson(request) as { commandId?: string; expectedRevision?: number; command?: GameCommandPayload };
        if (!body.command || typeof body.expectedRevision !== 'number') {
          sendJson(response, 400, { ok: false, code: 'INVALID_COMMAND_ENVELOPE' });
          return;
        }
        const commandId = body.commandId ?? randomUUID();
        const service = createGameCommandService({
          auth: { async authenticate(authInput) { return typeof authInput === 'string' && authInput ? { principalId: authInput } : null; } },
          transactions: transactions(),
          resolver: { async resolve(input) { return resolvePlayableEngineCommand({ actorPlayerId: input.actorPlayerId, command: input.command }); } }
        });
        const result = await service.execute({
          authInput: credential,
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
      sendJson(response, 500, { ok: false, code: 'SERVER_ERROR', reason: error instanceof Error ? error.message : 'Unknown error' });
    }
  };
}
