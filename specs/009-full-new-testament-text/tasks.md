---

description: "Task list for the full New Testament text"
---

# Tasks: Full New Testament Text

**Input**: Design documents from `specs/009-full-new-testament-text/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ingest-cli.md, quickstart.md

**Tests**: The spec does not ask for TDD. Test tasks are included only where the plan (research R7) changes existing tests or where a success criterion needs an automated check in CI.

**Organization**: Tasks are grouped by user story. The ingest script and regenerated corpus (Phase 2) block every story; after that, the story phases touch different concerns and can be done in any order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story from spec.md (US1–US4)

Pinned values used throughout: MACULA commit `8423afe47b9e8f24b7772e808af45c7159a6fe7e`; expected totals 27 books, 260 chapters, 137,741 words; Philippians 1 = 501 words, first id `n50001001001`.

---

## Phase 1: Setup

**Purpose**: Isolated worktree and coordination claims (CLAUDE.md, `lat.md/agent-coordination.md`).

- [ ] T001 On `main`, commit `specs/009-full-new-testament-text/` and the Node 26.13.1 pin (`.node-version`, `Dockerfile`, the matching lines in `CLAUDE.md` and `lat.md/architecture.md`) as two separate commits, leaving unrelated uncommitted work alone
- [ ] T002 Create the worktree with `git worktree add .worktrees/009-full-new-testament-text -b 009-full-new-testament-text` from an up-to-date `main` that already contains `specs/009-full-new-testament-text/` and the Node 26.13.1 pin; in it run `fnm use` and `npm install`
- [ ] T003 In the worktree run `npm run coord -- list`, then `npm run coord -- claim scripts/ingest corpus/v1 src/db/seed.test.ts src/components/reading scripts/qa/reader.cjs lat.md CLAUDE.md specs openspec --note "009 full New Testament text"`

---

## Phase 2: Foundational (blocks all stories)

**Purpose**: A whole-New-Testament ingest and the regenerated corpus. Contract: `specs/009-full-new-testament-text/contracts/ingest-cli.md`.

- [ ] T004 [P] Create `scripts/ingest/fetch.sh` (POSIX `sh`, `set -eu`): define `COMMIT=8423afe47b9e8f24b7772e808af45c7159a6fe7e` and the 27 file names `01-matthew.xml` … `27-revelation.xml` exactly as listed in research R4/contract; take one argument `<dir>` (usage error and exit 2 without it), `mkdir -p` it, download each file with `curl -sSfL -o "<dir>/<name>" https://raw.githubusercontent.com/Clear-Bible/macula-greek/$COMMIT/SBLGNT/lowfat/<name>`, stop on the first failure naming the file, and finish by printing the commit
- [ ] T005 Rename the extractor with `git mv scripts/ingest/sample_chapter.py scripts/ingest/ingest.py` and update its module docstring to describe the whole-New-Testament command from the contract (keep `parse_book`, `following`, `word_record`, `chapter_words`, `ATTRIBUTION`, `MORPHOLOGY` and the field whitelist unchanged)
- [ ] T006 In `scripts/ingest/ingest.py`, replace `main` with the contract's command: `--source <dir>`, `--commit <sha>` (must match `COMMIT` regex, else argparse error exit 2), `--out <dir>`; add a `BOOK_FILES` tuple of the 27 file names in canonical order; drop `--xml` and `--chapter`
- [ ] T007 In `scripts/ingest/ingest.py`, add book-level checks before any writing, each raising `IngestError` naming the file: every name in `BOOK_FILES` exists in `--source` (missing file is an error); each root is `<book>` with a `BOOK_CODE` id and codes are unique across files; every word `ref` names that file's book; the chapters found run contiguously from 1 with no gap; word ids are unique across the whole New Testament. Build all chapter records in memory first (chapter order from `ref`, reading order as today)
- [ ] T008 In `scripts/ingest/ingest.py`, write output all-or-nothing (research R3): remove any leftover `<out>.new`, write `attribution.json` and every `<BOOK>/<n>.json` into `<out>.new` with the existing `write_json` (keep `indent=2`, `ensure_ascii=False`, trailing newline so Philippians 1 stays byte-identical), then rename `<out>` to `<out>.old`, `<out>.new` to `<out>`, and delete `<out>.old`; on any error before the swap delete `<out>.new` and leave `<out>` untouched; print `wrote 27 books, 260 chapters, <n> words`; exit 1 with `error: <message>` on stderr for `IngestError`, `ET.ParseError` or `OSError`
- [ ] T009 Regenerate the corpus: `SRC=$(mktemp -d)`, `sh scripts/ingest/fetch.sh "$SRC"`, `python3 -I scripts/ingest/ingest.py --source "$SRC" --commit 8423afe47b9e8f24b7772e808af45c7159a6fe7e --out corpus/v1`; confirm the summary reports 137,741 words, `git diff --exit-code corpus/v1/PHP/1.json corpus/v1/attribution.json` is clean, and `ls corpus/v1 | wc -l` is 28 (27 book directories plus `attribution.json`)
- [ ] T010 Restructure `src/db/seed.test.ts` (research R7): in `beforeEach`, copy only `corpus/v1/attribution.json` and `corpus/v1/PHP/1.json` into the temp `corpusDir` instead of the whole committed corpus, so every existing `seedCorpus` and "corpus store contents" test keeps its current expectations (1 chapter, 501 words, PHP 2 and MAT 1 `unavailable`); keep the existing "committed ingest output" Louw-Nida/UBS test reading the real `corpus/v1`

