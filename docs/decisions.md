# Cribbit CHAOS CLEAN - Current Architecture and Product Decisions

This file records durable decisions/supersessions. Live status belongs in `HANDOFF.md`. Gameplay semantics belong in `gamerules.md`.

## DECISION-PRODUCT-001 - Same product, clean rebuild

CLEAN is the same Cribbit product rebuilt with cleaner authority, domains, persistence and wiring.

It is not a new game, not a board-only rewrite and not a visual redesign.

## DECISION-AUTHORITY-002 - Authority is domain-specific

Gameplay:
owner decisions/supersessions -> `gamerules.md` -> clean rule/provenance -> donor evidence -> early ideation.

UI/UX/product flow:
owner decisions -> verified evolved donor app -> extracted CLEAN presentation -> early ideation.

Operational facts:
fresh live GitHub/Railway/Cloudflare/database evidence.

Early bibles/flyers are product archaeology, not source of truth.

## DECISION-DONOR-003 - Preserve donor evidence until transfer is proven

Old/legacy does not mean deletable.

Do not delete donor UI/runtime evidence, old schema/migration evidence, prompt/content assets, historical deployments/databases/branches needed for recovery, or CHAOS-133-V1 assets merely because CLEAN does not currently use them.

Retire only after the Whole-App Transfer Matrix identifies the CLEAN replacement or explicitly classifies the item obsolete.

## DECISION-ARCH-004 - One product authority path

Web and Telegram are presentation/platform adapters over the same canonical user, profile, room, content/library, game, history, permissions, API, engine and PostgreSQL authority.

Control Room is an audited privileged adapter over the same domains, not a second product/backend.

## DECISION-IDENTITY-005 - Canonical user first

Provider identities map to canonical `users.id`.

Linking requires proof of control. Matching usernames/names/emails do not auto-merge identities.

## DECISION-CONTENT-006 - Living content is first-class

CHAOS Board, My Saved Deck, House Deck, Live Room Pool, Create Prompt, authorship/reveal, moderation/flags and Resolved Moments are product domains, not decorative UI.

House Deck requires explicit shared-group ownership semantics.

## DECISION-CALL-007 - Explicit input only

Passive conversation is never gameplay input.

Speak, Type, Choose, Answered Live and explicit review/submit actions are player-controlled. Media/TTS/ASR/call state never independently advances gameplay.

## DECISION-MEMORY-008 - Game completion does not erase group context

Room/group identity and retained libraries/history may outlive one GameSession.

Recap, Save That, Resolved Moments, House content and group history require explicit ownership/lifecycle where retained.

## DECISION-CHANGE-009 - Single Authority / Change Propagation Contract

Every significant product concept has one authoritative implementation. Consumers adapt/render it.

Before significant changes declare authority, expected targets/consumers, tests, DB/Web/Telegram/simulation impact and explicitly unaffected domains.

Machine-checkable authority/impact tooling is required.

## DECISION-DATA-010 - Whole-product schema before freeze

`DB-001` may not freeze a final schema based only on identity/game-core needs.

`APP-001`, `ARCH-GUARD-001` and `ADMIN-001` must first classify retained durable domains/ownership.

## DECISION-SIM-011 - Simulation is not a second game

Local QA Simulation and Rules/Lab use the same canonical engine/contracts.

## DECISION-ADMIN-012 - Control Room is safe operations, not arbitrary editing

The Control Room will cover users, rooms/games, content/moderation, safety, operations, typed runtime configuration, audit and controlled change proposals.

It may not expose arbitrary SQL/source editing or directly rewrite production game semantics.

Runtime-managed changes use typed audited Admin APIs.

Source-controlled rule/mechanic/schema/auth/core-UI changes go through Change Intent -> authority/impact analysis -> Git/PR -> CI -> staging -> approval.

## DECISION-DOC-013 - Living documentation is an execution gate

Every completed implementation/edit must synchronize:

- HANDOFF task status/evidence;
- affected Whole-App Transfer Matrix rows;
- affected authority/decision records;
- exact SHA/CI/deploy identifiers where required;
- next task pointer only after proof.

An agent may not call work complete while permanent roadmap/authority documentation is knowingly stale.

## DECISION-PRESENTATION-001 - Physical cards and shared artwork

Unchanged approved principle:

- CHAOS-133-V1 remains canonical art source;
- physical starting count remains 133;
- both physical Lime 1 copies may map to the approved shared Lime 1 artwork;
- do not invent new artwork or alter physical multiplicity to repair historical asset-slot defects.

See `docs/presentation-decision.md`.

## DECISION-PLATFORM-014 - Platform code stays adapter-only

Concrete Web and Telegram platform concerns remain separated. Shared app/domain code consumes shared contracts/types.

Platform differences must not create different game/content/account semantics.

## DECISION-OPS-015 - Staging/production isolation and exact-version proof

Web/Telegram/Admin staging target one staging API/database authority. Production remains separately isolated.

Hosted acceptance proves frontend/API version identity and database/environment binding before behavior is accepted.

## Current unresolved gameplay rules

All unresolved clauses recorded in `gamerules.md` remain unresolved. Documentation/product rebaselining chooses no new defaults.
