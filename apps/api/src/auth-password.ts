import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const LINK_TTL_MS = 10 * 60 * 1000;

export function normalizeLoginUsername(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9_.-]{3,48}$/.test(normalized)) {
    throw new Error('Login username must be 3-48 characters using letters, numbers, dot, dash or underscore');
  }
  return normalized;
}

export function validatePassword(value: string): string {
  if (value.length < 8 || value.length > 128) throw new Error('Password must be between 8 and 128 characters');
  return value;
}

export function hashPassword(password: string): string {
  validatePassword(password);
  const salt = randomBytes(16);
  const digest = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${digest.toString('hex')}`;
}

export function verifyPassword(encoded: string, password: string): boolean {
  const [scheme, saltHex, digestHex] = encoded.split('$');
  if (scheme !== 'scrypt' || !saltHex || !digestHex) return false;
  const expected = Buffer.from(digestHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createTelegramLinkCode(userId: string, secret: string, now = Date.now()): { code: string; expiresAt: Date } {
  if (!secret) throw new Error('SESSION_SECRET is required for account linking');
  const expiresAt = new Date(now + LINK_TTL_MS);
  const payload = `${userId}.${expiresAt.getTime()}`;
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return { code: `${Buffer.from(payload).toString('base64url')}.${signature}`, expiresAt };
}

export function verifyTelegramLinkCode(code: string, secret: string, now = Date.now()): string | null {
  const [payloadEncoded, suppliedSignature] = code.split('.');
  if (!payloadEncoded || !suppliedSignature || !secret) return null;
  let payload = '';
  try { payload = Buffer.from(payloadEncoded, 'base64url').toString('utf8'); } catch { return null; }
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(signature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  const splitAt = payload.lastIndexOf('.');
  if (splitAt <= 0) return null;
  const userId = payload.slice(0, splitAt);
  const expiresAt = Number(payload.slice(splitAt + 1));
  if (!userId || !Number.isFinite(expiresAt) || expiresAt < now) return null;
  return userId;
}
