# Architecture

How the app is built and where code runs. The Next.js app is scaffolded, but the editor, proposition model and ingest are not built yet. The design is in `openspec/changes/discourse-analysis-foundation/design.md`.

## Static client-side app

A Next.js App Router app exported as static files, with no application server. The editor runs entirely in the browser.

The build uses `output: 'export'` so it can be hosted on any static host, which keeps the project free to run, and writes the site to `out/`. Images use `images.unoptimized` because the default loader needs a server, and `cacheComponents` is left off. Server components and server actions are not relied on. If the framework becomes a burden, the app should remain portable to a plain SPA.

## Toolchain

npm manages packages with a committed `package-lock.json`, Node is pinned to the 26 line in `.node-version` for fnm, Vitest runs the tests, oxlint lints, Prettier formats, and Tailwind v4 styles the application chrome.

Bun and pnpm were rejected because the app ships as static files, so there is no runtime to speed up and Next.js builds run on Node regardless. The shared valid and invalid analysis fixtures run under Vitest. Renderer colours come from CSS custom properties in the Tailwind theme rather than utility classes, so the SVG renderers stay independent of Tailwind. `@types/node` tracks the Node major so it satisfies Vitest's peer range. A Husky pre-push hook runs the lint and Prettier checks before code leaves the machine. ESLint is not used: oxlint's `.oxlintrc.json` enables the typescript, react, nextjs, jsx-a11y and vitest plugins, and the hook rules are set to error.

Storybook 10 (`@storybook/nextjs-vite`) is the component workshop. Its config is in `.storybook/`, stories sit next to their components as `*.stories.tsx` under `src/`, and `npm run build-storybook` runs in CI. Vite does not run the Turbopack CSS loader, so `.storybook/main.ts` adds `@tailwindcss/vite`. The a11y addon fails a story on axe violations to back the WCAG 2.2 AA requirement in `PRODUCT.md`.

The Storybook Vitest addon makes every story a test: `vitest.config.mts` has a `unit` project in Node and a `storybook` project that renders each story in headless Chromium through Playwright, so `npm test` fails on a crashing story, a failed play function or an axe violation. CI installs Chromium before the tests. The MCP addon serves story metadata and preview URLs to coding agents at `/mcp` while `npm run storybook` runs.

## Container and CI

A GitHub Actions workflow checks every push and pull request, then builds a Docker image that serves the static export with nginx.

The `check` job runs lint, the Prettier check, tests, the build, the Storybook build and `lat check` on the Node version in `.node-version`. The `image` job runs only after it passes and builds the `Dockerfile` without pushing. The Dockerfile builds on `node:26-slim` and copies `out/` into `nginx:stable-alpine`, with `nginx.conf` resolving the export's `route.html` files and caching hashed assets. Where the image is published and deployed is undecided.

## Editor state and persistence

Editing is a rapid sequence of small structural edits, so every edit must resolve locally with no network round-trip.

State is an immutable [[proposition-model#Containment tree]] held in a store (Zustand with Immer, or a reducer). Undo and redo are a history of snapshots or patches. Analyses persist in IndexedDB (Dexie) and are portable through file export and import. A server-side store, accounts and sync are deliberately later work.

## One renderer-neutral model

Arcing and bracketing consume the same model with no transformation. Both render as SVG, and canvas is only considered if profiling demands it.

See [[domain#One model, two renderings]]. The arc renderer reads nesting depth to stack arcs; the bracket renderer reads the same nesting as indentation.

## Single validation module

Structural rules live in one pure TypeScript module used by both the editor and the import path.

Contiguity, arity, acyclicity and the Bilateral one-per-side constraint are enforced on every edit, so an invalid edit is refused instantly. Imported analyses pass through the same module. The module has no browser dependencies, so a future save or share endpoint can run it in Node. Rules are driven by the [[taxonomy-data#Shared taxonomy JSON]] rather than hand-written branches, and a shared fixture set of valid and invalid analyses is run by the unit tests.

## Offline corpus ingest

Python is used only for a release-time script that converts MACULA Greek XML into compact static JSON.

The script in `scripts/ingest/` reads the `SBLGNT/lowfat` trees (about 13 MB per book) and writes per-book JSON to `public/corpus/`. Nothing in the request path parses XML. See [[corpus#Ingest pipeline]] for what the output contains and what is enforced at ingest.
