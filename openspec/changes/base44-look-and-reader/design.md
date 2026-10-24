## Context

> **Superseded in part by `app-server-and-sqlite`:** the static-export rules below, decisions 5, 6 and 7, and the "260 static reader pages" risk describe how this change was first built. The app is now a Node server (decision 1 there), pages are server components reading the corpus store, and the corpus format and sample extractor are owned by that change. Each affected decision carries its own note. Decisions 1 to 4 and 8 to 10 stand.

See proposal.md for why. The current state:

- **This repo:** Next.js 16 App Router with `output: 'export'`, TypeScript, Tailwind v4 through `@tailwindcss/turbopack`, oxlint, Prettier and Vitest, plus Storybook 10 (`@storybook/nextjs-vite`) whose Vitest `storybook` project renders every story in headless Chromium and fails on axe violations. `src/app/` has only the scaffold's layout and page. There is no corpus yet: the ingest in `discourse-analysis-foundation` is unwritten, and its design leaves the corpus file granularity (per book or per chapter) open.
- **The design system** is `DESIGN.md` at the repo root ("The Scholar's Desk"). It is normative for every visual decision in this change: tokens, type roles, shadows, component treatments and the named rules.
- **The prototype** (`docs/design/base44-prototype/`): TanStack Start in plain JSX with Tailwind v3. Tokens are HSL triples in `src/index.css` (`--background: 40 36% 93%`), consumed as `hsl(var(--x))`, with `.dark` and `.sepia` class overrides. The reader is `src/routes/read.$bookId.$chapter.jsx` plus `src/components/reading/*`, and display settings live in `src/lib/study-defaults.js` and `src/lib/pos.js`. Settings and annotations sync to the Base44 backend when signed in, and fall back to localStorage otherwise.
- **Static export rules (superseded: the app is a Node server, see `app-server-and-sqlite`)** (from `node_modules/next/dist/docs/01-app/02-guides/static-exports.md`): dynamic routes need `generateStaticParams()` and `dynamicParams: false`. There are no server actions, cookies or runtime request handling.

## Goals / Non-Goals

**Goals:**

- Port by rewriting: read each prototype file and re-express it in TSX against this repo's stack. Do not copy files across and patch them.
- Fix the corpus chapter format now so the ingest has a concrete output contract and the reader never depends on prototype data.
- Keep display settings and word selection on the client. Chapter text comes from the server's corpus store (as first built: everything on the client, with a static export).

**Non-Goals:**

- Full NT ingest. One sample chapter only.
- Reproducing prototype features that need a backend, or deferred features (see proposal, "Not carried over").
- Copying prototype quirks. The look must match `DESIGN.md` exactly, but where the prototype's code departs from `DESIGN.md` (such as the diagram screen's hard-coded hex values), `DESIGN.md` wins, and where either conflicts with the specs, the specs win.

## Decisions

### 1. Tokens as full colour values, mapped into Tailwind v4 `@theme inline`

`globals.css` defines each token on `:root` as a complete colour (`--background: hsl(40 36% 93%)`), redefines it under `.dark` and `.sepia`, and maps it into Tailwind with `@theme inline { --color-background: var(--background); … }`. Part-of-speech colours are tokens too (`--pos-verb`, …). The theme variants are declared with `@custom-variant dark (&:where(.dark, .dark *))`, and likewise for sepia.

*Why:* the future SVG renderers read `var(--pos-verb)` or `var(--primary)` directly, which `design.md` in the foundation change already requires ("CSS custom properties defined in `@theme`"). Bare HSL triples force every consumer to wrap them in `hsl()`.

*Alternative:* keep the triples and write `hsl(var(--x))` everywhere, as the prototype does. Rejected because it leaks a v3 convention into every renderer.

The sidebar and chart tokens from the prototype are dropped, since nothing here uses them.

### 2. Theme applied by a blocking inline script, no theme library

`layout.tsx` puts a short inline `<script>` in `<head>`. It reads the stored settings from localStorage inside try/catch and sets `class="dark"` or `"sepia"` on `<html>` before first paint. `<html>` carries `suppressHydrationWarning`. Changing the theme in the display menu updates the store, and a small effect mirrors the store's theme onto the `<html>` class.

*Alternative:* `next-themes`. It does the same thing but adds a provider and a dependency for about 15 lines of code, and it would keep the theme in a second storage key separate from the other display settings.

### 3. Fonts through `next/font/google`, self-hosted at build

All four of the prototype's Greek typefaces load: EB Garamond, Gentium Plus, Cardo and GFS Didot. Each uses whichever of the `latin`, `greek` and `greek-ext` subsets it offers (polytonic Greek needs the `greek-ext` range), and each exposes a CSS variable (`--font-garamond`, `--font-gentium`, `--font-cardo`, `--font-didot`). Only EB Garamond is preloaded. The others are declared with `preload: false`, so a browser downloads one only when it is selected, and offering four faces costs nothing for readers who never switch. The "Greek typeface" setting switches between them with a token on the reading container. The build downloads the font files once, and they ship in `out/`, so no browser requests Google. Inter is not carried over because the prototype loads it but never uses it.

