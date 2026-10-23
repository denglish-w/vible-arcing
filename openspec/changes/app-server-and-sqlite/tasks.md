## 1. Server mode

- [ ] 1.1 `next.config.ts`: remove `output: 'export'` and `images.unoptimized`; add `output: 'standalone'`, `serverExternalPackages: ['better-sqlite3']`, `outputFileTracingExcludes` for `data/**`, and `experimental.serverActions.bodySizeLimit: '1mb'`
- [ ] 1.2 Add dependencies: `drizzle-orm`, `better-sqlite3`, `@types/better-sqlite3`, `zod`, `server-only`; dev `drizzle-kit`. Confirm the native module installs on Node 26 and record whether it used a prebuilt binary
- [ ] 1.3 `scripts/start.sh` and npm scripts per design decision 1: `start` sets `DATA_DIR` if unset, runs `migrate-app.ts` and stops on failure, copies `public/` and `.next/static` into the standalone directory, and runs `server.js` on `127.0.0.1`; `dev` passes `-H 127.0.0.1`. Confirm `npm run dev` and `npm run build && npm start` serve the home page
- [ ] 1.4 Git-ignore and Docker-ignore `data/`; `src/db/paths.ts` per design decision 3 (absolute `DATA_DIR`, default `<cwd>/data`, refuses to default inside `.next/standalone`), with tests run from the project root and from inside a `.next/standalone` directory
- [ ] 1.5 `tsconfig.json`: add `allowImportingTsExtensions`, `verbatimModuleSyntax` and `erasableSyntaxOnly`; document the rule for script-shared modules (relative, explicit `.ts`, no `@/`, no `server-only`, erasable syntax only, `import type`) in `src/db/README.md`

## 2. Database layer

- [ ] 2.1 `src/db/schema/corpus.ts` (`books`, `chapters`, `words`, `attribution`, `build`) and `src/db/schema/app.ts` (`analyses`, `diagrams`) per design decisions 4–5
- [ ] 2.2 Two drizzle-kit configs (corpus, app) writing to `drizzle/corpus/` and `drizzle/app/`; generate the initial migrations; `db:generate` runs both configs
- [ ] 2.3 `src/db/client.ts`: lazily opened singletons with `fileMustExist`, corpus read-only with no journal pragma, app read-write with WAL, `busy_timeout` and `foreign_keys`; `quick_check` on opening the app database; clear "run `db:migrate`/`db:seed`" errors when a file is missing. No `server-only` here; `src/db/server.ts` is the `server-only` entry point for Next code
- [ ] 2.4 `scripts/migrate-app.ts` (`db:migrate`) per design decision 10: create if missing, create `<DATA_DIR>/backups/` and `VACUUM INTO` an absolute backup path before pending migrations (keep five), migrate, `quick_check`, non-zero exit on failure
- [ ] 2.5 Vitest helper that builds `:memory:` databases with migrations applied
- [ ] 2.6 Tests: missing app or corpus file fails with the setup message and creates no file; a corrupt `app.sqlite` is refused and left unchanged; a write to the corpus connection fails; backup is written to `<DATA_DIR>/backups/` (created if missing) before a pending migration, whatever the working directory; a failing migration exits non-zero and leaves the backup

## 3. Corpus store

- [ ] 3.1 `scripts/ingest/sample_chapter.py`: emit Philippians 1 in corpus format v1 plus `attribution.json` into `corpus/v1/` from a pinned MACULA commit (field whitelist, no `ln`/`domain`), run with `.venv/bin/python -I`; spot-check ids, punctuation, and a verb, participle and noun against MACULA; add `scripts/ingest/README.md`
- [ ] 3.2 `src/lib/books.ts`: the 27 books in canonical order with upper-case codes and chapter counts
- [ ] 3.3 `src/lib/corpus/format.ts`: v1 types and the single `parseChapter()`, which rejects unknown versions by name
- [ ] 3.4 `scripts/seed-corpus.ts` (`db:seed`) per design decision 4: clean temp file, `journal_mode = DELETE`, migrations, books, one transaction per book, derived `seq`, `build` row with ingest hash, integrity check, close, remove stale `-wal`/`-shm`, rename; clean up on failure
- [ ] 3.5 `src/db/corpus.ts`: `listBooks()`, `getChapter(book, chapter)` returning words in order, "unavailable" or "does not exist", `getWord(id)`, `wordsExist(ids)`, `getAttribution()`
- [ ] 3.6 Tests: no committed `corpus/v1/**/*.json` has an `ln` or `domain` key; repeatable build gives identical rows in every table; unknown format refused with the old store intact; failure mid-build leaves the old store openable; no `ln`/`domain` columns; attribution has SBLGNT and MACULA; chapter ordering; "unavailable" vs "does not exist"

## 4. Saved-work storage

