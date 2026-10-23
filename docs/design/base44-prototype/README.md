# Base44 prototype (design reference)

Source of the design prototype built in Base44 and exported on 2026-10-22. It is kept here as the visual reference that `DESIGN.md` (repo root) was extracted from. It is **not built, linted or imported** by the app.

- Stack: TanStack Start, React 19, plain JSX, Tailwind v3, shadcn/ui, Base44 SDK.
- Tokens: `src/index.css` (HSL triples for light, `.dark` and `.sepia`) and `tailwind.config.js`.
- Screens worth reading: `src/routes/` (contents, book, reader, credits), `src/components/reading/` (reader, word bubble, display menu), `src/components/diagramming/` and `src/components/reading/DiagrammingScreen.jsx` (diagram workspace), `src/lib/pos.js` and `src/lib/study-defaults.js` (part-of-speech categories and display settings).

`screenshots/` holds light-theme captures of the running prototype, taken 2026-10-22 and cropped to the app: `01-contents`, `02-book-chapters`, `03-reader`, `04-reader-word-bubble`, `05-reader-pos-colour`, `06-reader-colour-english`, `07-learning-mode`, and the menu drawer in each theme (`08-menu-drawer-light`, `09-menu-drawer-dark`, `10-menu-drawer-sepia`). `11-diagramming-empty` and `12-new-diagram-dialog` show the diagramming entry point and passage picker. The diagram canvas is not captured: it is rough and will be redesigned in its own change.

`10-menu-drawer-sepia` does **not** match the exported code. Something recoloured the whole page: the drawer renders `#ffffcc` where the `.sepia` tokens give `#eadecd`, and every accent, including the hard-coded red Chi Rho, turns brown. It may be a newer Base44 version or a browser extension. The exported code's sepia is the canonical one (decided 2026-10-22), so use the tokens in `DESIGN.md`, not this screenshot, for sepia colours. Light and dark were checked against the code pixel by pixel and match.

Left out of the copy: `public/data/` (bundled Bible data with positional word ids, which this project does not use), `base44/` entity configs, `wrangler.jsonc`, `vite.config.js`, the lockfile and the Base44 docs.

When porting, follow `DESIGN.md` over this code wherever they differ. In particular, the diagramming screen's hard-coded hex colours become workspace tokens, and its background photo (hosted on Base44's servers) is not used.
