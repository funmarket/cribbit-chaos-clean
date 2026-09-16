import { checkPostgresConnection } from '@cribbit/database';

export interface CloudflareApiEnv {
  readonly HYPERDRIVE: {
    readonly connectionString: string;
  };
  readonly APP_ENV: 'staging' | 'production';
}

export const cloudflareApiWorker = {
  async fetch(request: Request, env: CloudflareApiEnv): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.pathname !== '/__infra/db-health') {
      return new Response(null, { status: 404 });
    }

    try {
      await checkPostgresConnection(env.HYPERDRIVE.connectionString);
      return new Response(null, { status: 204 });
    } catch {
      return new Response(null, { status: 503 });
    }
  }
};
