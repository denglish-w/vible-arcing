## 1. Sample corpus

- [ ] 1.1 Pick and record a MACULA Greek commit SHA; download `SBLGNT/lowfat` Philippians at that commit into the scratchpad (not the repo)
- [ ] 1.2 Write `scripts/ingest/sample_chapter.py` (stdlib only) that emits one chapter in corpus format v1 with an explicit field whitelist (design decision 6), plus `attribution.json` using the strings in `docs/reference/data-sources.md`
- [ ] 1.3 Run it with `.venv/bin/python -I` to produce `public/corpus/v1/PHP/1.json` and `public/corpus/v1/attribution.json`; spot-check ids, punctuation, and a verb, participle and noun against MACULA
- [ ] 1.4 Add a short `scripts/ingest/README.md` with the command, the pinned commit, and a note that the full ingest extends this script

## 2. Core library modules

- [ ] 2.1 Add dependencies: `zustand`, `@radix-ui/react-popover`, `@radix-ui/react-switch`, `@radix-ui/react-dropdown-menu`, `lucide-react`, `clsx`, `tailwind-merge`
- [ ] 2.2 `src/lib/books.ts`: the 27 books (code, name, Greek title, chapters, group) ported from the prototype, plus `getBook`, `booksInGroup`, `prevChapter` and `nextChapter` across book boundaries
- [ ] 2.3 `src/lib/pos.ts`: the eleven categories, `wordCategory(pos, mood)`, and the underline styles
- [ ] 2.4 `src/lib/corpus/types.ts` and `parseChapter()`; `src/lib/corpus/load.ts` with a per-chapter promise cache, "unavailable" mapping and neighbour prefetch
- [ ] 2.5 `src/lib/settings.ts`: defaults, option lists, the validator and merge, and the Zustand store with safe `persist` storage
- [ ] 2.6 `src/lib/utils.ts`: `cn()`
- [ ] 2.7 Vitest tests for 2.2–2.5 and the licence test on the committed corpus files (design decision 9)

## 3. Visual theme

- [ ] 3.1 Rewrite `src/app/globals.css`: light, dark and sepia tokens as full colours, `--pos-*` tokens, `@theme inline` mapping, custom variants, base styles (`small-caps` utility, body font)
- [ ] 3.2 Rewrite `src/app/layout.tsx`: EB Garamond (preloaded), Gentium Plus, Cardo and GFS Didot (`preload: false`) via `next/font/google`, checking each renders polytonic Greek; the blocking theme script, `suppressHydrationWarning`, metadata
- [ ] 3.3 Port `Logo`, `ChiRho` and `SiteFooter` to TSX; add a shared page shell used by every route
- [ ] 3.4 Port the `button`, `popover`, `switch` and `dropdown-menu` primitives to `src/components/ui/` in TSX for Tailwind v4

## 4. Contents and credits pages

- [ ] 4.1 `src/app/page.tsx`: contents page grouped by Gospels and Acts, Letters, and Revelation
- [ ] 4.2 `src/app/book/[book]/page.tsx` with `generateStaticParams` and `dynamicParams = false`
- [ ] 4.3 `src/app/credits/page.tsx` rendered from `public/corpus/v1/attribution.json` at build time, with the non-affiliation statement
- [ ] 4.4 `src/app/not-found.tsx`

## 5. Reading screen

- [ ] 5.1 `src/app/read/[book]/[chapter]/page.tsx`: static shell with `generateStaticParams` over all 260 chapters, rendering the client `Reader`
- [ ] 5.2 Reader header with book/chapter title and prev/next links (omitted at Matthew 1 and Revelation 22)
- [ ] 5.3 Greek text component: verses, optional verse numbers, word buttons keyed by MACULA id, punctuation, size/spacing/typeface from settings, part-of-speech colouring with underline styles
- [ ] 5.4 Loading and "text not yet available" states
- [ ] 5.5 Word detail popover: lemma, gloss, part of speech and only the applicable morphology fields; Escape, outside click and reselect behaviour; focus return
- [ ] 5.6 Display menu: theme, typeface, size, spacing, verse numbers, colouring on/off and per-category switches; legend shown when colouring is on
- [ ] 5.7 Mirror the theme setting onto the `<html>` class

## 6. Verify and document

- [ ] 6.1 `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass; `out/` contains the 260 reader pages, the fonts and `corpus/v1/`
- [ ] 6.2 Serve `out/` locally and walk the spec scenarios by hand: theme persistence with no flash on reload, keyboard word selection, Escape, a crossing chapter link (Matthew 28 → Mark 1), an unavailable chapter, broken localStorage, and the credits page
- [ ] 6.3 Update `lat.md/` (new theme and reader sections; corpus format in `lat.md/corpus.md`) and run `lat check`
- [ ] 6.4 Update `CLAUDE.md` "Project state", and note in `discourse-analysis-foundation/design.md` that corpus granularity is settled as per-chapter format v1
- [ ] 6.5 Design review against `DESIGN.md`: in light, dark and sepia, at desktop and phone widths, check every screen for its named rules (tokens only, rubric red only for state, serif only, small-caps labels, warm shadows, two-cue part-of-speech colouring); run `/impeccable audit` on the reader and fix what it finds
