import type { GameViewProjection } from '../../contracts/src/view.ts';
import { renderWebProjectionCard } from './web-card-presentation.ts';

export interface WebPresentationBindingState {
  readonly projection: GameViewProjection | null;
  readonly busy: boolean;
  readonly error: string | null;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char] ?? char);
}

function setText(root: HTMLElement, selector: string, value: string): void {
  const node = root.querySelector<HTMLElement>(selector);
  if (node) node.textContent = value;
}

function setHtml(root: HTMLElement, selector: string, value: string): void {
  const node = root.querySelector<HTMLElement>(selector);
  if (node) node.innerHTML = value;
}

function setDisabled(button: HTMLButtonElement | null, disabled: boolean): void {
  if (!button) return;
  button.disabled = disabled;
  button.setAttribute('aria-disabled', String(disabled));
}

function phaseTrack(projection: GameViewProjection): string {
  return `<span class="phase-chip is-active">${escapeHtml(projection.status)}</span><span class="phase-chip">Round ${projection.round}</span><span class="phase-chip">Rev ${projection.revision}</span>`;
}

function playerList(projection: GameViewProjection): string {
  return projection.players.map(player => {
    const connectionLabel = player.isCurrentPlayer
      ? 'You'
      : player.connection === 'reconnecting'
        ? 'Reconnecting'
        : player.connection === 'offline'
          ? 'Offline'
          : 'Connected';

    return `<div class="player-row${player.isCurrentTurn ? ' is-current' : ''}${player.isCurrentPlayer ? ' is-you' : ''}">
      <span class="avatar">${escapeHtml(player.avatarLabel || player.displayName.slice(0, 1).toUpperCase())}</span>
      <span class="player-meta"><b>${escapeHtml(player.displayName)}</b><span>${connectionLabel}</span></span>
      <strong class="card-count">${player.cardCount}</strong>
    </div>`;
  }).join('');
}

function handMarkup(projection: GameViewProjection): string {
  const playable = new Set(projection.availableActions.playableCardIds);
  if (projection.currentPlayer.hand.length === 0) {
    return '<div class="empty-state"><h3>Empty hand</h3><p>Awaiting authoritative win check.</p></div>';
  }

  return projection.currentPlayer.hand
    .map(card => renderWebProjectionCard(card, true, playable.has(card.instanceId)))
    .join('');
}

function discardMarkup(projection: GameViewProjection): string {
  return projection.discardCard
    ? renderWebProjectionCard(projection.discardCard, false, false)
    : '<span class="tag">No discard</span>';
}

function statsGrid(projection: GameViewProjection): string {
  return `
    <div class="stat-card"><span>Revision</span><b>${projection.revision}</b></div>
    <div class="stat-card"><span>Draw pile</span><b>${projection.drawPileCount}</b></div>
    <div class="stat-card"><span>Players</span><b>${projection.players.length}</b></div>
    <div class="stat-card"><span>Status</span><b>${escapeHtml(projection.status)}</b></div>
  `;
}

function championPanel(projection: GameViewProjection): string {
  if (!projection.winner) return '';

  return `<div class="champ-copy"><p class="eyebrow">Resolved</p><h2>WINNER · ${escapeHtml(projection.winner.displayName)}</h2><p>${escapeHtml(projection.winner.displayName)} emptied their hand first.</p></div>`;
}

export function updateWebPresentation(root: HTMLElement, state: WebPresentationBindingState): void {
  const projection = state.projection;

  setDisabled(root.querySelector<HTMLButtonElement>('#startGameButton'), state.busy);
  setDisabled(root.querySelector<HTMLButtonElement>('[data-action="join-room"]'), state.busy);

  const liveStart = root.querySelector<HTMLButtonElement>('[data-clean-start-game]');
  if (liveStart) {
    liveStart.hidden = projection?.status !== 'waiting';
    setDisabled(liveStart, state.busy || !Boolean(projection?.canStartGame));
  }

  if (!projection) {
    setText(
      root,
      '#authorityCopy',
      state.error ?? 'Waiting for a session. Server state owns legality, hand ownership, winner and revision.',
    );
    return;
  }

  const currentTurn = projection.players.find(player => player.isCurrentTurn);

  setText(root, '#revisionLabel', `Server rev ${projection.revision}`);
  setText(root, '#modeBadge', projection.modeLabel);
  setHtml(root, '#phaseTrack', phaseTrack(projection));
  setText(root, '#gameRoomName', projection.roomName);
  setText(root, '#gameRoomMeta', `${projection.players.length} players • ${projection.modeLabel} • ${projection.sessionId}`);
  setText(root, '#currentTurnName', currentTurn?.displayName ?? projection.turnLabel);
  setText(root, '#timerValue', '—');
  setText(root, '#stageChip', projection.status);
  setText(root, '#boardPhaseLabel', projection.activeEffect ?? 'Play / Draw');
  setText(root, '#activeChallengeTitle', projection.activeEffect ?? 'Play or draw');
  setText(
    root,
    '#activeChallengeCopy',
    projection.activeEffect ?? 'Match the active color or symbol, use an eligible special, or draw under the current rules.',
  );
  setHtml(root, '#playerList', playerList(projection));
  setHtml(root, '#discardSlot', discardMarkup(projection));
  setText(root, '#drawPileCount', `${projection.drawPileCount} left`);
  setText(root, '#handCount', `${projection.currentPlayer.hand.length} cards`);
  setHtml(root, '#handScroll', handMarkup(projection));
  setHtml(root, '#statsGrid', statsGrid(projection));
  setHtml(root, '#champPanel', championPanel(projection));
  setText(root, '#directionLabel', projection.direction === 'clockwise' ? 'Clockwise' : 'Counter-clockwise');
  setText(root, '#phoneRevision', String(projection.revision));
  setText(
    root,
    '#authorityCopy',
    state.error ?? 'Server projection owns legality, hand ownership, winner and revision.',
  );

  root.querySelectorAll<HTMLButtonElement>('[data-draw-control]').forEach(button => {
    setDisabled(button, state.busy || !projection.availableActions.canDraw);
  });
}
