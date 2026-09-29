# ENG-001 — Canonical Mechanics and Authority Matrix

**Status:** IN PROGRESS  
**Task:** `ENG-001`  
**Purpose:** classify canonical gameplay authority, current CLEAN support, donor evidence, and the next port/adapt/rewrite decision before engine implementation.

## Authority and evidence rules

1. Owner corrections and supersessions win.
2. `gamerules.md` and its `RULE-*` registry are gameplay authority.
3. Clean rule/provenance documentation is supporting authority where it does not conflict.
4. Donor code and tests are evidence only; donor runtime is not imported.
5. Explicitly unresolved details remain unresolved. This matrix does not invent defaults.

The donor evidence pins must remain distinct while they are compared:

- Legacy evidence pin in `gamerules.md`: `77c455901516205633eb15e96f51a84206eb8174`.
- Later donor implementation snapshot recorded by the recovery directive: `95febd07e4d739c96843fcc4a02f070eb3c623c0`.

## Current CLEAN baseline

The inspected active branch (`work-old-ui-full-extract` at `dc97515c82e483bb46364db9a44881245c204d08`) has:

- one clean `packages/game-engine` kernel and canonical state model;
- canonical CHAOS-133-V1 physical inventory in `packages/cards`;
- a P7A playable slice that currently implements `DRAW_CARD` and number-only `PLAY_CARD` through the clean API command path;
- server-authoritative simulation using that same clean path;
- no complete special-family transition implementation in the clean engine;
- no donor runtime imported as gameplay authority.

`ENG-001` is classification only. It does not claim the current P7A slice is complete and does not change infrastructure, persistence, deployment, UI, or gameplay behavior.

## Matrix

