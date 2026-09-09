import type { PlatformAdapter } from '@cribbit/platform/types';
const mounted = new WeakSet<HTMLElement>();
/** Foundation composition only; no session, API or gameplay startup. */
export function bootstrap(root: HTMLElement, platform: PlatformAdapter): () => void {
  if (mounted.has(root)) throw new Error('Application already mounted');
  mounted.add(root);
  root.dataset.accessSurface = platform.kind;
  return () => { mounted.delete(root); delete root.dataset.accessSurface; };
}
