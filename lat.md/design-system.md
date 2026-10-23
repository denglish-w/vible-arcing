# Design system

The visual language every screen follows. The normative spec is `DESIGN.md` at the repo root. This section records where it lives and the rules that bind code.

## Source of truth

`DESIGN.md` holds the tokens and rules, `.impeccable/design.json` is its machine-readable sidecar, and `PRODUCT.md` holds users, positioning and principles.

`PRODUCT.md` also records the open decisions and the WCAG 2.2 AA and touch-tablet requirements every screen must meet.

Both were extracted from the Base44 prototype, whose source is kept unbuilt in `docs/design/base44-prototype/` as the visual reference. Where the prototype and `DESIGN.md` differ, `DESIGN.md` wins.

## Binding rules

Colours come only from tokens with light, dark and sepia values, and rubric red is the single accent in the chrome.

Type is serif-only (EB Garamond, with Gentium Plus for Greek in workspaces). Part-of-speech colours, and later relationship colours, always pair with a non-colour cue such as an underline style. Editor workspaces for diagramming and arcing share one treatment: a raised paper canvas with a dashed edge, a passage card below it and a floating tool palette. Renderers read the same CSS custom properties as the chrome, per [[architecture#One renderer-neutral model]].

## Implemented theme

Full-colour CSS tokens supply light, dark and sepia themes to the static pages and reader, with a shared logo and attribution footer.

[[src/app/globals.css]] maps tokens into Tailwind v4 and defines the serif typography, hairline rules, warm shadows and responsive layouts. [[src/app/fonts.ts]] self-hosts EB Garamond, Gentium Plus, Cardo and GFS Didot through Next fonts, including polytonic Greek. Only EB Garamond is preloaded; [[src/app/layout.tsx#RootLayout]] applies the font variables. Every text token reaches 4.5:1 contrast against the page and card in each theme, so several values are darker than the prototype's, and sepia has its own part-of-speech colours. Links are underlined, because Tailwind's preflight removes the underline and colour alone does not mark a link in running text. [[src/components/site-shell.tsx#PageShell]] provides the content-page chrome; [[src/components/site-shell.tsx#SiteFooter]] links to metadata-driven credits on every page. See [[reader#Browser settings]] for theme persistence.

Storybook renders stories in the same fonts, and its Theme toolbar (Light, Dark, Sepia) sets the same `<html>` class as the app's theme sync, so every story can be reviewed in each theme. See `.storybook/preview.tsx`.
