import type pg from 'pg';
import { withPostgresTransaction } from './postgres.ts';

export type AuthProvider = 'web_guest' | 'web_password';
export type IdentityLinkResult = 'linked' | 'identity_conflict' | 'account_conflict';

export interface AuthenticatedUserRecord {
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

export interface WebCredentialInput {
  readonly loginUsername: string;
  readonly passwordHash: string;
}

export interface WebCredentialRecord {
  readonly userId: string;
  readonly passwordHash: string;
}

export interface IdentityStore {
  createAnonymousUser(displayName: string): Promise<AuthenticatedUserRecord>;
  createWebUser(input: WebCredentialInput & { readonly displayName: string }): Promise<AuthenticatedUserRecord>;
  attachWebCredential(userId: string, input: WebCredentialInput): Promise<IdentityLinkResult>;
  findWebCredential(loginUsername: string): Promise<WebCredentialRecord | null>;
  findTelegramUserId(telegramId: string): Promise<string | null>;
  createTelegramUser(input: TelegramIdentityInput): Promise<AuthenticatedUserRecord>;
  attachTelegramIdentity(userId: string, input: TelegramIdentityInput): Promise<IdentityLinkResult>;
  createAuthSession(userId: string, provider: AuthProvider): Promise<string>;
  authenticateSession(token: string): Promise<AuthenticatedUserRecord | null>;
  revokeAuthSession(token: string): Promise<void>;
  getUser(userId: string): Promise<AuthenticatedUserRecord | null>;
}

function requireWebCrypto(): Crypto {
  if (!globalThis.crypto) throw new Error('Web Crypto is not available in this runtime');
  return globalThis.crypto;
}

function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  requireWebCrypto().getRandomValues(bytes);
  return Buffer.from(bytes).toString('base64url');
}

async function hashSessionToken(token: string): Promise<string> {
  const digest = await requireWebCrypto().subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Buffer.from(new Uint8Array(digest)).toString('hex');
}

function normalizeDisplayName(value: string): string {
  const displayName = value.trim().slice(0, 40);
  if (!displayName) throw new Error('Display name is required');
  return displayName;
}

function rowToUser(row: { id: string; display_name: string; display_username: string | null }): AuthenticatedUserRecord {
  return {
    id: row.id,
    displayName: row.display_name,
    ...(row.display_username ? { displayUsername: row.display_username } : {})
  };
}

