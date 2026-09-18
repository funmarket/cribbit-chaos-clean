import { createHmac, timingSafeEqual } from 'node:crypto';

export interface ValidatedTelegramUser {
  readonly id: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly username?: string;
  readonly languageCode?: string;
  readonly authDate: number;
}

function hmacSha256(key: string | Buffer, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}

function parseTelegramUser(rawUser: string): ValidatedTelegramUser {
  const user = JSON.parse(rawUser) as {
    id?: number | string;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  };
  if (user.id === undefined || user.id === null || user.id === '') {
    throw new Error('Telegram user id missing.');
  }
  return {
    id: String(user.id),
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    languageCode: user.language_code,
    authDate: 0
  };
}

export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 3600
): ValidatedTelegramUser {
  if (!initData) throw new Error('Missing Telegram initData.');
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not configured.');

  const params = new URLSearchParams(initData);
  const suppliedHash = params.get('hash');
  if (!suppliedHash || !/^[a-f0-9]{64}$/i.test(suppliedHash)) {
    throw new Error('Invalid Telegram hash.');
  }

  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = hmacSha256('WebAppData', botToken);
  const calculated = hmacSha256(secretKey, dataCheckString);
  const supplied = Buffer.from(suppliedHash, 'hex');
  if (supplied.length !== calculated.length || !timingSafeEqual(supplied, calculated)) {
    throw new Error('Telegram initData signature mismatch.');
  }

  const authDate = Number(params.get('auth_date'));
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || authDate <= 0 || now - authDate > maxAgeSeconds || authDate > now + 30) {
    throw new Error('Telegram initData is stale or invalid.');
  }

  const rawUser = params.get('user');
  if (!rawUser) throw new Error('Telegram initData contains no user.');
  const user = parseTelegramUser(rawUser);
  return { ...user, authDate };
}
