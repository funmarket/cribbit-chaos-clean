// Extracted presentation-only Telegram templates from:
// - funmarket/cribbit-chaos@95febd07e4d739c96843fcc4a02f070eb3c623c0/apps/telegram/src/bootstrapTelegram.ts::renderRoomCreation
// - funmarket/cribbit-chaos@95febd07e4d739c96843fcc4a02f070eb3c623c0/apps/telegram/src/gameView.ts::gameTemplate
//
// Dynamic values are represented by hydration tokens. This module contains no gameplay,
// legality, timer, simulation, auth, or winner authority.

export const OLD_TELEGRAM_ROOM_CREATION_TEMPLATE = String.raw`
    <main class="tg-app tg-room-page" data-telegram-app>
      <header class="tg-app__header">
        <button class="tg-icon-button tg-icon-button--back" type="button" aria-label="Back" data-tg-back>←</button>
        <div class="tg-app__title-block">
          <strong>Cribbit Chaos</strong>
          <span>Telegram Mini App</span>
        </div>
        <button class="tg-icon-button" type="button" aria-label="Menu" data-tg-menu>•••</button>
      </header>

      <section class="tg-room-hero" aria-labelledby="tg-room-title">
        <div class="tg-room-hero__kicker"><span class="tg-frog-mark" aria-hidden="true">●</span><span>Room Creation</span></div>
        <h1 id="tg-room-title"><span>Build</span> Tonight's <span>Chaos</span></h1>
        <p>Set the room, pick the chaos, and jump in.</p>
      </section>

      <form class="tg-room-form" data-room-form novalidate>
        <section class="tg-setup-card">
          <label class="tg-field-label" for="tgProfileName"><span aria-hidden="true">♙</span> Profile Name</label>
          <div class="tg-input-wrap">
            <input id="tgProfileName" class="tg-input" data-profile-input maxlength="20" value="{{PROFILE_NAME}}" autocomplete="name" />
            <span class="tg-field-icon" aria-hidden="true">✎</span>
          </div>
          <div class="tg-field-meta"><span data-auth-state>{{AUTH_STATE}}</span><span data-api-state>{{API_STATE}}</span></div>
        </section>

        <section class="tg-setup-card">
          <label class="tg-field-label" for="tgRoomName"><span aria-hidden="true">⌂</span> Room Name</label>
          <input id="tgRoomName" class="tg-input" data-room-name maxlength="28" value="{{ROOM_NAME}}" />
        </section>

        <section class="tg-setup-card tg-grid-2">
          <div>
            <label class="tg-field-label" for="tgWorld"><span aria-hidden="true">◎</span> Content World</label>
            <select id="tgWorld" class="tg-select" data-world>
              {{WORLD_OPTIONS}}
            </select>
          </div>
          <div>
            <label class="tg-field-label" for="tgCeiling"><span aria-hidden="true">♛</span> Personal Ceiling</label>
            <select id="tgCeiling" class="tg-select" data-ceiling>
              {{CEILING_OPTIONS}}
            </select>
          </div>
        </section>

        <section class="tg-setup-card">
          <div class="tg-section-label"><span>Choose Mode</span><small data-mode-copy>{{MODE_COPY}}</small></div>
          <div class="tg-mode-grid" data-mode-grid>
            {{MODE_BUTTONS}}
          </div>
        </section>

        <section class="tg-setup-card">
          <div class="tg-section-label"><span>Player Count</span><strong data-player-count-value>{{PLAYER_COUNT}}</strong></div>
          <div class="tg-count-grid" data-player-grid>
            {{PLAYER_COUNT_BUTTONS}}
          </div>
        </section>

        <section class="tg-setup-card">
          <div class="tg-section-label"><span>Live Prompt Sources</span><small>Current room draft</small></div>
          <div class="tg-source-grid" data-source-grid>
            {{SOURCE_BUTTONS}}
          </div>
        </section>

        <section class="tg-setup-card tg-toggle-row">
          <div>
            <span class="tg-field-label"><span aria-hidden="true">⚗</span> QA Test Hand</span>
            <small>Show the canonical engine simulation entry point for visual and interaction QA.</small>
          </div>
          <label class="tg-switch">
            <input type="checkbox" data-qa-hand{{QA_CHECKED}} aria-label="Enable QA simulation" />
            <span></span>
          </label>
        </section>

        {{JOINED_PLAYERS}}

        <section class="tg-setup-card">
          <label class="tg-field-label" for="tgJoinCode"><span aria-hidden="true">#</span> Join Room</label>
          <div class="tg-join-row">
            <input id="tgJoinCode" class="tg-input" data-join-code maxlength="12" inputmode="text" autocomplete="off" placeholder="Enter room code" />
            <button class="tg-button tg-button--join" data-action="join-room" type="button">Join</button>
          </div>
        </section>

        <div class="tg-action-status" data-action-status role="status" aria-live="polite">{{ACTION_STATUS}}</div>

        <div class="tg-primary-actions">
          {{PRIMARY_ACTIONS}}
        </div>
      </form>
    </main>
`;

