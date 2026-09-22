import { randomUUID } from 'node:crypto';
import type {
  AuthProvider,
  AuthenticatedUserRecord,
  IdentityLinkResult,
  IdentityStore,
  TelegramIdentityInput,
  WebCredentialInput,
  WebCredentialRecord
} from '@cribbit/database';

export function createMemoryIdentityStore(): IdentityStore {
  const users = new Map<string, AuthenticatedUserRecord>();
  const telegramOwners = new Map<string, string>();
  const telegramByUser = new Map<string, string>();
  const telegramUsernameByUser = new Map<string, string | null>();
  const webCredentials = new Map<string, WebCredentialRecord>();
  const webByUser = new Map<string, string>();
  const sessions = new Map<string, string>();

  const createUser = (displayName: string): AuthenticatedUserRecord => {
    const user = { id: randomUUID(), displayName: displayName.trim().slice(0, 40) || 'Cribbit Player' };
    users.set(user.id, user);
    return user;
  };

  return {
    async createAnonymousUser(displayName) {
      return createUser(displayName);
    },
    async createWebUser(input) {
      if (webCredentials.has(input.loginUsername)) throw new Error('IDENTITY_CONFLICT');
      const user = createUser(input.displayName);
      webCredentials.set(input.loginUsername, { userId: user.id, passwordHash: input.passwordHash });
      webByUser.set(user.id, input.loginUsername);
      return user;
    },
    async attachWebCredential(userId, input: WebCredentialInput): Promise<IdentityLinkResult> {
      const existingOwner = webCredentials.get(input.loginUsername)?.userId;
      if (existingOwner && existingOwner !== userId) return 'identity_conflict';
      const current = webByUser.get(userId);
      if (current && current !== input.loginUsername) return 'account_conflict';
      if (!users.has(userId)) throw new Error('USER_NOT_FOUND');
      webCredentials.set(input.loginUsername, { userId, passwordHash: input.passwordHash });
      webByUser.set(userId, input.loginUsername);
      return 'linked';
    },
    async findWebCredential(loginUsername) {
      return webCredentials.get(loginUsername) ?? null;
    },
    async findLoginMethods(userId) {
      if (!users.has(userId)) return null;
      const loginUsername = webByUser.get(userId);
      const telegramId = telegramByUser.get(userId);
      return {
        web: loginUsername ? { loginUsername } : null,
        telegram: telegramId ? { username: telegramUsernameByUser.get(userId) ?? null } : null
      };
    },
    async findTelegramUserId(telegramId) {
      return telegramOwners.get(telegramId) ?? null;
    },
    async createTelegramUser(input: TelegramIdentityInput) {
      const existing = telegramOwners.get(input.telegramId);
      if (existing) {
        telegramUsernameByUser.set(existing, input.username ?? null);
        return users.get(existing) ?? createUser(input.displayName);
      }
      const user = createUser(input.displayName);
      telegramOwners.set(input.telegramId, user.id);
      telegramByUser.set(user.id, input.telegramId);
      telegramUsernameByUser.set(user.id, input.username ?? null);
      return user;
    },
    async attachTelegramIdentity(userId, input: TelegramIdentityInput): Promise<IdentityLinkResult> {
      const existingOwner = telegramOwners.get(input.telegramId);
      if (existingOwner && existingOwner !== userId) return 'identity_conflict';
      const current = telegramByUser.get(userId);
      if (current && current !== input.telegramId) return 'account_conflict';
      if (!users.has(userId)) throw new Error('USER_NOT_FOUND');
      telegramOwners.set(input.telegramId, userId);
      telegramByUser.set(userId, input.telegramId);
      telegramUsernameByUser.set(userId, input.username ?? null);
      return 'linked';
    },
    async createAuthSession(userId, _provider: AuthProvider) {
      if (!users.has(userId)) throw new Error('USER_NOT_FOUND');
      const token = `${randomUUID()}.${randomUUID()}`;
      sessions.set(token, userId);
      return token;
    },
    async authenticateSession(token) {
      const userId = sessions.get(token);
      return userId ? users.get(userId) ?? null : null;
    },
    async revokeAuthSession(token) {
      sessions.delete(token);
    },
    async getUser(userId) {
      return users.get(userId) ?? null;
    }
  };
}
