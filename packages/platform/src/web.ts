import type { PlatformAdapter } from './types';
export function createWebAdapter(): PlatformAdapter { return { kind: 'web' }; }