*To check during apply:* GFS Didot's Google Fonts build may lack the `greek-ext` subset. If it does not render polytonic Greek fully, record that and raise it rather than shipping a face that drops accents.

*Trade-off:* the build, including CI, needs network access to Google Fonts. CI already has it.

### 4. Settings in a Zustand store with `persist`, validated on read

A Zustand store holds the display settings. The `persist` middleware writes them to one localStorage key (`vible.display`) through a `createJSONStorage` wrapper whose `getItem` and `setItem` catch exceptions. Its `merge` runs every stored field through a validator that keeps a value only if it is in the allowed set, and otherwise uses the default. That covers the "missing, unreadable or newer-field" scenarios in the spec without versioned migrations.

*Why Zustand:* the foundation design already chose Zustand for editor state, so this adds no extra library and starts the convention early.

*Hydration:* the store hydrates on the client after the first render. Everything except the theme (decision 2) applies one frame later. That is acceptable because the reading text itself only appears after the chapter fetch.

### 5. Routes: lowercase MACULA book codes, all pages pre-rendered

> **Superseded by `app-server-and-sqlite`:** the pages are server components rendered per request, not pre-rendered. There is no `generateStaticParams`, no `dynamicParams = false`, and no static host; an unknown book or chapter is answered by the server with `not-found`, using the store to tell "does not exist" from "not yet ingested". `/credits` is created by that change and restyled here. The route shapes and lowercase codes below stand. Original text follows.

- `/`: contents (server component, static).
- `/book/[book]`: chapter list. `generateStaticParams` returns the 27 codes, and `dynamicParams = false`.
- `/read/[book]/[chapter]`: the page is a static shell with `generateStaticParams` over all 260 book–chapter pairs. It renders a client `Reader` that fetches the chapter JSON.
- `/credits`: static. The attribution JSON is imported at build time, so credits render into HTML with no client fetch.
- `not-found.tsx` renders the shared 404. The static host serves it for any address that was not generated, which covers invalid books and chapters.

Book segments use the lowercase MACULA code (`/read/php/1`). It is the same key as the corpus path, which avoids a second id scheme. The prototype's slugs (`philippians`) are not kept. A `books.ts` table (code, name, Greek title, chapter count, group) is ported from the prototype's `books.js` and drives both `generateStaticParams` and prev/next navigation.

### 6. Corpus chapter format v1: one JSON file per chapter

> **Superseded by `app-server-and-sqlite` decision 4:** the format moved to `text/corpus-store` and `src/lib/corpus/format.ts`; ingest output is committed under `corpus/v1/`, not `public/corpus/v1/`, and is read by the seed, not fetched by the browser. That change also refines `after`, `gloss` and the attribution fields. `src/lib/corpus/types.ts` and this change's `parseChapter` are replaced by `format.ts`, and `loadChapter` by the store's `getChapter`. Original text follows.

This settles the foundation design's open question on file granularity for the reader's needs: one file per chapter at `public/corpus/v1/<BOOK>/<chapter>.json`. Matthew is about 2 MB as a single book file, but a few tens of KB per chapter, and the reader only ever needs one chapter.

```jsonc
{
  "format": 1,
  "edition": "SBLGNT",
  "source": { "dataset": "macula-greek", "commit": "<sha>" },
  "book": "PHP",
  "chapter": 1,
  "words": [
    {
      "id": "n50001001001",       // MACULA xml:id, the only word identity
      "v": 1,                      // verse
      "text": "Παῦλος",
      "after": " ",                // following punctuation/space, verbatim
      "lemma": "Παῦλος",
      "gloss": "Paul",
      "pos": "noun",               // MACULA @class
      "m": { "case": "nominative", "number": "singular", "gender": "masculine" }
    }
  ]
}
```

`m` holds only the morphology fields present on the word (person, number, gender, case, tense, voice, mood, degree), so "omit fields that don't apply" falls out of the data. Fields are listed explicitly on emit, so `@ln`, `@domain` and anything else not listed never reach the file.

`public/corpus/v1/attribution.json` lists the datasets as `{ name, creator, license, licenseUrl, statement, modified, url }`, using the strings from `docs/reference/data-sources.md`.

A pure `parseChapter(json)` function checks the shape and `format === 1` and returns typed data or throws. The client loader (`loadChapter(book, chapter)`) caches promises per chapter, maps 404s and parse failures to an "unavailable" result, and prefetches the neighbouring chapters.

