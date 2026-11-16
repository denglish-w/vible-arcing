# Implementation Plan: Full New Testament Text

**Branch**: `009-full-new-testament-text` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/009-full-new-testament-text/spec.md`

## Summary

Make all 260 chapters of the SBL Greek New Testament readable by converting all 27 MACULA `SBLGNT/lowfat` book files, at the commit Philippians 1 already came from, into the existing corpus format v1, committing the output, and letting the existing seed load it. Probing showed that the current extractor's per-chapter logic handles every chapter unchanged (137,741 words, zero errors, Philippians 1 byte-identical) and that the existing seed and reader need no code change (full build 3.6 s, longest chapter read in 6 ms). The work is therefore: generalise the extractor from one chapter to the whole New Testament with all-or-nothing output, add a pinned download step, commit the output, make the tests and QA script fit a full corpus, fix the now-wrong "only Philippians 1" copy, and update the docs that describe Philippians 1 as the only chapter.

## Technical Context

**Language/Version**: Python 3 standard library only, run with `python3 -I` (ingest); TypeScript on Node 26 (seed, app, tests); POSIX `sh` + `curl` (download step).

**Primary Dependencies**: None new. Existing: `xml.etree` (ingest), zod corpus parser `src/lib/corpus/format.ts`, `better-sqlite3` + Drizzle (seed), Next.js App Router (reader).

**Storage**: Committed ingest output under `corpus/v1/<BOOK>/<chapter>.json` (format v1, unchanged); built into `data/corpus.sqlite` by `npm run db:seed`; the Docker entrypoint rebuilds it when the ingest hash changes.

**Testing**: Vitest `unit` project (seed and corpus tests), Storybook project (unchanged stories), `scripts/qa/reader.cjs` against the served app, ingest re-run determinism check.

**Target Platform**: Local Node server on macOS (arm64) and the Linux amd64 Docker image used by CI.

**Project Type**: Web application (single Next.js project) plus an offline ingest script.

**Performance Goals**: Any chapter, including Matthew 26 (1,240 words), opens as fast as Philippians 1 today (store read measured at 6.4 ms; SC-003 budget under 1 s end to end). Full corpus build stays a few seconds (measured 3.6 s).

**Constraints**: No network at runtime; ingest uses only the pinned MACULA commit `8423afe47b9e8f24b7772e808af45c7159a6fe7e`; Philippians 1 word identifiers unchanged; no syntax-tree, clause, role or conjunction data; Louw-Nida/UBS attributes never reach output (enforced twice: extractor whitelist and strict zod parser).

**Scale/Scope**: 27 books, 260 chapters, 137,741 words; 36 MB of pretty-printed JSON (about 3 MB compressed, roughly what git stores); 22 MB corpus store; 109 MB of source XML downloaded outside the repo and never committed.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. The user interprets | Only per-word facts are kept (text, punctuation, verse, lemma, gloss, part of speech, morphology). Syntax trees, clause boundaries, role labels and conjunction nodes are dropped (spec FR-011). No UI shows anything new. | Pass |
| II. One passage, many views | Unaffected; more passages become available to every view. | Pass |
| III. MACULA word ids | Ids come from MACULA; Philippians 1 ids verified unchanged, so saved work survives. | Pass |
| IV. Faithful to sources | Text is SBLGNT as MACULA gives it, unmodified; credits unchanged. | Pass |
| V. Work is kept | Saved work lives in `app.sqlite`, untouched by a corpus rebuild; its word references still resolve. | Pass |
| VI. Accessible, SPA-fast | No new UI. The unavailable-state copy changes wording only. Long chapters measured fast at the store; QA checks the longest chapter in the browser. | Pass |
| VII. Local only | No change to binding or Host checks. | Pass |
| Licensing | UBS `@ln`/`@domain` stripped at ingest and rejected by the strict parser; SBLGNT/MACULA/Berean attribution unchanged; no Westminster data. | Pass |
| Workflow | Spec Kit spec here; OpenSpec text, `lat.md/` and `CLAUDE.md` project state updated in the same change (see Documentation updates). | Pass |

No violations. **Post-design re-check**: the design adds no UI, no data beyond per-word facts and no new dependency. Still passes.

## Project Structure

### Documentation (this feature)

```text
specs/009-full-new-testament-text/
├── plan.md              # This file
├── research.md          # Phase 0: decisions and measurements
├── data-model.md        # Phase 1: chapter file, word, store rows
├── quickstart.md        # Phase 1: how to regenerate and verify
├── contracts/
│   └── ingest-cli.md    # Phase 1: download + ingest command contract and output layout
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
scripts/ingest/
├── ingest.py            # renamed from sample_chapter.py (git mv) and generalised to all 27 books
├── fetch.sh             # NEW: downloads the 27 lowfat files at the pinned commit into a given directory
└── README.md            # rewritten for the full ingest

corpus/v1/
├── attribution.json     # unchanged
└── <BOOK>/<n>.json      # 260 files (PHP/1.json byte-identical to today)

src/
├── components/reading/chapter-status.tsx   # unavailable copy no longer says "only Philippians 1"
└── db/seed.test.ts                          # behaviour tests seed a small fixture; new committed-corpus checks

scripts/qa/reader.cjs    # Matthew 28 now expects text, not the unavailable state
```

**Structure Decision**: Single existing Next.js project. All runtime code paths (seed, store queries, reader pages, Docker entrypoint) already handle any number of chapters and stay as they are; the change is confined to the ingest script, committed data, tests, one component's copy and docs.

### Documentation updates

- `CLAUDE.md` project state: "Philippians 1 is the only ingested chapter" becomes "the whole SBLGNT is ingested".
- `lat.md/corpus.md#Ingest pipeline` and `lat.md/architecture.md#Offline corpus ingest`: new script name, whole NT, all-or-nothing output, fetch step. Run `lat check`.
- `specs/001-corpus-store`, `specs/002-greek-reader`, `specs/006-discourse-analysis-foundation`: remove "only Philippians 1" assumptions; 006 "Not built yet" keeps clause and conjunction data only.
- OpenSpec: any Philippians-only wording in `openspec/specs/text/*`; in `openspec/changes/discourse-analysis-foundation`, mark the text-only ingest as delivered and note that clause and conjunction data are now an open question (spec 009 FR-011).

## Complexity Tracking

No constitution violations; nothing to justify.
