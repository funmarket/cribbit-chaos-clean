import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

import { applyP6Migration } from '../packages/database/src/index.ts';

export async function withIsolatedP6Database(connectionString, run) {
  const schema = `p6_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new Pool({ connectionString });
  let pool = null;

  try {
    await admin.query(`create schema "${schema}"`);
    pool = new Pool({
      connectionString,
      options: `-c search_path=${schema}`
    });
    await applyP6Migration(pool);
    return await run(pool);
  } finally {
    if (pool !== null) await pool.end();
    try {
      await admin.query(`drop schema if exists "${schema}" cascade`);
    } finally {
      await admin.end();
    }
  }
}
