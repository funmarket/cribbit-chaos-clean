# Cribbit CHAOS Recovery Charter

## Purpose

This repository is the recovery trunk for Cribbit CHAOS. The goal is to build one playable, secure, scalable multiplayer party-card game with two thin clients: Web and Telegram Mini App.

This charter records the recovery boundary before any new product implementation work. It is intentionally conservative: no feature is considered complete without source evidence and a runnable verification check.

## Recovery trunk

The recovery trunk is `funmarket/cribbit-chaos-clean` on branch `integration/clean-rebuild`.

This trunk is chosen because it currently has the strongest architecture guards, canonical inventory evidence, command-service scaffolding, server-only database boundaries, outbox/deadline primitives, and real API build graph checks.

## Quarantined reference sources

The old repository remains reference-only:

- `funmarket/cribbit-chaos` `main` at `962d268852b1e8f12535c8a51f0b29b37771383c`
- `funmarket/cribbit-chaos` frozen visual/integration source at `77c455901516205633eb15e96f51a84206eb8174`

These sources may be inspected for approved visual behavior, card/rule evidence, prior tests, and historical decisions. They must not be copied wholesale.

## Explicitly quarantined production code

The following patterns from the old repository are not production authorities:

- browser-local gameplay runtimes;
- legacy compatibility gameplay runtime;
- `@ts-nocheck` gameplay controllers;
- capture-phase global gameplay click handlers;
- client-side deck construction, prompt selection, legality, timers, bots, winners, or turn resolution;
- DOM text or `MutationObserver` state reconstruction;
- duplicate command vocabularies that let UI, API, and engine disagree.

Any migration from old source must be reviewed as a new server-authoritative implementation with tests. The old runtime behavior is evidence, not authority.

## Architecture invariants

Cribbit CHAOS must have exactly one gameplay authority.

- The backend owns gameplay transitions.
- The backend owns authoritative room/session state.
- The backend owns prompt selection and private information boundaries.
- Clients render authorized projections and submit commands only.
- Web and Telegram are access surfaces into the same backend game, account system, room/session system, and database.
- Internal Cribbit user UUIDs are the primary user IDs.
- Telegram IDs are provider identities, never primary user IDs.
- Telegram identity must be established by server-validated raw `initData`; `initDataUnsafe` is display-only.
- Secrets and database connection strings must never be placed in Vite/client environment variables.

## Product source of truth

The canonical starting inventory is CHAOS-133-V1: 133 physical cards and 19 families.

Unresolved rules remain unresolved until explicitly decided and tested. The implementation must not silently invent behavior for unresolved rule clauses.

The approved V4 presentation is a visual baseline. It can guide rendering, layout, and interaction feel, but it cannot reintroduce client gameplay authority.

## Deployment truth

The existing Cloudflare `cribbit-chaos` Worker is not treated as a working production deployment until proven otherwise by readback after a repo-controlled deployment.

The last inspected Cloudflare state showed:

- no enabled URL;
- manual dashboard deployments only;
- no Git integration;
- no bindings;
- no runtime variables or secrets shown;
- Workers Logs and Traces disabled;
- no D1 databases in the account.

Deployment work must pick one canonical topology and verify it with live readback. Platform dashboard edits are not the source of truth unless the same configuration is captured in repo-controlled deployment documentation or automation.

## Recovery sequence

1. Freeze drift and keep old repositories read-only as references.
2. Keep architecture guards green before adding product behavior.
3. Certify cards and rules with rule IDs and tests.
4. Build the server-authoritative engine and projection boundary.
5. Wire API command processing through authentication, membership, transaction, command receipt, snapshot, outbox, and deadline workers.
6. Restore Web and Telegram as renderers of server projections.
7. Add staging deployment and live smoke checks.
8. Add reconnect, load, observability, and security gates before production.

## Completion standard

Do not call the app production-ready unless all are true or explicitly recorded as accepted launch risk:

- one authoritative server engine;
- no client gameplay writes;
- Telegram raw `initData` validated server-side;
- persisted rooms and accounts;
- reconnect restores the same room/session/revision;
- commands are idempotent;
- Web and Telegram play the same game;
- V4 UI is preserved enough for real play;
- automated tests cover core rules and transport;
- staging deploy exists;
- secrets are not in clients;
- at least a 50-room load story exists in architecture and verification evidence.
