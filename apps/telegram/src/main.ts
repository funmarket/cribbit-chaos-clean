import { bootstrap } from '@cribbit/client-app';
import { createTelegramAdapter } from '@cribbit/platform/telegram';

declare global {
  interface ImportMeta {
    readonly env: {
      readonly VITE_API_URL?: string;
    };
  }
}

const root = document.getElementById('app');
if (!root) throw new Error('Application mount is missing');

const rawApiBaseUrl = import.meta.env.VITE_API_URL ?? '';
const apiBaseUrl = rawApiBaseUrl.trim() || undefined;
bootstrap(root, createTelegramAdapter(), { apiBaseUrl });
