# Architecture

The static Next.js app provides a themed Greek reader and sample corpus. The editor and discourse model are still planned in `openspec/changes/discourse-analysis-foundation/design.md`.

## Node server

A Next.js App Router app built with standalone output and run as one Node process, which serves pages, reads the corpus store and keeps saved work.

[[next.config.ts]] sets `output: 'standalone'` and leaves `better-sqlite3` to Node. `npm start` runs [[scripts/start.sh]], which makes `DATA_DIR` absolute (standalone `server.js` runs from `.next/standalone`), migrates the saved-work database and refuses to start if that fails, copies `public/` and `.next/static` into the standalone output, and listens on `BIND_ADDRESS` or `127.0.0.1`. An inherited `HOSTNAME` is not honoured, because Docker and some shells set it to the machine name. `npm run dev` also binds `127.0.0.1`.

## Local-only server

Until accounts exist, anyone who can send a request can read and delete all saved work, so the server answers only requests addressed to this computer.

[[src/lib/host.ts#isAllowedHost]] allows `localhost`, `127.0.0.1` and `[::1]` on any port, plus `ALLOWED_HOSTS` only when `ALLOW_UNAUTHENTICATED_NETWORK=1`, reading both from the environment on every call. Only the Host header counts; `X-Forwarded-Host` is ignored because a DNS-rebinding page can send it. [[src/proxy.ts#proxy]] has no matcher and returns 403 for any other host, including for static files and server actions. [[src/db/server.ts#appDb]] and [[src/db/server.ts#corpusDb]] check again before opening a database, and [[src/instrumentation.ts#register]] warns at startup when the opt-in is set. Pages on other local ports pass the Host check, so route handlers that touch saved work must also check `Origin`.

## Toolchain

npm manages packages with a committed `package-lock.json`, Node is pinned to the 26 line in `.node-version` for fnm, Vitest runs the tests, oxlint lints, Prettier formats, and Tailwind v4 styles the application chrome.

Bun and pnpm were rejected because the app ships as static files, so there is no runtime to speed up and Next.js builds run on Node regardless. The shared valid and invalid analysis fixtures run under Vitest. Renderer colours come from CSS custom properties in the Tailwind theme rather than utility classes, so the SVG renderers stay independent of Tailwind. `@types/node` tracks the Node major so it satisfies Vitest's peer range. A Husky pre-push hook runs the lint and Prettier checks before code leaves the machine. ESLint is not used: oxlint's `.oxlintrc.json` enables the typescript, react, nextjs, jsx-a11y and vitest plugins, and the hook rules are set to error.

Storybook 10 (`@storybook/nextjs-vite`) is the component workshop. Its config is in `.storybook/`, stories sit next to their components as `*.stories.tsx` under `src/`, and `npm run build-storybook` runs in CI. Vite does not run the Turbopack CSS loader, so `.storybook/main.ts` adds `@tailwindcss/vite`. The a11y addon fails a story on axe violations to back the WCAG 2.2 AA requirement in `PRODUCT.md`.

The Storybook Vitest addon makes every story a test: `vitest.config.mts` has a `unit` project in Node and a `storybook` project that renders each story in headless Chromium through Playwright, so `npm test` fails on a crashing story, a failed play function or an axe violation. CI installs Chromium before the tests. The MCP addon serves story metadata and preview URLs to coding agents at `/mcp` while `npm run storybook` runs.

## Container and CI

A GitHub Actions workflow checks every push and pull request, then builds a Docker image that serves the static export with nginx.

The `check` job runs lint, the Prettier check, tests, the build, the Storybook build and `lat check` on the Node version in `.node-version`. The `image` job runs only after it passes and builds the `Dockerfile` without pushing. The Dockerfile builds on `node:26-slim` and copies `out/` into `nginx:stable-alpine`, with `nginx.conf` resolving the export's `route.html` files and caching hashed assets. Where the image is published and deployed is undecided.

## Editor state and persistence

Editing is a rapid sequence of small structural edits, so every edit resolves locally and saving happens in the background.

State is an immutable [[proposition-model#Containment tree]] held in a store (Zustand with Immer, or a reducer), with undo and redo as a history of snapshots or patches; the editors are not built yet. Saved work lives in `data/app.sqlite`, apart from the read-only corpus store. [[src/db/work.ts]] stores analyses and diagrams as documents with a revision counter: a save based on an older revision changes nothing and reports a conflict, and the server derives each record's passage from the words it refers to, which must all exist in the corpus. [[src/lib/autosave.ts#createAutosave]] is the editors' save loop: one save at a time after a short debounce, backoff for retryable failures, and a stop on conflicts or permanent refusals that waits for the user to overwrite, save a copy or download. It guards leaving the page while changes are unsaved.

## One renderer-neutral model

Arcing and bracketing consume the same model with no transformation. Both render as SVG, and canvas is only considered if profiling demands it.

See [[domain#One model, two renderings]]. The arc renderer reads nesting depth to stack arcs; the bracket renderer reads the same nesting as indentation.

## Single validation module

Structural rules live in one pure TypeScript module used by both the editor and the import path.

Contiguity, arity, acyclicity and the Bilateral one-per-side constraint are enforced on every edit, so an invalid edit is refused instantly. Imported analyses pass through the same module. The module has no browser dependencies, so a future save or share endpoint can run it in Node. Rules are driven by the [[taxonomy-data#Shared taxonomy JSON]] rather than hand-written branches, and a shared fixture set of valid and invalid analyses is run by the unit tests.

## Offline corpus ingest

Python is used only for a release-time script that converts MACULA Greek XML into compact static JSON.

[[scripts/ingest/sample_chapter.py]] extracts a pinned Philippians 1 from `SBLGNT/lowfat` into versioned chapter JSON. Nothing in the request path parses XML. See [[corpus#Ingest pipeline]] and [[reader#Greek reader]] for the format and consumer.
