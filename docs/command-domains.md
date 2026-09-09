# P0 command and concurrency corrections

Status: design corrected under the conditional architecture approval; gameplay implementation NOT STARTED; P1 foundation independently authorized. This document specifies boundaries, not new game rules. All commands belong to one contracts union and enter one backend transaction service. A dispatcher selects a small domain handler; it does not implement a chain of unrelated family semantics.

## Family-specific commands

The previous broad SELECT_TARGET, SUBMIT_ANSWER and PASS_CHALLENGE proposals are withdrawn from the proposed public game vocabulary. Shared envelope validation, text validation, response codecs, penalty execution primitives and continuation utilities remain reusable; domain meaning and authorization stay in family handlers.

Every row inherits authentication, session membership, command ID/fingerprint, legal flow/stage, expected revision, deadline and actor authorization. Payload actor IDs never establish caller identity. Row names are proposals pending detailed contract review; they do not resolve any open rule.

| Domain handler | Proposed command(s) | Actor / input / authoritative transition | Rule provenance |
|---|---|---|---|
| `flows/dare/target` | `SELECT_DARE_TARGET` | Dare actor selects another eligible player before source/prompt. | RULE-DARE clauses |
| `flows/duel/target` | `SELECT_DUEL_TARGET` | Challenger selects eligible opponent. | RULE-DUEL clauses |
| `flows/tag/target` | `SELECT_TAG_TARGET` | TAG actor selects bonus-action recipient; preserve scheduled turn. | RULE-TAG clauses |
| `flows/hijack/target` | `SELECT_HIJACK_TARGET` | Actor selects swap partner; permanent positions/draw/takeover follow engine rule. | RULE-HIJACK clauses |
| `flows/taboo/target` | `SELECT_TABOO_TARGET` | Actor selects another target. | RULE-TABOO clauses |
| `flows/dig-me/target` | `SELECT_DIG_ME_TARGET` | Actor selects recipient of question about actor. | RULE-DIG-ME clauses |
| `flows/paranoia/target` | `SELECT_PARANOIA_TARGET` | Actor selects initial target, separately from named answer player. | RULE-PARANOIA-ENTRY clauses |
| `flows/paranoia/classic` | `NAME_PARANOIA_ANSWER_PLAYER`, `DECIDE_PARANOIA_REVEAL` | Initial target names another player; named player makes reveal/keep decision. | RULE-PARANOIA-CLASSIC clauses |
| `flows/truth/response` | `SUBMIT_TRUTH_ANSWER`, `MARK_TRUTH_ANSWERED_LIVE`, `PASS_TRUTH` | Affected player submits approved input/completion or incurs exact refusal Draw 2. | RULE-TRUTH, RULE-ANSWER-PRIVACY clauses |
| `flows/dare/response` | `SUBMIT_DARE_RESPONSE`, `MARK_DARE_COMPLETED_LIVE`, `PASS_DARE` | Selected target responds/completes/refuses; actor cannot do so for target. | RULE-DARE, RULE-PASS clauses |
| `flows/duel/response` | `SUBMIT_DUEL_RESPONSE`, `MARK_DUEL_ANSWERED_LIVE` | Current designated responder follows approved sequential response window. Live mode only if compatible with judging; never fabricate objective answers. | RULE-DUEL, RULE-ANSWER-PRIVACY clauses |
| `flows/duel/vote` | `DUEL_VOTE` | Any currently eligible non-duelist independently casts one ballot. | RULE-DUEL clauses |
| `flows/paranoia/stranger` | `SUBMIT_PARANOIA_RESPONSE`, `MARK_PARANOIA_ANSWERED_LIVE`, `PARANOIA_VOTE` | Target response/completion, then independent eligible ballots excluding target. | RULE-PARANOIA-STRANGER, RULE-ANSWER-PRIVACY clauses |
| `flows/truth-or-chaos/response` | `SUBMIT_TRUTH_OR_CHAOS_CHOICE` | Each approved affected participant seals one authoritative option. No free-text comparison or generic Answered Live bypass. | RULE-TRUTH-OR-CHAOS clauses; participant set unresolved |
| `flows/truth-or-chaos/group-dare` | `SUBMIT_TRUTH_OR_CHAOS_GROUP_DARE` | Instigator authors group challenge after mismatch. Refusal/completion command design remains blocked on decisions. | RULE-TRUTH-OR-CHAOS clauses |
| `flows/taboo/response` | `ANSWER_TABOO_YES`, `REFUSE_TABOO` | Target chooses locked YES or exact draw consequence; no generic Truth answer semantics. | RULE-TABOO clauses |
| `flows/dig-me/response` | `SUBMIT_DIG_ME_ANSWER`, `MARK_DIG_ME_ANSWERED_LIVE` | Target response proposals; final completion details unresolved. No refusal default. | RULE-DIG-ME clauses |
| `flows/reverse-confession` | `SUBMIT_REVERSE_CONFESSION` | Actor supplies confession without declaring authenticity. Final group handling blocked. | RULE-REVERSE-CONFESSION clauses |
| `flows/machiavelli` | `SELECT_MACHIAVELLI_EFFECT` | One of six typed choices, effect, exhaust once. | RULE-MACHIAVELLI and subeffect clauses |
| `flows/ghost` | `ACTIVATE_GHOST`, `END_GHOST_TURN` | Armed owner activation/expiry semantics; legal activation detail still unresolved. | RULE-GHOST clauses |