export const OLD_TELEGRAM_GAME_TEMPLATE = String.raw`
    <main class="tg-app tg-game-page" data-telegram-app data-game-simulation>
      <header class="tg-app__header tg-game-header">
        <button class="tg-icon-button tg-icon-button--back" type="button" aria-label="Back to room creation" data-game-back>←</button>
        <div class="tg-app__title-block">
          <strong>Cribbit Chaos</strong>
          <span>Telegram Mini App</span>
        </div>
        <button class="tg-icon-button" type="button" aria-label="Game information" data-game-info>•••</button>
      </header>

      <section class="tg-live-strip" aria-label="Game status">
        <span class="tg-live-dot" aria-hidden="true"></span>
        <strong>{{GAME_STATUS}}</strong>
        <span>{{MODE_LABEL}}</span>
      </section>

      <section class="tg-game-meta" aria-label="Room and turn information">
        <div class="tg-game-meta__room">
          <span class="tg-game-meta__mark" aria-hidden="true">●</span>
          <div>
            <small>ROOM</small>
            <strong>{{ROOM_NAME}}</strong>
            <span>{{PLAYER_COUNT}} players · rev {{REVISION}}</span>
          </div>
        </div>
        <div class="tg-game-meta__turn">
          <div>
            <small>CURRENT TURN</small>
            <strong>{{CURRENT_TURN}}</strong>
          </div>
          <div class="tg-timer-ring" aria-label="Turn timer">
            <span data-timer-seconds>{{TIMER_SECONDS}}</span>
            <small>SEC</small>
          </div>
        </div>
      </section>

      <section class="tg-board" aria-label="Card board">
        <div class="tg-board__piles">
          <article class="tg-board-zone tg-board-zone--discard">
            <span class="tg-board-zone__label">DISCARD</span>
            <div class="tg-discard-stack" aria-label="Discard pile">
              {{DISCARD_MARKUP}}
            </div>
          </article>
          <article class="tg-board-zone tg-board-zone--draw">
            <span class="tg-board-zone__label">DRAW PILE<br><small>{{DRAW_PILE_COUNT}} cards left</small></span>
            <button class="tg-deck" type="button" data-action="draw-card" aria-label="Draw a card" aria-disabled="{{DRAW_DISABLED}}">
              {{DRAW_PILE_BACK}}
            </button>
          </article>
        </div>
      </section>

      <section class="tg-player-strip" aria-label="Players">
        <div class="tg-player-rail">
          {{PLAYER_RAIL}}
        </div>
      </section>

      {{ACTIVE_STATE}}
      {{WILD_PICKER}}
      {{DECISION_CONTROLS}}

      <section class="tg-hand" aria-label="Your hand">
        <div class="tg-section-label"><span>Your Hand</span><strong>{{HAND_COUNT}}</strong></div>
        <div class="tg-hand-rail">
          {{HAND_MARKUP}}
        </div>
      </section>

      <nav class="tg-safety-bar" aria-label="Game actions">
        <button type="button" data-action="safety-pass" aria-disabled="{{PASS_DISABLED}}"><span>↪</span><b>Pass</b></button>
        <button type="button" data-action="safety-rewind" aria-disabled="{{REWIND_DISABLED}}"><span>↶</span><b>Rewind</b></button>
        <button type="button" data-action="draw-card" aria-disabled="{{DRAW_DISABLED}}"><span>▱</span><b>Draw</b></button>
      </nav>

      <div class="tg-action-status" data-game-status data-tone="{{STATUS_TONE}}" role="status" aria-live="polite">{{STATUS_MESSAGE}}</div>
    </main>
`;
