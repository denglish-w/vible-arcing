# Implementation Plan: Verse Translation

**Branch**: `011-verse-translation` (feature identifier; planning performed on `main` without checkout) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-verse-translation/spec.md`.

## Summary

Add user-written, named chapter translations to the Greek reader: immediate editing, durable autosave, word-anchored segments and phrase groupings, independent copies, saved-work listing and portable exports. Use a separate translation document and SQLite table; reuse the current reader, settings, save controller, concurrency and security conventions. No generated translations, suggested boundaries, discourse-model conversion, new packages or prerequisite sibling features.

## Technical Context

**Language/Version**: TypeScript 5, React 19.3, Next.js 16.4 App Router; Node 26.13.1 pinned in `.node-version`.

**Primary Dependencies**: Existing React, Zustand 5, Zod 4, Drizzle ORM, better-sqlite3 and Radix primitives. No dependency additions.

**Storage**: `data/app.sqlite` for translation documents, chapter selection and recency; existing read-only `data/corpus.sqlite` for canonical word order and membership. Additive Drizzle app migration through the existing backup-before-migrate runner.

**Testing**: Vitest pure-model, autosave and in-memory database tests; Storybook interaction and axe tests through Chromium; real Next server browser scenarios for persistence, routing and exports. Use installed Playwright for integration validation, without adding a package.

**Target Platform**: Local Node server; desktop browsers and touch tablets, keyboard and screen reader, light/dark/sepia.

**Project Type**: Existing Next.js web application, one deployment and two SQLite stores.

**Performance Goals**: Local text updates within 100 ms with a 10-second server delay; autosave debounce 800 ms, durable within 3 seconds under SC-003 healthy conditions (each required request commits and acknowledges within 1 second, without failures/conflicts). The 10-second delay scenario checks input latency, status and retention rather than that durability deadline; picker remains usable with dozens of translations.

**Constraints**: Full document UTF-8 JSON maximum 512 KiB, existing saved-work limit. Each content field maximum 20,000 Unicode code points; names 1–80 after trimming. Preserve unsaved work on every failure; stable MACULA anchors; no network-security relaxation; WCAG 2.2 AA and token-only serif presentation.

**Scale/Scope**: One local user until 015; unlimited named records per chapter subject to storage, no fixed picker count. All five stories and FR-001–FR-035 are in scope. No import, comparison, publishing, chapter notes or accounts implementation.

## Constitution Check

Pre-research and post-design checks against constitution 1.1.0 both pass for this additive design.

| Gate                     | Before research                                         | After design / evidence                                                                                                                                |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| I: User interprets       | Pass: no external text or suggestions                   | Blank fields; equal boundary affordances; only explicit duplication copies user work                                                                   |
| II: One passage          | Pass: reader-level editing                              | Shared chapter and word components; normal click/tap/Enter still opens word detail                                                                     |
| III: Separate models     | Pass: translation is separate work                      | Dedicated model, validator and table; no propositions or analysis connections                                                                          |
| IV: Sources and method   | Pass: original interaction design                       | DESIGN.md controls styling; no prior-art code/text reuse                                                                                               |
| V: Work kept             | Pass: durable autosave and export required              | Shared translation validator; revision checks; idempotent creation; app-wide retained drafts/recovery; canonical source refresh before save validation |
| VI: Accessibility        | Pass: keyboard and touch required                       | Explicit selection mode, meaningful announcements and cross-theme browser acceptance gates                                                             |
| VII: Local protection    | Pass: retain Host/Origin checks                         | Every action checks Host; export uses existing same-origin policy; no accounts bypass                                                                  |
| Licensing                | Pass: no new dataset                                    | Only already-shipped Greek plus user content; existing attribution retained                                                                            |
| Workflow/spec precedence | Pass: read current OpenSpec saved-work and reader specs | Additive scope, no existing OpenSpec behavior weakened; synchronize new requirements via an OpenSpec delta during implementation                       |

The constitution's Sync Impact Report notes older PRODUCT.md/CLAUDE.md wording. This plan uses the explicit 1.1.0 translation rules, retains local-only operation and introduces no reference dataset. Broader documentation reconciliation belongs to the amendment/sibling work, not this planning command.

## Project Structure

### Documentation (this feature)

```text
specs/011-verse-translation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/
│   ├── persistence.md
│   └── reader-interactions.md
└── quickstart.md
```

`tasks.md` is deliberately deferred to `/speckit-tasks 011`.

### Source Code (repository root)

```text
src/lib/translation/               # new model, validation, pure edits, naming, export helpers + tests
src/lib/autosave.ts                # extend with awaitable flush; preserve existing consumers
src/lib/use-autosave.ts            # retain record-scoped binding
src/lib/settings.ts                # validated showTranslate boolean, default false
src/app/layout.tsx                 # mount client translation provider and global recovery above all routes
src/db/schema/app.ts               # translations, chapter preferences and recency
src/db/translations.ts             # new injected-connection persistence + tests
src/db/work.ts                     # exhaustive kind dispatch and merged list/delete support
src/db/server.ts                   # guarded server-only wiring
src/app/(work)/actions.ts          # typed translation mutations or delegated translation action module
src/app/(work)/work/page.tsx        # existing list integration
src/app/read/[book]/[chapter]/page.tsx
src/app/api/translations/[id]/export/route.ts
src/components/reading/            # reader integration; translation session, picker, verse editor + stories
src/components/work/              # translation links, labels, delete/export
src/app/globals.css                # existing tokens and responsive reader rules
scripts/                          # bounded real-server validation scenario if needed
drizzle/                          # generated app migration
```

Preserve the single Next.js tree and colocated tests; avoid a new service or generic persistence framework. Existing analyses/diagrams continue to use their current model and routes. Planned new paths are design targets, not claims that functionality exists.

## Phase 0: Research

[research.md](research.md) resolves repository integration decisions, limits, draft lifecycle, transaction boundaries, corpus recovery and interaction precedence. No unresolved technical clarification remains.

## Phase 1: Design and Contracts

[data-model.md](data-model.md) defines documents, SQLite constraints, state transitions and validation. [Persistence contracts](contracts/persistence.md) define action outcomes and export shape. [Reader interactions](contracts/reader-interactions.md) define complete keyboard/touch behavior and recovery. [quickstart.md](quickstart.md) defines implementation acceptance checks, not current working commands for an implemented feature.

## Delivery Order and Verification

1. Establish pure model/validator and edit fixtures: boundaries, nested ranges, labels after z, lossless merge and empty-verse normalization.
2. Add migration, transaction-safe naming, idempotent creation, revision-checked writes and selection storage; verify migration backup and corpus isolation.
3. Extend autosave with tested awaitable flush and retain failed drafts/recovery under the root app layout across every internal route, including Back/Forward. Implement first-write creation without duplicate records.
4. Compose verse editor, picker and Greek marks; test normal word help, keyboard, touch, focus and theme behavior in stories.
5. Integrate list/open/delete/export and stale-corpus repair. For unchanged ordered word ids, prepare canonical Greek snapshots before save validation, without changing stored JSON on reads/exports or touching user structure/text. Run real-server scenarios and complete OpenSpec/implemented Lat documentation synchronization.

Do not release a writing-only slice without reliable persistence, recovery and export. Translation multiplicity is part of the original storage design even if picker UI is built later.

## Complexity Tracking

No constitutional violations or additional dependencies. Source excerpts add bounded storage so exports remain readable after a corpus change; retained draft sessions prevent a failed background save from disappearing when its editor is hidden. Neither warrants a new persistence abstraction.
