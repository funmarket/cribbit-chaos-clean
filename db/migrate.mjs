import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const { Pool } = pg;

const MIGRATIONS_DIR = fileURLToPath(new URL('./migrations/', import.meta.url));
const APPROVED_MIGRATIONS = Object.freeze([
  '001_identity.sql',
  '002_game_core.sql'
]);

export const EXPECTED_CANONICAL_TABLES = Object.freeze([
  'users',
  'user_identities',
  'web_credentials',
  'auth_sessions',
  'game_sessions',
  'game_session_memberships',
  'accepted_command_receipts',
  'game_outbox',
  'game_deadline_jobs'
]);

export async function readCanonicalMigrations() {
  const discovered = (await readdir(MIGRATIONS_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));

  if (
    discovered.length !== APPROVED_MIGRATIONS.length ||
    discovered.some((name, index) => name !== APPROVED_MIGRATIONS[index])
  ) {
    throw new Error(
      `Unexpected canonical migration set: ${discovered.join(', ') || '(none)'}`
    );
  }

  return Promise.all(
    discovered.map(async (name) => {
      const sql = await readFile(path.join(MIGRATIONS_DIR, name), 'utf8');
      if (!sql.trim()) throw new Error(`Canonical migration is empty: ${name}`);
      return { name, sql };
    })
  );
}

export async function applyCanonicalMigrations(client) {
  const migrations = await readCanonicalMigrations();
  for (const migration of migrations) {
    await client.query(migration.sql);
  }
  return migrations.map((migration) => migration.name);
}

export async function runCanonicalMigrations(databaseUrl = process.env.DATABASE_URL ?? '') {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to apply canonical migrations');
  }

  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const client = await pool.connect();

  try {
    await client.query('begin');
    const appliedMigrations = await applyCanonicalMigrations(client);

    const verification = await client.query(
      `select table_name
         from information_schema.tables
        where table_schema = 'public'
          and table_name = any($1::text[])`,
      [EXPECTED_CANONICAL_TABLES]
    );
    const observedTables = new Set(verification.rows.map((row) => row.table_name));
    const missingTables = EXPECTED_CANONICAL_TABLES.filter(
      (tableName) => !observedTables.has(tableName)
    );
    if (missingTables.length > 0) {
      throw new Error(
        `Canonical migration verification failed; missing tables: ${missingTables.join(', ')}`
      );
    }

    await client.query('commit');
    console.log(
      `Canonical migrations applied in order (${appliedMigrations.join(', ')}) and verified (${EXPECTED_CANONICAL_TABLES.length} tables).`
    );
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

const invokedAsCli =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedAsCli) {
  await runCanonicalMigrations();
}
