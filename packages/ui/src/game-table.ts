// What this does: renders clean-app server projections using the old Cribbit Telegram visual structure.
// Key invariant: gameplay state, legality, and actions stay projection/handler-driven; this file adds no game authority.
// Explicitly out of scope: old simulation/game-engine imports, client legality rules, or social/table-card expansion.
import type { GameViewCard, GameViewProjection } from '../../contracts/src/view.ts';
import { resolveCardFaceAsset } from '../../cards/src/presentation.ts';
import type { CardPresentationIdentity } from '../../cards/src/types.ts';
import { OLD_PACKAGES_UI_SRC_TEMPLATE_HTML } from './old-ui-source/source-text.ts';

export interface PresentationState {
  readonly selectedCardId: string | null;
  readonly openEffect: string | null;
  readonly colorChooserOpen: boolean;
}

export function createPresentationState(seed: Partial<PresentationState> = {}): PresentationState {
  return Object.freeze({ selectedCardId: null, openEffect: null, colorChooserOpen: false, ...seed });
}


const CANONICAL_HERO_CARDS = [
  {
    className: 'cc-web-card-reverse-confession',
    label: 'Reverse Confession',
    src: '/assets/CHAOS-133-V1/cards/reverse_confession/fIYGR_01.jpg',
  },
  {
    className: 'cc-web-card-paranoia',
    label: 'Paranoia',
    src: '/assets/CHAOS-133-V1/cards/paranoia/paranoia_01.jpg',
  },
  {
    className: 'cc-web-card-dig-me',
    label: 'Dig Me',
    src: '/assets/CHAOS-133-V1/cards/Dig_Me/digme.jpg',
  },
  {
    className: 'cc-web-card-nope',
    label: 'Nope',
    src: '/assets/CHAOS-133-V1/cards/nope/nope_01.jpg',
  },
] as const;

function canonicalHeroCardMarkup(): string {
  return CANONICAL_HERO_CARDS.map(card => `<figure class="cc-web-hero-card ${card.className}" aria-label="${card.label} card"><img class="cc-web-hero-card__image" src="${card.src}" alt="${card.label} card artwork" draggable="false"></figure>`).join('');
}

function canonicalWebHeroMarkup(startButtonMarkup: string): string {
  return `<div class="cc-web-hero"><div class="cc-web-cards-bg" aria-hidden="true">${canonicalHeroCardMarkup()}</div><div class="cc-web-content"><div class="cc-web-eyebrow"><div class="cc-web-eyebrow-dot"></div><span class="cc-web-eyebrow-text">Now Live</span><div class="cc-web-eyebrow-sep"></div><span class="cc-web-eyebrow-tag">Social Card Game</span></div><div class="cc-web-logo"><div class="cc-web-logo-frog">🐸</div><div class="cc-web-logo-text"><div class="cc-web-logo-cribbit">Cribbit</div><div class="cc-web-logo-chaos">CHAOS</div></div></div><div class="cc-web-headline">Your friends<br><em>won't survive</em><br><span class="cc-web-line-pink">night two.</span></div><div class="cc-web-stats"><div class="cc-web-stat s1"><div class="cc-web-stat-num">2–10</div><div class="cc-web-stat-label">Players</div></div><div class="cc-web-stat s2"><div class="cc-web-stat-num">7</div><div class="cc-web-stat-label">Cards Dealt</div></div><div class="cc-web-stat s3"><div class="cc-web-stat-num">133</div><div class="cc-web-stat-label">Cards</div></div><div class="cc-web-stat s4"><div class="cc-web-stat-num">∞</div><div class="cc-web-stat-label">Stories</div></div></div><p class="cc-web-description"><span class="cc-web-kicker">Cribbit CHAOS is a shedding card game with a social fuse.</span> Deal seven cards, match color or symbol, then watch the social layer detonate — <span class="cc-web-highlight">truths, dares, paranoia, chaos, duels,</span> and tactical Nopes that can flip a round. First to legally empty their hand wins. <span class="cc-web-highlight">Everyone else explains themselves.</span></p><div class="cc-web-mechanics"><span class="cc-web-pill p-truth">❓ Truth</span><span class="cc-web-pill p-dare">⚡ Dare</span><span class="cc-web-pill p-paranoia">◉ Paranoia</span><span class="cc-web-pill p-chaos">↻ Chaos</span><span class="cc-web-pill p-duel">⚔️ Duel</span><span class="cc-web-pill p-nope">✋ Nope</span></div><div class="cc-web-infobar"><span class="cc-web-infobar-shield">🛡️</span><div class="cc-web-infobar-text"><b>Explicit safety controls built in.</b> Pass, Rewind, Nope and Flag keep CHAOS on your terms.</div></div><div class="cc-web-actions"><a class="button cc-web-create" href="#roomCreation">Create a game</a>${startButtonMarkup}</div></div></div>`;
}

