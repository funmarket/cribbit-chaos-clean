export type AuthTransport = 'web' | 'telegram';

export interface AuthenticatedUser {
  readonly id: string;
  readonly displayName: string;
  readonly displayUsername?: string;
}

export interface AuthContextView {
  readonly user: AuthenticatedUser;
  readonly transports: readonly AuthTransport[];
}

export interface WebRegisterRequest {
  readonly loginUsername: string;
  readonly password: string;
  readonly displayName: string;
}

export interface WebLoginRequest {
  readonly loginUsername: string;
  readonly password: string;
}

export interface TelegramLinkCodeResponse {
  readonly code: string;
  readonly expiresAt: string;
}
