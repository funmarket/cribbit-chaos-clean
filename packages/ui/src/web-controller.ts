// Presentation-only controller extracted from the old Cribbit Web UI behavior.
// This module owns DOM navigation, dialogs, read-only discovery presentation, and local form affordances.
// It MUST NOT own game legality, deck/hand/session state, winner state, or persistent prompt/library mutations.

export type WebProductView =
  | 'lobby'
  | 'rooms'
  | 'game'
  | 'board'
  | 'library'
  | 'create'
  | 'call'
  | 'lab'
  | 'recap';

export interface WebPresentationControllerOptions {
  readonly canOpenGame?: () => boolean;
  readonly canOpenRecap?: () => boolean;
}

interface PromptPreview {
  readonly id: string;
  readonly type: 'truth' | 'dare' | 'paranoia' | 'duel' | 'chaos';
  readonly text: string;
  readonly world: 'clean' | 'adult';
  readonly source: 'original' | 'community' | 'house' | 'live';
  readonly author: string;
  readonly category: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly saved: number;
  readonly plays: number;
  readonly staffPick: boolean;
  readonly legendary: boolean;
  readonly createdAt: number;
}

interface PresentationState {
  view: WebProductView;
  boardTab: string;
  libraryTab: 'my' | 'house' | 'live' | 'history';
  createDestination: 'my' | 'house' | 'live' | 'community';
  currentFilter: string;
  promptSearch: string;
  profileName: string;
  world: 'clean' | 'adult';
  roomWeights: Record<'original' | 'community' | 'house' | 'live', number>;
  roomCategories: Set<string>;
  roomVibe: { from: number; to: number };
}

const VIEWS = new Set<WebProductView>(['lobby', 'rooms', 'game', 'board', 'library', 'create', 'call', 'lab', 'recap']);
const BOARD_TABS = [
  ['all', 'Discover All'],
  ['original', 'Cribbit Originals'],
  ['community', 'Community CHAOS'],
  ['trending', 'Trending'],
  ['saved', 'Most Saved'],
  ['new', 'New'],
  ['staff', 'Staff Pick'],
  ['legendary', 'Legendary'],
] as const;
const ROOM_CATEGORIES = [
  'Truth', 'Dare', 'Paranoia', 'Duel', 'Icebreakers', 'Funny', 'Friends', 'Couples',
  'Dorm', 'Party', 'Bold', 'Clean', 'Movies', 'School', 'Work', 'Travel', 'Creativity',
  'Most Likely To',
] as const;
const STAGES = {
  clean: ['Warm Up', 'Funny', 'Challenge', 'Wild', 'Final Chaos'],
  adult: ['Warm Up', 'Personal', 'Bold', 'Chaos', 'Endgame'],
} as const;

