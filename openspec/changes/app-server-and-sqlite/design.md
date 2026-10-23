## Context

See proposal.md for why. The current state:

- `next.config.ts` sets `output: 'export'` and `images.unoptimized`. The `Dockerfile` builds `out/` and serves it from `nginx:stable-alpine` using `nginx.conf`. CI runs lint, format, test, build and `lat check`, then builds the image.
- Nothing persists yet. The foundation design (decision 8) planned IndexedDB through Dexie, plus file export and import. The validation module (foundation decision 7) is designed but not written.
- Node 26.5 is pinned. It ships `node:sqlite` (SQLite 3.53), but Drizzle ORM 0.45.4 has no driver for it. Drizzle's SQLite drivers are `better-sqlite3`, libsql, bun, expo, op-sqlite, durable objects and proxy.
- The `base44-look-and-reader` change (not applied) assumes static pages and a client-side JSON loader.

## Goals / Non-Goals

**Goals:**

- One server process that serves pages, reads the corpus and stores saved work, runnable locally with `npm run dev` and no other services.
- Schemas defined once, in TypeScript, so moving to Postgres later is a schema rewrite with the queries kept, not a redesign.
- Keep the foundation's interaction rule: an edit never waits on the network.

**Non-Goals:**

- Accounts, auth, sharing, multi-user ownership. These come with the accounts change, along with Postgres.
- The arcing and diagramming editors themselves. This change gives them storage and a save loop to plug into.
- The diagram data model. Diagrams get a table and an opaque, versioned document column. Their structure is a later change.
- Choosing a hosting provider.

## Decisions

### 1. Next.js as a Node server with standalone output

`next.config.ts` drops `output: 'export'` and `images.unoptimized`, adds `output: 'standalone'`, and lists `better-sqlite3` in `serverExternalPackages` so the bundler leaves the native module alone. `npm start` runs the standalone server. Pages that read the corpus are server components rendered on request. A page can still opt into static rendering where its data never changes, such as the contents page.

*Alternative:* keep the static export and add a separate API service. Rejected: two deployables and an API layer for a single-user app, when Next.js already provides server actions and route handlers in the same process.

### 2. SQLite through Drizzle and `better-sqlite3`

Drizzle provides typed schemas, a query builder close to SQL, and drizzle-kit migrations, and it targets Postgres with the same API. `better-sqlite3` is synchronous and fast, and Drizzle supports it directly. Both connections set `journal_mode = WAL` and `busy_timeout = 5000`. The app database also sets `foreign_keys = ON`.

*Alternatives:*
- `node:sqlite`: no extra native dependency, but Drizzle cannot drive it, so we'd write SQL by hand and lose the shared schema for the Postgres move. Revisit when Drizzle adds a driver.
- libsql: also works with Drizzle, and its client can later point at a hosted Turso database. Rejected for now because it adds a client layer and a hosting-shaped choice we have deferred. Switching costs one import.
- Prisma: heavier, with a generated client and a separate schema language. Drizzle's TypeScript schema fits the rule that types come from one source.

### 3. Two database files

| File | Holds | Opened | Changed by |
|---|---|---|---|
| `data/corpus.sqlite` | words, chapters, attribution, build metadata | read-only (`{ readonly: true }`) | `npm run db:seed` only |
| `data/app.sqlite` | analyses, diagrams | read-write | the running app, through migrations and server actions |

The directory comes from `DATA_DIR`, defaulting to `./data`, and `data/*.sqlite*` is git-ignored. Saved work refers to words only by MACULA id, so nothing ever joins across the two files. The split is what enforces the spec's "corpus rebuild never touches saved work": the rebuild has no handle on `app.sqlite` at all.

*Alternative:* one file with both table sets. Rejected because a rebuild would have to delete and reload tables beside live user data, and a bug there destroys work.

### 4. Corpus build: fresh file, then atomic swap

Ingest output is committed under `corpus/v1/` at the repo root, not under `public/`, because the browser no longer fetches it. Until the full ingest exists, that directory holds one sample chapter, Philippians 1, extracted with its real MACULA ids by `scripts/ingest/sample_chapter.py` (stdlib Python, field whitelist, pinned MACULA commit). The extraction moves into this change from `base44-look-and-reader` so the seed has real input from day one.

`scripts/seed-corpus.ts` runs on Node 26 with native type stripping, so no `tsx` is needed. It:

1. Creates `data/corpus.sqlite.tmp` and applies the corpus migrations to it.
2. Reads the ingest JSON (corpus format v1, defined in `base44-look-and-reader`) and refuses any unknown `format` version. It inserts in one transaction per book, plus the `chapters` and `attribution` tables and a `build` row (format, edition, MACULA commit, ingest output hash).
3. Runs `PRAGMA integrity_check`, then renames the temp file over `corpus.sqlite`.

Any failure deletes the temp file and leaves the old store alone. Building from the same input twice gives identical rows, because the ingest output is deterministic and no build timestamp goes into the content tables.

The running server keeps its open handle on the old file, so a swapped corpus is picked up on restart. That is acceptable at this stage. A file-watch reload can come later if rebuilds become frequent.

Corpus tables:

- `words`: `id` (MACULA id, primary key), `book`, `chapter`, `verse`, `seq` (canonical order within the book), `text`, `after`, `lemma`, `gloss`, `pos`, and nullable `person`, `number`, `gender`, `case`, `tense`, `voice`, `mood` and `degree`. Indexed on `(book, chapter, seq)`.
- `chapters`: `(book, chapter)` primary key and `word_count`. This answers "is this chapter ingested".
- `attribution`: one row per dataset, with the fields from the attribution JSON.
- `build`: a single row describing the build.

