# Cribbit Control Room - Admin, Operations, and Safe Change Architecture

> **Status:** product/architecture design authority for the planned Control Room.
>
> The Control Room is not a second application backend and not an arbitrary production editor. It is a privileged presentation over the same canonical Cribbit domains plus a controlled source-change workflow.

See also:

- `docs/product-scope.md`;
- `HANDOFF.md`;
- `gamerules.md`.

---

## 1. Goals

The Control Room should let authorized operators safely:

- manage/inspect users and identity state;
- inspect rooms and games;
- moderate prompts/content/reports;
- inspect libraries/group-memory metadata where authorized;
- monitor deployment/version/environment health;
- manage explicitly runtime-configurable settings;
- review audit history;
- propose rule/product/source changes through the Change Authority Guard.

It must reduce manual drift, not create a new place where rules can diverge.

---

## 2. Hard boundaries

The Control Room must **not**:

- contain a second game engine;
- directly edit canonical game state with arbitrary JSON;
- expose arbitrary SQL;
- overwrite source files in-place in production;
- bypass `gamerules.md`;
- bypass Git review/CI/staging for source-controlled changes;
- silently move provider identities between canonical users;
- reveal private hands/sealed content to ordinary admin roles without explicit break-glass authority;
- let Web-admin logic become canonical domain authority.

---

## 3. Initial modules

### 3.1 Users & Accounts

Capabilities may include:

- search canonical users;
- inspect profile/preferences;
- inspect linked Web/Telegram identities;
- inspect active auth sessions;
- moderation/account status;
- revoke sessions where authorized;
- explicit identity-link conflict diagnostics;
- auditable account actions.

No heuristic account merge.

### 3.2 Rooms & Games

Capabilities may include:

- inspect active/recent rooms;
- members/roles/readiness;
- room configuration/content eligibility;
- active game/session revision;
- current phase/effect/deadline diagnostics;
- reconnect/command receipt diagnostics;
- completed recap/history references.

Default is diagnostic/read-only. Any intervention requires a separately designed, typed command with authorization and audit.

### 3.3 Content & Libraries

Capabilities may include:

- Cribbit Originals;
- Community CHAOS moderation queue;
- prompt details/provenance;
- flags/reports;
- categories/tags/content world;
- authorship/reveal metadata;
- Live Room Pool diagnostics;
- House Deck ownership diagnostics where authorized;
- save/usage statistics where retained.

Operators do not directly alter another user's private content without an explicit moderation/safety policy.

### 3.4 Safety & Moderation

Capabilities:

- report queue;
- prompt/content moderation;
- reason-required decisions;
- creator accountability internally;
- action history;
- reversible/tombstone semantics where appropriate.

### 3.5 Operations

Show exact runtime identity:

- Web build SHA/version;
- Telegram build SHA/version;
- API Git SHA/version;
- environment;
- database target identity;
- migration/schema version;
- health;
- worker/deadline backlog;
- key service status without exposing secrets.

Version mismatch must be visible and block acceptance workflows.

### 3.6 Configuration

Only values explicitly designed as runtime configuration belong here.

Examples may include:

- feature flags;
- safe operational limits;
- moderation thresholds/policy switches;
- selected room defaults;
- rollout targeting.

Runtime configuration must have typed schema, validation, environment scope, audit, and rollback.

Game rules are not generic runtime config.

### 3.7 Rule Studio / Change Control

The Rule Studio is the human-facing layer over the Change Authority Guard.

For a proposed rule change it should show:

- canonical `RULE-*` text;
- current engine owner;
- affected commands/capabilities;
- projections;
- tests;
- Web surfaces;
- Telegram surfaces;
- simulation scenarios;
- persistence impact;
- unresolved clauses.

A source-controlled rule change flows:

```text
proposal
  -> change intent
  -> authority/impact analysis
  -> controlled source branch/patch
  -> focused tests
  -> exact diff review
  -> PR
  -> CI
  -> staging
  -> owner/admin approval
  -> production promotion
```

The Control Room never changes production engine semantics directly.

---

## 4. Two change classes

### 4.1 Runtime-managed changes

Can be applied through typed Admin APIs when explicitly designed for runtime management.

Examples:

- approve/reject community prompt;
- moderation disposition;
- feature flag;
- selected safe configuration;
- session revocation;
- non-destructive operational controls.

