// What this does: hydrates extracted old Cribbit Web/Telegram presentation templates with clean projections.
// Key invariant: old UI structure stays template-owned; gameplay authority stays in clean server projections/handlers.
// Explicitly out of scope: old runtime imports, client legality rules, old simulation engine, timers, or winner authority.
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

const specialFamilies = new Set([
  'truth', 'dare', 'paranoia', 'chaos', 'duel', 'nope', 'tag', 'truth_or_chaos',
  'hijack', 'taboo', 'machiavelli', 'ghost', 'reverse_confession', 'dig_me',
  'wild', 'reverse', 'skip', 'draw',
]);

const esc = (value: unknown): string =>
  String(value ?? '').replace(/[&<>\"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#039;',
  })[char] ?? char);

function replaceFirst(source: string, pattern: RegExp | string, replacement: string): string {
  return source.replace(pattern, replacement);
}

function setInner(html: string, id: string, value: string): string {
  return html.replace(new RegExp(`(<[^>]+id="${id}"[^>]*>)[\\s\\S]*?(</[^>]+>)`), `$1${value}$2`);
}

function setInputName(html: string, id: string, name: string): string {
  return html.replace(new RegExp(`(<input[^>]+id="${id}"[^>]*)(/?>)`), (match, start, end) => {
    const withoutName = String(start).replace(/\sname="[^"]*"/g, '');
    return `${withoutName} name="${name}"${end}`;
  });
}

function setInputDisabled(html: string, id: string, disabled: boolean): string {
  if (!disabled) return html;
  return html.replace(new RegExp(`(<input[^>]+id="${id}"[^>]*)(/?>)`), (match, start, end) => `${start} disabled${end}`);
}

function activateWebView(html: string, view: 'lobby' | 'game'): string {
  return html
    .replace(/<section class="view is-active" data-view="lobby"/, '<section class="view" data-view="lobby"')
    .replace(/<section class="view" data-view="game"/, view === 'game' ? '<section class="view is-active" data-view="game"' : '<section class="view" data-view="game"')
    .replace(/<section class="view" data-view="lobby"/, view === 'lobby' ? '<section class="view is-active" data-view="lobby"' : '<section class="view" data-view="lobby"');
}

const OLD_WEB_HERO_CARDS = [
  { className: 'cc-web-card-reverse-confession', label: 'Reverse Confession', src: '/assets/CHAOS-133-V1/cards/reverse_confession/fIYGR_01.jpg' },
  { className: 'cc-web-card-paranoia', label: 'Paranoia', src: '/assets/CHAOS-133-V1/cards/paranoia/paranoia_01.jpg' },
  { className: 'cc-web-card-dig-me', label: 'Dig Me', src: '/assets/CHAOS-133-V1/cards/Dig_Me/digme.jpg' },
  { className: 'cc-web-card-nope', label: 'Nope', src: '/assets/CHAOS-133-V1/cards/nope/nope_01.jpg' },
] as const;

function oldWebHeroCardMarkup(): string {
  return OLD_WEB_HERO_CARDS.map(card => `
      <figure class="cc-web-hero-card ${card.className}" aria-label="${card.label} card">
        <img class="cc-web-hero-card__image" src="${card.src}" alt="${card.label} card artwork" draggable="false">
      </figure>
    `).join('');
}

