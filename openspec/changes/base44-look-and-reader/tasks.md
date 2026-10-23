## 1. Sample corpus

- [x] 1.1 Pick and record a MACULA Greek commit SHA; download `SBLGNT/lowfat` Philippians at that commit into the scratchpad (not the repo)
- [x] 1.2 Write `scripts/ingest/sample_chapter.py` (stdlib only) that emits one chapter in corpus format v1 with an explicit field whitelist (design decision 6), plus `attribution.json` using the strings in `docs/reference/data-sources.md`
- [x] 1.3 Run it with `.venv/bin/python -I` to produce `public/corpus/v1/PHP/1.json` and `public/corpus/v1/attribution.json`; spot-check ids, punctuation, and a verb, participle and noun against MACULA
- [x] 1.4 Add a short `scripts/ingest/README.md` with the command, the pinned commit, and a note that the full ingest extends this script

## 2. Core library modules

- [x] 2.1 Add dependencies: `zustand`, `@radix-ui/react-popover`, `@radix-ui/react-switch`, `@radix-ui/react-dropdown-menu`, `lucide-react`, `clsx`, `tailwind-merge`
- [x] 2.2 `src/lib/books.ts`: the 27 books (code, name, Greek title, chapters, group) ported from the prototype, plus `getBook`, `booksInGroup`, `prevChapter` and `nextChapter` across book boundaries
- [x] 2.3 `src/lib/pos.ts`: the eleven categories, `wordCategory(pos, mood)`, and the underline styles
- [x] 2.4 `src/lib/corpus/types.ts` and `parseChapter()`; `src/lib/corpus/load.ts` with a per-chapter promise cache, "unavailable" mapping and neighbour prefetch
- [x] 2.5 `src/lib/settings.ts`: defaults, option lists, the validator and merge, and the Zustand store with safe `persist` storage
- [x] 2.6 `src/lib/utils.ts`: `cn()`
- [x] 2.7 Vitest tests for 2.2–2.5 and the licence test on the committed corpus files (design decision 9)

## 3. Visual theme

- [x] 3.1 Rewrite `src/app/globals.css`: light, dark and sepia tokens as full colours, `--pos-*` tokens, `@theme inline` mapping, custom variants, base styles (`small-caps` utility, body font)
- [x] 3.2 Rewrite `src/app/layout.tsx`: EB Garamond (preloaded), Gentium Plus, Cardo and GFS Didot (`preload: false`) via `next/font/google`, checking each renders polytonic Greek; the blocking theme script, `suppressHydrationWarning`, metadata
- [x] 3.3 Port `Logo`, `ChiRho` and `SiteFooter` to TSX; add a shared page shell used by every route
- [x] 3.4 Port the `button`, `popover`, `switch` and `dropdown-menu` primitives to `src/components/ui/` in TSX for Tailwind v4

## 4. Contents and credits pages

- [x] 4.1 `src/app/page.tsx`: contents page grouped by Gospels and Acts, Letters, and Revelation
- [x] 4.2 `src/app/book/[book]/page.tsx` with `generateStaticParams` and `dynamicParams = false`
- [x] 4.3 `src/app/credits/page.tsx` rendered from `public/corpus/v1/attribution.json` at build time, with the non-affiliation statement
- [x] 4.4 `src/app/not-found.tsx`

## 5. Reading screen

- [x] 5.1 `src/app/read/[book]/[chapter]/page.tsx`: static shell with `generateStaticParams` over all 260 chapters, rendering the client `Reader`
- [x] 5.2 Reader header with book/chapter title and prev/next links (omitted at Matthew 1 and Revelation 22)
- [x] 5.3 Greek text component: verses, optional verse numbers, word buttons keyed by MACULA id, punctuation, size/spacing/typeface from settings, part-of-speech colouring with underline styles
- [x] 5.4 Loading and "text not yet available" states
- [x] 5.5 Word detail popover: lemma, gloss, part of speech and only the applicable morphology fields; Escape, outside click and reselect behaviour; focus return
- [x] 5.6 Display menu: theme, typeface, size, spacing, verse numbers, colouring on/off and per-category switches; legend shown when colouring is on
- [x] 5.7 Mirror the theme setting onto the `<html>` class

## 6. Verify and document

- [x] 6.1 `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass; `out/` contains the 260 reader pages, the fonts and `corpus/v1/`
- [ ] 6.2 Serve `out/` locally and walk by hand the spec scenarios a story cannot show: theme persistence with no flash on reload, keyboard word selection, Escape, a crossing chapter link (Matthew 28 → Mark 1), an unavailable chapter, broken localStorage, and the credits page
- [x] 6.3 Update `lat.md/` (new theme and reader sections; corpus format in `lat.md/corpus.md`) and run `lat check`
- [x] 6.4 Update `CLAUDE.md` "Project state", and note in `discourse-analysis-foundation/design.md` that corpus granularity is settled as per-chapter format v1
- [ ] 6.5 Design review against `DESIGN.md`: in light, dark and sepia, at desktop and phone widths, check every screen, and every story through the Storybook theme toolbar (section 7), for its named rules (tokens only, rubric red only for state, serif only, small-caps labels, warm shadows, two-cue part-of-speech colouring); run `/impeccable audit` on the reader and fix what it finds

## 7. Storybook stories (design decisions 9 and 10)

- [ ] 7.1 Move the four font definitions from `src/app/layout.tsx` into `src/app/fonts.ts`; the layout imports them unchanged
- [ ] 7.2 Rename `.storybook/preview.ts` to `preview.tsx` (and widen the Prettier globs to `.storybook/*.{ts,tsx}`); apply the font variables from `src/app/fonts.ts`, and add a Light/Dark/Sepia toolbar global whose decorator sets the same `<html>` class as `ThemeSync`
- [ ] 7.3 Export `ChapterNavigation`, `WordDetail` and the loading and unavailable states from `src/components/reading/reader.tsx` (or split them into their own files) so each can have stories; no behaviour change
- [ ] 7.4 Stories for `ChiRho`, `Logo`, `SiteFooter`, `PageShell` and `LabelStrip`
- [ ] 7.5 Stories for the `button`, `popover`, `switch` and `dropdown-menu` primitives in each variant and state (disabled, checked, open), with `play` functions for the switch toggling and the popover opening and closing by keyboard
- [ ] 7.6 `ChapterNavigation` stories: a middle chapter, Matthew 1, Revelation 22, and the Matthew 28 → Mark 1 crossing
- [ ] 7.7 `GreekText` stories from the `PHP/1.json` fixture with settings set in a decorator: colouring on and off, every category visible, verse numbers on and off, largest size with widest spacing, and each typeface
- [ ] 7.8 Loading and "text not yet available" stories
- [ ] 7.9 `WordDetail` stories for a verb, a participle and a noun; `play` functions on `GreekText` assert that Escape closes the popover and returns focus to the word, and that selecting another word moves it
- [ ] 7.10 `DisplayMenu` stories with colouring on and off; a `play` function asserts that switching a category off removes it from the legend
- [ ] 7.11 `npm test` (unit and storybook projects) and `npm run build-storybook` pass with every story free of axe violations; fix components rather than disabling rules, and record any rule that must stay off with its reason
- [ ] 7.12 Update `lat.md/` (stories and the Storybook theme toolbar) and run `lat check`
