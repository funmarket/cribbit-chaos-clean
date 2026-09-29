import type { PlatformAdapter } from './types';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

export function createTelegramAdapter(): PlatformAdapter {
  const webApp = window.Telegram?.WebApp;
  webApp?.ready?.();
  webApp?.expand?.();
  return {
    kind: 'telegram',
    getAuthHeaders() {
      const initData = window.Telegram?.WebApp?.initData?.trim() ?? '';
      const headers: HeadersInit = initData ? { authorization: `tma ${initData}` } : {};
      return headers;
    }
  };
}
