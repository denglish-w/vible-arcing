## 1. Server mode

- [ ] 1.1 `next.config.ts`: remove `output: 'export'` and `images.unoptimized`; add `output: 'standalone'` and `serverExternalPackages: ['better-sqlite3']`; confirm `npm run dev` and `npm run build && npm start` serve the home page
- [ ] 1.2 Add dependencies: `drizzle-orm`, `better-sqlite3`, `@types/better-sqlite3`, `zod`, `server-only`; dev `drizzle-kit`. Confirm the native module installs on Node 26
- [ ] 1.3 Git-ignore `data/*.sqlite*`; add `DATA_DIR` handling with a `./data` default

## 2. Database layer

- [ ] 2.1 `src/db/schema/corpus.ts` (`words`, `chapters`, `attribution`, `build`) and `src/db/schema/app.ts` (`analyses`, `diagrams`) per design decisions 4–5
- [ ] 2.2 Two drizzle-kit configs (corpus, app) writing to `drizzle/corpus/` and `drizzle/app/`; generate the initial migrations; npm scripts `db:generate`, `db:migrate` and `db:seed`
- [ ] 2.3 `src/db/client.ts`: lazily opened singletons, corpus read-only and app read-write, with the PRAGMAs from decision 2; guarded with `server-only`
- [ ] 2.4 Vitest helper that builds `:memory:` databases with migrations applied

## 3. Corpus store

- [ ] 3.1 `scripts/ingest/sample_chapter.py`: emit Philippians 1 in corpus format v1 plus `attribution.json` into `corpus/v1/` from a pinned MACULA commit (field whitelist, no `ln`/`domain`); add `scripts/ingest/README.md`
- [ ] 3.2 `src/lib/corpus/format.ts`: v1 types and `parseChapter()` that rejects unknown versions
- [ ] 3.3 `scripts/seed-corpus.ts`: temp file, migrations, transactional load, `build` row, integrity check, atomic rename; clean up on failure
- [ ] 3.4 `src/db/corpus.ts`: `getChapter(book, chapter)` (ordered words or "unavailable"), `getWord(id)`, `listAvailableChapters()`, `getAttribution()`
- [ ] 3.5 Tests: repeatable build gives identical rows; unknown format refused with the old store intact; failure mid-build leaves the old store; no `ln`/`domain` columns; attribution has SBLGNT and MACULA; chapter ordering and "unavailable"

## 4. Saved-work storage

- [ ] 4.1 `src/db/work.ts`: create, get, list (both kinds, newest first), save with `baseRevision` check, delete, for analyses and diagrams
- [ ] 4.2 Tests: revision conflict rejected; delete removes; analyses and diagrams never cross; a corpus rebuild leaves `app.sqlite` byte-identical
- [ ] 4.3 `useAutosave` hook (design decision 7) with tests: edit applies immediately, single in-flight save, follow-up save, retry and "Not saved" state, `beforeunload` guard

## 5. Saved-work actions and pages (needs the validation module, see design Migration Plan)

- [ ] 5.1 Check that the foundation validation module exists; if not, stop and implement it from `discourse-analysis-foundation` first
- [ ] 5.2 Server actions with zod input parsing; `saveAnalysis` runs the validation module and rejects invalid trees; `saveDiagram` checks the envelope only
- [ ] 5.3 `GET /api/analyses/[id]/export` returns the portable file (passage and edition included)
- [ ] 5.4 `/work` list with kind, title, passage and modified time, plus delete-with-confirm; placeholder `/analysis/[id]` and `/diagram/[id]` pages
- [ ] 5.5 Test: an invalid analysis is refused by the action and the stored copy is unchanged

## 6. Container and CI

- [ ] 6.1 Rewrite `Dockerfile` for standalone Node runtime, `VOLUME /app/data`, and an entrypoint that runs app migrations and then starts the server; delete `nginx.conf`
- [ ] 6.2 CI: add `npm run db:generate` plus `git diff --exit-code drizzle/`; keep lint, format, test, build and `lat check`

## 7. Docs and verification

- [ ] 7.1 Update `CLAUDE.md`: stack, commands (`db:*`, `npm start`), diagramming in scope, and the single-user warning
- [ ] 7.2 Update `lat.md/architecture.md` and `lat.md/corpus.md`; add a deployment note with the "local or private only" warning; run `lat check`
- [ ] 7.3 Add a superseded-by note to decisions 5 and 8 in `discourse-analysis-foundation/design.md`; remove the sample-chapter tasks from `base44-look-and-reader` and add a note that it needs revising to read from the server
- [ ] 7.4 `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass; a fresh clone runs `db:migrate && db:seed && npm start` and serves Philippians 1 data from a server component
