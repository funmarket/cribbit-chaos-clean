import type pg from 'pg';
import { createIdentityStore } from '@cribbit/database';
import { validateTelegramInitData } from './telegram-auth.ts';

export interface TelegramAuthResult {
  readonly sessionToken: string;
  readonly user: {
    readonly id: string;
    readonly displayName: string;
    readonly displayUsername?: string;
  };
}

function telegramDisplayName(user: { readonly firstName?: string; readonly lastName?: string; readonly username?: string }): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username || 'Telegram Player';
}

export async function authenticateTelegramMiniApp(input: {
  readonly pool: pg.Pool;
  readonly initData: string;
  readonly botToken: string;
  readonly maxAgeSeconds?: number;
}): Promise<TelegramAuthResult> {
  const telegramUser = validateTelegramInitData(input.initData, input.botToken, input.maxAgeSeconds);
  const identity = createIdentityStore(input.pool);
  const user = await identity.resolveOrCreateTelegramUser({
    telegramId: telegramUser.id,
    displayName: telegramDisplayName(telegramUser),
    username: telegramUser.username,
    payload: telegramUser
  });
  const sessionToken = await identity.createAuthSession(user.id, 'telegram');
  return { sessionToken, user };
}

export async function authenticateGuest(input: {
  readonly pool: pg.Pool;
  readonly displayName?: string;
}): Promise<TelegramAuthResult> {
  const identity = createIdentityStore(input.pool);
  const user = await identity.createGuestUser(input.displayName ?? 'Web Player');
  const sessionToken = await identity.createAuthSession(user.id, 'guest');
  return { sessionToken, user };
}
