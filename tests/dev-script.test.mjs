import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('dev script resolves the Windows npx shim when spawning Vite', async () => {
  const source = await readFile(new URL('../tools/dev.mjs', import.meta.url), 'utf8');

  assert.match(source, /process\.platform\s*===\s*['"]win32['"]/);
  assert.match(source, /npx\.cmd/);
  assert.match(source, /shell:\s*isWindows/);
});