**Checkpoint**: `corpus/v1` holds the whole New Testament and `npx vitest run --project unit` passes.

---

## Phase 3: User Story 1 - Read any chapter (Priority: P1) 🎯 MVP

**Goal**: Every one of the 260 chapters opens with Greek text; the unavailable message no longer points at Philippians 1.

**Independent Test**: `npm run db:seed`, `npm run build && npm start`, open the first and last chapter of all 27 books plus Matthew 26: each shows text with verse numbers.

- [ ] T011 [US1] Add a `describe("committed corpus")` block to `src/db/seed.test.ts` that seeds the full committed `corpus/v1` once (`beforeAll` into its own temp data dir) and asserts: result `{ chapters: 260, words: 137741 }`; for every book in `BOOKS` from `src/lib/books.ts`, `listBooks` reports `available` equal to `1..chapterCount`; `getChapter` returns `status: "ok"` for MAT 1, MAT 26, REV 22 and `does-not-exist` for PHP 5
- [ ] T012 [P] [US1] Change `ChapterUnavailable` in `src/components/reading/chapter-status.tsx`: heading `Text not available`; body says this chapter is missing from the installed Greek text, which is out of date, and to run `npm run db:seed` (use `<code>` as `ChapterNotInstalled` does); remove the "Philippians 1 is available" sentence and the `/read/php/1` link
- [ ] T013 [P] [US1] Update the `Unavailable` story in `src/components/reading/reader.stories.tsx` to expect the heading `Text not available` (navigation assertion unchanged)
- [ ] T014 [P] [US1] Update `scripts/qa/reader.cjs`: at `/read/mat/28`, wait for the Greek text (not `Text not yet available`), then keep the existing `Next chapter: Mark 1` navigation check
- [ ] T015 [US3] Before reseeding, on the store still built from Philippians 1 only, create an analysis on Philippians 1 at `/work` and export it to a file; keep both for T020
- [ ] T016 [US1] Run `npm run db:seed` (reports 260 chapters, 137,741 words), `npm run build && npm start`, and check Matthew 1, Matthew 26 (under one second with part-of-speech colours on), Luke 1, Acts 28, Philemon 1 and Revelation 22, plus Matthew 28 → Mark 1 and back; then run `node scripts/qa/reader.cjs`

**Checkpoint**: The reader is usable for the whole New Testament.

---

## Phase 4: User Story 2 - Same word help everywhere (Priority: P1)

**Goal**: Every word in every chapter carries the same facts as Philippians 1, and nothing more.

