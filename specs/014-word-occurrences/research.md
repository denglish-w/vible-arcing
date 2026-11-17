# Research: Step Through Occurrences

Phase 0 for [plan.md](plan.md). Every Technical Context unknown is resolved below. Figures were measured on 2026-11-16 against a copy of the installed `data/corpus.sqlite` (137,741 words, 5,518 distinct lemmas) with the sqlite3 CLI on the arm64 dev machine.

## R1. Canonical order in the corpus store

**Decision**: Add one column, `words.canon_seq`, holding each word's 1-based position in the whole New Testament (Matthew 1:1 first). The seed assigns it while loading books in `BOOKS` order. Add an index `words_lemma_canon` on `(lemma, canon_seq)` and a unique index on `canon_seq`.

**Rationale**: `words.seq` is book-wide, and book codes do not sort canonically, so canonical order today needs a join to `books.seq`. That join cannot use an index range for "occurrences of this lemma before here". With `(lemma, canon_seq)`, each question is one index range: a count, a `MIN` or a `MAX`. The value is a deterministic function of the ingested text, so rebuilding from the same pinned source gives the same values. It is an ordering key, not a stored occurrence position: positions and totals are still counted from the installed rows on every request (spec Key Entities: "derived from the installed text, never stored").

**Alternatives considered**:
- *Join `books.seq` at query time with an index on `(lemma, book, seq)`*: still a schema change (a new index), and the count becomes 27 per-book index seeks plus a merge. More code for the same migration.
- *Precompute each word's occurrence ordinal and lemma total at seed*: O(1) reads, but it stores the position the spec says is derived, and keeps a second copy of two numbers that must agree.
- *Compute in the browser from a shipped lemma index*: violates "nothing loads corpus data in the browser" (CLAUDE.md project state) and means megabytes of payload.

## R2. Query cost

**Decision**: For each chapter request, run one grouped query that returns, for every distinct lemma in the chapter, the count of occurrences before the chapter, the total, and the previous and next occurrence outside the chapter (id, book, chapter, verse). Positions inside the chapter are the "before" count plus the word's index among that lemma's words in the chapter, worked out on the client from the chapter's own word list.

**Rationale**: Measured with the index from R1:

| Query | Time |
| --- | --- |
| One word's position and total (σάρξ, Romans 8:3) | 0.13 ms |
| Whole-chapter summary, Romans 8 (193 lemmas, including ὁ at 19,795) | 3.8 ms |
| Building the column and index on a copy | ~0.3 s (seed only) |

The result for Romans 8:3 is "36 of 147", matching the spec. Cost depends on the number of lemmas in the chapter, not on how frequent they are, so ὁ is as fast as a hapax (SC-003). Same-chapter steps need no request at all (SC-002, 0.1 s).

**Alternatives considered**: A route handler or server action per step: an extra round trip on every step, including same-chapter ones, which would put SC-002's 0.1 s at risk for no gain. Shipping a full list of every occurrence for each lemma in the chapter: tens of thousands of ids for ὁ.

## R3. The address

**Decision**: `/read/<book>/<chapter>?w=<MACULA word id>`. The page reads `searchParams.w` on the server. If the id belongs to the chapter, the reader opens with that word marked and scrolled into view. Its popover, with the stepper, is one activation away. Opening an address does **not** open the popover or move focus: on page load, focus stays where the browser puts it, so the skip link and heading come first (WCAG 2.4.3). Only a *step* opens the popover and moves focus (R8). If the id does not belong to the chapter, it shows the chapter unmarked with a short notice. The id is checked against the chapter's word list only, never sent to SQL, and anything longer than 32 characters or outside `[A-Za-z0-9_-]` counts as not found.

**Rationale**: A query parameter reaches the server, so the not-found notice and the initial mark render in the first paint without a flash. Word ids are MACULA `xml:id`s (`n45008003011`), which are stable across rebuilds from the same source (FR-012, SC-007). A hash fragment (`#n45008003011`) would scroll natively but never reaches the server, and the browser's own jump would fight the reader's scroll and reduced-motion handling.

**Alternatives considered**: A path segment (`/read/rom/8/n45008003011`): a new route for an optional modifier, and it would make the chapter page's own canonical path ambiguous. Positional addresses (`?occurrence=36`): forbidden by FR-012 and Constitution III.

## R4. History: one Back returns to where stepping began

**Decision**: A *stepping run* starts with the first step from a word that was not itself reached by stepping. On that first step:

1. `history.replaceState` rewrites the current entry to the starting chapter with `?w=<starting word>`, so Back lands on the starting word and marks it.
2. The step adds one entry: `history.pushState` for a same-chapter target, `router.push(url, { scroll: false })` for another chapter.

