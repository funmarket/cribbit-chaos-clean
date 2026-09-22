# Cribbit CHAOS - Canonical Whole-Product Scope

> **Purpose:** define the complete Cribbit CHAOS product that CLEAN is rebuilding.
>
> This document owns product scope, product-surface classification, preservation rules, and change-authority principles. It does **not** replace `gamerules.md` for gameplay semantics and it does not turn old flyers/bibles into current requirements.

Cribbit CHAOS CLEAN is **not a new game and not a board-only rewrite**.

The mission is:

> **Same Cribbit game, same verified product experience and working flows - rebuilt cleaner underneath with one authority path.**

---

## 1. Product identity

Cribbit CHAOS is a multiplayer shedding card game wrapped in a persistent social-content application.

The retained product includes, where verified/approved:

- the canonical CHAOS-133-V1 physical card game;
- Web and Telegram as two adapters for the same application;
- canonical accounts, profiles, and preferences;
- rooms, membership, host controls, and persistent group context;
- Tonight's CHAOS room/content configuration;
- CHAOS Board discovery;
- My Saved Deck;
- House Deck / recurring private group content;
- Live Room Pool;
- player-created prompts;
- authorship/reveal modes;
- content moderation and flags;
- explicit Call Mode answer interaction;
- safety/consent controls;
- Recap, Save That, Resolved Moments, and group history/memory;
- application shell features such as search/notifications where retained;
- Local QA Simulation / Rules Lab over the same canonical engine.

A working game table is necessary but **not sufficient** for product completion.

---

## 2. Authority is domain-specific

Do not use one source as universal authority.

### 2.1 Gameplay semantics

Order of authority:

1. explicit current owner decisions and supersessions;
2. `gamerules.md` and its permanent `RULE-*` clauses;
3. current clean rule/provenance documents where non-conflicting;
4. donor implementation/tests as behavioral evidence;
5. early Game Bible/flyers/mockups as ideas/history only.

Old runtime behavior, artwork wording, or marketing copy never overrides a later canonical rule.

### 2.2 UI/UX and evolved product flow

Order of authority:

1. explicit current owner UI/UX decisions;
2. verified evolved donor application in `funmarket/cribbit-chaos`;
3. exact extracted donor presentation already carried into CLEAN;
4. early Game Bible/flyers/mockups as non-authoritative ideation evidence.

The donor app remains the primary reference for what already worked visually and behaviorally. CLEAN should extract/reuse it rather than redesigning it.

### 2.3 Product feature scope

Use:

1. explicit current owner product decisions;
2. verified donor application surfaces/workflows;
3. this document and current HANDOFF decisions;
4. early bibles/flyers as discovery material only.

A flyer can reveal a missing idea. It does not silently become a requirement.

### 2.4 Operational facts

GitHub, Railway, Cloudflare, databases, CI, branches, and deployments are authoritative only when freshly verified from their live systems.

---

## 3. Whole-app surface map

Every retained surface must have a CLEAN owner, API/persistence decision where durable state is involved, Web behavior, Telegram behavior where applicable, and verification evidence.

### 3.1 Application shell

Responsibilities include:

- top/mobile navigation;
- authentication/account entry;
- profile/preferences entry;
- global search;
- notifications;
- connection/runtime status;
- responsive/light/dark/accessibility behavior.

These are application-shell concerns, never game-engine authority.

### 3.2 Homepage / Lobby

Distinct paths:

- **Create a game** -> room creation/configuration;
- **Create Live Game** -> shared backend room/session path;
- **Local QA Simulation** -> test/QA path only, never a second product engine;
- **Join Live Room** -> joins the same backend room used by Web/Telegram.

### 3.3 Room creation

Room setup may include retained donor concepts such as:

- profile/display context;
- Clean CHAOS / Adult CHAOS content world;
- personal content ceiling/preferences;
- room name;
- player-count/mode presentation;
- prompt/content source eligibility;
- room configuration that governs the intended session.

A Room exists before a GameSession and must not own card-rule transitions.

### 3.4 Tonight's CHAOS

Host/session-content control surface:

- source mix such as Original / Community / House / Live;
- vibe/intensity range;
- categories;
- eligible prompt pool;
- Live Room Pool preview;
- add/remove content eligibility;
- apply room setup.

Exact policy belongs to Room + Content domains, not frontend-only state.

### 3.5 CHAOS Board

Discoverable content hub:

- Cribbit Originals;
- approved Community CHAOS;
- search/filter/category views;
- source/world/player-count metadata;
- discovery views where retained;
- Save;
- Add to Room;
- Details;
- Suggest/Create Prompt entry.

Community content is moderated. Clients do not self-approve content.

### 3.6 Library

Distinct ownership/lifecycle models:

- **My Saved Deck** - private canonical-user favorites;
- **House Deck** - recurring private group/friend-household content;
- **Live Room Pool** - prompts eligible for the current room/session setup;
- **Resolved Moments** - prompts/moments that actually occurred.

Do not collapse these into one generic bookmark collection if their ownership differs.

### 3.7 Create Prompt

