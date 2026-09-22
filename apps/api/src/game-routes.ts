export const GAME_ROUTE_PATHS = {
  createSession: '/api/sessions',
  createSimulation: '/api/simulations',
  joinSession: '/api/sessions/:sessionId/join',
  projection: '/api/sessions/:sessionId/projection',
  startSession: '/api/sessions/:sessionId/start',
  commands: '/api/sessions/:sessionId/commands'
} as const;

export type GameRouteName = keyof typeof GAME_ROUTE_PATHS;

export function describeGameRoutes(): readonly { readonly name: GameRouteName; readonly path: string }[] {
  return Object.entries(GAME_ROUTE_PATHS).map(([name, path]) => ({
    name: name as GameRouteName,
    path
  }));
}
