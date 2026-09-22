import { CribbitApiError, createCribbitApiClient } from '@cribbit/api-client';
import type { GameViewProjection, PlayerSessionIdentity } from '@cribbit/contracts';
import type { PlatformAdapter } from '@cribbit/platform/types';
import { createTelegramPresentationDraft, ensureCribbitStyles, mountGameTable, mountTelegramPresentationController, mountTelegramTopMenuController, mountWebPresentationController, renderCribbitHome, renderCribbitLobby, type MountedGameTable, type WebProductView } from '@cribbit/ui';

const mounted = new WeakSet<HTMLElement>();

interface AppState {
  readonly player: PlayerSessionIdentity | null;
  readonly projection: GameViewProjection | null;
  readonly busy: boolean;
  readonly error: string | null;
}

export interface BootstrapOptions {
  readonly apiBaseUrl?: string | undefined;
}

function normalizeApiBaseUrl(apiBaseUrl: string | undefined): string | undefined {
  const trimmedApiBaseUrl = apiBaseUrl?.trim();
  if (!trimmedApiBaseUrl) return undefined;

  const normalizedApiBaseUrl = trimmedApiBaseUrl.replace(/\/+$/, '');
  if (normalizedApiBaseUrl.endsWith('/api')) return normalizedApiBaseUrl;

  return `${normalizedApiBaseUrl}/api`;
}

function errorText(error: unknown): string {
  if (error instanceof CribbitApiError) {
    if (error.code === 'SESSION_NOT_FOUND') return 'Room not found. Check the room code and try again.';
    if (error.code === 'SESSION_ALREADY_STARTED') return 'That room has already started and cannot accept new players.';
    if (error.code === 'PLAYER_ALREADY_JOINED') return 'This player is already in the room.';
    if (error.code) return `The server rejected this action: ${error.code.replaceAll('_', ' ').toLowerCase()}.`;
    return 'The Cribbit server could not complete that request. Please try again.';
  }
  if (error instanceof Error) return error.message;
  return 'Unexpected Cribbit error';
}