function applyOldWebMainPresentation(html: string): string {
  const startButtonMatch = html.match(/<button[^>]*id="startGameButton"[\s\S]*?<\/button>/);
  const startButton = startButtonMatch?.[0] ?? '';
  let nextHtml = startButton ? html.replace(startButton, '') : html;
  nextHtml = nextHtml.replace('class="panel setup-panel"', 'class="panel setup-panel" id="roomCreation"');
  const hero = `
        <article class="panel lobby-hero">
          <div class="cc-web-hero">
      <div class="cc-web-cards-bg" aria-hidden="true">
        ${oldWebHeroCardMarkup()}
      </div>

      <div class="cc-web-content">
        <div class="cc-web-eyebrow">
          <div class="cc-web-eyebrow-dot"></div>
          <span class="cc-web-eyebrow-text">Now Live</span>
          <div class="cc-web-eyebrow-sep"></div>
          <span class="cc-web-eyebrow-tag">Social Card Game</span>
        </div>

        <div class="cc-web-logo">
          <div class="cc-web-logo-frog">🐸</div>
          <div class="cc-web-logo-text">
            <div class="cc-web-logo-cribbit">Cribbit</div>
            <div class="cc-web-logo-chaos">CHAOS</div>
          </div>
        </div>

        <div class="cc-web-headline">
          Your friends<br>
          <em>won't survive</em><br>
          <span class="cc-web-line-pink">night two.</span>
        </div>

        <div class="cc-web-stats">
          <div class="cc-web-stat s1"><div class="cc-web-stat-num">2–10</div><div class="cc-web-stat-label">Players</div></div>
          <div class="cc-web-stat s2"><div class="cc-web-stat-num">7</div><div class="cc-web-stat-label">Cards Dealt</div></div>
          <div class="cc-web-stat s3"><div class="cc-web-stat-num">133</div><div class="cc-web-stat-label">Cards</div></div>
          <div class="cc-web-stat s4"><div class="cc-web-stat-num">∞</div><div class="cc-web-stat-label">Stories</div></div>
        </div>

        <p class="cc-web-description">
          <span class="cc-web-kicker">Cribbit CHAOS is a shedding card game with a social fuse.</span>
          Deal seven cards, match color or symbol, then watch the social layer detonate —
          <span class="cc-web-highlight">truths, dares, paranoia, chaos, duels,</span>
          and tactical Nopes that can flip a round.
          First to legally empty their hand wins.
          <span class="cc-web-highlight">Everyone else explains themselves.</span>
        </p>

        <div class="cc-web-mechanics">
          <span class="cc-web-pill p-truth">❓ Truth</span><span class="cc-web-pill p-dare">⚡ Dare</span><span class="cc-web-pill p-paranoia">◉ Paranoia</span><span class="cc-web-pill p-chaos">↻ Chaos</span><span class="cc-web-pill p-duel">⚔️ Duel</span><span class="cc-web-pill p-nope">✋ Nope</span>
        </div>

        <div class="cc-web-infobar"><span class="cc-web-infobar-shield">🛡️</span><div class="cc-web-infobar-text"><b>Explicit safety controls built in.</b> Pass, Rewind, Nope and Flag keep CHAOS on your terms.</div></div>

        <div class="cc-web-actions"><a class="button cc-web-create" href="#roomCreation">Create a game</a>${startButton}</div>
      </div>
    </div>
        </article>`;
  return nextHtml.replace(/<article class="panel lobby-hero">[\s\S]*?<\/article>/, hero);
}