const BASE_PROMPTS: readonly PromptPreview[] = [
  ['clean-truth-school', 'truth', 'What is the funniest thing that ever happened to you at school?', 'clean', 'original', 'Cribbit'],
  ['clean-truth-talent', 'truth', 'What harmless talent would surprise this group the most?', 'clean', 'community', 'Zoe'],
  ['clean-truth-game', 'truth', 'Which game do you become unexpectedly competitive about?', 'clean', 'house', 'House Deck'],
  ['clean-dare-villain', 'dare', 'Act like a cartoon villain for 20 seconds. The group guesses the type.', 'clean', 'original', 'Cribbit'],
  ['clean-dare-movie', 'dare', 'Describe a famous movie without character names. The first correct guess ends the Dare.', 'clean', 'community', 'Arjun'],
  ['clean-dare-pose', 'dare', 'Hold the weirdest heroic pose you can invent until the next player begins.', 'clean', 'house', 'House Deck'],
  ['clean-paranoia-detective', 'paranoia', 'Who here would make the best cartoon detective?', 'clean', 'original', 'Cribbit'],
  ['clean-duel-countries', 'duel', 'You each have 15 seconds to name as many African countries as possible.', 'clean', 'original', 'Cribbit'],
  ['clean-chaos-animal', 'chaos', 'Everyone has 10 seconds to draw an animal. The active player chooses the funniest.', 'clean', 'original', 'Cribbit'],
  ['adult-truth-assumption', 'truth', 'What assumption does this group have about you that is completely wrong?', 'adult', 'original', 'Cribbit'],
  ['adult-truth-draft', 'truth', 'What is a message you drafted and never sent?', 'adult', 'live', 'Mia'],
  ['adult-truth-choice', 'truth', 'Which part of your reputation is most misunderstood?', 'adult', 'community', 'Sam'],
  ['adult-dare-nickname', 'dare', 'Let the group choose a harmless nickname you answer to until your next turn.', 'adult', 'original', 'Cribbit'],
  ['adult-dare-impression', 'dare', 'Do your best celebrity impression for 20 seconds.', 'adult', 'community', 'Nina'],
  ['adult-dare-story', 'dare', 'Tell a dramatic ten-second story using only three words chosen by the group.', 'adult', 'house', 'House Deck'],
  ['adult-paranoia-lie', 'paranoia', 'Choose privately: who here would be hardest to fool in a lie?', 'adult', 'original', 'Cribbit'],
  ['adult-paranoia-plan', 'paranoia', 'Who here is most likely to have a secret backup plan?', 'adult', 'community', 'Jordan'],
  ['adult-duel-liar', 'duel', 'You each get 15 seconds to convince the room you are the better liar. The room votes.', 'adult', 'original', 'Cribbit'],
  ['adult-chaos-reverse', 'chaos', 'Everyone answers the next eligible question in reverse turn order.', 'adult', 'original', 'Cribbit'],
].map(([id, type, text, world, source, author], index) => ({
  id,
  type: type as PromptPreview['type'],
  text,
  world: world as PromptPreview['world'],
  source: source as PromptPreview['source'],
  author,
  category:
    type === 'truth' ? (index % 2 ? 'Friends' : 'Funny')
      : type === 'dare' ? (index % 2 ? 'Party' : 'Creativity')
        : type === 'paranoia' ? 'Most Likely To'
          : type === 'duel' ? 'Challenge'
            : 'Party',
  minPlayers: type === 'duel' ? 2 : type === 'paranoia' ? 3 : 2,
  maxPlayers: 10,
  saved: Math.floor(420 + ((index + 3) * 337) % 4200),
  plays: Math.floor(1800 + ((index + 5) * 977) % 14500),
  staffPick: index % 5 === 0,
  legendary: index % 7 === 0,
  createdAt: Date.now() - index * 86_400_000,
}));

const NOTIFICATIONS = [
  { title: 'House Deck ready', copy: 'Save standout prompts in Recap to start building group lore.', tone: 'orange' },
  { title: 'Community moderation', copy: 'Suggesting globally is separate from saving privately.', tone: 'magenta' },
  { title: 'Privacy lock', copy: 'Passive call conversation never counts as gameplay input.', tone: 'cyan' },
] as const;

const ROUTES = [
  { label: 'Lobby', copy: 'Create or join a room.', view: 'lobby', icon: 'i-home', tone: 'var(--lime)' },
  { label: 'Tonight’s CHAOS', copy: 'Configure vibe, categories and source mix.', view: 'rooms', icon: 'i-users', tone: 'var(--orange)' },
  { label: 'CHAOS Board', copy: 'Browse official and community prompts.', view: 'board', icon: 'i-globe', tone: 'var(--magenta)' },
  { label: 'My Saved Deck', copy: 'Private favorites.', view: 'library', icon: 'i-bookmark', tone: 'var(--cyan)' },
  { label: 'Create Prompt', copy: 'Choose a destination first.', view: 'create', icon: 'i-send', tone: 'var(--lime)' },
  { label: 'Call Mode', copy: 'Use explicit answer paths during a group call.', view: 'call', icon: 'i-mic', tone: 'var(--teal)' },
  { label: 'Rules & Lab', copy: 'Inspect contracts and balancing knobs.', view: 'lab', icon: 'i-info', tone: 'var(--gold)' },
] as const;

const esc = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[char] ?? char);

const icon = (id: string): string => `<svg class="icon" aria-hidden="true"><use href="#${id}"></use></svg>`;

