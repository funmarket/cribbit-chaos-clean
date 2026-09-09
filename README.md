# Cribbit CHAOS — clean foundation

P0A is PASSED. P0B visual preservation is ACTIVE / PARTIAL. P1 repository foundation and architecture guards are AUTHORIZED. This repository is a foundation skeleton, not a playable game. No auth, API gameplay mutations, engine rules or game UI are implemented.

Web and Telegram are access surfaces into one future authoritative backend/database. Both thin TypeScript entries invoke one shared composition. HTML is an inert shell. The client owns no deck construction, prompt selection, turn resolution or game state authority.

Use Node 24 (at least 24.7.0) and npm 10.9.2:

```sh
npm ci
npm run verify
```

`verify` runs typechecking, source/entry/export/manifest/platform guards, adversarial guard tests and builds of both frontends and the empty API boundary. Production bundles are written to `dist`; resolved source and emitted module reports are written to `artifacts`. CI uploads those graph reports. No deployment is configured. Cloudflare/Railway/PostgreSQL remain the intended future infrastructure.

Read [structure.md](structure.md), [requirements.md](requirements.md), [gamerules.md](gamerules.md), [decisions](docs/decisions.md) and [testing](docs/testing.md). Rule IDs preserve the supplied source. This README does not define gameplay.

Canonical starting inventory: CHAOS-133-V1, **133 physical cards, 19 families**. No deck constructor or card UI is implemented in P1. Physical-copy identity is distinct from artwork identity. Both Lime 1 copies use approved `number_lime_1_01.jpg` through `number_lime_1`; no new artwork is needed.

Old source remains read-only at `funmarket/cribbit-chaos` commit `77c455901516205633eb15e96f51a84206eb8174`. No old runtimes, board CSS, cards or UI have been copied here. P12/P13 remain gated on corresponding P0B visual approval; P15 final Telegram integration remains gated where real WebView evidence is required.

P1 local hardening is complete: separate platform /types, /web and /telegram exports, declared workspace dependency enforcement and 55 passing architecture tests. Foundation scope is frozen pending later scoped authorization. Remote GitHub publication/hosted CI remains outstanding. Before API implementation, replace the placeholder transpile build with a real server module/build dependency audit; never treat this placeholder as a verified backend.
