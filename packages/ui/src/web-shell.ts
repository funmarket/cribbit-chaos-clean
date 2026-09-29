import { OLD_PACKAGES_UI_SRC_TEMPLATE_HTML } from './old-ui-source/source-text.ts';
import { canonicalHeroCardMarkup } from './web-card-presentation.ts';
import type { WebProductView } from './web-controller.ts';

export interface MountedWebShell {
  (): void;
}

function mountCribbitChaosHero(root: HTMLElement): void {
  const heroHost = root.querySelector<HTMLElement>('.lobby-hero');
  const roomCreation = root.querySelector<HTMLElement>('.setup-panel');
  const startButton = root.querySelector<HTMLButtonElement>('#startGameButton');

  if (!heroHost || !roomCreation) return;

  roomCreation.id = 'roomCreation';

  heroHost.innerHTML = `
    <div class="cc-web-hero">
      <div class="cc-web-cards-bg" aria-hidden="true">
        ${canonicalHeroCardMarkup()}
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
          <span class="cc-web-pill p-truth">❓ Truth</span>
          <span class="cc-web-pill p-dare">⚡ Dare</span>
          <span class="cc-web-pill p-paranoia">◉ Paranoia</span>
          <span class="cc-web-pill p-chaos">↻ Chaos</span>
          <span class="cc-web-pill p-duel">⚔️ Duel</span>
          <span class="cc-web-pill p-nope">✋ Nope</span>
        </div>

        <div class="cc-web-infobar">
          <span class="cc-web-infobar-shield">🛡️</span>
          <div class="cc-web-infobar-text">
            <b>Explicit safety controls built in.</b>
            Pass, Rewind, Nope and Flag keep CHAOS on your terms.
          </div>
        </div>

        <div class="cc-web-actions">
          <a class="button cc-web-create" href="#roomCreation">Create a game</a>
        </div>
      </div>
    </div>
  `;

  if (startButton) {
    startButton.dataset.action = 'demo-game';
    heroHost.querySelector<HTMLElement>('.cc-web-actions')?.append(startButton);
  }

  const liveStart = root.ownerDocument.createElement('button');
  liveStart.className = 'button';
  liveStart.type = 'button';
  liveStart.dataset.action = 'start-game';
  liveStart.dataset.cleanStartGame = '';
  liveStart.textContent = 'Start Game';
  liveStart.hidden = true;
  heroHost.querySelector<HTMLElement>('.cc-web-actions')?.append(liveStart);
}

function prepareCleanBindings(root: HTMLElement): void {
  const profileName = root.querySelector<HTMLInputElement>('#profileName');
  if (profileName) profileName.name = 'createName';

  const joinCode = root.querySelector<HTMLInputElement>('#joinCode');
  if (joinCode) joinCode.name = 'sessionId';

  const qaToggle = root.querySelector<HTMLInputElement>('#qaHandToggle');
  if (qaToggle) {
    qaToggle.checked = false;
    qaToggle.closest<HTMLElement>('.knob-row')?.remove();
  }
}

export function mountWebShell(root: HTMLElement): MountedWebShell {
  root.innerHTML = OLD_PACKAGES_UI_SRC_TEMPLATE_HTML;
  prepareCleanBindings(root);
  mountCribbitChaosHero(root);

  return () => {
    root.ownerDocument.body.classList.remove('is-game-view');
    root.replaceChildren();
  };
}