function query<T extends Element>(root: ParentNode, selector: string): T | null {
  return root.querySelector<T>(selector);
}

function queryAll<T extends Element>(root: ParentNode, selector: string): T[] {
  return [...root.querySelectorAll<T>(selector)];
}

function promptAccent(prompt: PromptPreview): string {
  if (prompt.type === 'truth') return 'var(--lime)';
  if (prompt.type === 'dare') return 'var(--orange)';
  if (prompt.type === 'paranoia') return 'var(--purple)';
  if (prompt.type === 'duel') return 'var(--cyan)';
  return 'var(--magenta)';
}

function promptTone(prompt: PromptPreview): string {
  if (prompt.type === 'truth') return 'lime';
  if (prompt.type === 'dare') return 'orange';
  if (prompt.type === 'paranoia') return 'purple';
  if (prompt.type === 'duel') return 'cyan';
  return 'magenta';
}

function resetViewScroll(root: HTMLElement): void {
  const win = root.ownerDocument.defaultView;
  if (!win) return;
  win.scrollTo(0, 0);
}

function openDialog(root: HTMLElement, id: string): void {
  const dialog = query<HTMLDialogElement>(root, `#${id}`);
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.setAttribute('open', '');
  }
}

function closeDialog(root: HTMLElement, id: string): void {
  const dialog = query<HTMLDialogElement>(root, `#${id}`);
  if (!dialog) return;
  if (typeof dialog.close === 'function' && dialog.open) dialog.close();
  else dialog.removeAttribute('open');
}

function toast(root: HTMLElement, title: string, copy: string, tone = 'cyan'): void {
  const region = query<HTMLElement>(root, '#toastRegion');
  if (!region) return;
  const node = root.ownerDocument.createElement('article');
  node.className = 'toast';
  node.dataset.tone = tone;
  node.innerHTML = `<b>${esc(title)}</b><span>${esc(copy)}</span>`;
  region.append(node);
  root.ownerDocument.defaultView?.setTimeout(() => node.remove(), 3600);
}

function destinationMeta(destination: PresentationState['createDestination']) {
  return {
    my: { label: 'My Saved Deck', color: 'var(--cyan)', copy: 'This prompt will be saved instantly and privately to My Saved Deck.' },
    house: { label: 'House Deck', color: 'var(--orange)', copy: 'This prompt will be stored privately for the recurring room or household.' },
    live: { label: 'Current Game', color: 'var(--lime)', copy: 'This prompt will be moderated for tonight and, if accepted, enter the sealed Live Room Pool.' },
    community: { label: 'Suggest to CHAOS Board', color: 'var(--magenta)', copy: 'This prompt will enter moderation, duplicate and quality checks before Community CHAOS approval.' },
  }[destination];
}

