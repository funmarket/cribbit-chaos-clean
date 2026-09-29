import { createServer } from 'node:http';
import { Pool } from 'pg';
import { checkPostgresConnection } from '@cribbit/database';
import { createNodeApiHandler } from './node-runtime.ts';
import { startDeadlineWorker } from './runtime-workers.ts';

const port = Number(process.env.PORT ?? '3000');
if (!Number.isInteger(port) || port <= 0 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535');

const frontendOrigins = (process.env.FRONTEND_ORIGINS ?? '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const databaseUrl = process.env.DATABASE_URL ?? '';
const pool = new Pool({ connectionString: databaseUrl });
const server = createServer(
  createNodeApiHandler({
    databaseUrl,
    checkConnection: checkPostgresConnection,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    telegramMaxAgeSeconds: Number(process.env.TELEGRAM_INITDATA_MAX_AGE_SECONDS ?? '3600'),
    sessionSecret: process.env.SESSION_SECRET ?? '',
    frontendOrigins,
    secureCookies: process.env.NODE_ENV === 'production',
    production: process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production',
    pool
  })
).listen(port, '0.0.0.0');

if (databaseUrl) {
  startDeadlineWorker({ pool, onError: (error) => console.error('Deadline worker failed', error) });
}

export { createGameCommandService } from './command-service.ts';
export type { GameCommandService } from './command-service.ts';
export { createOutboxWorker } from './outbox-worker.ts';
export type { OutboxClaim, OutboxProjectionSource, OutboxStorePort, OutboxWorker, RealtimePublication, RealtimePublisherPort } from './outbox-worker.ts';
export { createDeadlineWorker } from './deadline-worker.ts';
export type { DeadlineJobClaim, DeadlineStorePort, DeadlineWorker } from './deadline-worker.ts';
export type {
  AcceptedCommit,
  AuthenticatedPrincipal,
  AuthenticationPort,
  CommandSessionTransaction,
  CommandTransactionPort,
  EngineCommandResolver,
  GameCommandServicePorts,
  ResolvedEngineCommand,
  SessionMembership
} from './ports.ts';
