import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export const ROOT = process.cwd();

export async function readText(relativePath) {
  return readFile(path.join(ROOT, relativePath), 'utf8');
}

export async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
}

export async function exists(relativePath) {
  try { await stat(path.join(ROOT, relativePath)); return true; } catch { return false; }
}

export async function walk(relativeDir, predicate = () => true) {
  const base = path.join(ROOT, relativeDir);
  const output = [];
  async function visit(absoluteDir) {
    for (const entry of await readdir(absoluteDir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      const absolute = path.join(absoluteDir, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else {
        const relative = path.relative(ROOT, absolute).split(path.sep).join('/');
        if (predicate(relative)) output.push(relative);
      }
    }
  }
  await visit(base);
  return output.sort();
}

export function normalizeHtml(html) {
  return html.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim();
}