function renderBoard(root: HTMLElement, state: PresentationState): void {
  const tabs = query<HTMLElement>(root, '#boardTabs');
  if (tabs) {
    tabs.innerHTML = BOARD_TABS.map(([id, label]) =>
      `<button class="seg-button" data-board-tab="${id}" aria-pressed="${String(state.boardTab === id)}" type="button">${label}</button>`
    ).join('');
  }

  const filters = query<HTMLElement>(root, '#familyFilters');
  if (filters && !filters.children.length) {
    filters.innerHTML = ['all', 'truth', 'dare', 'paranoia', 'duel', 'chaos'].map(filter =>
      `<button class="chip-button" data-filter="${filter}" aria-pressed="${String(state.currentFilter === filter)}" type="button">${filter === 'all' ? 'All families' : filter}</button>`
    ).join('');
  }
  queryAll<HTMLButtonElement>(root, '#familyFilters .chip-button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === state.currentFilter));
  });

  const search = state.promptSearch.trim().toLowerCase();
  let prompts = BASE_PROMPTS.filter(prompt => {
    if (prompt.world !== state.world) return false;
    if (!['original', 'community'].includes(prompt.source)) return false;
    if (state.currentFilter !== 'all' && prompt.type !== state.currentFilter) return false;
    if (search && !`${prompt.text} ${prompt.source} ${prompt.author} ${prompt.category}`.toLowerCase().includes(search)) return false;
    if (state.boardTab === 'original' && prompt.source !== 'original') return false;
    if (state.boardTab === 'community' && prompt.source !== 'community') return false;
    if (state.boardTab === 'staff' && !prompt.staffPick) return false;
    if (state.boardTab === 'legendary' && !prompt.legendary) return false;
    return true;
  });
  if (state.boardTab === 'trending') prompts = [...prompts].sort((a, b) => (b.plays + b.saved) - (a.plays + a.saved));
  if (state.boardTab === 'saved') prompts = [...prompts].sort((a, b) => b.saved - a.saved);
  if (state.boardTab === 'new') prompts = [...prompts].sort((a, b) => b.createdAt - a.createdAt);

  const meta = query<HTMLElement>(root, '#boardResultMeta');
  if (meta) meta.textContent = `${prompts.length} ${state.world === 'clean' ? 'Clean' : 'Adult'} prompt${prompts.length === 1 ? '' : 's'} · official and approved community content.`;

  const list = query<HTMLElement>(root, '#promptList');
  if (list) {
    list.innerHTML = prompts.map(prompt => `
      <article class="prompt-card" style="--prompt-accent:${promptAccent(prompt)}">
        <div class="prompt-card__top">
          <span class="tag" data-tone="${promptTone(prompt)}">${esc(prompt.type)}</span>
          <span class="content-badge" style="--badge-color:${prompt.source === 'original' ? 'var(--lime)' : 'var(--magenta)'}">${prompt.source === 'original' ? 'CRIBBIT ORIGINAL ✓' : 'COMMUNITY CHAOS 🔥'}</span>
        </div>
        <h3>${esc(prompt.text)}</h3>
        <div class="prompt-card__meta">
          <span class="tag">${esc(prompt.category)}</span>
          <span class="tag">${esc(prompt.world)}</span>
          <span class="tag">${prompt.minPlayers}–${prompt.maxPlayers} players</span>
        </div>
        <div class="prompt-card__signals">
          <span>★ ${prompt.saved.toLocaleString()} saved</span>
          <span>🔥 ${prompt.plays.toLocaleString()} plays</span>
          ${prompt.staffPick ? '<span>✓ Staff Pick</span>' : ''}
          ${prompt.legendary ? '<span>♛ Legendary</span>' : ''}
        </div>
        <div class="prompt-card__actions prompt-card__actions--three">
          <button class="button" type="button" disabled title="Server-backed library persistence is not connected yet">♡ Save</button>
          <button class="button" type="button" disabled title="Server-backed room-pool persistence is not connected yet">+ Add to Room</button>
          <button class="button" data-presentation-action="prompt-detail" data-prompt-id="${esc(prompt.id)}" type="button">Details</button>
        </div>
      </article>
    `).join('') || `<div class="empty-state">${icon('i-search')}<h3>No matching prompts</h3><p>Change the discovery tab, family filter, search text or content world.</p></div>`;
  }
}

function renderLibrary(root: HTMLElement, state: PresentationState): void {
  const tabs = query<HTMLElement>(root, '#libraryTabs');
  const labels = [['my', 'My Saved Deck'], ['house', 'House Deck'], ['live', 'Live Room Pool'], ['history', 'Resolved Moments']] as const;
  if (tabs) {
    tabs.innerHTML = labels.map(([id, label]) =>
      `<button class="seg-button" data-library-tab="${id}" aria-pressed="${String(state.libraryTab === id)}" type="button">${label}</button>`
    ).join('');
  }

  const metadata = {
    my: ['My Saved Deck', 'Private favorites for future games.'],
    house: ['House Deck', 'Private recurring prompts and group lore.'],
    live: ['Live Room Pool', 'The exact prompts eligible tonight.'],
    history: ['Resolved Moments', 'Prompts that landed during played sessions.'],
  } as const;
  const [title, copy] = metadata[state.libraryTab];
  const titleNode = query<HTMLElement>(root, '#libraryPanelTitle');
  const copyNode = query<HTMLElement>(root, '#libraryPanelCopy');
  if (titleNode) titleNode.textContent = title;
  if (copyNode) copyNode.textContent = copy;

  for (const id of ['libraryMetricMy', 'libraryMetricHouse', 'libraryMetricLive', 'libraryMetricHistory']) {
    const node = query<HTMLElement>(root, `#${id}`);
    if (node) node.textContent = '0';
  }

  const list = query<HTMLElement>(root, '#libraryPageList');
  if (list) {
    list.innerHTML = `<div class="empty-state">${icon('i-bookmark')}<h3>${esc(title)} is empty</h3><p>Persistent saved-deck data will appear here from the clean server API; this UI does not recreate legacy local storage.</p></div>`;
  }
}

