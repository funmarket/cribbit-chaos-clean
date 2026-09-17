export type ProjectionStatus = 'waiting' | 'active' | 'resolved';
export type ProjectionConnection = 'connected' | 'reconnecting' | 'offline';
export type ProjectionDirection = 'clockwise' | 'counterclockwise';
export type ProjectionCardColor = 'lime' | 'orange' | 'cyan' | 'purple' | null;

export interface GameViewCard {
  readonly instanceId: string;
  readonly family: string;
  readonly label: string;
  readonly copy: number;
  readonly color?: Exclude<ProjectionCardColor, null>;
  readonly value?: number;
}

export interface GameViewPlayer {
  readonly playerId: string;
  readonly displayName: string;
  readonly avatarLabel: string;
  readonly cardCount: number;
  readonly isCurrentTurn: boolean;
  readonly isCurrentPlayer: boolean;
  readonly connection: ProjectionConnection;
}

export interface GameViewProjection {
  readonly source: 'fixture-preview' | 'server';
  readonly sessionId: string;
  readonly roomName: string;
  readonly modeLabel: string;
  readonly round: number;
  readonly status: ProjectionStatus;
  readonly connection: ProjectionConnection;
  readonly players: readonly GameViewPlayer[];
  readonly currentPlayer: {
    readonly playerId: string;
    readonly hand: readonly GameViewCard[];
  };
  readonly drawPileCount: number;
  readonly discardCard: GameViewCard;
  readonly activeColor: ProjectionCardColor;
  readonly direction: ProjectionDirection;
  readonly activeEffect: string | null;
  readonly turnLabel: string;
  readonly winner: { readonly playerId: string; readonly displayName: string } | null;
}
