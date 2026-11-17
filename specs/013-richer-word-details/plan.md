# Implementation Plan: Richer Word Details

**Branch**: `study-plans-010-015` (spec dir `013-richer-word-details`) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/013-richer-word-details/spec.md`

## Summary

When a user selects a word, the panel shows three new facts: its Strong's number, the full entry for its lemma from Dodson's public-domain Greek–English lexicon, and how often the lemma occurs in the New Testament.

**Ingest.** The offline ingest:

- keeps MACULA's `@strong` on each word;
- NFC-normalises lemmas, which folds 50 lemmas that the source writes in two Unicode forms;
- reads Dodson's `dodson.xml` at a pinned commit, keeping only key, headword and full definition;
- writes `corpus/v1/lexicon.json`, which resolves every Strong's value in the text to an entry. A value is either a Dodson key (92.9% of words) or a row in a hand-reviewed correspondence of about 74 rows. The ingest fails on any value that is neither, so every mapping is a reviewed decision and never a guess at display time.

**Seed.** The seed:

- loads the lexicon;
- adds an index on `words(lemma)`;
- builds a `lemmas` table of counts from the loaded words, so the counts cannot disagree with the text, and spec 014's stepper agrees by construction.

**Panel.** The Reading-mode chapter payload carries the facts, deduplicated per entry and lemma, so the panel is complete when it opens. Spec 010's lean Learning-mode payload carries none of them. The panel adds two labelled rows and a Lexicon section, and at phone width its sheet is capped at half the screen. Dodson is credited through the existing attribution flow.

**Before shipping.** Dodson's public-domain status, confirmed in the copyright holder's own release note, must be recorded in `docs/reference/data-sources.md` first.

## Technical Context

**Language/Version**: Python 3 standard library only, run with `python3 -I` (ingest and proposal helper); TypeScript on Node 26 (seed, app, tests); POSIX `sh` + `curl` (fetch).

**Primary Dependencies**: None new. Existing: `xml.etree` and `unicodedata` (ingest), zod corpus parser `src/lib/corpus/format.ts`, Drizzle + `better-sqlite3` (seed, store), Next.js 16 App Router, Radix Popover (`src/components/ui/popover.tsx`).

**Storage**:

- **Committed corpus**: `corpus/v1/*/*.json` gains `strong` and NFC lemmas, and `corpus/v1/lexicon.json` is new.
- **Ingest input**: the reviewed `scripts/ingest/strongs-correspondence.json`.
- **Store**: `data/corpus.sqlite` gains `words.strong`, `words_lemma_idx`, `lexicon_entries`, `strong_numbers` and `lemmas`, through corpus migration `0001`. `app.sqlite` is untouched.

**Testing**:

- Vitest `unit` project: format parser, seed, `scripts/ingest/ingest.test.ts` on synthetic XML plus a synthetic lexicon, and `word-facts` helpers.
- Storybook project: new `WordDetail` stories run with axe.
- `scripts/qa/reader.cjs` and an ingest re-run determinism check.

**Target Platform**: Local Node server (macOS arm64), and the Linux amd64 Docker image in CI.

**Project Type**: Web application (one Next.js project) plus the offline ingest.

**Performance Goals**:

- The panel is complete on open with no request (SC-005).
- Chapter store read stays within a few ms of today's: lemma join measured at 7 ms for Matthew 26 with the index, 152 ms without.
- Seed time grows by under 1 s.

**Constraints**:

- No network at runtime.
- Pinned sources: MACULA `8423afe…` and Dodson `74f7035…`, both sha256-checked.
- No sense selection, role, domain or UBS/Louw–Nida data.
- Word ids unchanged.
- An older store must degrade silently (FR-021).

**Scale/Scope**:

- 137,741 words and 5,468 lemmas (after NFC).
- 5,440 distinct Strong's values, of which 75 are not Dodson keys (including 3 compounds and `0`).
- 5,410 lexicon entries, about 255k characters of definitions.
- About 50 words expected without an entry (~0.04%).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* Checked against constitution v1.1.0 (amended 2026-11-16; on this branch the amendment is in the working tree and not yet committed).

| Principle | Check | Result |
|---|---|---|
| I. The user interprets | Shows only lexeme facts that v1.1.0 permits: Strong's number, the whole entry for the lemma, NT frequency. No sense is marked as applying here, and there is no role, domain or UBS data (FR-009). The correspondence is reviewed data fixed before display, never chosen per context. | Pass |
| II. One passage, many views | One `WordDetail` component with one prop contract, which the editors must reuse (FR-017, [contracts/word-details.md](contracts/word-details.md)). | Pass |
| III. One model / MACULA ids | No analysis-model change. Word ids are untouched, and lemma NFC normalisation changes no id. | Pass |
| IV. Faithful to sources | Dodson and MACULA data used as given, apart from documented normalisation. The prototype's crosswalk is not copied; the correspondence is our own reviewed work. Panel wording is our own. | Pass |
| V. Work is kept | Nothing in `app.sqlite` refers to lemmas or Strong's numbers; a re-seed leaves saved work valid (FR-022). | Pass |
| VI. Accessible, SPA-fast | Labelled rows, `lang` marking, keyboard scrolling, axe in three themes, phone sheet capped at 50dvh so the word stays visible. Facts ship with the page, with no loading step. | Pass |
| VII. Local only | No change to binding, Host checks or accounts. | Pass |
| Licensing | Dodson ships only after its public-domain status is recorded in `data-sources.md` (task 1). It is credited through ingest metadata. `@ln`/`@domain` stay stripped, and MARBLE/SDBG is not used. | Pass, gated on task 1 |
| Workflow | Planned in Spec Kit, as spec 009 was. The matching OpenSpec specs are updated in the implementing change so the two do not disagree, and no OpenSpec change folder is created. `lat.md/` is updated with the code. | Pass |

No violations before research.

**Post-design re-check**:

- The design adds no interpretive data. The only displayed values are per lexeme or per word-number.
- The new store tables are derived or reviewed data.
- The phone sheet change makes accessibility better, not worse.

It still passes. The open item is the licence record, which is sequenced first.

## Project Structure

### Documentation (this feature)

```text
specs/013-richer-word-details/
├── plan.md              # This file
├── research.md          # Phase 0: R1–R10 decisions and measurements
├── data-model.md        # Phase 1: corpus files, correspondence, store, payload
├── quickstart.md        # Phase 1: regenerate and verify
├── contracts/
│   ├── ingest-lexicon.md   # fetch, proposal helper, ingest, seed
│   └── word-details.md     # panel props, order, labels, states
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
scripts/ingest/
├── fetch.sh                      # + dodson.xml at pinned commit
├── SHA256SUMS                    # + dodson.xml
├── ingest.py                     # + strong, NFC lemma, lexicon.json, Dodson attribution
├── propose_correspondence.py     # NEW: read-only proposals for review
├── strongs-correspondence.json   # NEW: reviewed rows (hand-written)
├── ingest.test.ts                # + strong/lexicon/correspondence cases
└── README.md                     # + lexicon and review steps

corpus/v1/
├── attribution.json              # + Dodson
├── lexicon.json                  # NEW
└── <BOOK>/<n>.json               # + strong, NFC lemma

src/
├── lib/corpus/format.ts          # parser: strong, lexicon file
├── lib/corpus/word-facts.ts      # NEW: strongLabel, occurrencesLabel, entryIsElsewhere
├── db/schema/corpus.ts           # new tables, column, index
├── db/seed.ts                    # load lexicon, build lemmas, SEED_VERSION 2, hash inputs
├── db/corpus.ts                  # getChapter joins; feature presence check (FR-021)
├── app/read/[book]/[chapter]/page.tsx   # payload mapping
├── components/reading/word-detail.tsx   # new rows and Lexicon section
├── components/reading/greek-text.tsx    # pass entry/count; scroll word into view on phone
├── components/reading/word-detail.stories.tsx  # entry, elsewhere, none, compound, no-number, old-store, longest-definition (mobile)
└── app/globals.css               # phone sheet 50dvh

drizzle/corpus/0001_*.sql         # generated
docs/reference/data-sources.md    # Dodson entry (task 1, ships first)
```

**Structure Decision**: The existing single Next.js project plus the offline ingest. The change follows the existing data flow: ingest, then committed JSON, then seed, then store, then server page payload, then client panel. No new runtime path, dependency or request is added.

### Documentation updates (same change as the code)

- `docs/reference/data-sources.md`: Dodson entry with verdict, links and attribution wording. This ships first (FR-019).
- `PRODUCT.md`: done during planning (2026-11-16). The "No interpretation" bullet now permits lexeme facts, matching constitution v1.1.0.
- `CLAUDE.md` project state: word details include Strong's number, Dodson entry and NT count.
- `lat.md/corpus.md`: Ingest pipeline, Licence rules, Attribution, and a new Lexicon section.
- `lat.md/reader.md`: Words and display.
- Run `lat check`.
- `specs/007-arcing-editor` FR-041 and `specs/008-sentence-diagramming` FR-015: name the new facts (FR-017).
- `specs/001-corpus-store`: corpus contents gain Strong's numbers, lexicon and counts.
- Spec 014's plan: lemmas are NFC, and the total comes from `lemmas`.
- OpenSpec: no change folder. In the implementing change, update `openspec/specs/text/greek-reader/spec.md` (word details) and the corpus-store spec under `openspec/specs/text/` (Strong's numbers, lexicon, counts) to match this spec, as spec 009 did.
- Constitution follow-up, separate from this change: a PATCH that removes "Dodson MUST NOT ship" once the licence record is merged.

## Complexity Tracking

No constitution violations; nothing to justify.