One authoring experience may target:

- My Saved Deck;
- House Deck;
- Current Game / Live Room Pool;
- Suggest to CHAOS Board.

Prompt metadata may include currently approved fields such as:

- prompt family/type;
- text;
- authorship/reveal mode;
- category;
- content world;
- intensity/stage;
- player-count bounds;
- tags;
- attribution preference.

Exact authorable families/fields must remain compatible with `gamerules.md` and moderation policy.

### 3.8 Authorship and moderation

Product concepts include:

- Signed;
- Reveal After;
- Taboo/anonymous-to-peers behavior where current rules permit;
- internal creator identity retained for safety/moderation;
- moderation state for public submissions;
- flags/reports;
- duplicate/quality/safety checks where retained.

Sealed/private authorship must never leak because a frontend can access the row.

### 3.9 Active game

GameSession owns:

- canonical deck/hands/discard;
- game seats;
- turn/direction/revision;
- command idempotency;
- effects/continuations/deadlines;
- authoritative prompt result supplied into game flows;
- winner boundary.

Web and Telegram submit the same canonical commands and render authorized projections.

### 3.10 Call Mode / explicit answer interaction

Call Mode is a first-class product surface.

Core invariant:

> **Passive conversation is never gameplay input.**

Only explicit actions count, such as:

- Speak/record when explicitly started;
- Type;
- Choose where options exist;
- Answered Live;
- explicit review/submit/completion actions.

Ambient audio, call state, TTS playback, or ASR completion never advances canonical gameplay by itself.

### 3.11 Safety and consent

Current product concepts include:

- personal content ceiling/preferences;
- Pass / Not for Me where rules permit;
- Rewind;
- Nope under current narrow eligibility;
- Flag/Report;
- moderation/safeguard handling.

UI labels never broaden gameplay eligibility beyond canonical rules.

### 3.12 Recap / Save That / history

A completed game may produce:

- winner/Chaos Champ recap;
- stats/flavor;
- resolved social moments;
- voluntary sharing;
- Save That actions;
- save to My Saved Deck;
- save to House Deck when authorized;
- suggest content to CHAOS Board when authorized;
- durable history/group-memory views.

A GameSession may end while the persistent Room/group context continues.

### 3.13 Search and notifications

Search may span authorized product destinations/content/libraries.

Notifications may represent room events, moderation outcomes, content/group-memory events, or later approved events.

Durable search/notification state is shared application state, not separate frontend truth.

### 3.14 Rules & Lab / QA

Rules/Lab and Local QA Simulation are test surfaces.

They may expose deterministic scenarios, test actors/bots, accelerated timers, state inspection, selected-card setup, and replayable rule scenarios.

They must exercise the same canonical contracts/engine and may never become alternate gameplay runtimes.

### 3.15 Cribbit Control Room

The Control Room is the administrative/operations surface for the whole application.

It may cover:

- users/accounts/identity;
- rooms/games/diagnostics;
- prompts/libraries/moderation;
- safety/reports;
- operations/version/environment health;
- runtime-safe configuration;
- audit history;
- controlled rule/product/source change proposals.

It does not get a second game engine, second persistence model, or arbitrary production-code/SQL editor. See `docs/control-room.md`.

---

## 4. Shared logical domains

```text
Canonical User / Identity
        |
        +-- Profile / Preferences
        |
Room / Persistent Group Context
        |
        +-- Membership / Roles
        +-- Room configuration
        +-- Content eligibility
        +-- Live Room Pool
        |
Prompt / Content
        |
        +-- Cribbit Originals
        +-- Community CHAOS
        +-- My Saved Deck
        +-- House Deck
        +-- Authorship / Reveal policy
        +-- Moderation / Flags
        |
Game Session
        |
        +-- Game players / seats
        +-- Deck / hand / discard / turns
        +-- Social & special effects
        +-- Explicit answers/completions
        |
History / Group Memory
        |
        +-- Resolved Moments
        +-- Recaps
        +-- Save That
        +-- Room/group history
        |
Media / Call Presentation
        |
        +-- Explicit capture/playback metadata only
        +-- Never game-rule authority
        |
Admin / Operations
        |
        +-- RBAC / audit
        +-- Moderation operations
        +-- Diagnostics
        +-- Controlled change proposals
```

These are logical domains inside one modular monolith unless a measured future need justifies a split.

---

## 5. Cross-client invariant

Cribbit is one application with two frontend adapters.

```text
Web ------------------\
                       \
                        -> packages/api-client -> ONE Node API -> shared domains -> ONE PostgreSQL authority
                       /
Telegram -------------/
```

The same linked canonical user must recover the same:

- profile/preferences;
- rooms/memberships;
- libraries/saved prompts;
- House content;
- history/recaps;
- active game;
- game-player seat/private hand.

Platform identity never becomes durable product ownership.

---

## 6. Donor preservation contract

**Legacy does not mean safe to delete.**

Until a donor capability is mapped and verified, preserve the evidence required to understand it.

Protected reference classes include:

- donor UI template/styles and Web/Telegram presentation;
- donor runtime/feature code used as behavioral archaeology;
- old DB migrations/schema evidence;
- prompt/content assets;
- CHAOS-133-V1 card assets;
- historical deployments/databases/branches needed for recovery evidence;
- current canonical rule/provenance documents.

A donor capability can be retired only after the Whole-App Transfer Matrix records:

1. capability provided;
2. data owned;
3. CLEAN domain owner;
4. API/command/query boundary;
5. persistence destination where durable;
6. Web presentation;
7. Telegram presentation where applicable;
8. tests/hosted proof;
9. explicit obsolete/superseded classification if not carried forward.

No deletion merely because CLEAN does not currently reference it.

---

## 7. Single Authority / Change Propagation Contract

The old application accumulated conflicts because one semantic change could be implemented independently in multiple runtimes/handlers/pages.

CLEAN must make that structurally difficult.

### 7.1 One concept, one owner

Examples:

```text
RULE-TRUTH
  -> gamerules.md
  -> packages/game-engine Truth flow
  -> API capability/projection
  -> packages/api-client
  -> Web / Telegram presentation
```

```text
House Deck
  -> Content/Library domain
  -> canonical persistence
  -> API/query contracts
  -> Web / Telegram presentation
```

Frontend code may adapt/render. It may not duplicate canonical domain/game authority.

### 7.2 Change-intent declaration

Before a significant rule/mechanic/product-flow/UI/domain/schema change, declare:

- change ID/type;
- canonical owner;
- expected source targets;
- expected consumers;
- required tests;
- persistence impact;
- Web impact;
- Telegram impact;
- simulation impact;
- explicitly unaffected domains.

### 7.3 Product Authority Registry

Maintain a machine-checkable registry mapping major concepts to:

- rule authority;
- domain owner;
- persistence owner;
- presentation consumers;
- required tests;
- forbidden duplicate-authority locations.

### 7.4 Rule Impact Registry

Each implemented `RULE-*` family maps to:

- engine owner;
- command/capability contracts;
- projections;
- tests;
- UI surfaces.

A rule edit must not depend on repository-wide guesswork.

### 7.5 Diff Ownership Enforcement

CI/change tooling should reject or flag:

- game-rule logic introduced in Web/Telegram/UI;
- platform-specific duplicate domain services;
- simulation reducers that reproduce canonical mechanics;
- schema changes without a declared owning domain;
- edits outside declared change-intent scope;
- new parallel prompt/library/game authorities.

### 7.6 No generated second truth

Do not copy rule constants/tables into multiple runtime owners when one canonical representation can be consumed/projected.

---

## 8. Whole-App Transfer Matrix

Before donor cleanup or final schema freeze, maintain a permanent matrix with one row per retained capability.

| Capability | Donor evidence | CLEAN support | Canonical domain | API/contract | Persistence | Web | Telegram | Proof | Status |
|---|---|---|---|---|---|---|---|---|---|
| Homepage/Lobby | donor Web | partial/current | shell + room | auth/room | user/room | required | adapted | required | classify |
| Tonight's CHAOS | donor Web | UI evidence | room/content | TBD | room config/pool | required | adapted | required | classify |
| CHAOS Board | donor Web | UI evidence | content | TBD | prompts/moderation | required | adapted | required | classify |
| My Saved Deck | donor Web | UI evidence | library | TBD | saved prompts | required | shared account | required | classify |
| House Deck | donor Web | UI evidence | group/library | TBD | explicit shared ownership | required | shared account | required | classify |
| Live Room Pool | donor Web | UI evidence | room/content | TBD | room pool | required | shared room | required | classify |
| Create Prompt | donor Web | UI evidence | content/moderation | TBD | prompts/submissions | required | adapted | required | classify |
| Call Mode | donor Web/Telegram | concept/UI | answer/media | game + media APIs | explicit only | required | required | required | classify |
| Recap/Save That | donor Web | UI evidence | history/memory | TBD | recaps/resolved | required | adapted | required | classify |
| Control Room | owner-approved | design | admin/ops | admin API/change pipeline | audit/config | admin Web | n/a initially | required | classify |

The roadmap task owns completing this matrix with evidence rather than guessing.

---

## 9. Early bible/flyer evidence

Useful recurring ideas include:

- group memory;
- custom rooms;
- House Deck;
- saved prompts;
- Save That;
- recap/share;
- Call Mode privacy;
- player-created content;
- community moderation;
- Clean/Adult content worlds.

But old materials can also contain superseded concepts such as old deck counts, player ranges, points-first win systems, broad Nope behavior, obsolete Duel/Truth/Dare wording, old Roulette scope, and speculative monetization.

Those remain ideas/history until independently adopted.

---

## 10. Completion principle

Cribbit is not complete when only the board works.

It is complete when the retained whole product works through one authority path:

```text
Owner-approved product/rules
        +
verified donor presentation/behavior
        v
shared clean domains
        v
one API + one PostgreSQL authority
        v
shared api-client
        v
Web / Telegram adapters
        +
audited Control Room
        v
whole-app hosted acceptance
```
