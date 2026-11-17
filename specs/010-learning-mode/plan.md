# Implementation Plan: Learning Mode (Parsing Practice)

**Branch**: `010-learning-mode` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/010-learning-mode/spec.md`

## Summary

Add a Learning mode to the reading screen in which the user parses a word (dictionary form, part of speech and only the fields that apply), checks it against MACULA's parsing, and keeps every attempt. The central design choice is that the answer is kept out of the page by construction:

- **Server-decided mode.** The mode lives in a cookie the server reads. A Learning-mode render sends only each word's text and id.
- **Mode switch.** Switching into Learning reloads the document, so the Reading render's payload is discarded.
- **Server-side grading.** Grading runs in a server action that returns the source parsing only in response to a check.
- **Shared rules.** One pure module defines which fields apply, and the form, grader and validator all use it.
- **Saving attempts.** Attempts are an append-only table in `app.sqlite`, saved through an idempotent retrying outbox so a result is never held up by saving.
- **Export and tests.** Export follows the existing analysis export. A QA assertion proves the served Learning page contains no lemma or parsing.

## Technical Context

**Language/Version**: TypeScript on Node 26.13.1 (`.node-version`).

**Primary Dependencies**: None new. Existing: Next.js 16.4.6 App Router (server components, server actions, `cookies()`, `refresh()`), React 19, Radix Popover (`src/components/ui/popover.tsx`), zod 4, Drizzle + `better-sqlite3`, Zustand (display settings, untouched).

**Storage**: New `parse_attempts` table in `app.sqlite` (Drizzle migration via `npm run db:generate`); reads from the existing read-only `corpus.sqlite`; mode in a `vible.mode` cookie.

**Testing**: Vitest `unit` project (pure modules, store, actions); Storybook project (form states, all themes, axe); `scripts/qa/reader.cjs` against the served app (no answer in Learning HTML, keyboard flow); CI's migration-drift check.

**Target Platform**: Local Node server (macOS arm64 dev; Linux amd64 Docker image in CI); browsers on desktop and touch tablets.

**Project Type**: Web application, the existing single Next.js project.

**Performance Goals**: Opening a word's form is instant (no round trip: last-attempt summaries come with the page). A check shows its result after one local round trip, well under the 100 ms that feels immediate. Moving to the next word is instant. Mode switch is one page load.

**Constraints**: No source lemma, gloss, part of speech or morphology in a Learning-mode page before a check (FR-020); no syntactic roles anywhere (the corpus holds none); local-only Host checks on every action and route (constitution VII); WCAG 2.2 AA, keyboard, screen reader and touch; colour never the only cue.

**Scale/Scope**: 137,741 words; Matthew 26 (1,240 words) is the longest chapter; attempts grow by one row per check (a heavy user making 100,000 checks stays small for SQLite with the `(word_id, checked_at)` index).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design. Checked against constitution v1.1.0.*

| Principle | Check | Result |
|---|---|---|
| I. The user interprets | Parsing practice reveals the source's morphology only after the user submits their own answer, which v1.1.0 explicitly allows. No syntactic role exists in the corpus or the UI. The form never pre-selects or orders by likelihood (FR-013). | Pass |
| II. One passage, many views | The selected word survives mode switches (FR-006); Learning is a mode of the reading view, not a separate passage. | Pass |
| III. One analysis model | Untouched. Attempts are their own kind of saved work, keyed by MACULA word id. | Pass |
| IV. Faithful to sources | Source parsing shown is MACULA's as ingested; outcomes are worded as agreeing or differing from the source. Prototype used as reference only, no code or wording reused. | Pass |
| V. Work is kept | Attempts are saved in the background with retry and an unsaved indicator, validated by one shared module (`src/lib/learning/validate.ts`) before storing, stored by word id, never overwritten, kept across re-ingest, and exportable. | Pass |
| VI. Accessible, SPA-fast | Native labelled selects, focus management, live-region outcome, text-plus-symbol agreement marks, bottom sheet on phones, stories with axe in three themes. Word form opens with no round trip. | Pass |
| VII. Local until network accounts | New actions and the export route use the existing Host and same-origin checks. No network exposure. Spec 015 later adds ownership. | Pass |
| Licensing | No new dataset. UBS attributes stay stripped; nothing new is read from MACULA. | Pass |
| Workflow | OpenSpec change, `lat.md/` and `CLAUDE.md` updated with the implementation (see Documentation updates). | Pass |

No violations. **Post-design re-check**: the design (research R1–R11, contracts) adds no dependency, no interpretive data and no network surface, and the cookie carries only the mode. Still passes.

## Project Structure

### Documentation (this feature)

```text
specs/010-learning-mode/
├── plan.md                    # This file
├── research.md                # Phase 0: decisions R1–R11
├── data-model.md              # Phase 1: lists, fieldsFor, grading, attempt table, export file
├── quickstart.md              # Phase 1: how to prove it works
├── contracts/
│   ├── server-actions.md      # setReadingMode, checkParse, recordAttempt, Learning page payload, export route
│   └── ui.md                  # mode control, parsing form, focus and keys
└── tasks.md                   # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
src/
├── lib/learning/
│   ├── fields.ts              # NEW: closed lists, corpus→form part of speech, fieldsFor()
│   ├── grade.ts               # NEW: normaliseLemma(), grade() (pure)
│   ├── translit.ts            # NEW: Latin→Greek (Beta Code letters, final sigma)
│   ├── validate.ts            # NEW: zod schemas for answers and attempts (client + server)
│   ├── outbox.ts              # NEW: append-only retrying sender with beforeunload guard
│   └── *.test.ts              # NEW: unit tests, incl. a corpus-values drift test
├── db/
│   ├── schema/app.ts          # + parse_attempts table
│   ├── attempts.ts            # NEW: insert-or-ignore, latest per word, list for export
│   ├── attempts.test.ts       # NEW
│   └── server.ts              # re-export attempt functions
├── app/
│   ├── read/learning-actions.ts             # NEW: setReadingMode, checkParse, recordAttempt
│   ├── read/[book]/[chapter]/page.tsx       # reads the mode cookie; lean payload + attempt summaries in Learning
│   └── api/attempts/export/route.ts         # NEW: download all attempts
└── components/reading/
    ├── reader.tsx                           # passes mode; hides legend; renders mode control and notice
    ├── greek-text.tsx                       # Learning: word opens the parsing form instead of WordDetail
    ├── display-menu.tsx                     # notes that colouring is paused in Learning mode
    └── learning/
        ├── mode-control.tsx (+ .stories.tsx)
        ├── learning-notice.tsx (+ .stories.tsx)
        └── parsing-form.tsx (+ .stories.tsx)   # empty, prefilled, compared, unsaved, end-of-chapter, discard-confirm

