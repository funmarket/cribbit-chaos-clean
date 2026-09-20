import type { PlatformAdapter } from './types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
      };
    };
  }
}

export function createTelegramAdapter(): PlatformAdapter {
  return {
    kind: 'telegram',
    getAuthHeaders() {
      const initData = window.Telegram?.WebApp?.initData?.trim() ?? '';
      return initData ? { authorization: `tma ${initData}` } : {};
    }
  };
}
