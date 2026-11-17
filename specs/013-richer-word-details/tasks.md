---

description: "Task list for richer word details"
---

# Tasks: Richer Word Details

**Input**: Design documents from `specs/013-richer-word-details/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ingest-lexicon.md, contracts/word-details.md, quickstart.md

**Tests**: The spec does not ask for TDD. Test tasks are included where a success criterion needs an automated check in CI (SC-001 to SC-004, SC-007 to SC-009) or where the plan changes existing tests.

**Organization**: Phase 2 is the whole data pipeline: one ingest run produces Strong's numbers, the lexicon, the correspondence and the credits, and the seed and chapter payload carry them. It blocks every story. After it, each story is mostly a slice of the word-details panel plus its own checks. Work happens in the main checkout on `study-plans-010-015`, with no worktree.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story from spec.md (US1–US5)

**Pinned values used throughout**:

- MACULA commit `8423afe47b9e8f24b7772e808af45c7159a6fe7e`.
- Dodson commit `74f70358d4acfaf2f980bf2feb58ab7115cbbcbc` (`biblicalhumanities/Dodson-Greek-Lexicon`).
- 137,741 words, 5,468 lemmas after NFC, 5,410 Dodson entries.

**Anchor words**:

| Word id | Word | Strong's | Lemma / entry |
|---|---|---|---|
| `n40002008006` | εἶπεν, Matthew 2:8 | 2036 | lemma λέγω, entry 3004 through the correspondence |
| `n43001038009` | λέγει, John 1:38 | 3004 | direct |
| `n49003020007` | ὑπερεκπερισσοῦ, Ephesians 3:20 | `5228+1537+4053` | |
| `n41014031003` | ἐκπερισσῶς, Mark 14:31 | `1537+4053` | |
| `n42003033006` | Ἀρνί, Luke 3:33 | source `0`, so no number | |
| `n41015038003` | καταπέτασμα, Mark 15:38 | 2665 | the longest Dodson definition, 307 characters |

---

## Phase 1: Setup

**Purpose**: Working state and the licence gate (FR-019, constitution Licensing).

- [ ] T001 In the main checkout (`/Users/davidenglish/Projects/vible-arcing`, branch `study-plans-010-015`; do not create a worktree):
  - run `fnm use` and `npm install`;
  - run `npm run coord -- list`;
  - then `npm run coord -- claim scripts/ingest corpus/v1 src/lib/corpus src/db src/app/read src/components/reading src/app/globals.css drizzle/corpus docs/reference/data-sources.md lat.md --note "013 richer word details"`;
  - confirm with the user that the constitution v1.1.0 amendment (`.specify/memory/constitution.md`) and the `PRODUCT.md` "No interpretation" amendment are committed before, or with, this feature's first commit. The plan's Constitution Check depends on both.
- [ ] T002 [P] Record the Dodson lexicon in `docs/reference/data-sources.md`. This gates shipping: no corpus change from Phase 2 may be committed before it.
  - Add a `### Dodson Greek–English Lexicon — \`biblicalhumanities/Dodson-Greek-Lexicon\`` entry under `## Greek`, following the style of the existing entries.
  - Verdict line: `**VERDICT: Public domain — safe to bundle.**`
  - A paragraph quoting Dodson's release sentence verbatim: "The lexicon is hereby released by the copyright holder into the public domain. As such, it may be used for personal, academic, non-commercial, and/or commercial purposes."
  - Links to the pinned `README-ulrikp.txt` and `LICENSE` (CC0 1.0) at commit `74f7035…`, and the note that the CrossWire SWORD module lists it as Public Domain.
  - The rule that only key, headword and full definition are kept.
  - Add Dodson to the "Recommended stack" table and the "Required attribution" list (wording from research R10), and update any "Known gaps" item about the lexicon.

---

## Phase 2: Foundational (blocks all stories)

**Purpose**: The data pipeline from source to page payload. Contract: `specs/013-richer-word-details/contracts/ingest-lexicon.md`. Shapes: `specs/013-richer-word-details/data-model.md`.

