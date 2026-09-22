// Presentation-only Telegram room setup controller extracted from the old Mini App behavior.
// It owns local setup affordances only. Session/game authority stays in the clean API/server path.

export type TelegramRoomMode = 'duel' | 'squad' | 'party' | 'mayhem';
export type TelegramContentWorld = 'clean' | 'adult';
export type TelegramPromptSource = 'original' | 'community' | 'house' | 'live';

export interface TelegramPresentationDraft {
  profileName: string;
  roomName: string;
  world: TelegramContentWorld;
  ceiling: number;
  mode: TelegramRoomMode;
  playerCount: number;
  sources: Record<TelegramPromptSource, boolean>;
  qaHand: boolean;
}

interface ModeOption {
  readonly id: TelegramRoomMode;
  readonly min: number;
  readonly max: number;
  readonly defaultPlayers: number;
  readonly copy: string;
}

const ROOM_MODES: readonly ModeOption[] = [
  { id: 'duel', min: 2, max: 2, defaultPlayers: 2, copy: 'Fast head-to-head pacing.' },
  { id: 'squad', min: 3, max: 4, defaultPlayers: 4, copy: 'Balanced teaching format.' },
  { id: 'party', min: 5, max: 7, defaultPlayers: 5, copy: 'Primary social format.' },
  { id: 'mayhem', min: 8, max: 10, defaultPlayers: 8, copy: 'Shorter timers, more anti-downtime.' },
];

const CEILINGS: Readonly<Record<TelegramContentWorld, readonly { readonly value: number; readonly label: string }[]>> = {
  clean: [
    { value: 0, label: 'Easy' },
    { value: 1, label: 'Funny' },
    { value: 3, label: 'Wild' },
    { value: 4, label: 'Max' },
  ],
  adult: [
    { value: 0, label: 'Chill' },
    { value: 1, label: 'Flirty' },
    { value: 2, label: 'Bold' },
    { value: 3, label: 'Chaos' },
  ],
};

export function createTelegramPresentationDraft(profileName = 'Telegram Player'): TelegramPresentationDraft {
  return {
    profileName,
    roomName: 'Night Squad',
    world: 'clean',
    ceiling: 3,
    mode: 'party',
    playerCount: 5,
    sources: { original: true, community: true, house: true, live: true },
    qaHand: true,
  };
}

function modeById(mode: TelegramRoomMode): ModeOption {
  return ROOM_MODES.find(item => item.id === mode) ?? ROOM_MODES[2];
}

function setStatus(root: HTMLElement, message: string, tone: 'neutral' | 'success' | 'warning' = 'neutral'): void {
  const status = root.querySelector<HTMLElement>('[data-action-status]');
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function syncPlayerCounts(root: HTMLElement, draft: TelegramPresentationDraft): void {
  const mode = modeById(draft.mode);
  const grid = root.querySelector<HTMLElement>('[data-player-grid]');
  if (grid) {
    grid.innerHTML = Array.from({ length: 9 }, (_, index) => index + 2).map(count => {
      const allowed = count >= mode.min && count <= mode.max;
      return `<button class="tg-count-chip" type="button" data-player-count="${count}" aria-pressed="${String(count === draft.playerCount)}"${allowed ? '' : ' disabled'}>${count}</button>`;
    }).join('');
  }
  const value = root.querySelector<HTMLElement>('[data-player-count-value]');
  if (value) value.textContent = String(draft.playerCount);
}

function syncMode(root: HTMLElement, draft: TelegramPresentationDraft): void {
  const mode = modeById(draft.mode);
  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === draft.mode));
  });
  const copy = root.querySelector<HTMLElement>('[data-mode-copy]');
  if (copy) copy.textContent = mode.copy;
  syncPlayerCounts(root, draft);
}

function syncWorld(root: HTMLElement, draft: TelegramPresentationDraft): void {
  const world = root.querySelector<HTMLSelectElement>('[data-world]');
  if (world) world.value = draft.world;
  const options = CEILINGS[draft.world];
  if (!options.some(option => option.value === draft.ceiling)) draft.ceiling = options[0].value;
  const ceiling = root.querySelector<HTMLSelectElement>('[data-ceiling]');
  if (ceiling) {
    ceiling.innerHTML = options.map(option =>
      `<option value="${option.value}"${option.value === draft.ceiling ? ' selected' : ''}>${option.label}</option>`
    ).join('');
  }
}

