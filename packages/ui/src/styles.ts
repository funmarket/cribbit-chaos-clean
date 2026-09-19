// What this does: composes the old Cribbit UI extraction styles into one injectable stylesheet.
// Key invariant: style modules are presentation-only and contain no game authority.
// Explicitly out of scope: Hermes landing-page theme residue or duplicate CSS stacks.
import { OLD_UI_BASE_STYLES } from './old-ui/base-styles.ts';
import { OLD_UI_SETUP_STYLES } from './old-ui/setup-styles.ts';
import { OLD_UI_GAME_STYLES } from './old-ui/game-styles.ts';

export const GAME_TABLE_STYLES = [
  OLD_UI_BASE_STYLES,
  OLD_UI_SETUP_STYLES,
  OLD_UI_GAME_STYLES,
].join('\n');