const specialFamilies = new Set([
  'truth',
  'dare',
  'paranoia',
  'chaos',
  'duel',
  'nope',
  'tag',
  'truth_or_chaos',
  'hijack',
  'taboo',
  'machiavelli',
  'ghost',
  'reverse_confession',
  'dig_me',
  'wild',
  'reverse',
  'skip',
  'draw',
]);

const esc = (value: string): string =>
  value.replace(/[&<>\"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
    "'": '&#039;',
  })[char] ?? char);

function cardIdentity(card: GameViewCard): CardPresentationIdentity | null {
  if (card.family !== 'number' && !specialFamilies.has(card.family)) return null;
  const family = card.family as CardPresentationIdentity['family'];
  return {
    family,
    copy: card.copy,
    ...(card.color ? { color: card.color } : {}),
    ...(card.value !== undefined ? { value: card.value } : {}),
  };
}

export function GameCard(card: GameViewCard, selected = false, playable = false): string {
  const identity = cardIdentity(card);
  const asset = identity ? resolveCardFaceAsset(identity) : null;
  const assetSrc = asset ? `/${asset}` : '';
  const tone = card.color ?? (specialFamilies.has(card.family) ? 'special' : 'neutral');
  const face = assetSrc
    ? `<img class="game-card__art" src="${esc(assetSrc)}" alt="${esc(card.label)} card" loading="lazy" decoding="async"/>`
    : '';

  return `<button class="game-card game-card--tg-hand" type="button" data-card-id="${esc(card.instanceId)}" data-selected="${selected}" data-playable="${playable}" data-family="${esc(card.family)}" data-tone="${tone}" data-asset="${esc(asset ?? '')}" aria-pressed="${selected}" aria-disabled="${String(!playable)}">${face}<span class="game-card__corner">${esc(card.label)}</span><span class="game-card__mark">${esc(card.family === 'number' ? card.label : card.label.slice(0, 3).toUpperCase())}</span><span class="game-card__name">${esc(card.label)}</span>${playable ? '<span class="game-card__legal-badge">PLAY</span>' : ''}</button>`;
}

export function PlayerSeat(player: GameViewProjection['players'][number]): string {
  return `<article class="player-seat tg-player-chip${player.isCurrentTurn ? ' is-active' : ''}${player.isCurrentPlayer ? ' is-human' : ''}" data-current-turn="${player.isCurrentTurn}" data-current-player="${player.isCurrentPlayer}"><span class="player-avatar tg-player-avatar">${esc(player.avatarLabel)}</span><span class="player-copy"><b>${esc(player.displayName)}${player.isHost ? ' · Host' : ''}</b><small>${player.isCurrentTurn ? 'Playing now' : player.connection === 'reconnecting' ? 'Reconnecting' : 'Ready'}</small></span><span class="player-cards">${player.cardCount}<small>cards</small></span></article>`;
}

export function DrawPile(count: number, enabled = false): string {
  return `<article class="table-pile tg-board-zone tg-board-zone--draw"><span class="tg-board-zone__label">DRAW PILE<br><small>${count} cards left</small></span><button class="draw-pile tg-deck" type="button" data-action="draw-card" ${enabled ? '' : 'disabled'} aria-label="Draw a card" aria-disabled="${String(!enabled)}"><span class="draw-pile-stack tg-shared-card-back tg-shared-card-back--board"><i></i><i></i><i></i></span><span class="draw-pile-body"><b>Draw</b><span>${count} left</span></span></button></article>`;
}