- [ ] T003 [P] Extend `scripts/ingest/fetch.sh`:
  - add `DODSON_COMMIT=74f70358d4acfaf2f980bf2feb58ab7115cbbcbc`;
  - download `https://raw.githubusercontent.com/biblicalhumanities/Dodson-Greek-Lexicon/$DODSON_COMMIT/dodson.xml` to `<dir>/dodson.xml` with `curl -sSfL`, stopping with the file name on failure;
  - check it against a new `dodson.xml` line in `scripts/ingest/SHA256SUMS`: compute it once with `shasum -a 256` and commit it;
  - print both commits at the end.
- [ ] T004 In `scripts/ingest/ingest.py` `word_record`:
  - set `lemma` to `unicodedata.normalize("NFC", lemma)`; leave `text` unchanged (research R5);
  - add `normalise_strong(value) -> str | None`: split on `+`, strip each part, drop parts that are not all digits or that are `0` after stripping leading zeros, join the survivors with `+` in source order, and return `None` if none survive;
  - add `"strong"` to the record **between `pos` and `m`** only when the result is not `None`. The value must match `^[1-9][0-9]*(\+[1-9][0-9]*)*$`.
- [ ] T005 In `scripts/ingest/ingest.py`, add `parse_lexicon(path) -> dict[int, tuple[str, str]]`:
  - apply the same refusals as `parse_book` (BOM, DTD, entities, non-UTF-8);
  - iterate `entry` elements regardless of namespace;
  - take the key from the part of `@n` after `|` as an `int` (1–5624), the headword as NFC `orth` text, and the definition as the full text of `def[@role="full"]` with whitespace runs collapsed to one space and trimmed;
  - raise `IngestError` naming the entry for a missing key, headword or definition, a duplicate key, or `<`, `>` or `&` in headword or definition;
  - keep nothing else: no brief definition and no Goodrick-Kohlenberger number (FR-020).
- [ ] T006 In `scripts/ingest/ingest.py`, add the lexicon arguments and output:
  - **Arguments**: `--lexicon <file>` (required), `--lexicon-commit <sha>` (required, same 40-hex rule as `--commit`, argparse error exit 2), and `--correspondence <file>` (default `scripts/ingest/strongs-correspondence.json`).
  - **Load** `{"rows": [{"strong", "entry", "note"}]}` and validate it, raising `IngestError` for:
    - a row whose `strong` is a Dodson key;
    - a value absent from the text;
    - an `entry` that is neither `null` nor a Dodson key;
    - a missing or empty `note`;
    - rows that are duplicated or not sorted by `strong`.
  - **Resolve** every distinct `strong` value in the text: a value that is a Dodson key is `{"entry": key, "via": "direct"}`; otherwise the correspondence row gives `{"entry": row.entry, "via": "correspondence"}`. If any value is neither, raise one `IngestError` that lists every such value.
  - **Coverage**: compute the share of words whose `strong` resolves to a non-null entry. Raise `IngestError` if it is below 99% (SC-003).
  - **Output**: write `<out>.new/lexicon.json` as `{"format": 1, "source": {"dataset": "dodson-greek-lexicon", "commit": <lexicon-commit>}, "entries": [{"key", "headword", "definition"}…] sorted by key, "numbers": [{"strong", "entry", "via"}…] sorted by strong}` with the existing `write_json`, inside the existing all-or-nothing swap.
  - **Summary**: extend the line with `<n> lexicon entries, <n> Strong's values, with entry: <n> of <total> (<pct>%)`.
- [ ] T007 In `scripts/ingest/ingest.py`, append a fourth record to `ATTRIBUTION`, after Berean, with the same eight fields as the others:
  - name `A Greek-English Lexicon of the New Testament`;
  - creator `John Jeffrey Dodson`;
  - license `Public domain`;
  - licenseUrl `https://github.com/biblicalhumanities/Dodson-Greek-Lexicon/blob/74f70358d4acfaf2f980bf2feb58ab7115cbbcbc/README-ulrikp.txt`;
  - statement crediting Dodson (2010), released into the public domain, digital edition by Ulrik Sandborg-Petersen and biblicalhumanities;
  - modified `true`, with modifications `Headwords and full definitions only, normalised to Unicode NFC; reached through Strong's numbers with a reviewed correspondence`;
  - url `https://github.com/biblicalhumanities/Dodson-Greek-Lexicon`.