Separate source/manual commands are also proposed for Truth, Dare, Paranoia, Duel and Truth or Chaos where that source is actually approved: e.g. `SELECT_DUEL_PROMPT_SOURCE`, `SUBMIT_DUEL_MANUAL_PROMPT`. They invoke the one prompt-domain policy/selection service, not separate prompt engines. DIG ME uses `SUBMIT_DIG_ME_QUESTION` or `MARK_DIG_ME_QUESTION_ASKED_LIVE` and never Roulette. Taboo's question contract remains in its domain. No family is granted a new prompt source just because a generic source enum contains it.

Core `START_GAME`, `PLAY_CARD`, `DRAW_CARD`, `SELECT_WILD_COLOR` and narrow cross-cutting `PLAY_NOPE`, `REWIND_PROMPT`, private moderation `FLAG_PROMPT` retain one meaning and typed eligibility. Future family exceptions do not justify unrestricted generic payloads. Route count is an API organization choice: one command transport endpoint may dispatch separate domain handlers without duplicating game logic.

## One root flow, concurrent participants

Invariant: **one active root game flow at a time, with multiple concurrent authorized participant actions inside it when the rule permits.** FIFO concerns forced effects and continuations, not the order in which independent voters must respond. Duel's sequential participant answers remain sequential because its rules say so; its group ballots need no imposed player order.

Proposed group stage data: `rootFlowId`, `stageId`, `eligibleParticipantIds`, immutable per-participant accepted submissions, pending participant set, authoritative deadline and completion policy. Eligibility derives from the engine. The renderer does not schedule which eligible voter is allowed next.

Database commits remain serialized for session integrity. Under the existing strict expectedRevision contract, A and B can submit independently at revision r: A commits r+1; B receives STALE_REVISION, resyncs, confirms same root/stage and its own submission still pending, then resubmits the same sealed intention at r+1. B is not forced to wait for a predetermined player's vote. There is no silent stale-command merge.

Retry details: a stale rejection applies no transition and reserves no successful receipt; the client uses a fresh command ID for the fresh-revision envelope and a stable submissionId to associate the logical participant action. Accepted duplicates reuse their original receipt. A uniqueness constraint on `(session, rootFlow, stage, participant, submissionKind)` prevents two accepted ballots/responses even with fresh command IDs. Auth and stage eligibility are rechecked after every resync. If stage/eligibility changes or deadline passes, stop retrying and show the authoritative outcome. Do not automatically submit a changed choice. Transport-lost successful commands retry their original ID first to recover the committed receipt. Bound automatic retries; retain the user's draft on contention.

This is the proposed strict-revision approach, not a product rule or a claim of concurrency verification. Before implementation approve exact envelope/submission schema. Do not add a second revision policy or bypass expectedRevision without explicit contract review.

Tests required: three independent Duel ballots; Stranger ballots including actor/excluding target; sealed consensus responses in arbitrary arrival order; same-player two-device duplicate; stale response after stage changes; expiry vs final response; repeated accepted receipt; no leaked partial answers; one terminal resolution. These are required alongside normal single-player command tests.

## Reveal command removed pending rule provenance

`CONFIRM_PROMPT_REVEAL` is not in the proposed default command union. Add a domain-specific reveal action only when a canonical rule ID or approved decision explicitly requires the player's reveal/acknowledgement. Paranoia's approved reveal decision remains a domain command. Roulette selection persistence and public visibility are distinct boundaries; the backend applies the approved reveal policy. Animation may replay or finish visually but never decides canonical progression. Private preview/Rewind timing still needs a rule-backed design; removing a speculative command does not silently make sealed prompts public.
