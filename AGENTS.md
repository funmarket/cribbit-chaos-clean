# Cribbit CHAOS CLEAN - Agent Execution Contract

This file is mandatory for every human or AI engineering agent working in `funmarket/cribbit-chaos-clean`.

## 1. Read-first protocol

Before inspecting or changing code:

1. Read `HANDOFF.md` completely.
2. Read `docs/product-scope.md`.
3. Read `docs/control-room.md` when Admin/operations/config/change-control is relevant.
4. Read the relevant `gamerules.md` clauses for gameplay work.
5. Verify live branch/HEAD/PR/CI and any external state the task depends on.
6. Select exactly one current HANDOFF task ID.
7. Work only inside that task's allowed scope.

`HANDOFF.md` is the live roadmap/evidence ledger. Return to it after every task.

## 2. Product mission

Do not redesign Cribbit and do not reduce it to the game table.

Goal:

> **Same Cribbit game, same verified whole-product experience and CHAOS-133-V1 art, rebuilt underneath as one clean server-authoritative modular monolith with clean domains, one canonical PostgreSQL authority per environment, and shared Web/Telegram clients.**

Retained scope includes rooms/group context, CHAOS Board, My Saved Deck, House Deck, Live Room Pool, player-created content/moderation, Call Mode, safety, Recap/Save That/history/group memory, profile/preferences, application shell and an audited Control Room.

## 3. Source hierarchy

Authority is domain-specific.

Gameplay:

1. current owner decisions/supersessions;
2. `gamerules.md`;
3. clean rule/provenance docs;
4. donor code/tests as evidence;
5. early bibles/flyers as ideas only.

UI/UX/product flow:

1. current owner decisions;
2. verified evolved donor app;
3. extracted CLEAN presentation;
4. early bibles/flyers as ideas only.

Operational facts require fresh live verification.

## 4. Donor preservation

**Legacy does not mean safe to delete.**

Do not remove donor behavior/UI/schema/content/deployment evidence until `APP-001` proves its CLEAN replacement or explicitly classifies it obsolete.

Do not wholesale reactivate donor runtime as production authority.

## 5. Permanent architecture rules

- One authoritative gameplay engine: `packages/game-engine/**`.
- One authoritative server application/command/query path in the Node API.
- One canonical PostgreSQL schema/migration chain per environment.
- `packages/api-client` is the shared frontend transport boundary.
- Web/Telegram render server projections; no client gameplay engine.
- Control Room uses the same canonical domains; no admin game engine or direct DB authority.
- No local fallback production game.
- No client-owned deck/turn/Roulette/prompt/winner/effect authority.
- Simulation uses the same engine/contracts.
- Special families use focused modules; one authority does not mean one giant file.

## 6. Single Authority / Change Propagation Contract

The old app's corruption/conflict pattern must not recur.

For every significant change:

1. identify the canonical rule/domain/presentation owner;
2. declare expected changed targets/consumers;
3. declare required tests;
4. declare DB/Web/Telegram/Admin/simulation impact;
5. declare explicitly unaffected domains;
6. implement semantics once in the canonical owner;
7. let API projections/api-client/frontends consume it;
8. reject duplicate authority.

Never independently "fix the same rule" in Web, Telegram, simulation, Admin, API handlers and engine.

Planned enforcement tasks: `ARCH-GUARD-001..005`.

## 7. Rule authority

`gamerules.md` plus explicit later owner supersessions are gameplay authority.

Known owner corrections such as target-first Truth/Reverse Confession, Duel voting/timer/Nope behavior, Truth-or-Chaos correctness and TAG immediate draw must survive.

If a rule is unresolved, do not invent a default.

## 8. Whole-app domain discipline

Before adding persistence or API endpoints, identify owning domain/lifecycle.

Do not add a random table because one page needs data.

Core logical domains:

