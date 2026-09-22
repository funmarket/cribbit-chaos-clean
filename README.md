# Cribbit CHAOS CLEAN

Cribbit CHAOS CLEAN is the clean rebuild of the existing Cribbit CHAOS product.

> **Same game, same verified product experience, cleaner authority and wiring underneath.**

This is not a new game and not a board-only rewrite.

## Whole-product scope

Cribbit includes, where retained/verified:

- the CHAOS-133-V1 shedding-card game;
- Web and Telegram over the same backend/domains;
- canonical accounts, profiles, rooms and persistent group context;
- Tonight's CHAOS;
- CHAOS Board;
- My Saved Deck, House Deck and Live Room Pool;
- player-created prompts, authorship, moderation and flags;
- explicit Call Mode answer flows;
- safety/consent controls;
- Recap, Save That, Resolved Moments and group history/memory;
- a Control Room for safe administration/operations/change proposals;
- Local QA Simulation/Rules Lab over the same canonical engine.

Read first:

- `HANDOFF.md` - live execution roadmap/status/evidence;
- `AGENTS.md` - mandatory engineering execution contract;
- `docs/product-scope.md` - whole-product scope/source hierarchy/preservation/change authority;
- `docs/control-room.md` - Admin/Control Room architecture;
- `gamerules.md` - canonical gameplay-rule authority.

## Architecture

```text
Web ------------------\
                       -> packages/api-client -> Railway Node API -> shared domains/game-engine -> PostgreSQL
Telegram -------------/
                                  ^
                                  |
                         Control Room / Admin
                     (same domains + audited APIs)
```

There is one canonical account/room/content/game/history authority. Web, Telegram and Admin are presentation/operations adapters, not separate products or engines.

## Local verification

Required baseline:

- Node 24.x
- npm 10.9.2

```sh
npm ci
npm run verify
```

Use `npm run dev` for the current local development surface.

Local QA Simulation is a testing surface only. It must not become a second game engine or persistence model.

## Change-authority rule

A product concept has one authoritative owner. Frontends/Admin consume or orchestrate that authority; they do not duplicate it.

Significant changes must declare impact and follow the Product Authority / Change Intent guards in the roadmap.

Do not delete donor behavior/data/schema/deployment evidence merely because CLEAN does not yet use it. First map it to its CLEAN replacement or explicitly classify it obsolete.
