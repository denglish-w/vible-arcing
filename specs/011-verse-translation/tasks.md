---
description: "Dependency-ordered implementation tasks for verse translation"
---

# Tasks: Verse Translation

**Input**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [persistence contract](contracts/persistence.md), [reader contract](contracts/reader-interactions.md) and [quickstart.md](quickstart.md).

**Prerequisites**: Existing Next.js reader, saved-work persistence and local Host protection; constitution 1.1.0. Feature 011 is selected explicitly; do not accidentally resolve the currently stored 010 feature pointer. No sibling feature, account framework, new package or new deployment is required.

**Tests**: Included because the specification explicitly defines independent tests, acceptance scenarios and measurable failure/accessibility outcomes. Add the relevant regression tests before changing existing autosave or kind dispatch; establish failing behavior before implementation, then run targeted checks. Future code tests should carry precise Lat references when their implemented test documentation is added.

**Organization**: Shared foundation followed by US1 (P1), US2–US4 (P2) and US5 (P3). All tasks below are pending implementation; this document does not claim the feature exists.

## Format and Paths

Tasks use `- [ ] TNNN [P?] [USn?] Description with file paths`. `[P]` identifies independent file ownership within the stated phase after its prerequisites; it does not authorize concurrent edits to shared files. Paths are repository-relative; new files are explicit implementation targets. Use existing npm, Vitest, Storybook and Playwright installations.

## Phase 1: Setup

Ground the implementation in the supplied artifacts and prepare disposable fixtures, without reinstalling the application or touching real saved work.

- [ ] T001 Record the additive feature requirements and separate translation model in `openspec/changes/verse-translation/proposal.md`, `openspec/changes/verse-translation/design.md` and its `specs/app/verse-translation/spec.md`; preserve existing OpenSpec saved-work/reader guarantees and the limits in `specs/011-verse-translation/data-model.md`.

- [ ] T002 Add a small canonical chapter fixture, long-verse fixture (more than 26 words), stable ids and independent translation documents in `src/lib/translation/fixtures.ts`; use these across pure, database and Storybook checks without a real data directory.

## Phase 2: Foundational (Blocking Prerequisites)

Complete this phase before user-story implementation. Shared contracts must support multiple translations from the start; story-specific editing and management UI follow later.

- [ ] T003 [P] Define `TranslationDocument`, verse, segment, grouping and diagnostics types in `src/lib/translation/model.ts`: “1; reject unsupported versions”, “One canonical installed chapter, currently SBLGNT”, sparse verse entries, stable UUIDs and MACULA word endpoints; keep this model independent from analyses and diagrams.

- [ ] T004 [P] Implement shared name/count/size helpers in `src/lib/translation/naming.ts` and `src/lib/translation/limits.ts`: “Trimmed 1–80 code point display name; NFC/uppercase/lowercase uniqueness key”, every content field 20,000 Unicode code points, 90% warning threshold and “Whole translation document serialized as JSON, at most 512 KiB UTF-8”; allocate the lowest unused Translation N and copy suffixes with base truncation reserving suffix space.

- [ ] T005 Define the SQLite translations, preferences, recency and creation-receipt tables in `src/db/schema/app.ts`: “Server record UUID; independent identity for duplicates”, unique `(edition, book, chapter, nameKey)`, “Server-derived chapter metadata, even for an explicitly created empty record”, “Starts at 1, incremented on every content save or rename”, and “Server timestamps; selection alone changes neither”; constrain chapter/active identity in persistence transactions, and retain receipt tombstones after deletion.

- [ ] T006 Generate the additive app migration under `drizzle/app/` using `drizzle.app.config.ts`; extend `src/db/migrate.test.ts` to prove existing analyses/diagrams survive and existing backup-before-migrate/failure-stop behavior remains intact; do not edit generated migration identities by hand.

- [ ] T007 Implement the shared browser-safe validator in `src/lib/translation/validate.ts` and normalization in `src/lib/translation/normalize.ts`: canonical verse membership, unique UUIDs/boundaries, no last-word boundary, segments “exactly cover the source verse once, with no gaps or overlap”, grouping range “must contain at least two words”, within one segment/verse, nested/disjoint only, no duplicate intervals/partial overlap; validate text/version/bytes and source snapshots, returning entity-specific errors.