export function createIdentityStore(pool: pg.Pool): IdentityStore {
  return {
    async createAnonymousUser(displayName) {
      const result = await pool.query<{ id: string; display_name: string; display_username: string | null }>(
        `insert into users(display_name) values($1) returning id, display_name, display_username`,
        [normalizeDisplayName(displayName)]
      );
      return rowToUser(result.rows[0]);
    },

    async createWebUser(input) {
      return withPostgresTransaction(pool, async (client) => {
        await client.query('select pg_advisory_xact_lock(hashtext($1))', [`web_password:${input.loginUsername}`]);
        const conflict = await client.query('select 1 from user_identities where provider = $1 and provider_user_id = $2', ['web_password', input.loginUsername]);
        if (conflict.rowCount) throw new Error('IDENTITY_CONFLICT');
        const user = await client.query<{ id: string; display_name: string; display_username: string | null }>(
          `insert into users(display_name) values($1) returning id, display_name, display_username`,
          [normalizeDisplayName(input.displayName)]
        );
        const userId = user.rows[0].id;
        await client.query(
          `insert into user_identities(user_id, provider, provider_user_id) values($1, 'web_password', $2)`,
          [userId, input.loginUsername]
        );
        await client.query(
          `insert into web_credentials(user_id, login_username, password_hash) values($1, $2, $3)`,
          [userId, input.loginUsername, input.passwordHash]
        );
        return rowToUser(user.rows[0]);
      });
    },

    async attachWebCredential(userId, input) {
      return withPostgresTransaction(pool, async (client) => {
        await client.query('select pg_advisory_xact_lock(hashtext($1))', [`web_password:${input.loginUsername}`]);
        const owner = await client.query<{ user_id: string }>(
          `select user_id from user_identities where provider = 'web_password' and provider_user_id = $1`,
          [input.loginUsername]
        );
        if (owner.rowCount && owner.rows[0].user_id !== userId) return 'identity_conflict' as const;
        const current = await client.query<{ provider_user_id: string }>(
          `select provider_user_id from user_identities where user_id = $1 and provider = 'web_password'`,
          [userId]
        );
        if (current.rowCount && current.rows[0].provider_user_id !== input.loginUsername) return 'account_conflict' as const;
        if (!current.rowCount) {
          await client.query(
            `insert into user_identities(user_id, provider, provider_user_id) values($1, 'web_password', $2)`,
            [userId, input.loginUsername]
          );
          await client.query(
            `insert into web_credentials(user_id, login_username, password_hash) values($1, $2, $3)`,
            [userId, input.loginUsername, input.passwordHash]
          );
        }
        return 'linked' as const;
      });
    },

    async findWebCredential(loginUsername) {
      const result = await pool.query<{ user_id: string; password_hash: string }>(
        `select user_id, password_hash from web_credentials where login_username = $1`,
        [loginUsername]
      );
      return result.rowCount ? { userId: result.rows[0].user_id, passwordHash: result.rows[0].password_hash } : null;
    },

    async findTelegramUserId(telegramId) {
      const result = await pool.query<{ user_id: string }>(
        `select user_id from user_identities where provider = 'telegram' and provider_user_id = $1`,
        [telegramId]
      );
      return result.rows[0]?.user_id ?? null;
    },

    async createTelegramUser(input) {
      return withPostgresTransaction(pool, async (client) => {
        await client.query('select pg_advisory_xact_lock(hashtext($1))', [`telegram:${input.telegramId}`]);
        const existing = await client.query<{ id: string; display_name: string; display_username: string | null }>(
          `select u.id, u.display_name, u.display_username
             from user_identities i join users u on u.id = i.user_id
            where i.provider = 'telegram' and i.provider_user_id = $1`,
          [input.telegramId]
        );
        if (existing.rowCount) return rowToUser(existing.rows[0]);
        const user = await client.query<{ id: string; display_name: string; display_username: string | null }>(
          `insert into users(display_name) values($1) returning id, display_name, display_username`,
          [normalizeDisplayName(input.displayName)]
        );
        await client.query(
          `insert into user_identities(user_id, provider, provider_user_id, provider_username, provider_payload)
           values($1, 'telegram', $2, $3, $4::jsonb)`,
          [user.rows[0].id, input.telegramId, input.username ?? null, JSON.stringify(input.payload ?? {})]
        );
        return rowToUser(user.rows[0]);
      });
    },

    async attachTelegramIdentity(userId, input) {
      return withPostgresTransaction(pool, async (client) => {
        await client.query('select pg_advisory_xact_lock(hashtext($1))', [`telegram:${input.telegramId}`]);
        const owner = await client.query<{ user_id: string }>(
          `select user_id from user_identities where provider = 'telegram' and provider_user_id = $1`,
          [input.telegramId]
        );
        if (owner.rowCount && owner.rows[0].user_id !== userId) return 'identity_conflict' as const;
        const current = await client.query<{ provider_user_id: string }>(
          `select provider_user_id from user_identities where user_id = $1 and provider = 'telegram'`,
          [userId]
        );
        if (current.rowCount && current.rows[0].provider_user_id !== input.telegramId) return 'account_conflict' as const;
        if (current.rowCount) {
          await client.query(
            `update user_identities set provider_username = $2, provider_payload = $3::jsonb
              where user_id = $1 and provider = 'telegram'`,
            [userId, input.username ?? null, JSON.stringify(input.payload ?? {})]
          );
        } else {
          await client.query(
            `insert into user_identities(user_id, provider, provider_user_id, provider_username, provider_payload)
             values($1, 'telegram', $2, $3, $4::jsonb)`,
            [userId, input.telegramId, input.username ?? null, JSON.stringify(input.payload ?? {})]
          );
        }
        return 'linked' as const;
      });
    },

    async createAuthSession(userId, provider) {
      const token = randomToken();
      await pool.query(
        `insert into auth_sessions(user_id, token_hash, provider, expires_at, last_used_at)
         values($1, $2, $3, now() + interval '30 days', now())`,
        [userId, await hashSessionToken(token), provider]
      );
      return token;
    },

    async authenticateSession(token) {
      const tokenHash = await hashSessionToken(token);
      const result = await pool.query<{ id: string; display_name: string; display_username: string | null }>(
        `select u.id, u.display_name, u.display_username
           from auth_sessions s join users u on u.id = s.user_id
          where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()`,
        [tokenHash]
      );
      if (!result.rowCount) return null;
      await pool.query('update auth_sessions set last_used_at = now() where token_hash = $1', [tokenHash]);
      return rowToUser(result.rows[0]);
    },

    async revokeAuthSession(token) {
      await pool.query('update auth_sessions set revoked_at = now() where token_hash = $1 and revoked_at is null', [await hashSessionToken(token)]);
    },

    async getUser(userId) {
      const result = await pool.query<{ id: string; display_name: string; display_username: string | null }>(
        'select id, display_name, display_username from users where id = $1',
        [userId]
      );
      return result.rowCount ? rowToUser(result.rows[0]) : null;
    }
  };
}
