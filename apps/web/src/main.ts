import { bootstrap } from '@cribbit/client-app';
import { createWebAdapter } from '@cribbit/platform/web';
const root = document.getElementById('app');
if (!root) throw new Error('Application mount is missing');
bootstrap(root, createWebAdapter());
