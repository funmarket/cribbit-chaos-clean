export const INTERNAL_PREFIX = '@cribbit/';

export const WORKSPACES = Object.freeze({
  '@cribbit/contracts': 'packages/contracts',
  '@cribbit/cards': 'packages/cards',
  '@cribbit/prompts': 'packages/prompts',
  '@cribbit/game-engine': 'packages/game-engine',
  '@cribbit/database': 'packages/database',
  '@cribbit/api-client': 'packages/api-client',
  '@cribbit/platform': 'packages/platform',
  '@cribbit/ui': 'packages/ui',
  '@cribbit/client-app': 'packages/client-app',
  '@cribbit/web': 'apps/web',
  '@cribbit/telegram': 'apps/telegram',
  '@cribbit/api': 'apps/api'
});

export const ALLOWED_EDGES = Object.freeze({
  '@cribbit/contracts': [],
  '@cribbit/cards': ['@cribbit/contracts'],
  '@cribbit/prompts': ['@cribbit/contracts'],
  '@cribbit/game-engine': ['@cribbit/contracts', '@cribbit/cards', '@cribbit/prompts'],
  '@cribbit/database': ['@cribbit/contracts', '@cribbit/game-engine'],
  '@cribbit/api-client': ['@cribbit/contracts'],
  '@cribbit/platform': ['@cribbit/contracts'],
  '@cribbit/ui': ['@cribbit/contracts', '@cribbit/cards'],
  '@cribbit/client-app': ['@cribbit/contracts', '@cribbit/api-client', '@cribbit/ui', '@cribbit/platform'],
  '@cribbit/web': ['@cribbit/client-app', '@cribbit/platform'],
  '@cribbit/telegram': ['@cribbit/client-app', '@cribbit/platform'],
  '@cribbit/api': ['@cribbit/contracts', '@cribbit/game-engine', '@cribbit/cards', '@cribbit/prompts', '@cribbit/database']
});

export const PRODUCTION_DEPENDENCY_SECTIONS = Object.freeze([
  'dependencies',
  'peerDependencies',
  'optionalDependencies'
]);

export const ALL_DEPENDENCY_SECTIONS = Object.freeze([
  ...PRODUCTION_DEPENDENCY_SECTIONS,
  'devDependencies'
]);

export const CLIENT_WORKSPACES = Object.freeze([
  '@cribbit/web',
  '@cribbit/telegram',
  '@cribbit/client-app',
  '@cribbit/ui',
  '@cribbit/api-client'
]);

export const CLIENT_FORBIDDEN_TARGETS = Object.freeze([
  '@cribbit/game-engine',
  '@cribbit/database',
  '@cribbit/cards/server',
  '@cribbit/prompts/server'
]);

export const SURFACE_RULES = Object.freeze({
  '@cribbit/web': {
    allowedPlatformImports: ['@cribbit/platform/types', '@cribbit/platform/web'],
    forbiddenPlatformImports: ['@cribbit/platform/telegram']
  },
  '@cribbit/telegram': {
    allowedPlatformImports: ['@cribbit/platform/types', '@cribbit/platform/telegram'],
    forbiddenPlatformImports: ['@cribbit/platform/web']
  },
  '@cribbit/client-app': {
    allowedPlatformImports: ['@cribbit/platform/types'],
    forbiddenPlatformImports: ['@cribbit/platform/web', '@cribbit/platform/telegram']
  }
});

export const EXACT_HTML_SHELL = '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Cribbit CHAOS</title></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>';
export const TELEGRAM_HTML_SHELL = '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Cribbit CHAOS</title></head><body><div id="app"></div><script src="https://telegram.org/js/telegram-web-app.js"></script><script type="module" src="/src/main.ts"></script></body></html>';

export const CLIENT_CAPABILITY_PATTERNS = Object.freeze([
  ['direct fetch', /\bfetch\s*\(/],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['WebSocket', /\bWebSocket\b/],
  ['storage access', /\b(?:localStorage|sessionStorage|indexedDB)\b/],
  ['dynamic worker', /\b(?:Worker|SharedWorker)\s*\(/],
  ['dynamic script creation', /createElement\s*\(\s*['"]script['"]\s*\)/],
  ['eval', /\beval\s*\(/],
  ['Function constructor', /\bnew\s+Function\s*\(/],
  ['fallback runtime flag', /\b(?:runtimeMode|fallbackRuntime|offlineRuntime)\b/],
  ['canonical deck constructor', /\b(?:buildDeck|buildCanonicalDeck|createCanonicalDeck)\b/]
]);

export const CLIENT_CAPABILITY_ALLOWLIST = Object.freeze({
  '@cribbit/api-client': ['direct fetch']
});

export function workspaceNameFromSpecifier(specifier) {
  if (!specifier.startsWith(INTERNAL_PREFIX)) return null;
  const parts = specifier.split('/');
  return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
}

export function isAllowedEdge(from, to) {
  return from === to || (ALLOWED_EDGES[from] ?? []).includes(to);
}

export function isAllowedNodeBuiltinImport(from, specifier) {
  return from === '@cribbit/api' && specifier.startsWith('node:');
}

export function isAllowedClientCapability(from, label) {
  return (CLIENT_CAPABILITY_ALLOWLIST[from] ?? []).includes(label);
}
