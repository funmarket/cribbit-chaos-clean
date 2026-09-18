import { CANONICAL_CARD_INSTANCES } from '@cribbit/cards/server';
import type { CardColor, PhysicalCardInstance } from '@cribbit/cards/server';
import type {
  DrawCardCommandPayload,
  GameCommandPayload,
  GameViewCard,
  GameViewProjection,
  PlayCardCommandPayload
} from '@cribbit/contracts';

import type {
  CanonicalGameState,
  CanonicalPlayerState,
  CardInstanceId,
  PlayerId
} from './state.ts';
import type {
  EngineEffect,
  EngineTransitionDefinition
} from './kernel.ts';

const OPENING_HAND_SIZE = 7;
const DEFAULT_MODE_LABEL = 'Clean Web Slice';

const cardsById: ReadonlyMap<CardInstanceId, PhysicalCardInstance> = new Map(
  CANONICAL_CARD_INSTANCES.map((card) => [card.instanceId, card])
);

export function canonicalDeckInstanceIds(): readonly CardInstanceId[] {
  return CANONICAL_CARD_INSTANCES.map((card) => card.instanceId);
}

function displayName(player: CanonicalPlayerState): string {
  return player.displayName ?? player.playerId;
}

function avatarLabel(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || 'CR';
}

function cardToView(cardId: CardInstanceId): GameViewCard {
  const card = cardsById.get(cardId);
  if (!card) return { instanceId: cardId, family: 'unknown', label: cardId, copy: 1 };
  return {
    instanceId: card.instanceId,
    family: card.family,
    label: card.family === 'number' ? String(card.value) : card.family.replaceAll('_', ' ').toUpperCase(),
    copy: card.copy,
    ...(card.color === undefined ? {} : { color: card.color }),
    ...(card.value === undefined ? {} : { value: card.value })
  };
}

function requireTurn(state: CanonicalGameState): NonNullable<CanonicalGameState['turn']> | null {
  return state.turn ?? null;
}

function handFor(state: CanonicalGameState, playerId: PlayerId): readonly CardInstanceId[] {
  return state.zones.hands[playerId] ?? [];
}

function nextPlayerId(state: CanonicalGameState, currentPlayerId: PlayerId): PlayerId {
  const ordered = [...state.players].sort((a, b) => a.seat - b.seat);
  const index = ordered.findIndex((player) => player.playerId === currentPlayerId);
  if (index < 0 || ordered.length === 0) return currentPlayerId;
  const step = state.turn?.direction === 'counterclockwise' ? -1 : 1;
  return ordered[(index + step + ordered.length) % ordered.length].playerId;
}

function phaseOf(state: CanonicalGameState): 'waiting' | 'active' | 'resolved' {
  if (state.winnerBoundary.status === 'declared') return 'resolved';
  return state.lifecycle?.phase ?? (state.turn ? 'active' : 'waiting');
}

export function createWaitingGameState(input: {
  readonly sessionId: string;
  readonly hostPlayerId: PlayerId;
  readonly hostDisplayName: string;
}): CanonicalGameState {
  return {
    gameId: input.sessionId,
    revision: 0,
    players: [{ playerId: input.hostPlayerId, seat: 0, displayName: input.hostDisplayName }],
    zones: { drawPile: [], discardPile: [], hands: { [input.hostPlayerId]: [] } },
    rootFlow: null,
    continuations: [],
    persistentEffects: [],
    deadlines: [],
    winnerBoundary: { status: 'ready' },
    lifecycle: { phase: 'waiting', hostPlayerId: input.hostPlayerId },
    turn: null
  };
}

export function addWaitingPlayer(input: {
  readonly state: CanonicalGameState;
  readonly playerId: PlayerId;
  readonly displayName: string;
}): { readonly status: 'accepted'; readonly state: CanonicalGameState } | { readonly status: 'rejected'; readonly reason: string } {
  if (phaseOf(input.state) !== 'waiting') return { status: 'rejected', reason: 'SESSION_ALREADY_STARTED' };
  if (input.state.players.some((player) => player.playerId === input.playerId)) return { status: 'rejected', reason: 'PLAYER_ALREADY_JOINED' };
  const nextPlayers = [...input.state.players, { playerId: input.playerId, seat: input.state.players.length, displayName: input.displayName }];
  return {
    status: 'accepted',
    state: {
      ...input.state,
      revision: input.state.revision + 1,
      players: nextPlayers,
      zones: {
        ...input.state.zones,
        hands: { ...input.state.zones.hands, [input.playerId]: [] }
      }
    }
  };
}

