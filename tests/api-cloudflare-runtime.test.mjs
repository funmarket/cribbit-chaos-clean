import test from 'node:test';
import assert from 'node:assert/strict';

import worker from '../apps/api/src/main.ts';

const connectionString = process.env.POSTGRES_URL;
const dbTest = connectionString ? test : test.skip;

dbTest('P6.5 database health endpoint reaches PostgreSQL without exposing data', async () => {
  const response = await worker.fetch(
    new Request('https://worker.invalid/__infra/db-health'),
    {
      APP_ENV: 'staging',
      HYPERDRIVE: { connectionString }
    }
  );

  assert.equal(response.status, 204);
  assert.equal(await response.text(), '');
});

test('P6.5 runtime exposes no gameplay or catch-all route', async () => {
  const response = await worker.fetch(
    new Request('https://worker.invalid/game'),
    {
      APP_ENV: 'staging',
      HYPERDRIVE: { connectionString: 'unused' }
    }
  );

  assert.equal(response.status, 404);
});
