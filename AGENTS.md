# Cribbit CHAOS CLEAN - Agent Execution Contract

This file is mandatory for every human or AI engineering agent working in `funmarket/cribbit-chaos-clean`.

## 1. Read-first rule

Before inspecting or changing code:

1. Read `HANDOFF.md` completely.
2. Read the relevant rule sections in `gamerules.md`.
3. Verify the live repository branch/HEAD/PR state.
4. Select exactly one current task ID from `HANDOFF.md`.
5. Work only inside that task's allowed scope.

`HANDOFF.md` is the canonical living roadmap and execution ledger. Always return to it after each task and update its status/evidence before claiming completion.

## 2. Operating character: evidence-first Hermes discipline

Work as a skeptical senior engineer/reviewer:

- verify claims against the actual repository/live service;
- do not accept summaries when exact state can be inspected;
- do not reject a claim without checking it when checking is possible;
- distinguish verified facts, owner rules, inference, and unknowns;
- keep instructions direct and execution-focused;
- prefer a few high-leverage checks over broad unfocused audits;
- never invent missing rule semantics;
- stop on contradictions instead of silently choosing a convenient source;
- do not report `fixed`, `green`, `deployed`, `safe`, or `complete` without exact evidence.

## 3. Product mission

Do not redesign Cribbit.

Goal:

> Same Cribbit game, same verified UI/UX and CHAOS-133-V1 art, rebuilt underneath as one clean server-authoritative, production-ready modular monolith with one canonical PostgreSQL schema and shared Web/Telegram clients.

The old project is donor/reference evidence. The clean repository is the production implementation authority.

## 4. Permanent architecture rules

- One authoritative game engine: `packages/game-engine/**`.
- One authoritative server command/application path in the Railway Node API.
- One canonical PostgreSQL schema/migration chain.
- `packages/api-client` is the frontend HTTP boundary.
- Web and Telegram render server projections; no client gameplay engine.
- No fallback local game when the API is unavailable.
- No client deck, turn, Roulette, prompt, winner, or effect authority.
- No import/reactivation of `packages/legacy-runtime/**`, `canonical-game-runtime.ts`, old Telegram simulation runtime, or parallel gameplay reducers.
- Simulation must use the same API/engine as real play.
- One authority does not mean one giant file: special-rule families use focused modules/handlers.

## 5. Rule authority

`gamerules.md` plus explicit later owner decisions are gameplay authority.

Old runtime behavior, old tests, artwork text, or Git chronology never overrides a later owner correction merely because it exists.

Known corrections that must survive include target-first Truth, target-first Reverse Confession, corrected Duel voting/timer/Nope behavior, corrected Truth-or-Chaos group behavior, corrected TAG immediate draw meaning, and the owner-approved forced-on-draw list.

If a rule is marked unresolved, do not implement a default.

## 6. Donor-engine rule

Pinned old donor evidence may be inspected and selectively ported.

Port:

- mechanics;
- algorithms;
- invariants;
- focused modules;
- regression tests.

Do not wholesale transplant the old 123 KB reducer or old runtime/application/persistence authority.

For every ported mechanic, compare donor behavior to current canonical rules first.

## 7. Database rules

The repository currently contains competing persistence generations. The long-term target is one clean schema.

Do not create a third schema path.

Do not apply/drop/reset/migrate any shared database unless the active `HANDOFF.md` task explicitly authorizes that exact mutation and the exact Railway environment/database is freshly verified.

The project is fresh and no production user/prompt corpus needs preservation, but that fact alone is not authorization for a destructive reset.

Target environment topology is documented in `HANDOFF.md`.

## 8. UI/UX rules

The extracted old Web and Telegram UI is presentation authority.

Do not recreate or modernize it for convenience.

Preserve the existing table feel, menus, responsive behavior, action bar, special-effect presentation, and canonical art unless the owner explicitly changes product direction.

## 9. Repository hygiene

Do not commit temporary:

- `FIX.md`;
- scratch plans;
- recovery notes;
- audit dumps;
- controller state;
- agent reasoning files.

Permanent exceptions:

- `HANDOFF.md`;
- this `AGENTS.md`;
- owner-approved permanent docs.

## 10. Required toolchain and gates

Use:

- Node 24.x
- npm 10.9.2

Before claiming a source candidate green, run the task-required focused tests and, when the roadmap calls for full verification:

```sh
npm run verify
```

This covers typecheck, architecture check, tests, Web build, Telegram build, and API build according to the repository scripts.

Exact-state CI must correspond to the exact candidate SHA. Old green CI is not proof for a new commit.

## 11. Branch and shared-state discipline

Before every consequential repository mutation:

- re-read current branch HEAD;
- confirm the target branch/PR;
- inspect the exact files being changed;
- do not assume another agent has not moved the branch.

Do not merge, rebase, reset, force-push, deploy, or mutate production merely to keep momentum. Those require explicit authorization for the exact action.

## 12. Task discipline

Every task has one ID from `HANDOFF.md`.

For that task record privately or in the tool/controller state:

- task ID;
- goal;
- current branch;
- start SHA;
- rule/doc authority;
- allowed targets;
- forbidden targets;
- prerequisites;
- exact mutation;
- focused tests;
- full gates;
- result SHA;
- CI/runtime evidence;
- blocker/next task.

Do not expand scope because a neighboring problem is visible.

## 13. HANDOFF update requirement

At the end of every completed task:

1. update the task status in `HANDOFF.md`;
2. add concise evidence to the Live Execution Ledger;
3. record exact SHA/PR/CI/deployment identifiers that matter;
4. record any unresolved blocker;
5. move `NEXT TASK` only when the current task is proven PASS.

Do not rewrite the roadmap's end goal or owner decisions while performing a routine status update.

## 14. Stop conditions

Stop mutation and report the blocker when:

- the current branch/head differs from the state the task was authorized against;
- repository docs/rules/live behavior materially conflict and no precedence rule resolves it;
- required external state cannot be verified;
- a test failure is outside the authorized repair scope;
- a rule is unresolved;
- the requested mutation would create another authority path;
- a migration/deployment target is ambiguous;
- a production/shared-state change lacks explicit authorization.

## 15. Definition of truthful reporting

Use evidence classes explicitly:

- source inspection;
- focused unit test;
- integration test;
- full verify/build;
- exact-SHA CI;
- hosted runtime proof;
- live deployment/database proof.

A source diff is not runtime proof. A build is not gameplay proof. Deployment success is not end-to-end proof.

## 16. Resume protocol for a new agent

A new agent with no chat history should be able to continue safely by doing only this:

1. open repository;
2. read `AGENTS.md`;
3. read `HANDOFF.md`;
4. verify live HEAD/PR/external dependencies for `NEXT TASK`;
5. execute only that task;
6. verify it;
7. update `HANDOFF.md`;
8. stop or proceed to the next task only when the roadmap gate permits it.

If those files are stale relative to live state, verify and update factual state first; do not guess from stale prose.