export function startPlayableGame(input: {
  readonly state: CanonicalGameState;
  readonly shuffledDeck: readonly CardInstanceId[];
}): { readonly status: 'accepted'; readonly state: CanonicalGameState } | { readonly status: 'rejected'; readonly reason: string } {
  if (phaseOf(input.state) !== 'waiting') return { status: 'rejected', reason: 'SESSION_ALREADY_STARTED' };
  if (input.state.players.length < 2) return { status: 'rejected', reason: 'START_REQUIRES_TWO_PLAYERS' };
  if (new Set(input.shuffledDeck).size !== CANONICAL_CARD_INSTANCES.length) return { status: 'rejected', reason: 'INVALID_DECK_ORDER' };

  const hands: Record<PlayerId, CardInstanceId[]> = Object.fromEntries(input.state.players.map((player) => [player.playerId, []]));
  let cursor = 0;
  for (let round = 0; round < OPENING_HAND_SIZE; round += 1) {
    for (const player of input.state.players) {
      const cardId = input.shuffledDeck[cursor++];
      if (!cardId) return { status: 'rejected', reason: 'DECK_TOO_SMALL' };
      hands[player.playerId].push(cardId);
    }
  }

  const remaining = input.shuffledDeck.slice(cursor);
  const discardIndex = remaining.findIndex((cardId) => cardsById.get(cardId)?.family === 'number');
  if (discardIndex < 0) return { status: 'rejected', reason: 'OPENING_DISCARD_NUMBER_CARD_UNAVAILABLE' };
  const discardCard = remaining[discardIndex];
  const drawPile = remaining.filter((_, index) => index !== discardIndex);
  const card = cardsById.get(discardCard);

  return {
    status: 'accepted',
    state: {
      ...input.state,
      revision: input.state.revision + 1,
      zones: { drawPile, discardPile: [discardCard], hands },
      lifecycle: { phase: 'active', hostPlayerId: input.state.lifecycle?.hostPlayerId ?? input.state.players[0].playerId },
      turn: {
        currentPlayerId: input.state.players[0].playerId,
        direction: 'clockwise',
        activeColor: card?.color ?? null,
        round: 1
      },
      winnerBoundary: { status: 'ready' }
    }
  };
}

function withAdvancedTurn(state: CanonicalGameState, actorPlayerId: PlayerId): CanonicalGameState {
  const turn = requireTurn(state);
  if (!turn) return state;
  return {
    ...state,
    turn: { ...turn, currentPlayerId: nextPlayerId(state, actorPlayerId) }
  };
}

function isActorTurn(state: CanonicalGameState, actorPlayerId: PlayerId): boolean {
  return phaseOf(state) === 'active' && state.turn?.currentPlayerId === actorPlayerId && state.winnerBoundary.status !== 'declared';
}

export function isLegalOrdinaryCardPlay(state: CanonicalGameState, playerId: PlayerId, cardInstanceId: CardInstanceId): boolean {
  if (!isActorTurn(state, playerId)) return false;
  if (!handFor(state, playerId).includes(cardInstanceId)) return false;
  const card = cardsById.get(cardInstanceId);
  if (!card || card.family !== 'number') return false;
  const topDiscardId = state.zones.discardPile.at(-1);
  if (!topDiscardId) return false;
  const topDiscard = cardsById.get(topDiscardId);
  if (!topDiscard || topDiscard.family !== 'number') return false;
  return card.color === state.turn?.activeColor || card.value === topDiscard.value;
}

function drawCardDefinition(): EngineTransitionDefinition<DrawCardCommandPayload, { readonly actorPlayerId: PlayerId }, EngineEffect> {
  return {
    ruleRefs: ['RULE-ACQUISITION', 'RULE-TURN', 'RULE-CONTINUATION'],
    cardConservation: 'preserve',
    apply({ state, authoritativeInputs }) {
      const actorPlayerId = authoritativeInputs.actorPlayerId;
      if (!isActorTurn(state, actorPlayerId)) return { status: 'rejected', reason: 'NOT_CURRENT_TURN' };
      const [drawnCard, ...drawPile] = state.zones.drawPile;
      if (!drawnCard) return { status: 'rejected', reason: 'DRAW_PILE_EMPTY' };
      const hands = {
        ...state.zones.hands,
        [actorPlayerId]: [...handFor(state, actorPlayerId), drawnCard]
      };
      return {
        status: 'accepted',
        state: withAdvancedTurn({ ...state, zones: { ...state.zones, drawPile, hands } }, actorPlayerId),
        effects: [{ kind: 'CARD_DRAWN', playerId: actorPlayerId, cardInstanceId: drawnCard }]
      };
    }
  };
}

function playCardDefinition(): EngineTransitionDefinition<PlayCardCommandPayload, { readonly actorPlayerId: PlayerId }, EngineEffect> {
  return {
    ruleRefs: ['RULE-NUMBER', 'RULE-TURN', 'RULE-CONTINUATION'],
    cardConservation: 'preserve',
    apply({ state, command, authoritativeInputs }) {
      const actorPlayerId = authoritativeInputs.actorPlayerId;
      if (!isActorTurn(state, actorPlayerId)) return { status: 'rejected', reason: 'NOT_CURRENT_TURN' };
      if (!isLegalOrdinaryCardPlay(state, actorPlayerId, command.cardInstanceId)) return { status: 'rejected', reason: 'ILLEGAL_ORDINARY_PLAY' };
      const card = cardsById.get(command.cardInstanceId);
      if (!card || card.family !== 'number') return { status: 'rejected', reason: 'ONLY_NUMBER_CARDS_SUPPORTED' };
      const nextHand = handFor(state, actorPlayerId).filter((cardId) => cardId !== command.cardInstanceId);
      const nextBase: CanonicalGameState = {
        ...state,
        zones: {
          ...state.zones,
          hands: { ...state.zones.hands, [actorPlayerId]: nextHand },
          discardPile: [...state.zones.discardPile, command.cardInstanceId]
        },
        turn: state.turn ? { ...state.turn, activeColor: card.color as CardColor } : state.turn,
        winnerBoundary: nextHand.length === 0 ? { status: 'declared', winnerPlayerId: actorPlayerId } : state.winnerBoundary,
        lifecycle: nextHand.length === 0 ? { phase: 'resolved', hostPlayerId: state.lifecycle?.hostPlayerId ?? null } : state.lifecycle
      };
      return {
        status: 'accepted',
        state: nextHand.length === 0 ? nextBase : withAdvancedTurn(nextBase, actorPlayerId),
        effects: [{ kind: 'CARD_PLAYED', playerId: actorPlayerId, cardInstanceId: command.cardInstanceId }]
      };
    }
  };
}

