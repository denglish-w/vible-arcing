# Quickstart: validating Step Through Occurrences

Acceptance checks for the implemented feature. These describe what to run and what must be true once the work is built; none of it works before implementation. Shapes and behaviour are defined in [data-model.md](data-model.md), [contracts/occurrence-data.md](contracts/occurrence-data.md) and [contracts/reader-stepping.md](contracts/reader-stepping.md).

## Prerequisites

```sh
fnm use
npm install
npm run db:seed        # required: the change adds words.canon_seq, so older stores are stale
npx playwright install chromium   # first run of the storybook tests only
```

## Automated gates

```sh
npm run lint && npm run typecheck && npm run format:check
npm run db:generate    # must produce no further migration changes once the corpus migration is committed
npx vitest run --project unit src/db/occurrences.test.ts src/lib/occurrences
npx vitest run --project unit src/db/seed.test.ts
npm test               # includes every story in Chromium with axe
lat check
```

What the unit tests must prove:

| Check | Expected |
| --- | --- |
| Romans 8:3, word `n45008003011` (σαρκός) | position 36, total 147 |
| σάρξ first / last | `n40016017012` (Matthew 16:17) is 1 of 147, with no previous; `n66019021026` (Revelation 19:21) is 147 of 147, with no next |
| Romans 8:13 (`n45008013004`), next | `n45009003018`, Romans 9:3 (crosses the chapter) |
| καθοράω (`n45001020011`, Romans 1:20) | total 1: "only occurrence", no controls |
| ὁ, καί, αὐτός totals | 19,795 / 8,973 / 5,059, each equal to an independent `count(*)` (SC-001) |
| Walking σάρξ end to end | 147 distinct ids, strictly increasing `canon_seq`, all with lemma exactly `σάρξ` |
| κἀγώ (`n46002003001`) | steps only through words with lemma `κἀγώ`; never καί or ἐγώ |
| Seed run twice | identical `canon_seq` for every id (SC-007) |
| Store without `canon_seq` | `chapterOccurrences` returns `null` and the chapter still renders |
| Store seeded without Romans 9 | the σάρξ total drops by Romans 9's count (3), and Romans 8's `next` skips to the next installed occurrence (FR-015) |
| Chapter-summary timing | ≤ 10 ms for Romans 8 and for the chapter with the most distinct lemmas (SC-003) |

Stories (`occurrence-stepper.stories.tsx` and additions to `greek-text.stories.tsx`) with play functions cover: the only/first/middle/last states, `aria-disabled` ends, the `[`/`]` keys, keys ignored in a text field, Escape returning focus to the stepped-to word, the second Escape clearing the mark, the mark in light, dark and sepia passing axe, the mark under `filter: grayscale(1)` still carrying its outline (SC-006), and the mark staying on the same word after the text size, typeface, theme or line spacing changes.

## End-to-end scenarios (real server)

```sh
npm run build && npm start   # http://127.0.0.1:3000
```

Extend `scripts/qa/reader.cjs` (or a sibling `scripts/qa/occurrences.cjs`) with these, run against the started server:

1. **US1**: open `/read/rom/8`, select σαρκός in 8:3. The popover shows "Occurrence 36 of 147 · Romans 8:3". Press Next 10 times: the 11th is in Romans 9:3, and the page did not reload (a `window` marker set before stepping survives). Press Previous 10 times: back on `n45008003011`, showing 36 of 147.
2. **Timing (SC-002)**: same-chapter step to marked word ≤ 100 ms, cross-chapter ≤ 1 s, measured from key press to `data-current-occurrence` on the target.
3. **US2, keyboard only**: Tab to a word, Enter, Tab to Next, press `]` repeatedly across a chapter boundary. Focus is always on the stepper in the new popover. Escape puts focus on the stepped-to word. Typing `]` in the display menu or any text field does nothing.
4. **US2, screen reader (manual)**: with VoiceOver on, each step reads "Occurrence n of 147, Romans c:v" once, including after a chapter change. A rapid burst of five `]` announces only the final position. Repeat with NVDA in browse mode where a Windows machine is available. If either screen reader intercepts `[` or `]`, change the keys (research R7).
5. **US2, touch**: emulate an iPad viewport with touch only and tap Next and Previous. The controls are at least 24×24 px.
6. **US3, address**: after stepping into Romans 9, copy the address, open it in a new tab, and the same word is marked and scrolled into view, with no popover open and focus not moved (the first Tab reaches the skip link). Activating the word opens its popover with the stepper. Run `npm run db:seed`, reload, and it is still the same word. `?w=nope` and `?w=n40001001001` on `/read/rom/8` show the chapter unmarked with the not-found notice.
7. **US3, history (SC-008)**:
   - *Across chapters*: from `/read/rom/8`, select 8:3, step 15 times through several chapters, then press Back once. The result is `/read/rom/8?w=n45008003011` with that word marked.
   - *Within one chapter*: from `/read/rom/8`, select 8:3 and step 3 times, staying in Romans 8. Press Back once: the address is `?w=n45008003011` and the mark is on that word, not the third step. Press Forward: the mark follows the address, and the run has ended (no popover).
8. **US4, ends**: `/read/mat/16?w=n40016017012` has Previous unavailable, and `/read/rev/19?w=n66019021026` has Next unavailable; pressing `]` does not move or wrap. `/read/rom/1?w=n45001020011` says "only occurrence".
9. **FR-016, manual navigation mid-run**: step once into another chapter, click the chapter-navigation Next link. The mark and popover are gone, and nothing jumps afterwards.
10. **Reduced motion**: with `prefers-reduced-motion: reduce` emulated, the scroll to the target is instant.
11. **Learning mode** (once 010 exists): in Learning mode no stepper, position or total is present, and `[`/`]` do nothing (SC-009).

## Docker

```sh
docker build -t vible-arcing . && docker run --rm -p 127.0.0.1:3000:3000 -v vible-data:/app/data vible-arcing
```

An existing `vible-data` volume is reseeded automatically (the ingest hash changed), and scenario 1 passes in the container.
