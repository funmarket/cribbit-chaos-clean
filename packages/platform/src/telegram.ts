import type { PlatformAdapter } from './types';
export function createTelegramAdapter(): PlatformAdapter { return { kind: 'telegram' }; }