function renderCreate(root: HTMLElement, state: PresentationState): void {
  const meta = destinationMeta(state.createDestination);
  queryAll<HTMLButtonElement>(root, '#destinationGrid [data-create-destination]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.createDestination === state.createDestination));
  });
  const summary = query<HTMLElement>(root, '#createDestinationSummary');
  if (summary) {
    summary.textContent = meta.copy;
    summary.style.setProperty('--destination', meta.color);
  }
  const label = query<HTMLElement>(root, '#currentDestinationLabel');
  if (label) label.textContent = `Destination: ${meta.label}`;
  const communityFields = query<HTMLElement>(root, '#communityFields');
  if (communityFields) communityFields.hidden = state.createDestination !== 'community';
}

function eligibleRoomPrompts(state: PresentationState): PromptPreview[] {
  return BASE_PROMPTS.filter(prompt => {
    const typeName = prompt.type[0].toUpperCase() + prompt.type.slice(1);
    return prompt.world === state.world && (state.roomCategories.has(prompt.category) || state.roomCategories.has(typeName));
  });
}

function renderRooms(root: HTMLElement, state: PresentationState): void {
  const sourceNames = ['Original', 'Community', 'House', 'Live'] as const;
  sourceNames.forEach(sourceName => {
    const key = sourceName.toLowerCase() as keyof PresentationState['roomWeights'];
    const input = query<HTMLInputElement>(root, `#roomWeight${sourceName}`);
    const output = query<HTMLOutputElement>(root, `#roomWeight${sourceName}Value`);
    if (input) input.value = String(state.roomWeights[key]);
    if (output) output.textContent = `${state.roomWeights[key]}%`;
  });

  const total = Object.values(state.roomWeights).reduce((sum, value) => sum + value, 0);
  const totalNode = query<HTMLElement>(root, '#roomMixTotal');
  if (totalNode) {
    totalNode.textContent = `${total}%`;
    totalNode.style.color = total === 100 ? 'var(--lime)' : 'var(--orange)';
  }

  const from = query<HTMLSelectElement>(root, '#roomVibeStart');
  const to = query<HTMLSelectElement>(root, '#roomVibeEnd');
  const stages = STAGES[state.world];
  if (from) from.innerHTML = stages.map((label, index) => `<option value="${index}"${state.roomVibe.from === index ? ' selected' : ''}>${esc(label)}</option>`).join('');
  if (to) to.innerHTML = stages.map((label, index) => `<option value="${index}"${state.roomVibe.to === index ? ' selected' : ''}>${esc(label)}</option>`).join('');

  const categoryGrid = query<HTMLElement>(root, '#roomCategoryGrid');
  if (categoryGrid) {
    categoryGrid.innerHTML = ROOM_CATEGORIES.map(category =>
      `<button class="category-chip" data-room-category="${esc(category)}" aria-pressed="${String(state.roomCategories.has(category))}" type="button">${esc(category)}</button>`
    ).join('');
  }

  const eligible = eligibleRoomPrompts(state);
  const counts = { original: 0, community: 0, house: 0, live: 0 };
  eligible.forEach(prompt => { counts[prompt.source] += 1; });
  const metrics = {
    roomMetricOriginal: counts.original,
    roomMetricCommunity: counts.community,
    roomMetricHouse: counts.house,
    roomMetricLive: counts.live,
  };
  Object.entries(metrics).forEach(([id, value]) => {
    const node = query<HTMLElement>(root, `#${id}`);
    if (node) node.textContent = String(value);
  });

  const poolMeta = query<HTMLElement>(root, '#roomPoolMeta');
  if (poolMeta) poolMeta.textContent = `${eligible.length} currently eligible prompts · source mix ${total}%`;
  const preview = query<HTMLElement>(root, '#roomPoolPreview');
  if (preview) {
    preview.innerHTML = eligible.slice(0, 12).map(prompt => `
      <article class="room-preview-item" style="--preview:${promptAccent(prompt)}">
        ${icon('i-card')}
        <span><b>${esc(prompt.text)}</b><span>${esc(prompt.source)} · ${esc(prompt.category)}</span></span>
        <button class="icon-button" data-presentation-action="prompt-detail" data-prompt-id="${esc(prompt.id)}" type="button" aria-label="Open prompt details">${icon('i-info')}</button>
      </article>
    `).join('') || `<div class="empty-state">${icon('i-cards')}<h3>No eligible prompts</h3><p>Enable a category.</p></div>`;
  }
}

