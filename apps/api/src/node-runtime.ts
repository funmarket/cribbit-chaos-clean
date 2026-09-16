import type { IncomingMessage, ServerResponse } from 'node:http';

export interface NodeApiRuntimeDependencies {
  readonly databaseUrl: string;
  readonly checkConnection: (connectionString: string) => Promise<void>;
}

export function createNodeApiHandler({
  databaseUrl,
  checkConnection
}: NodeApiRuntimeDependencies) {
  return async function nodeApiHandler(
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;

    if (request.method !== 'GET' || pathname !== '/__infra/db-health') {
      response.statusCode = 404;
      response.end();
      return;
    }

    try {
      await checkConnection(databaseUrl);
      response.statusCode = 204;
    } catch {
      response.statusCode = 503;
    }
    response.end();
  };
}
