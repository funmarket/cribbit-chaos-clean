export type CardColor = 'lime' | 'orange' | 'cyan' | 'purple';

export type CardFamily =
  | 'number'
  | 'skip'
  | 'reverse'
  | 'draw'
  | 'wild'
  | 'truth'
  | 'dare'
  | 'paranoia'
  | 'chaos'
  | 'duel'
  | 'nope'
  | 'tag'
  | 'truth_or_chaos'
  | 'hijack'
  | 'taboo'
  | 'machiavelli'
  | 'ghost'
  | 'reverse_confession'
  | 'dig_me';

export interface CardDefinition {
  readonly id: string;
  readonly family: CardFamily;
  readonly name: string;
  readonly copies: number;
  readonly color?: CardColor;
  readonly value?: number;
}

export interface PhysicalCardInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly family: CardFamily;
  readonly copy: number;
  readonly color?: CardColor;
  readonly value?: number;
}

export interface CardPresentationIdentity {
  readonly family: CardFamily;
  readonly copy: number;
  readonly color?: CardColor;
  readonly value?: number;
}