- [ ] T008 Add adversarial fixtures in `src/lib/translation/validate.test.ts`, `src/lib/translation/naming.test.ts` and `src/lib/translation/normalize.test.ts` covering unknown/version/size failures, forged Greek rejected by validation and server-canonical preparation that never stores substituted Greek, same-id text/punctuation refresh before validation, Unicode names/counts, range rules and “A whitespace-only string is not empty”; normalize away only a default unsplit verse with no groups and zero-length fields, never its parent translation.

- [ ] T009 Add fake-timer regressions to `src/lib/autosave.test.ts`, then extend `src/lib/autosave.ts` with awaitable flush serialized with an in-flight save and latest queued generation; return clean/blocked/failure status without duplicate sends, preserving existing analysis/diagram consumers and retry behavior; keep `src/lib/use-autosave.ts` bound to its record key.

- [ ] T010 Add explicit translation kind/version/result types and exhaustive dispatch boundaries in `src/db/work.ts` and guarded wiring in `src/db/server.ts`; keep translation writes in `src/db/translations.ts` and remove binary fallthrough to diagrams, with regressions in `src/db/work.test.ts` and `src/db/server.test.ts`.

## Phase 3: User Story 1 — Write my own translation under each verse (P1)

**Goal**: Blank per-verse translation/notes fields, immediate edits, durable autosave and recoverable failures.

**Independent test**: Write in two verses, reload, switch browser and restart the server; verify identical text. Repeat by keyboard and touch. Untouched defaults store nothing; clearing a simple verse removes its entry. With slow/failed saves, keep all text and offer a local download.

**Tests first**: T011–T013 can be authored together after foundation. Subsequent tasks are ordered implementation dependencies.

- [ ] T011 [P] [US1] [Tests] Add creation/save action contract tests in `src/app/(work)/translation-actions.test.ts` for Host-first checking, typed invalid/unknown-word/not-found/too-large/unknown-version/corpus-missing outcomes, stale/deleted precedence and unchanged storage on refusal (FR-013–FR-019, FR-032).

- [ ] T012 [P] [US1] [Tests] Add persistence tests in `src/db/translations.test.ts` for restart/readback, metadata-only records, absent untouched defaults, sparse verse removal, receipt replay/tombstones, differing-payload receipt refusal and concurrent first-write name allocation (SC-002, SC-006, SC-010).

- [ ] T013 [P] [US1] [Tests] Add client session tests in `src/lib/translation/session.test.ts` for edits during delayed creation, lost response/retry generations, 800 ms debounce, conflict/copy/overwrite/download, hidden editor, app-wide route retention, full-document leave guard and record isolation; separate SC-003 healthy requests (commit/acknowledge within 1 second without failures/conflicts) from the ten-second-delay input/status/no-loss test (SC-001, SC-003, SC-004).

- [ ] T014 [US1] Implement load/create/save persistence in `src/db/translations.ts` using injected app/corpus connections and server-derived chapter metadata; store source words only for saved verses; after missing-record/stale-revision prechecks, when stored/current ordered ids match, rebuild the candidate snapshots from server-canonical Greek before shared validation/byte checks, ignoring client-supplied Greek; persist only on accepted revision-checked save, preserving user text/structure and old snapshots on reads/exports/conflicts/refusals; use conditional revisions and transactional name allocation/receipt insertion; retries return only the original acknowledged result and never resurrect deleted work.

- [ ] T015 [US1] Implement Zod-validated load/create/save/copy actions in `src/app/(work)/translation-actions.ts`; recheck Host before database access, load canonical words server-side, return current revision/name/id, distinguish transport errors from permanent refusals and revalidate `/work` after mutations; copy recovery uses only the user’s snapshot.

- [ ] T016 [US1] Implement creation bootstrap and record-scoped editing in `src/lib/translation/session.ts`: freeze creation payload plus generation before autosave starts, preserve subsequent edits for a revisioned follow-up, use immutable local snapshots and never acknowledge unsent generations; an untouched default stays memory-only while content or structural edits persist it.

- [ ] T017 [US1] Implement `translation-recovery` local downloads in `src/lib/translation/export.ts` with identity/name/chapter, current unsaved document, source Greek and errors, even for oversized/invalid content with the server offline; keep this available before the saved export route exists.

- [ ] T018 [US1] Implement a retained session provider in `src/components/reading/translation-provider.tsx`, mounted above all route children in `src/app/layout.tsx` together with a global recovery summary, and recovery UI in `src/components/reading/translation-save-status.tsx`; keep the provider unkeyed by pathname/record; preserve dirty sessions across chapter links, `/work`, book-title navigation, logo/home, credits and browser Back/Forward, initiate a flush before internal departure and keep return/retry/download reachable on destination pages even on failure; guard all dirty sessions on full-document unload and provide conflict overwrite/copy/download without relying on dispose; hiding Translate must leave recovery reachable.

