import ts from 'typescript';
import { CLIENT_CAPABILITY_PATTERNS, CLIENT_FORBIDDEN_TARGETS, CLIENT_WORKSPACES, EXACT_HTML_SHELL, SURFACE_RULES, WORKSPACES, isAllowedEdge, isAllowedNodeBuiltinImport } from './policy.mjs';
import { normalizeHtml, readJson, readText, walk } from './fs.mjs';
import { analyzeImports, sourceWorkspace } from './imports.mjs';
import { dependencySection, loadWorkspaceManifests, validateManifestDeclarations } from './manifests.mjs';

const errors = [];
const fail = (message) => errors.push(message);

const tsconfig = await readJson('tsconfig.json');
const compilerOptions = ts.convertCompilerOptionsFromJson(tsconfig.compilerOptions ?? {}, process.cwd()).options;
const manifests = await loadWorkspaceManifests();
errors.push(...validateManifestDeclarations(manifests));

for (const surface of ['apps/web', 'apps/telegram']) {
  const html = await readText(`${surface}/index.html`);
  if (normalizeHtml(html) !== EXACT_HTML_SHELL) fail(`${surface}: HTML shell differs from the approved P1 grammar`);
  const sourceFiles = await walk(`${surface}/src`, (file) => /\.[cm]?[jt]sx?$/.test(file));
  if (sourceFiles.length !== 1 || sourceFiles[0] !== `${surface}/src/main.ts`) fail(`${surface}: exactly one source entry main.ts is required in P1`);
}

const sourceFiles = [
  ...(await walk('apps', (file) => /\.[cm]?[jt]sx?$/.test(file))),
  ...(await walk('packages', (file) => /\.[cm]?[jt]sx?$/.test(file)))
];

for (const file of sourceFiles) {
  const from = sourceWorkspace(file, WORKSPACES);
  if (!from) { fail(`${file}: source is outside a known workspace`); continue; }
  const analysis = await analyzeImports(file, compilerOptions, WORKSPACES);
  if (analysis.computedLoader) fail(`${file}: computed/unresolved module loading is forbidden`);

  if (CLIENT_WORKSPACES.includes(from)) {
    for (const [label, pattern] of CLIENT_CAPABILITY_PATTERNS) {
      if (pattern.test(analysis.sourceText)) fail(`${file}: forbidden client capability: ${label}`);
    }
  }

  for (const edge of analysis.edges) {
    if (edge.specifier.startsWith('node:')) {
      if (!isAllowedNodeBuiltinImport(from, edge.specifier)) fail(`${file}: Node builtin import is forbidden in ${from} via ${edge.specifier}`);
      continue;
    }
    if (!edge.resolved) { fail(`${file}: unresolved import ${edge.specifier}`); continue; }
    const resolvedWorkspace = sourceWorkspace(edge.resolved, WORKSPACES);
    if (!resolvedWorkspace || resolvedWorkspace === from) continue;

    if (!isAllowedEdge(from, resolvedWorkspace)) fail(`${file}: forbidden workspace edge ${from} -> ${resolvedWorkspace} via ${edge.specifier}`);
    const section = dependencySection(manifests.get(from).manifest, resolvedWorkspace);
    if (!section) fail(`${file}: production import ${resolvedWorkspace} is not declared by ${from}`);
    else if (section === 'devDependencies') fail(`${file}: production import ${resolvedWorkspace} is declared only in devDependencies`);

    if (CLIENT_WORKSPACES.includes(from)) {
      if (CLIENT_FORBIDDEN_TARGETS.some((target) => edge.specifier === target || edge.specifier.startsWith(`${target}/`))) {
        fail(`${file}: client cannot import server/gameplay target ${edge.specifier}`);
      }
      if (edge.resolved.endsWith('/packages/cards/src/server.ts') || edge.resolved.endsWith('/packages/prompts/src/server.ts') || edge.resolved.includes('/packages/game-engine/')) {
        fail(`${file}: client cannot reach server/gameplay source through relative or alias resolution`);
      }
    }
  }

  const surfaceRule = SURFACE_RULES[from];
  if (surfaceRule) {
    for (const edge of analysis.edges) {
      if (surfaceRule.forbiddenPlatformImports.includes(edge.specifier)) fail(`${file}: ${from} cannot import ${edge.specifier}`);
      if (from === '@cribbit/client-app' && edge.specifier.startsWith('@cribbit/platform/') && !surfaceRule.allowedPlatformImports.includes(edge.specifier)) {
        fail(`${file}: shared client-app may import platform types only`);
      }
      if (from === '@cribbit/client-app' && edge.specifier === '@cribbit/platform/types' && !edge.typeOnly) {
        fail(`${file}: PlatformAdapter import must be type-only`);
      }
    }
  }
}

const platformManifest = manifests.get('@cribbit/platform').manifest;
if (platformManifest.exports?.['.'] !== undefined) fail('@cribbit/platform: root export is forbidden');
for (const subpath of ['./types', './web', './telegram']) {
  if (!platformManifest.exports?.[subpath]) fail(`@cribbit/platform: missing explicit export ${subpath}`);
}

const platformTypes = await readText('packages/platform/src/types.ts');
const typeAst = ts.createSourceFile('types.ts', platformTypes, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
for (const statement of typeAst.statements) {
  if (!ts.isInterfaceDeclaration(statement) && !ts.isTypeAliasDeclaration(statement) && !ts.isEmptyStatement(statement)) {
    fail('packages/platform/src/types.ts: declarations only; runtime implementation is forbidden');
  }
}

if (errors.length) {
  console.error(`Architecture verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Architecture verified: ${sourceFiles.length} source files across ${manifests.size} workspaces.`);
