import { createCribbitApiClient } from '@cribbit/api-client';
import type { GameViewProjection, PlayerSessionCredential } from '@cribbit/contracts';
import type { PlatformAdapter } from '@cribbit/platform/types';
import { mountGameTable, renderCribbitHome, renderCribbitLobby, type MountedGameTable } from '@cribbit/ui';
import { createFixturePreview } from './fixture-preview.ts';

const mounted = new WeakSet<HTMLElement>();

interface AppState {
  readonly credential: PlayerSessionCredential | null;
  readonly projection: GameViewProjection | null;
  readonly busy: boolean;
  readonly error: string | null;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Unexpected Cribbit error';
}

/** Shared application composition. Web orchestrates API calls and renders server projections only. */
export function bootstrap(root: HTMLElement, platform: PlatformAdapter): () => void {
  if (mounted.has(root)) throw new Error('Application already mounted');
  mounted.add(root);
  root.dataset.accessSurface = platform.kind;

  if (platform.kind !== 'web') {
    const unmountView = mountGameTable(root, createFixturePreview().projection);
    return () => { unmountView(); mounted.delete(root); delete root.dataset.accessSurface; };
  }

  const api = createCribbitApiClient();
  let state: AppState = { credential: null, projection: null, busy: false, error: null };
  let table: MountedGameTable | null = null;
  let pollHandle: number | null = null;

  const stopPolling = (): void => {
    if (pollHandle !== null) window.clearInterval(pollHandle);
    pollHandle = null;
  };

  const setState = (next: Partial<AppState>): void => {
    state = { ...state, ...next };
    render();
  };

  const refreshProjection = async (): Promise<void> => {
    if (!state.credential) return;
    try {
      const projection = await api.getProjection(state.credential);
      setState({ projection, error: null });
    } catch (error) {
      setState({ error: errorText(error) });
    }
  };

  const ensurePolling = (): void => {
    if (pollHandle !== null || !state.credential) return;
    pollHandle = window.setInterval(() => { void refreshProjection(); }, 1500);
  };

  const withBusy = async (operation: () => Promise<void>): Promise<void> => {
    setState({ busy: true, error: null });
    try { await operation(); }
    catch (error) { setState({ error: errorText(error) }); }
    finally { setState({ busy: false }); }
  };

  const createSession = (displayName: string): void => {
    void withBusy(async () => {
      const result = await api.createSession({ displayName });
      state = { credential: result.credential, projection: result.projection, busy: false, error: null };
      ensurePolling();
      render();
    });
  };

  const joinSession = (sessionId: string, displayName: string): void => {
    void withBusy(async () => {
      const result = await api.joinSession({ sessionId, displayName });
      state = { credential: result.credential, projection: result.projection, busy: false, error: null };
      ensurePolling();
      render();
    });
  };

  const startGame = (): void => {
    if (!state.credential) return;
    void withBusy(async () => {
      const projection = await api.startGame(state.credential as PlayerSessionCredential);
      setState({ projection });
    });
  };

  const drawCard = (): void => {
    if (!state.credential || !state.projection) return;
    void withBusy(async () => {
      const result = await api.drawCard(state.credential as PlayerSessionCredential, state.projection?.revision ?? 0);
      if (!result.ok) throw new Error(result.reason ?? result.code);
      setState({ projection: result.projection });
    });
  };

  const playCard = (cardInstanceId: string): void => {
    if (!state.credential || !state.projection) return;
    void withBusy(async () => {
      const result = await api.playCard(state.credential as PlayerSessionCredential, state.projection?.revision ?? 0, cardInstanceId);
      if (!result.ok) throw new Error(result.reason ?? result.code);
      setState({ projection: result.projection });
    });
  };

  function bindHome(): void {
    root.querySelector<HTMLFormElement>('[data-create-session]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = root.querySelector<HTMLInputElement>('[name="createName"]');
      createSession(input?.value.trim() || 'Player 1');
    });
    root.querySelector<HTMLFormElement>('[data-join-session]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const session = root.querySelector<HTMLInputElement>('[name="sessionId"]')?.value.trim();
      const name = root.querySelector<HTMLInputElement>('[name="joinName"]')?.value.trim() || 'Player 2';
      if (session) joinSession(session, name);
    });
  }

  function render(): void {
    table?.();
    table = null;
    if (!state.projection || !state.credential) {
      root.innerHTML = renderCribbitHome({ busy: state.busy, error: state.error });
      bindHome();
      return;
    }

    if (state.projection.status === 'waiting') {
      root.innerHTML = renderCribbitLobby(state.projection, { busy: state.busy, error: state.error });
      root.querySelector<HTMLButtonElement>('[data-action="start-game"]')?.addEventListener('click', startGame);
      return;
    }

    root.innerHTML = '<div data-game-table-root></div>';
    const target = root.querySelector<HTMLElement>('[data-game-table-root]');
    if (!target) throw new Error('Game table mount missing');
    table = mountGameTable(target, state.projection, { onDraw: drawCard, onPlay: playCard });
  }

  render();
  ensurePolling();

  return () => {
    stopPolling();
    table?.();
    mounted.delete(root);
    delete root.dataset.accessSurface;
    root.replaceChildren();
  };
}
export { createFixturePreview } from './fixture-preview.ts';