Requirements:

- RBAC;
- typed validation;
- reason where consequential;
- audit event;
- environment scope;
- before/after representation;
- rollback/reversal where applicable.

### 4.2 Source-controlled changes

Must go through Git/CI/staging.

Examples:

- gameplay rules;
- engine mechanics;
- command semantics;
- database schema;
- authorization model;
- core domain ownership;
- core UI behavior/components;
- cross-client contracts.

These use Change Intent -> Authority Registry -> Impact Checker -> branch/PR -> CI -> staging -> approval.

---

## 5. Roles and authorization

Exact roles are finalized in `ADMIN-001`, but the model should be capability-based rather than one universal admin bit.

Candidate capability groups:

- `admin.read`;
- `users.support`;
- `users.security`;
- `rooms.inspect`;
- `games.inspect`;
- `content.moderate`;
- `safety.review`;
- `ops.inspect`;
- `config.manage`;
- `changes.propose`;
- `changes.approve`;
- `breakglass.use`.

Production-sensitive capabilities require stronger authentication/re-authentication and narrower assignment.

The person proposing a high-impact source/config change should not automatically be its only approver where a two-person gate is configured.

---

## 6. Audit model

Every consequential admin action records at minimum:

- audit event ID;
- canonical admin user ID;
- effective role/capability;
- action type;
- target type/ID;
- environment;
- timestamp;
- reason;
- request/change ID;
- safe before/after summary where applicable;
- result;
- source commit/deployment identifiers for source-controlled changes;
- correlation/request ID.

Do not store secret values in audit payloads.

Audit history is append-oriented and not editable through ordinary Control Room actions.

---

## 7. Change Authority Guard integration

Planned roadmap components:

- `ARCH-GUARD-001` Product Authority Registry;
- `ARCH-GUARD-002` Change Intent / Impact Checker;
- `ARCH-GUARD-003` Diff Ownership Enforcement;
- `ARCH-GUARD-004` Rule Impact Registry;
- `ARCH-GUARD-005` Duplicate Authority Detection.

The Control Room Rule Studio consumes these. It does not replace them.

Example:

```text
Change: RULE-TAG
Authority: gamerules.md + canonical TAG engine flow
Expected source: engine TAG flow + focused tests
Consumers: capability/projection -> api-client -> Web/Telegram
DB impact: none unless declared/proven
Forbidden: independent Web/Telegram TAG semantics
```

---

## 8. Database implications

Before final schema freeze, classify whether the Control Room requires canonical tables/records for:

- admin roles/capability assignments;
- audit events;
- moderation decisions;
- runtime configuration/feature flags;
- change proposals/approvals;
- deployment/version observations if persisted;
- break-glass events.

Do not add all of these automatically. `ADMIN-001` and `DB-001` decide exact persistence versus external/Git-derived state.

Git remains authority for source-controlled rule/code changes.

---

## 9. Environment safeguards

Staging and production are separate scopes.

Control Room must make environment identity visually obvious.

Production actions:

- require explicit target;
- never default from staging context;
- require fresh version/environment verification for high-impact actions;
- use stronger confirmation/re-auth where designed;
- never expose raw secrets.

---

## 10. Delivery phases

### ADMIN-001 - Architecture/RBAC/audit design

Before DB freeze:

- exact module boundaries;
- capability model;
- audit contract;
- runtime-managed vs source-controlled classification;
- data model requirements;
- break-glass policy;
- Rule Studio/change workflow.

### ADMIN-002 - Read-only operational Control Room

Build first:

- users lookup;
- rooms/games diagnostics;
- content/moderation read surfaces;
- deployment/version/environment status;
- audit viewer skeleton.

### ADMIN-003 - Moderation and safe runtime actions

Add typed, auditable actions only after domain APIs exist.

### ADMIN-004 - Rule Studio / change proposals

Integrate authority registry, impact checker, Git/PR/CI/staging workflow.

### ADMIN-005 - Production hardening

Prove RBAC, audit, re-auth, environment separation, redaction, abuse resistance, and operational recovery.

---

## 11. Acceptance principle

The Control Room is successful when it makes safe operation and change propagation **more constrained and observable than editing source/services manually**.

It is not successful if it becomes another hidden authority path.
