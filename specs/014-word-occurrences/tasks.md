---

description: "Task list for Step Through Occurrences"
---

# Tasks: Step Through Occurrences

**Input**: Design documents from `/specs/014-word-occurrences/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/occurrence-data.md](contracts/occurrence-data.md), [contracts/reader-stepping.md](contracts/reader-stepping.md), [quickstart.md](quickstart.md)

**Tests**: Included. The plan and quickstart name the unit tests, stories and real-server scenarios, and CI runs `npm test` (unit plus every story with axe). Write each test task before the implementation it covers and see it fail first.

**Organization**: Grouped by user story (US1 and US2 are P1; US3 and US4 are P2), so each can be built and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 to US4 from spec.md
- Paths are from the repository root. Run Node through `fnm use`. Script-shared modules under `src/db/` follow `src/db/README.md`: relative `.ts` imports, no `@/`, no `server-only`, erasable TypeScript only.

---

## Phase 1: Setup

**Purpose**: Confirm the working state and open the companion OpenSpec change.

- [ ] T001 Confirm the branch and state with `git status --short --branch` (expect `study-plans-010-015` or the branch chosen for implementation), run `npm run coord -- check`, and read `lat.md/reader.md` and `lat.md/corpus.md` before editing. Check whether spec 013's `lemmas` table and NFC lemma normalisation have already landed in `src/db/schema/corpus.ts` and `src/db/seed.ts`; T006 and T008 depend on the answer.
- [ ] T002 [P] Read `openspec/specs/text/corpus-store/spec.md` and `openspec/specs/text/greek-reader/spec.md` and note the requirements T037 will change ("Book, chapter and word retrieval", "Word detail"). No OpenSpec change folder: features are planned with Spec Kit (CLAUDE.md, Workflow; research R12).

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: The canonical-order column, the occurrence read model, the pure position function and the page plumbing every story needs.

**⚠️ CRITICAL**: No user-story work begins until this phase is complete.

- [ ] T003 Add `canonSeq: integer("canon_seq").notNull()` to `words` in `src/db/schema/corpus.ts`, with the doc comment "1-based position in the whole installed New Testament: books in BOOKS order, then chapter, then seq. Dense, unique. An ordering key, never an identity and never shown." Add `index("words_lemma_canon").on(t.lemma, t.canonSeq)` and `uniqueIndex("words_canon_seq").on(t.canonSeq)`. If 013's plain `words(lemma)` index exists, remove it (it is a prefix of `words_lemma_canon`, research R10).
- [ ] T004 Assign `canon_seq` in `load()` in `src/db/seed.ts`. Keep a counter across the per-book transactions and visit books in `BOOKS` order (`src/lib/books.ts`), not `Map.groupBy` insertion order. Within each book keep the existing chapter-then-word order, and set `canonSeq: ++canon` beside `seq: ++seq`.
- [ ] T005 Run `npm run db:generate` to produce the corpus migration in `drizzle/corpus/` (the new `0001_*.sql` plus `meta/`). Then run `npm run db:seed`, and confirm `npm run db:generate` reports no further changes (the CI migration check).
- [ ] T006 [P] Extend `src/db/seed.test.ts`:
  - `canon_seq` is dense from 1 to the word count and unique;
  - Matthew 1:1's first word is 1 and the last word of Revelation 22:21 is the maximum;
  - for every book, `canon_seq` order equals `(books.seq, seq)` order;
  - seeding twice gives identical `canon_seq` for every id (SC-007).
- [ ] T007 [P] Write `src/db/occurrences.test.ts` against the seeded store from `src/db/testing.ts`, before T008. Cover:
  - **σάρξ**: Romans 8 has `before = 35` and `total = 147`; the word `n45008003011` works out to position 36; Romans 8's `next` is `n45009003018` (Romans 9:3); Matthew 16 has `prev = null` (first is `n40016017012`); Revelation 19 has `next = null` (last is `n66019021026`).
  - **καθοράω** (`n45001020011`, Romans 1:20): `total = 1`.
  - **ὁ, καί, αὐτός**: totals 19,795 / 8,973 / 5,059, each equal to an independent `count(*)` (SC-001).
  - **κἀγώ** (`n46002003001`): counts only `κἀγώ`.
  - **Stale store**: a store without `canon_seq` returns `null`.
  - **Missing chapter (FR-015)**: a store seeded without Romans 9 has a σάρξ total 3 lower, and Romans 8's `next` skips to the next installed occurrence after Romans 9.
  - **Agreement with 013**: only when 013 is already merged (checked in T001), `total === lemmas.occurrences` for every lemma.
  - **Timing**: the Romans 8 summary and the chapter with the most distinct lemmas take ≤ 10 ms (SC-003).
- [ ] T008 Implement `chapterOccurrences(db: CorpusDb, book: string, chapter: number): Map<string, LemmaOccurrences> | null` in a new `src/db/occurrences.ts`, per [contracts/occurrence-data.md](contracts/occurrence-data.md):
  - First create `src/lib/occurrences/types.ts`, the single definition (types only, script-safe: relative imports, erasable syntax) of `LemmaOccurrences { lemma: string; before: number; total: number; prev: OccurrenceRef | null; next: OccurrenceRef | null }` and `OccurrenceRef { id: string; book: string; chapter: number; verse: number }`. Import it in `src/db/occurrences.ts` with `import type … from "../lib/occurrences/types.ts"`, and add the module to the script-shared list in `src/db/script-imports.test.ts`.
  - Use one query per chapter: group the chapter's words by lemma (min and max `canon_seq`), then per lemma count before the minimum, take the total, take the greatest `canon_seq` below the minimum (`prev`) and the least above the maximum (`next`), all over `words_lemma_canon`.
  - Decide `total` by merge order, never by runtime detection: if T001 found 013 merged, join `lemmas.occurrences`; otherwise use `count(*)`. If 013 merges later, its implementer switches to the join (research R10).
  - Match on exact stored lemma only (FR-002, FR-003).
  - Catch only SQLite "no such column: canon_seq" and return `null`. Rethrow everything else.
- [ ] T009 [P] Write `src/lib/occurrences/position.test.ts` before T010. Cover first, middle, last and only (`total === 1`), several occurrences in one verse, steps inside the chapter versus via `prev`/`next`, and `net` steps clamped at both ends with no wrap (FR-009, FR-017).
- [ ] T010 Implement the pure, React-free module `src/lib/occurrences/position.ts`:
  - `occurrencePosition(words, summary, wordId)` returns `{ index, total, reference: { book, chapter, verse }, previous, next, kind: "only" | "first" | "middle" | "last" }`, where `index = before + 1 + (earlier same-lemma words in this chapter)`, and `previous`/`next` are an in-chapter word id or the summary's `prev`/`next`.
  - `resolveSteps(words, summary, fromId, net)` returns `{ targetId, inChapter: boolean, remaining }`.
  - Import nothing from `src/db/`. Take `LemmaOccurrences` from `src/lib/occurrences/types.ts`; `src/lib/client-imports.test.ts` must stay green.
- [ ] T011 Extend `ReaderContent`'s `"ok"` case in `src/components/reading/reader.tsx` with `occurrences: Record<string, LemmaOccurrences> | null`, `focusWordId: string | null` and `wordNotFound: boolean`. Use a plain object, not a `Map`, because props must serialise. Import `LemmaOccurrences` from `src/lib/occurrences/types.ts`; never declare a second copy. Update `src/components/reading/reader.stories.tsx` fixtures to pass `occurrences: null`, `focusWordId: null`, `wordNotFound: false`.
- [ ] T012 Update `src/app/read/[book]/[chapter]/page.tsx`:
  - Accept `searchParams: Promise<{ w?: string | string[] }>`.
  - Call `chapterOccurrences` inside the same `readCorpus` callback as `getChapter` when the status is `"ok"`, and convert the `Map` with `Object.fromEntries`.
  - Accept `w` only when it is a single string matching `^[A-Za-z0-9_-]{1,32}$` **and** equals a word id in the chapter. It is never passed to SQL (research R3).
  - Set `focusWordId` or `wordNotFound` accordingly, and ignore `w` for unavailable or not-installed chapters.

**Checkpoint**: `npx vitest run --project unit` passes, the reader renders as before, and `occurrences` reaches the client.

---

## Phase 3: User Story 1 — Step to the next or previous use of a word (P1) 🎯 MVP

**Goal**: From a word's popover, step forward and back through every use of its lemma in canonical order, within and across chapters and books. Each step shows position, total and reference, and marks the word.

**Independent test**: Open `/read/rom/8` and select σαρκός in 8:3. It shows "Occurrence 36 of 147 · Romans 8:3". Step forward through 8:13 into Romans 9:3 with no reload, then step back the same number of times to `n45008003011`, which again shows 36 of 147.

### Tests for User Story 1

- [ ] T013 [P] [US1] Write `src/lib/occurrences/stepper-store.test.ts`, before T014, for the transitions in [data-model.md](data-model.md#state-transitions):
  - start a run;
  - step in-chapter;
  - step cross-chapter, entering `navigating`;
  - further steps while navigating accumulate `pending`;
  - arrival with `?w = targetId` continues and applies `pending`;
  - arrival with any other address ends the run and drops `pending` (FR-016);
  - a stale token is never announced (FR-017).
- [ ] T014 [P] [US1] Write `src/components/reading/occurrence-stepper.stories.tsx` with "middle" (36 of 147, Romans 8:3) and a play function asserting the position text and that activating Next calls the step handler with `+1`. Then extend `src/components/reading/greek-text.stories.tsx` with a two-occurrence fixture chapter whose play function steps and asserts `data-current-occurrence` moves to the second word and only one word carries it (FR-008). Add two more stories:
  - **Greyscale (SC-006)**: under `filter: grayscale(1)`, the marked word's computed `outline-style` is `solid`.
  - **Display changes**: changing the text size, typeface, theme and line spacing through the settings store leaves `data-current-occurrence` on the same word id.

### Implementation for User Story 1

- [ ] T015 [US1] Implement `src/lib/occurrences/stepper-store.ts` (Zustand, module scope) with state `{ origin: { path, wordId } | null, targetId: string | null, token: number, pending: number, direction: "previous" | "next" }` and actions `step(net)`, `arrived(wordId)`, `endRun()`, per research R5.
- [ ] T016 [US1] Create `src/components/reading/occurrence-stepper.tsx` (client):
  - Previous/Next `<button>`s using the existing `Button` and lucide `ChevronLeft`/`ChevronRight`, with accessible names "Previous occurrence" and "Next occurrence";
  - between them, the text `Occurrence {index} of {total} · {Book name} {chapter}:{verse}`, with the book name from `getBook` in `src/lib/books.ts` and thousands separated;
  - props `{ position, onStep(net: 1 | -1) }`.
- [ ] T017 [US1] Render `OccurrenceStepper` in `src/components/reading/word-detail.tsx` below the lemma, only when a `position` prop is supplied. Keep every existing field and the close button unchanged.
- [ ] T018 [US1] Wire stepping in `src/components/reading/greek-text.tsx`:
  - Take `occurrences`, `focusWordId` and `book/chapter`, and compute `position` with `occurrencePosition` for the open word.
  - On a step, call `resolveSteps`. In-chapter: set the selected and marked id and `history.replaceState` the address `/read/<slug>/<chapter>?w=<id>`. Cross-chapter: `stepperStore.step` then `router.replace(url, { scroll: false })` from `next/navigation`.
  - **The address drives the mark.** Read `w` with `useSearchParams()` from `next/navigation`, falling back to `focusWordId` for the first render, and derive the marked id from it, so Back and Forward within a chapter update the mark (research R5).
  - When `w` equals `stepperStore.targetId` (a step or a cross-chapter arrival), call `stepperStore.arrived`, then mark the word, open its popover and `scrollIntoView({ block: "center" })`.
  - When `w` comes from opening an address (no run is active), mark and scroll only. Do not open the popover, move focus or announce (research R3, contracts/reader-stepping.md).
  - Put `data-current-occurrence` on exactly one `.word` (FR-006, FR-008, FR-011).
- [ ] T019 [P] [US1] Add `.word[data-current-occurrence] { background: var(--rose-highlight); outline: 2px solid var(--primary); outline-offset: 1px; }` and the stepper's layout (one row, wraps on phones, small-caps reference) to `src/app/globals.css`, using tokens only (FR-007, FR-025, research R9).
- [ ] T020 [US1] Confirm `src/app/read/` has no `loading.tsx`, and add a comment in `src/app/read/[book]/[chapter]/page.tsx` saying one must not be added because it would blank the chapter during a step (FR-021, research R6).

**Checkpoint**: US1's independent test passes in `npm run dev`; stories and unit tests are green.

---

## Phase 4: User Story 2 — Step without a mouse, and hear where you are (P1)

**Goal**: Shortcuts, focus kept on the stepper, one announcement per step (including after a chapter change), touch-sized controls, Escape to the stepped-to word, and reduced-motion scrolling.

**Independent test**: Keyboard only: select a word, press `]` across a chapter boundary, press Escape. VoiceOver reads "Occurrence n of 147, Romans c:v" once per step. On a touch viewport, tap Next and Previous.

### Tests for User Story 2

- [ ] T021 [P] [US2] Add play functions to `src/components/reading/occurrence-stepper.stories.tsx` and `src/components/reading/greek-text.stories.tsx`:
  - `]` and `[` step while focus is in the popover;
  - the keys are ignored with Ctrl, Alt or Meta held and in an `<input>` rendered beside the text (FR-018, US2 scenario 5);
  - after a step, focus is on the stepper control matching the direction;
  - the first Escape focuses the stepped-to word, not the start word (US2 scenario 6), and the second Escape clears the mark;
  - each control's bounding box is ≥ 24×24 px (FR-020).

### Implementation for User Story 2

- [ ] T022 [US2] In `src/components/reading/occurrence-stepper.tsx`, add `aria-keyshortcuts="["` and `"]"` and tooltips "Previous occurrence ([)" and "Next occurrence (])". Add a `keydown` listener on the popover content (not `window`) that ignores events with `ctrlKey`, `altKey` or `metaKey`, with `isComposing`, or targeting `input`, `textarea`, `select` or `[contenteditable]` (research R7).
- [ ] T023 [US2] In `src/components/reading/greek-text.tsx`:
  - use `PopoverContent`'s `onOpenAutoFocus` to focus the stepper control named by `stepperStore.direction` after a step;
  - keep `onEscapeKeyDown` focusing the currently marked word;
  - on Escape pressed on a marked word with no popover open, clear the mark and `history.replaceState` the address without `w`.
- [ ] T024 [P] [US2] Create `src/components/reading/occurrence-announcer.tsx` (client): a visually hidden `role="status"` `aria-live="polite"` region that subscribes to an `announce(message, token)` action in `src/lib/occurrences/stepper-store.ts` and renders a message only when its token is still the latest.
- [ ] T025 [US2] Create `src/app/read/layout.tsx`, which renders `{children}` plus `<OccurrenceAnnouncer />` so the region persists across chapter changes. From `greek-text.tsx`, call `announce("Occurrence {n} of {total}, {Book} {c}:{v}", token)` once the target is marked, both in-chapter and on arrival (FR-019, SC-005).
- [ ] T026 [P] [US2] In `src/components/reading/greek-text.tsx`, choose `scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })` (FR-022).

**Checkpoint**: US2 scenarios 1–6 pass in stories and by hand with VoiceOver.

---

## Phase 5: User Story 3 — Return to or share a particular occurrence (P2)

**Goal**: The address names the word by MACULA id, bad addresses show a notice, and one Back returns to where stepping began.

**Independent test**: Step into Hebrews, copy the address, open it in a new tab, and the same word is marked; reseed and it still is. From `/read/rom/8`, step 15 times through several chapters and press Back once: `/read/rom/8?w=n45008003011` with that word marked.

### Tests for User Story 3

- [ ] T027 [P] [US3] Add history cases to `src/lib/occurrences/stepper-store.test.ts` with stubbed `history` and router:
  - the first step of a run replaces the origin with `?w=<start>`, then pushes exactly once;
  - every later step replaces;
  - a run started from an address that already has `?w` still pushes once (FR-014, SC-008);
  - **in-chapter Back**: after three in-chapter steps, a simulated popstate that sets `w` back to the start id ends the run, and the derived mark is the start word, not the third step (SC-008, FR-016).
  Also add a `greek-text.stories.tsx` play function: step twice within the chapter, call `history.back()`, and assert `data-current-occurrence` is on the start word and no popover is open.
- [ ] T028 [P] [US3] Add a `Reader` story to `src/components/reading/reader.stories.tsx` with `wordNotFound: true`, asserting the notice text "That word isn't in this chapter." and that no word carries `data-current-occurrence` (FR-013).

### Implementation for User Story 3

- [ ] T029 [US3] Implement push-once-then-replace in `src/lib/occurrences/stepper-store.ts` and `src/components/reading/greek-text.tsx`, per [contracts/reader-stepping.md](contracts/reader-stepping.md#history-and-navigation):
  - on the first step of a run, `history.replaceState(null, "", originPath + "?w=" + startId)`;
  - then `history.pushState` for an in-chapter target or `router.push(url, { scroll: false })` for a cross-chapter one;
  - later steps use `history.replaceState` or `router.replace(url, { scroll: false })`.
- [ ] T030 [US3] Render the not-found notice in `src/components/reading/reader.tsx` when `content.wordNotFound` is true: a short `role="status"` line above the text, styled with existing tokens.
- [ ] T031 [US3] End the run on any address change the stepper did not make. In `src/components/reading/greek-text.tsx`, whenever `useSearchParams().get("w")` changes, whether on mount or not, to a value other than the store's `targetId` (Back or Forward within or across chapters, chapter links, contents), call `endRun()`: close any popover, apply nothing pending, and let the mark follow the new `w` (FR-016, SC-008). Don't rely on re-mounting: an in-chapter pop does not re-mount `GreekText`. When the mark clears (another word selected, click outside, second Escape), remove `w` with `history.replaceState` (FR-008).

**Checkpoint**: US3 scenarios 1–4 pass; Back returns to the start in every trial.

---

## Phase 6: User Story 4 — Know when there is nowhere further to step (P2)

**Goal**: Rare words say "only occurrence"; the ends are clearly unavailable and never wrap.

**Independent test**: `/read/rom/1?w=n45001020011` says it is the only occurrence. `/read/mat/16?w=n40016017012` has Previous unavailable. `/read/rev/19?w=n66019021026` has Next unavailable, and `]` does not move.

### Tests for User Story 4

- [ ] T032 [P] [US4] Add "only", "first" and "last" stories to `src/components/reading/occurrence-stepper.stories.tsx`:
  - "only": the text "Only occurrence in the New Testament (1 of 1)" and no buttons;
  - "first": Previous has `aria-disabled="true"`, is still focusable, and activating it calls nothing;
  - "last": the same for Next, and `]` does nothing (FR-009, FR-010).

### Implementation for User Story 4

- [ ] T033 [US4] In `src/components/reading/occurrence-stepper.tsx`, render `kind === "only"` as the single sentence with no controls. For `"first"` and `"last"`, set `aria-disabled="true"` (never the `disabled` attribute) on the unavailable control, and make its click and shortcut no-ops (research R8). Add `.button[aria-disabled="true"] { opacity: 0.4; cursor: default; }` to `src/app/globals.css` beside `.button:disabled` (which does not match `aria-disabled`), and keep hover from tinting it.

**Checkpoint**: All four stories work independently.

---

## Phase 7: Polish & cross-cutting concerns

- [ ] T034 [P] Learning mode (FR-024, SC-009). If spec 010 is merged, skip `chapterOccurrences` in `src/app/read/[book]/[chapter]/page.tsx` when the `vible.mode` cookie is `learning`, pass `occurrences: null`, and add a story or test asserting no stepper exists. If 010 is not merged, add a note to `specs/010-learning-mode/plan.md` that its Learning-mode page must pass `occurrences: null`.
- [ ] T035 [P] Spec 013 alignment (FR-023). If 013 is merged, place its "Occurrences in the New Testament" figure on the stepper's row in `src/components/reading/word-detail.tsx`, make its count control focus the Next occurrence control, and confirm T008 joins `lemmas` and T007's agreement assertion runs. If 013 is not merged, add a note to `specs/013-richer-word-details/tasks.md` (or its plan, if it has no tasks yet) that its implementer switches `chapterOccurrences`' `total` to the `lemmas` join, adds the agreement test, and drops its plain `words(lemma)` index (research R10).
- [ ] T036 [P] Write `scripts/qa/occurrences.cjs`, following the pattern of `scripts/qa/reader.cjs`, covering the automatable quickstart scenarios (1–3 and 5–10) against `npm start`. Include:
  - the SC-002 timings (≤ 100 ms same chapter, ≤ 1 s cross-chapter, from key press to `data-current-occurrence`);
  - the no-reload `window` marker;
  - Back after a cross-chapter run **and** after an in-chapter run;
  - an address opened in a new tab not moving focus;
  - `?w=nope`;
  - the manual chapter link mid-run.

  Scenario 4 (VoiceOver, plus NVDA where available, including checking that `[` and `]` are not intercepted) is a manual check recorded in the PR description.
- [ ] T037 [P] Update the main OpenSpec specs in place so they match this spec:
  - `openspec/specs/text/corpus-store/spec.md`: the canonical-order column and the occurrence summary under "Book, chapter and word retrieval";
  - `openspec/specs/text/greek-reader/spec.md`: a new "Occurrence stepping" requirement, and "Word detail" amended.

  Then run `openspec validate --specs --strict`.
- [ ] T038 [P] Update `lat.md/corpus.md` (`canon_seq`, `chapterOccurrences`) and `lat.md/reader.md` (stepper, address, history, announcer, the no-`loading.tsx` rule, tests), and the `CLAUDE.md` "Project state" paragraph. Run `lat check`.
- [ ] T039 Run the gates: `npm run lint && npm run typecheck && npm run format:check`, `npm test` (unit plus storybook with axe in light, dark and sepia for SC-006), `npm run build`, and `npm run db:generate` with no diff.
- [ ] T040 Build and run Docker per [quickstart.md](quickstart.md#docker) on an existing `vible-data` volume. Confirm `scripts/seed-if-stale.ts` reseeds (the ingest hash changed) and that scenario 1 passes in the container.
- [ ] T041 Run a code review and a security review of the diff (focus: `?w` handling in `page.tsx`, with no SQL use and a strict pattern) and fix the findings. Then scan the changed files for `TODO`, `.skip` and `.only` and resolve any found.

---

## Dependencies & execution order

### Phase dependencies

- **Setup (1)**: none.
- **Foundational (2)**: after T001. T003 → T004 → T005 must run in order. T006 and T007 can be written alongside T003–T005. T008 needs T005. T009 and T010 are independent of the database. T011 needs T008 and T010 (types). T012 needs T008 and T011.
- **US1 (3)**: after Phase 2.
- **US2 (4)**: after US1's T016–T018, since it extends the stepper and `GreekText`.
- **US3 (5)**: after US1's T015 and T018. Independent of US2.
- **US4 (6)**: after US1's T016. Independent of US2 and US3.
- **Polish (7)**: after the stories it touches. T034 and T035 depend on the state of 010 and 013 checked in T001.

### User story dependencies

US1 is the base. US2, US3 and US4 each build only on US1, so after US1 they can go in any order, or in parallel by file (US4 touches only `occurrence-stepper.tsx` and its stories).

### Within each story

Tests first (failing), then store and component, then wiring in `greek-text.tsx`, then the story checkpoint.

### Parallel opportunities

- Phase 2: T006, T007 and T009 (three different test files); T010 alongside T003–T005.
- US1: T013, T014 and T019.
- US2: T021, T024 and T026.
- US3: T027 and T028.
- After US1: US4 (T032–T033) in parallel with US2 or US3.
- Polish: T034–T038.

## Parallel example: User Story 1

```text
Task: "T013 stepper-store transitions test in src/lib/occurrences/stepper-store.test.ts"
Task: "T014 stepper and GreekText stories in src/components/reading/*.stories.tsx"
Task: "T019 mark and stepper CSS in src/app/globals.css"
```

## Implementation strategy

### MVP (US1 only)

Phases 1–3: stepping with position, total, reference and the mark, within and across chapters. Stop and check US1's independent test. Do not ship it to users without US2: Constitution VI makes keyboard and screen-reader operation non-negotiable, so US1 + US2 is the smallest P1 increment.

Before US3 lands, every step replaces the history entry, so after a cross-chapter run one Back leaves the starting chapter instead of returning to the starting word. FR-014 and SC-008 belong to P2 US3. Release to users after US3 unless that gap is accepted explicitly.

### Incremental delivery

1. Foundation → US1 (demo) → US2 (releasable P1).
2. US3 (addresses and Back) → US4 (ends and hapax).
3. Polish: Learning-mode and 013 alignment, QA script, OpenSpec and Lat, gates, Docker.

## Notes

- Code-writing subagents run on Sonnet (project memory).
- Work in the main checkout; no worktrees (project memory).
- Commit after each phase checkpoint only when the user asks.
