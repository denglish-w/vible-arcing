## Why

The goal is now a functional app with three working tools: reading, grammatical diagramming and arcing. Users' arcs and diagrams need a durable home, the Greek text needs to be queryable for clause splitting and relationship suggestions, and accounts are coming soon. The current plan (a static export with work saved only in each user's browser) would have to be torn out as soon as accounts arrive. Moving to a server with a real database now means the next features build on the architecture they will keep.

SQLite is the database for now. It needs no service to run, it lives in a file next to the app, and it speaks the same SQL as the Postgres we expect to move to with accounts. Hosting costs are deferred, not avoided: this change makes a server necessary for deployment, and choosing where to host it is left until the app is ready to ship.

## What Changes

- **BREAKING (architecture):** the app stops being a static export. `output: 'export'` is removed, and the app runs as a Next.js Node server (`next start`, standalone output).
- Add SQLite as the application database, accessed through Drizzle ORM with `better-sqlite3`, with migrations managed by drizzle-kit.
- Split data into two database files: `data/corpus.sqlite` holds the Greek text and linguistic data (read-only at runtime, rebuilt from ingest), and `data/app.sqlite` holds users' saved work. Rebuilding the corpus can never touch saved work.
- Add a TypeScript seed step that loads the Python ingest's JSON output into `corpus.sqlite`, so the Drizzle schema is the one definition of the corpus tables.
- Add server-side storage for saved work: analyses (arcing/bracketing) and diagrams as separate record types, each referencing words by MACULA id. Saving is automatic, and editing never waits on a save.
- Drop IndexedDB/Dexie from the plan. File export and import (required by the foundation's *Analysis portability* requirement) stay.
- Move the Docker image from nginx serving static files to a Node runtime, with the database directory on a mounted volume. Remove `nginx.conf`.
- Make **grammatical diagramming** in scope for the product. It remains a separate data model from discourse analysis, and its editor is a later change. This change only gives it a storage table.
- **Single-user until accounts land:** there is no authentication, so every visitor shares one store of saved work. The app is for local use only and must not be deployed publicly until an accounts change adds per-user ownership.
- Update the docs that describe the old architecture: `CLAUDE.md`, `lat.md/architecture.md`, `lat.md/corpus.md`, and the stack and persistence sections of `discourse-analysis-foundation/design.md`.

## Capabilities

### New Capabilities

- `app/saved-work`: Durable server-side storage of users' analyses and diagrams. It covers automatic saving that never blocks editing, survival across restarts and corpus rebuilds, and listing, reopening and deleting saved work.
- `text/corpus-store`: The Greek corpus held in a server-side database. It covers rebuilding the store from ingest output, the guarantee that a rebuild leaves saved work untouched, and serving chapter and word data to the app.

### Modified Capabilities

None in `openspec/specs/` (nothing is archived yet). This change supersedes design decisions in two unarchived changes, but not their spec requirements:
- `discourse-analysis-foundation`: its design decisions 5 (corpus delivery as static JSON) and 8 (static, local-first app with IndexedDB persistence) are replaced. Its *Analysis portability* and *Greek New Testament text availability* requirements still hold. Text is still served without any third-party service.
- `base44-look-and-reader`: its corpus loader and static page generation assume a static export. That change is revised as follow-up work so the reader gets chapters from the server.

## Impact

- **Config and build:** `next.config.ts` (drop `output: 'export'` and `images.unoptimized`, add `output: 'standalone'` and mark `better-sqlite3` as a server external package). `npm run build` produces `.next/standalone` instead of `out/`.
- **Dependencies:** adds `drizzle-orm`, `better-sqlite3` (a native module, with prebuilt binaries for Node 26) and its types, and `drizzle-kit` (dev).
- **New code:** `src/db/` (schemas, clients for the two databases, migrations), `scripts/seed-corpus.ts`, and npm scripts `db:migrate`, `db:seed` and `db:generate`.
- **Container and CI:** the `Dockerfile` is rewritten for a Node runtime. CI adds a check that migrations are up to date with the schema, and a test run against an in-memory database.
- **Process:** `data/*.sqlite` is git-ignored. Developers run `npm run db:migrate && npm run db:seed` after cloning.
- **Docs:** listed above. `CLAUDE.md`'s note that grammatical diagramming is deferred changes to in scope.
- **Later migration to Postgres:** the Drizzle schema files are rewritten from `sqlite-core` to `pg-core`, and the queries mostly carry over. That migration happens with the accounts change.