- [ ] T019 [US1] Extend `src/lib/settings.ts`, `src/lib/settings.test.ts` and `src/components/reading/display-menu.tsx` with independently validated `showTranslate`, default false, preserving storage-failure fallback and all existing settings (FR-001–FR-002).

- [ ] T020 [US1] Implement labelled blank translation/notes textareas in `src/components/reading/verse-translation.tsx`, plus translation session composition in `src/components/reading/translation-reader.tsx`; show field limits/counters and preserve over-limit paste locally without truncation; render plain text with English control semantics and token-based serif styles in `src/app/globals.css`.

- [ ] T021 [US1] Wire chapter translation loading and reader integration in `src/app/read/[book]/[chapter]/page.tsx`, `src/components/reading/reader.tsx` and `src/components/reading/greek-text.tsx`; preserve word click/tap/Enter details, POS/spacing/punctuation and Greek reading order; show active name/selection control, disable Translate with explanation when corpus is unavailable and never fill user fields from any reference source.

- [ ] T022 [US1] Add `src/components/reading/verse-translation.stories.tsx` and `src/components/reading/translation-save-status.stories.tsx` for empty/long/error/conflict states, hidden recovery, keyboard/touch and word-help preservation; run US1 scenarios from `specs/011-verse-translation/quickstart.md` and record measured delayed-server input/save latency there.

## Phase 4: User Story 2 — Split and merge segments (P2)

**Goal**: User-chosen verse boundaries, stable segments and lossless ordered merge.

**Independent test**: Split twice, fill both fields, merge, reload and compare word anchors, labels and exact text; repeat by keyboard and touch. Invalid boundaries and split-through-group attempts leave the record unchanged.

**Prerequisite**: US1. Use foundation grouping fixtures for split refusals even before US3 UI exists.

- [ ] T023 [P] [US2] [Tests] Add `src/lib/translation/segments.test.ts` covering every internal boundary, exterior refusal, labels past z, left-side text retention, merge confirmation conditions, grouping reassociation and overflow retention (FR-005–FR-008).

- [ ] T024 [P] [US2] [Tests] Add split/merge keyboard, touch, Escape and confirmation scenarios in `src/components/reading/segment-controls.stories.tsx`; test hidden verse numbers and two-cue marks without relying on US3 UI.

- [ ] T025 [US2] Implement pure split/merge/label operations in `src/lib/translation/segments.ts`: stable left UUID, empty right fields, two-newline joins only between nonempty fields, derived bijective labels and ordered text preservation; block splits through groupings and preserve all groups on merge, running the shared validator.

- [ ] T026 [US2] Implement accessible split/merge controls and text-collision preview in `src/components/reading/segment-controls.tsx`; offer all internal boundaries equally, explain blocked ones, allow keyboard/tap selection, cancel without mutation and return focus as specified in `specs/011-verse-translation/contracts/reader-interactions.md`.

- [ ] T027 [US2] Integrate segment field editing and word boundary glyphs in `src/components/reading/verse-translation.tsx`, `src/components/reading/greek-text.tsx` and `src/app/globals.css`; persist word ids rather than positions and keep pending overflow text/download available.

- [ ] T028 [US2] Extend `src/db/translations.test.ts` for split/merge save-and-reopen and run US2 reload/keyboard/touch scenarios in `specs/011-verse-translation/quickstart.md`, including more than 26 segments and grouping-blocked boundaries.

## Phase 5: User Story 3 — Group phrase words (P2)

**Goal**: Explicit contiguous groupings with independent rendering/notes, nested endpoints and two-way focus navigation.

**Independent test**: Make two disjoint groups and a nested group using mouse, keyboard and touch; reject partial overlap, duplicate and cross-boundary ranges. Edit a rendering, reload, navigate marks/entries and delete one group without affecting others.

**Prerequisites**: US1 and US2 integration. All range rules already exist in the foundational validator.

- [ ] T029 [P] [US3] [Tests] Add pure selection/grouping cases in `src/lib/translation/groupings.test.ts`, including reversed endpoints, same-boundary nesting, single word, exact duplicates, cross-segment/verse ranges, deletion and unchanged nested siblings (FR-009–FR-012).

- [ ] T030 [P] [US3] [Tests] Add interaction/axe scenarios in `src/components/reading/phrase-grouping.stories.tsx` for drag, Shift-click, keyboard extension, tap-first/tap-last, scrolling, Escape and mark-entry focus round trips.