export function DiscardPile(card: GameViewCard | null): string {
  return `<article class="table-pile tg-board-zone tg-board-zone--discard"><span class="tg-board-zone__label">DISCARD</span><div class="discard-pile tg-discard-stack">${card ? GameCard(card).replace('game-card--tg-hand', 'game-card--tg-board') : '<span class="tg-empty-pile">No discard</span>'}</div></article>`;
}

export function TurnIndicator(projection: GameViewProjection): string {
  return `<div class="board-turn tg-game-meta__turn"><div><small>CURRENT TURN</small><strong>${esc(projection.turnLabel)}</strong></div><div class="tg-timer-ring" aria-label="Turn direction"><span>${projection.direction === 'clockwise' ? '↻' : '↺'}</span><small>TURN</small></div></div>`;
}

export function ActionBar(projection: GameViewProjection, state: PresentationState): string {
  const canPlay = Boolean(state.selectedCardId && projection.availableActions.playableCardIds.includes(state.selectedCardId));
  return `<nav class="action-bar tg-safety-bar" aria-label="Game actions"><button type="button" disabled><span>↪</span><b>PASS</b></button><button type="button" disabled><span>↶</span><b>REWIND</b></button><button type="button" disabled><span>✋</span><b>NOPE</b></button><button type="button" data-action="draw-card" ${projection.availableActions.canDraw ? '' : 'disabled'}><span>▱</span><b>DRAW</b></button><button type="button" data-action="play-card" ${canPlay ? '' : 'disabled'}><span>▶</span><b>PLAY</b></button></nav>`;
}

export function GameStatus(projection: GameViewProjection): string {
  const winner = projection.winner ? `<strong>WINNER · ${esc(projection.winner.displayName)}</strong>` : '';
  return `<div class="game-status tg-action-status" data-status="${projection.status}" role="status"><span>${projection.status === 'waiting' ? 'Waiting' : projection.status === 'active' ? 'Active' : 'Resolved'}</span>${winner}</div>`;
}

export function ConnectionStatus(projection: GameViewProjection): string {
  return `<div class="connection-status" data-connection="${projection.connection}"><i></i><span>${projection.connection === 'connected' ? 'Connected' : projection.connection === 'reconnecting' ? 'Reconnecting' : 'Offline'}</span></div>`;
}

export function ColorChooser(open: boolean): string {
  return `<section class="color-chooser tg-wild-picker${open ? ' is-open' : ''}" aria-hidden="${!open}"><b>Choose color</b><div><button data-preview-color="lime">Lime</button><button data-preview-color="orange">Orange</button><button data-preview-color="cyan">Cyan</button><button data-preview-color="purple">Purple</button></div><small>Color commands are disabled until Wild is implemented.</small></section>`;
}

export function SpecialEffectSheet(openEffect: string | null): string {
  return `<section class="special-effect-sheet${openEffect ? ' is-open' : ''}" aria-hidden="${!openEffect}"><div><span class="eyebrow">Special card</span><h2>${esc(openEffect ?? 'Effect preview')}</h2><p>Special/social cards are presentation-only in this ordinary-card slice. The server accepts DRAW_CARD and ordinary number PLAY_CARD only.</p><button type="button" data-preview-close>Close</button></div></section>`;
}

export function PlayerHand(projection: GameViewProjection, state: PresentationState): string {
  const playable = new Set(projection.availableActions.playableCardIds);
  return `<section class="hand-zone tg-hand" aria-label="Your hand"><div class="tg-section-label"><span>Your Hand</span><strong>${projection.currentPlayer.hand.length}</strong></div><div class="hand-scroll tg-hand-rail">${projection.currentPlayer.hand.map(card => GameCard(card, state.selectedCardId === card.instanceId, playable.has(card.instanceId))).join('') || '<p class="tg-hand-empty">Your hand is empty.</p>'}</div></section>`;
}

function connectionStatusMarkup(projection: GameViewProjection): string {
  return `<span class="status-pill" data-state="connected"><i></i><span>${esc(projection.source === 'server' ? 'Connected' : 'Fixture')}</span></span><span class="status-pill"><span>Server rev ${projection.revision}</span></span>`;
}

