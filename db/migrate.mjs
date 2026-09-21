import pg from 'pg';

import { applyCanonicalMigrations } from '../packages/database/src/index.ts';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL ?? '';

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to apply canonical migrations');
}

const expectedTables = [
  'users',
  'user_identities',
  'web_credentials',
  'auth_sessions',
  'game_sessions',
  'game_session_memberships',
  'accepted_command_receipts',
  'game_outbox',
  'game_deadline_jobs'
];

const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const client = await pool.connect();

try {
  await client.query('begin');
  await applyCanonicalMigrations(client);

  const verification = await client.query(
    `select table_name
       from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1::text[])`,
    [expectedTables]
  );
  const observedTables = new Set(verification.rows.map((row) => row.table_name));
  const missingTables = expectedTables.filter((tableName) => !observedTables.has(tableName));
  if (missingTables.length > 0) {
    throw new Error(`Canonical migration verification failed; missing tables: ${missingTables.join(', ')}`);
  }

  await client.query('commit');
  console.log(`Canonical migrations applied and verified (${expectedTables.length} tables).`);
} catch (error) {
  await client.query('rollback');
  throw error;
} finally {
  client.release();
  await pool.end();
}
