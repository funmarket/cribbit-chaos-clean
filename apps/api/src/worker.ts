import * as api from './main.ts';

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8'
} as const;

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init.headers ?? {})
    }
  });
}

const apiExports = Object.keys(api).sort();

const worker = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({
        ok: true,
        service: 'cribbit-chaos-api',
        surface: 'cloudflare-worker',
        gameplay: 'not-enabled'
      });
    }

    return jsonResponse(
      {
        error: 'API_WORKER_NOT_MIGRATED',
        message: 'Cloudflare API worker entrypoint exists, but gameplay HTTP routes are not enabled yet.'
      },
      { status: 503 }
    );
  }
};

void apiExports;

export default worker;
