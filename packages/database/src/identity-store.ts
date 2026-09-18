import { createHash, randomBytes } from 'node:crypto';
import type pg from 'pg';
import { withPostgresTransaction } from './postgres.ts';

export interface AppUserRecord {
  readonly id: string;
  readonly displayName: string;
  readonly displayUsername?: string;
}

export interface TelegramIdentityInput {
  readonly telegramId: string;
  readonly displayName: string;
  readonly username?: string;
  readonly payload?: unknown;
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function normalizeDisplayName(value: string): string {
  const displayName = value.trim().slice(0, 40);
  if (!displayName) throw new Error('Display name is required');
  return displayName;
}

export function createIdentityStore(pool: pg.Pool) {
  return {
    async resolveOrCreateTelegramUser(input: TelegramIdentityInput): Promise<AppUserRecord> {
      const displayName = normalizeDisplayName(input.displayName);
      return withPostgresTransaction(pool, async (client) => {
        await client.query('select pg_advisory_xact_lock(hashtext($1))', [`telegram:${input.telegramId}`]);
        const existing = await client.query<{
          id: string;
          display_name: string;
          display_username: string | null;
        }>(
          `select u.id, u.display_name, u.display_username
             from user_identities i
             join app_users u on u.id = i.user_id
            where i.provider = 'telegram' and i.provider_user_id = $1
            for update`,
          [input.telegramId]
        );

        if (existing.rowCount) {
          const row = existing.rows[0];
          await client.query(
            `update app_users set display_name = $2, updated_at = now() where id = $1`,
            [row.id, displayName]
          );
          await client.query(
            `update user_identities
                set provider_username = $2,
                    provider_payload = $3::jsonb
              where provider = 'telegram' and provider_user_id = $1`,
            [input.telegramId, input.username ?? null, JSON.stringify(input.payload ?? {})]
          );
          return {
            id: row.id,
            displayName,
            ...(row.display_username ? { displayUsername: row.display_username } : {})
          };
        }

        const user = await client.query<{ id: string; display_name: string }>(
          `insert into app_users(display_name) values($1) returning id, display_name`,
          [displayName]
        );
        const userId = user.rows[0].id;
        await client.query(
          `insert into user_identities(user_id, provider, provider_user_id, provider_username, provider_payload)
           values($1, 'telegram', $2, $3, $4::jsonb)`,
          [userId, input.telegramId, input.username ?? null, JSON.stringify(input.payload ?? {})]
        );
        return { id: userId, displayName: user.rows[0].display_name };
      });
    },

    async createGuestUser(displayName = 'Web Player'): Promise<AppUserRecord> {
      const cleanName = normalizeDisplayName(displayName);
      return withPostgresTransaction(pool, async (client) => {
        const user = await client.query<{ id: string; display_name: string }>(
          `insert into app_users(display_name) values($1) returning id, display_name`,
          [cleanName]
        );
        await client.query(
          `insert into user_identities(user_id, provider, provider_user_id)
           values($1, 'guest', $2)`,
          [user.rows[0].id, `guest_${randomBytes(16).toString('hex')}`]
        );
        return { id: user.rows[0].id, displayName: user.rows[0].display_name };
      });
    },

    async createAuthSession(userId: string, provider: 'telegram' | 'guest'): Promise<string> {
      const token = randomBytes(32).toString('base64url');
      await pool.query(
        `insert into auth_sessions(user_id, token_hash, provider, expires_at, last_used_at)
         values($1, $2, $3, now() + interval '30 days', now())`,
        [userId, hashSessionToken(token), provider]
      );
      return token;
    },

    async authenticateSession(token: string): Promise<AppUserRecord | null> {
      const result = await pool.query<{
        id: string;
        display_name: string;
        display_username: string | null;
      }>(
        `select u.id, u.display_name, u.display_username
           from auth_sessions s
           join app_users u on u.id = s.user_id
          where s.token_hash = $1
            and s.revoked_at is null
            and s.expires_at > now()`,
        [hashSessionToken(token)]
      );
      if (!result.rowCount) return null;
      await pool.query(`update auth_sessions set last_used_at = now() where token_hash = $1`, [hashSessionToken(token)]);
      const row = result.rows[0];
      return {
        id: row.id,
        displayName: row.display_name,
        ...(row.display_username ? { displayUsername: row.display_username } : {})
      };
    }
  };
}
