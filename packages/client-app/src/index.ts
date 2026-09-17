import type { PlatformAdapter } from '../../platform/src/types.ts';
import { mountGameTable } from '../../ui/src/index.ts';
import { createFixturePreview } from './fixture-preview.ts';
const mounted = new WeakSet<HTMLElement>();
/** Shared application composition. Web receives a non-authoritative visual fixture until P7A-2 wires live session flow. */
export function bootstrap(root: HTMLElement, platform: PlatformAdapter): () => void {
  if (mounted.has(root)) throw new Error('Application already mounted');
  mounted.add(root);
  root.dataset.accessSurface = platform.kind;
  const unmountView = platform.kind === 'web' ? mountGameTable(root, createFixturePreview().projection) : () => {};
  return () => { unmountView(); mounted.delete(root); delete root.dataset.accessSurface; };
}
export { createFixturePreview } from './fixture-preview.ts';
