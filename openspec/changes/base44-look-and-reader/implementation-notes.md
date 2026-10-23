# Implementation handoff

Implementation lives on `codex/base44-look-and-reader` in its own worktree. The sample corpus, core modules, themes, contents/credits routes and reader are implemented. Task checkboxes distinguish completed implementation from the remaining full verification pass.

## Evidence

- Production static export generates all 260 reader HTML pages, 27 book pages, corpus JSON and self-hosted font assets.
- Vitest covers navigation, settings validation/storage failure, POS categories, parser/licensing and loader cache/failure recovery.
- Five Python tests and byte-identical regeneration validate the sample extractor. Source pin and checksum are in `scripts/ingest/README.md`.
- One code review and one security review covered the combined implementation. No exploitable security findings. Code findings led to typed loader diagnostics, transient-failure retries, and a pointer/desktop height cap on the word bubble.
- `scripts/qa/reader.cjs` exercises a locally served export. Preview hosting must resolve `/route.html` before the similarly named route-data directories emitted by Next.

## Remaining verification

Task 6.2 stays open until the full scenario walkthrough, including first-paint theme behavior, has been checked. Task 6.5 stays open for the full theme/viewport/accessibility audit and independent visual finish review. Local screenshots are intentionally ignored by Git.

The display menu follows change design decision 8's explicit Popover choice; the broader DESIGN.md describes a drawer. This difference should be reconciled during the visual audit. The Impeccable detector reported only advisory font-ramp mismatches; 18px and 12px uses are supported in DESIGN.md's layout/component prose. The machine-readable design sidecar predates DESIGN.md and was left untouched; the `document` workflow can refresh it when requested.