Every later step in the run replaces that entry: `history.replaceState` within a chapter, `router.replace(url, { scroll: false })` across chapters. Next.js 16.4.6 integrates native `pushState`/`replaceState` with the App Router (`node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`, "Native History API").

**Rationale**: Replacing on every step, including the first, would make Back skip past the starting chapter. Pushing on every step would make Back walk through possibly thousands of steps. Push-once-then-replace meets FR-014 and SC-008. Ordinary chapter links keep their current push behaviour (spec Assumptions).

**Alternatives considered**: Storing the run in `history.state`: Next owns that object for its router and the docs do not promise that custom keys survive.

## R5. Run state across chapter changes, and stale steps

**Decision**: A small client store, `src/lib/occurrences/stepper-store.ts` (Zustand, already a dependency), holds the active run: starting word, current target id, a monotonically increasing step token, and a count of steps requested but not yet applied. It lives in module scope, so it survives the page segment re-mounting on a soft navigation. A client component in a new `src/app/read/layout.tsx` holds the live region. That layout persists across `/read/*` navigations, so the announcer is not re-mounted mid-run.

- **The address is the source of truth for the mark.** `GreekText` reads `w` with `useSearchParams()`, which Next updates for native `pushState`/`replaceState` and for Back/Forward (popstate). The server-sent `focusWordId` only seeds the first render. Without this, Back after an in-chapter run would change the address but not the screen: the page does not re-render from the server, and `GreekText` (keyed by book and chapter) does not re-mount.
- Every change of `w` is compared with the store's `targetId`:
  - **It equals `targetId`** (the stepper's own write, or a cross-chapter arrival): the run continues. Mark, scroll, open the popover, focus the stepper and announce.
  - **It does not** (Back or Forward within or across chapters, a chapter link, the contents page): the run ends. Pending steps are dropped, nothing is applied, the popover closes, and the mark follows the new `w`, or clears if there is none (FR-016, SC-008).
- Steps requested while a cross-chapter navigation is pending are counted, not sent. On arrival the remaining count is applied from the arrived word, client-side if the targets are in that chapter, or by one more navigation if not. The reader therefore ends on the occurrence matching the total steps (FR-017). Only the final arrival is announced, guarded by the token (SC-005).

**Rationale**: Avoids a step API (R2) while still guaranteeing the end state. Frequent lemmas rarely cross chapters in a single step, so chained navigations are uncommon. Rare lemmas cross on most steps, but each crossing is one ~3.8 ms query plus render.

**Alternatives considered**: `useTransition` around `router.replace` with cancellation: cancellation of in-flight RSC navigations is not a documented guarantee, so the token guard is needed regardless. Holding the run in React context: lost when the page segment re-mounts.

## R6. No blank screen across chapters

**Decision**: Use soft navigations (`router.push`/`router.replace`) and add no `loading.tsx` under `src/app/read/`. The App Router keeps the current page on screen until the next segment's RSC payload is ready.

**Rationale**: Meets FR-021 with no extra code. Adding a `loading.tsx` later would break this, so the contract records the constraint.

## R7. Keyboard shortcuts

**Decision**: `]` steps to the next occurrence and `[` to the previous one, handled by a `keydown` listener on the word popover's content element only. Both keys are ignored when a modifier (Ctrl, Alt or Meta) is held, when `event.isComposing` is true, or when the event target is an `input`, `textarea`, `select` or `[contenteditable]`. The controls carry `aria-keyshortcuts` and show the key in their tooltip and accessible description.

**Rationale**:
- Scoping the listener to the popover means the keys do nothing while the user types elsewhere (FR-018, US2 scenario 5) and in Learning mode, where no stepper is rendered (FR-024).
- Nothing in `src/` binds global keys today, so there is no clash inside the app.
- `[` and `]` are not browser shortcuts.
- Alt+Arrow is browser Back/Forward, and arrows move the text caret and are used by screen readers.
- Single letters (j/k, n/p) are quick-navigation keys in NVDA's and JAWS's browse mode.

**Alternatives considered**: Arrow keys inside the popover: they conflict with Radix focus behaviour and screen-reader reading keys. Page Up/Down: they scroll the page.

## R8. Focus, unavailable controls and announcements

**Decision**:
- The previous/next controls are `<button>`s that use `aria-disabled="true"`, not the `disabled` attribute, at the ends. They stay focusable and are announced as unavailable (FR-009). Activating one does nothing.
- After a step (never on page load from an address, R3), the stepped-to word's popover opens with `onOpenAutoFocus` sending focus to the control the user activated (or the matching control for a shortcut). Focus stays there even when that control has just become unavailable at the end, so the screen reader says why the user stopped.
- One polite live region in `src/app/read/layout.tsx` receives "Occurrence 37 of 147, Romans 8:4" once per completed step. The visible position text in the popover is not live, so it is not read twice.
- When a lemma occurs once, the popover shows "Only occurrence in the New Testament (1 of 1)" and no step buttons (FR-010).

- The `[`/`]` choice is checked by hand with VoiceOver, and with NVDA in browse mode where available, before release (quickstart scenario 4). If either reader intercepts a key, choose another pair that is not a quick-navigation key and update this decision.

**Rationale**: `disabled` buttons drop out of the tab order and lose focus, which strands keyboard users at the ends. A layout-level live region survives the page remount on cross-chapter steps (FR-019, US2 scenario 2).

## R9. The current-occurrence mark

**Decision**: `data-current-occurrence` on the word button, styled with the `--rose-highlight` token fill (DESIGN.md: "A word under study gets the rose highlight") **plus** a 2px solid outline in `--primary` (rubric red) with 1px offset. Two cues: a tint, and a shape that survives greyscale (FR-007, SC-006). The outline is distinct from part-of-speech underlines, which are below the baseline and never a full outline, and from the plain open state (`--card` fill, red text). `prefers-reduced-motion` selects `scrollIntoView({ block: "center", behavior: "auto" })` over `"smooth"` (FR-022). The existing global reduced-motion rule already removes CSS transitions.

The unavailable stepper control is styled with `.button[aria-disabled="true"]`, matching the existing `.button:disabled` rule. The existing rule does not match `aria-disabled`.

**Rationale**: Uses existing light, dark and sepia tokens, so no new colour is introduced. Rubric red marks state, which the Rubric Rule permits. Contrast is checked by the Storybook axe run in all three themes.

## R10. Learning mode and the 013 count

**Decision**:
- Occurrence data is computed only by the Reading-mode page path, and the stepper renders only when that data is present. 010's Learning-mode payload ("Lean chapter", 010 data-model) never includes it, so no stepper, position, total or shortcut exists there (FR-024, SC-009). Whichever of 010 or 014 lands second wires the mode check, and the contract states it.
- Both features derive the total from the same `words.lemma` rows, so FR-023's "equal totals" holds by construction. 013's plan (its R5, R6) builds a `lemmas(lemma, occurrences)` table at seed and NFC-normalises lemmas. 014 does not depend on it. The choice is made **by merge order in code, never by detecting at runtime** whether the table exists:
  - **014 merges before 013**: `total` is `count(*)` over the `(lemma, canon_seq)` index.
  - **014 merges after 013**: `chapterOccurrences` joins `lemmas` for `total`, and a unit test asserts it equals `count(*)` for every lemma. If 013 merges second, its implementer makes that switch.
- Whichever lands second drops the redundant index: 013's plain `words(lemma)` index is a prefix of `words_lemma_canon`.
- When 013 lands, its count sits beside the stepper's position text, and its "count as a control" (013 FR-008) moves focus to the stepper's next control.
- Quickstart figures (σάρξ 147, ὁ 19,795 and so on) are re-checked after 013's NFC change. None of them involves an oxia/tonos pair, so none is expected to move.

**Rationale**: One definition of "occurrence" (stored lemma equality over installed words) and a test that pins the two counts together, without making either feature wait for the other.

## R11. A store built before this change

**Decision**: The new corpus migration changes `ingestHash` (it hashes the migrations folder), so `scripts/seed-if-stale.ts` (Docker) rebuilds automatically, and `npm run db:seed` rebuilds locally. If the reader meets a store without `canon_seq`, `chapterOccurrences` catches SQLite's "no such column" error and returns `null`. The reader then shows word details without the stepper rather than failing. Chapters missing from an older store are simply absent from the counts (FR-015).

**Rationale**: The reader must not break between pulling the change and reseeding. Other corpus errors still propagate.

## R12. Specs to update alongside

**Decision**: No OpenSpec change folder. Since 2026-11-16, features are planned with Spec Kit (CLAUDE.md, Workflow), and the implementing change edits the main OpenSpec specs directly, so the two agree:
- `openspec/specs/text/corpus-store/spec.md`: the canonical-order column and the occurrence summary under "Book, chapter and word retrieval".
- `openspec/specs/text/greek-reader/spec.md`: stepping, the address and the mark under "Word detail", plus a new "Occurrence stepping" requirement.

`lat.md/reader.md` and `lat.md/corpus.md` are updated when the behaviour is implemented, not now. OpenSpec wins over Spec Kit where they differ (constitution, Workflow).
