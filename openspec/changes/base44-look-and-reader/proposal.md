## Why

The app is a placeholder home page with no visual identity and no way to see the Greek text. A design prototype built in Base44 (source kept in `docs/design/base44-prototype/`, with its visual system captured in `DESIGN.md`) already settles the look (a parchment, ink and dark-red palette with light, dark and sepia themes) and has a working Greek reading screen. That screen is the passage view the arcing editor will sit beside, so porting it now gives later discourse work a real surface to build on.

The prototype cannot be dropped in as-is. It is a server-rendered TanStack Start app in plain JavaScript on Tailwind v3, tied to the Base44 backend, and its bundled Bible data identifies words by verse and position, which breaks this project's rule that word ids come from MACULA. This change keeps the design and the reading screen and leaves the rest behind.

## What Changes

- Replace the scaffold's default styling with the prototype's design tokens: the colour palette, light/dark/sepia themes, and part-of-speech colours. They move from Tailwind v3 HSL config to Tailwind v4 `@theme` and CSS custom properties.
- Load the prototype's typefaces, self-hosted through `next/font` so the static export makes no runtime request to Google Fonts: EB Garamond for chrome and Greek, plus Gentium Plus, Cardo and GFS Didot as alternative Greek faces. Inter is not carried over because the prototype loads it but never uses it.
- Port the Logo, ChiRho mark and site footer to TSX.
- Replace the placeholder home page with a contents page that lists New Testament books grouped as in the prototype. A book page lists its chapters.
- Add a reading screen at `/read/<book>/<chapter>`. It shows the Greek text by verse. Words can be coloured by part of speech (each category also gets its own underline style, so colour is not the only cue). Selecting a word opens a popover with its lemma, gloss and parsing. A display menu sets theme, Greek font, text size, line spacing, verse numbers and part-of-speech colouring, and those settings persist in the browser.
- Add a credits page that renders attribution from the corpus attribution metadata rather than from hard-coded strings.
- Define the corpus chapter format the reader consumes, keyed by MACULA word ids, and a client-side loader for it. Until the ingest script from `discourse-analysis-foundation` exists, the loader is backed by one committed sample chapter, Philippians 1, extracted from MACULA Greek with its real word ids. Every other chapter shows a "not yet available" state.
- Bring over only the UI primitives the reader uses (button, popover, switch, dropdown menu, dialog), rewritten in TSX for Tailwind v4.

**Not carried over:** the Base44 SDK, server functions, auth, AI, Stripe, the parsing quiz (it grades answers on a server), the diaglot/translation annotations (they persist to the Base44 backend), the grammatical diagramming canvas (deferred, and a separate model from discourse analysis), and the prototype's `public/data/` JSON (positional word ids). BSB English and the Dodson lexicon are both public domain and wanted later, but they need their own ingest, so they are a separate change.

## Capabilities

### New Capabilities

- `app/visual-theme`: The application's visual identity: colour tokens, light/dark/sepia themes, typefaces, part-of-speech colour categories with non-colour cues, and the shared page chrome (logo, footer).
- `text/greek-reader`: Browsing and reading the Greek New Testament: the book and chapter contents, the chapter reading screen, the word-detail popover, display settings and their persistence, the credits page, and the corpus chapter format and loader the reader depends on.

### Modified Capabilities

None. `text/greek-source` (in `discourse-analysis-foundation`, not yet archived) already requires attribution reachable by any user. The credits page added here is how that requirement is met, so its requirements do not change.

## Impact

- **Code:** `src/app/` gains routes (`/`, `/book/[bookId]`, `/read/[bookId]/[chapter]`, `/credits`), and new `src/components/` and `src/lib/` modules. `src/app/globals.css` and `src/app/layout.tsx` are rewritten.
- **Static export:** dynamic routes need `generateStaticParams` for all 27 books and their chapters (260 chapter pages). The reader loads chapter data in the browser, so the pages themselves stay small.
- **Dependencies:** adds `@radix-ui/*` primitives for popover, switch, dropdown and dialog, plus `lucide-react` for icons, `clsx` and `tailwind-merge`. No backend dependencies.
- **Data:** adds `public/corpus/` with one sample chapter and an attribution file, both in the format the future ingest must emit. The ingest work in `discourse-analysis-foundation` inherits that format as its output contract.
- **Docs:** `lat.md/` gains sections for the theme and the reader. `CLAUDE.md` "Project state" is updated.
- **Licensing:** the sample chapter is MACULA Greek over SBLGNT (both CC BY 4.0) with UBS attributes removed, and it ships with its attribution metadata. Nothing from the prototype's data files is copied.