**Independent Test**: select words of each part of speech in a Gospel, Acts, a letter and Revelation; details match the source, no gloss is invented.

- [ ] T017 [US2] In the `committed corpus` block of `src/db/seed.test.ts`, add a test that parses every committed chapter file with `parseChapter` from `src/lib/corpus/format.ts` (strict; rejects `ln`, `domain` and any field outside the whitelist) and asserts: every word has a non-empty `id`, `text`, `lemma` and `pos`; `pos` is one of `noun, verb, det, conj, pron, prep, adj, adv, ptcl, num, intj`; `m` keys are only `person, number, gender, case, tense, voice, mood, degree`; word ids are unique across all files; every file's `source.commit` is `8423afe47b9e8f24b7772e808af45c7159a6fe7e`; every word's `after` is one of `" "`, `", "`, `". "`, `"· "`, `"; "`, `"’ "`, `"᾿ "`; and verse numbers never decrease within a chapter (spec FR-004)
- [ ] T018 [US2] Manual check in the running app: select a noun, verb (finite and participle), article and conjunction in Matthew 5, Acts 2, Romans 8 and Revelation 1, and one word with no gloss (find one by scanning a chapter file in `corpus/v1` for a word object with no `"gloss"` key); the popover shows lemma, part of speech and morphology, and no gloss line for the gloss-less word

**Checkpoint**: Word help is consistent across books.

---

## Phase 5: User Story 3 - Saved work and credits unaffected (Priority: P2)

**Goal**: Existing saved work and credits behave exactly as before the rebuild.

**Independent Test**: save work on Philippians 1, rebuild the corpus with the full text, reopen it; open the credits.

- [ ] T019 [US3] In the `committed corpus` block of `src/db/seed.test.ts`, assert Philippians 1 is unchanged: `getChapter(db, "PHP", 1)` has 501 words, first id `n50001001001`, and the same ids in the same order as the fixture `corpus/v1/PHP/1.json`; and `getAttribution` returns exactly the three datasets SBL Greek New Testament, MACULA Greek Linguistic Datasets and Berean Interlinear Bible
- [ ] T020 [US3] After T016's reseed, reopen the analysis from T015, confirm it opens and its export matches the earlier file except for timestamps, and open `/credits` to confirm three unchanged entries
- [ ] T021 [US3] Check the automatic rebuild (spec FR-008): build a Philippians-only store in a temp data dir with `DATA_DIR=<tmp> node scripts/seed-corpus.ts` from a checkout of `main`, then in the worktree run `DATA_DIR=<tmp> node scripts/seed-if-stale.ts` and confirm it reports `Built the corpus store: 260 chapter(s), 137741 words.`; a second run must report `Corpus store is up to date.`

**Checkpoint**: Upgrading loses nothing.

---

## Phase 6: User Story 4 - Reproducible ingest (Priority: P3)

**Goal**: A maintainer can regenerate byte-identical output from the README alone, and a bad source never damages the committed corpus.

**Independent Test**: follow `scripts/ingest/README.md` from a clean checkout and get no diff.

- [ ] T022 [P] [US4] Rewrite `scripts/ingest/README.md` for the full ingest: the pinned commit and date (2026-07-07), the two commands from the contract, what is kept (unchanged list), that syntax trees, clause, role and conjunction data are not kept because that analysis is the user's (spec FR-011), the all-or-nothing behaviour, and that the source is downloaded outside the repo; remove the "sample chapter" section and the "full ingest extends this script" note
- [ ] T023 [US4] Determinism and failure checks from `specs/009-full-new-testament-text/quickstart.md` steps 2–3: run the ingest twice and confirm `git status --porcelain corpus/v1` shows nothing new after the second run; then run the ingest against three broken copies of the source, each in its own temp dir: (a) `27-revelation.xml` deleted; (b) `18-philemon.xml` cut short so it is no longer well-formed XML; (c) one word's text in `18-philemon.xml` changed to include `<`. For each, confirm exit 1, an `error:` line naming the file (or the word id for c), no `corpus/v1.new` left behind, and `git status --porcelain corpus/v1` unchanged (spec FR-010)

