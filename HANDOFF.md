# Cribbit CHAOS CLEAN - Canonical Live Handoff and Completion Roadmap

> **Purpose:** This is the single living execution handoff for `funmarket/cribbit-chaos-clean`.
> Every engineering agent must read this file before changing the repository, use it to select the next authorized slice, and update its live status/evidence before declaring a task complete.
>
> **This file is intentionally committed.** It is the canonical exception to the normal rule that temporary plans, scratch notes, recovery notes, and FIX files stay out of Git.
>
> **Owner intent:** Finish the existing clean rebuild without restarting from scratch. Preserve the verified old Cribbit product experience and assets, salvage proven mechanics/tests from the old clean engine, and complete one server-authoritative, production-ready, scalable modular monolith with one clean PostgreSQL schema and shared Web/Telegram clients.

---

## 0. Document authority and update rules

### 0.1 Authority

This file owns **execution continuity and roadmap state**. It does not replace:

- `gamerules.md` for canonical game-rule authority;
- owner decisions made after `gamerules.md`, which must be added there with explicit supersession before conflicting mechanics are implemented;
- source code/tests for verified implementation behavior;
- Git/GitHub/Railway/Cloudflare live state for current operational facts.

When these disagree, agents must not guess. Verify the live state, classify the disagreement, apply explicit owner precedence when available, and update this file only with evidence-backed status.

### 0.2 Mandatory agent start protocol

At the start of **every** Cribbit CLEAN engineering session:

1. Read `AGENTS.md` completely.
2. Read this `HANDOFF.md` completely.
3. Read the rule sections relevant to the intended task in `gamerules.md`.
4. Verify the current branch, exact HEAD SHA, PR state, CI state, and any external state the task depends on.
5. Identify exactly one task ID from the roadmap below as the current task.
6. Do not broaden scope beyond that task.
7. Before mutation, verify that the task's prerequisites and authority are satisfied.
8. After the task, run its required checks and update this file's **Live Execution Ledger** and task status.

### 0.3 What agents may update without changing product intent

Agents may update:

- verified current-state facts;
- task status (`NOT STARTED`, `IN PROGRESS`, `BLOCKED`, `PASS`);
- exact SHA/PR/run/deployment evidence;
- blockers;
- test evidence;
- the `NEXT TASK` pointer after the current task is proven complete.

Agents may **not** silently change:

- product goals;
- canonical UI/UX source;
- rule semantics;
- architecture ownership;
- database ownership boundaries;
- phase order where it protects dependencies;
- acceptance gates;
- settled owner decisions.

Changing those requires explicit owner direction and must be recorded as an owner decision.

### 0.4 Status vocabulary

Use only:

- `NOT STARTED`
- `IN PROGRESS`
- `BLOCKED`
- `PASS`

A task becomes `PASS` only when its required evidence is collected for the exact candidate state.

### 0.5 Current roadmap pointer

**NEXT TASK:** `BASE-001 - Exact-head hosted interaction proof for the current UI extraction candidate.`

Do not skip ahead to schema mutation or engine salvage until the active presentation baseline is reconciled according to Phase 1.

### 0.6 Branch authority registry - transitional state

This registry exists so a new agent can immediately identify where active work lives. It is intentionally transitional until the repository-governance phase is completed.

Verified live state at the time this registry was introduced:

| Branch / PR | Role now | Agent rule |
|---|---|---|
| `main` @ `c970711d53fcc64eacd7937db5e421768d3b9ce6` | Default/stable historical baseline | Do **not** assume it contains the latest HANDOFF/AGENTS/product work. Do not start new feature work from it until `REPO-003` establishes the accepted canonical baseline. |
| `integration/clean-rebuild` @ `bf5a0715dfe5cfdf3363e1f608921b2e57c5a245` | Historical integration pointer | Do not use as a new-work base until `REPO-003` decides whether to retain and refresh it. |
| `phase/p7a-playable-visual-slice` @ `714d70c7a55ff4e15f78fb3159473207a7db2990` | Current PR #9 base | Reference/base only while PR #9 is open; do not branch new unrelated work from it. |
| `work-old-ui-full-extract` | **Current active work branch** | This is the current execution branch. Verify its exact live HEAD before every task. |
| PR `#9` | **Current active UI extraction PR** | Current candidate path; exact-head hosted proof remains required by `BASE-001`. |
| `work-old-ui-extraction-port-v2` / PR `#8` | Superseded UI candidate pending formal classification | Do not continue from it. Do not close/delete until `REPO-001/002` verifies it is safe. |
| `work-old-ui-extraction-port` | Superseded UI candidate pending formal classification | Do not continue from it. |
| older `phase/*` branches | Historical milestone/reference branches | Read-only reference unless HANDOFF explicitly selects one. |
| `ci/cloudflare-api-worker`, `docs/recovery-charter`, `work-cross-blob-test` | Historical/experimental candidates pending classification | Do not use as active work bases. |

Current authority summary:

```text
CANONICAL DEFAULT/STABLE BRANCH: main (historical/stale relative to active work until REPO-003)
CURRENT ACTIVE WORK BRANCH:      work-old-ui-full-extract
CURRENT ACTIVE PR:               #9
CURRENT ACTIVE TASK:             BASE-001
CURRENT PR BASE:                 phase/p7a-playable-visual-slice
```

Agents must verify these facts live before acting. A stale registry never overrides GitHub.

### 0.7 Future branch naming convention

After the current UI candidate is reconciled and repository governance is established, new implementation branches should map directly to one HANDOFF task:

```text
task/<TASK-ID>-<short-slug>
```

Examples:

```text
task/DB-001-schema-authority
task/LIFE-001-auth
task/ENG-003-turn-effects
task/SOC-005-duel
task/MEDIA-004-prompt-narration
```

Rules:

- one active HANDOFF task per task branch;
- branch name must contain the HANDOFF task ID;
- no ambiguous new `work-*` or `phase/*` branch naming after `REPO-005` passes;
- no direct feature implementation on `main`;
- no new task may choose a base branch by guesswork;
- the accepted base for each task must be identified by HANDOFF/live Git state;
- historical branches remain read-only unless a specific recovery task names them.

---

# 1. Product mission and end state

## 1.1 Product mission

Cribbit CHAOS CLEAN is not a new game and not a visual redesign.

The mission is:

> **Same Cribbit game, same verified UI/UX and CHAOS-133-V1 art - rebuilt underneath as one clean server-authoritative, production-ready modular monolith with one canonical PostgreSQL schema and shared Web/Telegram clients.**

The old project is a donor/reference for what was already good. The clean project is the implementation authority.

## 1.2 Definition of the finished product

The project is considered production-ready only when all of the following are true:

1. A real user can enter from Web or Telegram.
2. Identity resolves to one canonical user model.
3. A user can create or join a room.
4. Room membership is durable and reconnect-safe.
5. Host can start a game from the room's actual members.
6. The server creates one canonical game session and authoritative game state.
7. The complete CHAOS-133-V1 deck is used.
8. All ordinary and special mechanics required by the current canonical rules are implemented.
9. Forced-on-draw ordering is deterministic and tested.
10. Truth/Dare/Paranoia/Duel/etc. use corrected owner-approved flows.
11. Bots, timers, Roulette, prompt selection, continuation behavior, and winner boundaries work through the same engine.
12. Web and Telegram render authorized server projections only.
13. Simulation uses the same API/engine, not a parallel runtime.
14. Reconnect/retry does not duplicate commands or corrupt turns.
15. PostgreSQL has one canonical migration chain and one active schema model.
16. Staging and production are isolated environments with explicit database ownership.
17. CI proves typecheck, architecture boundaries, tests, Web build, Telegram build, and API build on the exact candidate.
18. Runtime smoke tests prove create -> join -> start -> play -> social effect -> continue -> winner paths.
19. Authentication, authorization, CORS/origin policy, secrets, rate protection, logging, and operational health are production-safe.
20. No legacy runtime, client engine, hidden fallback, duplicate reducer, or competing persistence path remains active.
21. Audio/media is a separate presentation/content domain: game rules never depend on playback completion, codecs, microphone state, or TTS availability.
22. Canonical prompt text remains available even when narration or a player recording exists.
23. Prompt narration and approved voice prompt recording work on Web and Telegram with privacy-aware media projection.
24. Audio bytes live in object storage, not PostgreSQL or canonical game-state JSON.
25. Media retention, consent, moderation state, orphan cleanup, and expiring playback/upload authorization are production-safe.
26. Web and Telegram are proven as two frontends for the same Cribbit product, never separate games.
27. The same person can authenticate through Web and Telegram and resolve to the same canonical `users.id` after secure account linking.
28. Web and Telegram share the same room memberships, game sessions, hands, turns, revisions, prompts, libraries, saved data, rules, commands, permissions, backend services, and PostgreSQL authority.
29. A player may move between Web and Telegram without creating a new game identity, room identity, seat, hand, or history record.
30. Cross-client end-to-end tests prove Web + Telegram interoperability and same-person identity continuity.

---

# 2. Non-negotiable project invariants

These are permanent unless the owner explicitly supersedes them.

## 2.1 One authority per concept

| Concept | Canonical owner |
|---|---|
| Product visual reference | Verified old Cribbit Web/Telegram UI extraction |
| Card artwork | `CHAOS-133-V1` old canonical asset source |
| Game rules | `gamerules.md` + explicit later owner supersessions |
| Game transitions | `packages/game-engine/**` only |
| Command authorization/orchestration | Railway Node API application layer |
| Canonical game persistence | Railway PostgreSQL |
| Client HTTP transport | `packages/api-client` |
| Web presentation | Web client + shared UI using server projections |
| Telegram presentation | Telegram client + shared UI using server projections |
| Timed work | canonical deadline jobs/worker |
| Realtime publication | canonical outbox path |
| Media metadata / authorization | Railway API + canonical PostgreSQL media tables |
| Audio object bytes | S3-compatible object storage behind short-lived API-issued authorization |
| Media processing | isolated media workers/adapters; never the game engine |
| Game SFX / UI sounds | versioned client presentation assets/catalog |
| Living execution plan | this `HANDOFF.md` |

## 2.2 Single Product / Cross-Client Identity Invariant

This is a permanent owner-locked architecture rule.

> **Web and Telegram are two frontends for the same Cribbit product, not two separate games.**

Canonical topology:

```text
Web frontend
        \
         -> packages/api-client -> same Railway API -> same application services -> same game-engine -> same PostgreSQL
        /
Telegram frontend
```

Only presentation and platform adapters differ.

The following authorities are shared across both clients:

- one canonical user account;
- one canonical identity graph;
- one room-membership model;
- one game-session model;
- one set of game players/seats;
- one canonical hand/turn/revision state;
- one prompt/library/saved-content model;
- one rule set;
- one command language/contracts;
- one backend service boundary;
- one database authority;
- one permissions/authorization model.

There must never be a parallel Web domain and Telegram domain for any of those concepts.

### Canonical identity model

The identity relationship is:

```text
users
  ^
user_identities
  |- web/password or Web auth identity
  |- telegram identity
  \- future providers
```

