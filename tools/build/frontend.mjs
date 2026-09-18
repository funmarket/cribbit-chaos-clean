import path from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { build } from 'vite';

const ROOT = process.cwd();
const aliases = {
  '@cribbit/client-app': path.join(ROOT, 'packages/client-app/src/index.ts'),
  '@cribbit/platform/types': path.join(ROOT, 'packages/platform/src/types.ts'),
  '@cribbit/platform/web': path.join(ROOT, 'packages/platform/src/web.ts'),
  '@cribbit/platform/telegram': path.join(ROOT, 'packages/platform/src/telegram.ts'),
  '@cribbit/contracts': path.join(ROOT, 'packages/contracts/src/index.ts'),
  '@cribbit/cards/presentation': path.join(ROOT, 'packages/cards/src/presentation.ts'),
  '@cribbit/api-client': path.join(ROOT, 'packages/api-client/src/index.ts'),
  '@cribbit/ui': path.join(ROOT, 'packages/ui/src/index.ts')
};

export async function buildFrontend(surface) {
  if (!['web', 'telegram'].includes(surface)) throw new Error(`Unknown frontend surface: ${surface}`);
  const appRoot = path.join(ROOT, 'apps', surface);
  const outDir = path.join(ROOT, 'dist', surface);
  await rm(outDir, { recursive: true, force: true });
  const result = await build({
    root: appRoot,
    publicDir: path.join(ROOT, 'packages/cards'),
    resolve: { alias: aliases },
    build: { outDir, emptyOutDir: true, minify: false, rollupOptions: { output: { entryFileNames: 'assets/[name].js' } } }
  });
  const outputs = Array.isArray(result) ? result : [result];
  const chunks = outputs.flatMap((output) => output.output ?? []).filter((item) => item.type === 'chunk');
  const entries = chunks.filter((chunk) => chunk.isEntry);
  if (entries.length !== 1) throw new Error(`${surface}: expected exactly one emitted entry chunk, got ${entries.length}`);
  const modules = [...new Set(chunks.flatMap((chunk) => Object.keys(chunk.modules)).map((id) => path.relative(ROOT, id).split(path.sep).join('/')))];
  const forbidden = surface === 'web' ? 'packages/platform/src/telegram.ts' : 'packages/platform/src/web.ts';
  if (modules.includes(forbidden)) throw new Error(`${surface}: opposite platform adapter leaked into production bundle: ${forbidden}`);
  const externalImports = chunks.flatMap((chunk) => chunk.imports.filter((item) => !chunks.some((candidate) => candidate.fileName === item)));
  if (externalImports.length) throw new Error(`${surface}: unexpected external runtime imports: ${externalImports.join(', ')}`);
  await mkdir(path.join(ROOT, 'artifacts'), { recursive: true });
  await writeFile(path.join(ROOT, 'artifacts', `${surface}-graph.json`), JSON.stringify({ surface, entries: entries.map((e) => e.fileName), modules: modules.sort() }, null, 2) + '\n');
  return { surface, modules: modules.length };
}