Clause and conjunction data are added by the ingest change as new tables or columns through new migrations. There is no UBS column to drop, because ingest never emits one, and a test asserts that no column name matches `ln` or `domain`.

### 5. Saved work as documents with a revision counter

App tables `analyses` and `diagrams` have the same shape and are kept separate on purpose:

`id` (UUID), `title`, `book`, `start_word_id`, `end_word_id`, `passage_label` (for example "Philippians 1:3–11"), `edition` ("SBLGNT"), `doc_version` (int), `doc` (JSON text), `revision` (int), `created_at`, `updated_at`.

`doc` holds the whole containment tree for an analysis, or the whole diagram. The tree is validated and edited as a unit, and splitting it into rows would gain nothing for single-user use while making the validation module work against SQL. In Postgres, this column becomes `jsonb`.

`revision` provides optimistic concurrency. A save sends the revision it was based on, and the server rejects a stale one. Two tabs editing the same analysis then get a "changed elsewhere, reload" notice instead of silently overwriting each other.

### 6. Server boundary: server components read, server actions write

- Corpus reads are plain functions in `src/db/corpus.ts`, imported only by server components (guarded with `import "server-only"`).
- Writes are server actions in `src/app/(work)/actions.ts`: `createAnalysis`, `saveAnalysis(id, baseRevision, doc)`, `deleteAnalysis`, and the diagram equivalents. Every action parses its input with zod. `saveAnalysis` also runs the foundation's validation module and rejects invalid trees. `saveDiagram` checks only the envelope (passage, `doc_version`, and that `doc` is an object) until the diagram model exists.
- Route handlers are used only for things a browser fetches on its own: `GET /api/analyses/[id]/export` downloads the portable file.

### 7. Autosave loop on the client

A `useAutosave(store, save)` hook subscribes to the editor's Zustand store. It sends at most one save at a time, debounced by 800 ms after the last edit. If more edits arrive while a save is in flight, it sends one follow-up save. On failure it keeps the dirty flag, shows "Not saved", and retries with backoff (1 s, 2 s, 4 s, capped at 30 s). It registers a `beforeunload` guard while dirty. The editor state never waits on the action. The hook is tested in Vitest against a fake store and a fake save function, so the spec scenarios are covered before any editor exists.

### 8. Saved-work list and placeholder open page

`/work` lists analyses and diagrams together, newest first, with delete-with-confirm. `/analysis/[id]` and `/diagram/[id]` exist so saved work can be reopened now. Until the editors land, they show the passage label, title and last-modified time. Each editor change replaces its placeholder.

### 9. Container and CI

- `Dockerfile`: the build stage on `node:26-slim` runs `npm ci && npm run build`. The runtime stage on `node:26-slim` copies `.next/standalone`, `.next/static`, `public` and the `drizzle/` migrations. It declares `VOLUME /app/data`, and an entrypoint runs app migrations and then starts `server.js`. The corpus is seeded into the volume by a one-off `npm run db:seed` run. Both stages use the same glibc base, so the `better-sqlite3` prebuilt binary matches. `nginx.conf` is deleted.
- CI adds `npm run db:generate` followed by `git diff --exit-code drizzle/`, which fails if a schema change has no committed migration. Tests use `:memory:` databases with migrations applied.

### 10. Docs

`CLAUDE.md` (stack, commands, scope: diagramming in), `lat.md/architecture.md` (replace "Static client-side app", "Editor state and persistence" and "Container and CI"), `lat.md/corpus.md` (ingest output feeds the seed, and the store is SQLite), and in `discourse-analysis-foundation/design.md` a note on decisions 5 and 8 pointing here. `lat check` must pass.

## Risks / Trade-offs

- **Anyone who reaches the server can read and change all saved work** → The README and the deployment section in `lat.md` say "local or private use only". There is no deploy target in CI. The accounts change is the gate for any public deployment.
- **Native module (`better-sqlite3`) on Node 26** → It ships prebuilt binaries, and if they are missing for a platform, npm compiles from source (needs build tools). If this bites, switching to libsql is a one-file change.
- **Corpus swap needs a restart** → Documented next to `db:seed`. It is acceptable while rebuilds are rare and manual.
- **Postgres migration is a schema rewrite** → Schemas are small and isolated in `src/db/schema/`. JSON columns map to `jsonb`, and the queries use Drizzle's dialect-neutral builder. Raw SQL is limited to the PRAGMAs above.
- **Saving depends on the validation module, which doesn't exist yet** → See the migration plan for ordering.
- **Server rendering makes the reader depend on the server being up** → Inherent to the choice. Pages stay light, and the corpus is local, so latency is a single in-process SQLite read.

## Migration Plan

1. Apply this change before `base44-look-and-reader`. Then revise that change: the reader reads chapters in a server component from `src/db/corpus.ts`, its static `generateStaticParams` and client JSON loader are dropped, and its corpus format v1 becomes the seed's input contract.
2. Analysis saving (task group 5) needs the validation module from `discourse-analysis-foundation`. If that module isn't written when apply reaches group 5, stop there and build the validation module first. Groups 1 to 4 do not depend on it.
3. There is no user data to migrate. To roll back, revert the commit and restore `output: 'export'`.

## Open Questions

- Whether diagrams should get their own `revision`-based conflict handling or share a generic "document" table with a `kind` column once both editors exist. Keeping them separate now satisfies the spec. Merging later is a migration, not a behaviour change.