function renderGlobalSearch(root: HTMLElement, queryText: string): void {
  const q = queryText.trim().toLowerCase();
  const routeResults = ROUTES.filter(item => !q || `${item.label} ${item.copy}`.toLowerCase().includes(q));
  const results = query<HTMLElement>(root, '#globalSearchResults');
  if (!results) return;
  results.innerHTML = routeResults.map(item => `
    <button class="utility-result" data-nav="${item.view}" type="button" style="--result:${item.tone}">
      ${icon(item.icon)}
      <span><b>${esc(item.label)}</b><span>${esc(item.copy)}</span></span>
      <small>Page</small>
    </button>
  `).join('') || `<div class="empty-state">${icon('i-search')}<h3>No results</h3></div>`;
}

function renderNotifications(root: HTMLElement): void {
  const list = query<HTMLElement>(root, '#notificationList');
  if (!list) return;
  list.innerHTML = NOTIFICATIONS.map(note => `
    <article class="utility-result" style="--result:var(--${note.tone})">
      ${icon(note.tone === 'orange' ? 'i-home' : note.tone === 'magenta' ? 'i-globe' : 'i-shield')}
      <span><b>${esc(note.title)}</b><span>${esc(note.copy)}</span></span>
      <small>New</small>
    </article>
  `).join('');
}

function renderPromptDetail(root: HTMLElement, promptId: string): void {
  const prompt = BASE_PROMPTS.find(item => item.id === promptId);
  if (!prompt) return;
  const body = query<HTMLElement>(root, '#cardDialogBody');
  if (!body) return;
  body.innerHTML = `
    <div class="prompt-display" style="--flow-accent:${promptAccent(prompt)}">
      <div class="prompt-display__meta">
        <span class="tag" data-tone="${promptTone(prompt)}">${esc(prompt.type)}</span>
        <span class="tag">${esc(prompt.source)}</span>
        <span class="tag">${esc(prompt.category)}</span>
      </div>
      <h3>${esc(prompt.text)}</h3>
      <p>${esc(prompt.author)} · ${prompt.minPlayers}–${prompt.maxPlayers} players · ${prompt.saved.toLocaleString()} saves · ${prompt.plays.toLocaleString()} plays</p>
    </div>
  `;
  openDialog(root, 'cardDialog');
}

function renderView(root: HTMLElement, state: PresentationState): void {
  if (state.view === 'rooms') renderRooms(root, state);
  if (state.view === 'board') renderBoard(root, state);
  if (state.view === 'library') renderLibrary(root, state);
  if (state.view === 'create') renderCreate(root, state);
}

