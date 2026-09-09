# Architecture verification and future acceptance

Run npm run verify. Adversarial tests create disposable copies of the skeleton, introduce one violation and assert its specific guard error. Coverage includes extra scripts/HTML handlers/entries, duplicate bootstrap, direct/transitive/type-only/relative imports, server subpaths, re-exports, dynamic loading, alias deception, deep imports, frontend deck/prompt mutation, fallback/mode flags, canonical state assignment, document capture controllers, workers, script injection, eval, storage restoration, orphan simulators and premature server rule code. Independent bundle tests reject hidden server modules, external runtimes and unknown virtual modules. A valid skeleton and shared presentation metadata must pass.

Production build checks inspect Vite module IDs and actual emitted chunks, not an independently imagined graph. Exactly one entry chunk is required. Source graph also includes modules eliminated by tree shaking. The guard currently allows only Vite's internal virtual module namespace; adding bundler plugins/capabilities requires reviewed policy and adversarial cases.

Truth labels: TYPECHECK VERIFIED, ARCHITECTURE VERIFIED and BUILD VERIFIED are separate from RUNTIME VERIFIED/VISUALLY VERIFIED. P1 does not verify live user auth, Telegram HMAC, webhook delivery, game transitions, backend state, media permissions or visual parity. Empty server packages are not a working backend.

Later phases require canonical-rule transition tests; real PostgreSQL atomicity/revision/receipt/outbox tests; identity linking and Telegram initData validation; privacy projections; deadlines/bot races; no-reroll Roulette reconnect; voice review/typed fallback; mixed Web+real Telegram games; and actual production-entry journeys. P0B must supply matching approved visuals before respective UI extraction. All 19 families require complete rule/permission/persistence/reconnect/timeout/bot/UI evidence, not merely registry entries.

No static guard proves arbitrary malicious code cannot implement renamed rules. Keep review mandatory and extend adversarial cases when capabilities change. Hosted CI/required checks must be verified once repository hosting is established; local success is not a GitHub Actions result.

## P1 hardening coverage

The suite now has 55 passing cases (including positive controls). Added cases cover both forbidden surface directions, both shared-client concrete adapter imports, relative/dynamic/type-only/transitive crossings, runtime import or implementation in the types module, missing declarations, relative and type-only missing dependencies, development-only declarations, forbidden unused declarations in all four dependency sections and unknown internal dependency names. Independent bundle tests reject the opposite adapter on each surface. Positive controls verify declared permitted imports and explicit shared type imports from both access surfaces.

Production Web modules are its HTML and main.ts, shared client-app/src/index.ts, platform/src/web.ts and Vite's module-preload support. Telegram has its own HTML/main.ts, that same client-app module, platform/src/telegram.ts and the same Vite support. types.ts is erased at runtime but remains in the audited source graph. Each output has one entry chunk, no external imports and no dynamic chunk imports.

Before real API implementation, replace the placeholder transpile with a server module/build dependency audit and adversarial server-boundary tests. Current API build success is placeholder evidence only. Future API transport/browser event/Telegram SDK capabilities must be restricted to individually designated owner modules and tested against leakage; do not globally weaken guards.
