import test from 'node:test';
import assert from 'node:assert/strict';

import { checkPostgresConnection } from '../packages/database/src/index.ts';

const connectionString = process.env.POSTGRES_URL;
const dbTest = connectionString ? test : test.skip;

dbTest('P6.5 PostgreSQL health probe opens and closes a real connection', async () => {
  await assert.doesNotReject(() => checkPostgresConnection(connectionString));
});

test('P6.5 PostgreSQL health probe rejects an empty connection string', async () => {
  await assert.rejects(
    () => checkPostgresConnection(''),
    /PostgreSQL connection string must not be empty/
  );
});