function cardIdentity(card: GameViewCard): CardPresentationIdentity | null {
  if (card.family !== 'number' && !specialFamilies.has(card.family)) return null;
  return {
    family: card.family as CardPresentationIdentity['family'],
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
  return `<button class="game-card game-card--tg-hand" type="button" data-action="play-card" data-card-id="${esc(card.instanceId)}" data-selected="${selected}" data-playable="${playable}" data-family="${esc(card.family)}" data-tone="${esc(tone)}" data-asset="${esc(asset ?? '')}" aria-pressed="${selected}" aria-disabled="${String(!playable)}">${face}<span class="game-card__corner">${esc(card.label)}</span><span class="game-card__mark">${esc(card.family === 'number' ? card.label : card.label.slice(0, 3).toUpperCase())}</span><span class="game-card__name">${esc(card.label)}</span>${playable ? '<span class="game-card__legal-badge">PLAY</span>' : ''}</button>`;
}

export function PlayerSeat(player: GameViewProjection['players'][number]): string {
  return `<article class="player-seat tg-player-chip${player.isCurrentTurn ? ' is-active' : ''}${player.isCurrentPlayer ? ' is-human' : ''}" data-current-turn="${player.isCurrentTurn}" data-current-player="${player.isCurrentPlayer}"><span class="player-avatar tg-player-avatar">${esc(player.avatarLabel)}</span><span class="player-copy"><b>${esc(player.displayName)}${player.isHost ? ' · Host' : ''}</b><small>${player.isCurrentTurn ? 'Playing now' : player.connection === 'reconnecting' ? 'Reconnecting' : 'Ready'}</small></span><span class="player-cards">${player.cardCount}<small>cards</small></span></article>`;
}

function webPlayerList(projection: GameViewProjection): string {
  return projection.players.map(player => `<article class="player-seat${player.isCurrentTurn ? ' is-active' : ''}${player.isCurrentPlayer ? ' is-human' : ''}" data-current-turn="${player.isCurrentTurn}" data-current-player="${player.isCurrentPlayer}"><span class="player-avatar">${esc(player.avatarLabel)}</span><span class="player-copy"><b>${esc(player.displayName)}${player.isHost ? ' · Host' : ''}</b><small>${player.isCurrentTurn ? 'Playing now' : 'Ready'}</small></span><span class="player-cards">${player.cardCount}<small>cards</small></span></article>`).join('');
}

function statsGrid(projection: GameViewProjection): string {
  return `<div class="stat-card"><span>Revision</span><b>${projection.revision}</b></div><div class="stat-card"><span>Draw pile</span><b>${projection.drawPileCount}</b></div><div class="stat-card"><span>Players</span><b>${projection.players.length}</b></div><div class="stat-card"><span>Status</span><b>${esc(projection.status)}</b></div>`;
}

function phaseTrack(projection: GameViewProjection): string {
  return `<span>${esc(projection.status)}</span><span>rev ${projection.revision}</span><span>${esc(projection.source === 'server' ? 'Connected' : 'Fixture preview')}</span>`;
}

function handMarkup(projection: GameViewProjection, state: PresentationState): string {
  const playable = new Set(projection.availableActions.playableCardIds);
  return projection.currentPlayer.hand.map(card => GameCard(card, state.selectedCardId === card.instanceId, playable.has(card.instanceId))).join('') || '<p class="tg-hand-empty">Your hand is empty.</p>';
}

function discardMarkup(card: GameViewCard | null): string {
  return card ? GameCard(card, false, false).replace('game-card--tg-hand', 'game-card--tg-board') : '<span class="tg-empty-pile">No discard</span>';
}

function hydrateWebTemplate(projection: GameViewProjection, state: PresentationState, view: 'lobby' | 'game', input?: { readonly busy?: boolean; readonly error?: string | null }): string {
  let html = applyOldWebMainPresentation(activateWebView(OLD_PACKAGES_UI_SRC_TEMPLATE_HTML, view)).replace('<main>', '<main class="cribbit-clean-web-home">');
  html = setInputName(html, 'profileName', 'createName');
  html = setInputName(html, 'joinCode', 'sessionId');
  html = setInputDisabled(html, 'profileName', Boolean(input?.busy));
  html = setInputDisabled(html, 'joinCode', Boolean(input?.busy));
  html = html
    .replace('id="startGameButton"', `id="startGameButton" data-action="${view === 'lobby' ? 'start-game' : 'create-game'}"`)
    .replace(/(<button[^>]*id="startGameButton"[^>]*)(>)/, (_match: string, prefix: string, suffix: string) => input?.busy && !prefix.includes('disabled') ? `${prefix} disabled${suffix}` : `${prefix}${suffix}`)
    .replace('<button class="button" data-action="join-room" type="button">Join room</button>', `<button class="button" data-action="join-room" type="button"${input?.busy ? ' disabled' : ''}>Join room</button>`);

  html = setInner(html, 'revisionLabel', `Server rev ${projection.revision}`);
  html = setInner(html, 'modeBadge', esc(projection.modeLabel));
  html = setInner(html, 'phaseTrack', phaseTrack(projection));
  html = setInner(html, 'gameRoomName', esc(projection.roomName));
  html = setInner(html, 'gameRoomMeta', `${projection.players.length} players • ${esc(projection.modeLabel)} • ${esc(projection.sessionId)}`);
  html = setInner(html, 'currentTurnName', esc(projection.players.find(player => player.isCurrentTurn)?.displayName ?? projection.turnLabel));
  html = setInner(html, 'timerValue', '35');
  html = setInner(html, 'stageChip', esc(projection.status));
  html = setInner(html, 'boardPhaseLabel', esc(projection.activeEffect ?? 'Play / Draw'));
  html = setInner(html, 'activeChallengeTitle', esc(projection.activeEffect ?? 'Play or draw'));
  html = setInner(html, 'activeChallengeCopy', projection.activeEffect ? esc(projection.activeEffect) : 'Match the active color or symbol, use an eligible special, or draw under the current rules.');
  html = setInner(html, 'playerList', webPlayerList(projection));
  html = setInner(html, 'discardSlot', discardMarkup(projection.discardCard));
  html = setInner(html, 'drawPileCount', `${projection.drawPileCount} left`);
  html = setInner(html, 'handCount', `${projection.currentPlayer.hand.length} cards`);
  html = setInner(html, 'handScroll', handMarkup(projection, state));
  html = setInner(html, 'statsGrid', statsGrid(projection));
  html = setInner(html, 'champPanel', projection.winner ? `<div class="champ-copy"><p class="eyebrow">Resolved</p><h2>WINNER · ${esc(projection.winner.displayName)}</h2><p>${esc(projection.winner.displayName)} emptied their hand first.</p></div>` : '');
  html = setInner(html, 'authorityCopy', 'Waiting for a session. Client highlights are hints; state owns legality, hand ownership, winner and revision.');
  html = setInner(html, 'directionLabel', projection.direction === 'clockwise' ? 'Clockwise' : 'Counter-clockwise');
  html = setInner(html, 'phoneRevision', String(projection.revision));
  if (input?.error) {
    html = html.replace('</section>\n\n    <section class="view" data-view="game"', `<div class="cribbit-clean-error" role="status">${esc(input.error)}</div></section>\n\n    <section class="view" data-view="game"`);
  }
  html = html.replace(/(<button class="desktop-draw-pile"[^>]*data-draw-control type="button")/, `$1${projection.availableActions.canDraw ? '' : ' disabled'}`);
  html = html.replace(/(<button class="button" id="drawButton"[^>]*data-draw-control type="button")/, `$1${projection.availableActions.canDraw ? '' : ' disabled'}`);
  return html;
}

function renderModeButtons(): string {
  return `<button class="tg-mode-card" type="button" data-mode="duel" aria-pressed="false"><span class="tg-mode-card__icon" aria-hidden="true">⚔</span><b>Duel</b><small>2 players</small></button><button class="tg-mode-card" type="button" data-mode="squad" aria-pressed="false"><span class="tg-mode-card__icon" aria-hidden="true">♟</span><b>Squad</b><small>3–4 players</small></button><button class="tg-mode-card" type="button" data-mode="party" aria-pressed="true"><span class="tg-mode-card__icon" aria-hidden="true">●</span><b>Party</b><small>5–7 players</small></button><button class="tg-mode-card" type="button" data-mode="mayhem" aria-pressed="false"><span class="tg-mode-card__icon" aria-hidden="true">✹</span><b>Mayhem</b><small>8–10 players</small></button>`;
}

function renderPlayerCountButtons(): string {
  return Array.from({ length: 9 }, (_, index) => index + 2).map(count => `<button class="tg-count-chip" type="button" data-player-count="${count}" aria-pressed="${count === 5}"${count >= 5 && count <= 7 ? '' : ' disabled'}>${count}</button>`).join('');
}

function renderSourceButtons(): string {
  return [
    ['original', 'Original', 'Curated', '▤'], ['community', 'Community', 'Approved', '♟'], ['house', 'House', 'Private group', '⌂'], ['live', 'Live', 'Tonight', '◉'],
  ].map(([id, label, detail, icon]) => `<button class="tg-source-card" type="button" data-source="${id}" aria-pressed="true"><span class="tg-source-card__icon" aria-hidden="true">${icon}</span><span><b>${label}</b><small>${detail}</small></span><i aria-hidden="true">✓</i></button>`).join('');
}

function telegramRoomCreation(input: { readonly busy: boolean; readonly error: string | null; readonly profileName?: string; readonly lobby?: GameViewProjection | null }): string {
  const disabled = input.busy ? ' disabled' : '';
  const status = input.error ? esc(input.error) : input.lobby ? `Room ${esc(input.lobby.sessionId)} · ${input.lobby.players.length} joined` : '';
  const primaryAction = input.lobby
    ? `<button class="tg-button tg-button--create" data-action="start-game" type="button"${input.lobby.canStartGame && !input.busy ? '' : ' disabled'}>Start Game</button><button class="tg-button tg-button--demo" data-action="demo-game" type="button" disabled>Start Simulation</button>`
    : `<button class="tg-button tg-button--create" data-action="create-game" type="button"${disabled}>Create Game</button><button class="tg-button tg-button--demo" data-action="demo-game" type="button" disabled>Start Simulation</button>`;
  const joined = input.lobby ? `<section class="tg-setup-card tg-player-strip" aria-label="Joined players"><div class="tg-section-label"><span>Joined players</span><strong>${input.lobby.players.length}</strong></div><div class="tg-player-rail">${input.lobby.players.map(PlayerSeat).join('')}</div></section>` : '';
  return `
    <main class="tg-app tg-room-page" data-telegram-app>
      <header class="tg-app__header">
        <button class="tg-icon-button tg-icon-button--back" type="button" aria-label="Back" data-tg-back>←</button>
        <div class="tg-app__title-block"><strong>Cribbit Chaos</strong><span>Telegram Mini App</span></div>
        <button class="tg-icon-button" type="button" aria-label="Menu" data-tg-menu>•••</button>
      </header>
      <section class="tg-room-hero" aria-labelledby="tg-room-title"><div class="tg-room-hero__kicker"><span class="tg-frog-mark" aria-hidden="true">●</span><span>Room Creation</span></div><h1 id="tg-room-title"><span>Build</span> Tonight's <span>Chaos</span></h1><p>Set the room, pick the chaos, and jump in.</p></section>
      <form class="tg-room-form" data-room-form data-create-session novalidate>
        <section class="tg-setup-card"><label class="tg-field-label" for="tgProfileName"><span aria-hidden="true">♙</span> Profile Name</label><div class="tg-input-wrap"><input id="tgProfileName" class="tg-input" data-profile-input name="createName" maxlength="20" value="${esc(input.profileName ?? 'Telegram Player')}" autocomplete="name"${disabled}/><span class="tg-field-icon" aria-hidden="true">✎</span></div><div class="tg-field-meta"><span data-auth-state>Checking…</span><span data-api-state>Shared Railway API</span></div></section>
        <section class="tg-setup-card"><label class="tg-field-label" for="tgRoomName"><span aria-hidden="true">⌂</span> Room Name</label><input id="tgRoomName" class="tg-input" data-room-name maxlength="28" value="Night Squad" /></section>
        <section class="tg-setup-card tg-grid-2"><div><label class="tg-field-label" for="tgWorld"><span aria-hidden="true">◎</span> Content World</label><select id="tgWorld" class="tg-select" data-world><option value="clean" selected>Clean CHAOS</option><option value="adult">Adult CHAOS (18+ demo)</option></select></div><div><label class="tg-field-label" for="tgCeiling"><span aria-hidden="true">♛</span> Personal Ceiling</label><select id="tgCeiling" class="tg-select" data-ceiling><option value="1">Easy</option><option value="2" selected>Funny</option><option value="3">Wild</option><option value="4">Max</option></select></div></section>
        <section class="tg-setup-card"><div class="tg-section-label"><span>Choose Mode</span><small data-mode-copy>Primary social format.</small></div><div class="tg-mode-grid" data-mode-grid>${renderModeButtons()}</div></section>
        <section class="tg-setup-card"><div class="tg-section-label"><span>Player Count</span><strong data-player-count-value>5</strong></div><div class="tg-count-grid" data-player-grid>${renderPlayerCountButtons()}</div></section>
        <section class="tg-setup-card"><div class="tg-section-label"><span>Live Prompt Sources</span><small>Current room draft</small></div><div class="tg-source-grid" data-source-grid>${renderSourceButtons()}</div></section>
        <section class="tg-setup-card tg-toggle-row"><div><span class="tg-field-label"><span aria-hidden="true">⚗</span> QA Test Hand</span><small>Show the canonical engine simulation entry point for visual and interaction QA.</small></div><label class="tg-switch"><input type="checkbox" data-qa-hand checked aria-label="Enable QA simulation" /><span></span></label></section>
        ${joined}
        <section class="tg-setup-card"><label class="tg-field-label" for="tgJoinCode"><span aria-hidden="true">#</span> Join Room</label><div class="tg-join-row"><input id="tgJoinCode" class="tg-input" data-join-code name="sessionId" maxlength="12" inputmode="text" autocomplete="off" placeholder="Enter room code"${disabled}/><button class="tg-button tg-button--join" data-action="join-room" type="button"${disabled}>Join</button></div></section>
        <div class="tg-action-status" data-action-status role="status" aria-live="polite">${status}</div>
        <div class="tg-primary-actions">${primaryAction}</div>
      </form>
    </main>`;
}

function telegramGameTemplate(projection: GameViewProjection, state: PresentationState): string {
  const current = projection.players.find(player => player.isCurrentTurn);
  const activeState = projection.activeEffect || (projection.status === 'active' ? '' : projection.status.toUpperCase());
  const canPlay = Boolean(state.selectedCardId && projection.availableActions.playableCardIds.includes(state.selectedCardId));
  return `
    <main class="tg-app tg-game-page" data-telegram-app data-game-simulation>
      <header class="tg-app__header tg-game-header"><button class="tg-icon-button tg-icon-button--back" type="button" aria-label="Back to room creation" data-game-back>←</button><div class="tg-app__title-block"><strong>Cribbit Chaos</strong><span>Telegram Mini App</span></div><button class="tg-icon-button" type="button" aria-label="Game information" data-game-info>•••</button></header>
      <section class="tg-live-strip" aria-label="Game status"><span class="tg-live-dot" aria-hidden="true"></span><strong>${projection.source === 'server' ? 'LIVE GAME' : 'SIMULATION'}</strong><span>${esc(projection.modeLabel)}</span></section>
      <section class="tg-game-meta" aria-label="Room and turn information"><div class="tg-game-meta__room"><span class="tg-game-meta__mark" aria-hidden="true">●</span><div><small>ROOM</small><strong>${esc(projection.roomName || 'Cribbit Room')}</strong><span>${projection.players.length} players · rev ${projection.revision}</span></div></div><div class="tg-game-meta__turn"><div><small>CURRENT TURN</small><strong>${esc(current?.displayName ?? projection.turnLabel)}</strong></div><div class="tg-timer-ring" aria-label="Turn timer"><span data-timer-seconds>35</span><small>SEC</small></div></div></section>
      <section class="tg-board" aria-label="Card board"><div class="tg-board__piles"><article class="tg-board-zone tg-board-zone--discard"><span class="tg-board-zone__label">DISCARD</span><div class="tg-discard-stack" aria-label="Discard pile">${discardMarkup(projection.discardCard)}</div></article><article class="tg-board-zone tg-board-zone--draw"><span class="tg-board-zone__label">DRAW PILE<br><small>${projection.drawPileCount} cards left</small></span><button class="tg-deck" type="button" data-action="draw-card" aria-label="Draw a card" aria-disabled="${String(!projection.availableActions.canDraw)}"${projection.availableActions.canDraw ? '' : ' disabled'}><span class="draw-pile-stack tg-shared-card-back tg-shared-card-back--board"><i></i><i></i><i></i></span></button></article></div></section>
      <section class="tg-player-strip" aria-label="Players"><div class="tg-player-rail">${projection.players.map(PlayerSeat).join('')}</div></section>
      <section class="tg-active-state" aria-live="polite" data-active-state>${activeState ? `<small>ACTIVE STATE</small><strong>${esc(activeState)}</strong><span>${esc(projection.turnLabel)}</span>` : '<small>TURN IN PROGRESS</small><strong>PLAY OR DRAW</strong><span>Waiting for the current player.</span>'}</section>
      <section class="tg-hand" aria-label="Your hand"><div class="tg-section-label"><span>Your Hand</span><strong>${projection.currentPlayer.hand.length}</strong></div><div class="tg-hand-rail">${handMarkup(projection, state)}</div></section>
      <nav class="tg-safety-bar" aria-label="Game actions"><button type="button" data-action="safety-pass" aria-disabled="true"><span>↪</span><b>Pass</b></button><button type="button" data-action="safety-rewind" aria-disabled="true"><span>↶</span><b>Rewind</b></button><button type="button" data-action="draw-card" aria-disabled="${String(!projection.availableActions.canDraw)}"${projection.availableActions.canDraw ? '' : ' disabled'}><span>▱</span><b>Draw</b></button><button type="button" data-action="play-card" aria-disabled="${String(!canPlay)}"${canPlay ? '' : ' disabled'}><span>▶</span><b>Play</b></button></nav>
      <div class="tg-action-status" data-game-status data-tone="success" role="status" aria-live="polite">${projection.source === 'server' ? `Connected to shared game session ${esc(projection.sessionId)}.` : 'Simulation is running through the shared game engine.'}</div>
    </main>`;
}

export function GameTable(projection: GameViewProjection, state: PresentationState, surface: 'web' | 'telegram' = 'web'): string {
  if (surface === 'telegram') return telegramGameTemplate(projection, state);
  return hydrateWebTemplate(projection, state, 'game');
}

export function renderCribbitHome(input: { readonly busy: boolean; readonly error: string | null; readonly surface?: 'web' | 'telegram' }): string {
  if (input.surface === 'telegram') return telegramRoomCreation(input);
  const fixture = {
    ...({} as GameViewProjection),
    source: 'fixture-preview', sessionId: '', roomName: 'Night Squad', modeLabel: 'Party', round: 1, revision: 0, status: 'waiting', connection: 'connected', players: [], currentPlayer: { playerId: '', hand: [] }, drawPileCount: 0, discardCard: null, activeColor: null, direction: 'clockwise', currentTurnPlayerId: null, activeEffect: null, turnLabel: 'You', winner: null, canStartGame: false, availableActions: { canDraw: false, playableCardIds: [] },
  } as GameViewProjection;
  return hydrateWebTemplate(fixture, createPresentationState(), 'lobby', input);
}

export function renderCribbitLobby(projection: GameViewProjection, input: { readonly busy: boolean; readonly error: string | null; readonly surface?: 'web' | 'telegram' }): string {
  if (input.surface === 'telegram') return telegramRoomCreation({ ...input, lobby: projection });
  return hydrateWebTemplate(projection, createPresentationState(), 'lobby', input)
    .replace('id="startGameButton" type="button" data-action="start-game"', `id="startGameButton" type="button" data-action="start-game"${projection.canStartGame && !input.busy ? '' : ' disabled'}`)
    .replace('Start simulated game', 'Start Game');
}

export const renderGameTable = GameTable;