- [ ] T008 [P] Create `scripts/ingest/propose_correspondence.py` (stdlib only, run with `python3 -I`; args `--source`, `--lexicon`, `--correspondence`), following the contract.
  - It must reuse `parse_book`, `normalise_strong` and `parse_lexicon` from `ingest.py`.
  - `python3 -I` does not put the script's directory on `sys.path`, so a plain `import ingest` fails. Load the module by explicit path instead: `importlib.util.spec_from_file_location("ingest", Path(__file__).with_name("ingest.py"))`, then `module_from_spec` and `exec_module`.
  - Do not add the directory to `sys.path`.
  - For each normalised `strong` value that is neither a Dodson key nor already a correspondence row, print a proposed row to stdout as JSON:
    - `entry` is the single Dodson key whose NFC headword equals an NFC lemma MACULA gives those words, otherwise `null`;
    - `note` lists each lemma with its word count.
  - Print direct matches whose headword differs from every lemma on stderr, for information.
  - Write nothing to the repository. Exit 0.
- [ ] T009 Write the reviewed correspondence `scripts/ingest/strongs-correspondence.json`.
  - Run `SRC=$(mktemp -d)`, `sh scripts/ingest/fetch.sh "$SRC"` and `python3 -I scripts/ingest/propose_correspondence.py --source "$SRC" --lexicon "$SRC/dodson.xml" > "$SRC/proposals.json"`.
  - Write one row per proposal, following Dodson (research R4 rule, decided 2026-11-16): the row points to the entry Dodson files the words' lemma under, or `null` when Dodson has none or the lemmas point to different entries.
  - Write a specific note on every row, for example `{"strong": "2036", "entry": 3004, "note": "aorist εἶπον; Dodson files it under λέγω"}`.
  - Expect about 71 single-number rows and 3 compound rows (`1417+3461`, `1537+4053`, `5228+1537+4053`), sorted by `strong`.
  - Do not consult `docs/design/base44-prototype/src/lib/strongCrosswalk.js`.
  - The user approves this file in review.
- [ ] T010 Regenerate the corpus:
  - `python3 -I scripts/ingest/ingest.py --source "$SRC" --commit 8423afe47b9e8f24b7772e808af45c7159a6fe7e --lexicon "$SRC/dodson.xml" --lexicon-commit 74f70358d4acfaf2f980bf2feb58ab7115cbbcbc --out corpus/v1`;
  - confirm the summary: 27 books, 260 chapters, 137,741 words, 5,410 entries, and a share with an entry of at least 99%;
  - run it again and confirm `git status --porcelain corpus/v1` shows nothing new;
  - confirm every word id is unchanged: `git diff corpus/v1 | grep '^[-+].*"id"'` prints nothing.
- [ ] T011 [P] Extend `scripts/ingest/ingest.test.ts` with a synthetic `dodson.xml` (3–4 entries) and a synthetic correspondence.
  - First update the shared runner (the `spawnSync` calls at about lines 27 and 71) so every invocation passes `--lexicon`, `--lexicon-commit` and `--correspondence`. They become required, so every existing test would otherwise fail with exit 2. Existing tests keep their expectations apart from the word record's new `strong`.

  Then cover:
  - `strong` normalisation: `"0846"` → `"846"`, `"0"` → field omitted, `"1537+4053"` kept, `"12a"` → omitted;
  - an NFC lemma (an oxia input lemma comes out as tonos);
  - `lexicon.json` shape and `via` values;
  - each validation failure from T006 (exit 1, `error:` naming the value, `<out>` unchanged);
  - the coverage floor;
  - the Dodson attribution record.

  Update the existing word assertion so it expects `strong`.
- [ ] T012 [P] Update the corpus parser in `src/lib/corpus/format.ts`:
  - add optional `strong: z.string().regex(/^[1-9][0-9]*(\+[1-9][0-9]*)*$/)` to the strict word object;
  - add a strict `parseLexicon` schema: `format: 1`, `source: { dataset: "dodson-greek-lexicon", commit: 40-hex }`, `entries` with `key: int 1–5624` (unique), non-empty `headword` and `definition` with no `<>&`, and `numbers` with `strong` (same regex, unique), `entry: int | null` (when not null it must be an entries key) and `via: "direct" | "correspondence"`;
  - export the inferred types.

  Add parser tests to `src/lib/corpus/format.test.ts`, including rejection of `ln`, `domain` and extra keys on lexicon rows.