- [ ] T031 [US3] Implement grouping and pending-selection operations in `src/lib/translation/groupings.ts`: normalize reading order, require stable UUID/segmentId and MACULA endpoints, create empty rendering/notes, keep invalid selections editable with reasons and remove only the selected grouping.

- [ ] T032 [US3] Implement range-input behavior in `src/components/reading/phrase-selection.tsx`; preserve normal word detail activation, suppress the post-drag click only after deliberate selection, support Space anchor/Shift+Arrow extension and explicit touch endpoints without capturing scrolling.

- [ ] T033 [US3] Render nested start/end marks and grouping fields in `src/components/reading/phrase-grouping.tsx`, integrating `src/components/reading/greek-text.tsx` and `src/components/reading/verse-translation.tsx`; order outer-open/inner-close correctly, label endpoints, add Back to phrase and restore focus on deletion; use theme tokens and distinct glyphs in `src/app/globals.css`.

- [ ] T034 [US3] Extend `src/db/translations.test.ts` for nested groups/rendering/notes reload, split-through-group refusal and one-group deletion, then execute the US3 mouse/keyboard/touch scenarios in `specs/011-verse-translation/quickstart.md`.

## Phase 6: User Story 4 — Several named translations (P2)

**Goal**: Independent named chapter records with server-persisted active selection, safe management and switching.

**Independent test**: Create Literal and Smooth, give them different structures/text, duplicate and edit the copy, rename, delete, reopen in another browser and check exact isolation/active selection. Repeat management by keyboard, screen reader and touch.

**Prerequisite**: US1; complete US2 and US3 before full structure-copy acceptance. T035 and T036 are independent tests; shared persistence and reader files remain sequential integration work.

- [ ] T035 [P] [US4] [Tests] Add naming/management transaction tests in `src/db/translation-management.test.ts` for unique Unicode keys, default/copy allocation races, 80-character copy suffixes, revision-checked rename/delete, source-revision duplicate, preference/recency and receipt tombstones (FR-026–FR-033).

- [ ] T036 [P] [US4] [Tests] Add picker scenarios in `src/components/reading/translation-picker.stories.tsx` for dozens of records, empty names, limit/collision errors, keyboard focus/Escape, announcements and tap-only management (FR-035).

- [ ] T037 [US4] Implement select/rename/duplicate/delete and fallback resolution in `src/db/translations.ts`: successful create/duplicate atomically activate and record recency; explicit selection changes neither revision nor updatedAt; delete active chooses previously used remaining work, while stale preference on chapter open uses most-recently-modified then id; wrong-chapter requested ids are not-found.

- [ ] T038 [US4] Expose management actions in `src/app/(work)/translation-actions.ts` with chapter membership checks, expected revisions and existing typed refusal messages; explicit create and rename of an unsaved default persist empty work, duplicate copies exactly the checked source revision, deletion removes only one record and preserves retry tombstones.

- [ ] T039 [US4] Implement labelled choice plus create/rename/duplicate/delete in `src/components/reading/translation-picker.tsx`; allocate names under the shared policy, show actual server names, bound scrolling with no fixed record count, confirm deletion including dirty content, keep old names after refusal and show purpose/name/count to assistive technology.

- [ ] T040 [US4] Wire picker management/switching into `src/components/reading/translation-reader.tsx` and `src/lib/translation/session.ts`; flush source before duplicate/rename/create, send old pending snapshot before switch, retain failed/blocked sessions with named recovery links and prevent late responses from crossing record identities (FR-034).

- [ ] T041 [US4] Persist active chapter selection through loading and reader navigation in `src/app/read/[book]/[chapter]/page.tsx` and `src/components/reading/translation-reader.tsx`; test fresh-browser selection, deletion fallback and last-record-to-default behavior without creating records during read.

- [ ] T042 [US4] Add delayed-first-create/switch and multi-tab rename/delete/copy isolation regressions in `src/lib/translation/session.test.ts` and `src/db/translation-management.test.ts`; verify different translations never conflict, copies do not alias originals and a third writer can re-conflict an overwrite.

- [ ] T043 [US4] Run US4 full structure-copy and keyboard/screen-reader/touch management scenarios from `specs/011-verse-translation/quickstart.md`; verify each action is achievable within 30 seconds and explicitly created/renamed/duplicated empty translations remain stored.

## Phase 7: User Story 5 — Saved work and portable export (P3)

