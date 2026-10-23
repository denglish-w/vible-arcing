## Why

The goal is now a functional app with three working tools: reading, grammatical diagramming and arcing. Users' arcs and diagrams need a durable home, the Greek text needs to be queryable for looking up words, morphology and reference data, and accounts are coming soon. Clause and conjunction data in the store are never used to split a passage into propositions or to propose relationships; the app does not interpret for the user (see `PRODUCT.md`). The current plan (a static export with work saved only in each user's browser) would have to be torn out as soon as accounts arrive. Moving to a server with a real database now means the next features build on the architecture they will keep.

SQLite is the database for now. It needs no service to run, it lives in a file next to the app, and Drizzle targets both it and the Postgres we expect to move to with accounts, so the schema is rewritten but the queries mostly carry over. Hosting costs are deferred, not avoided: this change makes a server necessary for deployment, and choosing where to host it is left until the app is ready to ship.

## What Changes

- **BREAKING (architecture):** the app stops being a static export. `output: 'export'` is removed, and the app runs as a Next.js Node server from standalone output (`node .next/standalone/server.js`).
- Add SQLite as the application database, accessed through Drizzle ORM with `better-sqlite3`, with migrations managed by drizzle-kit.
- Split data into two database files: `data/corpus.sqlite` holds the Greek text and linguistic data (read-only at runtime, rebuilt from ingest), and `data/app.sqlite` holds users' saved work. Rebuilding the corpus can never touch saved work.
- Add a TypeScript seed step that loads the Python ingest's JSON output into `corpus.sqlite`, so the Drizzle schema is the one definition of the corpus tables.
- Add server-side storage for saved work: analyses (arcing/bracketing) and diagrams as separate record types, each referencing words by MACULA id. Saving is automatic, editing never waits on a save, and a save that conflicts with another tab never discards the user's changes.
- Drop IndexedDB/Dexie from the plan. File export stays and is added here. File import (the other half of the foundation's *Analysis portability* requirement) is deferred to the arcing editor change, which owns the round trip.
- Move the Docker image from nginx serving static files to a Node runtime, with the database directory on a mounted volume. Remove `nginx.conf`.
- Make **grammatical diagramming** in scope for the product. It remains a separate data model from discourse analysis, and its editor is a later change. This change only gives it a storage table.
- **Single-user and local-only until accounts land:** there is no authentication, so everyone who reaches the server shares one store of saved work. The server therefore listens on this computer only by default and refuses requests addressed to any other host. Opening it to a network takes an explicit setting. It must not be deployed publicly until an accounts change adds per-user ownership.
- Add a minimal credits page that reads attribution from the corpus store, so no corpus text is ever shown without its CC BY notices.
- Update the docs that describe the old architecture: `README.md`, `CLAUDE.md`, `lat.md/architecture.md`, `lat.md/corpus.md`, and every section of `discourse-analysis-foundation/design.md` and `base44-look-and-reader` that assumes a static export (listed in design decision 12).

## Capabilities

### New Capabilities

- `app/saved-work`: Durable server-side storage of users' analyses and diagrams. It covers automatic saving that never blocks editing, conflicts that never lose work, checks on what is stored, export, backups before schema changes, survival across restarts and corpus rebuilds, and listing, reopening and deleting saved work.
- `text/corpus-store`: The Greek corpus held in a server-side database. It covers the versioned ingest output format the store is built from (corpus format v1, moved here from `base44-look-and-reader`), rebuilding the store, the guarantee that a rebuild leaves saved work untouched, and serving book, chapter and word data to the app.
- `app/local-only-server`: The safeguards that keep an unauthenticated server reachable from this computer only unless the operator explicitly opts in.

### Modified Capabilities

None in `openspec/specs/` (nothing is archived yet). This change supersedes parts of two unarchived changes:
- `discourse-analysis-foundation`: its design decisions 5 (corpus delivery as static JSON) and 8 (static, local-first app with IndexedDB persistence) are replaced. Its *Analysis portability* and *Greek New Testament text availability* requirements still hold. Text is still served without any third-party service.
- `base44-look-and-reader`: its corpus loader, static page generation, sample-chapter tasks and the *Corpus chapter format* requirement move or change. Its requirements that say pages are static or loaded from a static host are rewritten by task 8.3, and its tasks are revised so the reader gets chapters from the server.

## Impact

- **Config and build:** `next.config.ts` (drop `output: 'export'` and `images.unoptimized`, add `output: 'standalone'` and mark `better-sqlite3` as a server external package). `npm run build` produces `.next/standalone` instead of `out/`.
- **Dependencies:** adds `drizzle-orm`, `better-sqlite3` (a native module; whether it ships a prebuilt binary for Node 26 is unverified, and task 1.2 confirms it installs) and its types, `zod`, `server-only`, and `drizzle-kit` (dev).
- **New code:** `src/db/` (schemas, clients for the two databases, migrations), `src/lib/books.ts` (the canonical book and chapter list), `src/proxy.ts` (host check), `scripts/seed-corpus.ts` and `scripts/migrate-app.ts`, and npm scripts `db:migrate`, `db:seed` and `db:generate`.
- **Container and CI:** the `Dockerfile` is rewritten for a Node runtime. CI adds a check that migrations are up to date with the schema, and a test run against an in-memory database.
- **Process:** `data/*.sqlite` is git-ignored. Developers run `npm run db:migrate && npm run db:seed` after cloning.
- **Docs:** listed above.
- **Later migration to Postgres:** the Drizzle schema files are rewritten from `sqlite-core` to `pg-core`, and the queries mostly carry over. That migration happens with the accounts change.