Multiple proven login methods may map to **one canonical `users.id`**.

Example:

```text
users.id = U1

user_identities:
  (U1, provider=telegram, provider_user_id=<telegram-id>)
  (U1, provider=web_email, provider_user_id=<verified-web-identity>)
```

All durable product ownership references canonical `users.id`, including:

- room membership;
- game-player identity for human seats;
- profiles;
- saved prompts and prompt libraries;
- media ownership;
- history;
- permissions;
- active-game recovery.

Do not create platform-specific ownership columns such as `telegram_user_id` or `web_user_id` in room/game/content tables.

### Secure account linking

The system must support multiple login methods without guessing identity equivalence.

Rules:

1. First proven login may create a canonical `users.id` and attach that provider identity.
2. Linking another login method requires proof of control over the already authenticated canonical account **and** proof of control over the second identity.
3. `user_identities` must enforce unique provider identity ownership, equivalent to `UNIQUE(provider, provider_user_id)`.
4. A provider identity must never silently move from one canonical user to another.
5. Email/name/display-name similarity must never auto-merge accounts.
6. Account linking/unlinking is an Identity-domain operation and must be auditable.
7. Telegram `initData` must be verified server-side before Telegram identity resolution.
8. Once linked, Web and Telegram resolve to the same canonical `users.id`.

### Shared game identity

A human game seat references the canonical user:

```text
game_players
  id
  game_id
  user_id -> users.id
  seat_index
  display_name_snapshot
  player_kind
```

`game_players.id` is a seat/player identity inside one game. It is not a replacement for `users.id`.

If the same user changes frontend during an active game:

```text
Web -> close
Telegram -> authenticate -> same users.id
                         -> same room membership
                         -> same active game
                         -> same game_player seat
                         -> same private hand
                         -> same revision/effects
```

The platform switch must not create a duplicate player.

### Shared command path

Both clients submit the same contracts:

```text
Web action --------\
                    -> packages/api-client -> API command service -> game-engine -> PostgreSQL transaction
Telegram action ---/
```

Examples include the same canonical command families for draw, play, target selection, color choice, prompt answer, Pass, Nope, Rewind, voting, and later approved actions.

Do not create independent implementations such as:

```text
webDrawCard()
telegramDrawCard()
```

when they own game semantics.

Platform-specific code may translate presentation events into the shared command contract, but rule resolution stays server-side.

### Platform metadata is non-semantic

It is acceptable to record metadata such as:

```text
source_client = web | telegram
```

for observability, analytics, or troubleshooting.

It must never change game semantics, permissions, prompt eligibility, deck behavior, timers, scoring, winner rules, or effect resolution.

### Shared prompts, libraries, media, and saved data

Content created from either client belongs to the same canonical domain:

```text
Web-created prompt --------\
                            -> same prompts / libraries / prompt_media / owner users.id
Telegram-created prompt ---/
```

There is no separate Web prompt library, Telegram prompt library, Web history, or Telegram history.

### Cross-client acceptance requirement

Production acceptance must prove:

- one Web user and one Telegram user can join the same room and same game;
- both observe the same canonical revision after each accepted command;
- private projections preserve the correct hand for each user;
- the same linked human account can authenticate through Web and Telegram and recover the same profile, rooms, saved prompts/library, history, and active game;
- switching clients does not create a duplicate room member or game player;
- both clients use `packages/api-client` and the same backend command contracts.

### Source convergence implementation - 2026-09-20

Explicit owner authorization advanced the source-level Web/Telegram convergence before the later production activation gates.

**Verified candidate:** `11e7ef29be068a1a16cfc2f26e061fedb04072f0`

**Exact-state CI:** GitHub Actions run `35531377108` - PASS

The candidate now establishes in source:

- one shared client application and one `packages/api-client` transport path;
- Web session-cookie authentication and Telegram `tma <initData>` transport authentication;
- server-side `AuthContext` resolution to one canonical `users.id`;
- fail-closed `AUTH_CONFLICT` when simultaneous Web/Telegram credentials resolve to different canonical users;
- Web password identity plus explicit Web-to-Telegram account linking;
- unique provider identity ownership with conflict rejection rather than silent reassignment;
- game create/join/start/projection/command authorization through canonical `users.id`, not a random per-game secret;
- `game_session_memberships.principal_id -> users.id`;
- one canonical checked-in identity migration and one canonical game persistence migration;
- removal of the duplicate `clean_game_sessions/game_participants/clean_game_commands` source migration generation;
- cross-client automated proof that:
  - a Web-created canonical user can link a Telegram identity and resolve to the same `users.id`;
  - the linked Telegram identity recovers the same active game player seat;
  - a different Telegram user can join the Web user's same game;
  - both clients observe the same canonical game revision;
  - private hand projection remains player-scoped.

The exact candidate passed:

- Node 24 / npm 10.9.2 gate;
- `npm ci`;
- typecheck;
- architecture check;
- full tests;
- Web build;
- Telegram build;
- API build.

This is **source convergence only**. It does not claim production activation.

Still required before live completion:

- deliberate migration/verification of the intended Railway database target;
- deployment of this accepted API candidate to the intended environment;
- Web and Telegram deployments configured against that same API/environment;
- real hosted account-linking and cross-client game proof;
- later shared profile/prompts/library/history persistence as those domains are implemented.

No game-engine rule logic, extracted old UI donor source, or card artwork was changed by this convergence.

## 2.3 Forbidden authority duplication

Do not create or reactivate:

- `packages/legacy-runtime/**` as production authority;
- `canonical-game-runtime.ts` as a second engine;
- Telegram simulation/backend runtime as game authority;
- browser-owned deck/session/turn reducers;
- local fallback games when API is unavailable;
- client prompt selection authority;
- a second command language;
- a second persistence model beside the canonical schema;
- a second simulation engine;
- hidden compatibility modes that mutate canonical game state differently.

## 2.4 Modular monolith, not microservices

Target architecture is one deployable API application with strong internal module boundaries.

Do not introduce Redis, Kafka, event-sourcing infrastructure, extra databases, or service decomposition merely for theoretical scalability. Add infrastructure only when a measured requirement justifies it.

## 2.5 Toolchain

Required baseline:

- Node `24.x`
- npm `10.9.2`

Required verification command before claiming a source candidate green:

```sh
npm run verify
```

Equivalent explicit gates are:

```sh
npm run typecheck
npm run architecture:check
npm test
npm run build:web
npm run build:telegram
npm run build:api
```

## 2.6 Temporary files

Do not commit:

- `FIX.md`;
- temporary fix plans;
- scratch files;
- recovery notes;
- temporary audits;
- local controller state;
- agent thought dumps.

Canonical exceptions:

- `HANDOFF.md` - living project handoff/roadmap;
- `AGENTS.md` - agent execution contract;
- explicitly approved permanent architecture/rule documentation.

---

# 3. Verified project state at governance baseline

**Functional baseline inspected:** `work-old-ui-full-extract@d2c64517cce51e132c77b25f8f67ceab6c0a5c73`

This SHA is the functional baseline verified before adding the living governance files. Agents must always re-read the current live branch HEAD; do not assume this document commit is still the branch tip.

## 3.1 GitHub

Verified before this handoff was introduced:

- Repository: `funmarket/cribbit-chaos-clean`
- Active UI extraction branch: `work-old-ui-full-extract`
- Active PR: `#9`
- PR base: `phase/p7a-playable-visual-slice`
- Base SHA: `714d70c7a55ff4e15f78fb3159473207a7db2990`
- Functional PR head inspected: `d2c64517cce51e132c77b25f8f67ceab6c0a5c73`
- PR state: open, unmerged
- PR head CI: typecheck/architecture/tests/builds green
- Exact test result observed: `128 tests / 128 pass / 0 fail / 0 skipped`

Important current gap:

- exact-head hosted browser interaction proof is not yet recorded as PASS for the current UI extraction candidate.

## 3.2 Current clean engine

Current remote clean engine is a **playable slice**, not the full historical mechanics system.

At the functional baseline it contains:

- `packages/game-engine/src/index.ts`
- `kernel.ts`
- `playable-slice.ts`
- `projection.ts`
- `state.ts`

Useful current capabilities include:

- canonical state validation;
- rule provenance requirements;
- deterministic revision advancement;
- card conservation checks;
- lifecycle/winner boundary structures;
- ordinary legality/turn support in the playable slice;
- projection privacy;
- deadline/outbox architectural support.

There is no remote `packages/game-engine/test/` donor-test port and no verified remote `clean/port-tested-core` branch at this baseline.

## 3.3 Old engine donor

Pinned donor implementation:

`funmarket/cribbit-chaos@95febd07e4d739c96843fcc4a02f070eb3c623c0`

Verified donor source modules:

- `adaptive-distribution.ts`
- `bot-policy.ts`
- `capabilities.ts`
- `command-router.ts`
- `deck.ts`
- `errors.ts`
- `events.ts`
- `index.ts`
- `reducer.ts` (~123 KB)
- `rng.ts`
- `setup.ts`
- `social.ts`
- `timer.ts`
- `turn.ts`
- `validation.ts`

Verified donor suites:

- `adaptive-distribution.test.ts`
- `bot-capabilities.test.ts`
- `bot-policy.test.ts`
- `core-engine.test.ts`
- `corrected-rules-behavior.test.ts`
- `deck-composition.test.ts`
- `nope-routing.test.ts`
- `validation-matching.test.ts`

Donor rule:

> Salvage mechanics, algorithms, invariants, and tests. Do not reinstall the old runtime architecture or blindly copy the monolithic reducer.

## 3.4 Current persistence situation

The clean repository currently carries two persistence generations.

### Active P6 gameplay model

The running gameplay API uses tables conceptually equivalent to:

- `game_sessions`
- `game_session_memberships`
- `accepted_command_receipts`
- `game_outbox`
- `game_deadline_jobs`

It already has useful concurrency/idempotency behavior and PostgreSQL integration coverage.

### Newer parallel model also present

The repository also contains a newer identity/game-core migration family including:

- `app_users`
- `user_identities`
- `auth_sessions`
- `clean_game_sessions`
- `game_participants`
- `game_states`
- `clean_game_commands`
- `clean_game_outbox`
- `clean_game_deadline_jobs`

This dual model must not remain the long-term production state.

### Owner data statement

The application is still fresh and there is no production user database or prompt corpus that must be preserved.

Implication for the roadmap:

- there is no requirement to maintain backward compatibility for real user/prompt data;
- the schema should be consolidated cleanly before launch;
- **this does not authorize any database reset by itself**;
- before any reset/migration task, the exact database target and preservation requirements must be verified and the specific mutation authorized.

## 3.5 Current Railway topology

Verified project:

`cribbit-chaos-clean`

Current environment observed:

- `production`

Services observed:

- `cribbit-chaos-clean-api`
- `cribbit-chaos-clean-production-db`
- `cribbit-chaos-clean-staging-db`

Important verified configuration issue at the governance baseline:

- the API `DATABASE_URL` references the Railway service ID corresponding to the service named `cribbit-chaos-clean-staging-db`;
- both database services currently live inside the Railway environment named `production`.

This must be reconciled deliberately before launch.

## 3.6 Current hosting

Cloudflare Pages projects exist for:

- Web
- Telegram

Successful preview deployments were observed for the UI extraction branch at the functional baseline.

Railway API is deployed from the earlier P7A branch baseline rather than the latest UI extraction head. That split is acceptable during UI extraction but must be unified before a release candidate is declared.

---

# 4. Canonical target architecture

```text
                        +----------------------+
                        |   Cloudflare Pages   |
                        |  Web      Telegram   |
                        +----------+-----------+
                                   |
                                   v
                           packages/api-client
                                   |
                                   v
                    +-----------------------------+
                    |       Railway Node API      |
                    |-----------------------------|
                    | Auth / identity             |
                    | Room application service    |
                    | Game command service        |
                    | Special-effect handlers     |
                    | Projection delivery         |
                    | Outbox worker               |
                    | Deadline worker             |
                    +--------------+--------------+
                                   |
                  +----------------+----------------+
                  |                                 |
                  v                                 v
       +----------------------+         +------------------------+
       | Pure game engine     |         | Railway PostgreSQL     |
       |----------------------|         |------------------------|
       | state + invariants   |         | identity               |
       | deck + legality      |         | rooms/membership       |
       | turn/effects         |         | game/current state     |
       | social flows         |         | command receipts/log   |
       | bots                 |         | outbox                  |
       | timers policy        |         | deadlines               |
       | capabilities         |         | prompts/content later   |
       +----------------------+         +------------------------+
```

### Architectural direction

- Web and Telegram never mutate canonical state directly.
- API authenticates principal, authorizes room/game membership, validates revision/idempotency, invokes one engine transition, persists atomically, then publishes.
- Engine performs no DB/network/DOM/Telegram work.
- Database adapters perform no game-rule decisions.
- UI renders only server-authorized projections and capabilities.
- Simulation exercises the same API and engine.

---

# 5. Domain ownership model

## 5.1 Identity domain

Owns:

- canonical `users.id`;
- provider identities (Telegram, Web auth/password, guest where retained, future providers);
- secure account-linking/unlinking between multiple provider identities and one canonical user;
- authentication sessions/tokens;
- display identity metadata;
- audit evidence for identity linking where required.

Identity rules:

- provider identities map through `user_identities` to canonical `users.id`;
- `UNIQUE(provider, provider_user_id)` or an equivalent constraint prevents one provider identity from belonging to multiple users;
- Web and Telegram authentication may resolve to the same canonical user;
- no room/game/content table may use platform identity as its ownership authority;
- no account auto-merge from matching display name/email-like metadata without proof of identity ownership.

Does not own:

- room membership;
- game seats;
- game commands;
- prompt mechanics.

## 5.2 Room domain

A Room exists before a GameSession.

Owns:

- room ID;
- join code/invite identity;
- host user;
- members;
- seat/order preference;
- lobby state;
- room configuration;
- readiness/start eligibility;
- active/latest game reference when useful.

Room must not directly mutate hands, turns, deck, effects, or winner state.

## 5.3 Game domain

Created when host starts from an eligible Room.

Owns:

- game ID;
- immutable room linkage;
- game players/seats;
- canonical game state;
- current revision;
- command idempotency;
- engine transitions;
- active effects;
- continuations;
- deadlines;
- winner boundary.

## 5.4 Prompt/content domain

Owns content records, not game-state transitions.

Examples:

- canonical built-in prompts;
- custom pre-game prompts;
- Roulette eligibility metadata;
- moderation status;
- prompt source/provenance.

The engine receives an authoritative eligible prompt/result as input; the engine does not query the database.

## 5.5 Presentation domain

Owns:

- visual mapping;
- interaction controls;
- accessibility;
- responsive behavior;
- display of capabilities/projections.

It does not own legality or resolution.

---

# 6. Package dependency rules

Target workspace dependency direction:

```text
contracts
   ^
   |
   +---- cards
   +---- prompts (pure policy/types/catalog adapters)
   |
   +---- game-engine <----- cards, prompts
   |
   +---- api-client
   |
   +---- ui <------------- cards/presentation
   |
   +---- platform/types

api ----> contracts, game-engine, database

database ----> contracts and game-engine types only where persistence requires them

client-app ----> contracts, api-client, ui, platform/types

web ----> client-app, platform/web
telegram ----> client-app, platform/telegram
```

### Forbidden dependency direction

- `game-engine -> database`
- `game-engine -> api`
- `game-engine -> ui`
- `game-engine -> browser/Telegram SDK`
- `ui -> database`
- `ui -> game-engine mutation logic`
- `api-client -> game-engine`
- `client-app -> database`
- `web/telegram -> direct server fetch outside api-client`
- `game-engine -> media storage/TTS/ASR/VAD provider`
- `media workers -> game revision mutation`
- `media playback completion -> game command/turn advancement`
- cross-import of concrete Web and Telegram platform adapters

### Media package direction

Target ownership:

```text
contracts
   ^
   |
   +---- media-contracts/types
   |
api ----> media application service ----> object-storage adapter
   |                                  \-> media metadata repository
   |
workers/media-processing ----> media application contracts only

ui/client-app ----> media client/playback abstractions
web/telegram ----> platform microphone/autoplay adapters
```

Rules:

- media packages contain no game-rule logic;
- Web/Telegram never receive permanent bucket credentials;
- clients may upload/download directly to object storage only through short-lived, purpose-bound authorization issued by the API;
- provider-specific TTS/ASR/VAD code stays behind adapters and does not leak into game-engine types.

### Module sizing rule

One authority does **not** mean one giant file.

Special-rule families must be split into focused modules/handlers. Do not rebuild a 123 KB catch-all reducer.

---

# 7. Canonical production database design

## 7.1 Database goals

The target schema must provide:

- one canonical naming system;
- durable identity;
- durable rooms and membership;
- durable canonical game state;
- exact command idempotency;
- optimistic revision validation + transactional serialization;
- durable deadlines;
- outbox publication;
- prompt/content growth path;
- clean foreign keys and indexes;
- staging/production isolation;
- reversible/forward migration discipline after launch.

## 7.2 Migration authority

Target rule:

> There is exactly one migration directory and one migration runner.

Do not keep the same schema SQL duplicated in:

- raw migration files;
- TypeScript string constants;
- parallel migration folders.

Recommended permanent location:

```text
db/migrations/
```

Recommended migration metadata table:

```text
schema_migrations
```

Each migration is immutable after it has reached a shared environment.

## 7.3 Target core tables

Names may be finalized during `DB-001`, but the ownership model must remain equivalent.

### `users`

- `id uuid pk`
- `display_name`
- `display_username nullable`
- `avatar_url nullable`
- `created_at`
- `updated_at`

### `user_identities`

- `id uuid pk`
- `user_id fk users`
- `provider`
- `provider_user_id`
- `provider_username nullable`
- `provider_payload jsonb`
- unique `(provider, provider_user_id)`

One canonical user may have multiple rows here, including Web and Telegram identities. Product ownership elsewhere references `users.id`, never a provider-specific identifier.

### `auth_sessions`

- `id uuid pk`
- `user_id fk users`
- `token_hash unique`
- `provider`
- `created_at`
- `expires_at`
- `last_used_at`
- `revoked_at nullable`

Never store bearer tokens in plaintext.

### `rooms`

- `id uuid pk`
- `join_code unique`
- `host_user_id fk users`
- `status` (`LOBBY`, `STARTED`, `CLOSED` or finalized enum/check)
- room settings JSON or normalized columns where stable
- `created_at`
- `updated_at`

Indexes:

- unique `join_code`
- host/status as needed by actual queries

### `room_members`

- `id uuid pk`
- `room_id fk rooms on delete cascade`
- `user_id fk users`
- `seat_index`
- `role`
- `joined_at`
- `left_at nullable`
- unique active `(room_id, user_id)` semantics
- unique active `(room_id, seat_index)` semantics

### `games`

- `id uuid pk`
- `room_id fk rooms`
- `status` (`ACTIVE`, `COMPLETED`, `ABANDONED`)
- `revision bigint >= 0`
- `winner_game_player_id nullable`
- `started_at`
- `completed_at nullable`
- `created_at`
- `updated_at`

### `game_players`

- `id uuid pk`
- `game_id fk games on delete cascade`
- `user_id nullable fk users` (nullable only for canonical bots if bot identity is not modeled as a user)
- `source_room_member_id nullable`
- `display_name`
- `seat_index`
- `player_kind` (`human`, `bot`)
- bot policy/version metadata when required
- unique `(game_id, seat_index)`

### `game_states`

One current authoritative snapshot per game:

- `game_id pk/fk games`
- `canonical_state jsonb not null`
- `revision bigint not null`
- `updated_at`

Invariant:

`games.revision == game_states.revision == canonical_state.revision`

### `game_commands`

Append-only command receipt/audit record:

- `id uuid pk`
- `game_id fk games`
- `command_id text`
- `command_fingerprint text`
- `actor_game_player_id nullable`
- `command_type`
- `expected_revision`
- `result_status`
- `before_revision`
- `after_revision nullable`
- `request_payload jsonb` only if safe/needed
- `result_payload jsonb` only if safe/needed
- `created_at`
- unique `(game_id, command_id)`

This table owns idempotency evidence. Do not add a second receipt table unless a later migration explicitly replaces it.

### `game_outbox`

- monotonic primary key
- `game_id`
- `revision`
- `audience jsonb`
- `event_type`
- `payload jsonb`
- `created_at`
- `published_at nullable`
- `lease_token nullable`
- `lease_expires_at nullable`

Indexes:

- unpublished queue index;
- `(game_id, revision)`.

### `game_deadlines`

- `id uuid pk`
- `game_id fk games`
- `owner_kind`
- `owner_ref_id`
- `due_at`
- `status`
- stable command payload/fingerprint
- expected revision as required
- lease fields
- completed/cancelled timestamps

The deadline worker never invents a game transition. It submits an explicit canonical command.

## 7.4 Prompt/content tables - build when content persistence phase starts

### `prompts`

Potential fields:

- `id uuid pk`
- `kind` (`truth`, `dare`, `paranoia`, `duel`, etc.)
- `body`
- structured options/evaluation metadata where needed
- `source` (`builtin`, `user`, `room_custom`)
- creator user nullable
- language/locale
- moderation state
- active flag
- created/updated timestamps

### `prompt_sets`

Groups/versioned decks of prompt content.

### `prompt_set_items`

Many-to-many membership with weighting/order metadata.

### `room_custom_prompts`

If room-scoped custom content needs separate lifecycle rather than global `prompts` rows.

### `media_assets`

Metadata only. Audio bytes never live in PostgreSQL.

Recommended fields:

- `id uuid pk`
- `owner_user_id nullable fk users`
- `source` (`system`, `generated`, `user_upload`)
- `purpose` (`prompt_narration`, `prompt_recording`, future `answer_recording`, `system_line`)
- `storage_provider`
- `storage_key unique`
- `mime_type`
- `codec nullable`
- `duration_ms nullable`
- `byte_size`
- `sha256`
- `locale nullable`
- `status` (`pending_upload`, `uploaded`, `processing`, `ready`, `rejected`, `tombstoned`)
- `moderation_status` (`not_required`, `pending`, `approved_room`, `approved_library`, `blocked`)
- `retention_class` (`system_permanent`, `regeneratable`, `library_content`, `session_temporary`, future `sensitive_temporary`)
- `expires_at nullable`
- `created_at`
- `ready_at nullable`
- `deleted_at nullable`

### `prompt_media`

A prompt may have multiple readings/recordings without changing prompt authority.

Recommended fields:

- `prompt_id fk prompts on delete cascade`
- `media_asset_id fk media_assets`
- `role` (`canonical_narration`, `alternate_narration`, `player_recording`)
- `locale`
- `voice_key nullable`
- `model_id nullable`
- `generation_version nullable`
- `text_hash nullable`
- `is_default`
- `created_at`
- unique relationship constraints appropriate to default role/locale

### `media_upload_intents`

Pre-authorizes a bounded user upload and makes orphan cleanup deterministic.

Recommended fields:

- `id uuid pk`
- `user_id fk users`
- `room_id nullable fk rooms`
- `purpose`
- `storage_key unique`
- `max_bytes`
- allowed MIME/content-type policy
- `expires_at`
- `consumed_at nullable`
- `created_at`

The API chooses storage keys and issues a short-lived signed upload authorization. The client never receives bucket credentials.

### `media_transcriptions`

Machine transcription is evidence, not automatically canonical prompt text.

Recommended fields:

- `id uuid pk`
- `media_asset_id fk media_assets`
- `text`
- `source` (`asr`, `user`, `moderator`)
- `model nullable`
- `model_version nullable`
- `confidence nullable`
- `created_at`

A playable recorded prompt still requires canonical `prompts.text`. ASR output must be confirmed/corrected before becoming canonical content.

### Audio preference versus room policy

Do not mix device/user playback preferences with room content policy.

Personal/device preference may include:

- SFX enabled/volume;
- music enabled/volume;
- narration enabled/volume;
- auto-read prompts;
- preferred locale/voice.

Room media policy may include:

- whether player prompt recordings are allowed;
- whether in-game manual voice prompts are allowed;
- whether stored answer recording is allowed if that feature is ever approved;
- retention class/window for room-generated media.

Prompt persistence is **not** a prerequisite for the first full playable game. The engine prompt flow is a prerequisite; populated community content and media generation are not.

## 7.5 Transaction boundary

Accepted game commands should follow:

```text
BEGIN
  lock/load game session
  authorize actor membership
  check existing command receipt
  verify expected revision
  load canonical state
  resolve canonical engine command
  execute pure engine transition
  validate next state
  update current game state at expected revision
  write command receipt/audit
  write outbox signal(s)
  schedule/cancel deadline jobs as part of the same authoritative transaction where required
COMMIT
```

Any failure rolls back the full accepted transition.

---

# 8. Environment topology target

## 8.1 Railway

Target final topology:

```text
Railway project: cribbit-chaos-clean

staging environment
  - api
  - postgres

production environment
  - api
  - postgres
```

Do not keep both staging and production databases as ambiguously named services inside one production environment long term.

## 8.2 Cloudflare Pages

Target:

- Web preview branches -> staging API
- Telegram preview branches -> staging API
- Web production branch -> production API
- Telegram production branch -> production API

API URLs must be environment configuration, never hard-coded rule logic.

## 8.3 Release candidate rule

A release candidate is one exact Git SHA whose:

- Web build;
- Telegram build;
- API build;
- migration compatibility;
- CI;
- staging runtime proof

are all recorded against that exact candidate.

---

# 9. API and application-layer target

## 9.1 Authentication endpoints

Target examples:

- `POST /api/auth/guest`
- `POST /api/auth/telegram`
- `POST /api/auth/logout`
- `GET /api/me`

All game/room calls use canonical auth sessions, not random ad hoc gameplay credentials.

## 9.2 Room endpoints

Target examples:

- `POST /api/rooms`
- `POST /api/rooms/:joinCode/join`
- `GET /api/rooms/:roomId`
- `POST /api/rooms/:roomId/leave`
- `POST /api/rooms/:roomId/start`

The start endpoint creates a Game from current eligible room membership atomically.

## 9.3 Game endpoints

Core examples:

- `GET /api/games/:gameId/view`
- `POST /api/games/:gameId/commands`

Special mechanics must not be implemented as one giant handler. Each rule family gets a dedicated application handler/module. If dedicated thin HTTP routes are retained for special effects, they must all feed the same authenticated command service and the same engine state authority.

## 9.4 Projection rule

The API never sends canonical private state wholesale.

Projections are audience-specific:

- public/session projection;
- player projection;
- future spectator/moderation projection only when explicitly designed.

---

# 10. Game engine target structure

Recommended direction (exact filenames may evolve without changing ownership):

```text
packages/game-engine/src/
  index.ts
  kernel.ts
  state.ts
  projection.ts

  core/
    legality.ts
    turn.ts
    winner.ts
    continuation.ts
    capabilities.ts

  deck/
    deck.ts
    rng.ts
    draw.ts
    adaptive-distribution.ts

  effects/
    number.ts
    skip.ts
    reverse.ts
    draw-card.ts
    wild.ts

    truth.ts
    dare.ts
    paranoia.ts
    chaos.ts
    duel.ts
    tag.ts
    hijack.ts
    taboo.ts
    machiavelli.ts
    reverse-confession.ts
    dig-me.ts
    truth-or-chaos.ts
    ghost.ts

  prompts/
    selection-policy.ts
    eligibility.ts

  bots/
    policy.ts
    capabilities.ts
```

## 10.1 Engine rules

- Pure functions only.
- No network.
- No DB.
- No timers from wall-clock side effects.
- No browser APIs.
- No Telegram APIs.
- Randomness enters through explicit authoritative RNG input/seed.
- Prompt selection inputs are explicit.
- Every executable transition cites rule provenance.
- Every transition preserves physical card conservation except where the canonical deck model explicitly permits lifecycle removal.
- One active root flow at a time unless canonical rules explicitly model otherwise.

## 10.2 Donor-port classification

For each donor mechanic:

1. locate implementation;
2. locate tests;
3. compare with current canonical rule;
4. classify:
   - `UNCHANGED` - port/adapt behavior and tests;
   - `OWNER-SUPERSEDED` - reuse primitives, implement corrected semantics;
   - `UNRESOLVED` - do not invent a behavior;
   - `RUNTIME-DEBT` - discard orchestration/runtime coupling;
5. add clean test first where practical;
6. implement in the canonical module;
7. run focused tests;
8. run full verify;
9. update this handoff.

---

# 11. Canonical rule corrections that must survive the port

Before implementation, verify these are represented in current `gamerules.md` with explicit authority/supersession where needed.

## 11.1 Forced-on-draw set

Authoritative set recorded by owner:

- Truth
- Dare
- Paranoia
- Chaos
- Duel
- TAG
- Truth or Chaos
- Hijack
- Taboo
- Machiavelli
- Reverse Confession
- DIG ME

Behavior:

- auto reveal;
- cannot remain in hand;
- forced flow interrupts ordinary turn;
- forced-on-draw consequences resolve FIFO;
- after effect resolution, normal turn ends unless the card explicitly says otherwise.

## 11.2 Truth

- target-first;
- actor chooses another eligible target;
- Manual or Roulette;
- target answers using allowed answer modes;
- Pass/Not for Me -> draw exactly 2 real cards;
- forced-on-draw effects from that penalty resolve FIFO;
- refusal cannot produce a win before penalty draw resolves.

## 11.3 Dare

- target-first;
- Manual or Roulette;
- target completes or uses Pass/Not for Me;
- refusal handling must follow current canonical owner rule; do not infer from stale code when unresolved.

## 11.4 Reverse Confession

- target-first;
- chosen target gives confession about themselves;
- may be true or fabricated;
- target must not reveal which;
- downstream resolution remains unresolved unless separately approved.

## 11.5 Duel

- target-first challenger/opponent structure;
- one shared prompt;
- Manual or Roulette;
- Roulette supports Duel prompts;
- challenger selects timer;
- Duel cannot be Noped;
- subjective winner comes from eligible group vote;
- challenger and opponent cannot vote;
- tie/no votes -> no Duel winner;
- objective app-judgeable Duel may use backend decision only when prompt authority supports objective evaluation.

## 11.6 TAG

- actor selects another player;
- chosen player receives one immediate bonus Draw action during actor's turn;
- chosen player still retains their normal scheduled turn.

## 11.7 Truth or Chaos

- group correctness challenge;
- affected players answer independently;
- "same answer" means everyone answers correctly according to the authoritative prompt/evaluation;
- missed players enter the canonical Dare consequence flow as approved.

## 11.8 Nope

- do not restore the old broad Duel Nope window;
- eligibility for unresolved families must stay unresolved until owner decision.

---

# 12. Prompt and Roulette architecture

## 12.1 Engine versus content separation

The engine owns the flow:

```text
request prompt source
-> validate Manual/Roulette choice
-> receive authoritative prompt
-> establish prompt in active flow
-> collect answers/actions
-> resolve effect
```

The prompt service/domain owns:

- stored prompt records;
- eligibility filtering;
- Roulette candidate pool;
- moderation/content status;
- source provenance.

## 12.2 First playable milestone does not require a populated prompt DB

Until the content DB phase, use verified bundled canonical prompts or controlled fixtures to prove the flow.

Do not block game-engine completion on community content population.

---

# 12A. Audio and media architecture

## 12A.1 Permanent authority boundary

Audio is a media + presentation/content layer.

The game engine stays audio-blind except for canonical answer mode/completion facts and, where genuinely needed, the presence of an authorized media reference.

The engine must never depend on:

- microphone state;
- `MediaRecorder`;
- waveform/codec details;
- storage URLs;
- TTS/ASR/VAD provider identity;
- synthesis/transcription progress;
- whether a clip finished playing.

There is no authoritative `AUDIO_FINISHED` command. Playback ending never advances a turn or resolves an effect.

## 12A.2 Audio domains

Keep four concerns separate:

1. **Game SFX / music** - presentation-only assets such as card draw/play, Nope, Roulette ticks, timer warnings, win sounds. Ship from a versioned client catalog/static asset path; do not create DB rows per playback.
2. **System narration** - reusable host/system phrases. May be static or generated, but remains presentation.
3. **Prompt narration** - derived audio reading of canonical prompt text. If audio and text disagree, text wins.
4. **Player media** - explicit user-authored prompt recordings and any future explicitly approved stored answer recording.

## 12A.3 Object storage and authorization

Use an S3-compatible object-storage abstraction. Do not make game/domain code depend directly on one vendor.

Preferred scalable transfer model:

```text
Client -> Railway API: request bounded upload/playback authorization
Railway API: authenticate + authorize + choose object key + persist intent/metadata
Railway API -> Client: short-lived purpose-bound signed authorization
Client <-> Object Storage: direct byte transfer only for that authorization
Client -> Railway API: confirm/attach resulting media ID
```

Rules:

- no bucket credentials in clients;
- no permanent raw object URLs in game state;
- signed URLs expire;
- API remains authority for ownership, visibility, media ID, purpose, retention, and moderation;
- object storage carries bytes only.

## 12A.4 Canonical text rule

Every playable prompt keeps canonical text even if it has human audio or generated narration.

For recorded prompts:

```text
record -> upload -> validate/process -> transcribe -> user confirms/corrects -> canonical prompt text -> eligible prompt
```

ASR must not silently overwrite or become canonical prompt text.

## 12A.5 Privacy projection

Media visibility follows the same audience rules as prompt/answer text.

If a player cannot see a prompt, they must not receive:

- its media ID;
- signed playback URL;
- transcript;
- waveform;
- metadata that reveals sealed/private content.

Resolve expiring playback authorization at projection/API time rather than embedding raw URLs in canonical state.

## 12A.6 Voice answer privacy

Locked baseline:

- `Speak` does not automatically create a persistent recording.
- `Answered Live` stores completion only and never causes hidden recording.
- no always-on room microphone/background capture.
- future `Stored Voice Answer` is a separate explicit feature requiring room policy **and** the answering player's explicit per-submit consent.

Stored answer recording is not a v1 implementation requirement and remains blocked until explicitly approved.

## 12A.7 Prompt recording scope

Architecture must support:

- pregame room-contributed recorded prompts first;
- in-game manual Truth/Dare/Duel prompt recording later through the same media domain.

Session/manual recordings default to session-scoped retention unless explicitly saved into an approved library.

## 12A.8 TTS / transcription providers

Do not make a specific model/provider architectural authority.

Use adapters such as:

- `TtsProvider`
- `TranscriptionProvider`
- optional `VadProvider`

The old reference plan names Piper/Kokoro, whisper.cpp, and Silero as implementation candidates. Re-evaluate versions, licensing, quality, latency, and deployment footprint when the relevant MEDIA task begins.

Reference only:

`funmarket/cribbit-chaos/docs/audio-media-plan.md`

That old document is donor planning evidence, not CLEAN implementation authority.

## 12A.9 TTS caching

Prefer pre-generated narration for built-in/house prompts.

Cache identity should include at least:

- exact canonical text after safe Unicode/line-ending normalization;
- locale;
- voice key;
- provider/model ID;
- provider/model version;
- codec;
- synthesis-settings version.

Do **not** normalize away punctuation/case merely to force cache collisions; punctuation can affect prosody and meaning.

Generated narration is `regeneratable` media.

## 12A.10 Media processing and moderation

Upload processing is asynchronous and must not mutate game revision.

Possible pipeline:

```text
upload accepted
-> type/magic-byte validation
-> duration/size validation
-> transcode/normalize if required
-> optional speech-presence check
-> transcription when required
-> moderation/eligibility checks
-> ready / rejected / pending-review state
```

A processing failure must not corrupt the room/game. Text fallback remains available where the content is otherwise valid.

## 12A.11 Retention and orphan cleanup

At minimum support deterministic retention classes:

- `system_permanent`
- `regeneratable`
- `library_content`
- `session_temporary`
- future `sensitive_temporary`

Expired upload intents and unconsumed objects must be garbage-collected.

Prompt deletion/tombstoning should detach media and purge object bytes according to retention policy rather than leaving indefinite orphan storage.

## 12A.12 Web and Telegram UX

Both clients use the same media IDs/API permissions but own platform-specific:

- microphone permission UX;
- recording controls;
- autoplay unlock;
- audio session interruptions;
- playback/mute/volume behavior.

Text remains visible/usable when audio cannot play.

---

# 13. Bots

Bots use the same capabilities as humans.

Bot policy may choose among currently legal commands; it cannot bypass engine legality.

Bot execution flow:

```text
server projection/capabilities
-> bot policy chooses canonical command
-> same command service
-> same engine
-> same transaction
-> same outbox/deadlines
```

No bot-only game-state mutation path.

Bot tests must cover:

- ordinary play/draw;
- special-card target selection;
- forced-on-draw response;
- timer expiry/auto behavior where specified;
- no illegal command generation;
- deterministic seeded tests where randomness matters.

---

# 14. Timers and deadlines

Never rely on client timers for authoritative expiry.

Client countdown is display only.

Server deadline model:

1. engine/application produces a deadline requirement;
2. deadline row is persisted durably;
3. worker leases due row;
4. worker submits stable canonical timeout command;
5. command service checks current revision/state;
6. stale timeout becomes safe no-op/rejection;
7. successful timeout transition commits normally.

Duel uses challenger-selected timer according to canonical rules.

---

# 15. Outbox and realtime

## 15.1 Current development mode

Polling is acceptable while gameplay is being completed.

## 15.2 Production direction

Outbox is the durable bridge between committed game revisions and realtime notification.

Do not publish an authoritative update before the DB commit succeeds.

Potential later transport may be SSE/WebSocket or another simple mechanism, but transport does not own state.

Clients may receive a revision signal and fetch the latest authorized projection.

Do not introduce Redis solely to replace PostgreSQL outbox at early scale.

---

# 16. Web and Telegram presentation rules

## 16.1 Visual authority

Use the extracted old UI as the presentation source of truth.

Do not redesign the table to make implementation easier.

Preserve:

- player rail/seats;
- turn indicator;
- draw/discard area;
- hand;
- selected-card state;
- `PASS | REWIND | NOPE | DRAW` action bar;
- contextual play/color actions;
- status/connection panels;
- special-effect sheet;
- responsive desktop/tablet/mobile behavior;
- Web menus and simulation surfaces;
- Telegram-specific top/menu surfaces;
- canonical card artwork.

## 16.2 Client rules

Clients may:

- maintain local view/navigation state;
- collect form input;
- optimistically show non-authoritative loading/selection UX;
- submit commands;
- render server capabilities and projections.

Clients may not:

- decide card legality;
- advance turn;
- draw from a local deck;
- choose Roulette winner/prompt authoritatively;
- resolve special effects;
- declare winner;
- invent fallback sessions.

---

# 17. Simulation architecture

The simulation page is a harness, not an engine.

## 17.0 Owner lock - extracted simulation entry point

Owner decision recorded 2026-09-20:

- the exact old Web **Start simulated game** presentation/control is safe to extract and preserve;
- it is a simulation/harness entry point, not the live host start control;
- **Start simulated game** and **Start Game** must remain distinct in label, action, and event binding;
- extracted simulation presentation is allowed, but the old simulation runtime/engine is not production authority.

Canonical distinction:

```text
Start simulated game
  -> data-action="demo-game"
  -> simulation/harness path

Start Game
  -> data-action="start-game"
  -> authenticated live room/game start path
```

Never rename or repurpose the extracted simulation button into the live start button during rendering. Never attach overlapping simulation listeners to both an element ID and its simulation action.

### `SIM-000` - Simulation entry-point authority and duplicate-control repair

**Status:** `IN PROGRESS`

Source repair evidence:

- `3b2c2a5fc7f88e9092223de46f2012ad4445c623` - keeps the extracted **Start simulated game** control as `data-action="demo-game"` and introduces a separate live **Start Game** control;
- `47cc745ad3400aeaba29eba17336e16a0c7da7b1` - removes the duplicate ID-specific simulation listener and binds simulation controls through one action-based binder;
- `8b58c457a8c68d49db4e68822891fdf4be86b3a0` - adds regression assertions that the simulation label/action stays stable and the live start action remains separate.

Remaining proof before `SIM-000` may become `PASS`:

- exact-state CI on the final repair candidate;
- hosted browser proof that the button no longer flickers between **Start simulated game** and **Start Game**;
- hosted proof remains part of current `BASE-001`, so `BASE-001` remains the roadmap's `NEXT TASK`.


Target:

```text
Simulation UI
  -> create simulation room/session through canonical API
  -> add bot/human fixtures through approved application path
  -> start canonical game
  -> drive same command service
  -> render same projections
```

Simulation acceptance requires that a bug fixed in the simulation path fixes the real game because there is no separate state machine.

---

# 18. Security and production-hardening requirements

Before launch:

- canonical auth sessions replace random gameplay credentials;
- Telegram `initData` is validated server-side;
- auth token hashes are stored, not plaintext tokens;
- CORS is allowlisted from environment config, not `*` in production;
- room/game authorization checks membership and role;
- command IDs and revision checks prevent replay/duplicate mutation;
- secrets never enter client bundles;
- sensitive private hand/answer data is projection-scoped;
- rate limits/abuse controls are added at the API edge where needed;
- logs avoid secrets/private prompt answers unless explicitly required and protected;
- database application role uses least privilege;
- health endpoints do not expose credentials/schema secrets.

---

# 19. Observability and operations

Production readiness requires:

- structured API logs with request/correlation ID;
- game ID/command ID/revision in game-command logs;
- error classification without dumping secrets;
- health/readiness endpoints;
- worker lease/error metrics;
- DB connection pool metrics;
- deployment SHA/version exposed in a safe health/version endpoint;
- alertable failure signals for API crash loops, DB outage, deadline backlog, and outbox backlog;
- backup/restore plan for production PostgreSQL before real user data exists;
- documented rollback method for application deployment;
- forward-fix migration policy after production data begins.

---

# 20. Performance and scalability model

The game is turn-based and session-isolated.

Preferred early scaling model:

- one API service can run multiple replicas once stateless auth/session handling permits;
- PostgreSQL row/session transaction serialization protects each game independently;
- different games mutate concurrently;
- one game serializes authoritative commands by design;
- canonical state snapshot in JSONB is acceptable while bounded and validated;
- query indexes focus on active room/game lookup, command idempotency, due deadlines, and unpublished outbox rows;
- no infrastructure is added until profiling shows a real bottleneck.

Performance gates before launch should include:

- concurrent games test;
- reconnect/poll/realtime fanout test;
- command transaction contention test;
- deadline burst test;
- memory stability test for long-running API process.

---

# 21. Master completion roadmap

## PHASE 0 - Governance and living handoff

### `GOV-001` - Install canonical living handoff and agent contract

**Status:** `PASS`

Deliverables:

- this file;
- `AGENTS.md` pointing to this file and enforcing update discipline.

Gate:

- both files are present in Git;
- no unrelated source/deployment/database mutation.

---

## PHASE 1 - Baseline convergence and presentation freeze

### `BASE-001` - Exact-head hosted interaction proof

**Status:** `NOT STARTED`

Goal:

Prove current extracted old Web/Telegram presentation is connected to the clean API path at the exact candidate head.

Required proof:

- Web preview loads interactively;
- Telegram preview loads interactively in its supported context;
- create session;
- second player joins;
- host starts;
- 7-card hands visible correctly;
- draw works;
- ordinary legal play works;
- second client sees revision/state update;
- persisted revision survives refresh/reload;
- requests target the intended Railway API;
- no active client gameplay authority is observed;
- no critical console/network errors.

