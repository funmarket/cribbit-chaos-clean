# Cribbit CHAOS CLEAN - Structure and Authority

This document describes the target architecture and domain ownership. It supersedes the old P1-placeholder description.

See:

- `docs/product-scope.md` for whole-product scope/source hierarchy/preservation;
- `docs/control-room.md` for Admin/Control Room;
- `gamerules.md` for gameplay semantics;
- `HANDOFF.md` for current execution state.

## 1. One application, multiple presentation/operations adapters

```text
                         CRIBBIT CHAOS
                              |
       +----------------------+----------------------+
       |                      |                      |
 Web presentation      Telegram presentation    Control Room
       |                      |                      |
       +----------+-----------+----------+-----------+
                  |                      |
           packages/api-client      Admin/change APIs
                  |                      |
                  +----------+-----------+
                             |
                         Railway API
                             |
                 shared application domains
                             |
                 +-----------+-----------+
                 |                       |
             game-engine             persistence
                                             |
                                         PostgreSQL
```

Control Room is privileged presentation/operations over the same domains. It is not another backend/game engine.

## 2. Logical domain ownership

### Identity / Account

Owns canonical users, provider identities, credentials/sessions, Telegram validation and secure account linking/unlinking.

### Profile / Preferences

Owns display/profile data, personal content preference/ceiling and user-level preferences that follow the canonical user across clients.

### Room / Persistent Group Context

Owns room/join code, host/roles/membership, lobby/readiness, retained room/group context, room configuration, content eligibility and active/latest game reference.

Does not mutate hands/turns/effects/winner.

### Prompt / Content

Owns Cribbit Originals, Community CHAOS, custom prompts, provenance, categories/tags/world/intensity/player bounds, authorship/reveal metadata, moderation, flags and prompt eligibility inputs.

The engine receives authoritative eligible prompt results; it does not query PostgreSQL.

### Library / Group Memory

Owns distinct durable concepts:

- My Saved Deck;
- House Deck;
- Live Room Pool linkage;
- Resolved Moments;
- Save That outcomes;
- durable group/room memory where retained.

Ownership/lifecycle must be explicit.

### Game

Owns game players/seats, canonical CHAOS-133-V1 state, command idempotency, revision, legal transitions, effects/continuations, deadlines and winner boundary.

The pure engine owns gameplay semantics. API handlers orchestrate authorization/transactions but do not duplicate rules.

### History / Recap

Owns durable completed-session history/projections such as recap, resolved moments and Save That references.

### Safety / Moderation

Owns/report-cross-cuts personal safety policy, flags, moderation state and rule-backed game capabilities without duplicating game rules.

### Media / Call presentation

Owns explicit media metadata/object-storage authorization and capture/playback adaptation. Passive calls/audio are never canonical game input.

### Search / Notifications

When retained/durable, these are application projections/events over canonical data.

### Admin / Operations

Owns:

- admin RBAC/capabilities;
- audit records;
- moderation operations;
- diagnostics/version/environment views;
- typed runtime configuration;
- controlled change proposals/approvals.

Source-controlled behavior remains Git/CI/staging governed.

## 3. Package responsibility

Target dependency direction:

```text
contracts
   ^
   +---- cards
   +---- prompts/policy
   +---- game-engine <----- cards, prompt policy inputs
   +---- api-client
   +---- ui/presentation
   +---- platform/types

api ----> contracts, domain services, game-engine, database
database ----> persistence adapters/types required by domains
shared client composition ----> contracts, api-client, ui, platform/types
web ------> shared client composition + Web adapter
telegram -> shared client composition + Telegram adapter
admin ----> shared contracts/api client/admin APIs (no rule engine)
```

Forbidden ownership:

- `game-engine -> database/api/ui/browser/Telegram SDK`;
- frontend/Admin code implementing canonical game transitions;
- direct client/Admin DB access;
- separate Web/Telegram/Admin domain stores;
- client prompt-selection authority;
- simulation-specific rule reducers;
- duplicate persistence models.

## 4. Persistence principle

One canonical PostgreSQL authority per environment.

Before schema freeze classify at minimum:

- identity/auth;
- profiles/preferences;
- rooms/memberships/configuration/group context;
- game sessions/players/commands/events/deadlines/outbox as needed;
- prompts/content/moderation;
- saved prompts;
- House/group ownership;
- Live Room Pool;
- prompt flags;
- explicit answers/completions;
- recaps/resolved moments/history;
- media metadata where retained;
- admin roles/capabilities;
- audit events;
- runtime configuration/change-proposal metadata where actually required.

Exact table names belong to `DB-001` after `APP-001`, `ARCH-GUARD-001` and `ADMIN-001` classify ownership.

## 5. Presentation principle

The evolved donor app is the primary UI/UX reference unless explicitly superseded.

CLEAN presentation extracts/reuses proven donor design and wires it to clean domains instead of inventing a new theme.

## 6. Simulation principle

```text
Web QA UI --------\
                   -> shared scenario harness -> SAME game-engine/contracts
Telegram QA UI ---/
```

Simulation may create deterministic test state but never reimplement mechanics.

## 7. Single-authority change structure

Every significant product concept has one owner recorded by the Product Authority Registry.

Planned guard tooling:

- `ARCH-GUARD-001` Product Authority Registry;
- `ARCH-GUARD-002` Change Intent / Impact Checker;
- `ARCH-GUARD-003` Diff Ownership Enforcement;
- `ARCH-GUARD-004` Rule Impact Registry;
- `ARCH-GUARD-005` Duplicate Authority Detection.

Change flow:

```text
rule/domain authority
      -> canonical implementation
      -> API projection/contract
      -> api-client
      -> Web / Telegram / Admin presentation
      -> shared QA scenarios
```

Never independently implement the same semantic change in several runtime locations.

## 8. Control Room change boundary

Runtime-managed content/config can use typed Admin APIs with RBAC/audit.

Source-controlled behavior uses:

```text
Change Intent
 -> Authority Registry
 -> Impact Checker
 -> branch/patch
 -> tests
 -> PR
 -> CI
 -> staging
 -> approval
 -> production
```

No arbitrary source/SQL production editor.

## 9. Operational environments

```text
Web staging --------\
Telegram staging ----> ONE staging API -> ONE staging PostgreSQL
Admin staging -------/

Web production -------\
Telegram production ---> ONE production API -> ONE production PostgreSQL
Admin production -----/
```

Exact deployed facts are governed by fresh Railway/Cloudflare/GitHub verification and HANDOFF.

## 10. Donor preservation

Donor modules, old migrations, historical DB/deployment evidence and prompt/content assets remain archaeology until the Whole-App Transfer Matrix proves transfer or obsolescence.

"Legacy" means "not final runtime authority"; it does not mean "safe to delete."
