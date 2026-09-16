import { createServer } from 'node:http';
import { checkPostgresConnection } from '@cribbit/database';
import { createNodeApiHandler } from './node-runtime.ts';

const port = Number(process.env.PORT ?? '3000');
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

createServer(
  createNodeApiHandler({
    databaseUrl: process.env.DATABASE_URL ?? '',
    checkConnection: checkPostgresConnection
  })
).listen(port, '0.0.0.0');

export { createGameCommandService } from './command-service.ts';
export type { GameCommandService } from './command-service.ts';
export { createOutboxWorker } from './outbox-worker.ts';
export type {
  OutboxClaim,
  OutboxProjectionSource,
  OutboxStorePort,
  OutboxWorker,
  RealtimePublication,
  RealtimePublisherPort
} from './outbox-worker.ts';
export { createDeadlineWorker } from './deadline-worker.ts';
export type {
  DeadlineJobClaim,
  DeadlineStorePort,
  DeadlineWorker
} from './deadline-worker.ts';
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