export function GameTable(projection: GameViewProjection, state: PresentationState, surface: 'web' | 'telegram' = 'web'): string {
  const currentName = projection.players.find(player => player.isCurrentTurn)?.displayName ?? projection.turnLabel;
  const sourceCopy = projection.source === 'server' ? 'Server projection · authoritative' : 'Fixture preview · non-authoritative';
  if (surface === 'telegram') {
    return `<main class="cribbit-clean-telegram-table tg-app tg-game-page" data-source="${projection.source}" data-telegram-app><header class="tg-app__header tg-game-header"><button class="tg-icon-button tg-icon-button--back" type="button" aria-label="Back">←</button><div class="tg-app__title-block"><strong>Cribbit Chaos</strong><span>Telegram Mini App</span></div><button class="tg-icon-button" type="button" aria-label="Game information">•••</button></header><section class="tg-live-strip" aria-label="Game status"><span class="tg-live-dot" aria-hidden="true"></span><strong>${projection.status === 'active' ? 'LIVE GAME' : projection.status.toUpperCase()}</strong><span>rev ${projection.revision}</span></section><section class="tg-game-meta" aria-label="Room and turn information"><div class="tg-game-meta__room"><span class="tg-game-meta__mark" aria-hidden="true">●</span><div><small>ROOM</small><strong>${esc(projection.roomName)}</strong><span>${projection.players.length} players · rev ${projection.revision}</span></div></div><div class="tg-game-meta__turn"><div><small>CURRENT TURN</small><strong>${esc(currentName)}</strong></div><div class="tg-timer-ring" aria-label="Revision"><span>${projection.revision}</span><small>REV</small></div></div></section><section class="tg-board" aria-label="Card board"><div class="tg-board__piles">${DiscardPile(projection.discardCard)}${DrawPile(projection.drawPileCount, projection.availableActions.canDraw)}</div></section><section class="tg-player-strip" aria-label="Players"><div class="tg-player-rail">${projection.players.map(PlayerSeat).join('')}</div></section>${projection.activeEffect ? `<section class="tg-active-state" aria-live="polite"><small>ACTIVE STATE</small><strong>${esc(projection.activeEffect)}</strong><span>Resolved from the server projection.</span></section>` : ''}${PlayerHand(projection, state)}${ActionBar(projection, state)}<div class="tg-action-status" data-tone="neutral" role="status" aria-live="polite">${esc(sourceCopy)}</div>${SpecialEffectSheet(state.openEffect)}${ColorChooser(state.colorChooserOpen)}</main>`;
  }

  return `<main class="cribbit-clean-web-table game-app-shell" data-source="${projection.source}"><div class="game-core"><div class="game-topbar"><div class="game-heading"><div><p class="eyebrow">Authoritative session</p><h1>Live Game</h1></div><span class="tag" data-tone="lime">${esc(projection.modeLabel)}</span></div><div class="game-toolbar"><div class="phase-track" aria-label="Turn engine state"><span>${esc(projection.status)}</span><span>rev ${projection.revision}</span><span>${esc(sourceCopy)}</span></div></div></div><div class="game-layout" data-left-open="true" data-right-open="true" data-rail-mode="inline" data-drawer-open="false"><aside class="panel game-rail game-rail--left tg-player-strip" aria-label="Players panel"><header class="panel-header"><div><h2 class="panel-title">Players</h2><p class="panel-subtitle">Cards remaining drive victory.</p></div></header><div class="panel-body"><div class="player-list tg-player-rail">${projection.players.map(PlayerSeat).join('')}</div></div></aside><section class="game-stage" aria-label="Desktop gameboard"><article class="desktop-gameboard"><header class="board-session-header"><div class="board-room"><h2>${esc(projection.roomName)}</h2><p>${projection.players.length} players · ${esc(projection.modeLabel)} · <span class="cribbit-clean-session-code">${esc(projection.sessionId)}</span></p></div><div class="board-turn"><div class="board-turn__copy"><small>Current turn</small><strong>${esc(currentName)}</strong></div><div class="timer">${projection.revision}</div></div><div class="board-phase-mini"><span class="round-chip">${esc(projection.status)}</span><b>${esc(projection.turnLabel)}</b><span>Server-authoritative</span></div><div class="board-timer-track"><span style="width:${Math.min(100, Math.max(5, projection.revision * 12))}%"></span></div></header><div class="desktop-play-grid"><section class="board-pane board-challenge"><span class="active-panel__label">Active state</span><h3>${projection.activeEffect ? esc(projection.activeEffect) : 'Play or draw'}</h3><p>Match information, current turn, winner, revision, hand ownership, and available actions are rendered from the clean server projection.</p><div class="challenge-status-row"><span class="tag" data-tone="lime">Empty hand wins</span><span class="tag" data-tone="cyan">Client hints only</span><span class="tag" data-tone="gold">Railway authority</span></div><div class="board-callout cribbit-clean-binding-note">Old UI surface; clean API commands underneath.</div></section><section class="board-pane table-zone"><div class="table-piles tg-board__piles">${DiscardPile(projection.discardCard)}${DrawPile(projection.drawPileCount, projection.availableActions.canDraw)}</div><div class="table-actions"><button class="button" data-action="draw-card" ${projection.availableActions.canDraw ? '' : 'disabled'} type="button"><svg class="icon"><use href="#i-cards" /></svg>Draw</button><button class="button" type="button" disabled><svg class="icon"><use href="#i-globe" /></svg>CHAOS Board</button></div></section></div>${PlayerHand(projection, state)}<footer class="desktop-safety-bar">${ActionBar(projection, state)}</footer></article></section><aside class="panel game-rail game-rail--right" aria-label="Session statistics"><header class="panel-header"><div><h2 class="panel-title">Session stats</h2><p class="panel-subtitle">Projection readback only.</p></div></header><div class="panel-body"><div class="stats-grid"><div class="metric-tile"><span>Revision</span><b>${projection.revision}</b></div><div class="metric-tile"><span>Draw pile</span><b>${projection.drawPileCount}</b></div><div class="metric-tile"><span>Players</span><b>${projection.players.length}</b></div></div><div class="authority-box"><b>Server authority</b><p>Client highlights are hints; server projection owns legality, turns, winner, hand ownership and revision.</p></div></div></aside></div></div>${GameStatus(projection)}${SpecialEffectSheet(state.openEffect)}${ColorChooser(state.colorChooserOpen)}</main>`;
}