| Mechanic / rule family | Canonical status | Current CLEAN support | Donor implementation/test evidence | Owner conflict or unresolved detail | Port action / intended owner |
|---|---|---|---|---|---|
| `RULE-OBJECTIVE` | LOCKED | Partial: winner boundary exists in clean state; complete product objective flow not proven | Donor `packages/game-engine/src/reducer.ts`, `test/core-engine.test.ts` | None identified in current registry | Adapt objective assertions into `packages/game-engine`; tests own acceptance |
| `RULE-DECK` | LOCKED | Supported inventory: 133 physical instances and family counts | Donor `deck.ts`, `deck-composition.test.ts`; clean `packages/cards` inventory tests | Shared Lime 1 artwork does not alter physical multiplicity | Keep `packages/cards` inventory authoritative; add engine conservation tests |
| `RULE-OPENING` | LOCKED | Partial: clean P7A deals seven cards, but complete opening semantics need canonical tests | Donor `setup.ts`, `core-engine.test.ts`, `corrected-rules-behavior.test.ts` | Opening Special cards stay in hand and do not auto-trigger | Adapt setup algorithm into clean state; do not import donor state |
| `RULE-PULSE` | LOCKED ARCHITECTURE | Not implemented as a complete clean mechanic | Donor `adaptive-distribution.ts`, `adaptive-distribution.test.ts` | Pulse tuning remains unresolved | Classify inputs/outputs first; implement only approved tuning |
| `RULE-ACQUISITION` | LOCKED | Partial: clean voluntary draw adds one card and advances turn; forced-on-draw absent | Donor `deck.ts`, `reducer.ts`, corrected-rules tests | Opening deal is not a forced draw; special Draw turn-loss detail unresolved | Engine acquisition dispatcher; later `SOC-001` for forced FIFO |
| `RULE-TURN` | LOCKED | Partial: clockwise turn progression exists | Donor `turn.ts`, `core-engine.test.ts` | None for ordinary progression | Adapt pure turn helper and edge-case tests |
| `RULE-NUMBER` | LOCKED | Partial: number color/value matching exists | Donor `validation.ts`, `validation-matching.test.ts` | Owner correction permits voluntary draw despite legal play | Adapt legality into clean engine; preserve draw capability |
| `RULE-SKIP` | LOCKED | Not implemented in clean P7A | Donor `reducer.ts`, `corrected-rules-behavior.test.ts` | None identified | Implement in clean simple-effects stage |
| `RULE-REVERSE` | LOCKED | Not implemented in clean P7A | Donor `turn.ts`, `reducer.ts`, `corrected-rules-behavior.test.ts` | Two-player behavior must follow canonical rule | Implement and test multi-player/two-player cases |
| `RULE-DRAW` | PARTLY LOCKED | Clean `DRAW_CARD` is ordinary draw only | Donor `reducer.ts`, `validation.ts` | Special Draw-card turn-loss detail unresolved | Separate ordinary draw from special Draw effect; do not guess unresolved behavior |
| `RULE-WILD` | LOCKED | Not implemented in clean P7A | Donor `validation.ts`, `reducer.ts`, `corrected-rules-behavior.test.ts` | Requires explicit color-selection command | Add typed command/capability and clean transition |
| `RULE-PROMPTS` | LOCKED | Not wired into clean P7A engine | Donor `social.ts`, prompt-related tests | Prompt source/selection must remain authoritative input | Later prompt-domain integration; engine consumes selected authoritative input |
| `RULE-PREGAME` | LOCKED | Not implemented in clean game path | Donor prompt/content modules and tests | Exact product/content lifecycle is broader than P7A | Keep in Prompt/Content domain; pass eligible inputs into engine |
| `RULE-TRUTH` | LOCKED | Not implemented in clean P7A | Donor `social.ts`, corrected rules and Nope tests | Target-first; answer/privacy/refusal details are rule-backed | Later `SOC-002`; domain-specific commands and projections |
| `RULE-DARE` | LOCKED TARGET-FIRST | Not implemented in clean P7A | Donor `social.ts`, corrected rules tests | Target-first; group refusal details unresolved | Later `SOC-003`; do not default refusal semantics |
| `RULE-PARANOIA-ENTRY` | LOCKED CORE | Not implemented in clean P7A | Donor `social.ts`, core/corrected rules tests | Target selection is distinct from answer player | Later focused Paranoia flow |
| `RULE-PARANOIA-CLASSIC` | LOCKED | Not implemented in clean P7A | Donor `social.ts`, corrected rules tests | Reveal/keep and answer-player sequence must remain explicit | Later domain handler and sealed projections |
| `RULE-PARANOIA-STRANGER` | LOCKED / ONLINE | Not implemented in clean P7A | Donor `social.ts`, core tests | Response and vote privacy/eligibility must be preserved | Later domain handler with concurrent voter submissions |
| `RULE-DUEL` | LOCKED | Not implemented in clean P7A | Donor `social.ts`, `corrected-rules-behavior.test.ts`, `nope-routing.test.ts` | Voting/timer/Nope behavior is owner-corrected | Later focused Duel flow; no generic answer bypass |
| `RULE-TABOO` | LOCKED | Not implemented in clean P7A | Donor `social.ts`, core tests | Timeout remains unresolved | Later domain handler; preserve unresolved timeout |
| `RULE-HIJACK` | LOCKED | Not implemented in clean P7A | Donor `social.ts`, core tests | Final-card boundary unresolved | Later focused flow; do not infer boundary |
| `RULE-TAG` | LOCKED CORE | Not implemented in clean P7A | Donor `reducer.ts`, core tests | TAG nesting unresolved; immediate draw behavior is locked | Later focused flow; separate unresolved nesting decision |
| `RULE-TRUTH-OR-CHAOS` | LOCKED CORE / DETAILS UNRESOLVED | Not implemented in clean P7A | Donor `social.ts`, corrected rules tests | Group-Dare refusal/participant details unresolved; Nope eligibility unresolved | Later focused flow with sealed participant inputs |
| `RULE-CHAOS` | LOCKED IDENTITY / CATALOGUE | Not implemented in clean P7A | Donor `reducer.ts`, core tests | Weights, shorthand, left behavior and extra catalogue unresolved | Implement only locked effects; isolate unresolved catalogue |
| `RULE-BLIND-SWAP` | LOCKED CORE | Not implemented in clean P7A | Donor `reducer.ts`, core tests | Must preserve physical card conservation | Adapt as pure engine effect |
| `RULE-CHAOS-REVERSE` | LOCKED | Not implemented in clean P7A | Donor `reducer.ts`, core tests | Direction change must remain engine-owned | Adapt as pure engine effect |
| `RULE-MACHIAVELLI` | LOCKED SIX-CHOICE MODEL | Not implemented in clean P7A | Donor `capabilities.ts`, `social.ts`, core tests | Six effects are individually classified below | Later typed choice command and effect modules |
| `RULE-MACHIAVELLI-CONVERT` | LOCKED | Not implemented in clean P7A | Donor `social.ts`, core tests | None identified | Focused effect module |
| `RULE-MACHIAVELLI-TABOO` | LOCKED | Not implemented in clean P7A | Donor `social.ts`, core tests | Taboo timeout remains unresolved | Focused effect module, no timeout default |
| `RULE-MACHIAVELLI-NO-MERCY` | LOCKED | Not implemented in clean P7A | Donor `social.ts`, core tests | Exact penalty must follow canonical clause | Focused effect module |
| `RULE-MACHIAVELLI-PARANOIA` | LOCKED | Not implemented in clean P7A | Donor `social.ts`, core tests | Paranoia probability/details constraints apply | Focused effect module |
| `RULE-MACHIAVELLI-PRESSURE` | LOCKED | Not implemented in clean P7A | Donor `social.ts`, core tests | Exact pressure semantics must be rule-backed | Focused effect module |
| `RULE-MACHIAVELLI-CONFESSION` | LOCKED | Not implemented in clean P7A | Donor `social.ts`, core tests | Reverse Confession resolution remains unresolved | Focused effect module with blocked downstream resolution |
| `RULE-GHOST` | NEW LOCKED CORE / DETAILS UNRESOLVED | Not implemented in clean P7A | Donor `reducer.ts`, `capabilities.ts`, core tests | Penalty and old attack details unresolved | Later focused flow; preserve armed/active concepts only where locked |
| `RULE-DIG-ME` | LOCKED CORE | Not implemented in clean P7A | Donor `social.ts`, core tests | Refusal/final details unresolved; no Roulette default | Later domain handler |
| `RULE-REVERSE-CONFESSION` | LOCKED CORE / RESOLUTION UNRESOLVED | Not implemented in clean P7A | Donor `social.ts`, core tests | Downstream response/resolution unresolved | Later focused flow; stop at locked boundary |
| `RULE-NOPE` | NEW NARROW ROLE | Not implemented in clean P7A | Donor `command-router.ts`, `nope-routing.test.ts`, `capabilities.ts` | Eligibility for unresolved families remains unresolved | Later typed `PLAY_NOPE`; no broad reaction authority |
| `RULE-PASS` | LOCKED WHERE SPECIFIED | Not implemented in clean P7A | Donor `reducer.ts`, social tests | Refusal semantics vary by family and some are unresolved | Family handlers own exact pass behavior |
| `RULE-REWIND` | LOCKED | Not implemented in clean P7A | Donor `reducer.ts`, core tests | Must not mutate client state directly | Later engine command with explicit eligibility |
| `RULE-FLAG` | LOCKED | Not implemented in clean P7A | Donor safety/content paths | Moderation is a separate domain; no gameplay shortcut | API safety/moderation owner |
| `RULE-ANSWER-PRIVACY` | LOCKED | Not implemented in clean P7A | Donor social/projection tests | Sealed answers and audience scopes are mandatory | Contracts/projection + family handlers |
| `RULE-BOTS` | LOCKED | Partial: P7A bot chooses number play or draw | Donor `bot-policy.ts`, `bot-capabilities.test.ts`, `bot-policy.test.ts` | Bot must consume canonical capabilities, never duplicate rules | Adapt bot policy after capabilities are complete |
| `RULE-PUBLIC-SOCIAL` | LOCKED | Not implemented in clean P7A | Donor event/projection tests | Public/private audience must be explicit | Engine effects + projection owner |
| `RULE-TIMEOUT` | LOCKED ARCHITECTURE | Clean deadline state exists; no complete family timeout behavior | Donor `timer.ts`, core tests | Family-specific timeout semantics may remain unresolved | Later deadline worker + engine timeout commands |
| `RULE-MODAL` | LOCKED | Presentation-only in clean; no canonical flow | Donor UI/game flow evidence | Modal close cannot advance gameplay | UI adapter consumes capabilities/effects |
| `RULE-DISCARD` | LOCKED | Clean discard pile exists for number play | Donor reducer/deck tests | Resolved discard is distinct from active effect | Engine transition/effect separation |
| `RULE-CONTINUATION` | LOCKED | Clean root-flow/continuation invariants exist; no family continuations | Donor reducer/social tests | Winner blocked while obligations remain | Kernel invariant plus family transitions |
| `RULE-UNRESOLVED` | REGISTRY | Recorded in `gamerules.md`; not silently implemented | Donor behavior is non-authoritative | Explicit unresolved list is binding | Keep visible; block implementation until owner resolution |
| `RULE-PROVENANCE` | LOCKED PROCESS | Clean kernel requires non-empty rule refs | Donor tests provide evidence only | No conflict | Preserve mandatory rule references and matrix updates |
| `RULE-RULE-CHANGES` | LOCKED PROCESS | Documentation process exists | Donor pins are evidence snapshots | Donor pin disagreement must be recorded, not hidden | Keep authority matrix and change-intent records current |

## ENG-001 conclusion

The matrix confirms Codex’s diagnosis: the clean application has a real single-authority path, but its current engine is a deliberately incomplete P7A slice. Simulation is not a second engine; it is correctly exercising the same incomplete path. The next implementation task is `ENG-002 — Canonical normal-turn legality`, beginning with special-card legality, voluntary draw capability, Wild selection contracts, and behavior tests. No unresolved rule is assigned a guessed default by this matrix.

## Required transfer impact

- **Game engine:** canonical legality, capabilities, and later family transitions.
- **Contracts:** typed command/capability additions only as each rule stage is authorized.
- **API:** continues to orchestrate one resolver/command path; no duplicate rules.
- **Simulation:** consumes the same resolver and capabilities; no simulation-specific reducer.
- **Web/Telegram:** existing donor presentation remains unchanged; later projection/capability wiring only.
- **Persistence:** no schema or database mutation in ENG-001.
- **Cloudflare/Railway:** explicitly unaffected.
