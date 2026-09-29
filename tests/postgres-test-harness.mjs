import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

import { applyCanonicalMigrations } from '../db/migrate.mjs';

export async function withIsolatedP6Database(connectionString, run) {
  const schema = `canonical_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new Pool({ connectionString });
  let pool = null;

  try {
    await admin.query(`create schema "${schema}"`);
    pool = new Pool({ connectionString, options: `-c search_path=${schema}` });
    await applyCanonicalMigrations(pool);
    await pool.query(
      `insert into users(id, display_name) values
       ('principal-1', 'Principal One'),
       ('principal-2', 'Principal Two')
       on conflict (id) do nothing`
    );
    return await run(pool);
  } finally {
    if (pool !== null) await pool.end();
    try { await admin.query(`drop schema if exists "${schema}" cascade`); }
    finally { await admin.end(); }
  }
}