function webHomeTemplate(input: { readonly busy: boolean; readonly error: string | null }): string {
  const disabled = input.busy ? ' disabled' : '';
  const startButtonMarkup = `<button id="startGameButton" class="button button--primary" type="button" data-action="create-game"${disabled}>Create live game</button><button class="button" type="button" disabled>Local QA simulation</button>`;
  return OLD_PACKAGES_UI_SRC_TEMPLATE_HTML
    .replace(/<article class="panel lobby-hero">[\s\S]*?<\/article>/, `<article class="panel lobby-hero">${canonicalWebHeroMarkup(startButtonMarkup)}</article>`)
    .replace('id="profileName" maxlength="20" value="You"', `id="profileName" maxlength="20" name="createName" value="You"${disabled}`)
    .replace('id="joinCode" maxlength="8" placeholder="Enter room code"', `id="joinCode" maxlength="12" name="sessionId" placeholder="Enter room code"${disabled}`)
    .replace('id="startGameButton" type="button"', `id="startGameButton" type="button" data-action="create-game"${disabled}`)
    .replace('<button class="button" data-action="join-room" type="button">Join room</button>', `<button class="button" data-action="join-room" type="button"${disabled}>Join room</button>`)
    .replace('</section>\n\n    <section class="view" data-view="game"', `${input.error ? `<div class="cribbit-clean-error" role="status">${esc(input.error)}</div>` : ''}</section>\n\n    <section class="view" data-view="game"`)
    .replace('<main>', '<main class="cribbit-clean-web-home">');
}