- [ ] 4.1 `src/db/work.ts`: create, get, list (both kinds, newest first), save with a revision-checked update that increments `revision`, delete, for analyses and diagrams; typed results for conflict, unknown-word, not-found, too-large and corpus-missing
- [ ] 4.2 Envelope checks: `doc` at most 512 KB, known `doc_version`, passage columns derived from the analysis `doc` (diagram: from the envelope), all referenced word ids present via `wordsExist`
- [ ] 4.3 Tests: stale revision rejected and stored copy unchanged; overwrite against the current revision succeeds; delete removes; analyses and diagrams never cross; unknown word id refused; passage derived from content, not from the request; oversized and unknown-version documents refused; a corpus rebuild leaves `app.sqlite` byte-identical
- [ ] 4.4 `src/lib/autosave.ts`: `createAutosave` controller per design decision 7 (no React or Zustand dependency), plus a thin `useAutosave` hook
- [ ] 4.5 Controller tests with a fake source, fake save and fake unload target: edit applies immediately; single in-flight save; one follow-up save; retryable failure retries with backoff and clears "Not saved"; conflict stops retrying, keeps changes, and offers overwrite, save-as-copy and download; permanent failures (including unknown word and corpus missing) stop retrying with their reason; `beforeunload` guard only while unsaved

## 5. Local-only server

- [ ] 5.1 `src/lib/host.ts`: `isAllowedHost(host)` and `assertAllowedHost()`, reading `ALLOW_UNAUTHENTICATED_NETWORK` and `ALLOWED_HOSTS` from the environment per request (design decision 9)
- [ ] 5.2 `src/proxy.ts` with no matcher, returning 403 for disallowed hosts; `assertAllowedHost()` also called in `src/db/server.ts` (and so every action and the export route); `src/instrumentation.ts` logs the opt-in warning at startup
- [ ] 5.3 Tests: local hosts pass; a foreign host is rejected by the proxy and by `assertAllowedHost()` for an action and the export route; listed host without the opt-in is rejected; listed host with the opt-in passes when set at run time, not build time; the warning is logged only when opted in

## 6. Saved-work actions and pages (needs the validation module, see design Migration Plan)

- [ ] 6.1 Check that the foundation validation module exists; if not, stop and implement it from `discourse-analysis-foundation` first
- [ ] 6.2 Server actions with zod input parsing returning typed results; `saveAnalysis` runs the validation module and rejects invalid trees; `saveDiagram` checks the envelope; create, save and delete call `revalidatePath('/work')`
- [ ] 6.3 `GET /api/analyses/[id]/export` returns the portable file (passage, edition, document version, content) with `Content-Disposition: attachment` and `nosniff`
- [ ] 6.4 `/work` list with kind, title, passage and modified time, plus delete-with-confirm; placeholder `/analysis/[id]` and `/diagram/[id]` pages; every route that reads a database calls `await connection()`
- [ ] 6.5 `/credits` rendering `getAttribution()` with the non-affiliation statement, linked from every page that shows corpus text
- [ ] 6.6 Tests: an invalid analysis is refused by the action and the stored copy is unchanged; export round-trips the stored content byte for byte; a record created after build appears in `/work`

## 7. Container and CI

- [ ] 7.1 Rewrite `Dockerfile` per design decision 11: runtime `npm ci --omit=dev`, copies of standalone output, static, public, `drizzle/`, `corpus/v1/`, scripts and their `src/` modules, `VOLUME /app/data`, runtime reuses the build stage's pruned `node_modules`, entrypoint that sets `DATA_DIR=/app/data`, migrates (refusing to start on failure), seeds when the corpus is missing or stale, then starts the server; delete `nginx.conf`
- [ ] 7.2 CI: `npm run db:generate` (both configs; confirm drizzle-kit's behaviour without a TTY and guard against a hanging prompt per design decision 11) then `git status --porcelain drizzle/` must be empty; `npm run build` with no `data/` directory; keep lint, format, test and `lat check`

## 8. Docs and verification

- [ ] 8.1 Update `README.md` (running locally, local-only warning and opt-in, `docker run -p 127.0.0.1:3000:3000`, backup and restore) and `CLAUDE.md` (stack, commands `db:*` and `npm start`, project state, single-user warning)
- [ ] 8.2 Update `lat.md/architecture.md` and `lat.md/corpus.md` per design decision 12, including a local-only server section; run `lat check`
- [ ] 8.3 Supersede old text: add superseded-by notes to every `discourse-analysis-foundation/design.md` section listed in design decision 12. In `base44-look-and-reader`: remove the sample-chapter tasks (1.x), task 2.4's types and parser, and the books table now in `src/lib/books.ts` (2.2 extends it instead); move the *Corpus chapter format* requirement out (it is now in `text/corpus-store`); rewrite the requirements that say pages are static or loaded from a static host; turn its credits page into a restyle of `/credits`; add a note that it reads chapters from the server
- [ ] 8.4 `npm run lint`, `npm run format:check`, `npm test` and `npm run build` pass; a fresh clone runs `npm run db:migrate && npm run db:seed && npm start`, serves Philippians 1 from a server component with a link to `/credits`, and refuses a request with a non-local `Host`
