## 1. Sample corpus

> Section 1 was done here and is kept as history. Its work now belongs to `app-server-and-sqlite` task 3.1, which moved the extractor's output from `public/corpus/v1/` to `corpus/v1/`. Do not redo it.

- [x] 1.1 Pick and record a MACULA Greek commit SHA; download `SBLGNT/lowfat` Philippians at that commit into the scratchpad (not the repo)
- [x] 1.2 Write `scripts/ingest/sample_chapter.py` (stdlib only) that emits one chapter in corpus format v1 with an explicit field whitelist (design decision 6), plus `attribution.json` using the strings in `docs/reference/data-sources.md`
- [x] 1.3 Run it with `.venv/bin/python -I` to produce `public/corpus/v1/PHP/1.json` and `public/corpus/v1/attribution.json`; spot-check ids, punctuation, and a verb, participle and noun against MACULA
- [x] 1.4 Add a short `scripts/ingest/README.md` with the command, the pinned commit, and a note that the full ingest extends this script

## 2. Core library modules

- [x] 2.1 Add dependencies: `zustand`, `@radix-ui/react-popover`, `@radix-ui/react-switch`, `@radix-ui/react-dropdown-menu`, `lucide-react`, `clsx`, `tailwind-merge`
- [x] 2.2 `src/lib/books.ts`: the 27 books (code, name, Greek title, chapters, group) ported from the prototype, plus `getBook`, `booksInGroup`, `prevChapter` and `nextChapter` across book boundaries (`app-server-and-sqlite` task 3.2 now creates this file with codes and chapter counts and this task extends it; the finished file is the same)
- [x] 2.3 `src/lib/pos.ts`: the eleven categories, `wordCategory(pos, mood)`, and the underline styles
- [x] 2.4 `src/lib/corpus/types.ts` and `parseChapter()`; `src/lib/corpus/load.ts` with a per-chapter promise cache, "unavailable" mapping and neighbour prefetch (superseded: the types and parser are replaced by `src/lib/corpus/format.ts` from `app-server-and-sqlite` task 3.3, and the loader by the store's `getChapter`; see section 8)
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
- [x] 4.2 `src/app/book/[book]/page.tsx` with `generateStaticParams` and `dynamicParams = false` (superseded, see 8.2)
- [x] 4.3 `src/app/credits/page.tsx` rendered from `public/corpus/v1/attribution.json` at build time, with the non-affiliation statement (superseded: `/credits` is owned by `app-server-and-sqlite` task 6.5; see 8.4)
- [x] 4.4 `src/app/not-found.tsx`

## 5. Reading screen

- [x] 5.1 `src/app/read/[book]/[chapter]/page.tsx`: static shell with `generateStaticParams` over all 260 chapters, rendering the client `Reader` (superseded, see 8.2)
- [x] 5.2 Reader header with book/chapter title and prev/next links (omitted at Matthew 1 and Revelation 22)
- [x] 5.3 Greek text component: verses, optional verse numbers, word buttons keyed by MACULA id, punctuation, size/spacing/typeface from settings, part-of-speech colouring with underline styles
- [x] 5.4 Loading and "text not yet available" states
- [x] 5.5 Word detail popover: lemma, gloss, part of speech and only the applicable morphology fields; Escape, outside click and reselect behaviour; focus return
- [x] 5.6 Display menu: theme, typeface, size, spacing, verse numbers, colouring on/off and per-category switches; legend shown when colouring is on
- [x] 5.7 Mirror the theme setting onto the `<html>` class

## 6. Verify and document

- [x] 6.1 `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass; `out/` contains the 260 reader pages, the fonts and `corpus/v1/`
- [x] 6.2 Serve `out/` locally and walk by hand the spec scenarios a story cannot show: theme persistence with no flash on reload, keyboard word selection, Escape, a crossing chapter link (Matthew 28 → Mark 1), an unavailable chapter, broken localStorage, and the credits page
- [x] 6.3 Update `lat.md/` (new theme and reader sections; corpus format in `lat.md/corpus.md`) and run `lat check`
- [x] 6.4 Update `CLAUDE.md` "Project state", and note in `discourse-analysis-foundation/design.md` that corpus granularity is settled as per-chapter format v1
- [x] 6.5 Design review against `DESIGN.md`: in light, dark and sepia, at desktop and phone widths, check every screen, and every story through the Storybook theme toolbar (section 7), for its named rules (tokens only, rubric red only for state, serif only, small-caps labels, warm shadows, two-cue part-of-speech colouring); run `/impeccable audit` on the reader and fix what it finds

## 7. Storybook stories (design decisions 9 and 10)

- [x] 7.1 Move the four font definitions from `src/app/layout.tsx` into `src/app/fonts.ts`; the layout imports them unchanged
- [x] 7.2 Rename `.storybook/preview.ts` to `preview.tsx` (and widen the Prettier globs to `.storybook/*.{ts,tsx}`); apply the font variables from `src/app/fonts.ts`, and add a Light/Dark/Sepia toolbar global whose decorator sets the same `<html>` class as `ThemeSync`
- [x] 7.3 Export `ChapterNavigation`, `WordDetail` and the loading and unavailable states from `src/components/reading/reader.tsx` (or split them into their own files) so each can have stories; no behaviour change
- [x] 7.4 Stories for `ChiRho`, `Logo`, `SiteFooter`, `PageShell` and `LabelStrip`
- [x] 7.5 Stories for the `button`, `popover`, `switch` and `dropdown-menu` primitives in each variant and state (disabled, checked, open), with `play` functions for the switch toggling and the popover opening and closing by keyboard
- [x] 7.6 `ChapterNavigation` stories: a middle chapter, Matthew 1, Revelation 22, and the Matthew 28 → Mark 1 crossing
- [x] 7.7 `GreekText` stories from the `PHP/1.json` fixture with settings set in a decorator: colouring on and off, every category visible, verse numbers on and off, largest size with widest spacing, and each typeface
- [x] 7.8 Loading and "text not yet available" stories
- [x] 7.9 `WordDetail` stories for a verb, a participle and a noun; `play` functions on `GreekText` assert that Escape closes the popover and returns focus to the word, and that selecting another word moves it
- [x] 7.10 `DisplayMenu` stories with colouring on and off; a `play` function asserts that switching a category off removes it from the legend
- [x] 7.11 `npm test` (unit and storybook projects) and `npm run build-storybook` pass with every story free of axe violations; fix components rather than disabling rules, and record any rule that must stay off with its reason
- [x] 7.12 Update `lat.md/` (stories and the Storybook theme toolbar) and run `lat check`

## 8. Move to server data (after `app-server-and-sqlite`)

Everything above was built against a static export. These tasks bring it in line with the server. Apply them once `app-server-and-sqlite` groups 1 to 3 are done.

- [x] 8.1 Delete `src/lib/corpus/types.ts`, this change's `parseChapter()` and the client `load.ts` loader (with their tests), and remove `public/corpus/`; the licence test on committed chapter files is already covered by `app-server-and-sqlite` task 3.6
- [x] 8.2 The contents, book and reading pages become server components that read the corpus store (`listBooks`, `getChapter`) and call `await connection()` before their first query; drop `generateStaticParams` and `dynamicParams = false`; an unknown book or chapter calls `notFound()`, and a chapter that exists but is not ingested renders the "not yet available" state with working navigation
- [x] 8.3 Pass the chapter to the client `Reader` as props instead of a fetch, keeping settings, popover and display menu client-side, and the chapter navigation visible in the unavailable state
- [x] 8.4 Restyle `/credits` (from `app-server-and-sqlite` task 6.5) with the shared page shell; do not add a second credits page
- [x] 8.5 Section 7 stands. Where a component now receives server data, split a props-only presentational part so its stories need no database (`server-only` and `better-sqlite3` cannot load in Storybook); the existing stories already feed components by props and the `PHP/1.json` fixture, which should come from `corpus/v1/PHP/1.json` through `parseChapter()` from `format.ts`
- [x] 8.6 Update `lat.md/reader.md` (server-rendered pages, no client loader) and run `lat check`; repeat the by-hand checks of task 6.2 that a story cannot show against `npm start`
