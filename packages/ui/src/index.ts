import type { GameViewProjection } from '../../contracts/src/view.ts';
import { GAME_TABLE_STYLES } from './styles.ts';
import { createPresentationState, renderGameTable, type PresentationState } from './game-table.ts';
export * from './game-table.ts';
export { GAME_TABLE_STYLES } from './styles.ts';

const STYLE_ID = 'cribbit-game-table-styles';
export interface GameTableHandlers { readonly onDraw?: () => void; readonly onPlay?: (cardInstanceId: string) => void; readonly onStart?: () => void; }
export interface MountedGameTable { (): void; update(projection: GameViewProjection): void; }
export function ensureCribbitStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = GAME_TABLE_STYLES;
  document.head.append(style);
}
function labelForCard(target: Element): string { return target.querySelector<HTMLElement>('.game-card__name')?.textContent?.trim() || 'Effect preview'; }
export function mountGameTable(root: HTMLElement, projection: GameViewProjection, handlers: GameTableHandlers = {}, surface: 'web' | 'telegram' = 'web'): MountedGameTable {
  ensureCribbitStyles();
  let state: PresentationState = createPresentationState();
  let currentProjection = projection;
  const render = (): void => { root.innerHTML = renderGameTable(currentProjection, state, surface); };
  const click = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest('[data-action="draw-card"]')) { handlers.onDraw?.(); return; }
    if (target.closest('[data-action="play-card"]')) { if (state.selectedCardId) handlers.onPlay?.(state.selectedCardId); return; }
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
  const unmount = (() => { root.removeEventListener('click', click); root.replaceChildren(); }) as MountedGameTable;
  unmount.update = (nextProjection: GameViewProjection): void => { currentProjection = nextProjection; render(); };
  return unmount;
}
