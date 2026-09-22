import type { GameViewProjection } from '../../contracts/src/view.ts';

export interface WebPresentationBindingState {
  readonly projection: GameViewProjection | null;
  readonly busy: boolean;
  readonly error: string | null;
}

function setText(root: HTMLElement, selector: string, value: string): void {
  const node = root.querySelector<HTMLElement>(selector);
  if (node) node.textContent = value;
}

function setDisabled(button: HTMLButtonElement | null, disabled: boolean): void {
  if (!button) return;
  button.disabled = disabled;
  button.setAttribute('aria-disabled', String(disabled));
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
  setText(root, '#gameRoomName', projection.roomName);
  setText(root, '#gameRoomMeta', `${projection.players.length} players • ${projection.modeLabel} • ${projection.sessionId}`);
  setText(root, '#currentTurnName', currentTurn?.displayName ?? projection.turnLabel);
  setText(root, '#stageChip', projection.status);
  setText(root, '#boardPhaseLabel', projection.activeEffect ?? 'Play / Draw');
  setText(root, '#activeChallengeTitle', projection.activeEffect ?? 'Play or draw');
  setText(
    root,
    '#activeChallengeCopy',
    projection.activeEffect ?? 'Match the active color or symbol, use an eligible special, or draw under the current rules.',
  );
  setText(root, '#drawPileCount', `${projection.drawPileCount} left`);
  setText(root, '#handCount', `${projection.currentPlayer.hand.length} cards`);
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