No code mutation is part of this task unless an exact failure is proven and a separate repair task is authorized.

### `BASE-002` - Reconcile PR #9 candidate metadata/evidence

**Status:** `NOT STARTED`

After `BASE-001` passes:

- update PR description to exact current head/evidence if stale;
- ensure CI evidence is for exact head;
- ensure hosted preview evidence is exact-head.

### `BASE-003` - Owner-approved merge/baseline establishment

**Status:** `BLOCKED`

Blocker:

- requires `BASE-001` and `BASE-002` PASS;
- merge requires explicit owner authorization at that time.

After authorized merge:

- record exact new accepted baseline SHA here;
- all future branches derive from that accepted baseline unless owner says otherwise.

---

## PHASE 1A - Repository governance and branch convergence

This phase prevents multiple agents from developing against different historical realities. Planning is authorized now; branch/PR cleanup remains gated.

### `REPO-000` - Branch-governance roadmap baseline

**Status:** `PASS`

Planning result:

- branch authority is explicitly recorded in this HANDOFF;
- `BASE-001` remains the current task;
- actual branch deletion, PR closure, merge, integration-branch movement, default-branch movement, or branch protection changes are **not** authorized by this planning task;
- future work uses `task/<TASK-ID>-<slug>` after the governance cutover is proven.

### `REPO-001` - Read-only branch and PR classification

**Status:** `BLOCKED`

Prerequisite:

- `BASE-001 PASS`.

Read-only deliverable:

For every live branch and open PR, classify it as exactly one of:

- `ACTIVE_AUTHORITY`
- `ACTIVE_BASE`
- `HISTORICAL_REFERENCE`
- `SUPERSEDED_SAFE_TO_CLOSE`
- `SUPERSEDED_SAFE_TO_DELETE_AFTER_APPROVAL`
- `PRESERVE_UNIQUE_WORK`
- `UNKNOWN/BLOCKED`

Required evidence:

- exact branch HEAD;
- upstream/base relationship;
- open PR relationship;
- whether commits/files exist only on that branch;
- whether any deployment or active environment still references it;
- whether its content is already represented in the accepted candidate.

This task performs no mutation.

### `REPO-002` - Close superseded PRs

**Status:** `BLOCKED`

Prerequisites:

- `REPO-001 PASS`;
- affected PRs classified `SUPERSEDED_SAFE_TO_CLOSE`;
- explicit owner authorization for the exact PR closures.

No branch deletion in this task.

### `REPO-003` - Establish canonical repository baseline

**Status:** `BLOCKED`

Prerequisites:

- `BASE-002 PASS`;
- `BASE-003 PASS` / owner-approved accepted UI baseline;
- exact candidate SHA verified;
- exact governance files verified on the accepted candidate.

Target state:

- `main` becomes the unambiguous accepted stable branch and contains current `AGENTS.md`, `HANDOFF.md`, `gamerules.md`, and accepted application state;
- default branch remains or becomes `main`;
- a new agent opening the repository root on the default branch immediately sees the live governance files;
- `integration/clean-rebuild` is either:
  - explicitly retained and advanced to a current integration role, or
  - formally retired from active-work authority;
- the chosen branch flow is recorded here before subsequent task branches are created.

Any merge, base movement, or shared-branch update requires its own explicit authorization and exact-state verification.

### `REPO-004` - Historical/superseded branch cleanup

**Status:** `BLOCKED`

Prerequisites:

- `REPO-001 PASS`;
- `REPO-003 PASS`;
- every target branch classified safe for removal;
- no active deployment/PR/tool references the target branch;
- explicit owner authorization for exact branch deletions.

Delete only branches proven redundant. Preserve branches containing unique work until that work is intentionally integrated or archived.

No force-push/history rewrite.

### `REPO-005` - Enforce branch/task workflow

**Status:** `BLOCKED`

Prerequisites:

- `REPO-003 PASS`.

Target rules:

- new feature/fix branches use `task/<TASK-ID>-<slug>`;
- each branch maps to one HANDOFF task;
- task branches start from the currently accepted base declared by the roadmap;
- PR titles/body identify the HANDOFF task ID;
- `main` accepts reviewed/gated candidates, not ad hoc feature commits;
- branch protection/status-check policy is added only if separately authorized and configured against the actual CI workflow;
- HANDOFF branch authority registry is updated whenever the active task branch or accepted baseline changes.

Acceptance:

A new agent with no chat history can open the default branch, read `AGENTS.md` and `HANDOFF.md`, identify the accepted baseline, active task, active branch/PR, and next task without inspecting historical branches.

---

## PHASE 2 - Database authority and environment cleanup

### `DB-001` - Final schema design and migration-authority decision

**Status:** `NOT STARTED`

Read-only/design task first.

Deliverable:

- exact final table names;
- one migration directory;
- one migration runner;
- mapping from current P6/newer tables to target tables;
- proof there is no production user/prompt data preservation requirement;
- explicit treatment of any test game/session rows;
- rollback/recovery plan for prelaunch reset;
- media-schema contract: `media_assets`, `prompt_media`, upload-intent/orphan-cleanup model, transcription evidence model, retention classes, room media policy, and playback/user preference boundary;
- object-storage abstraction and authorization boundary without provisioning storage yet.

No DB or object-storage mutation in this task.

### `DB-002` - Railway staging/production environment topology

**Status:** `NOT STARTED`

Target:

- explicit Railway staging environment + staging DB;
- explicit Railway production environment + production DB;
- API in each environment points only to its matching DB.

Before mutation:

- verify current project/services/environments;
- verify current data classification;
- verify exact branch/artifact target;
- obtain mutation authorization.

### `DB-003` - Consolidate schema to one canonical model

**Status:** `BLOCKED`

Prerequisites:

- `DB-001 PASS`
- `DB-002` target known
- explicit DB mutation authorization

Required result:

- one schema family;
- one migration chain;
- old duplicate schema path removed from application ownership;
- migration tests green against PostgreSQL 16;
- app store/adapters use final tables only.

### `DB-004` - Persistence integration tests

**Status:** `NOT STARTED`

Must prove:

- create room/session persistence;
- unique membership/seat behavior;
- command idempotency;
- same-revision concurrent writer serialization;
- rollback on partial failure;
- outbox atomicity;
- deadline leasing;
- reconnect reads current projection/state;
- migration from clean empty DB succeeds deterministically.

---

## PHASE 3 - Identity, room, and game lifecycle

### `LIFE-001` - Canonical authentication path

**Status:** `IN PROGRESS`

**Source evidence:** candidate `11e7ef29be068a1a16cfc2f26e061fedb04072f0`; exact-state CI run `35531377108` PASS.

Implemented in source: Web guest/password session authentication, Telegram initData authentication, canonical `users.id` resolution, shared server auth context, logout/revocation basics, and removal of random per-game credentials as the active game principal.

Remaining before PASS: live database migration/verification, accepted API deployment, hosted auth proof, and complete canonical user/profile projection as the product identity surface expands.

Wire:

- Web authentication identity;
- Telegram authentication identity;
- guest auth only if intentionally retained;
- canonical `users.id` resolution;
- auth session lookup;
- user projection;
- logout/revocation basics.

Remove ad hoc random gameplay credential authority after canonical path is proven.

### `LIFE-001A` - Cross-client account linking and identity continuity

**Status:** `IN PROGRESS`

**Source evidence:** candidate `11e7ef29be068a1a16cfc2f26e061fedb04072f0`; `tests/cross-client-identity.test.mjs` PASS inside CI run `35531377108`.

Implemented in source: explicit expiring link-code flow, verified Telegram initData claim, unique provider ownership, Web/Telegram conflict rejection, same canonical `users.id` resolution, and same active game-seat recovery across linked transports.

Remaining before PASS: hosted account-linking proof, auditable unlink lifecycle, and continuity proof for profile/rooms/library/history after those persistent domains exist.

Implement:

- secure linking of an additional Web/Telegram provider identity to an already authenticated canonical user;
- proof of control over both sides of the link;
- unique provider-identity ownership;
- no display-name/email heuristic auto-merge;
- auditable link/unlink lifecycle;
- same canonical profile/rooms/library/history/active-game lookup from either linked frontend;
- duplicate-user collision handling that fails closed rather than silently moving an identity.

Acceptance:

- one person proves Web and Telegram identities and both resolve to the same `users.id`;
- switching frontend does not duplicate `room_members` or `game_players`;
- unlinking one provider does not delete the canonical user's shared product data.

### `LIFE-002` - Room domain

**Status:** `NOT STARTED`

Implement:

- create room;
- join by code;
- durable room membership;
- host role;
- seat ordering;
- room projection;
- reconnect;
- leave/closed semantics as specified.

### `LIFE-003` - Room -> GameSession start boundary

**Status:** `NOT STARTED`

On host start:

- validate host and start eligibility;
- snapshot eligible room members into game players;
- build canonical CHAOS-133-V1 deck server-side;
- deal exactly 7 cards per player;
- create canonical game state + revision atomically;
- link room to game;
- return player-specific projection.

### `LIFE-004` - Rematch/new-game lifecycle

**Status:** `NOT STARTED`

Room may survive game completion.

Design/implement clean rematch/new game without reusing stale game state.

---

## PHASE 4 - Core engine salvage

### `ENG-001` - Donor mechanics matrix

**Status:** `NOT STARTED`

Create a permanent in-handoff or approved docs matrix mapping:

- mechanic;
- donor source;
- donor tests;
- current clean support;
- current rule ID;
- owner supersession/conflict;
- port action.

This task is read-only classification.

### `ENG-002` - Core legality and matching

**Status:** `NOT STARTED`

Port/adapt tested donor legality where compatible.

Must cover:

- number matching;
- color/value/type matching as canonical rules require;
- Wild behavior;
- invalid play rejection;
- capability projection.

### `ENG-003` - Turn/direction/simple effects

**Status:** `NOT STARTED`

Implement/test:

- normal turn progression;
- Skip;
- Reverse;
- Draw ordinary effect semantics once unresolved portions are owner-resolved;
- Wild color choice;
- multi-player edge cases;
- two-player Reverse behavior according to rules.

### `ENG-004` - Deck/draw/discard/recycle invariants

**Status:** `NOT STARTED`

Must prove:

- exact 133-card physical inventory;
- unique card instance conservation;
- 7-card initial hands;
- draw path;
- discard path;
- recycle/shuffle behavior if required;
- no invented color metadata for non-colored families;
- canonical deck counts only.

### `ENG-005` - Winner/continuation boundary

**Status:** `NOT STARTED`

Winner can only be declared when canonical continuation/effect obligations permit it.

Test final-card interactions with forced effects/refusal penalties and unresolved special boundaries.

---

## PHASE 5 - Forced-on-draw and social mechanics

Port one family at a time. Each family requires focused tests + full verify before the next.

### `SOC-001` - Forced-on-draw dispatcher and FIFO continuations

**Status:** `NOT STARTED`

