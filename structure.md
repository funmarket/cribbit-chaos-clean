# Structure and authority

## Phase gates

P0A PASSED: immutable source, rule provenance/IDs, command domains, concurrent participant model, canonical inventory, approved Lime 1 mapping and architecture ownership. P0B ACTIVE / PARTIAL: visual references and approval. P1 AUTHORIZED: foundation only. Missing visual evidence does not block P1.

P12 Roulette UI extraction is blocked on its visual gate. P13 board/card/UI migration is blocked on corresponding P0B visual approval. P15 final Telegram visual integration is blocked where real Telegram evidence is required. No engine rules or API gameplay mutations may be implemented under P1.

## Production roots

`apps/web/index.html` → `apps/web/src/main.ts` → `@cribbit/client-app` bootstrap with Web adapter.

`apps/telegram/index.html` → `apps/telegram/src/main.ts` → the same bootstrap with Telegram adapter.

Exactly one entry per access surface, zero frontend gameplay authorities. Shared bootstrap only marks/disposes its mount; it creates no sessions. Repeated mounting of the same root fails. Platform adapters currently identify surface only: SDK/auth/back/theme integrations are not claimed.

`apps/api/src/main.ts` is empty. Future API service will own authentication, membership, command receipt/revision, engine invocation, transaction and authorized publication. Pure engine will own game rules; neither API handlers nor UI implement duplicate rules. One active root flow can accept concurrent authorized participant actions; FIFO forced consequences do not impose a voter order.

## Package boundaries

| Package | Public surface | Allowed internal dependencies | Forbidden responsibility |
|---|---|---|---|
| contracts | root, empty P1 placeholder | none | I/O, engine implementation or duplicate schemas |
| cards | presentation and server subpaths, empty P1 placeholders | contracts | Client-executable deck constructor |
| prompts | server subpath, empty | contracts | Client prompt selection; DB I/O in pure policy |
| game-engine | root, empty | contracts, cards, prompts | DOM, SDK, DB/socket I/O |
| api-client | root, empty | contracts | Gameplay transitions |
| platform | /types, /web, /telegram; no root export | contracts | Cross-surface concrete adapters; game rules, API mutation authority |
| ui | root, empty | contracts, cards/presentation | DB, engine, prompt selection |
| client-app | bootstrap | contracts, api-client, ui, platform/types (type-only) | Authoritative state reducer or fallback game |

`tools/architecture/policy.mjs` encodes package edges. `check.mjs` resolves TypeScript imports, re-exports, aliases and literal dynamic imports; unresolved/computed loading fails. Server source is empty by an explicit P1 scope guard. Client card-server imports are forbidden even though cards/presentation is allowed. Type-only server edges are also rejected to avoid growing accidental coupling.

HTML uses an exact positive P1 shell grammar (whitespace normalized), not a blacklist of suspicious strings. Any new shell element/script/handler requires reviewed guard changes. The source graph scans orphan source files too; Vite's actual resolved build graph and emitted chunk metadata are inspected independently, including tree-shaken imports. Exactly one emitted entry is required per frontend.

P1 capability restrictions reject dynamic script/worker execution, direct fetch and storage in client code. Future API-client transport capabilities must be introduced deliberately in their owner package with negative tests. Do not disable guard rules globally when later work needs a narrowly scoped capability.

Static guards enforce module/capability boundaries and known mutation patterns. They cannot prove that arbitrary renamed arithmetic is not game logic. Required review and future backend/API/runtime tests remain necessary. CI workflow must become a required branch check when a GitHub repository is available; a workflow file alone does not establish branch protection.

## Final P1 hardening

PlatformAdapter lives in packages/platform/src/types.ts. Only type/interface declarations are allowed there. Concrete adapters live separately in web.ts and telegram.ts. Explicit package exports and TypeScript aliases are @cribbit/platform/types, /web and /telegram; there is no platform root export. Web may reach only its Web adapter and shared types; Telegram may reach only its Telegram adapter and shared types. Shared client-app may import only the PlatformAdapter type, never either constructor. These constraints apply to relative imports, re-exports, dynamic imports and type-only dependencies, including import-type expressions. Real production bundle checks independently reject the other surface's adapter.

Every cross-workspace source edge must resolve, name a declared production dependency and satisfy the architecture policy. dependencies, peerDependencies or optionalDependencies can satisfy a production edge; devDependencies alone cannot, even for a type-only source import. All four manifest dependency sections are checked for forbidden internal declarations, including unused declarations. Unknown @cribbit workspace names are rejected. Allowed but currently unused dependencies are not required to manufacture source imports. Source reports record the resolved edge, declaring section and policy result.

Do not globally relax capability restrictions. Future API transport, browser events and Telegram SDK integrations require narrowly designated owner modules and adversarial tests proving the exception cannot escape those modules. No capability exception is added by P1 hardening.

Before any real API implementation begins, replace the API placeholder transpile build with a real server module/build dependency audit. That audit must inspect resolved server imports and production output/dependencies, enforce server ownership boundaries and have negative tests for violations. The current isolated transpile is evidence only that an empty placeholder builds; it must never be reused as evidence for an implemented backend.
