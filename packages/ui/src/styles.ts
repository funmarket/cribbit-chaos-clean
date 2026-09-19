// What this does: composes the copied old Cribbit Web/Telegram UI CSS as the clean app style source.
// Key invariant: styles come from old UI source modules; gameplay authority remains outside CSS and outside UI.
// Explicitly out of scope: new theme invention, API URL wiring, game rules, simulation, or client legality authority.
import {
  OLD_APPS_TELEGRAM_SRC_STYLES_CARDS_CSS,
  OLD_APPS_TELEGRAM_SRC_STYLES_CONTEXTUAL_CSS,
  OLD_APPS_TELEGRAM_SRC_STYLES_GAME_CSS,
  OLD_APPS_TELEGRAM_SRC_STYLES_HARDENING_CSS,
  OLD_APPS_TELEGRAM_SRC_STYLES_TELEGRAM_CSS,
  OLD_APPS_WEB_SRC_CANONICAL_BOARD_CARDS_CSS,
  OLD_APPS_WEB_SRC_CANONICAL_HERO_CARDS_CSS,
  OLD_APPS_WEB_SRC_WEB_COMPACT_CSS,
  OLD_APPS_WEB_SRC_WEB_GAME_CSS,
  OLD_PACKAGES_UI_SRC_COMPACT_CARDS_CSS,
  OLD_PACKAGES_UI_SRC_DRAW_PILE_CARD_BACK_CSS,
  OLD_PACKAGES_UI_SRC_STYLES_CSS,
} from './old-ui-source/source-text.ts';

const CLEAN_BINDING_ADAPTER_CSS = String.raw`
/* Clean-app binding adapters: these map server projections into old UI slots without importing old runtime authority. */
.cribbit-clean-error{margin:12px auto 0;max-width:min(100%,var(--shell,960px));padding:10px 12px;border:1px solid rgba(255,68,95,.45);border-radius:12px;background:rgba(255,68,95,.09);color:#ffdce3;font-weight:800}
.cribbit-clean-session-code{user-select:all;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.08em;text-transform:uppercase}
.cribbit-clean-binding-note{color:var(--muted,#a7afbd);font-size:11px;line-height:1.35}
.cribbit-clean-hidden-submit{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.cribbit-clean-lobby-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.cribbit-clean-lobby-actions .button:disabled,.cribbit-clean-lobby-actions .tg-button:disabled{opacity:.5;cursor:not-allowed}
.cribbit-clean-web-table .desktop-gameboard,.cribbit-clean-web-table .desktop-play-grid,.cribbit-clean-web-table .game-layout{min-width:0}
.cribbit-clean-web-table .game-card__art,.cribbit-clean-telegram-table .game-card__art{display:block;width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none}
.cribbit-clean-web-table .game-card--tg-hand,.cribbit-clean-web-table .game-card--tg-board{border-radius:inherit}
.cribbit-clean-web-table .tg-safety-bar,.cribbit-clean-telegram-table .tg-safety-bar{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.cribbit-clean-web-table .tg-safety-bar button,.cribbit-clean-telegram-table .tg-safety-bar button{appearance:none;-webkit-appearance:none}
.cribbit-clean-telegram-table{width:min(100%,430px);margin:0 auto}
body:has(.cribbit-clean-web-home),body:has(.cribbit-clean-web-table){background:#05060a}
body:has(.cribbit-clean-telegram-home),body:has(.cribbit-clean-telegram-table){background:#03050a}
`;

export const GAME_TABLE_STYLES = [
  OLD_PACKAGES_UI_SRC_STYLES_CSS,
  OLD_PACKAGES_UI_SRC_COMPACT_CARDS_CSS,
  OLD_PACKAGES_UI_SRC_DRAW_PILE_CARD_BACK_CSS,
  OLD_APPS_WEB_SRC_WEB_GAME_CSS,
  OLD_APPS_WEB_SRC_WEB_COMPACT_CSS,
  OLD_APPS_WEB_SRC_CANONICAL_HERO_CARDS_CSS,
  OLD_APPS_WEB_SRC_CANONICAL_BOARD_CARDS_CSS,
  OLD_APPS_TELEGRAM_SRC_STYLES_TELEGRAM_CSS,
  OLD_APPS_TELEGRAM_SRC_STYLES_GAME_CSS,
  OLD_APPS_TELEGRAM_SRC_STYLES_CARDS_CSS,
  OLD_APPS_TELEGRAM_SRC_STYLES_CONTEXTUAL_CSS,
  OLD_APPS_TELEGRAM_SRC_STYLES_HARDENING_CSS,
  CLEAN_BINDING_ADAPTER_CSS,
].join('\n\n');
