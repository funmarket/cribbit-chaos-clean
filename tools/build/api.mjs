import path from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { build } from 'vite';

const ROOT = process.cwd();
const aliases = [
  { find: '@cribbit/cards/server', replacement: path.join(ROOT, 'packages/cards/src/server.ts') },
  { find: '@cribbit/prompts/server', replacement: path.join(ROOT, 'packages/prompts/src/server.ts') },
  { find: '@cribbit/contracts', replacement: path.join(ROOT, 'packages/contracts/src/index.ts') },
  { find: '@cribbit/game-engine', replacement: path.join(ROOT, 'packages/game-engine/src/index.ts') },
  { find: '@cribbit/database', replacement: path.join(ROOT, 'packages/database/src/index.ts') },
  { find: '@cribbit/cards', replacement: path.join(ROOT, 'packages/cards/src/index.ts') },
  { find: '@cribbit/prompts', replacement: path.join(ROOT, 'packages/prompts/src/index.ts') }
];

const postgresRuntimePackages = [
  /^pg(?:-|$)/,
  'pgpass',
  /^postgres-/,
  'split2',
  /^xtend(?:\/|$)/
];
const allowedNodeRuntimeImports = new Set([
  'crypto',
  'dns',
  'events',
  'fs',
  'net',
  'node:crypto',
  'node:http',
  'path',
  'stream',
  'string_decoder',
  'tls',
  'util',
  'util/types'
]);

export async function buildApi() {
  const entry = path.join(ROOT, 'apps/api/src/main.ts');
  const outDir = path.join(ROOT, 'dist/api');
  await rm(outDir, { recursive: true, force: true });

  const result = await build({
    configFile: false,
    resolve: { alias: aliases },
    ssr: { noExternal: postgresRuntimePackages },
    build: {
      ssr: entry,
      outDir,
      emptyOutDir: true,
      minify: false,
      rollupOptions: { output: { entryFileNames: 'main.js', chunkFileNames: 'chunks/[name]-[hash].js' } }
    }
  });

  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs.flatMap((output) => output.output ?? []).filter((item) => item.type === 'chunk');
  const entries = chunks.filter((chunk) => chunk.isEntry);
  if (entries.length !== 1) throw new Error(`api: expected exactly one emitted entry chunk, got ${entries.length}`);

  const modules = [...new Set(chunks.flatMap((chunk) => Object.keys(chunk.modules)).map((id) => path.relative(ROOT, id).split(path.sep).join('/')))] ;
  const emittedNames = new Set(chunks.map((chunk) => chunk.fileName));
  const externalImports = chunks.flatMap((chunk) => chunk.imports.filter((item) => !emittedNames.has(item)));
  const unexpectedExternalImports = externalImports.filter((item) => !allowedNodeRuntimeImports.has(item));
  if (unexpectedExternalImports.length) {
    throw new Error(`api: unexpected external runtime imports: ${unexpectedExternalImports.join(', ')}`);
  }

  await mkdir(path.join(ROOT, 'artifacts'), { recursive: true });
  await writeFile(
    path.join(ROOT, 'artifacts/api-graph.json'),
    JSON.stringify(
      {
        surface: 'api',
        entries: entries.map((entryChunk) => entryChunk.fileName),
        modules: modules.sort(),
        externalRuntimeImports: [...new Set(externalImports)].sort()
      },
      null,
      2
    ) + '\n'
  );
  return { surface: 'api', modules: modules.length };
}
