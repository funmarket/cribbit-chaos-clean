import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AuthenticatedUser } from '@cribbit/contracts';
import type { IdentityStore } from '@cribbit/database';
import { validateTelegramInitData } from './telegram-auth.ts';

export const SESSION_COOKIE_NAME = 'cribbit_session';

export interface AuthContext {
  readonly user: AuthenticatedUser;
  readonly userId: string;
  readonly transports: readonly ('web' | 'telegram')[];
}

export class AuthContextError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AuthContextError';
    this.status = status;
    this.code = code;
  }
}

export function sessionTokenFromRequest(request: IncomingMessage): string | null {
  const raw = request.headers.cookie ?? '';
  for (const part of raw.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE_NAME) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function telegramInitDataFromRequest(request: IncomingMessage): string | null {
  const auth = request.headers.authorization ?? '';
  const [scheme, ...rest] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'tma') return null;
  const initData = rest.join(' ').trim();
  return initData || null;
}

export function setSessionCookie(response: ServerResponse, token: string, secure: boolean): void {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    secure ? 'Secure' : '',
    secure ? 'SameSite=None' : 'SameSite=Lax',
    'Max-Age=2592000'
  ].filter(Boolean);
  response.setHeader('set-cookie', attributes.join('; '));
}

export function clearSessionCookie(response: ServerResponse, secure: boolean): void {
  const attributes = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    secure ? 'Secure' : '',
    secure ? 'SameSite=None' : 'SameSite=Lax',
    'Max-Age=0'
  ].filter(Boolean);
  response.setHeader('set-cookie', attributes.join('; '));
}

export async function resolveAuthContext(input: {
  readonly request: IncomingMessage;
  readonly identity: IdentityStore;
  readonly telegramBotToken: string;
  readonly telegramMaxAgeSeconds?: number;
}): Promise<AuthContext | null> {
  const webToken = sessionTokenFromRequest(input.request);
  const webUser = webToken ? await input.identity.authenticateSession(webToken) : null;

  const rawInitData = telegramInitDataFromRequest(input.request);
  let telegramUser: AuthenticatedUser | null = null;
  if (rawInitData) {
    if (!input.telegramBotToken) throw new AuthContextError(503, 'TELEGRAM_AUTH_UNAVAILABLE', 'Telegram authentication is unavailable');
    let telegram;
    try {
      telegram = validateTelegramInitData(rawInitData, input.telegramBotToken, input.telegramMaxAgeSeconds);
    } catch {
      throw new AuthContextError(401, 'TELEGRAM_AUTH_INVALID', 'Invalid or expired Telegram authentication');
    }
    const telegramUserId = await input.identity.findTelegramUserId(telegram.id);
    telegramUser = telegramUserId ? await input.identity.getUser(telegramUserId) : null;
  }

  if (webUser && telegramUser && webUser.id !== telegramUser.id) {
    throw new AuthContextError(401, 'AUTH_CONFLICT', 'Web and Telegram credentials resolve to different Cribbit users');
  }

  const user = telegramUser ?? webUser;
  if (!user) return null;
  const transports = [
    ...(webUser ? (['web'] as const) : []),
    ...(telegramUser ? (['telegram'] as const) : [])
  ];
  return { user, userId: user.id, transports };
}
