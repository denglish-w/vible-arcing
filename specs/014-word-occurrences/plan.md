# Implementation Plan: Step Through Occurrences

**Branch**: `014-word-occurrences` (feature identifier; planned on the shared branch `study-plans-010-015` with 010, 011, 012 and 015) | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-word-occurrences/spec.md`.

## Summary

Let readers step from a selected word to the previous or next use of its lemma across the whole New Testament, from the word popover.

- **Store**: the corpus store gains one ordering column, `words.canon_seq`, and an index on `(lemma, canon_seq)`.
- **Page data**: each chapter request carries a small per-lemma summary (count before the chapter, total, and the nearest occurrence on either side), measured at 3.8 ms for Romans 8.
- **Stepping**: steps inside a chapter are pure client work. Steps across chapters are soft navigations to `/read/<book>/<chapter>?w=<MACULA id>`, so addresses are stable and bookmarkable.
- **History**: one Back returns to where stepping began, because the first step pushes once and later steps replace.

There is no new dependency, route handler, server action or saved-work change.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16.4.6 App Router; Node 26.13.1 (`.node-version`).

**Primary Dependencies**: Existing only: Drizzle ORM + better-sqlite3 (corpus reads), Radix Popover (`src/components/ui/popover.tsx`), Zustand 5 (run state), lucide-react icons.

**Storage**: Read-only `data/corpus.sqlite`, with one new column and two indexes through a generated Drizzle corpus migration, rebuilt by `db:seed`. `data/app.sqlite` is untouched.

**Testing**: Vitest unit tests against an in-memory seeded store (`src/db/testing.ts`) and pure position functions. Storybook play functions with axe in Chromium for the stepper, keys, focus and mark in three themes. Real-server QA script for history, cross-chapter navigation, timing and addresses.

**Target Platform**: Local Node server on `127.0.0.1`. Desktop browsers and touch tablets, keyboard and screen readers, light/dark/sepia.

**Project Type**: The existing single Next.js web application.

**Performance Goals**:
- Same-chapter step ≤ 100 ms; cross-chapter step ≤ 1 s (SC-002).
- Chapter occurrence summary ≤ 10 ms whatever the lemma frequency (SC-003; measured 3.8 ms).

**Constraints**:
- Lemma string equality only (Constitution I).
- MACULA ids in addresses (Constitution III).
- Two-cue mark (Constitution VI).
- No corpus data shipped to the browser beyond the current chapter and its per-lemma summary.
- No `loading.tsx` under `/read`.
- Host checks unchanged (Constitution VII).

**Scale/Scope**:
- 137,741 words and 5,518 lemmas; the largest lemma is ὁ at 19,795.
- About 200 lemma summaries per chapter payload.
- All four user stories and FR-001 to FR-026. A concordance list (FR-026) and editor integration are out of scope.

No NEEDS CLARIFICATION remains. Research decisions are R1–R12 in [research.md](research.md).

## Constitution Check

Checked against constitution 1.1.0 before research and again after Phase 1 design. Both pass.

| Gate | Before research | After design (evidence) |
| --- | --- | --- |
| I. User interprets | Pass: stepping follows the source's lemma only | Matching is `lemma = ?` with no sense, domain, gloss or role (contracts/occurrence-data.md guarantees 1 and 6). The occurrence count is an explicitly allowed lexeme fact. Nothing is ranked or filtered. |
| II. One passage, many views | Pass: a stepped-to word becomes the selection | The mark renders the shared selection (FR-011). Editors follow the selection when they exist; whether they offer stepping is their own feature's decision. |
| III. One model / word ids | Pass: no analysis model touched | Addresses use MACULA ids (R3). `canon_seq` is an ordering key and never an identity, and is not exposed. |
| IV. Method and sources | Pass | The stepper is designed from DESIGN.md. The prototype is a reference only, and no Biblearc material is used. |
| V. Work is kept | Pass: nothing saved | No saved-work change. Cross-chapter steps are ordinary soft navigations, so future autosave rules apply unchanged. |
| VI. Accessible on every device | Pass: required by US2 | `aria-disabled` ends, focus kept on the stepper, a layout-level live region, `[`/`]` keys scoped to the popover, ≥ 24 px targets, rose fill plus red outline, reduced-motion scroll (R7–R9). SPA-fast: same-chapter steps make no request. |
| VII. Local until accounts | Pass | No new endpoint. The page keeps the existing Host check. |
| Licensing and data | Pass: no new dataset | Derived only from SBLGNT/MACULA fields already shipped. UBS attributes stay stripped and unused. |
| Workflow | Pass | The implementing change updates `openspec/specs/text/corpus-store/spec.md` and `openspec/specs/text/greek-reader/spec.md` directly, with no change folder (R12, CLAUDE.md), plus `lat.md/reader.md` and `lat.md/corpus.md` at implementation. CI's migration check requires the generated corpus migration to be committed. |

## Project Structure

### Documentation (this feature)

```text
specs/014-word-occurrences/
├── spec.md
├── plan.md                      # this file
├── research.md                  # Phase 0
├── data-model.md                # Phase 1
├── quickstart.md                # Phase 1
├── contracts/
│   ├── occurrence-data.md       # server read model and page request
│   └── reader-stepping.md       # UI, keyboard, focus, history
├── checklists/requirements.md
└── tasks.md                     # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
src/db/schema/corpus.ts                    # + canon_seq column, words_lemma_canon, words_canon_seq
src/db/seed.ts                             # assign canon_seq across books in BOOKS order
src/db/seed.test.ts                        # + canon_seq dense, unique, deterministic
src/db/occurrences.ts                      # NEW chapterOccurrences (script-safe, injected db)
src/db/occurrences.test.ts                 # NEW figures from quickstart (σάρξ, ὁ, κἀγώ, hapax, stale store)
drizzle/corpus/0001_*.sql (+ meta)         # generated by npm run db:generate
src/lib/occurrences/types.ts               # NEW the one LemmaOccurrences/OccurrenceRef definition (script-safe, types only)
src/lib/occurrences/position.ts            # NEW pure: position, previous/next target, kind
src/lib/occurrences/position.test.ts       # NEW
src/lib/occurrences/stepper-store.ts       # NEW Zustand run state: origin, target, token, pending
src/lib/occurrences/stepper-store.test.ts  # NEW state transitions incl. rapid steps and run end
src/app/read/layout.tsx                    # NEW persists across chapters; hosts the live region
src/app/read/[book]/[chapter]/page.tsx     # read ?w=, call chapterOccurrences, pass new props
src/components/reading/reader.tsx          # ReaderContent "ok" gains occurrences/focusWordId/wordNotFound; not-found notice
src/components/reading/greek-text.tsx      # controlled selection, mark, scroll, popover focus, history ops
src/components/reading/word-detail.tsx     # render OccurrenceStepper when data present
src/components/reading/occurrence-stepper.tsx          # NEW
src/components/reading/occurrence-stepper.stories.tsx  # NEW
src/components/reading/occurrence-announcer.tsx        # NEW polite live region (client)
src/components/reading/greek-text.stories.tsx          # + stepping, mark, Escape stories
src/app/globals.css                        # .word[data-current-occurrence], stepper layout
scripts/qa/occurrences.cjs                 # NEW real-server scenarios from quickstart
openspec/specs/text/{corpus-store,greek-reader}/spec.md  # updated in place
lat.md/reader.md, lat.md/corpus.md         # updated with the implementation
```

**Structure Decision**: Keep the single Next.js tree.
- Data access goes in `src/db/` behind the existing injected-connection pattern, so it is testable and script-safe.
- Pure stepping logic goes in `src/lib/occurrences/`, with no React and no database.
- UI goes beside the existing reader components, with colocated stories.
- A new `src/app/read/layout.tsx` is the one structural addition. It gives the announcer and the run state a home that survives chapter changes.

## Phase 0: Research

[research.md](research.md) settles canonical ordering (R1), query cost with measurements (R2), the address (R3), history (R4), run state and stale steps (R5), the no-blank-screen rule (R6), shortcuts (R7), focus and announcements (R8), the mark (R9), Learning mode and the 013 count (R10), stale stores (R11) and companion spec updates (R12).

## Phase 1: Design and Contracts

- [data-model.md](data-model.md): the corpus column, the server read model, the derived client position, the run state machine and the new page props.
- [contracts/occurrence-data.md](contracts/occurrence-data.md): the guarantees of `chapterOccurrences` and the reading page's `?w=` behaviour.
- [contracts/reader-stepping.md](contracts/reader-stepping.md): what users, assistive technology and the browser history observe.
- [quickstart.md](quickstart.md): the acceptance checks, with concrete word ids.

## Delivery Order

1. **Corpus**: `canon_seq` column, indexes, seed assignment, generated migration and seed tests. Verify `db:generate` is clean and Docker reseeds a stale volume.
2. **Read model**: `chapterOccurrences` with the quickstart figures and the stale-store `null` path.
3. **Pure logic**: position and target functions, then the run store, including rapid-step and run-end transitions.
4. **UI**: the stepper and mark in stories (all states, three themes, axe), then wiring in `GreekText`/`WordDetail`: focus, Escape behaviour, keys, scroll.
5. **Navigation**: page `?w=` handling and the not-found notice, the layout and announcer, and history operations. Then the real-server QA script for history, timing, addresses and manual navigation mid-run.
6. **Docs**: OpenSpec change and deltas, Lat updates, `lat check`.

Coordination:
- 013 builds a `lemmas` count table and NFC-normalises lemmas. 014 counts the same rows and uses that table when present, with a test that the two counts agree. Whichever lands second drops 013's redundant `words(lemma)` index (R10).
- Whichever of 010 and 014 merges second adds the Learning-mode exclusion.

## Complexity Tracking

No constitutional violations. One schema addition (`canon_seq`) is justified in R1: without it, canonical-order counting needs a join that cannot use an index range. It is a derived ordering key, so occurrence positions stay computed from installed rows on every request.