- [ ] T013 Update the Drizzle schema in `src/db/schema/corpus.ts`:
  - `words.strong` as `text` (nullable);
  - index `words_lemma_idx` on `words.lemma`;
  - table `lexicon_entries` (`key` integer primary key, `headword` text not null, `definition` text not null);
  - table `strong_numbers` (`strong` text primary key, `entry_key` integer nullable referencing `lexicon_entries.key`, `via` text not null with `CHECK (via IN ('direct','correspondence'))`);
  - table `lemmas` (`lemma` text primary key, `occurrences` integer not null with `CHECK (occurrences > 0)`).

  Run `npm run db:generate` and keep the generated `drizzle/corpus/0001_*.sql` and `meta/` changes.
- [ ] T014 Update `src/db/seed.ts`:
  - set `SEED_VERSION = 2`;
  - include `lexicon.json` in `ingestHash`;
  - in `readIngest`, read and parse `corpus/v1/lexicon.json` with `parseLexicon`;
  - in `load`, inside the existing transaction and temporary-file swap: insert `lexicon_entries` and `strong_numbers` (batches of 500), insert `words.strong`, then run `INSERT INTO lemmas SELECT lemma, COUNT(*) FROM words GROUP BY lemma`.

  Refuse the build, with a message naming the value, when:
  - a `words.strong` value has no `strong_numbers` row;
  - a non-null `entry_key` is missing from `lexicon_entries`.

  The report includes entry and lemma counts.
- [ ] T015 Update `src/db/seed.test.ts`:
  - the fixture `beforeEach` also copies `corpus/v1/lexicon.json`;
  - update the pinned sha256 of `corpus/v1/PHP/1.json` and the pinned credits list (now four entries, Dodson last);
  - the whitelist test ("keeps only the whitelisted facts for every word") allows `strong` and asserts its regex;
  - keep the "no Louw-Nida or UBS keys" and "no ln/domain columns" tests;
  - add a seed-refusal test for a word whose `strong` has no `numbers` row.
