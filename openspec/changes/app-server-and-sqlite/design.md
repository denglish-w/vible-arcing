## Context

See proposal.md for why. The current state:

- `next.config.ts` sets `output: 'export'` and `images.unoptimized`. The `Dockerfile` builds `out/` and serves it from `nginx:stable-alpine` using `nginx.conf`. CI runs lint, format, test, build and `lat check`, then builds the image.
- Nothing persists yet. The foundation design (decision 8) planned IndexedDB through Dexie, plus file export and import. The validation module (foundation decision 7) is designed but not written.
- Node 26.5 is pinned. It ships `node:sqlite` (SQLite 3.53). Drizzle ORM 0.45.4, the current stable release, has no driver for it; the `drizzle-orm` 1.0 beta adds a `node-sqlite` driver. Drizzle's stable SQLite drivers are `better-sqlite3`, libsql, bun, expo, op-sqlite, durable objects and proxy.
- Next.js is 16.4. `next start` and the standalone `server.js` both listen on `0.0.0.0` by default, and `next start` is not supported with `output: 'standalone'` (it warns and points to `node .next/standalone/server.js`).
- The `base44-look-and-reader` change (not applied) assumes static pages and a client-side JSON loader.

## Goals / Non-Goals

**Goals:**

- One server process that serves pages, reads the corpus and stores saved work, runnable locally with `npm run dev` and no other services.
- Schemas defined once, in TypeScript, so moving to Postgres later is a schema rewrite with the queries kept, not a redesign.
- Keep the foundation's interaction rule: an edit never waits on the network.
- Users' saved work is never lost to a conflict, a failed migration or a corpus rebuild.
- An unauthenticated server is reachable from this computer only unless the operator opts in.

**Non-Goals:**

- Accounts, auth, sharing, multi-user ownership. These come with the accounts change, along with Postgres.
- The arcing and diagramming editors themselves. This change gives them storage and a save loop to plug into.
- File import. It comes with the arcing editor change, which owns the export/import round trip.
- The diagram data model. Diagrams get a table and an opaque, versioned document column. Their structure is a later change.
- Choosing a hosting provider.

## Decisions

### 1. Next.js as a Node server with standalone output

`next.config.ts` drops `output: 'export'` and `images.unoptimized`, adds `output: 'standalone'`, and lists `better-sqlite3` in `serverExternalPackages` so the bundler leaves the native module alone.

`npm start` runs `scripts/start.sh`, which exports `DATA_DIR="$PWD/data"` unless the caller set it, runs `scripts/migrate-app.ts` and exits if it fails, copies `public/` and `.next/static` into `.next/standalone` (standalone output does not include them), and runs `node .next/standalone/server.js` with `HOSTNAME` set to `BIND_ADDRESS`, or `127.0.0.1` when that is unset. An inherited `HOSTNAME` is not honoured, because Docker and some shells export it as the machine name, which would bind a network address. `npm run dev` passes `-H 127.0.0.1` for the same reason (decision 9).

Every route that reads either database is rendered per request: it calls `await connection()` before its first query. Without that, Next prerenders server components with no request-time API at build time, which would freeze `/work` at its build-time contents and make `next build` open databases that do not exist in CI. The build must succeed with no `data/` directory, and CI checks that. Actions that change saved work call `revalidatePath('/work')`.

*Alternative:* keep the static export and add a separate API service. Rejected: two deployables and an API layer for a single-user app, when Next.js already provides server actions and route handlers in the same process.

### 2. SQLite through Drizzle and `better-sqlite3`

Drizzle provides typed schemas, a query builder close to SQL, and migrations, and it targets Postgres with the same API. `better-sqlite3` is synchronous and fast, and Drizzle supports it directly.

- `app.sqlite` sets `journal_mode = WAL`, `busy_timeout = 5000` and `foreign_keys = ON`.
- `corpus.sqlite` is built with `journal_mode = DELETE` and opened with `{ readonly: true, fileMustExist: true }` and no journal pragma. WAL is not used for it: a read-only connection cannot switch modes, and swapping a WAL-mode file under a running reader can leave mismatched `-wal`/`-shm` files beside it, which corrupts it.

*Alternatives:*
- `node:sqlite`: no extra native dependency, but stable Drizzle cannot drive it, so we'd write SQL by hand and lose the shared schema. Revisit when `drizzle-orm` 1.0 (with its `node-sqlite` driver) is stable.
- libsql: also works with Drizzle, and its client can later point at a hosted Turso database. Rejected for now because it adds a client layer and a hosting-shaped choice we have deferred. Switching costs one import.
- Prisma: heavier, with a generated client and a separate schema language. Drizzle's TypeScript schema fits the rule that types come from one source.

