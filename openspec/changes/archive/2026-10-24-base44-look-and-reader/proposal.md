> **Superseded in part by `app-server-and-sqlite`.** That change turns the app into a Node server with a SQLite corpus store. This change was built first against a static export, so the code it describes (static routes, `generateStaticParams`, a client JSON loader, `public/corpus/`) still exists until the reader is moved to server data (tasks section 8). What changes: the corpus format and sample chapter now belong to `app-server-and-sqlite` (`text/corpus-store`, tasks 3.1 and 3.3); the books table lives in `src/lib/books.ts` from that change, and this change's names, Greek titles and groups extend it; pages are rendered by the server instead of exported; `/credits` is created there and only restyled here. The visual theme, typefaces, settings and Storybook work are unaffected.

## Why

The app is a placeholder home page with no visual identity and no way to see the Greek text. A design prototype built in Base44 (source kept in `docs/design/base44-prototype/`, with its visual system captured in `DESIGN.md`) already settles the look (a parchment, ink and dark-red palette with light, dark and sepia themes) and has a working Greek reading screen. That screen is the passage view the arcing editor will sit beside, so porting it now gives later discourse work a real surface to build on.

The prototype cannot be dropped in as-is. It is a server-rendered TanStack Start app in plain JavaScript on Tailwind v3, tied to the Base44 backend, and its bundled Bible data identifies words by verse and position, which breaks this project's rule that word ids come from MACULA. This change keeps the design and the reading screen and leaves the rest behind.

## What Changes

- Replace the scaffold's default styling with the prototype's design tokens: the colour palette, light/dark/sepia themes, and part-of-speech colours. They move from Tailwind v3 HSL config to Tailwind v4 `@theme` and CSS custom properties.
- Load the prototype's typefaces, self-hosted through `next/font` so the app makes no runtime request to Google Fonts: EB Garamond for chrome and Greek, plus Gentium Plus, Cardo and GFS Didot as alternative Greek faces. Inter is not carried over because the prototype loads it but never uses it.
- Port the Logo, ChiRho mark and site footer to TSX.
- Replace the placeholder home page with a contents page that lists New Testament books grouped as in the prototype. A book page lists its chapters.
- Add a reading screen at `/read/<book>/<chapter>`. It shows the Greek text by verse. Words can be coloured by part of speech (each category also gets its own underline style, so colour is not the only cue). Selecting a word opens a popover with its lemma, gloss and parsing. A display menu sets theme, Greek font, text size, line spacing, verse numbers and part-of-speech colouring, and those settings persist in the browser.
- Restyle the `/credits` page (created by `app-server-and-sqlite`, which renders `getAttribution()` from the corpus store) in the theme, with the shared page shell. The first version of this change built its own credits page from `attribution.json` at build time; that moves to the server page.
- Read chapters keyed by MACULA word ids. The corpus format (v1) and the Philippians 1 sample chapter are defined by `app-server-and-sqlite` (`text/corpus-store`), which owns the extractor, the store and `getChapter`; this change consumes them in a server component. Every chapter not yet ingested shows a "not yet available" state. As first built, this change defined the format itself and read it with a client-side loader from `public/corpus/`; tasks section 8 replaces that.
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
- **Rendering:** as first built, a static export with `generateStaticParams` for all 27 books and 260 chapter pages and a browser-side chapter fetch. Under `app-server-and-sqlite`, the contents, book and reading pages are server components rendered per request from the corpus store (each calls `await connection()` before its first query), and `generateStaticParams` and the client loader are dropped.
- **Dependencies:** adds `@radix-ui/*` primitives for popover, switch, dropdown and dialog, plus `lucide-react` for icons, `clsx` and `tailwind-merge`. No backend dependencies.
- **Data:** the sample chapter and attribution file were first committed under `public/corpus/`; they now live in `corpus/v1/` (owned by `app-server-and-sqlite`), are loaded into `data/corpus.sqlite` by `npm run db:seed`, and are no longer served to the browser.
- **Docs:** `lat.md/` gains sections for the theme and the reader. `CLAUDE.md` "Project state" is updated.
- **Licensing:** the sample chapter is MACULA Greek over SBLGNT (both CC BY 4.0) with UBS attributes removed, and it ships with its attribution metadata. Nothing from the prototype's data files is copied.
