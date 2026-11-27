---

description: "Task list for Learning Mode (Parsing Practice)"
---

# Tasks: Learning Mode (Parsing Practice)

**Input**: Design documents from `/specs/010-learning-mode/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/server-actions.md](contracts/server-actions.md), [contracts/ui.md](contracts/ui.md), [quickstart.md](quickstart.md)

**Tests**: Included. The plan and quickstart name the unit tests, stories and QA assertions, and CI runs `npm test` (unit plus every story with axe). Write each test task before the implementation it covers and see it fail first.

**Organization**: Grouped by user story (US1 and US2 are P1; US3, US4 and US5 are P2), so each can be built and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 to US5 from spec.md
- Paths are from the repository root. Run Node through `fnm use`. Modules imported by scripts or by both client and server under `src/lib/learning/` use relative `.ts` imports, no `@/`, no `server-only` and erasable TypeScript only (`src/db/README.md`). Client components never import anything under `src/db/`; `src/lib/client-imports.test.ts` enforces it.

---

## Phase 1: Setup

**Purpose**: Confirm the working state and what has already landed on the shared reader page.

- [X] T001 Confirm the branch and state with `git status --short --branch` (expect `study-plans-010-015` or the branch chosen for implementation), run `npm run coord -- check`, and read `lat.md/reader.md` before editing. Record whether spec 013 (word facts in the Reading payload, `src/db/schema/corpus.ts` `lemmas` table) and spec 014 (`chapterOccurrences`, `?w=` in `src/app/read/[book]/[chapter]/page.tsx`) have already merged; T012, T024 and T042 depend on the answer.
- [X] T002 [P] Read `openspec/specs/text/greek-reader/spec.md` and `openspec/specs/app/saved-work/spec.md` and note the requirements T046 will change. No OpenSpec change folder: features are planned with Spec Kit (CLAUDE.md, Workflow).

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: The closed lists and field rules every story uses, the mode cookie, and the lean Learning-mode page payload.

**⚠️ CRITICAL**: No user-story work begins until this phase is complete.

- [X] T003 [P] Write `src/lib/learning/fields.test.ts` before T004. Assert every row of data-model "fieldsFor": verb with no mood → `["tense","voice","mood"]`; verb + indicative/subjunctive/optative/imperative → `["tense","voice","mood","person","number"]`; verb + participle → `["tense","voice","mood","case","number","gender"]`; verb + infinitive → `["tense","voice","mood"]`; participle → `["tense","voice","case","number","gender"]`; noun, adjective, article, numeral → `["case","number","gender"]`; pronoun → `["case","number","gender","person"]`; adverb, preposition, conjunction, particle, interjection and empty → `[]` (SC-004). Assert `corpusPosToForm` maps `det`→`article`, `conj`→`conjunction`, `pron`→`pronoun`, `prep`→`preposition`, `adj`→`adjective`, `adv`→`adverb`, `ptcl`→`particle`, `num`→`numeral`, `intj`→`interjection`, and keeps `noun` and `verb`.
- [X] T004 Implement `src/lib/learning/fields.ts` (pure, script-safe): the closed lists exactly as data-model "Closed lists" (`FORM_POS` with the 12 values in that order; `TENSES` present, imperfect, future, aorist, perfect, pluperfect; `VOICES` active, middle, passive, middle or passive (FR-016a, added by the 2026-11-16 clarification); `MOODS` indicative, subjunctive, optative, imperative, participle, infinitive; `PERSONS` first, second, third, `n/a`; `NUMBERS` singular, plural; `GENDERS` masculine, feminine, neuter, `n/a`; `CASES` nominative, genitive, dative, accusative, vocative, `n/a`), the type `FormPos`, `FieldName = "tense"|"voice"|"mood"|"person"|"number"|"gender"|"case"`, `corpusPosToForm(pos: string): FormPos | null`, and `fieldsFor(pos: FormPos | "", mood?: string): FieldName[]` in the field order shown in data-model. Export `FIELD_VALUES: Record<FieldName, readonly string[]>`.
- [X] T005 [P] Write `src/lib/learning/corpus-values.test.ts`: read every chapter file under `corpus/v1/` through `parseChapter` (`src/lib/corpus/format.ts`) and assert every `pos` maps through `corpusPosToForm` and every morphology value except `degree` is in `FIELD_VALUES` for its field (research R4: catches drift after re-ingest).
- [X] T006 [P] Write `src/lib/learning/validate.test.ts` before T007: an answer with a field not in `fieldsFor(pos, mood)` is refused; a value outside its list is refused; `lemma` longer than 200 characters is refused; an empty `pos` with no fields is accepted; `wordId` not matching `^n\d{11}$` is refused; an attempt `id` that is not a UUID is refused; any `source`, `comparisons` or `allAgreed` keys sent with an attempt are stripped, not trusted.
- [X] T007 Implement `src/lib/learning/validate.ts` (zod, script-safe, shared by the form and the actions): `parsingAnswer` = `{ wordId: /^n\d{11}$/, lemma: string max 200, pos: FormPos | "", fields: partial record of FieldName → value in FIELD_VALUES }` with a `superRefine` that rejects any key not in `fieldsFor(pos, fields.mood)` (FR-012, FR-024); `attemptInput` = `{ id: z.uuid(), answer: parsingAnswer }` stripping unknown keys. Export the inferred types `ParsingAnswer` and `AttemptInput`.
- [X] T008 [P] Write `src/lib/learning/mode.test.ts` before T009: `parseMode(undefined)`, `parseMode("")` and `parseMode("LEARNING")` return `"reading"`; `parseMode("learning")` returns `"learning"`.
- [X] T009 Implement `src/lib/learning/mode.ts` (pure): `MODE_COOKIE = "vible.mode"`, `type ReadingMode = "reading" | "learning"`, `parseMode(value: string | undefined): ReadingMode` (missing or any other value means Reading, FR-003).
- [X] T010 Create `src/app/read/learning-actions.ts` (`"use server"`, `import "server-only"`) with `setReadingMode(mode)` per [contracts/server-actions.md](contracts/server-actions.md): `await assertAllowedHost()` first; parse with `z.enum(["reading","learning"])`, returning `{ ok: false, reason: "invalid" }` on failure; `(await cookies()).set(MODE_COOKIE, mode, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60*60*24*365 })`; when the mode is `"reading"` call `refresh()` from `next/cache`; return `{ ok: true, mode }`. Check `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` and `refresh.md` for the exact API first.
- [X] T011 [P] Write `src/app/read/learning-actions.test.ts` following the mocking pattern of `src/app/(work)/actions.test.ts` (mock `server-only`, `next/headers` `headers` and `cookies`, `next/cache` `refresh`, in-memory DBs). For `setReadingMode`: a disallowed Host throws `HostNotAllowedError`; an invalid mode is refused; `"learning"` sets the cookie with the options in T010 and does not call `refresh`; `"reading"` sets it and calls `refresh`.
- [X] T012 Update `src/app/read/[book]/[chapter]/page.tsx`: read `parseMode((await cookies()).get(MODE_COOKIE)?.value)`. In Learning mode build the lean chapter `{ book, chapter, words: words.map(({ id, verse, text, after }) => ({ id, v: verse, text, after })) }` and pass `mode: "learning"`; never copy `lemma`, `gloss`, `pos` or `morphology` into it (FR-020). In Reading mode keep today's mapping and pass `mode: "reading"`. If T001 found 013 merged, also skip its word facts in Learning; if 014 merged, skip `chapterOccurrences` and ignore `?w=` in Learning (spec 014 FR-024).
- [X] T013 Extend `ReaderContent`'s `"ok"` case in `src/components/reading/reader.tsx` to a discriminated union on `mode`: `{ status: "ok"; mode: "reading"; data: ChapterText }` | `{ status: "ok"; mode: "learning"; data: LeanChapter; attempts: Record<string, AttemptSummary> }`, with `LeanChapter` and `AttemptSummary` (`{ answer: ParsingAnswer; checkedAt: string; allAgreed: boolean }`) declared once in `src/lib/learning/types.ts` (types only, script-safe). Pass `attempts: {}` until T033. Update every fixture in `src/components/reading/reader.stories.tsx` to `mode: "reading"`, and add Learning-mode stories for the `"unavailable"` and `"not-installed"` states that show the mode control, the chapter navigation and the reader's unavailable message, with nothing to parse (spec edge case "chapter whose text is not available"). `ReaderContent`'s non-ok cases carry `mode` too so the mode control renders.

**Checkpoint**: `npx vitest run --project unit` passes; with `vible.mode=learning` set by hand the reading page renders text only, and with no cookie it renders exactly as before.

---

## Phase 3: User Story 1 — Parse a word and check it against the source (P1) 🎯 MVP

**Goal**: In Learning mode, select a word, type its dictionary form, choose part of speech and the fields that apply, check, and see a field-by-field comparison. Nothing gives the answer away before the check.

**Independent Test**: In Learning mode on Philippians 1, parse εὐχαριστῶ (1:3) with a wrong tense; only tense is marked as differing; the source parsing appears only after checking; the served HTML before checking contains no lemma or parsing (quickstart §2–3 step 2).

### Tests for User Story 1

- [X] T014 [P] [US1] Write `src/lib/learning/grade.test.ts` before T015, using data-model "Grading rules": `normaliseLemma("εὐχαριστέω") === normaliseLemma("ευχαριστεω")` (SC-006); iota subscript, diaeresis, capitals, final ς and elision marks (’ ʼ ᾿ ') are ignored; for εὐχαριστῶ the inflected form `ευχαριστω` differs from lemma `εὐχαριστέω` (US1 scenario 7); answer `participle` agrees with source `verb` + mood `participle` (FR-016); `n/a` agrees with an absent source field and differs from a present one (FR-017); an empty field is `unanswered` and counts as differing (FR-018); a source part of speech with no form equivalent is shown as given and any answer `differs` from it; `allAgreed` and `differCount` match the comparisons (FR-019); only fields in `fieldsFor(answer.pos, answer.fields.mood)` are graded (FR-012).
- [X] T015 [P] [US1] Write `src/lib/learning/translit.test.ts` before T016: each Beta Code letter `a b g d e z h q i k l m n c o p r s t u f x y w` maps to `α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω`; capitals map to capitals; `euxaristew` → `ευχαριστεω`; a trailing `s` becomes `ς` on `finalise()` and before a space; Greek input passes through unchanged; digits and punctuation pass through.

### Implementation for User Story 1

- [X] T016 [P] [US1] Implement `src/lib/learning/grade.ts` (pure, script-safe): `normaliseLemma(s)` = NFD, remove `\p{M}`, lower-case, `ς`→`σ`, remove `’ʼ᾿'` and any `\p{P}` and whitespace; `grade(answer: ParsingAnswer, source: SourceParsing): { comparisons: FieldComparison[]; allAgreed: boolean; differCount: number }` per data-model, with comparisons in the order lemma, pos, then `fieldsFor` order. Declare `SourceParsing` and `FieldComparison` (`outcome: "agrees" | "differs" | "unanswered"`) in `src/lib/learning/types.ts`.
- [X] T017 [P] [US1] Implement `src/lib/learning/translit.ts` (pure): `toGreek(input: string): string` converting Latin letters by the Beta Code map in research R8 and turning `σ` before whitespace into `ς`; `finalise(input: string): string` also turns a final `σ` into `ς`. Greek characters pass through.
- [X] T018 [US1] Add `checkParse(answer)` to `src/app/read/learning-actions.ts` per the contract: `assertAllowedHost()`; parse with `parsingAnswer` (refuse `invalid`); load the word with `getWord(await corpusDb(), wordId)` from `src/db/corpus.ts` (via `src/db/server.ts`), returning `unknown-word` when absent and `corpus-missing` on `DatabaseMissingError`; build `SourceParsing` `{ lemma, pos: corpusPosToForm(word.pos) ?? word.pos, ...word.morphology, gloss }`, keeping the corpus's own value as given when it has no form equivalent (spec edge case "a category the form does not offer"); return `{ ok: true, ...grade(answer, source), source }`. Never return syntactic data (the corpus has none; do not add any).
- [X] T019 [US1] Extend `src/app/read/learning-actions.test.ts` for `checkParse` with the test corpus from `src/db/testing.ts`: host check; invalid input refused; unknown word refused; missing corpus → `corpus-missing`; a correct parse of a seeded verb returns `allAgreed: true` and the source; a wrong tense returns exactly one `differs` on `tense`.
- [X] T020 [US1] Build `src/components/reading/learning/parsing-form.tsx` (after T016 and T017, whose `toGreek`, `finalise` and types it imports) (client) per [contracts/ui.md](contracts/ui.md) "Parsing form": heading with surface word (`lang="grc"`) and reference; "Dictionary form" text input (`lang="grc"`) that applies `toGreek` on input and `finalise` on check; "Part of speech" `<select>` with an empty first option then `FORM_POS`; one labelled `<select>` per `fieldsFor(pos, fields.mood)` with an empty first option; changing `pos` or `mood` drops fields that no longer apply (FR-012); "Check" calls a `onCheck(answer)` prop and renders the comparison table (answer, source, outcome cell with symbol plus the word "Agrees", "Differs" or "Unanswered"), then the source's full parsing including degree and gloss; a polite live region announces "All fields agree with the source" or "n fields differ from the source" (FR-033). When the check cannot reach the server (`onCheck` rejects), keep every answer, show "Couldn't check this word. Your answers are kept; try again." with a "Check again" button, and announce it; nothing is saved and no source value is shown (spec edge case "the check cannot reach the server"). No option is pre-selected or reordered (FR-013).
- [X] T021 [P] [US1] Write `src/components/reading/learning/parsing-form.stories.tsx`: Empty; Verb indicative fields shown; Participle fields shown; Compared all agree; Compared with differences and unanswered fields; Check failed (server unreachable). Each renders in light, dark and sepia and passes axe through the Storybook test project.
- [X] T022 [P] [US1] Build `src/components/reading/learning/mode-control.tsx` (client) per contracts/ui.md "Mode control": two toggle buttons "Reading" and "Learning" with `aria-pressed`; on Learning call `setReadingMode("learning")` then `location.reload()`; on Reading call `setReadingMode("reading")` (the action refreshes). Add `mode-control.stories.tsx` with both states.
- [X] T023 [P] [US1] Build `src/components/reading/learning/learning-notice.tsx`: "Learning mode is on. Select a word to parse it." (FR-002), plus `learning-notice.stories.tsx`.
- [X] T024 [US1] Create `src/components/reading/learning/learning-text.tsx` (client), the Learning counterpart of `GreekText`: same verse layout, font, size and spacing from `useSettingsStore`, no part-of-speech styling; each word a `button.word` with `id={word.id}`, `data-word-id`, text only and `aria-label={`${word.text}, parse this word`}` (no category, lemma or title, FR-020); the selected word opens `ParsingForm` in the existing Radix `Popover` with the same outside-click and focus-return handling as `greek-text.tsx`; `onCheck` calls `checkParse` and shows a plain error message for refusals. If T001 found spec 012 merged, do not render the English line in Learning mode and leave the stored English setting untouched (FR-036); otherwise spec 012 does this with the `mode` prop (see Cross-feature). Then render `ModeControl` in the reader bar and, in Learning, `LearningNotice` and `LearningText` instead of `PosLegend` and `GreekText`, in `src/components/reading/reader.tsx`.
- [X] T025 [US1] Add the Learning-mode assertions to `scripts/qa/reader.cjs`: fetch `/read/php/1` with `Cookie: vible.mode=learning` and assert the HTML contains no `"lemma"`, `"gloss"` or `"pos"` keys and not `εὐχαριστέω`; fetch without the cookie and assert `"lemma"` is present; in the browser switch to Learning, select εὐχαριστῶ, choose a wrong tense, check, and assert one "Differs" row (SC-002, SC-003).