Types for this format are hand-written in `src/lib/corpus/types.ts`. The "generated, never hand-written" rule in `CLAUDE.md` covers the taxonomy and conjunction data in `docs/data/`, and the corpus has no JSON schema to generate from yet. When the ingest lands, it can emit a JSON Schema and take over type generation.

### 7. The sample chapter comes from a minimal Python extractor in `scripts/ingest/`

> **Moved to `app-server-and-sqlite` (task 3.1):** the extractor, its pinned commit and `scripts/ingest/README.md` belong to that change, which writes to `corpus/v1/`. What was built here is kept as history. Original text follows.

`scripts/ingest/sample_chapter.py` reads one MACULA `SBLGNT/lowfat` book file at a pinned commit and writes one chapter in format v1, plus `attribution.json`. It uses only the standard library (`xml.etree`) and is run with `.venv/bin/python -I`. Its output for Philippians 1 is committed. It is deliberately the seed of the foundation change's ingest: the full ingest generalises it to every book and adds clause and conjunction data, rather than starting over.

*Why Philippians 1:* it has a long, varied Pauline argument (1:3–11 and 1:27–30 are standard arcing passages), so it is a useful demo surface for the editor later, and it has every part-of-speech category.

*Alternative:* hand-write a fixture. Rejected because invented ids would violate the MACULA-id rule the fixture exists to prove.

### 8. Popover and menus on Radix primitives

The word popover uses `@radix-ui/react-popover` anchored to the selected word, which provides Escape-to-close, outside-click and focus return. The display menu uses `@radix-ui/react-popover` with `@radix-ui/react-switch`. The small ports of the prototype's shadcn `button`, `popover`, `switch` and `dropdown-menu` live in `src/components/ui/`, written in TSX with a `cn()` helper (`clsx` plus `tailwind-merge`). The ~45 other shadcn components are not ported.

Words are rendered as `<button>` elements inside the verse text, so keyboard focus and Enter work without extra code. Styling resets them to look like inline text.

### 9. Unit tests cover the pure modules, stories cover the components

The `unit` Vitest project covers `wordCategory`, the settings validator and merge, `parseChapter` (accepts the committed fixture, rejects a wrong `format`, rejects words without `id`), prev/next chapter across book boundaries, and a licence test asserting that the committed fixture contains no `ln` or `domain` keys and that `attribution.json` names SBLGNT and MACULA Greek with `modified: true`.

Every component ships with a `*.stories.tsx` beside it, covering its states rather than one happy path. The `storybook` Vitest project renders each story in headless Chromium, so a story that throws or has an axe violation fails `npm test`. Behaviour that the specs describe as keyboard or pointer interaction (Escape closes the word popover and returns focus to the word, reselecting a word, the display menu's switches) is asserted in `play` functions with `storybook/test`, which ships with Storybook and needs no new dependency. Stories feed components through props or through the settings store set in a decorator, and Greek text stories use the committed `PHP/1.json` fixture, so no story fetches.

The theme flash on reload, routing and the production build cannot be seen from a story and are still checked by hand (task 6.2). jsdom and Testing Library are not added.

*Alternative:* check component behaviour only by hand, as first planned. Rejected because the Storybook tests now exist, and they make the accessibility half of the design review (task 6.5) repeatable.

### 10. Storybook shows the app's themes and fonts

The font definitions move from `layout.tsx` into a shared `src/app/fonts.ts` that both the layout and `.storybook/preview.tsx` import, so stories render in the same faces. A toolbar global (Light, Dark, Sepia) drives a decorator that sets the same `dark` or `sepia` class on `<html>` that the app's theme effect sets (decision 2), so every story can be reviewed in all three themes without a separate theming path.

## Risks / Trade-offs

- **The fixture format may not survive the real ingest** → It is versioned (`format: 1`, path `v1/`), and the parser rejects unknown versions. If the ingest needs clause data, it adds fields (compatible) or bumps to v2 alongside a reader update in the same change.
- **260 static reader pages, nearly all showing "not yet available"** (superseded: pages are rendered by the server, so no empty shells are generated) → They are tiny shells, and generating them now means the ingest only adds JSON files with no route changes. The contents page could mark unavailable chapters, but that needs an availability index, so it waits for the ingest.
- **The Google Fonts download at build could fail in CI** → Next's font loader fails the build loudly rather than shipping without fonts. Retry, or vendor the files with `next/font/local` if it becomes flaky.
- **Base44 prototype licence** → The prototype is the user's own design work, so porting it raises no third-party licence question. Its bundled Bible data is not used (see proposal).
- **The theme script runs before React** → It is kept tiny, uses only `localStorage` and `classList`, and is wrapped in try/catch so a failure leaves the light theme in place.

## Migration Plan

No data or users exist yet. The change replaces the placeholder page. Rollback is a revert.

## Open Questions

- Whether book URLs should later gain human-readable slugs (`/read/philippians/1`) alongside codes. Adding redirects later does not change the specs.
