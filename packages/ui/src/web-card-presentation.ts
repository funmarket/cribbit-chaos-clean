import type { GameViewCard } from '../../contracts/src/view.ts';
import { resolveCardFaceAsset } from '../../cards/src/presentation.ts';
import type { CardPresentationIdentity } from '../../cards/src/types.ts';

const SPECIAL_FAMILIES = new Set<CardPresentationIdentity['family']>([
  'skip',
  'reverse',
  'draw',
  'wild',
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
]);

const HERO_CARDS = [
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

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char] ?? char);
}

function presentationIdentity(card: GameViewCard): CardPresentationIdentity | null {
  const family = card.family as CardPresentationIdentity['family'];
  if (family !== 'number' && !SPECIAL_FAMILIES.has(family)) return null;

  return {
    family,
    copy: card.copy,
    ...(card.color ? { color: card.color } : {}),
    ...(card.value === undefined ? {} : { value: card.value }),
  };
}

export function resolveWebCardFaceAsset(card: GameViewCard): string | null {
  const identity = presentationIdentity(card);
  return identity ? resolveCardFaceAsset(identity) : null;
}

export function renderWebProjectionCard(
  card: GameViewCard,
  interactive: boolean,
  legal: boolean,
): string {
  const asset = resolveWebCardFaceAsset(card);
  const element = interactive ? 'button' : 'div';
  const action = interactive ? ' data-action="play-card"' : '';
  const disabled = interactive && !legal ? ' disabled' : '';
  const face = asset
    ? `<img class="cc-canonical-card-face" src="/${escapeHtml(asset)}" alt="${escapeHtml(card.label)} card" draggable="false">`
    : '';

  return `<${element} class="game-card${asset ? ' cc-has-canonical-face' : ''}" data-card-id="${escapeHtml(card.instanceId)}" data-family="${escapeHtml(card.family)}" data-legal="${String(legal)}"${action}${disabled}>
    ${face}
    <strong class="game-card__title">${escapeHtml(card.label)}</strong>
  </${element}>`;
}

export function canonicalHeroCardMarkup(): string {
  return HERO_CARDS.map(
    card => `
      <figure class="cc-web-hero-card ${card.className}" aria-label="${card.label} card">
        <img class="cc-web-hero-card__image" src="${card.src}" alt="${card.label} card artwork" draggable="false">
      </figure>
    `,
  ).join('');
}
