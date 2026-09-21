# Cribbit CHAOS canonical rule registry — P1 rebaseline

This file is a **rule authority registry**, not gameplay implementation. It replaces the unrecoverable P1 publication artifact without inventing lost clause wording. P1 implements no game rules. Future gameplay work must cite the applicable permanent rule-family ID here and then the exact approved clause/source available at that phase.

## Source discipline

- Clean-rebuild authority: this repository's `docs/rule-index.md`, `docs/decisions.md`, `docs/command-domains.md`, `requirements.md`, `structure.md` and `docs/testing.md`.
- Legacy evidence is read-only and pinned to `funmarket/cribbit-chaos@77c455901516205633eb15e96f51a84206eb8174`.
- Legacy runtime behavior is never authoritative merely because it exists in code.
- The old implementation is evidence only; no legacy runtime, reducer, session orchestration, API state authority or persistence logic may be imported into the clean rebuild.
- Any rule marked unresolved remains unresolved. No architecture or implementation phase may silently choose a default.
- The unrecoverable pre-rebaseline gamerules blob is not recreated by guessing. This registry supersedes that publication checkpoint.

## Permanent rule-family index

| Permanent ID | Topic | Authority status |
|---|---|---|
| `RULE-OBJECTIVE` | Game Objective | LOCKED |
| `RULE-DECK` | Canonical Physical Deck — CHAOS-133-V1 | LOCKED |
| `RULE-OPENING` | Starting Hand | LOCKED |
| `RULE-PULSE` | CHAOS Pulse — Internal Draw/Deal System | LOCKED ARCHITECTURE |
| `RULE-ACQUISITION` | Opening Deal vs Post-Start Draws | LOCKED |
| `RULE-TURN` | Normal Turn Structure | LOCKED |
| `RULE-NUMBER` | Number | LOCKED |
| `RULE-SKIP` | Skip | LOCKED |
| `RULE-REVERSE` | Reverse | LOCKED |
| `RULE-DRAW` | Draw | PARTLY LOCKED |
| `RULE-WILD` | Wild | LOCKED |
| `RULE-PROMPTS` | Prompt Architecture | LOCKED |
| `RULE-PREGAME` | Pre-Game Player Content | LOCKED |
| `RULE-TRUTH` | Truth | LOCKED |
| `RULE-DARE` | Dare | LOCKED TARGET-FIRST RULE |
| `RULE-PARANOIA-ENTRY` | Paranoia | LOCKED CORE IDENTITY |
| `RULE-PARANOIA-CLASSIC` | Paranoia Classic | LOCKED |
| `RULE-PARANOIA-STRANGER` | Paranoia Stranger / Online | LOCKED |
| `RULE-DUEL` | Duel | LOCKED |
| `RULE-TABOO` | Taboo | LOCKED |
| `RULE-HIJACK` | Hijack | LOCKED |
| `RULE-TAG` | TAG / TAG ALONG | LOCKED CORE |
| `RULE-TRUTH-OR-CHAOS` | Truth or Chaos | LOCKED CORE / SOME DETAILS UNRESOLVED |
| `RULE-CHAOS` | Chaos | LOCKED IDENTITY / CURRENT EFFECT CATALOGUE |
| `RULE-BLIND-SWAP` | Chaos Effect: Blind Swap | LOCKED CORE |
| `RULE-CHAOS-REVERSE` | Chaos Effect: Reverse Order | LOCKED |
| `RULE-MACHIAVELLI` | Machiavelli | LOCKED SIX-CHOICE MODEL |
| `RULE-MACHIAVELLI-CONVERT` | Machiavelli: Convert the Weak | LOCKED |
| `RULE-MACHIAVELLI-TABOO` | Machiavelli: Taboo for All | LOCKED |
| `RULE-MACHIAVELLI-NO-MERCY` | Machiavelli: No Mercy | LOCKED |
| `RULE-MACHIAVELLI-PARANOIA` | Machiavelli: Paranoia Spreads | LOCKED |
| `RULE-MACHIAVELLI-PRESSURE` | Machiavelli: Double the Pressure | LOCKED |
| `RULE-MACHIAVELLI-CONFESSION` | Machiavelli: Reverse Confession | LOCKED |
| `RULE-GHOST` | Ghost | NEW LOCKED CORE / SOME DETAILS UNRESOLVED |
| `RULE-DIG-ME` | DIG ME | LOCKED CORE |
| `RULE-REVERSE-CONFESSION` | Reverse Confession | LOCKED CORE / RESOLUTION UNRESOLVED |
| `RULE-NOPE` | Nope | NEW NARROW ROLE |
| `RULE-PASS` | Pass / Not for Me | LOCKED WHERE SPECIFIED |
| `RULE-REWIND` | Rewind | LOCKED |
| `RULE-FLAG` | Flag | LOCKED |
| `RULE-ANSWER-PRIVACY` | Answer Modes and Privacy | LOCKED |
| `RULE-BOTS` | Bots | LOCKED |
| `RULE-PUBLIC-SOCIAL` | Public Social Visibility | LOCKED |
| `RULE-TIMEOUT` | Timeouts | LOCKED ARCHITECTURE |
| `RULE-MODAL` | Active Modal Close Rule | LOCKED |
| `RULE-DISCARD` | Resolved Discard vs Active Effect | LOCKED |
| `RULE-CONTINUATION` | Continue / Win Boundary | LOCKED |
| `RULE-UNRESOLVED` | Current Explicitly Unresolved Rules | UNRESOLVED REGISTRY |
| `RULE-PROVENANCE` | Rule Preservation Protocol | LOCKED PROCESS |
| `RULE-RULE-CHANGES` | Local Snapshot Warning | LOCKED PROCESS |

