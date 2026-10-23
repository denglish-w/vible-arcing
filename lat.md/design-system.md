# Design system

The visual language every screen follows. The normative spec is `DESIGN.md` at the repo root. This section records where it lives and the rules that bind code.

## Source of truth

`DESIGN.md` holds the tokens and rules, `.impeccable/design.json` is its machine-readable sidecar, and `PRODUCT.md` holds users, positioning and principles.

`PRODUCT.md` also records the open decisions and the WCAG 2.2 AA and touch-tablet requirements every screen must meet.

Both were extracted from the Base44 prototype, whose source is kept unbuilt in `docs/design/base44-prototype/` as the visual reference. Where the prototype and `DESIGN.md` differ, `DESIGN.md` wins.

## Binding rules

Colours come only from tokens with light, dark and sepia values, and rubric red is the single accent in the chrome.

Type is serif-only (EB Garamond, with Gentium Plus for Greek in workspaces). Part-of-speech colours, and later relationship colours, always pair with a non-colour cue such as an underline style. Editor workspaces for diagramming and arcing share one treatment: a raised paper canvas with a dashed edge, a passage card below it and a floating tool palette. Renderers read the same CSS custom properties as the chrome, per [[architecture#One renderer-neutral model]].