### 3. Two database files

| File | Holds | Opened | Changed by |
|---|---|---|---|
| `data/corpus.sqlite` | books, chapters, words, attribution, build metadata | read-only, must exist | `npm run db:seed` only |
| `data/app.sqlite` | analyses, diagrams | read-write, must exist | `npm run db:migrate`, and server actions |

The directory comes from `DATA_DIR`, resolved once to an absolute path. Standalone `server.js` changes directory to `.next/standalone`, which also holds a copied `package.json`, so neither the working directory nor a search for `package.json` finds the project root there. `scripts/start.sh` and the Docker entrypoint therefore always set `DATA_DIR` explicitly (`$PWD/data` and `/app/data`). Without it, `src/db/paths.ts` uses `<cwd>/data` but refuses to start if the working directory is inside `.next/standalone`, naming the variable to set. `npm run dev` and the scripts run from the project root, so the default is right for them. `data/` is git-ignored and Docker-ignored.

Both clients open with `fileMustExist`, so a missing file is a clear startup error ("run `npm run db:migrate && npm run db:seed`") instead of `better-sqlite3` silently creating an empty database.

Saved work refers to words only by MACULA id, and there are no SQL joins across the two files. The app checks ids against the corpus in code (decision 5). The split is what enforces the spec's "corpus rebuild never touches saved work": the rebuild has no handle on `app.sqlite` at all.

*Alternative:* one file with both table sets. Rejected because a rebuild would have to delete and reload tables beside live user data, and a bug there destroys work.

### 4. Corpus format v1 and the corpus build

