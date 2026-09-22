import type { GameViewProjection } from '../../contracts/src/view.ts';
import { GAME_TABLE_STYLES, TELEGRAM_GAME_TABLE_STYLES, WEB_GAME_TABLE_STYLES } from './styles.ts';
import { createPresentationState, renderGameTable, type PresentationState } from './game-table.ts';
export * from './game-table.ts';
export * from './web-controller.ts';
export * from './web-shell.ts';
export * from './web-game-binding.ts';
export * from './web-card-presentation.ts';
export * from './telegram-controller.ts';
export { GAME_TABLE_STYLES } from './styles.ts';

const STYLE_ID_BY_SURFACE = {
  web: 'cribbit-web-styles',
  telegram: 'cribbit-telegram-styles',
} as const;
export interface GameTableHandlers { readonly onDraw?: () => void; readonly onPlay?: (cardInstanceId: string) => void; readonly onStart?: () => void; }
export interface MountedGameTable { (): void; update(projection: GameViewProjection): void; }
export function ensureCribbitStyles(surface?: 'web' | 'telegram'): void {
  const inferredSurface =
    document.querySelector<HTMLElement>('#app')?.dataset.accessSurface === 'telegram'
      ? 'telegram'
      : 'web';
  const resolvedSurface = surface ?? inferredSurface;
  const styleId = STYLE_ID_BY_SURFACE[resolvedSurface];
  if (document.getElementById(styleId)) return;
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent =
    resolvedSurface === 'telegram'
      ? TELEGRAM_GAME_TABLE_STYLES
      : WEB_GAME_TABLE_STYLES;
  document.head.append(style);
}
function labelForCard(target: Element): string { return target.querySelector<HTMLElement>('.game-card__name')?.textContent?.trim() || 'Effect preview'; }
export function mountGameTable(root: HTMLElement, projection: GameViewProjection, handlers: GameTableHandlers = {}, surface: 'web' | 'telegram' = 'web'): MountedGameTable {
  ensureCribbitStyles(surface);
  let state: PresentationState = createPresentationState();
  let currentProjection = projection;
  const render = (): void => { root.innerHTML = renderGameTable(currentProjection, state, surface); };
  const click = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-action="draw-card"]')) { handlers.onDraw?.(); return; }
    const playTarget = target.closest<HTMLElement>('[data-action="play-card"]');
    if (playTarget) {
      const directCard = playTarget.closest<HTMLElement>('[data-card-id]');
      const cardId = directCard?.dataset.cardId ?? state.selectedCardId;
      if (cardId) handlers.onPlay?.(cardId);
      return;
    }
    if (target.closest('[data-action="start-game"]')) { handlers.onStart?.(); return; }
    const card = target.closest<HTMLElement>('[data-card-id]');
    if (card) {
      const cardId = card.dataset.cardId ?? null;
      const family = card.dataset.family ?? '';
      const openEffect = family === 'number' ? null : labelForCard(card);
      state = createPresentationState({ ...state, selectedCardId: state.selectedCardId === cardId ? null : cardId, openEffect });
      render();
      return;
    }
    if (target.closest('[data-preview-close]')) { state = createPresentationState({ ...state, openEffect:null }); render(); return; }
    if (target.closest('[data-preview-color-open]')) { state = createPresentationState({ ...state, colorChooserOpen:!state.colorChooserOpen }); render(); return; }
    if (target.closest('[data-preview-color]')) { state = createPresentationState({ ...state, colorChooserOpen:false }); render(); }
  };
  root.addEventListener('click', click);
  render();
  const unmount = (() => {
    root.removeEventListener('click', click);
    root.replaceChildren();
  }) as MountedGameTable;
  unmount.update = (nextProjection: GameViewProjection): void => { currentProjection = nextProjection; render(); };
  return unmount;
}
