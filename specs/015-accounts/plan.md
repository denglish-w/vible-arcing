# Implementation Plan: Accounts and Sign-in

**Branch**: `015-accounts` (feature identifier; planning on `main`, no checkout) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/015-accounts/spec.md`.

## Summary

Add real accounts to the existing Next.js application, with email/password, Google, Microsoft and finally Apple; isolate all personal work and settings in SQLite. Local and live use the same authentication, authorization and account services, with configuration controlling transport and network policy. Preserve pre-account work through a backed-up, atomic local ownership claim. Reading remains public.

This is a design, not an implementation. All nine stories and FR-001–FR-045 are covered. P1 is an internal local milestone; recovery, export/deletion and the security review remain mandatory before real network use, regardless of story priority.

## Technical Context

**Language/Version**: TypeScript 5, Node 26.13.1, Next.js 16.4.6 App Router, React 19.3.0; retain the repository's pinned runtime.

**Primary Dependencies**: Existing Drizzle 0.45, better-sqlite3 13, Zod 4, Zustand 5 and Radix controls. Proposed authentication dependency: Better Auth and its Drizzle adapter, exact matching stable versions verified in [research.md](research.md). No dependency installed by planning; do not build OAuth/JWT/password cryptography in the application. App-owned policy remains explicit rather than relying on library defaults. Live mail uses the documented Resend HTTP API via built-in fetch, without a mail SDK.

**Storage**: Existing `app.sqlite` for accounts, methods, database sessions, email-token digests, settings, delivery operations and ownership; unchanged read-only `corpus.sqlite`. Drizzle migrations and private SQLite backups; no database-engine migration or external auth service.

**Testing**: Vitest unit and real SQLite integration tests; Storybook Chromium interaction/axe tests; installed Playwright against a real Next server for cookies, callbacks, account switching, isolation and startup refusal. Offline provider fixtures exercise the same callback validation; real test credentials separately prove interoperability.

**Target Platform**: One Node process, developer computer or HTTPS deployment; desktop and touch-tablet browsers, keyboard and screen reader, all three themes.

**Project Type**: Existing full-stack web application, one source tree and two SQLite stores.

**Performance Goals**: SC-008/009: signup and confirmation under two minutes, returning sign-in under 30 seconds, reset under five minutes in representative local tests. Preserve immediate local edits during slow authentication/save requests. Do not add a database or provider request to public word rendering. No speculative throughput commitment.

**Constraints**: Local Host/Origin protection unchanged; live fails closed on configuration or unowned work. Ten-character password minimum plus bundled common-password refusal; one-hour email links; 15-minute fresh authentication; nonpersistent browser cookie plus 12-hour idle limit, or explicit 30-day persistent session. No implicit email linking; no provider receives work. SQLite remains a single-server deployment.

Nonpersistent signin follows browser session restoration, with the server idle limit always enforced. Built-in confirmed-inbox recovery issues a normal session independently of configured methods. Account export/import uses one streamed NDJSON file with bounded upload/processing batches and no total file/record cap. Completion notices are committed to an outbox with the mutation and sent only afterward; delivery failure never restores a deleted account.

**Scale/Scope**: Multiple isolated accounts; analyses/diagrams now, translations and attempts when their sibling tables exist. Settings include spec 012 fields when present. No hosting selection, payments, teams, sharing or admin console.

## Constitution Check

Gates were evaluated against constitution 1.1.0 before research and re-evaluated after the design below. Both passes permit this design; release evidence is required during implementation.

| Gate                         | Before research                         | Post-design evidence                                                                                                                         |
| ---------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| I: User interprets           | Pass: identity feature only             | No automatic analysis, translation or parsing suggestions; provider scopes limited to identity                                               |
| II: One passage              | Pass: keep reading public               | Same-origin return path preserves chapter/view; auth interruption retains drafts                                                             |
| III: Separate models         | Pass: add owner metadata only           | No analysis/diagram/translation conversion; existing document validators remain authoritative                                                |
| IV: Sources                  | Pass: original product UI               | DESIGN.md and existing shell; no copied provider/tool interface or dataset                                                                   |
| V: Work kept                 | Pass: migration/export required         | Backup before schema and claim; byte-preserving ownership; revision checks; owner-bound drafts; account export/import                        |
| VI: Accessibility            | Pass: all screens included              | UI contract covers keyboard/touch, errors, focus and three-theme axe evidence                                                                |
| VII: Local/network accounts  | Pass: accounts are the scope            | Local unchanged; HTTPS/credentials/legal/startup gates; owner checks at database boundary; security review before network release            |
| Licensing                    | Pass: no new corpus data                | Record auth package licences and provenance/licence of bundled common-password list before shipping                                          |
| Workflow and spec precedence | Pass: read existing OpenSpec and source | Preserve current behavior until full feature; reconcile accounts exception and owner-only semantics in both spec systems with implementation |

Current OpenSpec local-server/saved-work requirements describe the pre-account implementation. They are not silently overridden: the implementation must introduce an accounts delta and update affected 002/004/005 requirements together. PRODUCT.md's expected Postgres migration is a nonbinding expectation; spec 015 explicitly keeps SQLite. Reconcile the constitution amendment's stale PRODUCT.md/CLAUDE.md wording in that implementation change. Planning changes no implemented behavior. The clarification in spec.md explicitly defines completed account creation versus provisional signup. No OpenSpec accounts counterpart exists yet; its new delta and affected current requirements are an implementation prerequisite.

## Project Structure

### Documentation (this feature)

```text
specs/015-accounts/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── account-api.md
    ├── deployment.md
    └── ui.md