- [ ] T016 Extend the read model in `src/db/corpus.ts`:
  - on opening the connection, check `sqlite_master` once for both `lexicon_entries` and `lemmas`, and hold the result as `hasWordFacts`;
  - extend `Word` with `strong?: string` and `entry?: number | null`;
  - when `hasWordFacts`, `getChapter` left-joins `strong_numbers` for `entry` (`null` when there is no row or no number), and also returns `lexicon: Record<number, {headword, definition}>` (only the keys this chapter uses) and `occurrences: Record<string, number>` (this chapter's lemmas, from `lemmas`);
  - when not `hasWordFacts`, leave all of these `undefined` (FR-021: undefined means unknown, never "no entry");
  - a store built before this feature has no `words.strong` column either. The `hasWordFacts` check therefore also confirms the column, through `PRAGMA table_info(words)`. When `hasWordFacts` is false, the chapter query must not select `words.strong` or join the new tables at all. Use two prepared statements, not a column that may be missing.
- [ ] T017 Carry the new fields into the page payload in `src/app/read/[book]/[chapter]/page.tsx`: map `strong` and `entry` per word, plus `lexicon` and `occurrences`, into `ChapterText`.
  - Extend the `ChapterText` type with `lexicon?` and `occurrences?`, and the word type with `strong?` and `entry?`, in the module that defines it today.
  - If spec 010's Learning-mode lean payload already exists in the code, confirm it omits all four fields.
- [ ] T018 [P] Create `src/lib/corpus/word-facts.ts` with:
  - `strongLabel(strong)`: `"3004"` → `"G3004"`, `"1537+4053"` → `"G1537 + G4053"`;
  - `occurrencesLabel(n)`: `1` → `"once"`, otherwise `"<n> times"` using `Intl.NumberFormat("en")`, so 2335 → `"2,335 times"`;
  - `entryIsElsewhere(strong, key)`: true when `key` is not one of the word's `+`-separated numbers.

  Add tests in `src/lib/corpus/word-facts.test.ts`, including `occurrencesLabel(1)`, which must never be `"1 times"`.

**Checkpoint**:

- `npx vitest run --project unit` passes.
- `npm run db:seed` reports about 5,410 entries and 5,468 lemmas.
- The Matthew 2 page payload carries `strong`, `entry`, `lexicon` and `occurrences`.

---

## Phase 3: User Story 1 - Read the dictionary entry for a word (Priority: P1) 🎯 MVP

**Goal**: Selecting a word shows its Dodson headword and full definition, or a plain "no entry" sentence.

**Independent Test**: Select εἶπεν (Matthew 2:8), λέγει (John 1:38) and a preposition: each shows a headword and definition. Select Ἀρνί (Luke 3:33): it shows the "no entry" sentence and every other fact.

- [ ] T019 [US1] In `src/components/reading/word-detail.tsx`, add the `entry` prop (`{ key, headword, definition } | null | undefined`) and render the Lexicon section after the morphology `dl`, per `contracts/word-details.md`:
  - a heading "Lexicon";
  - when there is an entry: the headword in `<span lang="grc">` and the definition in `<p lang="en">`;
  - when `null`: exactly "The Dodson lexicon has no entry for this word.";
  - when `undefined`: no section at all.

  Never render an empty definition area, a placeholder dash or a loading state (FR-005, FR-010, FR-011). Use theme tokens and serif type only (FR-014).
- [ ] T020 [US1] In `src/components/reading/greek-text.tsx`, resolve each selected word's entry from the chapter data and pass it to `WordDetail`:
  - `word.entry === undefined` → `undefined`;
  - `null` → `null`;
  - a key → `{ key, ...data.lexicon[key] }`.
- [ ] T021 [US1] Phone sheet (decided 2026-11-16):
  - in `src/app/globals.css`, in the max-width 767px rule for `.word-detail`, change `max-height: 85vh` to `max-height: 50dvh`, keeping its own scrolling;
  - in `src/components/reading/greek-text.tsx`, when a word's panel opens at phone width (`matchMedia("(max-width: 767px)")`), scroll the selected word into view above the sheet, for example with `scroll-margin-bottom: 50dvh` on the selected word and `scrollIntoView({ block: "nearest" })`;
  - leave opening, closing, Escape and focus return unchanged (FR-013).
- [ ] T022 [P] [US1] Add stories to `src/components/reading/word-detail.stories.tsx`, passing explicit props.

  Storybook runs axe only in the light theme (`initialGlobals` in `.storybook/preview.tsx`). For SC-007, add `LexiconEntryDark` and `LexiconEntrySepia` variants that set `globals: { theme: "dark" }` and `{ theme: "sepia" }`, so axe also runs in those themes. Do the same for `NoEntry` and for T026's `CountMany`.

  The stories:
  - `LexiconEntry`: λέγω 3004 with its definition;
  - `NoEntry` (`entry: null`);
  - `OlderStore` (`entry`, `strong` and `occurrences` all undefined; the play function asserts there is no "Lexicon" heading and no "no entry" text);
  - `LongestDefinition`: καταπέτασμα 2665, with Dodson's 307-character definition copied from `corpus/v1/lexicon.json`, at a 320px mobile viewport. Its play function:
    - asserts the end of the definition can be scrolled into view;
    - then, to cover keyboard scrolling for FR-013 and SC-006, focuses the close button inside the panel, presses `End` (or `PageDown` until the end is reached) with `userEvent.keyboard`, and asserts the definition's last line is within the panel's visible area.

  Each play function asserts `lang="grc"` on the headword and `lang="en"` on the definition, and that no text matching `/role|domain|sense/i` appears (SC-004). Axe runs on all of them (SC-007).
- [ ] T023 [US1] Add to `src/db/seed.test.ts`, in the committed-corpus block (SC-003):
  - every word's entry resolves under the direct-then-correspondence rule from `lexicon.json`;
  - the share with an entry is at least 99%;
  - `getChapter` gives `n40002008006` entry 3004 and `n43001038009` entry 3004 (Story 1 scenario 3, same entry in different verses), and `n42003033006` has `strong` undefined and entry `null`;
  - against a store built with the previous schema, `getChapter` returns without throwing and `strong`, `entry`, `lexicon` and `occurrences` are all `undefined` (FR-021). Build that store from migration `0000` only: no `words.strong` column and none of the new tables. Use the drizzle migrator with a copy of `drizzle/corpus` that holds only `0000_*.sql` and a matching `_journal.json`, then insert a few fixture words. Dropping a table alone is not enough, because the missing column is what would crash.

**Checkpoint**: The dictionary entry shows in the reader and the phone sheet keeps the word visible. This is the MVP.

---

## Phase 4: User Story 2 - See how often a word occurs in the New Testament (Priority: P1)

**Goal**: Every word shows its lemma's New Testament count with correct singular and plural wording, as plain text until spec 014 exists.

**Independent Test**: Compare the counts shown for a once-only lemma, a mid-frequency lemma and καί with an independent count over `corpus/v1`.

- [ ] T024 [US2] In `src/components/reading/word-detail.tsx`, add the `occurrences?: number` and `onOccurrences?: () => void` props and the `dt`/`dd` row "Occurrences in the New Testament" with `occurrencesLabel(n)`.
  - Omit the row when `occurrences` is undefined.
  - Without `onOccurrences` it is plain text, with no button role, link styling or tab stop (FR-008).
  - With `onOccurrences` it is a `<button>` whose accessible name includes the label and count.
- [ ] T025 [US2] In `src/components/reading/greek-text.tsx`, pass `occurrences={data.occurrences?.[word.lemma]}` to `WordDetail`, and do not pass `onOccurrences` (spec 014 adds it).
- [ ] T026 [P] [US2] Add stories `CountOnce` (1 → "once") and `CountMany` (2335 → "2,335 times"), plus `CountManyDark` and `CountManySepia` variants (SC-007, see T022), to `src/components/reading/word-detail.stories.tsx`. Each play function asserts there is no element with role `button` or `link` inside the count row.
- [ ] T027 [US2] Add to `src/db/seed.test.ts`, in the committed-corpus block (SC-002, FR-007):
  - read every `corpus/v1/<BOOK>/<n>.json`, count words per `lemma` in the test itself, and assert that the result equals the store's `lemmas` table row for row;
  - assert the δέ count includes the 11 words MACULA spelled with oxia (the NFC-normalised `δέ` count equals 2,777).

**Checkpoint**: Counts are shown and match the text.

---

## Phase 5: User Story 3 - Find the word's Strong's number (Priority: P2)

**Goal**: The word's own Strong's number is shown, never blank, and kept distinct from the number of the entry shown.

**Independent Test**: εἶπεν (Matthew 2:8) shows G2036 and the entry "λέγω (G3004)". ὑπερεκπερισσοῦ (Ephesians 3:20) shows "G5228 + G1537 + G4053". Ἀρνί shows no Strong's row.

- [ ] T028 [US3] In `src/components/reading/word-detail.tsx`, add the `strong?: string` prop and the `dt`/`dd` row "Strong's number" with `strongLabel(strong)`, omitted when absent (FR-010).
  - In the Lexicon section, when `entryIsElsewhere(strong, entry.key)`, show `(G<key>)` beside the headword (FR-004), so that εἶπεν reads "λέγω (G3004)".
  - Keep the row order from `contracts/word-details.md`: Strong's number, then occurrences, then the Lexicon section.
- [ ] T029 [US3] In `src/components/reading/greek-text.tsx`, pass `strong={word.strong}` to `WordDetail`.
- [ ] T030 [P] [US3] Add stories to `src/components/reading/word-detail.stories.tsx`:
  - `EntryFiledElsewhere`: strong `2036`, entry 3004 λέγω; the play function asserts "G2036" and "(G3004)";
  - `CompoundNumber`: `5228+1537+4053` with the entry the correspondence gives;
  - `NoNumber`: strong undefined, entry `null`; the play function asserts no "Strong's number" text.
- [ ] T031 [US3] Add to `src/db/seed.test.ts`, in the committed-corpus block (SC-001):
  - `getChapter` gives `n40002008006` strong `"2036"`, `n49003020007` `"5228+1537+4053"`, `n41014031003` `"1537+4053"`, and `n42003033006` none;
  - every `words.strong` in the store equals the `strong` of the same id in `corpus/v1`.

  Source fidelity against MACULA itself is covered by `scripts/ingest/ingest.test.ts` (T011) and by the T010 determinism run.

**Checkpoint**: All three facts show in the reader.

---

## Phase 6: User Story 4 - The same richer details everywhere (Priority: P2)

**Goal**: Editors that do not exist yet are bound to the same facts, and Learning mode withholds them.

**Independent Test**: Read the updated specs 007, 008 and 010. Once an editor exists, compare its word details with the reader's.

- [ ] T032 [P] [US4] Update `specs/007-arcing-editor/spec.md` FR-041 and `specs/008-sentence-diagramming/spec.md` FR-015 (FR-017):
  - name the Strong's number, the Dodson headword and definition, and the New Testament occurrence count as part of word help;
  - require reuse of `WordDetail` with the props in `specs/013-richer-word-details/contracts/word-details.md`.
- [ ] T033 [P] [US4] Update `specs/010-learning-mode/data-model.md` (and `plan.md` if it lists the lean payload): the Learning-mode chapter payload explicitly excludes `strong`, `entry`, `lexicon` and `occurrences` (FR-016, SC-009). If the Learning-mode code already exists, also assert this in its payload test.

**Checkpoint**: Specs 007, 008 and 010 match this feature.

---

## Phase 7: User Story 5 - Credit the lexicon (Priority: P3)

**Goal**: Dodson appears on the credits page from the corpus attribution, with no hand edit to the page.

**Independent Test**: Open `/credits` and see Dodson with "Public domain", the link, attribution and modification note.

- [ ] T034 [P] [US5] Update `src/components/credits/committed-attribution.test.ts` to expect four datasets, with Dodson last, `license: "Public domain"` and the pinned `README-ulrikp.txt` URL. Confirm that `src/components/credits/attribution-list.tsx` renders a licence that is not CC BY ("Public domain") with its link and modification note, without code changes. If it assumes CC BY anywhere, generalise that rendering. Do not add a hand-written entry to `src/app/credits/page.tsx` (Story 5 scenario 2).
- [ ] T035 [US5] Add a Dodson check to `scripts/qa/reader.cjs`: `/credits` lists "A Greek-English Lexicon of the New Testament" and "Public domain" (SC-008).

**Checkpoint**: All five stories are done.

---

## Phase 8: Polish & Cross-Cutting

**Purpose**: Docs, sibling specs, gates and review.

- [ ] T036 [P] Rewrite `scripts/ingest/README.md` for the lexicon:
  - the Dodson pinned commit and the licence pointer;
  - the proposal-then-review steps for `strongs-correspondence.json`, including the follow-Dodson rule and that a MACULA bump with new numbers makes the ingest fail until rows are added;
  - what is kept from Dodson;
  - that lemmas are NFC.
- [ ] T037 [P] Update `lat.md/corpus.md`:
  - Ingest pipeline: lexicon input, correspondence, NFC lemmas;
  - Licence rules enforced at ingest: Dodson fields only, no MARBLE/SDBG;
  - Attribution: four datasets;
  - a new "Lexicon and Strong's numbers" section;
  - `lat.md/reader.md` "Words and display": the new facts, the half-screen phone sheet, absent versus no entry.

  Run `lat check`.
- [ ] T038 [P] Update `CLAUDE.md` Project state: word details include Strong's number, the Dodson entry and the New Testament count.
- [ ] T039 [P] Update the specs:
  - `specs/001-corpus-store/spec.md`: the corpus also carries Strong's numbers, lexicon entries, the reviewed correspondence and per-lemma counts;
  - `specs/002-greek-reader/spec.md`: FR-009 word facts, pointing to spec 013;
  - `specs/014-word-occurrences/spec.md`: in FR-002 and the "Same word" assumption, lemmas are matched after Unicode NFC normalisation, which joins only spellings Unicode treats as identical, such as tonos and oxia. Add that the total comes from the corpus store's `lemmas` table, so it equals 013's count. If `specs/014-word-occurrences/plan.md` has been filled in by then, update it to match.

  Set `specs/013-richer-word-details/spec.md` status to Implemented.
- [ ] T040 [P] Update OpenSpec, with no change folder:
  - `openspec/specs/text/greek-reader/spec.md`: word details gain Strong's number, lexicon entry and count, and the phone sheet is capped at half the screen;
  - the corpus-store spec under `openspec/specs/text/`: Strong's numbers, lexicon, correspondence, `lemmas` table.
- [ ] T041 Run the gates: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test` (unit and Storybook with axe), `npm run build` and `lat check`.
  - Confirm `npm run db:generate` produces no further migration changes.
  - Time `npm run db:seed` before and after this feature, and record both for the PR. The plan's goal is under 1 s of growth.
  - Optionally run `docker build -t vible-arcing .` and run it on an empty volume to confirm the seed reports the lexicon. CI's amd64 build is the authoritative check.
- [ ] T042 Run `specs/013-richer-word-details/quickstart.md` steps 4–5 in the browser at desktop and 320px widths:
  - the anchor words from the table at the top of this file;
  - keyboard and screen-reader labels in light, dark and sepia;
  - the older-store check: keep a pre-change `data/corpus.sqlite` copy from before T014 and start against it;
  - the Matthew 26 payload size before and after;
  - SC-005 on Matthew 26: in Chrome DevTools Performance, record a tap on a word. From the input event to the frame that paints the complete details (Strong's row, count and lexicon) must be under 100 ms, with no network request and no intermediate loading frame.

  Record the payload growth and the coverage percentage from T010 for the PR description. Run `node scripts/qa/reader.cjs`.
- [ ] T043 Get an independent code and security review of the diff, using the Sonnet review subagent as in `lat.md/skill-maintenance.md`. Fix the findings, then run `npm run coord -- check` and `npm run coord -- release`. Ask the user before committing.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T002)** → **Foundational (T003–T018)** → stories → **Polish (T036–T043)**.
- T002 must be merged with, or before, any corpus change. It gates shipping, not coding.
- Within Foundational:
  - T004 → T005 → T006 → T007 (same file, in order);
  - T003 and T008 run in parallel with them (T008 imports from `ingest.py`, so it needs T004–T005);
  - T009 needs T003, T006 and T008;
  - T010 needs T007 and T009;
  - T011 needs T007;
  - T012 is in parallel;
  - T013 → T014 → T015 (T014 needs T010 and T012);
  - T016 needs T013;
  - T017 needs T016;
  - T018 is in parallel.

### User Story Dependencies

- **US1 (T019–T023)**: needs Phase 2.
- **US2 (T024–T027)**: needs Phase 2.
- **US3 (T028–T031)**: needs Phase 2.
- **Shared files across US1–US3**:
  - `word-detail.tsx`: T019 → T024 → T028;
  - `greek-text.tsx`: T020 → T021 → T025 → T029;
  - `word-detail.stories.tsx`: T022 → T026 → T030;
  - `seed.test.ts`: T023 → T027 → T031.
- **US4 (T032–T033)**: spec text only; can run any time after Setup.
- **US5 (T034–T035)**: needs T007 and T010 (attribution regenerated).

### Parallel Opportunities

- T002, T003 and T012 alongside the `ingest.py` sequence. T018 at any point in Phase 2.
- After Phase 2: T032, T033 and T034 alongside the US1 component work.
- T036–T040 together in Polish.

## Parallel Example: after Phase 2

```text
Task: "T019 Lexicon section in src/components/reading/word-detail.tsx"
Task: "T032 Update specs 007 FR-041 and 008 FR-015"
Task: "T033 Update specs/010-learning-mode/data-model.md lean payload"
Task: "T034 Update src/components/credits/committed-attribution.test.ts"
```

## Implementation Strategy

### MVP (User Story 1)

1. Phase 1, including the Dodson licence record.
2. Phase 2: corpus regenerated with Strong's numbers, lexicon and correspondence; store and payload carry them.
3. Phase 3: the Lexicon section and the half-screen phone sheet.
4. Stop and check in the browser.

### Then

- US2 adds the count.
- US3 makes the word's own number visible next to the entry's.
- US4 binds the editors and Learning mode.
- US5 completes the credits.
- Polish brings every doc in line.

Commit after each phase, only when the user asks.

## Notes

- Never commit the downloaded MACULA or Dodson files. They stay in the temp directory.
- If T010 shows any word id change, stop: saved work depends on the ids (FR-022).
- No sense marking, syntactic role, semantic domain, Louw–Nida or MARBLE/SDBG data may enter the corpus or the panel (FR-009, FR-020).
- The correspondence follows Dodson's own filing. A row that departs from it needs a note saying why.