**Checkpoint**: US1 works end to end with nothing saved yet.

---

## Phase 4: User Story 2 — Pick up where I left off (P1)

**Goal**: Every check is kept as an attempt; reopening a word pre-fills the last answer and says when it was checked and whether it all agreed; attempts survive restarts and re-ingest and can be exported.

**Independent Test**: Check a word, restart the server, reopen it in another browser switched to Learning: the form is pre-filled and states when it was checked and the outcome, without source values (quickstart step 3).

### Tests for User Story 2

- [X] T026 [P] [US2] Write `src/db/attempts.test.ts` before T028 against `createTestAppDb()` and `createTestCorpusDb()`: inserting the same `id` twice stores one row (idempotent retry); two attempts for one word are both kept and `latestAttempts` returns the newer (FR-025); `latestAttempts` returns `answer`, `checkedAt` and `allAgreed` only, never `source` or `comparisons` (FR-026); an attempt whose word is absent from the corpus is kept and still listed by `listAttempts` (FR-027); after rebuilding the test corpus store (a fresh `createTestCorpusDb()` seeded with the same words), `latestAttempts` still returns the attempt for a word that exists (SC-005).
- [X] T027 [P] [US2] Write `src/lib/learning/outbox.test.ts` before T030 with fake timers: a send that throws is retried with backoff; a refusal (`ok: false`) is dropped and reported, not retried; `pending()` reflects queued ids; the `beforeunload` listener is added while anything is pending and removed when empty; a successful retry clears the unsaved status.

