export type PlatformKind = 'web' | 'telegram';

export interface PlatformAdapter {
  readonly kind: PlatformKind;
  getAuthHeaders(): HeadersInit;
}
