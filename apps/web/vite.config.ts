import path from 'node:path';
import { defineConfig } from 'vite';

const root = path.resolve(import.meta.dirname, '../..');

export default defineConfig({
  resolve: {
    alias: {
      '@cribbit/client-app': path.join(root, 'packages/client-app/src/index.ts'),
      '@cribbit/platform/types': path.join(root, 'packages/platform/src/types.ts'),
      '@cribbit/platform/web': path.join(root, 'packages/platform/src/web.ts'),
      '@cribbit/platform/telegram': path.join(root, 'packages/platform/src/telegram.ts'),
      '@cribbit/contracts': path.join(root, 'packages/contracts/src/index.ts'),
      '@cribbit/cards/presentation': path.join(root, 'packages/cards/src/presentation.ts'),
      '@cribbit/api-client': path.join(root, 'packages/api-client/src/index.ts'),
      '@cribbit/ui': path.join(root, 'packages/ui/src/index.ts')
    }
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3000'
    }
  }
});
