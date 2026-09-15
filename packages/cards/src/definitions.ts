import type { CardColor, CardDefinition, CardFamily } from './types.ts';

export const DECK_SPEC_ID = 'CHAOS-133-V1' as const;
export const CANONICAL_DECK_SIZE = 133 as const;
export const CARD_COLORS = ['lime', 'orange', 'cyan', 'purple'] as const satisfies readonly CardColor[];

export const CANONICAL_FAMILY_COUNTS: Readonly<Record<CardFamily, number>> = Object.freeze({
  number: 76,
  skip: 6,
  reverse: 6,
  draw: 6,
  wild: 3,
  truth: 3,
  dare: 3,
  paranoia: 3,
  chaos: 3,
  duel: 3,
  nope: 3,
  tag: 3,
  truth_or_chaos: 3,
  hijack: 3,
  taboo: 3,
  machiavelli: 1,
  ghost: 1,
  reverse_confession: 3,
  dig_me: 1
});

const numberDefinitions: CardDefinition[] = CARD_COLORS.flatMap((color) =>
  Array.from({ length: 10 }, (_, value) => Object.freeze({
    id: `number_${color}_${value}`,
    family: 'number' as const,
    name: `${color.toUpperCase()} ${value}`,
    copies: value === 0 ? 1 : 2,
    color,
    value
  }))
);

const specialDefinitions: CardDefinition[] = [
  ['skip', 'SKIP'],
  ['reverse', 'REVERSE'],
  ['draw', 'DRAW'],
  ['wild', 'WILD'],
  ['truth', 'TRUTH'],
  ['dare', 'DARE'],
  ['paranoia', 'PARANOIA'],
  ['chaos', 'CHAOS'],
  ['duel', 'DUEL'],
  ['nope', 'NOPE'],
  ['tag', 'TAG'],
  ['truth_or_chaos', 'TRUTH OR CHAOS'],
  ['hijack', 'HIJACK'],
  ['taboo', 'TABOO'],
  ['machiavelli', 'MACHIAVELLI'],
  ['ghost', 'GHOST'],
  ['reverse_confession', 'REVERSE CONFESSION'],
  ['dig_me', 'DIG ME']
].map(([family, name]) => Object.freeze({
  id: family,
  family: family as CardFamily,
  name,
  copies: CANONICAL_FAMILY_COUNTS[family as CardFamily]
}));

export const CARD_DEFINITIONS: readonly CardDefinition[] = Object.freeze([
  ...numberDefinitions,
  ...specialDefinitions
]);

export const CARD_DEFINITIONS_BY_ID: ReadonlyMap<string, CardDefinition> = new Map(
  CARD_DEFINITIONS.map((definition) => [definition.id, definition])
);