```

`tasks.md` is produced by the separate speckit-tasks command.

### Source Code (repository root)

```text
src/lib/auth/                     # server auth, provider policy, session/actor guards, email, config + tests
src/lib/account/                  # browser-safe export/import schemas and settings validation
src/lib/settings.ts               # extract pure mergeSettings; separate anonymous/account state
src/lib/autosave.ts                # owner/session-bound saves and retained drafts
src/db/schema/app.ts               # auth schema, owner columns, constraints and claim state
src/db/accounts.ts                 # atomic lifecycle, ownership claim, settings/export/import
src/db/work.ts                     # require actor in every personal query/mutation
src/db/attempts.ts                 # owner scoping when 010 exists
src/db/translations.ts             # owner scoping when 011 exists
src/db/server.ts                   # authoritative request actor and host checks
src/app/api/auth/[...all]/route.ts  # guarded auth-library endpoint adapter
src/app/api/account/               # session, export/import and lifecycle facade
src/app/(account)/                 # signup/signin/confirm/reset/account/privacy/terms pages
src/app/(work)/                    # list, actions, detail pages: owner-only
src/app/api/analyses/[id]/export/route.ts
src/app/read/                     # public corpus, owner-only personal additions
src/components/account/            # forms/menu/status/draft recovery + stories
src/proxy.ts                       # mode-aware Host/HTTPS gate, not authorization
src/instrumentation.ts             # startup validation and existing local warning
scripts/start.sh                   # pre-listen migration/config checks
scripts/docker-entrypoint.sh       # same pre-listen checks
scripts/                          # dev preflight and real-server account QA
Dockerfile                        # copy new startup module dependencies
.env.example                      # local defaults and explicit live variables
drizzle/app/                      # generated app migrations
```

**Structure Decision**: Keep the single Next.js project and colocated tests. Auth-library tables are mapped explicitly through Drizzle; app services enforce consent, linking, ownership and account changes. The startup-only modules follow `src/db/README.md` rules (Node-compatible imports, no browser/server-only aliases). New paths are implementation targets, not present functionality.

## Phase 0: Research

[research.md](research.md) records library selection, email trust, session behavior, migration, delivery, settings and sibling integration. Technical choices are resolved; no open technical clarification blocks Phase 1.

## Phase 1: Design and Contracts

[data-model.md](data-model.md) defines records, constraints and transitions. [Account API](contracts/account-api.md), [deployment](contracts/deployment.md) and [UI](contracts/ui.md) contracts define observable behavior. [quickstart.md](quickstart.md) maps validation scenarios to the feature's success criteria.

## Delivery Order and Verification

1. Reconcile the affected OpenSpec/Spec Kit requirements and deployment wording. Establish migration, isolation and account-switch regression fixtures before exposure changes.
2. Add auth/config schema, private delivery capture and backed-up pending ownership state; validate every launch path before listening. Add email signup/confirmation, consent and database sessions in local mode.
3. Make every personal database function require an actor, then integrate existing routes, settings and draft queues. Inventory counts, receipts, recency and future sibling stores as well as main documents; test foreign and missing ids identically.
4. Add reset, fresh authentication, email change, method management, account export/import and deletion. Complete multi-tab and two-browser acceptance tests.
5. Add Google/Microsoft using real local test credentials and adversarial callback fixtures; add Apple last with a public HTTPS callback and relay configuration.
6. Add live deployment configuration without changing account logic. Run startup/refusal/HTTPS matrix, real-server end-to-end tests, all existing gates and independent code/security review before any real network release.
7. Update current-state Lat sections with implemented behavior and run `lat check`. This planning-only command leaves Lat unchanged.

## Complexity Tracking

No constitutional exception is requested. Additional tables represent concrete identity, claim and delivery states; a new service, database engine, generic repository framework and custom OAuth implementation are rejected as unnecessary.
