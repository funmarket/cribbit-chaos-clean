// What this does: renders clean-app server projections using the old Cribbit Telegram visual structure.
// Key invariant: gameplay state, legality, and actions stay projection/handler-driven; this file adds no game authority.
// Explicitly out of scope: old simulation/game-engine imports, client legality rules, or social/table-card expansion.
import type { GameViewCard, GameViewProjection } from '../../contracts/src/view.ts';
import { resolveCardFaceAsset } from '../../cards/src/presentation.ts';
import type { CardPresentationIdentity } from '../../cards/src/types.ts';

export interface PresentationState {
  readonly selectedCardId: string | null;
  readonly openEffect: string | null;
  readonly colorChooserOpen: boolean;
}

export function createPresentationState(seed: Partial<PresentationState> = {}): PresentationState {
  return Object.freeze({ selectedCardId: null, openEffect: null, colorChooserOpen: false, ...seed });
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

export function GameTable(projection: GameViewProjection, state: PresentationState): string {
  const currentName = projection.players.find(player => player.isCurrentTurn)?.displayName ?? projection.turnLabel;
  const sourceCopy = projection.source === 'server' ? 'Server projection · authoritative' : 'Fixture preview · non-authoritative';

  return `<main class="cribbit-app tg-app tg-game-page" data-source="${projection.source}" data-telegram-app><header class="app-header tg-app__header tg-game-header"><button class="tg-icon-button tg-icon-button--back" type="button" aria-label="Cribbit home">←</button><div class="tg-app__title-block"><strong>Cribbit Chaos</strong><span>${esc(sourceCopy)}</span></div><div class="header-tools">${ConnectionStatus(projection)}</div></header><section class="tg-live-strip" aria-label="Game status"><span class="tg-live-dot" aria-hidden="true"></span><strong>${projection.status === 'active' ? 'LIVE GAME' : projection.status.toUpperCase()}</strong><span>rev ${projection.revision}</span></section><section class="tg-game-meta" aria-label="Room and turn information"><div class="tg-game-meta__room"><span class="tg-game-meta__mark" aria-hidden="true">●</span><div><small>ROOM</small><strong>${esc(projection.roomName)}</strong><span>${projection.players.length} players · ${esc(projection.modeLabel)} · ${esc(projection.sessionId)}</span></div></div>${TurnIndicator({ ...projection, turnLabel: currentName })}</section><section class="tg-board" aria-label="Card board"><div class="tg-board__piles">${DiscardPile(projection.discardCard)}${DrawPile(projection.drawPileCount, projection.availableActions.canDraw)}</div></section><section class="tg-player-strip" aria-label="Players"><div class="tg-section-label"><span>Players</span><strong>${projection.players.length}</strong></div><div class="player-list tg-player-rail">${projection.players.map(PlayerSeat).join('')}</div></section>${projection.activeEffect ? `<section class="tg-active-state" aria-live="polite"><small>ACTIVE STATE</small><strong>${esc(projection.activeEffect)}</strong><span>Resolved from the server projection.</span></section>` : ''}${PlayerHand(projection, state)}${ActionBar(projection, state)}${GameStatus(projection)}${SpecialEffectSheet(state.openEffect)}${ColorChooser(state.colorChooserOpen)}</main>`;
}

export function renderCribbitHome(input: { readonly busy: boolean; readonly error: string | null }): string {
  return `<main class="cribbit-app tg-app tg-setup-page" data-telegram-app><header class="app-header tg-app__header"><button class="tg-icon-button tg-icon-button--back" type="button" aria-label="Cribbit">●</button><div class="tg-app__title-block"><strong>Cribbit Chaos</strong><span>Web + Telegram</span></div><button class="tg-icon-button" type="button" aria-label="Menu">•••</button></header><section class="tg-live-strip" aria-label="Room setup status"><span class="tg-live-dot" aria-hidden="true"></span><strong>CREATE OR JOIN</strong><span>server rooms</span></section><section class="tg-room-hero"><div class="tg-room-hero__kicker"><span class="tg-frog-mark">●</span>Cribbit CHAOS</div><h1><span>Build</span> <span>Room</span></h1><p>Create or join a real server-authoritative room. Gameplay state comes from the Railway API projection.</p></section><section class="tg-room-form"><article class="tg-setup-card"><div class="tg-section-label"><span>Create session</span><small>new room</small></div><p class="tg-card-copy">Start a real Cribbit room backed by server state.</p><form data-create-session><label class="tg-field-label" for="createName"><span>Player</span>Name</label><div class="tg-input-wrap"><input class="tg-input" id="createName" name="createName" placeholder="Your name" autocomplete="name" ${input.busy ? 'disabled' : ''}/><span class="tg-field-icon">✦</span></div><button class="tg-button tg-button--create" type="submit" ${input.busy ? 'disabled' : ''}>Create Session</button></form></article><article class="tg-setup-card"><div class="tg-section-label"><span>Join session</span><small>room code</small></div><p class="tg-card-copy">Enter the code from another browser or Telegram preview.</p><form data-join-session><label class="tg-field-label" for="sessionId"><span>Room</span>Code</label><div class="tg-input-wrap"><input class="tg-input" id="sessionId" name="sessionId" placeholder="Session ID" autocomplete="off" ${input.busy ? 'disabled' : ''}/><span class="tg-field-icon">#</span></div><label class="tg-field-label" for="joinName"><span>Player</span>Name</label><div class="tg-input-wrap"><input class="tg-input" id="joinName" name="joinName" placeholder="Your name" autocomplete="name" ${input.busy ? 'disabled' : ''}/><span class="tg-field-icon">✦</span></div><button class="tg-button tg-button--join" type="submit" ${input.busy ? 'disabled' : ''}>Join Session</button></form></article>${input.error ? `<div class="tg-action-status" data-tone="warning" role="status">${esc(input.error)}</div>` : ''}</section></main>`;
}

export function renderCribbitLobby(projection: GameViewProjection, input: { readonly busy: boolean; readonly error: string | null }): string {
  return `<main class="cribbit-app tg-app tg-lobby-page" data-source="${projection.source}" data-telegram-app><header class="app-header tg-app__header"><button class="tg-icon-button tg-icon-button--back" type="button" aria-label="Cribbit">●</button><div class="tg-app__title-block"><strong>Cribbit Chaos</strong><span>${esc(projection.modeLabel)}</span></div><div class="header-tools">${ConnectionStatus(projection)}</div></header><section class="tg-live-strip" aria-label="Lobby status"><span class="tg-live-dot" aria-hidden="true"></span><strong>LOBBY</strong><span>rev ${projection.revision}</span></section><section class="tg-game-meta" aria-label="Room information"><div class="tg-game-meta__room"><span class="tg-game-meta__mark" aria-hidden="true">●</span><div><small>ROOM</small><strong>${esc(projection.roomName)}</strong><span>Share code · ${esc(projection.sessionId)}</span></div></div></section><section class="tg-player-strip" aria-label="Joined players"><div class="tg-section-label"><span>Joined players</span><strong>${projection.players.length}</strong></div><div class="player-list tg-player-rail">${projection.players.map(PlayerSeat).join('')}</div></section><section class="tg-board tg-lobby-board" aria-label="Host controls"><div class="tg-active-state"><small>HOST CONTROL</small><strong>${projection.canStartGame ? 'Ready to start' : 'Waiting for second player'}</strong><span>Start Game creates the canonical deck, initial hands, draw pile, discard pile and first turn on the server.</span><div class="context-actions"><button type="button" data-action="start-game" ${projection.canStartGame && !input.busy ? '' : 'disabled'}>START GAME</button></div>${input.error ? `<div class="tg-action-status" data-tone="warning" role="status">${esc(input.error)}</div>` : ''}</div></section></main>`;
}

export const renderGameTable = GameTable;
