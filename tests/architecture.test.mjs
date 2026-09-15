import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const TMP_PREFIX = path.join(os.tmpdir(), 'cribbit-p1-architecture-');

async function fixture() {
  const dir = await mkdtemp(TMP_PREFIX);
  await cp(ROOT, dir, {
    recursive: true,
    filter(source) {
      const relative = path.relative(ROOT, source).split(path.sep).join('/');
      if (!relative) return true;
      return !['.git', 'node_modules', 'dist', 'artifacts', '.tmp-tests', '.p1', 'packages/cards/assets'].some((blocked) => relative === blocked || relative.startsWith(`${blocked}/`));
    }
  });
  await symlink(path.join(ROOT, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  return dir;
}

async function mutate(dir, file, change) {
  const target = path.join(dir, file);
  const current = await readFile(target, 'utf8');
  await writeFile(target, typeof change === 'function' ? change(current) : change);
}

function runCheck(dir) {
  return spawnSync(process.execPath, ['tools/architecture/check.mjs'], { cwd: dir, encoding: 'utf8' });
}

async function expectFailure(t, mutation, expected) {
  const dir = await fixture();
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mutation(dir);
  const result = runCheck(dir);
  assert.notEqual(result.status, 0, `guard unexpectedly passed\n${result.stdout}\n${result.stderr}`);
  assert.match(`${result.stdout}\n${result.stderr}`, expected);
}

test('valid P1 skeleton passes architecture guard', async (t) => {
  const dir = await fixture();
  t.after(() => rm(dir, { recursive: true, force: true }));
  const result = runCheck(dir);
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

const cases = [
  ['web cannot import Telegram adapter', async (d) => mutate(d, 'apps/web/src/main.ts', (s) => `import '@cribbit/platform/telegram';\n${s}`), /cannot import @cribbit\/platform\/telegram/],
  ['Telegram cannot import Web adapter', async (d) => mutate(d, 'apps/telegram/src/main.ts', (s) => `import '@cribbit/platform/web';\n${s}`), /cannot import @cribbit\/platform\/web/],
  ['shared client cannot import Web adapter', async (d) => mutate(d, 'packages/client-app/src/index.ts', (s) => `import '@cribbit/platform/web';\n${s}`), /shared client-app may import platform types only/],
  ['shared client cannot import Telegram adapter', async (d) => mutate(d, 'packages/client-app/src/index.ts', (s) => `import '@cribbit/platform/telegram';\n${s}`), /shared client-app may import platform types only/],
  ['PlatformAdapter must be type-only', async (d) => mutate(d, 'packages/client-app/src/index.ts', (s) => s.replace('import type { PlatformAdapter }', 'import { PlatformAdapter }')), /must be type-only/],
  ['web cannot import game engine', async (d) => mutate(d, 'apps/web/src/main.ts', (s) => `import '@cribbit/game-engine';\n${s}`), /forbidden workspace edge|client cannot import/],
  ['client cannot import server cards', async (d) => mutate(d, 'packages/client-app/src/index.ts', (s) => `import '@cribbit/cards/server';\n${s}`), /client cannot import server\/gameplay/],
  ['client cannot import server prompts', async (d) => mutate(d, 'packages/client-app/src/index.ts', (s) => `import '@cribbit/prompts/server';\n${s}`), /client cannot import server\/gameplay/],
  ['client cannot construct canonical deck', async (d) => mutate(d, 'packages/client-app/src/index.ts', (s) => `${s}\nfunction buildDeck(){ return []; }\n`), /canonical deck constructor/],
  ['production edge requires declaration', async (d) => mutate(d, 'apps/web/package.json', (s) => { const j = JSON.parse(s); delete j.dependencies['@cribbit/platform']; return JSON.stringify(j, null, 2) + '\n'; }), /not declared/],
  ['dev dependency cannot justify production edge', async (d) => mutate(d, 'apps/web/package.json', (s) => { const j = JSON.parse(s); delete j.dependencies['@cribbit/platform']; j.devDependencies = { '@cribbit/platform': '0.0.0' }; return JSON.stringify(j, null, 2) + '\n'; }), /declared only in devDependencies/],
  ['unused forbidden internal dependency fails', async (d) => mutate(d, 'apps/web/package.json', (s) => { const j = JSON.parse(s); j.dependencies['@cribbit/game-engine'] = '0.0.0'; return JSON.stringify(j, null, 2) + '\n'; }), /forbidden internal dependency/],
  ['unknown internal dependency fails', async (d) => mutate(d, 'apps/web/package.json', (s) => { const j = JSON.parse(s); j.dependencies['@cribbit/not-real'] = '0.0.0'; return JSON.stringify(j, null, 2) + '\n'; }), /unknown internal dependency/],
  ['computed dynamic import fails', async (d) => mutate(d, 'packages/ui/src/index.ts', `const target = '@cribbit/contracts';\nvoid import(target);\n`), /computed\/unresolved module loading/],
  ['direct fetch fails in client code', async (d) => mutate(d, 'packages/client-app/src/index.ts', (s) => `${s}\nvoid fetch('/api');\n`), /direct fetch/],
  ['storage access fails in client code', async (d) => mutate(d, 'packages/client-app/src/index.ts', (s) => `${s}\nvoid localStorage;\n`), /storage access/],
  ['worker creation fails in client code', async (d) => mutate(d, 'packages/client-app/src/index.ts', (s) => `${s}\nnew Worker('/worker.js');\n`), /dynamic worker/],
  ['extra frontend source entry fails', async (d) => writeFile(path.join(d, 'apps/web/src/extra.ts'), 'export {};\n'), /exactly one source entry/],
  ['HTML shell injection fails', async (d) => mutate(d, 'apps/web/index.html', (s) => s.replace('<div id="app"></div>', '<button>bad</button><div id="app"></div>')), /HTML shell differs/],
  ['API implementation before server audit fails', async (d) => mutate(d, 'apps/api/src/main.ts', `export const handler = () => 'not-authorized-in-P1';\n`), /server placeholder changed/],
  ['platform root export fails', async (d) => mutate(d, 'packages/platform/package.json', (s) => { const j = JSON.parse(s); j.exports['.'] = './src/types.ts'; return JSON.stringify(j, null, 2) + '\n'; }), /root export is forbidden/],
  ['platform types runtime implementation fails', async (d) => mutate(d, 'packages/platform/src/types.ts', (s) => `${s}export const runtime = true;\n`), /declarations only/],
  ['unresolved import fails', async (d) => mutate(d, 'packages/ui/src/index.ts', `import '@cribbit/contracts/nope';\n`), /unresolved import/],
  ['import-type cannot bypass forbidden gameplay edge', async (d) => mutate(d, 'packages/client-app/src/index.ts', (s) => `${s}\ntype Bad = import('@cribbit/game-engine').Never;\n`), /forbidden workspace edge|client cannot import/],
  ['relative import cannot bypass gameplay boundary', async (d) => mutate(d, 'packages/client-app/src/index.ts', (s) => `import '../../game-engine/src/index.ts';\n${s}`), /forbidden workspace edge|client cannot reach/]
];

for (const [name, mutation, expected] of cases) {
  test(name, async (t) => expectFailure(t, mutation, expected));
}
