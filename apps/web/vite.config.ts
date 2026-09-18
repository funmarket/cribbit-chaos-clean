import { defineConfig } from 'vite';

function repoPath(path: string): string {
  return new URL(`../../${path}`, import.meta.url).pathname;
}

export default defineConfig({
  resolve: {
    alias: {
      '@cribbit/client-app': repoPath('packages/client-app/src/index.ts'),
      '@cribbit/platform/types': repoPath('packages/platform/src/types.ts'),
      '@cribbit/platform/web': repoPath('packages/platform/src/web.ts'),
      '@cribbit/platform/telegram': repoPath('packages/platform/src/telegram.ts'),
      '@cribbit/contracts': repoPath('packages/contracts/src/index.ts'),
      '@cribbit/cards/presentation': repoPath('packages/cards/src/presentation.ts'),
      '@cribbit/api-client': repoPath('packages/api-client/src/index.ts'),
      '@cribbit/ui': repoPath('packages/ui/src/index.ts')
    }
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3000'
    }
  }
});