### Implementation for User Story 2

- [X] T028 [US2] Add `parseAttempts` to `src/db/schema/app.ts` with the columns in data-model "Attempt": `id` text primary key; `wordId` (`word_id`) text not null; `book` text not null; `chapter` integer not null; `verse` integer not null; `surface` text not null; `edition` text not null; `answer` text not null (JSON); `source` text not null (JSON); `comparisons` text not null (JSON); `allAgreed` (`all_agreed`) integer boolean not null; `checkedAt` (`checked_at`) integer `timestamp_ms` not null; plus `index("parse_attempts_word_checked").on(t.wordId, t.checkedAt)`. Run `npm run db:generate` to create the migration under `drizzle/app/`, then `npm run db:migrate`, and confirm a second `npm run db:generate` reports no changes.
- [X] T029 [US2] Implement `src/db/attempts.ts` (script-safe): `recordAttempt(deps: { app: AppDb; corpus: () => CorpusDb; now?: () => Date }, input: AttemptInput)`: validate with `attemptInput`; load the word (refuse `unknown-word`; `corpus-missing` on `DatabaseMissingError`); compute `source` and `grade()` on the server, ignoring any client values; `INSERT … ON CONFLICT(id) DO NOTHING` with `checkedAt` from `now()`; return `{ ok: true }`. Also `latestAttempts(app, wordIds: string[]): Map<string, AttemptSummary>` (one query, newest per word) and `listAttempts(app)` ordered by `checked_at`. Re-export them from `src/db/server.ts` and add the module to `src/db/script-imports.test.ts`.
- [X] T030 [P] [US2] Implement `src/lib/learning/outbox.ts` (plain TypeScript, no React): `createOutbox({ send, onStatus, target = window })` with `add(attempt)`, `pending()` and backoff matching `src/lib/autosave.ts`; refusals call `onStatus({ state: "refused", id, reason })`; registers and removes a `beforeunload` guard while non-empty (research R6).
- [X] T031 [US2] Add `recordAttempt(attempt)` to `src/app/read/learning-actions.ts` per the contract (host check, then `recordAttempt` from `src/db/server.ts` with `await workDeps()`-style deps), and extend `src/app/read/learning-actions.test.ts`: idempotent on repeated id, server-computed outcome stored even if the client sends a false `allAgreed`, refusals typed.
- [X] T032 [US2] Wire saving into `src/components/reading/learning/learning-text.tsx`: after a successful `checkParse`, generate `crypto.randomUUID()` and `outbox.add({ id, answer })`; show "Not saved yet — retrying" in `ParsingForm` while that id is pending, and a plain refusal message if refused (US2 scenario 5, FR-023). Keep the result on screen regardless of save state. A save can fail after a successful check (the outbox retries); a check that cannot reach the server shows T020's "Couldn't check" state instead and adds nothing to the outbox.
- [X] T033 [US2] Load summaries in `src/app/read/[book]/[chapter]/page.tsx` for Learning renders: `latestAttempts(await appDb(), chapterWordIds)` converted with `Object.fromEntries` into `attempts` (`checkedAt` as ISO string). Pass it through `reader.tsx` to `LearningText`, which pre-fills `ParsingForm` from it and shows "Checked before on <date>: all agreed" or "…: n differed" without any source values (FR-026). After a new check, update the in-memory summary so reopening shows the newest attempt.
- [X] T034 [P] [US2] Add the "Prefilled from a previous attempt" and "Not saved yet" states to `src/components/reading/learning/parsing-form.stories.tsx`.
- [X] T035 [US2] Create `src/app/api/attempts/export/route.ts` per the contract: reuse the host and same-origin checks from `src/app/api/analyses/[id]/export/route.ts` (extract the shared helper into `src/app/api/export-guards.ts` if both need it, and keep the analysis route's behaviour identical); respond with the data-model "Export file" JSON (`format: "parse-attempts-export"`, `formatVersion: 1`, `edition: "SBLGNT"`, `exportedAt`, `attempts[]` with `reference` built from the stored `book`, `chapter`, `verse` using `src/lib/books.ts`) and `content-disposition: attachment; filename="parse-attempts-YYYY-MM-DD.json"`; `403` on wrong host or cross-origin; `503` when the store is missing or damaged. Add route tests in a new `src/app/api/attempts/export/route.test.ts` (mocking as in `src/app/(work)/actions.test.ts`): attachment headers and body shape, `403` for a disallowed host and for a cross-origin `Origin`, `503` when the store is missing.
- [X] T036 [US2] Add a "Download practice history" link to `src/components/reading/learning/learning-notice.tsx` pointing at `/api/attempts/export` with `download` (FR-028).

**Checkpoint**: US1 and US2 together: checks are kept, pre-fill works after a restart, export downloads.

---

## Phase 5: User Story 3 — Work through a chapter word by word (P2)

**Goal**: Next and previous word in reading order, crossing verse boundaries; an end-of-chapter message that offers the next chapter.

**Independent Test**: From the first word of a chapter, press Next word repeatedly across a verse boundary until "End of the chapter" appears with a link to the next chapter (quickstart step 4).

- [X] T037 [P] [US3] Write `src/lib/learning/navigation.test.ts` before T038: `adjacentWord(words, id, +1)` and `(-1)` follow array order across verses; the last word's next is `null`; the first word's previous is `null`.
- [X] T038 [US3] Implement `adjacentWord(words: { id: string }[], id: string, step: 1 | -1): string | null` in `src/lib/learning/navigation.ts`, and add "Previous word" and "Next word" to `ParsingForm`: moving reopens the form on the adjacent word, scrolls it into view (`scrollIntoView({ block: "center" })`, no smooth scroll under `prefers-reduced-motion`), moves focus to "Dictionary form", and discards unchecked answers without saving (FR-029, FR-030).
- [X] T039 [US3] On Next from the last word, show "End of the chapter" in `ParsingForm` with a link to the next chapter from `nextChapter()` in `src/lib/books.ts` (the same helper `ChapterNavigation` uses), or "End of the New Testament" with no link after Revelation 22 (FR-031). Add the "End of chapter" and "End of the New Testament" stories to `parsing-form.stories.tsx`.

**Checkpoint**: A whole chapter can be practised with the Next control alone (SC-007).

---

## Phase 6: User Story 4 — Practise without the answers in view (P2)

**Goal**: Colouring, legend and word popover are withheld in Learning mode and come back unchanged in Reading mode; the selected word survives the switch.

**Independent Test**: With colouring on, switch to Learning: no colouring or legend; select a word: the parsing form opens; switch back: colouring returns and settings are unchanged (quickstart steps 1 and 8).

- [X] T040 [US4] In `src/components/reading/display-menu.tsx`, when the reader passes `mode="learning"`, keep the part-of-speech settings editable and add the note "Paused while Learning mode is on" under "Colour words" (contracts/ui.md). Never write to the settings store on mode change (FR-005, SC-009). Add a Learning-mode story to `display-menu.stories.tsx`.
- [X] T041 [US4] Keep the selected word across mode switches (FR-006): add a small non-persisted selection store in `src/lib/learning/selection.ts` (Zustand) used by both `GreekText` and `LearningText`; before `location.reload()` in `ModeControl` write the selected id to `sessionStorage` key `vible.selectedWord` inside try/catch, and on mount of either text component read and clear it, then scroll the word into view and focus it. Unit-test the store in `src/lib/learning/selection.test.ts`.
- [X] T042 [US4] Extend `scripts/qa/reader.cjs`: turn colouring on, switch to Learning and assert no `.word` has an inline category style and no legend is rendered; select a word and assert the parsing form (not the word-detail popover) opens; if T001 found 014 merged, press its stepping shortcuts and assert nothing moves and no occurrence count or stepper appears (spec 014 FR-024); switch back and assert the colouring and the stored `vible.display` value are unchanged.

**Checkpoint**: SC-009 holds in QA.

---

## Phase 7: User Story 5 — Practise by keyboard, screen reader or touch (P2)

**Goal**: The full cycle works with keyboard alone, with a screen reader and with touch alone, and the form fits a phone.

**Independent Test**: Complete parse → check → next with keyboard only, with VoiceOver, and in tablet touch emulation (quickstart step 5).

- [X] T043 [US5] In `ParsingForm`, implement Escape and Close per contracts/ui.md "Focus and keys": with unchecked answers show the inline "Discard your answers?" confirmation ("Discard", "Keep editing") instead of closing, never a browser dialog; otherwise close and return focus to the word (FR-034). Enter or Space on a word opens the form with focus in "Dictionary form" (US5 scenario 1). Add the "Discard confirmation" story.
- [X] T044 [US5] Make the form a bottom sheet at phone width in `src/app/globals.css` (inside the existing `@media (max-width: 639px)` block; check, close, previous and next always visible, scroll the body not the actions) and confirm all three themes use tokens only (FR-035, `DESIGN.md`). Confirm agreement is distinguishable in greyscale (SC-008).
- [X] T045 [US5] Extend `scripts/qa/reader.cjs` with a keyboard-only run (Tab to a word, Enter, type `euxaristew`, choose fields with the keyboard, Enter on Check, read the live region, Next word, Escape returns focus) and a phone-width touch run (tap a word, the form fits, Check and Next reachable). Also: time selecting a word to seeing the comparison with the answers pre-entered and assert under 1 second, and that the comparison appears before the save completes (SC-001); resize the window and scroll with a checked form open and assert the form stays usable or closes and the attempt still saves (spec edge case "page scrolls or the window resizes").

**Checkpoint**: SC-008 holds; all stories pass axe in three themes.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T046 [P] Edit `openspec/specs/text/greek-reader/spec.md` (Learning mode; lean payload; word facts withheld until checked; English line hidden in Learning when spec 012 lands, FR-036) and `openspec/specs/app/saved-work/spec.md` (parse attempts: append-only, validated, exportable, kept across re-ingest, not listed on `/work`).
- [X] T047 [P] Update `lat.md/reader.md` (Learning mode: cookie-decided mode, lean payload, reload on switching in, server grading) and the saved-work section of `lat.md/` (attempts table, outbox), linking source files with `[[...]]` refs; run `lat check`.
- [X] T048 [P] Update the project-state paragraph in `CLAUDE.md` to mention Learning mode and parse attempts; note Learning mode in `specs/002-greek-reader/spec.md` Assumptions and attempts in `specs/005-saved-work/spec.md` Assumptions.
- [X] T049 Inspect every changed file for `TODO`, `test.skip`, `.only` and stub tests, and remove or implement them.
- [X] T050 Run `npm run lint && npm run typecheck && npm run format:check`, `npm test`, `npm run build`, `npm run db:generate` (expect no changes) and `scripts/qa/reader.cjs` against `npm start`; then walk through quickstart §3 by hand.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (Phase 1)** → **Foundational (Phase 2)** → user stories.
- **US1 (Phase 3)** needs Phase 2. It is the MVP.
- **US2 (Phase 4)** needs US1's `checkParse` and `ParsingForm` (T018, T020, T024).
- **US3 (Phase 5)** needs US1's `ParsingForm` and `LearningText`; independent of US2.
- **US4 (Phase 6)** needs US1's `ModeControl` and `LearningText`; independent of US2 and US3.
- **US5 (Phase 7)** needs US1; best after US3 (it tests Next word).
- **Polish (Phase 8)** after the stories chosen for release.

### Within each story

Tests before implementation and seen to fail; pure modules before actions; actions before components; components before QA assertions.

### Cross-feature

- Spec 013 and 014 touch the same page (`src/app/read/[book]/[chapter]/page.tsx`) and reader. Whichever merges second adds the Learning-mode exclusions (T012, T042).
- Spec 015 later adds an owner column to `parse_attempts` and scopes `src/db/attempts.ts`; nothing here anticipates it.
- Spec 012 hides the English line when `mode === "learning"` using the `mode` prop the reader now passes (FR-036). When spec 012 is planned, its tasks MUST include that exclusion and a QA assertion for it; if 012 merges first, T024 does it here.

## Parallel Example: Foundational and User Story 1

```text
# Independent pure-module tests and implementations:
T003 fields.test.ts     T006 validate.test.ts     T008 mode.test.ts     T005 corpus-values.test.ts
T014 grade.test.ts      T015 translit.test.ts
T016 grade.ts           T017 translit.ts

# UI pieces in separate files once T010 exists (T020 also waits for T016 and T017):
T021 parsing-form.stories.tsx (after T020)   T022 mode-control.tsx     T023 learning-notice.tsx
```

## Implementation Strategy

### MVP first (User Story 1)

1. Phases 1 and 2.
2. Phase 3 (US1). **Stop and validate**: parse and check works, and the QA assertion proves the Learning page holds no answers.

### Incremental delivery

1. + US2: attempts kept, pre-fill and export (completes the P1 scope).
2. + US3: chapter drill.
3. + US4: answers withheld and settings preserved across switches.
4. + US5: keyboard, screen reader and touch hardening.
5. Polish: OpenSpec sync, `lat.md`, `CLAUDE.md`, full gates.
