import { ALL_DEPENDENCY_SECTIONS, PRODUCTION_DEPENDENCY_SECTIONS, WORKSPACES, isAllowedEdge } from './policy.mjs';
import { readJson } from './fs.mjs';

export async function loadWorkspaceManifests() {
  const manifests = new Map();
  for (const [name, root] of Object.entries(WORKSPACES)) {
    const manifest = await readJson(`${root}/package.json`);
    if (manifest.name !== name) throw new Error(`Workspace name mismatch: ${root} declares ${manifest.name}, expected ${name}`);
    manifests.set(name, { root, manifest });
  }
  return manifests;
}

export function dependencySection(manifest, target) {
  for (const section of PRODUCTION_DEPENDENCY_SECTIONS) {
    if (manifest[section]?.[target] !== undefined) return section;
  }
  if (manifest.devDependencies?.[target] !== undefined) return 'devDependencies';
  return null;
}

export function validateManifestDeclarations(manifests) {
  const errors = [];
  for (const [from, { manifest }] of manifests) {
    for (const section of ALL_DEPENDENCY_SECTIONS) {
      for (const target of Object.keys(manifest[section] ?? {})) {
        if (!target.startsWith('@cribbit/')) continue;
        if (!WORKSPACES[target]) errors.push(`${from}: unknown internal dependency ${target} in ${section}`);
        else if (!isAllowedEdge(from, target)) errors.push(`${from}: forbidden internal dependency ${target} in ${section}`);
      }
    }
  }
  return errors;
}
