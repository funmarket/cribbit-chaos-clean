# Foundation requirements

| ID | Requirement | P1 evidence |
|---|---|---|
| ARCH-ENTRY-001 | One HTML shell/main.ts per frontend and one shared composition | HTML/entry checks and real Vite builds |
| ARCH-AUTHORITY-001 | Zero client gameplay authorities; future sole server engine/service | Forbidden graph edges, symbol/capability tests; server placeholders only |
| ARCH-DOMAIN-001 | One command union, separated family handlers | docs/command-domains.md; no command schemas/handlers implemented yet |
| ARCH-FLOW-001 | One root flow, independently authorized participant actions | Domain specification; no runtime model yet |
| ARCH-IMPORT-001 | Enforce direct/transitive/barrel/alias/dynamic import boundaries | TypeScript resolution and Vite module graph checks |
| ARCH-PLATFORM-001 | Separate concrete platform exports; shared client imports types only | Direct, relative, dynamic, type-only, transitive and bundle rejection tests |
| ARCH-MANIFEST-001 | Every cross-workspace import is resolved, declared and policy-allowed; forbid disallowed manifest edges | Missing/development-only declarations and all four forbidden dependency sections tested |
| ARCH-SERVER-BUILD-001 | Replace placeholder transpile with server module/build audit before API implementation | Mandatory next-phase gate; no implemented backend verification claimed |
| ARCH-CAPABILITY-001 | Future capability exceptions belong only to designated owner modules with adversarial tests | Existing global client restrictions retained; no new exceptions |
| ARCH-FALLBACK-001 | No local/offline/fallback production runtime or runtimeMode | Source graph, capability and adversarial checks |
| ARCH-GATE-001 | P0A passed/P0B partial does not prevent P1 | Explicit phase status in README/structure/decisions |
| RULE-PROVENANCE-001 | Locked implementation/tests must cite permanent source clauses | gamerules.md and docs/rule-provenance.json; no gameplay implementation |
| DECK-001 | Exactly 133 physical starting instances and approved 19 counts | Canonical rule source; production deck validation deferred to inventory phase |
| PRESENTATION-001 | Physical IDs and asset identity separate; both Lime 1 copies share approved artwork | DECISION-PRESENTATION-001; no assets or card UI migrated |
| SCOPE-P1-001 | No game rules, API gameplay writes, board/cards/wheel UI migration | Empty engine/API/prompt/server-card modules; review and P1 scope test |

Every future rule implementation must cite exact applicable IDs from gamerules.md, not these summaries or the Foundation Report. Do not upgrade unresolved clauses to locked rules. No acceptance label in P1 claims that auth, webhook delivery, gameplay, voice, database or real Telegram works.
