import type { CardFamily, CardPresentationIdentity } from './types.ts';

export const CARD_ASSET_ROOT = 'assets/CHAOS-133-V1' as const;
export const CARD_BACK_ASSET = `${CARD_ASSET_ROOT}/backs/card_back.jpg` as const;

const SPECIAL_ASSETS: Readonly<Record<Exclude<CardFamily, 'number'>, { folder: string; base: string; unnumbered?: boolean }>> = Object.freeze({
  skip: { folder: 'skip', base: 'skip' },
  reverse: { folder: 'reverse', base: 'reverse' },
  draw: { folder: 'draw', base: 'draw' },
  wild: { folder: 'wild', base: 'wild' },
  truth: { folder: 'truth', base: 'truth' },
  dare: { folder: 'dare', base: 'dare' },
  paranoia: { folder: 'paranoia', base: 'paranoia' },
  chaos: { folder: 'chaos', base: 'chaos' },
  duel: { folder: 'duel', base: 'duel' },
  nope: { folder: 'nope', base: 'nope' },
  tag: { folder: 'tag', base: 'tag' },
  truth_or_chaos: { folder: 'truth_or_chaos', base: 'truth_or_chaos' },
  hijack: { folder: 'hijack', base: 'hijack' },
  taboo: { folder: 'taboo', base: 'taboo' },
  machiavelli: { folder: 'machiavelli', base: 'machiavelli' },
  ghost: { folder: 'ghost', base: 'ghost' },
  reverse_confession: { folder: 'reverse_confession', base: 'fIYGR' },
  dig_me: { folder: 'Dig_Me', base: 'digme', unnumbered: true }
});

function copySuffix(copy: number): string | null {
  if (!Number.isInteger(copy) || copy < 1) return null;
  return String(copy).padStart(2, '0');
}

export function resolveCardFaceAsset(identity: CardPresentationIdentity): string | null {
  const suffix = copySuffix(identity.copy);
  if (!suffix) return null;

  if (identity.family === 'number') {
    if (identity.color === undefined || identity.value === undefined) return null;
    if (!Number.isInteger(identity.value) || identity.value < 0 || identity.value > 9) return null;
    const artworkCopy = identity.color === 'lime' && identity.value === 1 && identity.copy === 2 ? '01' : suffix;
    return `${CARD_ASSET_ROOT}/cards/numbers/${identity.color}/number_${identity.color}_${identity.value}_${artworkCopy}.jpg`;
  }

  const asset = SPECIAL_ASSETS[identity.family];
  return asset.unnumbered
    ? `${CARD_ASSET_ROOT}/cards/${asset.folder}/${asset.base}.jpg`
    : `${CARD_ASSET_ROOT}/cards/${asset.folder}/${asset.base}_${suffix}.jpg`;
}

export type { CardPresentationIdentity } from './types.ts';