export function renderCribbitHome(input: { readonly busy: boolean; readonly error: string | null; readonly surface?: 'web' | 'telegram' }): string {
  if (input.surface !== 'telegram') return webHomeTemplate(input);
  const disabled = input.busy ? ' disabled' : '';
  return `<main class="cribbit-clean-telegram-home tg-app tg-room-page" data-telegram-app><header class="tg-app__header"><button class="tg-icon-button tg-icon-button--back" type="button" aria-label="Back">←</button><div class="tg-app__title-block"><strong>Cribbit Chaos</strong><span>Telegram Mini App</span></div><button class="tg-icon-button" type="button" aria-label="Menu">•••</button></header><section class="tg-room-hero" aria-labelledby="tg-room-title"><div class="tg-room-hero__kicker"><span class="tg-frog-mark" aria-hidden="true">●</span><span>Room Creation</span></div><h1 id="tg-room-title"><span>Build</span> Tonight's <span>Chaos</span></h1><p>Set the room, pick the chaos, and jump in.</p></section><form class="tg-room-form" data-create-session novalidate><section class="tg-setup-card"><label class="tg-field-label" for="tgProfileName"><span aria-hidden="true">♙</span> Profile Name</label><div class="tg-input-wrap"><input id="tgProfileName" class="tg-input" data-profile-input name="createName" maxlength="20" value="Telegram Player" autocomplete="name"${disabled}/><span class="tg-field-icon" aria-hidden="true">✎</span></div><div class="tg-field-meta"><span>Clean server room</span><span>Railway API</span></div></section><section class="tg-setup-card"><label class="tg-field-label" for="tgRoomName"><span aria-hidden="true">⌂</span> Room Name</label><input id="tgRoomName" class="tg-input" maxlength="28" value="Night Squad" disabled /></section><section class="tg-setup-card"><label class="tg-field-label"><span aria-hidden="true">◎</span> Content World</label><div class="tg-segmented" aria-label="Content world"><button type="button" class="is-active" disabled>Clean CHAOS</button><button type="button" disabled>Adult CHAOS (18+ demo)</button></div></section><section class="tg-setup-card"><label class="tg-field-label"><span aria-hidden="true">♛</span> Personal Ceiling</label><div class="tg-ceiling-row" aria-label="Personal ceiling"><button type="button" disabled>Easy</button><button type="button" class="is-active" disabled>Funny</button><button type="button" disabled>Wild</button><button type="button" disabled>Max</button></div></section><section class="tg-setup-card"><div class="tg-section-label"><span>Choose Mode</span><strong>Primary social format.</strong></div><div class="tg-mode-grid"><button type="button" disabled><span>⚔</span><b>Duel</b><small>2 players</small></button><button type="button" disabled><span>♟</span><b>Squad</b><small>3–4 players</small></button><button type="button" class="is-active" disabled><span>●</span><b>Party</b><small>5–7 players</small></button><button type="button" disabled><span>✹</span><b>Mayhem</b><small>8–10 players</small></button></div></section><section class="tg-setup-card"><label class="tg-field-label">Player Count</label><div class="tg-count-row">${[2,3,4,5,6,7,8,9,10].map(count => `<button type="button"${count === 5 ? ' class="is-active"' : ''} disabled>${count}</button>`).join('')}</div></section><section class="tg-setup-card"><div class="tg-section-label"><span>Live Prompt Sources</span><strong>Current room draft</strong></div><div class="tg-source-list"><div><span>▤</span><b>Original</b><small>Curated</small><strong>✓</strong></div><div><span>♟</span><b>Community</b><small>Approved</small><strong>✓</strong></div><div><span>⌂</span><b>House</b><small>Private group</small><strong>✓</strong></div><div><span>◉</span><b>Live</b><small>Tonight</small><strong>✓</strong></div></div></section><section class="tg-setup-card"><div class="tg-qa-row"><span aria-hidden="true">⚗</span><div><b>QA Test Hand</b><p>Show the canonical engine simulation entry point for visual and interaction QA.</p></div></div></section><section class="tg-setup-card"><label class="tg-field-label" for="tgJoinCode"><span aria-hidden="true">#</span> Join Room</label><div class="tg-join-row"><input id="tgJoinCode" class="tg-input" data-join-code name="sessionId" maxlength="12" inputmode="text" autocomplete="off" placeholder="Enter room code"${disabled}/><button class="tg-button tg-button--join" data-action="join-room" type="button"${disabled}>Join</button></div></section>${input.error ? `<div class="tg-action-status" data-tone="warning" role="status">${esc(input.error)}</div>` : ''}<button class="tg-button tg-button--primary" type="submit"${disabled}>Create Game</button><button class="tg-button" type="submit"${disabled}>Start Simulation</button></form></main>`;
}