function unsupportedDefinition(): EngineTransitionDefinition<GameCommandPayload, { readonly actorPlayerId: PlayerId }, EngineEffect> {
  return {
    ruleRefs: ['RULE-PROVENANCE'],
    cardConservation: 'preserve',
    apply() {
      return { status: 'rejected', reason: 'UNSUPPORTED_COMMAND_FOR_P7A_SLICE' };
    }
  };
}

export function resolvePlayableEngineCommand(input: {
  readonly actorPlayerId: PlayerId;
  readonly command: GameCommandPayload;
}): {
  readonly authoritativeInputs: { readonly actorPlayerId: PlayerId };
  readonly definition: EngineTransitionDefinition<GameCommandPayload, { readonly actorPlayerId: PlayerId }, EngineEffect>;
} {
  const authoritativeInputs = { actorPlayerId: input.actorPlayerId };
  if (input.command.kind === 'DRAW_CARD') return { authoritativeInputs, definition: drawCardDefinition() as EngineTransitionDefinition<GameCommandPayload, { readonly actorPlayerId: PlayerId }, EngineEffect> };
  if (input.command.kind === 'PLAY_CARD') return { authoritativeInputs, definition: playCardDefinition() as EngineTransitionDefinition<GameCommandPayload, { readonly actorPlayerId: PlayerId }, EngineEffect> };
  return { authoritativeInputs, definition: unsupportedDefinition() };
}

export function projectGameView(state: CanonicalGameState, playerId: PlayerId): GameViewProjection {
  const phase = phaseOf(state);
  const player = state.players.find((candidate) => candidate.playerId === playerId);
  if (!player) throw new Error(`Cannot project unknown player ${playerId}`);
  const turn = requireTurn(state);
  const currentTurnPlayer = turn ? state.players.find((candidate) => candidate.playerId === turn.currentPlayerId) : null;
  const winner = state.winnerBoundary.status === 'declared'
    ? state.players.find((candidate) => candidate.playerId === state.winnerBoundary.winnerPlayerId) ?? null
    : null;
  const playableCardIds = handFor(state, playerId).filter((cardId) => isLegalOrdinaryCardPlay(state, playerId, cardId));
  return {
    source: 'server',
    sessionId: state.gameId,
    roomName: `Cribbit Room ${state.gameId.slice(0, 6).toUpperCase()}`,
    modeLabel: DEFAULT_MODE_LABEL,
    round: turn?.round ?? 0,
    revision: state.revision,
    status: phase,
    connection: 'connected',
    players: [...state.players]
      .sort((a, b) => a.seat - b.seat)
      .map((entry) => ({
        playerId: entry.playerId,
        displayName: displayName(entry),
        avatarLabel: avatarLabel(displayName(entry)),
        cardCount: handFor(state, entry.playerId).length,
        seat: entry.seat,
        isCurrentTurn: turn?.currentPlayerId === entry.playerId,
        isCurrentPlayer: entry.playerId === playerId,
        isHost: state.lifecycle?.hostPlayerId === entry.playerId,
        connection: 'connected'
      })),
    currentPlayer: {
      playerId,
      hand: handFor(state, playerId).map(cardToView)
    },
    drawPileCount: state.zones.drawPile.length,
    discardCard: state.zones.discardPile.at(-1) ? cardToView(state.zones.discardPile.at(-1) as string) : null,
    activeColor: turn?.activeColor ?? null,
    direction: turn?.direction ?? 'clockwise',
    currentTurnPlayerId: turn?.currentPlayerId ?? null,
    activeEffect: null,
    turnLabel: phase === 'waiting'
      ? 'Waiting for players'
      : winner
        ? `${displayName(winner)} wins`
        : currentTurnPlayer
          ? `${displayName(currentTurnPlayer)} turn`
          : 'Turn pending',
    winner: winner ? { playerId: winner.playerId, displayName: displayName(winner) } : null,
    canStartGame: phase === 'waiting' && state.lifecycle?.hostPlayerId === playerId && state.players.length >= 2,
    availableActions: {
      canDraw: isActorTurn(state, playerId) && state.zones.drawPile.length > 0,
      playableCardIds
    }
  };
}
