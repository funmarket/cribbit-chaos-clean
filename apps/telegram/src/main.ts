import { bootstrap } from '@cribbit/client-app';
import { createTelegramAdapter } from '@cribbit/platform/telegram';
const root = document.getElementById('app');
if (!root) throw new Error('Application mount is missing');
bootstrap(root, createTelegramAdapter());