**Checkpoint**: All four stories done.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Docs that still say "only Philippians 1", gates, review.

- [ ] T024 [P] Update `lat.md/corpus.md` (Ingest pipeline: whole SBLGNT, `scripts/ingest/ingest.py` and `fetch.sh`, all-or-nothing output; replace "Clause and conjunction data arrive with the full ingest" with a statement that they are not ingested) and `lat.md/architecture.md` (Offline corpus ingest: new script link, whole New Testament); fix any `[[scripts/ingest/sample_chapter.py]]` link; run `lat check`
- [ ] T025 [P] Update `CLAUDE.md` Project state: the whole SBL Greek New Testament is ingested (replace "Philippians 1 is the only ingested chapter; other chapters show an unavailable state"); replace the `sample_chapter.py` reference in the root `README.md` with `scripts/ingest/ingest.py` and `scripts/ingest/fetch.sh`
- [ ] T026 [P] Update Spec Kit specs: in `specs/001-corpus-store/spec.md`, `specs/002-greek-reader/spec.md` and `specs/006-discourse-analysis-foundation/spec.md` replace the "only Philippians 1 is ingested" assumptions and any SC that names only Philippians 1; in 006 "Not built yet", keep only clause and conjunction data and note spec 009 FR-011; set `specs/009-full-new-testament-text/spec.md` status to Implemented
- [ ] T027 [P] Update OpenSpec: Philippians-only wording in `openspec/specs/text/*/spec.md`, and in `openspec/changes/discourse-analysis-foundation/` (design.md, tasks.md) mark the text-only whole-NT ingest as delivered by spec 009 and record that whether to ingest clause and conjunction data is an open question
- [ ] T028 Run the gates: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test` (unit and Storybook), `npm run build`, `lat check`; optionally `docker build -t vible-arcing .` and run it on an empty volume to confirm it seeds 260 chapters (CI's amd64 build is the authoritative check)
- [ ] T029 Get an independent review of the diff (code and security review subagent per `lat.md/skill-maintenance.md`), fix findings, then `npm run coord -- check` before committing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T003)** → **Foundational (T004–T010)** → stories → **Polish (T024–T029)**
- Within Foundational: T005 → T006 → T007 → T008 (same file, in order); T004 in parallel with T005–T008; T009 needs T004 and T008; T010 needs T009

### User Story Dependencies

- **US1 (T011–T014, T016)**: needs Phase 2. T011 shares `seed.test.ts` with T017 and T019, so do those three in order.
- **US2 (T017–T018)**: needs Phase 2; T018 needs the running app from T016.
- **US3 (T015, T019–T021)**: needs Phase 2; T015 must run before T016 reseeds the store; T020 needs T016; T021 needs a checkout of `main`.
- **US4 (T022–T023)**: needs Phase 2 only.

### Parallel Opportunities

- T004 alongside T005–T008.
- After Phase 2: T012, T013, T014 and T022 touch different files and can run together; T024–T027 can run together.

## Parallel Example: after Phase 2

```text
Task: "T012 Change ChapterUnavailable copy in src/components/reading/chapter-status.tsx"
Task: "T013 Update Unavailable story in src/components/reading/reader.stories.tsx"
Task: "T014 Update Matthew 28 check in scripts/qa/reader.cjs"
Task: "T022 Rewrite scripts/ingest/README.md"
```

## Implementation Strategy

### MVP (User Story 1)

1. Phase 1 and Phase 2: the corpus is regenerated and committed-ready.
2. Phase 3: every chapter readable, message fixed, QA updated.
3. Stop and check in the browser. This alone delivers what the user asked for.

### Then

US2 and US3 add automated guarantees (word data, Philippians 1 and credits unchanged); US4 makes the ingest reproducible by anyone; Polish brings every doc in line. Commit after each phase.

## Notes

- Never commit the downloaded XML; it stays in the temp directory.
- If T009's Philippians 1 diff is not clean, stop: the word ids saved work depends on would change.
- No syntax-tree, clause, role or conjunction data may enter the output (spec FR-011).
