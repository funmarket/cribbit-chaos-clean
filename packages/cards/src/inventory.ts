import { CANONICAL_DECK_SIZE, CARD_DEFINITIONS } from './definitions.ts';
import type { CardDefinition, PhysicalCardInstance } from './types.ts';

function instancesFor(definition: CardDefinition): PhysicalCardInstance[] {
  return Array.from({ length: definition.copies }, (_, index) => {
    const copy = index + 1;
    const suffix = String(copy).padStart(2, '0');
    return Object.freeze({
      instanceId: definition.copies === 1 ? definition.id : `${definition.id}_${suffix}`,
      definitionId: definition.id,
      family: definition.family,
      copy,
      ...(definition.color === undefined ? {} : { color: definition.color }),
      ...(definition.value === undefined ? {} : { value: definition.value })
    });
  });
}

export const CANONICAL_CARD_INSTANCES: readonly PhysicalCardInstance[] = Object.freeze(
  CARD_DEFINITIONS.flatMap(instancesFor)
);

if (CANONICAL_CARD_INSTANCES.length !== CANONICAL_DECK_SIZE) {
  throw new Error(
    `Invalid canonical inventory: expected ${CANONICAL_DECK_SIZE} instances, got ${CANONICAL_CARD_INSTANCES.length}`
  );
}