- Identity/Account;
- Profile/Preferences;
- Room/Persistent Group;
- Prompt/Content;
- Library/Group Memory;
- Game;
- History/Recap;
- Safety/Moderation;
- Media/Call;
- Search/Notifications;
- Admin/Operations.

## 9. Control Room discipline

Runtime-managed changes may use typed, authorized, audited Admin APIs only where explicitly designed.

Source-controlled changes (rules, mechanics, schema, auth semantics, core UI/domain ownership) must go through controlled Git/PR/CI/staging approval.

Never expose arbitrary production SQL/source editing as an admin convenience.

See `docs/control-room.md`.

## 10. Database rules

Do not create a competing schema path.

No shared DB apply/drop/reset/migration unless the active HANDOFF task explicitly authorizes the exact target/mutation.

`DB-001` cannot freeze final schema until `APP-001`, `ARCH-GUARD-001` and `ADMIN-001` classify retained whole-product persistence needs.

## 11. UI/UX rules

The verified donor Web/Telegram presentation is reference authority unless explicitly superseded.

Preserve table feel, menus, libraries, content surfaces, responsive behavior, action/safety bars, special-effect presentation and canonical art.

Do not modernize/recreate for convenience.

## 12. Repository hygiene

Do not commit temporary:

- FIX files;
- scratch plans;
- recovery notes;
- audit dumps;
- controller state;
- agent reasoning.

Permanent docs such as HANDOFF/product-scope/control-room/decisions are allowed because they are project authority, not scratch.

## 13. Required toolchain and gates

Baseline:

- Node 24.x
- npm 10.9.2

Before claiming a candidate green, run task-required focused checks and `npm run verify` when HANDOFF requires it.

Old CI is not proof for a new SHA.

## 14. Branch/shared-state discipline

Before consequential repo mutation:

- re-read current branch HEAD;
- verify target branch/PR;
- inspect exact targets;
- assume shared branches can move.

Do not merge/rebase/reset/force-push/deploy/production-mutate merely for momentum.

## 15. Task discipline

Every task has one HANDOFF ID.

Record:

- task ID;
- goal;
- current branch/start SHA;
- authority/change intent;
- allowed/forbidden targets;
- prerequisites;
- live facts;
- mutation;
- tests/gates;
- result SHA;
- CI/runtime/deploy evidence;
- affected Whole-App Transfer Matrix rows;
- affected authority registry/decisions;
- blocker/next task.

## 16. Mandatory Documentation Sync Gate

A task is not complete until permanent execution documentation matches the exact result.

At minimum:

1. update HANDOFF task status;
2. append concise Live Execution Ledger evidence;
3. record exact SHA/PR/CI/deployment identifiers required by the task;
4. update affected Whole-App Transfer Matrix rows;
5. update authority/decision records when ownership changed;
6. record blockers;
7. move NEXT TASK only after the current task is proven PASS.

Do not change product intent during a routine status update.

## 17. Stop conditions

Stop mutation when:

- branch/head changed from authorized state;
- rules/docs/live behavior conflict without precedence;
- required external state cannot be verified;
- failure lies outside repair scope;
- rule is unresolved;
- mutation would create another authority path;
- DB/deploy target is ambiguous;
- production/shared-state change lacks explicit authorization;
- required change-intent scope is unclear.

## 18. Truthful reporting

Keep evidence classes separate:

- source inspection;
- focused unit test;
- integration test;
- full verify/build;
- exact-SHA CI;
- hosted runtime proof;
- live deployment/database proof.

A source diff is not runtime proof. A build is not gameplay proof. Deployment success is not end-to-end proof.

## 19. Resume protocol

A new agent with no chat history must be able to:

1. open repo;
2. read AGENTS;
3. read HANDOFF;
4. read product-scope;
5. verify live state for NEXT TASK;
6. execute only that task;
7. verify it;
8. pass Documentation Sync Gate;
9. stop or advance only when the roadmap permits it.

If docs are stale relative to live state, verify and update factual status before making product assumptions.