Implement authoritative forced set and deterministic FIFO consequence handling.

### `SOC-002` - Truth

**Status:** `NOT STARTED`

Target-first corrected flow, Manual/Roulette, answer modes, Pass/Not for Me penalty ordering.

### `SOC-003` - Dare

**Status:** `NOT STARTED`

Target-first corrected flow. Do not guess unresolved refusal details.

### `SOC-004` - Paranoia

**Status:** `NOT STARTED`

Port approved Classic/Stranger behavior with target-first semantics where canonical.

### `SOC-005` - Duel

**Status:** `NOT STARTED`

Shared prompt, challenger timer, no Nope, participant exclusions, group vote, tie/no-vote rule, objective-prompt authority path.

### `SOC-006` - Chaos

**Status:** `NOT STARTED`

Port only locked catalogue/effects. Keep unresolved weights/extra catalogue unresolved.

### `SOC-007` - TAG

**Status:** `NOT STARTED`

Immediate bonus draw for selected player without consuming their normal scheduled turn.

### `SOC-008` - Hijack

**Status:** `NOT STARTED`

Respect final-card boundary unresolved status until owner decision.

### `SOC-009` - Taboo

**Status:** `NOT STARTED`

Respect timeout unresolved status until owner decision.

### `SOC-010` - Machiavelli and six-choice sub-effects

**Status:** `NOT STARTED`

Separate handler per sub-effect where practical.

### `SOC-011` - Reverse Confession

**Status:** `NOT STARTED`

Target-first correction; do not invent unresolved downstream response/resolution.

### `SOC-012` - DIG ME

**Status:** `NOT STARTED`

Respect unresolved refusal semantics.

### `SOC-013` - Truth or Chaos

**Status:** `NOT STARTED`

Group correctness challenge and Dare consequence flow. Preserve unresolved group-Dare details.

### `SOC-014` - Ghost / remaining canonical special families

**Status:** `NOT STARTED`

Implement only locked semantics.

### `SOC-015` - Nope / Rewind / Pass / Flag controls

**Status:** `NOT STARTED`

Implement according to narrow canonical eligibility and prompt existence.

---

## PHASE 6 - Prompts, Roulette, bots, timers

### `SYS-001` - Prompt-source abstraction

**Status:** `NOT STARTED`

Manual/Roulette source selection returns authoritative prompt objects to engine flows.

### `SYS-002` - Roulette eligibility/filtering

**Status:** `NOT STARTED`

Include Duel support and type-specific filtering. Deterministic tests use seeded RNG.

### `SYS-003` - Pre-game custom prompt creator

**Status:** `NOT STARTED`

Support approved Truth/Dare/Duel custom content without making clients authoritative.

### `SYS-004` - Bot capabilities and policy port

**Status:** `NOT STARTED`

Salvage donor bot/capability tests, adapt to corrected special rules.

### `SYS-005` - Automatic bot turn execution

**Status:** `NOT STARTED`

Server schedules/executes through canonical command path.

### `SYS-006` - Deadline/timer completion

**Status:** `NOT STARTED`

Connect authoritative timed effects to durable deadline worker.

---

## PHASE 6A - Audio/media implementation

Audio/media is deliberately staged. It must shape the schema before schema freeze, but feature implementation must wait for its dependencies.

### `MEDIA-000` - Audio/media roadmap baseline

**Status:** `PASS`

Planning result:

- media is separated from game authority;
- canonical prompt text remains authoritative;
- bytes belong in object storage, metadata in PostgreSQL;
- upload/playback uses short-lived API-issued authorization;
- provider-specific TTS/ASR/VAD stays behind adapters;
- Speak/Answered Live do not silently persist recordings;
- `BASE-001` remains the current execution task.

No audio source, database, object-storage, worker, deployment, or gameplay mutation was performed by this planning task.

### `MEDIA-001` - Media architecture and schema lock

**Status:** `NOT STARTED`

Timing:

Perform as part of/alongside `DB-001` **before the canonical schema is frozen**.

Deliverables:

- exact media table names/constraints;
- retention classes;
- object-storage adapter contract;
- signed upload/playback authorization contract;
- prompt-media relation;
- transcription-confirmation flow;
- room media policy versus user/device playback preference boundary;
- privacy projection requirements;
- orphan cleanup lifecycle.

No provider provisioning or feature implementation in this task.

### `MEDIA-002` - Media persistence and object-storage foundation

**Status:** `BLOCKED`

Prerequisites:

- `DB-001 PASS`
- canonical schema consolidation path approved/applied as appropriate;
- `LIFE-001` authentication authority available;
- explicit authorization for object-storage/environment mutation.

Implement:

- media metadata repository;
- upload-intent lifecycle;
- S3-compatible object-storage adapter;
- short-lived signed upload/playback authorization;
- attach/consume flow;
- cleanup of expired/unconsumed uploads;
- no engine dependency.

### `MEDIA-003` - Game SFX / playback foundation

**Status:** `NOT STARTED`

Timing:

During full client wiring after the exact presentation baseline is stable.

Implement:

- versioned SFX catalog;
- playback/mixer abstraction;
- SFX/music/narration volume controls;
- mute;
- Web/Telegram autoplay-unlock behavior;
- no game-state mutation from playback.

No per-play database event logging.

### `MEDIA-004` - Prompt narration

**Status:** `BLOCKED`

Prerequisites:

- `SYS-001` prompt-source abstraction;
- canonical prompt persistence/content model;
- `MEDIA-002`.

Implement:

- provider-neutral TTS adapter;
- pre-generation for built-in/house prompts;
- versioned cache key;
- privacy-aware media projection;
- text-first fallback;
- narration failure never blocks rule resolution.

### `MEDIA-005` - Pregame voice prompt recording

**Status:** `BLOCKED`

Prerequisites:

- `LIFE-001` canonical identity;
- `LIFE-002` room membership;
- `SYS-003` pregame custom prompt flow;
- `MEDIA-002`.

Implement:

- explicit microphone capture;
- signed bounded upload;
- validation/transcode;
- transcription;
- user transcript confirmation/correction;
- canonical `prompts.text`;
- `prompt_media` relation;
- room policy;
- moderation/eligibility state;
- retention/orphan cleanup.

### `MEDIA-006` - In-game manual voice prompt recording

**Status:** `BLOCKED`

Prerequisites:

- `MEDIA-005 PASS`;
- Manual Truth/Dare/Duel flows complete;
- privacy projection complete.

Reuse the same media path. Do not create a second recording subsystem.

Default one-off manual recordings to session-scoped retention unless an explicit save-to-library action is later approved.

### `MEDIA-007` - Stored voice answers

**Status:** `BLOCKED`

Product/privacy decision required.

Baseline remains:

- Speak = live, not automatically stored;
- Answered Live = completion only;
- no hidden recording.

If later approved, stored answer audio must require explicit per-submit player consent, short retention by default, and separate projection/privacy tests.

### `MEDIA-008` - Audio/media end-to-end and failure matrix

**Status:** `BLOCKED`

Run after the implemented media features are complete.

Must cover:

- Web microphone permissions;
- Telegram microphone permissions;
- autoplay restrictions;
- expired upload URL;
- expired playback URL;
- interrupted upload;
- orphan cleanup;
- unsupported MIME;
- over-duration/over-size;
- transcription failure;
- TTS unavailable;
- object storage unavailable;
- private/sealed prompt media leakage prevention;
- deleted/tombstoned media;
- reconnect during playback/recording;
- text fallback;
- no game advancement on audio completion.

---

## PHASE 7 - Full client wiring

### `UI-001` - Lobby/Room Web wiring

**Status:** `NOT STARTED`

Exact old Web presentation, canonical room API.

### `UI-002` - Game table Web wiring

**Status:** `NOT STARTED`

Remove fixture-only gaps. All controls reflect server capabilities.

### `UI-003` - Special-effect Web sheets/modals

**Status:** `NOT STARTED`

Truth/Dare/Paranoia/Duel/etc. exact old presentation where available, clean data/control wiring underneath.

### `UI-004` - Telegram room/game wiring

**Status:** `NOT STARTED`

Same canonical server state, Telegram-specific shell/presentation.

### `UI-005` - Answer modes

**Status:** `NOT STARTED`

Support Speak/record UX, Type, Choose where options exist, Answered Live, Pass/Not for Me according to canonical flow.

### `UI-006` - Connection/reconnect states

**Status:** `NOT STARTED`

Visible status, safe retries, no duplicate command mutation.

### `UI-007` - Responsive/accessibility parity

**Status:** `NOT STARTED`

Desktop/tablet/mobile + readable light/dark modes + keyboard/touch semantics.

---

## PHASE 8 - Simulation as canonical harness

### `SIM-001` - Replace fixture simulation with canonical API sessions

**Status:** `NOT STARTED`

Simulation creates real clean sessions and renders real projections.

### `SIM-002` - Multi-bot scenario harness

**Status:** `NOT STARTED`

Parameterized players/bots, deterministic seeds, accelerated timers where test-only configuration permits.

### `SIM-003` - Rule scenario library

**Status:** `NOT STARTED`

Reproducible scenarios for every special family and major continuation edge.

---

## PHASE 9 - Realtime and production hardening

### `PROD-001` - Outbox publication transport

**Status:** `NOT STARTED`

Introduce simple realtime notification only after gameplay stability. Polling remains fallback transport only if explicitly retained, never state authority.

### `PROD-002` - CORS/origin/security hardening

**Status:** `NOT STARTED`

No wildcard production CORS. Validate auth, membership, role, input sizes, rate limits, and secret boundaries.

### `PROD-003` - Observability

**Status:** `NOT STARTED`

Structured logs, health/version endpoint, worker backlog visibility, safe metrics.

### `PROD-004` - Backup/restore and migration runbook

**Status:** `NOT STARTED`

Prove staging backup/restore before production data launch.

### `PROD-005` - Performance/concurrency testing

**Status:** `NOT STARTED`

Prove multiple concurrent games, command contention safety, deadline bursts, and sustained process stability.

---

## PHASE 10 - Full-system acceptance

### `ACC-001` - Complete gameplay matrix

**Status:** `NOT STARTED`

Every locked card family and rule flow has automated coverage.

### `ACC-002` - Web end-to-end

**Status:** `NOT STARTED`

Real hosted staging flow from auth -> room -> game -> multiple mechanics -> winner -> reconnect/rematch.

### `ACC-003` - Telegram end-to-end

**Status:** `NOT STARTED`

Equivalent hosted Mini App proof.

### `ACC-004` - Cross-client game

**Status:** `IN PROGRESS`

**Automated source/integration evidence:** candidate `11e7ef29be068a1a16cfc2f26e061fedb04072f0` proves a Web-authenticated player and a different Telegram-authenticated player can occupy the same game through the same API/engine state and observe the same revision with private-hand isolation.

**Remaining:** hosted Web + Telegram proof against the same deployed API and canonical database.

Prove one player on Web + one player on Telegram can share the same room and game through the same API/engine/database authority.

Required evidence:

