import type { IdentityStore } from '@cribbit/database';
import type { AuthenticatedUser } from '@cribbit/contracts';
import { validateTelegramInitData } from './telegram-auth.ts';
import {
  createTelegramLinkCode,
  hashPassword,
  normalizeLoginUsername,
  validatePassword,
  verifyPassword,
  verifyTelegramLinkCode
} from './auth-password.ts';

export class AuthServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AuthServiceError';
    this.status = status;
    this.code = code;
  }
}

function telegramDisplayName(user: { readonly firstName?: string; readonly lastName?: string; readonly username?: string }): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username || 'Telegram Player';
}

function cleanDisplayName(value: string): string {
  const clean = value.trim().slice(0, 40);
  if (!clean) throw new AuthServiceError(400, 'DISPLAY_NAME_REQUIRED', 'Display name is required');
  return clean;
}

function mapIdentityResult(result: 'linked' | 'identity_conflict' | 'account_conflict', provider: string): void {
  if (result === 'linked') return;
  throw new AuthServiceError(
    409,
    'ACCOUNT_LINK_CONFLICT',
    result === 'identity_conflict'
      ? `That ${provider} identity already belongs to another Cribbit account`
      : `This Cribbit account is already linked to another ${provider} identity`
  );
}

export async function registerWebAccount(input: {
  readonly identity: IdentityStore;
  readonly currentUserId?: string | null;
  readonly loginUsername: string;
  readonly password: string;
  readonly displayName: string;
}): Promise<{ readonly user: AuthenticatedUser; readonly sessionToken: string }> {
  const loginUsername = normalizeLoginUsername(input.loginUsername);
  const passwordHash = hashPassword(validatePassword(input.password));
  const displayName = cleanDisplayName(input.displayName);
  let user: AuthenticatedUser;
  if (input.currentUserId) {
    const result = await input.identity.attachWebCredential(input.currentUserId, { loginUsername, passwordHash });
    mapIdentityResult(result, 'Web');
    const loaded = await input.identity.getUser(input.currentUserId);
    if (!loaded) throw new AuthServiceError(404, 'USER_NOT_FOUND', 'Cribbit user not found');
    user = loaded;
  } else {
    try {
      user = await input.identity.createWebUser({ loginUsername, passwordHash, displayName });
    } catch (error) {
      if (error instanceof Error && /identity conflict/i.test(error.message)) {
        throw new AuthServiceError(409, 'IDENTITY_CONFLICT', 'That login username already belongs to another Cribbit account');
      }
      throw error;
    }
  }
  const sessionToken = await input.identity.createAuthSession(user.id, 'web_password');
  return { user, sessionToken };
}

export async function loginWebAccount(input: {
  readonly identity: IdentityStore;
  readonly loginUsername: string;
  readonly password: string;
}): Promise<{ readonly user: AuthenticatedUser; readonly sessionToken: string }> {
  const loginUsername = normalizeLoginUsername(input.loginUsername);
  const credential = await input.identity.findWebCredential(loginUsername);
  if (!credential || !verifyPassword(credential.passwordHash, input.password)) {
    throw new AuthServiceError(401, 'LOGIN_INVALID', 'Invalid username or password');
  }
  const user = await input.identity.getUser(credential.userId);
  if (!user) throw new AuthServiceError(401, 'LOGIN_INVALID', 'Invalid username or password');
  return { user, sessionToken: await input.identity.createAuthSession(user.id, 'web_password') };
}

export async function ensureTelegramAccount(input: {
  readonly identity: IdentityStore;
  readonly initData: string | null;
  readonly botToken: string;
  readonly maxAgeSeconds?: number;
}): Promise<AuthenticatedUser> {
  if (!input.initData || !input.botToken) {
    throw new AuthServiceError(401, 'TELEGRAM_AUTH_REQUIRED', 'Valid Telegram authentication is required');
  }
  let telegram;
  try {
    telegram = validateTelegramInitData(input.initData, input.botToken, input.maxAgeSeconds);
  } catch {
    throw new AuthServiceError(401, 'TELEGRAM_AUTH_INVALID', 'Invalid or expired Telegram authentication');
  }
  const existingUserId = await input.identity.findTelegramUserId(telegram.id);
  if (existingUserId) {
    const existing = await input.identity.getUser(existingUserId);
    if (existing) return existing;
  }
  return input.identity.createTelegramUser({
    telegramId: telegram.id,
    displayName: telegramDisplayName(telegram),
    username: telegram.username,
    payload: telegram
  });
}

export function issueTelegramLinkCode(userId: string, secret: string): { readonly code: string; readonly expiresAt: string } {
  const issued = createTelegramLinkCode(userId, secret);
  return { code: issued.code, expiresAt: issued.expiresAt.toISOString() };
}

export async function claimTelegramLink(input: {
  readonly identity: IdentityStore;
  readonly initData: string | null;
  readonly botToken: string;
  readonly maxAgeSeconds?: number;
  readonly code: string;
  readonly secret: string;
}): Promise<AuthenticatedUser> {
  const targetUserId = verifyTelegramLinkCode(input.code, input.secret);
  if (!targetUserId) throw new AuthServiceError(400, 'ACCOUNT_LINK_CODE_INVALID', 'Link code is invalid or expired');
  if (!input.initData || !input.botToken) throw new AuthServiceError(401, 'TELEGRAM_AUTH_REQUIRED', 'Valid Telegram authentication is required');
  let telegram;
  try {
    telegram = validateTelegramInitData(input.initData, input.botToken, input.maxAgeSeconds);
  } catch {
    throw new AuthServiceError(401, 'TELEGRAM_AUTH_INVALID', 'Invalid or expired Telegram authentication');
  }
  const result = await input.identity.attachTelegramIdentity(targetUserId, {
    telegramId: telegram.id,
    displayName: telegramDisplayName(telegram),
    username: telegram.username,
    payload: telegram
  });
  mapIdentityResult(result, 'Telegram');
  const user = await input.identity.getUser(targetUserId);
  if (!user) throw new AuthServiceError(404, 'USER_NOT_FOUND', 'Cribbit user not found');
  return user;
}