export function renderCribbitLobby(projection: GameViewProjection, input: { readonly busy: boolean; readonly error: string | null; readonly surface?: 'web' | 'telegram' }): string {
  const players = projection.players.map(PlayerSeat).join('');
  if (input.surface === 'telegram') {
    return `<main class="cribbit-clean-telegram-home tg-app tg-room-page" data-source="${projection.source}" data-telegram-app><header class="tg-app__header"><button class="tg-icon-button tg-icon-button--back" type="button" aria-label="Cribbit">●</button><div class="tg-app__title-block"><strong>Cribbit Chaos</strong><span>${esc(projection.modeLabel)}</span></div><button class="tg-icon-button" type="button" aria-label="Menu">•••</button></header><section class="tg-live-strip" aria-label="Lobby status"><span class="tg-live-dot" aria-hidden="true"></span><strong>LOBBY</strong><span>rev ${projection.revision}</span></section><section class="tg-game-meta" aria-label="Room information"><div class="tg-game-meta__room"><span class="tg-game-meta__mark" aria-hidden="true">●</span><div><small>ROOM</small><strong>${esc(projection.roomName)}</strong><span>Share code · <span class="cribbit-clean-session-code">${esc(projection.sessionId)}</span></span></div></div></section><section class="tg-player-strip" aria-label="Joined players"><div class="tg-section-label"><span>Joined players</span><strong>${projection.players.length}</strong></div><div class="player-list tg-player-rail">${players}</div></section><section class="tg-board tg-lobby-board" aria-label="Host controls"><div class="tg-active-state"><small>HOST CONTROL</small><strong>${projection.canStartGame ? 'Ready to start' : 'Waiting for second player'}</strong><span>Start Game creates the canonical deck, initial hands, draw pile, discard pile and first turn on the server.</span><div class="context-actions"><button type="button" data-action="start-game" ${projection.canStartGame && !input.busy ? '' : 'disabled'}>START GAME</button></div>${input.error ? `<div class="tg-action-status" data-tone="warning" role="status">${esc(input.error)}</div>` : ''}</div></section></main>`;
  }
  return `<main class="cribbit-clean-web-home"><header class="app-header"><div class="app-header__inner"><button class="brand-lockup" type="button"><svg class="frog-mark icon" aria-hidden="true"><use href="#i-frog" /></svg><span class="brand-type"><span class="brand-type__cribbit">Cribbit</span><span class="brand-type__chaos">Chaos</span></span></button><nav class="product-nav header-nav" aria-label="Primary navigation"><div class="nav-cluster"><button class="nav-button" type="button">Play</button></div><div class="nav-cluster"><button class="nav-button" type="button">Rooms</button></div><div class="nav-cluster"><button class="nav-button" type="button">CHAOS Board</button></div><div class="nav-cluster"><button class="nav-button" type="button">Library</button></div><div class="nav-cluster"><button class="nav-button" type="button">Create</button></div><div class="nav-cluster"><button class="nav-button" type="button">Call Mode</button></div><div class="nav-cluster"><button class="nav-button" type="button">Rules</button></div></nav><div class="status-cluster">${connectionStatusMarkup(projection)}</div></div></header><main><section class="view is-active"><div class="lobby-grid"><article class="panel setup-panel"><header class="panel-header"><div><p class="eyebrow">Room lobby</p><h1 class="panel-title">${esc(projection.roomName)}</h1><p class="panel-subtitle">Share code <span class="cribbit-clean-session-code">${esc(projection.sessionId)}</span></p></div><span class="tag" data-tone="cyan">rev ${projection.revision}</span></header><div class="panel-body"><section class="tg-player-strip" aria-label="Joined players"><div class="tg-section-label"><span>Joined players</span><strong>${projection.players.length}</strong></div><div class="player-list tg-player-rail">${players}</div></section><div class="cribbit-clean-lobby-actions"><button class="button button--primary" type="button" data-action="start-game" ${projection.canStartGame && !input.busy ? '' : 'disabled'}>Start Game</button></div>${input.error ? `<div class="cribbit-clean-error" role="status">${esc(input.error)}</div>` : ''}</div></article></div></section></main></main>`;
}

export const renderGameTable = GameTable;
