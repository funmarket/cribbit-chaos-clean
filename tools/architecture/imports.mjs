import path from 'node:path';
import ts from 'typescript';
import { ROOT, readText } from './fs.mjs';
import { workspaceNameFromSpecifier } from './policy.mjs';

export function collectSpecifiers(sourceText, fileName) {
  const source = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const found = [];
  let computedLoader = false;
  const push = (node, kind, typeOnly = false) => {
    if (node && ts.isStringLiteralLike(node)) found.push({ specifier: node.text, kind, typeOnly });
    else computedLoader = true;
  };
  function visit(node) {
    if (ts.isImportDeclaration(node)) push(node.moduleSpecifier, 'import', Boolean(node.importClause?.isTypeOnly));
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) push(node.moduleSpecifier, 'export', Boolean(node.isTypeOnly));
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) push(node.arguments[0], 'dynamic-import');
    if (ts.isImportTypeNode(node)) push(node.argument.literal, 'import-type', true);
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'require') push(node.arguments[0], 'require');
    ts.forEachChild(node, visit);
  }
  visit(source);
  return { found, computedLoader };
}

export async function resolveSpecifier(fromFile, specifier, compilerOptions) {
  const host = ts.sys;
  const resolved = ts.resolveModuleName(specifier, path.join(ROOT, fromFile), compilerOptions, host).resolvedModule;
  return resolved ? path.relative(ROOT, resolved.resolvedFileName).split(path.sep).join('/') : null;
}

export function sourceWorkspace(relativePath, workspaceRoots) {
  for (const [name, root] of Object.entries(workspaceRoots)) {
    if (relativePath === root || relativePath.startsWith(`${root}/`)) return name;
  }
  return null;
}

export async function analyzeImports(file, compilerOptions, workspaceRoots) {
  const sourceText = await readText(file);
  const parsed = collectSpecifiers(sourceText, file);
  const edges = [];
  for (const item of parsed.found) {
    const targetWorkspace = workspaceNameFromSpecifier(item.specifier);
    const resolved = await resolveSpecifier(file, item.specifier, compilerOptions);
    edges.push({ ...item, resolved, targetWorkspace });
  }
  return { file, sourceText, computedLoader: parsed.computedLoader, edges };
}