export function mountWebPresentationController(
  root: HTMLElement,
  options: WebPresentationControllerOptions = {},
): () => void {
  const profileInput = query<HTMLInputElement>(root, '#profileName');
  const worldInput = query<HTMLSelectElement>(root, '#worldSelect');
  const activeView = query<HTMLElement>(root, '.view.is-active')?.dataset.view;
  const state: PresentationState = {
    view: VIEWS.has(activeView as WebProductView) ? activeView as WebProductView : 'lobby',
    boardTab: 'all',
    libraryTab: 'my',
    createDestination: 'my',
    currentFilter: 'all',
    promptSearch: '',
    profileName: profileInput?.value.trim() || 'You',
    world: worldInput?.value === 'adult' ? 'adult' : 'clean',
    roomWeights: { original: 50, community: 20, house: 20, live: 10 },
    roomCategories: new Set(['Truth', 'Dare', 'Friends', 'Funny', 'Party', 'Most Likely To']),
    roomVibe: { from: 0, to: 2 },
  };

  const showView = (requested: string | undefined): void => {
    if (!requested || !VIEWS.has(requested as WebProductView)) return;
    let next = requested as WebProductView;
    if (next === 'game' && options.canOpenGame && !options.canOpenGame()) {
      toast(root, 'No active game', 'Create or join a room, then start the game first.', 'orange');
      next = 'lobby';
    }
    if (next === 'recap' && options.canOpenRecap && !options.canOpenRecap()) {
      toast(root, 'No completed game', 'A recap appears after a game has a winner.', 'orange');
      next = 'lobby';
    }
    state.view = next;
    root.ownerDocument.body.classList.toggle('is-game-view', next === 'game');
    queryAll<HTMLElement>(root, '.view').forEach(section => section.classList.toggle('is-active', section.dataset.view === next));
    queryAll<HTMLElement>(root, '[data-nav]').forEach(button => {
      button.setAttribute('aria-current', button.getAttribute('data-nav') === next ? 'page' : 'false');
    });
    renderView(root, state);
    resetViewScroll(root);
  };

  renderBoard(root, state);
  renderLibrary(root, state);
  renderCreate(root, state);
  renderRooms(root, state);

  const onClick = (event: Event): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const nav = target.closest<HTMLElement>('[data-nav]');
    if (nav) {
      event.preventDefault();
      if (nav.dataset.boardTab) state.boardTab = nav.dataset.boardTab;
      if (nav.dataset.libraryTab && ['my', 'house', 'live', 'history'].includes(nav.dataset.libraryTab)) {
        state.libraryTab = nav.dataset.libraryTab as PresentationState['libraryTab'];
      }
      if (nav.dataset.createDestination && ['my', 'house', 'live', 'community'].includes(nav.dataset.createDestination)) {
        state.createDestination = nav.dataset.createDestination as PresentationState['createDestination'];
      }
      nav.closest<HTMLDialogElement>('dialog[open]')?.close();
      showView(nav.dataset.nav);
      if (nav.dataset.roomAnchor) {
        root.ownerDocument.defaultView?.requestAnimationFrame(() =>
          query<HTMLElement>(root, `#${nav.dataset.roomAnchor}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        );
      }
      return;
    }

    const boardTab = target.closest<HTMLElement>('[data-board-tab]');
    if (boardTab?.dataset.boardTab) {
      state.boardTab = boardTab.dataset.boardTab;
      state.view = 'board';
      showView('board');
      return;
    }

    const libraryTab = target.closest<HTMLElement>('[data-library-tab]');
    if (libraryTab?.dataset.libraryTab && ['my', 'house', 'live', 'history'].includes(libraryTab.dataset.libraryTab)) {
      state.libraryTab = libraryTab.dataset.libraryTab as PresentationState['libraryTab'];
      state.view = 'library';
      showView('library');
      return;
    }

    const destination = target.closest<HTMLElement>('[data-create-destination]');
    if (destination?.dataset.createDestination && ['my', 'house', 'live', 'community'].includes(destination.dataset.createDestination)) {
      state.createDestination = destination.dataset.createDestination as PresentationState['createDestination'];
      state.view = 'create';
      showView('create');
      return;
    }

    const filter = target.closest<HTMLElement>('[data-filter]');
    if (filter?.dataset.filter) {
      state.currentFilter = filter.dataset.filter;
      renderBoard(root, state);
      return;
    }

    const category = target.closest<HTMLElement>('[data-room-category]');
    if (category?.dataset.roomCategory) {
      const value = category.dataset.roomCategory;
      if (state.roomCategories.has(value)) state.roomCategories.delete(value);
      else state.roomCategories.add(value);
      if (!state.roomCategories.size) state.roomCategories.add('Truth');
      renderRooms(root, state);
      return;
    }

    const close = target.closest<HTMLElement>('[data-close-dialog]');
    if (close?.dataset.closeDialog) {
      closeDialog(root, close.dataset.closeDialog);
      return;
    }

    const detail = target.closest<HTMLElement>('[data-presentation-action="prompt-detail"]');
    if (detail?.dataset.promptId) {
      renderPromptDetail(root, detail.dataset.promptId);
      return;
    }

    const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (!action) return;

    if (action === 'open-mobile-nav') {
      openDialog(root, 'mobileNavDialog');
      return;
    }
    if (action === 'open-global-search') {
      renderGlobalSearch(root, '');
      openDialog(root, 'searchDialog');
      root.ownerDocument.defaultView?.setTimeout(() => query<HTMLInputElement>(root, '#globalSearchInput')?.focus(), 50);
      return;
    }
    if (action === 'open-notifications') {
      renderNotifications(root);
      openDialog(root, 'notificationsDialog');
      return;
    }
    if (action === 'open-profile') {
      const dialogName = query<HTMLInputElement>(root, '#profileDialogName');
      const dialogWorld = query<HTMLSelectElement>(root, '#profileDialogWorld');
      if (dialogName) dialogName.value = state.profileName;
      if (dialogWorld) dialogWorld.value = state.world;
      openDialog(root, 'profileDialog');
      return;
    }
    if (action === 'save-profile') {
      state.profileName = query<HTMLInputElement>(root, '#profileDialogName')?.value.trim() || 'You';
      state.world = query<HTMLSelectElement>(root, '#profileDialogWorld')?.value === 'adult' ? 'adult' : 'clean';
      if (profileInput) profileInput.value = state.profileName;
      if (worldInput) worldInput.value = state.world;
      const chip = query<HTMLElement>(root, '.profile-chip');
      if (chip) chip.textContent = state.profileName.slice(0, 1).toUpperCase() || 'Y';
      closeDialog(root, 'profileDialog');
      renderBoard(root, state);
      renderRooms(root, state);
      toast(root, 'Profile updated', 'Display preferences are applied to this client view.', 'lime');
      return;
    }
    if (action === 'apply-room-config') {
      const total = Object.values(state.roomWeights).reduce((sum, value) => sum + value, 0);
      if (total !== 100) {
        toast(root, 'Source mix must equal 100%', 'Adjust the four source weights before applying the room.', 'orange');
        return;
      }
      toast(root, 'Room setup ready', `${eligibleRoomPrompts(state).length} prompts are currently eligible in this presentation. Persistent room-pool saving remains server-owned.`, 'lime');
      return;
    }
    if (action === 'reset-demo') {
      root.ownerDocument.defaultView?.location.reload();
    }
  };

  const onInput = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
    if (target.id === 'globalSearchInput') {
      renderGlobalSearch(root, target.value);
      return;
    }
    if (target.id === 'promptSearch') {
      state.promptSearch = target.value;
      renderBoard(root, state);
      return;
    }
    if (target.id === 'worldSelect') {
      state.world = target.value === 'adult' ? 'adult' : 'clean';
      renderBoard(root, state);
      renderRooms(root, state);
      return;
    }
    const weightMatch = /^roomWeight(Original|Community|House|Live)$/.exec(target.id);
    if (weightMatch) {
      const key = weightMatch[1].toLowerCase() as keyof PresentationState['roomWeights'];
      state.roomWeights[key] = Number(target.value);
      renderRooms(root, state);
      return;
    }
    if (target.id === 'roomVibeStart') {
      state.roomVibe.from = Number(target.value);
      return;
    }
    if (target.id === 'roomVibeEnd') state.roomVibe.to = Number(target.value);
  };

  const onSubmit = (event: SubmitEvent): void => {
    const form = event.target instanceof HTMLFormElement ? event.target : null;
    if (!form || form.id !== 'ecosystemPromptForm') return;
    event.preventDefault();
    toast(root, 'Prompt not submitted', 'The old Create UI is restored, but persistent prompt creation will only be enabled through the clean server API.', 'orange');
  };

  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('submit', onSubmit);

  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('input', onInput);
    root.removeEventListener('change', onInput);
    root.removeEventListener('submit', onSubmit);
  };
}
