// What this does: applies the old Cribbit Telegram/Web visual language to clean server projections.
// Key invariant: CSS only changes presentation; gameplay state remains server-authoritative.
// Explicitly out of scope: new marketing layouts, client game rules, or hosted API wiring.
export const GAME_TABLE_STYLES = String.raw`
:root{
  color-scheme:dark;
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --tg-display-font:"Arial Narrow","Roboto Condensed","Helvetica Neue",sans-serif;
  --tg-bg:#03050a;
  --tg-panel:#090d15;
  --tg-panel-2:#0d121d;
  --tg-border:#30384a;
  --tg-border-soft:rgba(255,255,255,.09);
  --tg-muted:#8d95a4;
  --tg-text:#f7f8fb;
  --tg-lime:#9cff16;
  --tg-purple:#b34cff;
  --tg-pink:#ff2f87;
  --tg-cyan:#38cfff;
  --tg-orange:#ff861d;
  --tg-gold:#ffd329;
  --tg-danger:#ff466d;
  --tg-surface-shadow:0 14px 32px rgba(0,0,0,.3);
  --bg:var(--tg-bg);--surface:var(--tg-panel);--surface2:var(--tg-panel-2);--text:var(--tg-text);--muted:var(--tg-muted);--line:var(--tg-border-soft);--lime:var(--tg-lime);--magenta:var(--tg-pink);--purple:var(--tg-purple);--cyan:var(--tg-cyan);--orange:var(--tg-orange);--gold:var(--tg-gold);--red:var(--tg-danger);
}
*{box-sizing:border-box}
html,body{margin:0;min-width:100%;min-height:100%;background:var(--tg-bg)}
.cribbit-app{min-height:100dvh;color:var(--tg-text);background:var(--tg-bg);font-family:inherit}
.cribbit-app.tg-app{
  width:min(100%,430px);
  min-height:var(--cribbit-platform-height,100dvh);
  margin:0 auto;
  padding:calc(var(--cribbit-safe-top,0px) + 10px) max(14px,var(--cribbit-safe-right,0px)) calc(var(--cribbit-safe-bottom,0px) + 24px) max(14px,var(--cribbit-safe-left,0px));
  background:radial-gradient(circle at 8% 0%,rgba(156,255,22,.09),transparent 28%),radial-gradient(circle at 94% 10%,rgba(179,76,255,.13),transparent 30%),radial-gradient(circle at 52% 72%,rgba(56,207,255,.035),transparent 36%),linear-gradient(180deg,#03050a 0%,#060811 48%,#03050a 100%);
}
.cribbit-app button,.cribbit-app input,.cribbit-app select{font:inherit;color:inherit}
.cribbit-app button{appearance:none;-webkit-appearance:none;-webkit-tap-highlight-color:transparent}
.cribbit-app input{appearance:none;-webkit-appearance:none}
.cribbit-app button:focus-visible,.cribbit-app input:focus-visible{outline:2px solid var(--tg-lime);outline-offset:2px}

.app-header,.tg-app__header{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;gap:10px;min-height:58px;padding:0 0 10px;border-bottom:1px solid rgba(179,76,255,.24);background:transparent;position:relative;top:auto;z-index:auto}
.tg-app__title-block{display:flex;min-width:0;flex-direction:column;align-items:center;text-align:center}
.tg-app__title-block strong{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:21px;line-height:1.05;letter-spacing:-.025em}
.tg-app__title-block span{margin-top:4px;color:#a4a9b4;font-size:11px}
.tg-icon-button,.brand-lockup,.icon-button{display:grid;place-items:center;width:42px;height:42px;padding:0;border:1px solid rgba(179,76,255,.48);border-radius:14px;background:linear-gradient(180deg,rgba(18,20,30,.96),rgba(7,9,15,.98));color:#ce73ff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 0 18px rgba(179,76,255,.07);font-size:20px;font-weight:900;cursor:pointer}
.tg-icon-button--back{color:var(--tg-lime);border-color:rgba(156,255,22,.36)}
.frog-mark{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(156,255,22,.75);border-radius:11px;background:rgba(156,255,22,.12);box-shadow:0 0 20px rgba(156,255,22,.22),inset 0 0 12px rgba(156,255,22,.08);color:var(--tg-lime)}
.brand-type,.product-nav{display:none}
.header-tools{display:grid;place-items:center;min-width:0}
.connection-status{display:flex;align-items:center;gap:6px;min-width:0;color:#9fa6b2;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.connection-status i{width:7px;height:7px;flex:0 0 auto;border-radius:50%;background:var(--tg-lime);box-shadow:0 0 10px var(--tg-lime)}
.connection-status span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.connection-status[data-connection="reconnecting"] i{background:var(--tg-orange);box-shadow:0 0 10px var(--tg-orange)}
.connection-status[data-connection="offline"] i{background:var(--tg-danger);box-shadow:0 0 10px var(--tg-danger)}

.tg-live-strip{display:flex;align-items:center;justify-content:center;gap:9px;min-height:42px;margin:10px 0;padding:8px 14px;border:1px solid rgba(156,255,22,.58);border-radius:12px;background:linear-gradient(180deg,rgba(156,255,22,.07),rgba(156,255,22,.025));color:var(--tg-lime);box-shadow:0 0 18px rgba(156,255,22,.08),inset 0 0 0 1px rgba(156,255,22,.04);font-family:var(--tg-display-font);font-size:12px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}
.tg-live-strip>span:last-child{margin-left:auto;color:#aeb5c0;letter-spacing:.04em}
.tg-live-dot{width:9px;height:9px;flex:0 0 auto;border-radius:50%;background:var(--tg-lime);box-shadow:0 0 14px var(--tg-lime)}

.tg-room-hero{padding:18px 4px 14px;text-align:center}
.tg-room-hero__kicker{display:flex;align-items:center;justify-content:center;gap:10px;color:var(--tg-lime);font-family:var(--tg-display-font);font-size:15px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
.tg-room-hero__kicker::before,.tg-room-hero__kicker::after{content:'';width:clamp(28px,12vw,52px);height:1px;background:linear-gradient(90deg,transparent,var(--tg-pink));box-shadow:0 0 10px rgba(255,47,135,.35)}
.tg-room-hero__kicker::after{transform:scaleX(-1)}
.tg-room-hero h1{margin:12px 0 4px;font-family:var(--tg-display-font);font-size:clamp(34px,10.5vw,52px);font-weight:950;line-height:.88;letter-spacing:-.045em;text-transform:uppercase;text-shadow:0 0 22px rgba(255,255,255,.035)}
.tg-room-hero h1 span:first-child{color:var(--tg-lime)}
.tg-room-hero h1 span:last-child{color:var(--tg-pink)}
.tg-room-hero p{margin:12px auto 0;max-width:34ch;color:#b2b8c3;font-size:14px;line-height:1.35}
.tg-room-form{display:grid;gap:10px}
.tg-setup-card,.tg-game-meta,.tg-player-strip,.tg-hand{min-width:0;padding:13px;border:1px solid #333b4c;border-radius:15px;background:linear-gradient(180deg,rgba(17,22,32,.98),rgba(7,10,16,.985));box-shadow:var(--tg-surface-shadow),inset 0 0 0 1px rgba(179,76,255,.035)}
.tg-card-copy{margin:0 0 12px;color:#89919f;font-size:10px;line-height:1.35}
.tg-section-label{display:flex;align-items:end;justify-content:space-between;gap:10px;margin-bottom:10px}
.tg-field-label,.tg-section-label>span{display:flex;align-items:center;gap:7px;margin:0 0 8px;color:#d0d4dc;font-family:var(--tg-display-font);font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
.tg-field-label>span,.tg-section-label>span::first-letter{color:var(--tg-lime)}
.tg-section-label small{max-width:56%;color:#8a92a0;font-size:10px;line-height:1.25;text-align:right}
.tg-section-label strong{display:grid;place-items:center;min-width:38px;height:31px;border:1px solid rgba(156,255,22,.55);border-radius:10px;color:var(--tg-lime);background:rgba(156,255,22,.09);box-shadow:0 0 14px rgba(156,255,22,.08);font-size:17px}
.tg-input-wrap{position:relative;margin-bottom:10px}
.tg-field-icon{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--tg-purple);pointer-events:none;font-size:19px}
.tg-input,.cribbit-app input{width:100%;min-height:50px;border:1px solid #455064;border-radius:11px;background:linear-gradient(180deg,#060a11,#03060b);color:#fff;box-shadow:inset 0 0 16px rgba(0,0,0,.24);font-size:16px;font-weight:780;padding:10px 42px 10px 13px}
.tg-input::placeholder,.cribbit-app input::placeholder{color:#686f7b;font-weight:650}
.tg-input:focus,.cribbit-app input:focus{border-color:var(--tg-purple);box-shadow:0 0 0 1px rgba(179,76,255,.3),0 0 18px rgba(179,76,255,.1)}
.tg-button,.cribbit-app form button,.context-actions button{min-height:50px;width:100%;border-radius:11px;font-family:var(--tg-display-font);font-weight:950;letter-spacing:.025em;cursor:pointer;text-transform:uppercase}
.tg-button--join{border:1px solid var(--tg-pink);background:rgba(255,47,135,.08);color:#ff72ad;box-shadow:0 0 15px rgba(255,47,135,.07)}
.tg-button--create,.context-actions button{border:1px solid rgba(179,76,255,.7);background:linear-gradient(180deg,rgba(179,76,255,.16),rgba(74,26,102,.18));color:#dca9ff;box-shadow:0 0 16px rgba(179,76,255,.08)}

.tg-game-meta{display:grid;gap:13px;margin-bottom:10px;background:radial-gradient(circle at 12% 10%,rgba(179,76,255,.07),transparent 28%),linear-gradient(180deg,rgba(15,20,30,.985),rgba(7,10,16,.99))}
.tg-game-meta__room,.tg-game-meta__turn{display:flex;align-items:center;min-width:0}
.tg-game-meta__room{gap:12px}.tg-game-meta__room>div,.tg-game-meta__turn>div:first-child{min-width:0;flex:1 1 auto}
.tg-game-meta__mark{display:grid;place-items:center;width:44px;height:44px;flex:0 0 auto;border:1px solid rgba(179,76,255,.55);border-radius:12px;background:radial-gradient(circle,rgba(179,76,255,.2),rgba(179,76,255,.06));color:var(--tg-purple);box-shadow:0 0 18px rgba(179,76,255,.12);font-size:18px}
.tg-game-meta small{color:#a1a8b4;font-family:var(--tg-display-font);font-size:10px;font-weight:900;letter-spacing:.11em}
.tg-game-meta strong{display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--tg-display-font);font-size:21px;font-weight:950;letter-spacing:-.015em}
.tg-game-meta span:not(.tg-game-meta__mark){display:block;margin-top:3px;color:#8992a0;font-size:10px}
.tg-game-meta__turn{justify-content:space-between;gap:14px;padding-top:12px;border-top:1px solid var(--tg-border-soft)}
.tg-game-meta__turn strong{color:var(--tg-lime);font-size:22px}
.tg-timer-ring{display:flex;flex:0 0 auto;flex-direction:column;align-items:center;justify-content:center;width:68px;height:68px;border:3px solid var(--tg-lime);border-radius:50%;background:radial-gradient(circle,rgba(156,255,22,.16),rgba(156,255,22,.035) 62%,transparent 64%);box-shadow:0 0 22px rgba(156,255,22,.3),inset 0 0 14px rgba(156,255,22,.08)}
.tg-timer-ring span{margin:0;color:var(--tg-lime);font-size:24px;font-weight:950;line-height:1}.tg-timer-ring small{color:var(--tg-lime);font-size:8px;opacity:.86}

.tg-board{min-width:0;margin-bottom:10px;padding:14px;border:1px solid rgba(179,76,255,.55);border-radius:17px;background:radial-gradient(circle at 28% 38%,rgba(179,76,255,.13),transparent 38%),radial-gradient(circle at 78% 30%,rgba(56,207,255,.035),transparent 30%),linear-gradient(180deg,#0c1018,#06080d);box-shadow:0 16px 38px rgba(0,0,0,.34),0 0 24px rgba(179,76,255,.06)}
.tg-board__piles{display:grid;grid-template-columns:minmax(0,1.28fr) minmax(110px,.82fr);align-items:start}
.tg-board-zone{display:flex;min-width:0;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;padding:8px}
.tg-board-zone--draw{border-left:1px solid var(--tg-border-soft)}
.tg-board-zone__label{color:#a8afba;font-family:var(--tg-display-font);font-size:10px;font-weight:950;line-height:1.35;letter-spacing:.11em;text-align:center;text-transform:uppercase}
.tg-board-zone__label small{color:#7e8795;font-family:inherit;font-size:9px;letter-spacing:0;text-transform:none}
.tg-discard-stack{position:relative;display:grid;place-items:end center;min-width:0}.tg-discard-stack::before,.tg-discard-stack::after{content:'';position:absolute;width:88%;height:91%;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:linear-gradient(180deg,#0d1119,#080a0f);box-shadow:0 8px 18px rgba(0,0,0,.22);pointer-events:none}.tg-discard-stack::before{transform:translate(-11%,2%) rotate(-5deg)}.tg-discard-stack::after{transform:translate(-5%,1%) rotate(-2deg)}.tg-discard-stack>.game-card,.tg-discard-stack>.tg-empty-pile{position:relative;z-index:1}
.tg-empty-pile{display:grid;place-items:center;width:min(172px,46vw);aspect-ratio:5/7;border:1px dashed var(--tg-border);border-radius:13px;color:var(--tg-muted);font-size:10px}
.tg-deck{display:flex;flex-direction:column;align-items:center;padding:0;border:0;background:transparent;color:#fff;cursor:pointer}.draw-pile-body{display:none}.draw-pile-stack{position:relative;display:block;width:min(118px,31vw);aspect-ratio:5/7;filter:drop-shadow(7px 7px 0 #171020) drop-shadow(4px 4px 0 #0b0d12) drop-shadow(0 0 14px rgba(179,76,255,.22))}.draw-pile-stack i{position:absolute;inset:0;border:1px solid rgba(179,76,255,.5);border-radius:14px;background:linear-gradient(135deg,rgba(56,207,255,.15),rgba(179,76,255,.18)),#090c14}.draw-pile-stack i:nth-child(2){transform:translate(-4px,4px)}.draw-pile-stack i:nth-child(3){transform:translate(-8px,8px)}

.tg-player-strip,.tg-hand{margin-top:10px;padding:11px;border-radius:13px;background:linear-gradient(180deg,rgba(12,16,24,.97),rgba(7,10,15,.98))}
.tg-player-rail,.tg-hand-rail{display:flex;max-width:100%;gap:8px;overflow-x:auto;overscroll-behavior-x:contain;scroll-padding-inline:2px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.tg-player-rail::-webkit-scrollbar,.tg-hand-rail::-webkit-scrollbar{display:none}.tg-player-rail{padding:2px 2px 4px;scroll-snap-type:x proximity}
.tg-player-chip{display:flex;flex:0 0 auto;min-width:112px;align-items:center;gap:8px;padding:9px 10px;border:1px solid #364052;border-radius:11px;background:linear-gradient(180deg,#0b0f17,#06090e);scroll-snap-align:start}
.tg-player-chip.is-active{border-color:var(--tg-lime);box-shadow:0 0 15px rgba(156,255,22,.09),inset 0 0 12px rgba(156,255,22,.07)}
.tg-player-avatar{display:grid;place-items:center;width:32px;height:32px;flex:0 0 auto;border-radius:50%;background:#3a214b;color:#dda0ff;font-size:12px;font-weight:950}.tg-player-chip.is-human .tg-player-avatar,.tg-player-chip.is-active .tg-player-avatar{background:rgba(156,255,22,.17);color:var(--tg-lime)}
.tg-player-chip b,.tg-player-chip small{display:block}.tg-player-chip b{max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}.tg-player-chip small{margin-top:2px;color:#89919d;font-size:9px}.player-cards{display:grid;margin-left:auto;text-align:right;font-size:16px;font-weight:900}.player-cards small{font-size:7px;color:#89919d;text-transform:uppercase}
.tg-active-state{margin-top:10px;padding:12px 14px;border:1px solid rgba(179,76,255,.5);border-radius:12px;background:linear-gradient(180deg,rgba(179,76,255,.08),rgba(179,76,255,.035));box-shadow:0 0 16px rgba(179,76,255,.05);text-align:center}.tg-active-state small,.tg-active-state strong,.tg-active-state span{display:block}.tg-active-state small{color:#a8afba;font-size:9px;font-weight:950;letter-spacing:.12em}.tg-active-state strong{margin-top:3px;color:#d890ff;font-family:var(--tg-display-font);font-size:20px;font-weight:950}.tg-active-state span{margin-top:5px;color:#a6adb8;font-size:10px;line-height:1.4}
.tg-hand .tg-section-label{margin-bottom:3px}.tg-hand-rail{padding:8px 2px 14px;scroll-snap-type:x proximity;touch-action:pan-x}.tg-hand-empty{margin:8px 2px;color:var(--tg-muted);font-size:10px}

.game-card{position:relative;display:block;flex:0 0 auto;aspect-ratio:5/7;padding:0;border:0;background:transparent;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}.game-card__art{display:block;width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none}.game-card--tg-board{width:min(174px,47vw);min-width:0;border-radius:13px;filter:drop-shadow(0 12px 18px rgba(0,0,0,.32))}.game-card--tg-hand{width:clamp(96px,27vw,112px);min-width:0;border-radius:10px;scroll-snap-align:start;filter:drop-shadow(0 8px 12px rgba(0,0,0,.28))}.game-card--tg-board .game-card__art,.game-card--tg-hand .game-card__art{border-radius:inherit}.game-card[data-selected="true"]{transform:translateY(-8px)}.game-card[data-playable="true"]{filter:drop-shadow(0 0 8px rgba(156,255,22,.3)) drop-shadow(0 8px 12px rgba(0,0,0,.28))}.game-card__legal-badge{position:absolute;right:5%;bottom:4%;display:inline-flex;align-items:center;justify-content:center;min-height:18px;padding:3px 6px;border-radius:999px;background:var(--tg-lime);color:#071009;font-family:var(--tg-display-font);font-size:7px;font-weight:950;letter-spacing:.03em;line-height:1;pointer-events:none}.game-card[aria-disabled="true"]{opacity:.64}.game-card__corner,.game-card__mark,.game-card__name{display:none}

.tg-safety-bar{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin-top:10px}.tg-safety-bar button{min-width:0;min-height:58px;padding:7px 3px;border:1px solid #3a4455;border-radius:11px;background:linear-gradient(180deg,#0b0f17,#07090e);color:#d2d6dd;cursor:pointer}.tg-safety-bar span,.tg-safety-bar b{display:block}.tg-safety-bar span{color:var(--tg-purple);font-size:20px;text-shadow:0 0 12px currentColor}.tg-safety-bar b{margin-top:3px;font-size:9px;text-transform:uppercase}.tg-safety-bar button:not(:disabled){border-color:rgba(156,255,22,.42);color:var(--tg-lime)}button:disabled{opacity:.48;cursor:not-allowed}
.tg-action-status{min-height:0;margin-top:10px;padding:0 5px;color:#9da4af;font-size:10px;line-height:1.4}.tg-action-status:not(:empty){min-height:38px;padding:9px 11px;border:1px solid #293241;border-radius:10px;background:rgba(255,255,255,.025)}.tg-action-status[data-tone="success"]{border-color:rgba(156,255,22,.35);color:var(--tg-lime)}.tg-action-status[data-tone="warning"]{border-color:rgba(255,211,41,.32);color:#ffd85b}
.special-effect-sheet,.color-chooser{position:fixed;z-index:60;pointer-events:none;opacity:0;transition:opacity .16s ease}.special-effect-sheet{inset:0;display:grid;place-items:end center;background:rgba(0,0,0,.52);backdrop-filter:blur(5px)}.special-effect-sheet>div{width:min(420px,calc(100% - 18px));margin-bottom:10px;padding:18px;border:1px solid rgba(255,255,255,.18);border-radius:18px;background:#0a0d15;box-shadow:0 24px 70px rgba(0,0,0,.58)}.special-effect-sheet h2{margin:4px 0;text-transform:uppercase}.special-effect-sheet p{color:var(--tg-muted);font-size:11px}.special-effect-sheet.is-open,.color-chooser.is-open{pointer-events:auto;opacity:1}.color-chooser{left:50%;bottom:62px;transform:translateX(-50%);width:min(420px,calc(100% - 18px));padding:12px;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:#0a0d15;box-shadow:0 18px 50px rgba(0,0,0,.5)}.color-chooser>div{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:8px 0}.color-chooser small{color:var(--tg-muted);font-size:8px}
.game-app-shell,.game-topbar,.game-layout,.panel,.game-stage,.desktop-gameboard,.board-session-header,.desktop-play-grid,.board-pane,.board-challenge,.table-zone,.table-piles,.hand-zone,.hand-scroll{display:contents}

@media(max-width:379px){.cribbit-app.tg-app{padding-left:max(10px,var(--cribbit-safe-left,0px));padding-right:max(10px,var(--cribbit-safe-right,0px))}.tg-room-hero{padding-top:18px}.tg-room-hero h1{font-size:clamp(34px,10.5vw,43px)}.tg-safety-bar{gap:5px}.tg-safety-bar button{min-height:52px}.tg-board{padding:10px}.tg-board__piles{grid-template-columns:minmax(0,1.38fr) minmax(92px,.72fr)}.tg-board-zone{padding-inline:4px}.tg-game-meta__turn strong{font-size:18px}.tg-timer-ring{width:58px;height:58px}.tg-timer-ring span{font-size:20px}.game-card--tg-board{width:min(148px,45vw)}.game-card--tg-hand{width:88px}.draw-pile-stack{width:min(102px,29vw)}}
@media(max-width:329px){.app-header,.tg-app__header{grid-template-columns:40px minmax(0,1fr) 40px}.tg-icon-button,.brand-lockup,.icon-button{width:38px;height:38px}.tg-app__title-block strong{font-size:18px}.tg-button{font-size:13px}.tg-safety-bar button{min-height:48px}.tg-safety-bar b{font-size:8px}.tg-board-zone__label{font-size:9px}}
@media(prefers-color-scheme:light){:root{color-scheme:dark}.cribbit-app,.cribbit-app.tg-app{color:var(--tg-text);background:radial-gradient(circle at 8% 0%,rgba(156,255,22,.09),transparent 28%),radial-gradient(circle at 94% 10%,rgba(179,76,255,.13),transparent 30%),radial-gradient(circle at 52% 72%,rgba(56,207,255,.035),transparent 36%),linear-gradient(180deg,#03050a 0%,#060811 48%,#03050a 100%)}}
`;