/** Shared application composition. Clients render server projections only. */
export function bootstrap(root: HTMLElement, platform: PlatformAdapter, options: BootstrapOptions = {}): () => void {
  if (mounted.has(root)) throw new Error('Application already mounted');
  mounted.add(root);
  root.dataset.accessSurface = platform.kind;

  const api = createCribbitApiClient({ baseUrl: normalizeApiBaseUrl(options.apiBaseUrl), getAuthHeaders: platform.getAuthHeaders });
  let state: AppState = { player: null, projection: null, busy: false, error: null };
  let table: MountedGameTable | null = null;
  let unmountWebPresentation: (() => void) | null = null;
  let unmountTelegramPresentation: (() => void) | null = null;
  let webView: WebProductView = 'lobby';
  const telegramDraft = createTelegramPresentationDraft();
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
    if (!state.player) return;
    try {
      const projection = await api.getProjection(state.player.sessionId);
      if (state.projection?.revision === projection.revision && state.error === null) return;
      setState({ projection, error: null });
    } catch (error) {
      setState({ error: errorText(error) });
    }
  };

  const ensurePolling = (): void => {
    if (pollHandle !== null || !state.player) return;
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
      if (platform.kind === 'telegram') await api.ensureTelegramAccount();
      else await api.ensureWebGuest({ displayName });
      const result = await api.createSession({ displayName });
      state = { player: result.player, projection: result.projection, busy: false, error: null };
      ensurePolling();
      render();
    });
  };

  const joinSession = (sessionId: string, displayName: string): void => {
    void withBusy(async () => {
      if (platform.kind === 'telegram') await api.ensureTelegramAccount();
      else await api.ensureWebGuest({ displayName });
      const result = await api.joinSession({ sessionId, displayName });
      state = { player: result.player, projection: result.projection, busy: false, error: null };
      ensurePolling();
      render();
    });
  };

  const startSimulation = (): void => {
    void withBusy(async () => {
      if (platform.kind === 'telegram') {
        await api.ensureTelegramAccount();
      } else {
        const displayName =
          root.querySelector<HTMLInputElement>('[name="createName"], #profileName, [data-profile-input]')?.value.trim() ||
          'QA Player';
        await api.ensureWebGuest({ displayName });
      }
      const result = await api.createSimulation();
      webView = 'game';
      state = {
        player: result.player,
        projection: result.projection,
        busy: false,
        error: null
      };
      ensurePolling();
      render();
    });
  };

  const returnToTelegramRoomSetup = (): void => {
    stopPolling();
    state = { player: null, projection: null, busy: false, error: null };
    render();
  };

  const startGame = (): void => {
    const player = state.player;
    if (!player) return;
    void withBusy(async () => {
      const projection = await api.startGame(player.sessionId);
      setState({ projection });
    });
  };

  const drawCard = (): void => {
    const player = state.player;
    const projection = state.projection;
    if (!player || !projection) return;
    void withBusy(async () => {
      const result = await api.drawCard(player.sessionId, projection.revision);
      if (!result.ok) throw new Error(result.reason ?? result.code);
      setState({ projection: result.projection });
    });
  };

  const playCard = (cardInstanceId: string): void => {
    const player = state.player;
    const projection = state.projection;
    if (!player || !projection) return;
    void withBusy(async () => {
      const result = await api.playCard(player.sessionId, projection.revision, cardInstanceId);
      if (!result.ok) throw new Error(result.reason ?? result.code);
      setState({ projection: result.projection });
    });
  };

  const bindSimulationControls = (): void => {
    root.querySelectorAll<HTMLButtonElement>('[data-action="demo-game"]').forEach(button => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        startSimulation();
      });
    });
  };

  function bindHome(): void {
    const readCreateName = (): string =>
      root.querySelector<HTMLInputElement>('[name="createName"], #profileName, [data-profile-input]')?.value.trim() || 'Player 1';
    const readJoinSession = (): string | undefined =>
      root.querySelector<HTMLInputElement>('[name="sessionId"], #joinCode, [data-join-code]')?.value.trim() || undefined;
    const readJoinName = (): string =>
      root.querySelector<HTMLInputElement>('[name="joinName"], #profileName, [data-profile-input]')?.value.trim() || 'Player 2';

    root.querySelector<HTMLFormElement>('[data-create-session]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      createSession(readCreateName());
    });
    root.querySelector<HTMLAnchorElement>('a.cc-web-create[href="#roomCreation"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      root.querySelector<HTMLElement>('#roomCreation')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
    root.querySelector<HTMLButtonElement>('[data-action="create-game"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      createSession(readCreateName());
    });
    root.querySelector<HTMLFormElement>('[data-join-session]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const session = readJoinSession();
      if (session) joinSession(session, readJoinName());
    });
    root.querySelector<HTMLButtonElement>('[data-action="join-room"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      const session = readJoinSession();
      if (session) joinSession(session, readJoinName());
    });
    bindSimulationControls();
  }

  function render(): void {
    ensureCribbitStyles();
    unmountWebPresentation?.();
    unmountWebPresentation = null;
    unmountTelegramPresentation?.();
    unmountTelegramPresentation = null;
    table?.();
    table = null;
    if (!state.projection || !state.player) {
      root.innerHTML = renderCribbitHome({ busy: state.busy, error: state.error, surface: platform.kind });
      bindHome();
      if (platform.kind === 'web') {
        unmountWebPresentation = mountWebPresentationController(root, {
          canOpenGame: () => Boolean(state.projection && state.projection.status !== 'waiting'),
          canOpenRecap: () => Boolean(state.projection?.winner),
          initialView: webView,
          onViewChange: (nextView) => { webView = nextView; },
        });
      } else {
        unmountTelegramPresentation = mountTelegramPresentationController(root, telegramDraft, {
          connected: false,
          onSimulation: startSimulation,
        });
      }
      return;
    }

    if (state.projection.status === 'waiting') {
      root.innerHTML = renderCribbitLobby(state.projection, { busy: state.busy, error: state.error, surface: platform.kind });
      root.querySelector<HTMLButtonElement>('[data-action="start-game"]')?.addEventListener('click', startGame);
      bindSimulationControls();
      if (platform.kind === 'web') {
        unmountWebPresentation = mountWebPresentationController(root, {
          canOpenGame: () => Boolean(state.projection && state.projection.status !== 'waiting'),
          canOpenRecap: () => Boolean(state.projection?.winner),
          initialView: webView,
          onViewChange: (nextView) => { webView = nextView; },
        });
      } else {
        unmountTelegramPresentation = mountTelegramPresentationController(root, telegramDraft, {
          connected: false,
          onSimulation: startSimulation,
        });
      }
      return;
    }

    root.innerHTML = '<div data-game-table-root></div>';
    const target = root.querySelector<HTMLElement>('[data-game-table-root]');
    if (!target) throw new Error('Game table mount missing');
    table = mountGameTable(target, state.projection, { onDraw: drawCard, onPlay: playCard }, platform.kind);
    if (platform.kind === 'telegram') {
      unmountTelegramPresentation = mountTelegramTopMenuController(target, {
        inGame: true,
        connected: false,
        onRoomSetup: returnToTelegramRoomSetup,
      });
    }
  }

  render();
  ensurePolling();

  return () => {
    stopPolling();
    unmountWebPresentation?.();
    unmountTelegramPresentation?.();
    table?.();
    mounted.delete(root);
    delete root.dataset.accessSurface;
    root.replaceChildren();
  };
}
export { createFixturePreview } from './fixture-preview.ts';