drizzle/app/                      # NEW migration for parse_attempts
scripts/qa/reader.cjs             # + Learning-mode assertions (no answer in HTML; keyboard cycle)
```

**Structure Decision**: The existing single Next.js project. Pure logic goes in `src/lib/learning/` so the form, the grader and the validator share one definition. Storage follows the saved-work pattern (`src/db/*.ts` behind `src/db/server.ts`). UI goes under `src/components/reading/learning/` with stories beside each component, as the project requires.

### Documentation updates

- **OpenSpec**: a change `openspec/changes/learning-mode/` (proposal, design, delta for `text/greek-reader`), because OpenSpec is authoritative and features update both copies.
- **lat.md**: `lat.md/reader.md` gains Learning mode (server-decided mode, lean payload, grading on the server). A saved-work section covers attempts. Run `lat check`.
- **CLAUDE.md**: the project-state paragraph mentions Learning mode and attempts.
- **Spec 002**: note Learning mode as an extension of the reader. Spec 005: list attempts as a kind of saved work not shown on `/work`.

## Complexity Tracking

No constitution violations; nothing to justify.

One deliberate cost is worth recording. Switching into Learning reloads the whole document instead of navigating client-side (research R1). This is the only way to guarantee the Reading render's inline payload is gone. It happens only on an explicit mode switch, and chapter navigation within Learning stays client-side.