**Format.** The *Corpus format* requirement moves from `base44-look-and-reader` into `text/corpus-store`, because the store is now its only consumer. `src/lib/corpus/format.ts` holds the v1 types and the one `parseChapter()`; base44's planned `types.ts` and parser are dropped (task 8.3). A chapter file is `corpus/v1/<BOOK>/<chapter>.json` with a `format: 1` field and the chapter's words in reading order. `<BOOK>` is the upper-case code used throughout the store (for example `PHP`). Lower-casing for URLs is a routing concern. Three refinements to the v1 shape in `base44-look-and-reader` decision 6: `after` is everything between a word and the next (MACULA's punctuation plus the space SBLGNT puts after it, so joining `text + after` reproduces the text, with elision marks such as ’ in `after`); `gloss` is omitted when MACULA has none (one word in Philippians 1), and each `attribution.json` dataset also carries `modifications`, the text of its modification note, because the credits must say what was changed, not only that something was.

**Canonical books.** `src/lib/books.ts` lists the 27 New Testament books in canonical order with their codes and chapter counts. It moves here from `base44-look-and-reader` (which later adds names, Greek titles and groups to the same file) so the store can tell a chapter that does not exist from one that has not been ingested. The seed loads it into a `books` table.

**Location.** Ingest output is committed under `corpus/v1/` at the repo root, not under `public/`, because the browser no longer fetches it. Until the full ingest exists, that directory holds one sample chapter, Philippians 1, extracted with its real MACULA ids by `scripts/ingest/sample_chapter.py` (stdlib Python, field whitelist, pinned MACULA commit). The extraction moves into this change from `base44-look-and-reader` so the seed has real input from day one.

**Build.** `scripts/seed-corpus.ts` runs on Node 26 with native type stripping, so no `tsx` is needed. Every module it imports (`src/db/schema/*`, `src/db/paths.ts`, `src/lib/corpus/format.ts`, `src/lib/books.ts`) uses relative imports with explicit `.ts` extensions and no `@/` alias, has no `server-only` import, and uses only erasable TypeScript (no enums, namespaces or parameter properties; type-only imports written as `import type`). `tsconfig.json` gains `allowImportingTsExtensions` (with `noEmit`, already set), `verbatimModuleSyntax` and `erasableSyntaxOnly`, so type-checking catches non-erasable syntax and value-style type imports. A Vitest test checks the shared modules for the rules `tsc` cannot see: `@/` imports, extensionless relative imports and `server-only`. It:

1. Deletes any leftover `corpus.sqlite.tmp`, creates a new one with `journal_mode = DELETE`, and applies the corpus migrations to it.
2. Reads every chapter file and `attribution.json`, refusing any unknown `format` version by name. It inserts books, then one transaction per book of words. `seq` is derived here: chapter order, then position in the chapter's word array. It also fills `chapters`, `attribution` and a single `build` row (format, edition, MACULA commit, ingest output hash).
3. Runs `PRAGMA integrity_check` and closes the connection.
4. Removes any `corpus.sqlite-wal` and `corpus.sqlite-shm`, then renames the temp file over `corpus.sqlite`.

Any failure deletes the temp file and leaves the old store alone. Building from the same input twice gives identical rows in every table, because the ingest output is deterministic and the `build` row holds no timestamp.

The running server keeps its open handle on the old file (on POSIX the renamed-over file stays readable), so a swapped corpus is picked up on restart. That is acceptable at this stage. A file-watch reload can come later if rebuilds become frequent.

**Tables:**

- `books`: `code` (primary key), `seq`, `chapter_count`.
- `chapters`: `(book, chapter)` primary key and `word_count`. A row means "ingested".
- `words`: `id` (MACULA id, primary key), `book`, `chapter`, `verse`, `seq`, `text`, `after`, `lemma`, `pos`, and nullable `gloss`, `person`, `number`, `gender`, `case`, `tense`, `voice`, `mood` and `degree`. Indexed on `(book, chapter, seq)`.
- `attribution`: one row per dataset, with the fields from the attribution JSON, including `modifications`.
- `build`: a single row describing the build.

Clause and conjunction data are added by the ingest change as new tables or columns through new migrations. They are reference data only (see proposal). There is no UBS column to drop, because ingest never emits one, and a test asserts that no column name matches `ln` or `domain`.

### 5. Saved work as documents with a revision counter

App tables `analyses` and `diagrams` have the same shape and are kept separate on purpose:

`id` (UUID), `title`, `book`, `start_word_id`, `end_word_id`, `passage_label` (for example "Philippians 1:3–11"), `edition` ("SBLGNT"), `doc_version` (int), `doc` (JSON text), `revision` (int), `created_at`, `updated_at`.

`doc` holds the whole containment tree for an analysis, or the whole diagram. The tree is validated and edited as a unit, and splitting it into rows would gain nothing for single-user use while making the validation module work against SQL. In Postgres, this column becomes `jsonb`.

The server, not the client, fills `book`, `start_word_id`, `end_word_id` and `passage_label`:

- For an analysis, they are derived from the words in `doc`, and every word id in `doc` must exist in the corpus store.
- For a diagram, the client sends the passage range in the envelope, and the server checks both ids exist in the corpus. The words inside `doc` cannot be checked until the diagram model exists.

Limits on every write: `doc` at most 512 KB serialised, `doc_version` must be a version the server knows (1 for both kinds today), and `experimental.serverActions.bodySizeLimit` is set to `'1mb'` so the cap, not the framework, gives the error.

`revision` provides optimistic concurrency. A save sends the revision it was based on. The server updates only when it matches (`UPDATE … WHERE id = ? AND revision = ?`) and increments it, so a stale save changes nothing and is reported as a conflict.

### 6. Server boundary: server components read, server actions write

- The database core (`src/db/client.ts`, `src/db/corpus.ts`, `src/db/work.ts`) is plain TypeScript with no `server-only` import, so Vitest and the scripts can load it. Next-facing modules (`src/db/server.ts` re-exporting the queries, and the actions file) import `server-only`, and pages and actions import only those.
- Writes are server actions in `src/app/(work)/actions.ts`: `createAnalysis`, `saveAnalysis(id, baseRevision, doc)`, `deleteAnalysis`, and the diagram equivalents. Every action parses its input with zod. `saveAnalysis` runs the foundation's validation module and rejects invalid trees. `saveDiagram` checks the envelope and the limits in decision 5.
- Each action first calls `assertAllowedHost()` (decision 9).
- Each save action returns a typed result rather than throwing for expected cases: `{ ok: true, revision }`, `{ ok: false, reason: 'conflict', current }` (with the stored revision and `updated_at`), `{ ok: false, reason: 'invalid' | 'unknown-word' | 'not-found' | 'too-large' | 'corpus-missing' }`. Anything else is an unexpected error.
- Route handlers are used only for things a browser fetches on its own: `GET /api/analyses/[id]/export` downloads the portable file. It calls `assertAllowedHost()` (decision 9) and sends `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`.

### 7. Autosave controller and conflict handling

The save loop is a plain TypeScript controller, `createAutosave({ subscribe, getSnapshot, save, onStatus, unloadTarget })`, with no React or Zustand dependency, so it can be tested in the existing Vitest setup without a DOM library. A thin `useAutosave` hook wraps it for the editors and is exercised when the first editor lands.

- It sends at most one save at a time, debounced by 800 ms after the last change. Changes that arrive during a save trigger one follow-up save.
- It registers a `beforeunload` guard on `unloadTarget` while there are unsaved changes.
- Failures are split by kind:
  - **Retryable** (network error, unexpected server error, disk full): keep the changes, show "Not saved", retry with backoff (1 s, 2 s, 4 s, capped at 30 s).
  - **Conflict**: stop retrying and keep the changes. The status becomes "Changed in another tab or window", and the user chooses: overwrite (save again against the stored revision), save as a new copy (create a new record from the local document), or download the local copy as a file. Nothing is discarded unless the user chooses to reopen the stored version.
  - **Permanent** (invalid, unknown word, not found, too large, corpus not built): stop retrying, keep the changes, and show the reason with the download option. "Unknown word" can also happen to an existing analysis after a corpus update removes or renumbers a word; the message names the word id and says the analysis was made against an older corpus build, and the user can download it.

The editor state never waits on the action.

### 8. Pages in this change

- `/work` lists analyses and diagrams together, newest first, with delete-with-confirm.
- `/analysis/[id]` and `/diagram/[id]` exist so saved work can be reopened now. Until the editors land, they show the passage label, title and last-modified time. Each editor change replaces its placeholder.
- `/credits` renders `getAttribution()`: each dataset's name, licence, licence link, attribution statement and modification note, plus the non-affiliation statement. Every page that shows corpus text links to it. `base44-look-and-reader` restyles this page rather than adding a second one.
- A development page that shows Philippians 1 from the store exists only to satisfy the fresh-clone check (task 8.4); it is replaced by the reader.

### 9. Local-only server

Until accounts exist, anyone who can send a request can read and delete all saved work, so the server limits who can reach it:

- **Listening address.** `npm run dev`, `npm start` and the Docker image's documented run command bind to `127.0.0.1` (in Docker, the container listens on `0.0.0.0` and the documented command publishes `-p 127.0.0.1:3000:3000`).
- **Host check.** `src/lib/host.ts` exports `isAllowedHost(host)` and `assertAllowedHost()` (which reads `headers()`). A host is allowed if it is `localhost`, `127.0.0.1` or `[::1]` (any port), or if `ALLOW_UNAUTHENTICATED_NETWORK=1` is set and it is listed in `ALLOWED_HOSTS` (comma-separated). Both variables are read from the environment on each request, never from `next.config.ts`, which is frozen at build time. This blocks other machines that reach the port and DNS-rebinding pages, which the server-action Origin check alone does not stop.
- **Where it runs.** `src/proxy.ts` rejects disallowed hosts with 403 and has no matcher, so it covers every page, `/api` route and server action. Because the Next docs advise against relying on the proxy alone, every server action, the export route handler and `src/db/server.ts` also call `assertAllowedHost()`. `experimental.serverActions.allowedOrigins` is not used: it only adds origins and is fixed at build time.
- **Startup warning.** `src/instrumentation.ts` `register()` logs a warning when the opt-in is set, naming the allowed hosts and saying that anyone who can reach them can read and change all saved work.
- **IPv6.** The server binds to IPv4 `127.0.0.1`; the README says to open `http://127.0.0.1:3000` if a browser resolves `localhost` to `::1`.

*Alternative:* rely on documentation and the absence of a deploy target. Rejected: `next start` and standalone `server.js` listen on every interface by default, so the first run on shared wifi would expose all saved work.

### 10. App database migrations

App migrations are applied by `scripts/migrate-app.ts`, which uses `drizzle-orm/better-sqlite3/migrator` (a runtime dependency), not drizzle-kit, so the same script runs in development and in the Docker image. It:

1. Creates `app.sqlite` if it does not exist (the only place that may), with WAL.
2. If there are pending migrations and the file already has tables, creates `<DATA_DIR>/backups/` if needed, writes a backup with `VACUUM INTO` to the absolute path `<DATA_DIR>/backups/app-<UTC timestamp>.sqlite`, and keeps the last five.
3. Applies the migrations in one transaction and runs `PRAGMA quick_check`.
4. Exits non-zero on any failure, leaving the backup in place.

The Docker entrypoint and `scripts/start.sh` both run it first and do not start the server if it fails. The app client runs `PRAGMA quick_check` once on open and refuses to serve saved work if it fails, pointing at the backups. Backup and restore (stop the server, copy a backup over `app.sqlite`) are documented in `README.md`.

### 11. Container and CI

- `.dockerignore` adds `data/`, and `next.config.ts` sets `outputFileTracingExcludes` for `data/**`, so a developer's saved work cannot reach an image.
- `Dockerfile`: the build stage on `node:26-slim` runs `npm ci && npm run build`. The build stage also runs `npm prune --omit=dev` after building into a separate copy of `node_modules`, and the runtime stage on `node:26-slim` copies that production `node_modules` (for `drizzle-orm` and `better-sqlite3`), so a source build of the native module, if needed, happens only in the build stage. It also copies `.next/standalone`, `.next/static`, `public`, `drizzle/`, `corpus/v1/`, `scripts/` and the `src/` modules the scripts import. It declares `VOLUME /app/data`. The entrypoint runs `migrate-app.ts`, seeds the corpus if `corpus.sqlite` is missing or its `build` row's ingest hash differs from the shipped `corpus/v1/`, and then starts `server.js`. Both stages use the same glibc base, so the `better-sqlite3` binary matches.
- `nginx.conf` is deleted.
- CI adds: both drizzle-kit configs run through `npm run db:generate`, then `git status --porcelain drizzle/` must be empty, which also catches new untracked migration files. drizzle-kit may prompt when it cannot tell a rename from a drop-and-add; task 7.2 confirms how it behaves without a TTY and, if it can wait on a prompt, runs it with stdin closed and a timeout so CI fails instead of hanging. `npm run build` runs with no `data/` directory. Tests use `:memory:` databases with migrations applied.

### 12. Docs and superseded text

- `README.md`: running locally, the local-only warning and the opt-in setting, backup and restore.
- `CLAUDE.md`: stack, commands (`db:*`, `npm start`), project state, and the single-user warning.
- `lat.md/architecture.md`: replace "Static client-side app", "Toolchain" (the app no longer ships as static files), "Container and CI", "Editor state and persistence" and "Offline corpus ingest" (output goes to `corpus/v1/` and feeds the seed); add a local-only server section.
- `lat.md/corpus.md`: "Ingest pipeline" (the store is SQLite; drop "a database was rejected as premature").
- `discourse-analysis-foundation/design.md`: a superseded-by note on Context ("There is no application server"), the Goals line about static hosting, decisions 4 (its network rationale), 5, 7 ("no second trust boundary") and 8, and the risks "No server-side validation if sharing is added later" and "Next.js is more framework than a client-only editor strictly needs".
- `base44-look-and-reader`: see task 8.3.

`lat check` must pass.

## Risks / Trade-offs

- **Anyone who reaches the server can read and change all saved work** → It is reachable from this computer only by default (decision 9). Opting in is explicit and logged. The accounts change is the gate for any public deployment.
- **Native module (`better-sqlite3`) on Node 26** → Confirmed in task 1.2 (loaded on Node v26.5.0, darwin-arm64, SQLite 3.53.4): `better-sqlite3` 13.0.3 bundles prebuilt binaries (linux glibc and musl, darwin and win32, x64 and arm64) and has no install script, so nothing compiles on install. There is no install-time compile fallback either: on an unsupported platform the module installs but fails on first open, and needs a manual `npm run build-release` inside the package with node-gyp, `python3`, `make` and `g++`. `node:26-slim` on x64 or arm64 is covered. If this bites, switching to libsql is a one-file change.
- **Corpus swap needs a restart** → Documented next to `db:seed`. It is acceptable while rebuilds are rare and manual.
- **Postgres migration is a schema rewrite** → Schemas are small and isolated in `src/db/schema/`. JSON columns map to `jsonb`, and the queries use Drizzle's dialect-neutral builder. Raw SQL is limited to the PRAGMAs, `VACUUM INTO` and the revision-checked update.
- **Saving depends on the validation module, which doesn't exist yet** → See the migration plan for ordering.
- **Server rendering makes the reader depend on the server being up** → Inherent to the choice. Pages stay light, and the corpus is local, so latency is a single in-process SQLite read.
- **The diagram table's shape may change** → Kept now so saved work has both kinds from the start. `doc_version` and the size cap bound what can be stored; a later shape change is a migration.

## Migration Plan

1. Apply this change before `base44-look-and-reader`. Then revise that change (task 8.3): the reader reads chapters in a server component, its static `generateStaticParams` and client JSON loader are dropped, and corpus format v1 is consumed through the store.
2. Analysis saving (task group 6) needs the validation module from `discourse-analysis-foundation`. If that module isn't written when apply reaches group 6, stop there and build the validation module first. The other groups do not depend on it.
3. There is no user data to migrate when this change ships. Later schema changes go through decision 10, which backs up before migrating. To roll back this change itself, revert the commit and restore `output: 'export'`; any saved work stays in `data/app.sqlite` and can be exported first.

## Open Questions

- Whether diagrams should share a generic "document" table with a `kind` column once both editors exist. Keeping them separate now satisfies the spec. Merging later is a migration, not a behaviour change.