## Owner-approved normal-turn corrections — 2026-09-21

These clauses are **LOCKED owner corrections**. They supersede any older donor/runtime behavior that conflicts with them and belong to the existing `RULE-TURN`, `RULE-NUMBER`, and `RULE-DRAW` authority.

### Special cards played from hand

1. On a player's own normal turn, when the current top card on the **Play pile** is **not** a Special card, that player may play a Special card from their hand **regardless of the color or number** of the card that was played before them.
2. For this rule, **Special card** means any canonical non-`number` card family. **Regular card** means a canonical `number` card.
3. A player may **not** play a Special card from their hand immediately on top of a Special card that was played by the immediately preceding player.
4. When the Play pile top is such a preceding-player Special card, the current player must either:
   - play a Regular/`number` card that is otherwise legal under the ordinary Number/turn rules; or
   - draw a card.
5. This correction governs normal hand-play eligibility. It does not change the separate forced-on-draw rules for cards that auto-play when drawn, and it does not replace any family-specific Special-card resolution after a Special card is legally played.

### Voluntary draw even when a legal play exists

1. A player is **not forced to play a card from their hand merely because they have a legal match**.
2. On their normal turn, the player may choose to **skip playing from hand and draw a card instead**, even when one or more legal hand plays exist.
3. The presence of a legal playable card must therefore never disable the normal Draw choice by itself.
4. This correction does **not** resolve the already-open **Draw turn-loss / post-draw continuation** question. Whether drawing ends the turn, or whether a just-drawn card may be played immediately, remains unresolved until separately approved.

## Explicit unresolved registry

The following remain unresolved and **must not receive implementation defaults** during P1 or by convenience in later phases: Draw turn loss; Taboo timeout; Hijack final-card boundary; TAG nesting; group-Dare refusal and instigator participation; Chaos weights, short-hand behavior and left behavior; Paranoia Spreads probabilities; Ghost penalty and old attack details; DIG ME refusal; Reverse Confession final response/resolution; Nope eligibility for Truth or Chaos; extra Chaos catalogue; Pulse tuning; and any other clause explicitly identified as unresolved in the clean authority documents.

## P1 architecture invariants relevant to future rules

1. There is one authoritative gameplay engine. Clients submit commands and render authorized projections; they never own canonical game state transitions.
2. The future server validates identity, authorization and revision, invokes the engine, persists the result, commits it and only then publishes authorized state/events.
3. No local fallback runtime, compatibility game path, second reducer or frontend deck/prompt authority is permitted.
4. Command families remain separated by domain. Do not create a monolithic reducer, script, service or catch-all feature module.
5. Domain rules, application wiring/orchestration, presentation features and database/persistence adapters remain cleanly separated.
6. A legacy behavior can inform a proposal but cannot silently override the clean authority set.
7. P1 does not authorize gameplay implementation, API gameplay mutations, database behavior, board/card migration, Roulette UI extraction or final Telegram integration.

## Rebaseline note

The prior P1 frozen artifact bytes were lost through a corrupt transfer. Their historical hashes remain evidence of that lost publication, not a requirement to fabricate matching bytes. This file is the new explicit baseline and records only what the accessible authority set supports.