**Goal**: List, reopen, delete and export exactly one named translation, including readable source Greek when corpus changes.

**Independent test**: List two translations beside an analysis/diagram; reopen a specific id with Translate enabled, download and compare exact document plus all segment/group Greek, cancel/confirm deletion and verify siblings unchanged. Repeat export with missing or changed corpus.

**Prerequisite**: US1 persistence and recovery. US4 supplies management/selection; final acceptance includes US2/US3 content.

- [ ] T044 [P] [US5] [Tests] Add export route boundary/format cases in `src/app/api/translations/[id]/export/route.test.ts`, including foreign Host/Origin, missing fetch metadata, 404, safe filename/headers, empty records, exact saved JSON, missing corpus and sibling exclusion (FR-020–FR-021).

- [ ] T045 [P] [US5] [Tests] Add saved-work list/open/delete stories in `src/components/work/work-list.stories.tsx`, including translation labels, active-id chapter links, export and delete cancel/confirm with long names.

- [ ] T046 [US5] Extend `src/lib/translation/export.ts` with the saved `translation-export` version-1 envelope and source-snapshot Greek derivation per verse/segment/group; preserve source punctuation and stored JSON without mutation, retain separate recovery format and handle metadata-only records.

- [ ] T047 [US5] Implement `GET` in `src/app/api/translations/[id]/export/route.ts` using the existing analysis route Host and Origin/Sec-Fetch-Site policy before database access; serve one record as attachment with UUID-based filename, nosniff/no-store and no dependency on current corpus availability.

- [ ] T048 [US5] Integrate merged newest-first summaries and explicit translation deletion into `src/db/work.ts`, `src/components/work/work-list.tsx`, `src/components/work/delete-confirm.tsx`, `src/app/(work)/actions.ts` and `src/app/(work)/work/page.tsx`; expose export links while preserving existing analysis/diagram actions and ensuring exhaustive kind handling.

- [ ] T049 [US5] Implement explicit `?translate=1&translation={id}` deep-link precedence in `src/app/read/[book]/[chapter]/page.tsx` and `src/components/reading/translation-reader.tsx`; validate chapter/id, return not-found for mismatches, enable/persist Translate after hydration and update server selection without silently choosing another record.

- [ ] T050 [US5] Run US5 list/open/export/delete scenarios in `specs/011-verse-translation/quickstart.md` and extend `src/db/work.test.ts` for translations alongside unchanged analyses/diagrams; compare exported document and source Greek with the stored target only.

## Phase 8: Polish and Cross-Cutting Verification

Complete all selected stories before these acceptance gates. No implementation is complete while corpus recovery, export, accessibility or failure retention remains unverified.

- [ ] T051 Implement corpus mismatch diagnostics/repair in `src/lib/translation/repair.ts`, `src/lib/translation/repair.test.ts` and `src/components/reading/translation-repair.tsx`; integrate in `src/components/reading/translation-reader.tsx`, leave saved JSON untouched on load, distinguish same-id/in-order Greek-only changes (canonical candidate refresh in T014, no structural repair) from missing/reordered ids; identify affected anchors, allow group removal/confirmed verse rebuild, preserve segment text and displaced grouping text in notes, retain overflow locally and revalidate/revision-check the repaired save (FR-022).

- [ ] T052 Add real-server browser coverage in `scripts/translation-acceptance.ts` using installed Playwright and disposable `DATA_DIR`, following `specs/011-verse-translation/quickstart.md`: restart/browser persistence, near-512-KiB action transport, separate healthy commit/acknowledgement within 1 second and <=3-second durability from ten-second processing delay with <100-ms input and no premature Saved status; cover delayed creation/switch, failed-save departure to `/work`, book-title, logo/home and credits plus browser Back/Forward with global recovery retained; cover all permanent refusals, download, same-id text/punctuation refresh and unchanged exports before accepted save (also conflict/oversize refusal), server-canonical handling of forged Greek, and missing/reordered-anchor repair; document its exact invocation/results in the quickstart.

- [ ] T053 Run light/dark/sepia axe and keyboard/touch/screen-reader acceptance for the reader and management stories in `src/components/reading/` and `src/components/work/work-list.stories.tsx`; verify all SC-001–SC-014, 100-ms input under ten-second processing delay and 3-second durability only under SC-003 healthy commit/acknowledgement within 1 second without failures/conflicts, 1-minute structure operations, 30-second picker actions, two-cue marks, focus and narrow/tablet layouts; record evidence/gaps in `specs/011-verse-translation/quickstart.md` and fix affected components.

