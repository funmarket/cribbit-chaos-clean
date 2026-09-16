import { Client } from 'pg';

export async function checkPostgresConnection(
  connectionString: string
): Promise<void> {
  if (connectionString.length === 0) {
    throw new Error('PostgreSQL connection string must not be empty');
  }

  const client = new Client({ connectionString });
  try {
    await client.connect();
    const result = await client.query<{ ok: number }>('select 1 as ok');
    if (result.rows[0]?.ok !== 1) {
      throw new Error('PostgreSQL health query returned an unexpected result');
    }
  } finally {
    await client.end();
  }
}
