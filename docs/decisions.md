# Decisions and remaining gates

## DECISION-GATES-002 — approved by explicit user correction

P0A SOURCE/RULE/ARCHITECTURE: PASSED. P0B VISUAL: ACTIVE / PARTIAL. P1 FOUNDATION: AUTHORIZED. Visual gaps do not block architecture work. P12/P13 stay blocked on corresponding visual approval; P15 final Telegram integration is blocked where actual Telegram evidence is needed. Gameplay implementation remains unauthorized.

## DECISION-PRESENTATION-001 — unchanged approved principle

Lime 1 artwork VERIFIED / AVAILABLE; both physical copies → assetKey number_lime_1 → approved number_lime_1_01.jpg. Empty legacy _02 is a LEGACY ASSET-MAPPING DEFECT. Physical deck 133 unchanged. New artwork required NO. Do not modify old source. See presentation-decision.md.

## Architecture implementation choices within P1

Use TypeScript 5.9.3 and Vite 7.3.6, versions already resolved in the preserved application; no old dependency upgrade. Root uses npm 10.9.2 and Node 24. Build-only tooling has no runtime gameplay role. Server and UI packages are explicit empty placeholders, not alternate runtime stubs. HTML shell changes are deliberately restricted during P1.

## Unresolved product rules

All unresolved clauses in gamerules.md remain open: Draw turn loss, Taboo timeout, Hijack final-card boundary, TAG nesting, group-Dare refusal/instigator participation, Chaos weights/short-hand/left behavior, Paranoia Spreads probabilities, Ghost penalty/old attack details, DIG ME refusal, Reverse Confession final response, Nope Truth-or-Chaos eligibility, extra Chaos catalogue and Pulse tuning. Other detailed role/deadline/reveal/voice decisions in command-domains.md remain proposals. No default has been encoded.

## DECISION-PLATFORM-002 — approved P1 hardening

Split shared PlatformAdapter types from concrete Web and Telegram modules. Each access surface imports its own adapter; shared client-app imports only shared types. No root platform barrel. Enforce resolved edges and independent production surface checks, including adversarial tests.

## DECISION-DEPENDENCIES-003 — approved P1 hardening

Cross-workspace source imports need a matching declared production dependency and policy permission. Manifest declarations in dependencies/devDependencies/peerDependencies/optionalDependencies must obey policy even when unused. Development-only declarations do not justify production imports. Keep client capability restrictions; future owner-module exceptions require their own negative tests, never global relaxation.

## DECISION-SERVER-BUILD-004 — before API implementation

The P1 API transpile builds only an empty placeholder. Replace it with a real server module/build dependency audit before implementing the API. Never cite the placeholder build as verification of a real backend.