function syncSources(root: HTMLElement, draft: TelegramPresentationDraft): void {
  root.querySelectorAll<HTMLButtonElement>('[data-source]').forEach(button => {
    const source = button.dataset.source as TelegramPromptSource | undefined;
    if (!source || !(source in draft.sources)) return;
    const active = draft.sources[source];
    button.setAttribute('aria-pressed', String(active));
    const marker = button.querySelector<HTMLElement>('i');
    if (marker) marker.textContent = active ? '✓' : '';
  });
}

function syncDraft(root: HTMLElement, draft: TelegramPresentationDraft): void {
  const profile = root.querySelector<HTMLInputElement>('[data-profile-input]');
  const room = root.querySelector<HTMLInputElement>('[data-room-name]');
  const qa = root.querySelector<HTMLInputElement>('[data-qa-hand]');
  if (profile) profile.value = draft.profileName;
  if (room) room.value = draft.roomName;
  if (qa) qa.checked = draft.qaHand;
  syncWorld(root, draft);
  syncMode(root, draft);
  syncSources(root, draft);
}

export interface TelegramTopMenuOptions {
  readonly inGame?: boolean;
  readonly connected?: boolean;
  readonly onSimulation?: () => void;
  readonly onRoomSetup?: () => void;
  readonly onAccount?: () => void;
  readonly onClose?: () => void;
}

type TelegramPopupButton = {
  readonly id?: string;
  readonly type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
  readonly text?: string;
};

type TelegramNativeExtras = {
  readonly close?: () => void;
  readonly showPopup?: (
    params: {
      readonly title?: string;
      readonly message: string;
      readonly buttons?: readonly TelegramPopupButton[];
    },
    callback?: (buttonId: string) => void,
  ) => void;
  readonly HapticFeedback?: {
    readonly impactOccurred?: (style: 'light') => void;
  };
};

function nativeTelegram(root: HTMLElement): TelegramNativeExtras | undefined {
  const win = root.ownerDocument.defaultView as (Window & {
    Telegram?: { WebApp?: TelegramNativeExtras };
  }) | null;
  return win?.Telegram?.WebApp;
}

function setMenuStatus(root: HTMLElement, text: string, tone: 'neutral' | 'success' | 'warning' = 'neutral'): void {
  const status = root.querySelector<HTMLElement>('[data-action-status],[data-game-status]');
  if (!status) return;
  status.textContent = text;
  status.dataset.tone = tone;
}

export function mountTelegramTopMenuController(
  root: HTMLElement,
  options: TelegramTopMenuOptions = {},
): () => void {
  const openTopMenu = (): void => {
    const tg = nativeTelegram(root);
    tg?.HapticFeedback?.impactOccurred?.('light');
    const connected = Boolean(options.connected);
    const inGame = options.inGame ?? Boolean(root.querySelector('[data-game-simulation]'));

    const buttons: readonly TelegramPopupButton[] = inGame
      ? [
          { id: 'room', type: 'default', text: 'Room Setup' },
          { id: 'account', type: 'default', text: connected ? 'Account: Connected' : 'Account: Reconnect' },
          { id: 'close', type: 'destructive', text: 'Close App' },
        ]
      : [
          { id: 'simulation', type: 'default', text: 'Start Simulation' },
          { id: 'account', type: 'default', text: connected ? 'Account: Connected' : 'Account: Reconnect' },
          { id: 'close', type: 'destructive', text: 'Close App' },
        ];

    const handleChoice = (buttonId: string): void => {
      if (buttonId === 'simulation') {
        if (options.onSimulation) options.onSimulation();
        else root.querySelector<HTMLButtonElement>('[data-action="demo-game"]')?.click();
        return;
      }
      if (buttonId === 'room') {
        if (options.onRoomSetup) options.onRoomSetup();
        else root.querySelector<HTMLButtonElement>('[data-game-back]')?.click();
        return;
      }
      if (buttonId === 'account') {
        if (options.onAccount) options.onAccount();
        else setMenuStatus(root, 'Telegram authentication is not established for this launch.', 'warning');
        return;
      }
      if (buttonId === 'close') {
        options.onClose?.();
        tg?.close?.();
      }
    };

    if (tg?.showPopup) {
      tg.showPopup(
        {
          title: 'Cribbit Chaos',
          message: connected
            ? 'Live account connected.'
            : 'Live account needs authentication. Simulation is still available.',
          buttons,
        },
        handleChoice,
      );
      return;
    }

    root.querySelector<HTMLElement>('[data-tg-menu-fallback]')?.remove();
    const fallback = root.ownerDocument.createElement('div');
    fallback.setAttribute('data-tg-menu-fallback', '');
    fallback.style.position = 'fixed';
    fallback.style.inset = '0';
    fallback.style.zIndex = '9999';
    fallback.style.display = 'grid';
    fallback.style.placeItems = 'end center';
    fallback.style.padding = '16px';
    fallback.style.background = 'rgba(0,0,0,.62)';
    fallback.innerHTML = `
      <section class="tg-setup-card" style="width:min(100%,430px);display:grid;gap:8px" role="dialog" aria-modal="true" aria-label="Cribbit menu">
        <div class="tg-section-label"><span>Cribbit Menu</span><small>${connected ? 'Account connected' : 'Authentication required'}</small></div>
        ${buttons.map(button => `<button class="tg-button" type="button" data-menu-choice="${button.id ?? ''}">${button.text ?? button.id ?? 'Action'}</button>`).join('')}
        <button class="tg-button" type="button" data-menu-dismiss>Cancel</button>
      </section>`;

    fallback.addEventListener('click', event => {
      const element = event.target instanceof Element ? event.target : null;
      const choice = element?.closest<HTMLElement>('[data-menu-choice]')?.dataset.menuChoice;
      if (choice) {
        fallback.remove();
        handleChoice(choice);
        return;
      }
      if (element?.matches('[data-menu-dismiss]') || element === fallback) fallback.remove();
    });
    root.ownerDocument.body.append(fallback);
  };

  const onMenuClick = (event: Event): void => {
    const element = event.target instanceof Element
      ? event.target.closest<HTMLElement>('[data-tg-menu],[data-game-info]')
      : null;
    if (!element) return;
    event.preventDefault();
    event.stopPropagation();
    openTopMenu();
  };

  root.addEventListener('click', onMenuClick, true);
  return () => {
    root.removeEventListener('click', onMenuClick, true);
    root.ownerDocument.querySelector<HTMLElement>('[data-tg-menu-fallback]')?.remove();
  };
}