- [ ] T054 Update implemented behavior/test documentation in `lat.md/reader.md`, `lat.md/architecture.md` and a focused `lat.md/translation.md`, adding narrow source/test links and matching test references; reconcile `openspec/changes/verse-translation/` with the finished behavior, and replace planning-only statements in `specs/011-verse-translation/quickstart.md` only when verified.

- [ ] T055 Run targeted tests followed by npm lint/typecheck/format:check/test/build/build-storybook, app migration generation drift checks and `lat check`; review code/security boundaries in `src/db/translations.ts`, `src/app/(work)/translation-actions.ts` and `src/app/api/translations/[id]/export/route.ts`, run existing Docker smoke checks if packaging changes, resolve findings and record evidence in `specs/011-verse-translation/quickstart.md`.

## Dependencies and Execution Order

Setup → Foundation → US1 → US2 → US3 → US4 → US5 → Cross-cutting verification is the conservative integration order. US2 and US3 have shared Greek/verse files, so do not develop their integration concurrently. US4 persistence and isolated picker work can start after US1 without waiting for US2/US3; full-copy acceptance waits for both. US5 export helpers/route can start after US1; its list/delete integration waits for US4. Corpus repair is a release gate, not permission to discard unresolved work in earlier milestones.

### Parallel Examples by Story

| Story | Independent tasks after prerequisites                      | Join point                                          |
| ----- | ---------------------------------------------------------- | --------------------------------------------------- |
| US1   | T011 action tests, T012 database tests, T013 session tests | Finish these before T014–T022 implementation        |
| US2   | T023 pure edit tests and T024 component stories            | T025 pure operations then T026–T028 integration     |
| US3   | T029 grouping tests and T030 selection stories             | T031–T034 implementation and persistence acceptance |
| US4   | T035 management database tests and T036 picker stories     | T037–T043 persistence/UI/switch integration         |
| US5   | T044 export route tests and T045 list stories              | T046–T050 format/route/list/deep-link acceptance    |

Foundation T003 and T004 touch distinct helper files and can be developed together after Setup. All remaining shared-file tasks run in order unless explicitly split into nonoverlapping ownership and their prerequisite changes are integrated. `[P]` test tasks are independent of one another, not of the preceding foundation. Avoid concurrently running broad checks against an actively changing tree.

## Requirement Coverage

| Requirements  | Owning tasks                                                                             |
| ------------- | ---------------------------------------------------------------------------------------- |
| FR-001–FR-004 | T019–T022, T039                                                                          |
| FR-005–FR-008 | T007–T008, T023–T028                                                                     |
| FR-009–FR-012 | T007–T008, T029–T034                                                                     |
| FR-013–FR-015 | T009, T011–T018, T040, T042, T052                                                        |
| FR-016–FR-019 | T003–T008, T010, T012, T014–T015                                                         |
| FR-020–FR-021 | T044–T050                                                                                |
| FR-022        | T007–T008, T014, T046–T047, T051–T052                                                    |
| FR-023–FR-024 | T020–T022, T024, T026–T027, T030, T032–T033, T036, T039, T053                            |
| FR-025        | T005, T015, T038, T047; local user only until 015; future owner isolation belongs to 015 |
| FR-026–FR-033 | T004–T006, T012, T014, T035–T039, T041–T043, T048                                        |
| FR-034–FR-035 | T009, T013, T018, T036, T039–T043                                                        |

## Implementation Strategy

### MVP and Incremental Delivery

Build Setup and Foundation, then validate US1 as the smallest writing milestone. Include its recovery download, retry-safe creation and visible failed-draft retention. An externally releasable MVP also requires saved export/list/reopen from US5, applicable corpus repair and cross-cutting checks; do not release US1 alone without constitutional export guarantees. Export route work can be pulled forward once US1 is stable without pulling in all structural controls.

Add US2, US3 and US4 in the documented order to obtain the complete feature, then finish US5 integration and all release gates. Multiplicity and independent record identities exist from Foundation; no later single-record schema rewrite is planned. Each story checkpoint proves that story's test above against its prerequisites rather than pretending the story has no dependencies.

### Completion Evidence

Mark tasks only after their behavior and checks are verified. Keep no user text in test logs; use disposable fixture text and databases. Preserve current local security and installed dependencies. Document implemented state in Lat only alongside implementation, never as a task-generation journal. Planning ends with this task list; running implementation is a separate workflow invocation.