- same room membership model;
- same game session/revision;
- correct player-specific private hands;
- accepted command from either frontend becomes visible to the other through the same canonical revision;
- no client-specific game-rule path.

### `ACC-004A` - Same-person cross-client identity continuity

**Status:** `IN PROGRESS`

**Automated source/integration evidence:** candidate `11e7ef29be068a1a16cfc2f26e061fedb04072f0` proves Web identity + linked Telegram identity resolve to the same canonical `users.id` and recover the same active game-player seat.

**Remaining:** hosted proof plus same profile, room history, saved prompts/library, and history continuity after those persistent product domains are implemented.

Using one securely linked canonical account, prove:

- Web login and Telegram login resolve to the same `users.id`;
- same profile;
- same room memberships;
- same saved prompts/library;
- same history;
- same active game;
- same human game-player seat/private hand when moving between clients;
- no duplicate Web user/Telegram user is created.

### `ACC-005` - Production release candidate

**Status:** `BLOCKED`

Requires all earlier launch-critical tasks PASS on one exact SHA.

---

## PHASE 11 - Launch

### `LAUNCH-001` - Production database baseline

**Status:** `BLOCKED`

Apply exact tested migrations to production only with explicit launch authorization.

### `LAUNCH-002` - Production API release

**Status:** `BLOCKED`

Deploy exact accepted candidate, verify version/health/database binding.

### `LAUNCH-003` - Web and Telegram production promotion

**Status:** `BLOCKED`

Promote exact matching client candidate with production API configuration.

### `LAUNCH-004` - Production smoke

**Status:** `BLOCKED`

Create real smoke room/game, verify logs/metrics/no errors, then close smoke data according to runbook.

---

# 22. Definition of Done by work type

## 22.1 Source task

A source task is not done until:

- intended source changed only in authorized scope;
- focused tests pass;
- `npm run verify` passes when required by the task;
- exact diff is inspected;
- exact SHA is recorded;
- this handoff is updated.

## 22.2 Database task

A DB task is not done until:

- target environment/database is verified immediately before mutation;
- exact migration set is reviewed;
- backup/recovery requirement is satisfied;
- migration runs successfully;
- schema is read back;
- application integration tests pass;
- this handoff records resulting migration/version state.

## 22.3 Deployment task

A deployment task is not done until:

- exact candidate SHA is known;
- environment/service target is known;
- deployment completes;
- live version is read back;
- health/smoke proof passes;
- logs show no new critical failure;
- this handoff records deployment IDs/URLs/evidence.

## 22.4 Rule task

A rule task is not done until:

- applicable canonical `RULE-*` authority is identified;
- owner supersessions are explicitly represented;
- unresolved details remain unresolved;
- focused behavior tests pass;
- no parallel rule implementation exists;
- this handoff records evidence.

---

# 23. Task execution template for every agent

Copy this structure into the agent's working notes (not the repository unless updating this handoff):

```text
TASK ID:
GOAL:
CURRENT BRANCH:
START SHA:
AUTHORITATIVE RULE/DOC:
ALLOWED TARGETS:
FORBIDDEN TARGETS:
PREREQUISITES:
LIVE FACTS VERIFIED:
MUTATION:
FOCUSED TESTS:
FULL GATES:
RESULT SHA:
CI RUN:
RUNTIME/DEPLOYMENT EVIDENCE:
HANDOFF UPDATE:
NEXT TASK / BLOCKER:
```

---

# 24. Live Execution Ledger

Agents append concise evidence rows. Do not turn this into a chat transcript.

| Date | Task | Status | Candidate / Evidence | Notes |
|---|---|---|---|---|
| 2026-09-20 | GOV-001 | PASS | `HANDOFF.md` commit `129450ea2edb842c9b3363947a865f869305d3a8`; `AGENTS.md` commit `112b2a49c084c499488be42520836e4555058d29` | Both governance files read back on the active branch. No gameplay/DB/deploy/merge mutation occurred. |
| 2026-09-20 | BASE-001 | NOT STARTED | Exact-head hosted interaction evidence required | This is the next roadmap task. |
| 2026-09-20 | MEDIA-000 | PASS | Audio/media architecture incorporated into the living roadmap | Planning only. No audio source, DB, object-storage, worker, deploy, merge, or gameplay mutation; BASE-001 remains NEXT TASK. |
| 2026-09-20 | REPO-000 | PASS | Branch-governance registry and post-BASE-001 cleanup roadmap added | Planning only. No branch deletion, PR closure, merge, branch movement, deployment, or source mutation; BASE-001 remains NEXT TASK. |
| 2026-09-20 | SIM-000 | IN PROGRESS | Source repair commits `3b2c2a5f` -> `47cc745a` -> `8b58c457` | Owner confirmed **Start simulated game** is safe to extract. Source paths are separated; exact-state CI + hosted no-flicker proof still required. BASE-001 remains NEXT TASK. |
| 2026-09-20 | ARCH-001 | PASS | Single Product / Cross-Client Identity Invariant added to HANDOFF | Owner locked Web and Telegram as presentation adapters over the same canonical user/identity/room/game/prompt/permissions/API/engine/PostgreSQL authority. No source, DB, deployment, branch, or NEXT TASK change. |
| 2026-09-20 | LIFE-001 / LIFE-001A / ACC-004 / ACC-004A | IN PROGRESS | Source convergence candidate `11e7ef29be068a1a16cfc2f26e061fedb04072f0`; CI run `35531377108` PASS | Shared canonical user/auth/game principal path and automated cross-client identity/game proof implemented. No Railway DB migration, API deployment, merge, or production activation performed. `BASE-001` remains NEXT TASK. |

---

# 25. Known blockers / unresolved decisions registry

Keep these visible; do not silently choose defaults.

Current known unresolved rules include items already recorded by the canonical rule registry, including but not limited to:

- Draw turn-loss detail;
- Taboo timeout;
- Hijack final-card boundary;
- TAG nesting;
- Truth or Chaos group-Dare refusal/instigator participation details;
- some Chaos weights/extra behavior;
- Ghost penalty details;
- DIG ME refusal;
- Reverse Confession downstream response/resolution;
- Nope eligibility for unresolved families;
- Pulse tuning;
- any later owner-marked unresolved clause.

Operational blockers currently visible:

- current exact-head hosted interaction proof for UI extraction;
- source migration authority is now consolidated on candidate `11e7ef29be068a1a16cfc2f26e061fedb04072f0`, but the intended live Railway database has **not** been migrated or verified against that canonical schema;
- Railway API currently references the service named staging DB while running inside the environment named production;
- no canonical merged post-UI-extraction baseline yet;
- full donor engine port is not present remotely;
- current architecture documentation elsewhere may describe older phases and must be reconciled as its relevant phase is reached;
- repository branch authority remains transitional: `main` and `integration/clean-rebuild` are behind current active work, PR #9 is open, PR #8 is still open, and multiple historical/superseded branches remain until `REPO-001` classifies them.

Audio/media product locks still requiring explicit later decision before the affected feature is implemented:

- final production TTS provider/model/voice choices;
- final ASR/VAD implementation choices;
- exact media size/duration limits;
- exact retention windows per media class;
- whether in-game manual voice prompt recording is launch-critical or post-launch;
- whether stored voice answers are ever enabled (currently blocked/not required for v1).

---

# 26. What not to do

Agents must not:

- restart the clean rebuild from zero;
- replace the extracted old UI with a new design;
- import the old runtime wholesale;
- restore multiple game authorities;
- create separate Web and Telegram user/account domains for the same product;
- create separate Web and Telegram room, game, prompt-library, history, permissions, or command authorities;
- let frontend platform identity replace canonical `users.id` as durable product ownership;
- auto-merge canonical accounts based only on matching names/emails without proof of identity ownership;
- add a second database schema instead of replacing/consolidating the old one;
- perform production resets because the app is fresh without explicit task authorization;
- treat stale CI as proof for a new SHA;
- mark a task PASS from source inspection alone when behavioral evidence is required;
- silently implement unresolved game rules;
- add infrastructure because it is fashionable;
- merge/deploy merely because the next step seems obvious;
- commit temporary controller/scratch artifacts;
- continue coding when a live contradiction makes the current task ambiguous.

---

# 27. End-state checklist

The project can be called complete only when all boxes are genuinely supported by exact-state evidence:

- [ ] Default branch exposes current AGENTS/HANDOFF governance
- [ ] Accepted stable branch and active task-branch workflow are unambiguous
- [ ] Superseded PRs/branches are classified and safely retired or preserved
- [ ] New work uses task/<TASK-ID>-<slug> branch naming
- [ ] Canonical identity/auth in production
- [ ] Web + Telegram provider identities can securely map to the same canonical users.id
- [ ] Same-person Web/Telegram account linking and unlinking is proven without heuristic auto-merge
- [ ] Room/game/content ownership references canonical users.id rather than platform identity
- [ ] Web and Telegram share one room/game/prompt/library/history/permissions authority
- [ ] Switching a linked active player between Web and Telegram preserves the same game seat and private hand
- [ ] Canonical Room lifecycle
- [ ] Canonical Room -> Game start boundary
- [ ] One clean PostgreSQL schema/migration chain
- [ ] Staging/production isolated correctly
- [ ] Full CHAOS-133-V1 deck verified
- [ ] Ordinary mechanics complete
- [ ] All locked special mechanics complete
- [ ] Owner corrections represented and tested
- [ ] Forced-on-draw FIFO complete
- [ ] Bots complete
- [ ] Timers/deadlines complete
- [ ] Manual/Roulette prompts complete
- [ ] Media schema/object-storage authorization path complete
- [ ] Game SFX/audio preferences complete on Web and Telegram
- [ ] Prompt narration complete with text fallback and privacy projection
- [ ] Pregame prompt recording complete with transcript confirmation
- [ ] Media retention/orphan cleanup proven
- [ ] In-game manual voice prompt recording complete if retained in launch scope
- [ ] Web exact UI fully wired
- [ ] Telegram exact UI fully wired
- [ ] Simulation uses canonical engine
- [ ] Cross-client synchronization proven
- [ ] Reconnect/idempotency proven
- [ ] Outbox/realtime production path proven if enabled
- [ ] Security hardening complete
- [ ] Observability complete
- [ ] Backup/restore tested
- [ ] Performance gates pass
- [ ] Full CI green on release SHA
- [ ] Hosted Web E2E passes
- [ ] Hosted Telegram E2E passes
- [ ] Cross-client E2E passes
- [ ] Production smoke passes
- [ ] No active legacy/parallel authority remains

---

# 28. Final project principle

The historical Cribbit app already proved the product presentation and much of the game design. The clean repository already proves the architectural foundation.

The remaining engineering job is not to reinvent either side.

It is to complete one authoritative path:

```text
Owner-approved rules
       +
Verified old product presentation/mechanics evidence
       v
Clean pure game engine
       v
Clean application command handlers
       v
One clean PostgreSQL schema
       v
Railway API
       v
Shared API client
       v
Exact Web / Telegram presentation
```

Every task in this roadmap exists to move the project closer to that single path without creating a second one.
