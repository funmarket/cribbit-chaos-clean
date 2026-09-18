import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createNodeApiHandler } from '../apps/api/src/node-runtime.ts';

const apiPort = Number(process.env.API_PORT ?? '3000');
const webPort = Number(process.env.WEB_PORT ?? '5173');

createServer(createNodeApiHandler({
  databaseUrl: process.env.DATABASE_URL ?? '',
  checkConnection: async () => {}
})).listen(apiPort, '0.0.0.0', () => {
  console.log(`Cribbit memory API on http://127.0.0.1:${apiPort}`);
});

const isWindows = process.platform === 'win32';
const npxExecutable = isWindows ? 'npx.cmd' : 'npx';

const vite = spawn(npxExecutable, ['vite', 'apps/web', '--port', String(webPort), '--host', '127.0.0.1'], {
  stdio: 'inherit',
  env: { ...process.env },
  shell: isWindows
});

vite.on('exit', (code) => process.exit(code ?? 0));