export function mountTelegramPresentationController(
  root: HTMLElement,
  draft: TelegramPresentationDraft,
  menuOptions: TelegramTopMenuOptions = {},
): () => void {
  syncDraft(root, draft);
  const unmountMenu = mountTelegramTopMenuController(root, { ...menuOptions, inGame: false });

  const onClick = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const modeButton = target.closest<HTMLButtonElement>('[data-mode]');
    if (modeButton?.dataset.mode) {
      const next = ROOM_MODES.find(item => item.id === modeButton.dataset.mode);
      if (!next) return;
      draft.mode = next.id;
      draft.playerCount = next.defaultPlayers;
      syncMode(root, draft);
      return;
    }

    const countButton = target.closest<HTMLButtonElement>('[data-player-count]');
    if (countButton?.dataset.playerCount && !countButton.disabled) {
      draft.playerCount = Number(countButton.dataset.playerCount);
      syncPlayerCounts(root, draft);
      return;
    }

    const sourceButton = target.closest<HTMLButtonElement>('[data-source]');
    if (sourceButton?.dataset.source) {
      const source = sourceButton.dataset.source as TelegramPromptSource;
      if (!(source in draft.sources)) return;
      draft.sources[source] = !draft.sources[source];
      syncSources(root, draft);
      return;
    }

    if (target.closest('[data-tg-back]')) {
      if (root.ownerDocument.defaultView?.history.length && root.ownerDocument.defaultView.history.length > 1) {
        root.ownerDocument.defaultView.history.back();
      } else {
        setStatus(root, 'Back navigation is handled by the Telegram host when opened as a Mini App.', 'neutral');
      }
      return;
    }

  };

  const onInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;

    if (target.matches('[data-profile-input]')) {
      draft.profileName = target.value.slice(0, 20);
      return;
    }
    if (target.matches('[data-room-name]')) {
      draft.roomName = target.value.slice(0, 28);
      return;
    }
    if (target.matches('[data-world]')) {
      draft.world = target.value === 'adult' ? 'adult' : 'clean';
      syncWorld(root, draft);
      return;
    }
    if (target.matches('[data-ceiling]')) {
      draft.ceiling = Number(target.value);
      return;
    }
    if (target.matches('[data-qa-hand]') && target instanceof HTMLInputElement) {
      draft.qaHand = target.checked;
    }
  };

  const onKeydown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.matches('[data-join-code]') || event.key !== 'Enter') return;
    event.preventDefault();
    root.querySelector<HTMLButtonElement>('[data-action="join-room"]')?.click();
  };

  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('keydown', onKeydown);

  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('input', onInput);
    root.removeEventListener('change', onInput);
    root.removeEventListener('keydown', onKeydown);
    unmountMenu();
  };
}
