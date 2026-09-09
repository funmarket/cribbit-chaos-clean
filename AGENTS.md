# Cribbit CHAOS foundation boundaries

P0A PASSED. P0B ACTIVE / PARTIAL. P1 foundation and architecture guards only are authorized. Do not implement gameplay, API game mutations, board/cards/Roulette UI or final Telegram integration without subsequent authorization.

Read gamerules.md, structure.md, requirements.md, docs/decisions.md and docs/testing.md. Preserve rule IDs and unresolved decisions. Starting deck: 133 physical cards, 19 families. Both Lime 1 physical copies share approved number_lime_1 artwork.

No frontend game engine, deck constructor, prompt authority, runtimeMode or local fallback. Old source is read-only reference at 77c455901516205633eb15e96f51a84206eb8174. Never import old runtime code. Temporary audit, FIX, recovery and handoff files belong outside this repository.

Run npm run verify before reporting foundation changes verified. CI guard modifications require adversarial regression tests. No deployment is authorized by P1.

Concrete platform adapters are separate: Web imports /web, Telegram imports /telegram, shared client-app imports /types with type-only syntax. Every workspace import requires a declared production dependency and a policy-allowed edge. Forbidden internal declarations fail even when unused. Never globally relax client capability checks; owner-module exceptions require adversarial tests. Before real API work, replace the placeholder transpile with a real server module/build dependency audit. P1 hardening does not authorize gameplay or UI migration.
