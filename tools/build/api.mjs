import path from 'node:path';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import ts from 'typescript';

const ROOT = process.cwd();

export async function buildApiPlaceholder() {
  const sourcePath = path.join(ROOT, 'apps/api/src/main.ts');
  const source = await readFile(sourcePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
  });
  const outDir = path.join(ROOT, 'dist/api');
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'main.js'), output.outputText);
  await mkdir(path.join(ROOT, 'artifacts'), { recursive: true });
  await writeFile(path.join(ROOT, 'artifacts/api-graph.json'), JSON.stringify({ surface: 'api', placeholderOnly: true, modules: ['apps/api/src/main.ts'] }, null, 2) + '\n');
  return { surface: 'api', placeholderOnly: true };
}
