# Cribbit CHAOS — clean rebuild

Same Cribbit table. Server owns the game.

`gamerules.md` is rule authority. The old app is UI/UX reference only.

## Play the core loop locally

Requires Node 24+ and npm 10.9.2.

```sh
npm ci
npm run dev
```

- API (in-memory, no Postgres): http://127.0.0.1:3000
- Web table: http://127.0.0.1:5173

1. Create a session in one tab.
2. Join with the session id in a second tab.
3. Host starts the game.
4. Draw and play mutate server state. The other tab polls the projection.

Postgres remains optional. Set `DATABASE_URL` only when you want the durable path.

```sh
npm run verify
```

## What this slice is

- CHAOS-133-V1 deck (133 physical cards)
- 7-card deal
- Server commands: `CREATE_SESSION`, `JOIN_SESSION`, `START_GAME`, `DRAW_CARD`, `PLAY_CARD`
- Number / Skip / Reverse / Draw / Wild table cards
- Forced-on-draw social families leave the hand and become `ACTIVE_EFFECT_PENDING`
- UI renders `GameView` only

## What this slice is not

- Full social-card resolution
- New product UX
- Client-owned rules
- Extra infra required to play the loop
