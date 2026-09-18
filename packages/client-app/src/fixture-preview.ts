import type { GameViewProjection, ProjectionStatus } from '../../contracts/src/view.ts';

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  }
  return value;
}

export function createFixturePreview(status: ProjectionStatus = 'active'): Readonly<{ projection: GameViewProjection }> {
  const resolved = status === 'resolved';
  const projection: GameViewProjection = {
    source: 'fixture-preview',
    sessionId: 'CRB-7A1',
    roomName: 'Night Squad',
    modeLabel: 'Party',
    round: 1,
    revision: 0,
    status,
    connection: 'connected',
    players: [
      { playerId:'you', displayName:'You', avatarLabel:'YO', cardCount:7, seat:0, isCurrentTurn:!resolved, isCurrentPlayer:true, isHost:true, connection:'connected' },
      { playerId:'maya', displayName:'Maya', avatarLabel:'MA', cardCount:4, seat:1, isCurrentTurn:false, isCurrentPlayer:false, isHost:false, connection:'connected' },
      { playerId:'rami', displayName:'Rami', avatarLabel:'RA', cardCount:6, seat:2, isCurrentTurn:false, isCurrentPlayer:false, isHost:false, connection:'connected' },
      { playerId:'lina', displayName:'Lina', avatarLabel:'LI', cardCount:2, seat:3, isCurrentTurn:false, isCurrentPlayer:false, isHost:false, connection:'reconnecting' }
    ],
    currentPlayer: {
      playerId:'you',
      hand:[
        { instanceId:'c-lime-7', family:'number', label:'7', copy:1, color:'lime', value:7 },
        { instanceId:'c-orange-2', family:'number', label:'2', copy:1, color:'orange', value:2 },
        { instanceId:'c-reverse', family:'reverse', label:'Reverse', copy:1 },
        { instanceId:'c-truth', family:'truth', label:'Truth', copy:1 },
        { instanceId:'c-nope', family:'nope', label:'Nope', copy:1 },
        { instanceId:'c-purple-9', family:'number', label:'9', copy:1, color:'purple', value:9 },
        { instanceId:'c-tag', family:'tag', label:'TAG', copy:1 }
      ]
    },
    drawPileCount: 79,
    discardCard: { instanceId:'discard-cyan-7', family:'number', label:'7', copy:2, color:'cyan', value:7 },
    activeColor:'cyan',
    direction:'clockwise',
    currentTurnPlayerId: resolved ? null : 'you',
    activeEffect:null,
    turnLabel: resolved ? 'Round resolved' : 'Your turn',
    winner: resolved ? { playerId:'maya', displayName:'Maya' } : null,
    canStartGame: false,
    availableActions: { canDraw: !resolved, playableCardIds: ['c-lime-7'] }
  };
  return deepFreeze({ projection });
}
