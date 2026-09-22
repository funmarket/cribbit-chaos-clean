# Cribbit CHAOS CLEAN - Product and Architecture Requirements

This file states end-product requirements, not an old phase snapshot.

Gameplay semantics remain owned by `gamerules.md`. Whole-product scope/preservation/change rules are in `docs/product-scope.md`. Live task state is in `HANDOFF.md`.

| ID | Requirement |
|---|---|
| PROD-001 | CLEAN rebuilds the same Cribbit CHAOS product; it does not redesign or replace it. |
| PROD-002 | Verified evolved donor Web/Telegram experience remains primary presentation/flow reference unless explicitly superseded. |
| PROD-003 | Early bibles/flyers are ideation evidence only and never silently override current rules/product decisions. |
| ARCH-001 | One server-authoritative modular monolith owns canonical product state. |
| ARCH-002 | Web and Telegram are two adapters for one application, not separate backend/domain products. |
| ARCH-003 | `packages/api-client` is the shared frontend transport boundary. |
| ARCH-004 | One canonical PostgreSQL migration chain/persistence model owns durable state per environment. |
| ARCH-005 | Simulation/QA uses the same canonical engine/contracts and may not implement parallel rules. |
| AUTH-001 | Web/Telegram authentication resolve to canonical `users.id`; provider identity is not durable product ownership. |
| AUTH-002 | Explicit proof is required to link providers; matching username/name/email does not auto-merge accounts. |
| PROFILE-001 | Canonical profile/preferences are shared across linked Web/Telegram access. |
| ROOM-001 | Room exists before GameSession and owns join identity, host, membership, lobby/readiness, configuration and content eligibility. |
| ROOM-002 | Room configuration can represent retained concepts such as content world, vibe/intensity, categories, source mix and current prompt pool without implementing game rules. |
| ROOM-003 | A completed GameSession may end while persistent Room/group context remains. |
| CONTENT-001 | Prompt/content domain owns built-ins, community content, custom prompts, provenance, eligibility metadata, authorship/reveal policy, moderation and flags. |
| CONTENT-002 | CHAOS Board provides discoverable approved content and never treats frontend state as approval authority. |
| CONTENT-003 | Create Prompt supports distinct destinations/ownership models rather than one undifferentiated prompt bucket. |
| LIB-001 | My Saved Deck is canonical-user-owned private content. |
| LIB-002 | House Deck has explicit shared group/room ownership semantics; it is not another user's bookmark list. |
| LIB-003 | Live Room Pool belongs to current room/content setup and is shared across clients. |
| LIB-004 | Resolved Moments/history derive from authoritative played sessions and preserve privacy/authorship projection. |
| GAME-001 | GameSession owns deck, hands, discard, turns, revision, effects, continuations, deadlines and winner boundary. |
| GAME-002 | Exactly one gameplay engine implements canonical rules; API/UI/Admin/simulation do not duplicate transitions. |
| GAME-003 | CHAOS-133-V1 remains canonical physical card/art source with current approved counts/rules. |
| GAME-004 | Owner-approved target-first/social/forced-on-draw/etc. semantics come only from `gamerules.md`/explicit supersessions. |
| ANSWER-001 | Speak, Type, Choose where applicable and Answered Live are explicit answer modes; passive conversation is never gameplay input. |
| MEDIA-001 | Media/audio is presentation/content support only; game progression never depends on microphone/TTS/ASR/playback completion. |
| SAFETY-001 | Pass/Not for Me, Rewind, Nope, Flag, personal ceiling and related controls follow current eligibility/policy. |
| MOD-001 | Public/community submissions have durable moderation/safety status and creator accountability without leaking sealed authorship. |
| MEMORY-001 | Recap, Save That, Resolved Moments and retained group-memory behavior have explicit durable ownership/lifecycle. |
| SEARCH-001 | Search spans authorized product destinations/content through canonical projections, not hidden client-only truth. |
| NOTIFY-001 | Durable notifications, if retained, are shared backend/application state rather than independent local truth. |
| UI-001 | Verified donor presentation is preserved where available; platform differences are adapters only. |
| UI-002 | Responsive, keyboard/touch, light/dark and accessibility behavior remain first-class. |
| QA-001 | Local QA Simulation/Rules Lab are clearly labeled test surfaces and cannot become alternate production runtimes. |
| ADMIN-001 | Control Room operates over the same canonical domains/API boundaries and may not own a second engine/persistence model. |
| ADMIN-002 | Admin actions use capability-based authorization and durable audit for consequential operations. |
| ADMIN-003 | Runtime-managed changes and source-controlled changes are explicitly separated. |
| ADMIN-004 | Game rules, schema, authorization semantics and core source changes go through Change Intent -> impact analysis -> Git/PR -> CI -> staging -> approval, never direct production editing. |
| ADMIN-005 | Control Room surfaces exact environment/version identity and prevents accidental staging/production ambiguity. |
| DATA-001 | Final schema design occurs only after the Whole-App Transfer Matrix and retained durable product/Admin domains are classified. |
| DATA-002 | No donor database/service/content evidence is deleted merely because CLEAN does not currently reference it. |
| CHANGE-001 | Every significant change declares authoritative owner, affected consumers, tests and persistence/client impact. |
| CHANGE-002 | Machine-checkable authority/impact tooling rejects duplicate authority and undeclared scope expansion. |
| CHANGE-003 | A rule change maps from `RULE-*` to engine owner, contracts/capabilities, projections, tests and affected UI surfaces. |
| CHANGE-004 | UI changes do not mutate domain/rule ownership unless the declared change explicitly requires it. |
| DOC-001 | Every completed implementation/edit synchronizes HANDOFF task status/evidence and any affected permanent scope/decision/authority registry before completion is claimed. |
| OPS-001 | Staging and production are explicitly isolated; production is not the development target. |
| OPS-002 | Hosted acceptance begins by proving frontend/API build identity and database/environment binding. |
| OPS-003 | Exact-candidate CI proves architecture, typecheck, tests and required builds before release claims. |
| SCALE-001 | Scalability comes first from clean domain ownership, stateless API behavior where appropriate, transaction-safe persistence, idempotency, bounded workers and measurable load tests, not premature service sprawl. |

## Preservation gate

Before deleting/retiring donor code, DB structures, prompt assets, branches, deployments or historical services needed as evidence, the Whole-App Transfer Matrix must classify the capability/data as transferred or explicitly obsolete.

## Schema-freeze gate

`DB-001` may not freeze the canonical schema until product scope, Admin/audit needs, ownership/lifecycle and persistence requirements are classified for the retained whole app.

## Completion gate

A working board alone does not satisfy completion. Hosted acceptance covers retained Room, content/library, game, history/memory, safety, account, Admin/operations and cross-client surfaces.
