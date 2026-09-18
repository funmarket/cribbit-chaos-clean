import pg from 'pg';

const { Pool } = pg;

export interface PostgresPoolOptions {
  readonly databaseUrl?: string;
  readonly max?: number;
}

export function createPostgresPool(options: PostgresPoolOptions = {}): pg.Pool | null {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL ?? '';
  if (!databaseUrl) return null;
  return new Pool({
    connectionString: databaseUrl,
    max: options.max ?? Number(process.env.PGPOOL_MAX ?? 10)
  });
}

export async function withPostgresTransaction<T>(
  pool: pg.Pool,
  run: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await run(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
