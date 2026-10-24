# Architecture

A Next.js server provides a themed Greek reader, a SQLite corpus store with sample data, and storage for saved work. The editor and discourse model are still planned in `openspec/changes/discourse-analysis-foundation/design.md`.

## Node server

A Next.js App Router app built with standalone output and run as one Node process, which serves pages, reads the corpus store and keeps saved work.

[[next.config.ts]] sets `output: 'standalone'` and leaves `better-sqlite3` to Node. `npm start` runs [[scripts/start.sh]], which makes `DATA_DIR` absolute (standalone `server.js` runs from `.next/standalone`), migrates the saved-work database and refuses to start if that fails, copies `public/` and `.next/static` into the standalone output, and listens on `BIND_ADDRESS` or `127.0.0.1`. An inherited `HOSTNAME` is not honoured, because Docker and some shells set it to the machine name. `npm run dev` also binds `127.0.0.1`.

## Local-only server

Until accounts exist, anyone who can send a request can read and delete all saved work, so the server answers only requests addressed to this computer.

[[src/lib/host.ts#isAllowedHost]] allows `localhost`, `127.0.0.1` and `[::1]` on any port, plus `ALLOWED_HOSTS` only when `ALLOW_UNAUTHENTICATED_NETWORK=1`, reading both from the environment on every call. Only the Host header counts; `X-Forwarded-Host` is ignored because a DNS-rebinding page can send it. [[src/proxy.ts#proxy]] has no matcher and returns 403 for any other host, including for static files and server actions. [[src/db/server.ts#appDb]] and [[src/db/server.ts#corpusDb]] check again before opening a database, and [[src/instrumentation.ts#register]] warns at startup when the opt-in is set. Pages on other local ports pass the Host check, so route handlers that touch saved work must also check `Origin`.

## Toolchain

npm manages packages with a committed `package-lock.json`, Node is pinned to the 26 line in `.node-version` for fnm, Vitest runs the tests, oxlint lints, Prettier formats, and Tailwind v4 styles the application chrome.

Bun and pnpm were rejected because the server runs on Node regardless (the scripts rely on Node's built-in type stripping and `better-sqlite3` is a Node native module), so a different package manager or runtime would add nothing. The shared valid and invalid analysis fixtures run under Vitest. Renderer colours come from CSS custom properties in the Tailwind theme rather than utility classes, so the SVG renderers stay independent of Tailwind. `@types/node` tracks the Node major so it satisfies Vitest's peer range. A Husky pre-push hook runs the lint and Prettier checks before code leaves the machine. ESLint is not used: oxlint's `.oxlintrc.json` enables the typescript, react, nextjs, jsx-a11y and vitest plugins, and the hook rules are set to error.

Storybook 10 (`@storybook/nextjs-vite`) is the component workshop. Its config is in `.storybook/`, stories sit next to their components as `*.stories.tsx` under `src/`, and `npm run build-storybook` runs in CI. Vite does not run the Turbopack CSS loader, so `.storybook/main.ts` adds `@tailwindcss/vite`. The a11y addon fails a story on axe violations to back the WCAG 2.2 AA requirement in `PRODUCT.md`.

The Storybook Vitest addon makes every story a test: `vitest.config.mts` has a `unit` project in Node and a `storybook` project that renders each story in headless Chromium through Playwright, so `npm test` fails on a crashing story, a failed play function or an axe violation. CI installs Chromium before the tests. The MCP addon serves story metadata and preview URLs to coding agents at `/mcp` while `npm run storybook` runs.

## Container and CI

A GitHub Actions workflow checks every push and pull request, then builds a Docker image that runs the standalone server.

The `check` job runs on the Node version in `.node-version`. It first runs `npm run db:generate` for both drizzle-kit configs, with stdin closed and a timeout, and fails if `git status --porcelain drizzle/` shows anything, so a schema change without a committed migration cannot merge. drizzle-kit exits 0 when it needs a prompt answer it cannot get without a terminal (a possible column rename) and only prints an error, so the job also fails on that message. It then runs lint, the Prettier check, tests (after installing Chromium for the Storybook project), the build with no `data/` directory so a build that opens a database fails, the Storybook build and `lat check`. The `image` job runs only after it passes. It builds the `Dockerfile` without pushing, then starts the container on an empty data volume and requires `/credits` to show the SBLGNT notice and a foreign `Host` to get 403, so a COPY list that has drifted from what the scripts import fails CI.

The Dockerfile has three stages on the same `node:26-slim` glibc base, so the `better-sqlite3` prebuilt binary matches: a production-only `npm ci`, the Next.js build, and the runtime. The runtime copies the standalone server, static assets, `drizzle/`, `corpus/v1/`, the scripts and the `src/` modules they import, and declares `VOLUME /app/data`. [[scripts/docker-entrypoint.sh]] sets `DATA_DIR=/app/data`, runs [[scripts/migrate-app.ts]], runs [[scripts/seed-if-stale.ts]] (which rebuilds the corpus store only when it is missing or its build row's ingest hash differs from the shipped input) and then starts the server on every interface. Any failing step stops the container before the server starts. `.dockerignore` and `outputFileTracingExcludes` keep `data/` out of the image. The documented run command publishes the port on `127.0.0.1` only. Where the image is published and deployed is undecided.

## Editor state and persistence

Editing is a rapid sequence of small structural edits, so every edit resolves locally and saving happens in the background.

State is an immutable [[proposition-model#Containment tree]] held in a store (Zustand with Immer, or a reducer), with undo and redo as a history of snapshots or patches; the editors are not built yet. Saved work lives in `data/app.sqlite`, apart from the read-only corpus store. [[src/db/work.ts]] stores analyses and diagrams as documents with a revision counter: a save based on an older revision changes nothing and reports a conflict, and the server derives each record's passage from the words it refers to, which must exist in the corpus and form a continuous run in reading order; a stale or deleted record is reported before content problems. [[src/lib/autosave.ts#createAutosave]] is the editors' save loop: one save at a time after a short debounce, backoff for retryable failures, and a stop on conflicts or permanent refusals that waits for the user to overwrite, save a copy or download. It guards leaving the page while changes are unsaved.

## Saved-work routes

Saved work is reached through server actions, a list page and a download route, all of which re-check the Host before touching the database.

[[src/app/(work)/actions.ts]] creates, saves and deletes analyses and diagrams. Each action parses its input with zod, returns a typed result rather than throwing, and revalidates `/work`. `/work` lists both kinds newest first with delete-with-confirm, and `/analysis/[id]` and `/diagram/[id]` are placeholders until the editors exist; every page that reads a database calls `connection()` so it renders per request. The list, confirmation and credits blocks are presentational components that take records as props, so their Storybook stories need no database.

`GET /api/analyses/[id]/export` returns the portable file (passage, edition, document version and content) as an attachment with `nosniff`. Because pages on other local ports pass the Host check, it also requires an `Origin` matching the Host, or no `Origin` with `Sec-Fetch-Site` of `same-origin` or `none`; anything else gets 403.

## One renderer-neutral model

Arcing and bracketing consume the same model with no transformation. Both render as SVG, and canvas is only considered if profiling demands it.

See [[domain#One model, two renderings]]. The arc renderer reads nesting depth to stack arcs; the bracket renderer reads the same nesting as indentation.

## Single validation module

Structural rules live in one pure TypeScript module, used by the save path now and by the editor and import path once they exist.

[[src/lib/analysis/validate.ts#validateAnalysis]] checks contiguity, containment (a node sits in at most one connection), arity, supporter and direction rules, acyclicity and the Bilateral one-per-side constraint, and returns typed errors with a code, a message and the ids involved. It has no browser or Node-only dependencies, so the editor can call it on every edit and the server runs it before storing. [[src/db/work.ts]] takes it as an injected `analysisProblems` dependency and runs it before the word-id checks, so a refused save leaves the stored copy unchanged. Arity, supporter and direction rules are read from the [[taxonomy-data#Shared taxonomy JSON]] rather than hand-written branches. [[src/lib/analysis/fixtures.ts]] holds valid and invalid analyses, each invalid one with its exact expected error codes, and the unit tests run all of them.

## Offline corpus ingest

Python is used only for a release-time script that converts MACULA Greek XML into compact versioned JSON under `corpus/v1/`, which `npm run db:seed` loads into SQLite.

[[scripts/ingest/sample_chapter.py]] extracts a pinned Philippians 1 from `SBLGNT/lowfat` into versioned chapter JSON. Nothing in the request path parses XML, and the browser never fetches the JSON: the server reads the store. See [[corpus#Ingest pipeline]] and [[reader#Greek reader]] for the format and consumer.
