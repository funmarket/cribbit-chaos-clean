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

export function mountTelegramPresentationController(
  root: HTMLElement,
  draft: TelegramPresentationDraft,
): () => void {
  syncDraft(root, draft);

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

    if (target.closest('[data-tg-menu]')) {
      setStatus(root, 'Room setup controls are active below. Live game actions stay server-authoritative.', 'neutral');
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
    if (target.matches('[data-qa-hand]')) {
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
  };
}
