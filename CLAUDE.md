# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

The app is a local-only Next.js server with SQLite (`app-server-and-sqlite`). It has themed contents, book and chapter pages, a Greek reader with word morphology and persisted display settings, credits read from the corpus store (falling back to the committed attribution when the store is missing), and saved work: a `/work` list, server actions that validate analyses before saving, and file export. Philippians 1 is the only ingested chapter; other chapters show an unavailable state. Pages are server-rendered from the corpus store per request; nothing loads corpus data in the browser. The relationship taxonomy, proposition model types and validation module exist; the arcing and diagramming editors do not. Research and plans live in `docs/` and `openspec/changes/`.

## Commands

Use the pinned Node (`fnm use`, reads `.node-version`).

- `npm run dev`: dev server. Next.js may append its own agent block to `AGENTS.md` when it runs.
- `npm run build`: standalone server build (`output: 'standalone'`); needs no `data/` directory.
- `npm start`: migrates `app.sqlite`, then runs the built server on `127.0.0.1:3000` (`scripts/start.sh`).
- `npm run db:migrate` / `npm run db:seed` / `npm run db:generate`: migrate the saved-work database (backing it up first), rebuild the corpus store from `corpus/v1/`, and generate drizzle migrations for both schemas. Data lives in `DATA_DIR` (default `data/`).
- `npm run taxonomy:generate`: regenerate `src/lib/analysis/taxonomy.generated.ts` from `docs/data/relationships.json` (`-- --check` compares only; a unit test also fails when it is stale).
- `npm run storybook` / `npm run build-storybook`: Storybook on port 6006 / static build to `storybook-static/`. Stories go next to components as `*.stories.tsx`.
- `npm run lint`: oxlint, configured in `.oxlintrc.json` (ignores `.claude/`, `.agents/`, `.venv/`). There is no ESLint.
- `npm run format` / `npm run format:check`: Prettier over `src/` and root config files only, not docs.
- `npm test`: Vitest, passes with no tests. Runs a `unit` project (Node) and a `storybook` project that renders every story in headless Chromium and fails on axe violations; first run needs `npx playwright install chromium`. `--project unit` skips the browser. One file: `npx vitest run path/to/file.test.ts`; one test: add `-t "name"`.
- A Husky `pre-push` hook (`.husky/pre-push`) runs `npm run lint && npm run format:check`; `npm install` wires it up through the `prepare` script.
- CI is `.github/workflows/ci.yml` (the checks above, a check that `db:generate` produces no migration changes, `build-storybook` and `lat check`, then a Docker image build). The `Dockerfile` runs the standalone server; its entrypoint migrates, seeds the corpus when missing or stale, then starts. Docker is not installed on the dev machine, so the image is only built in CI.
- **Single user, local only.** There are no accounts: anyone who can reach the server can read and change all saved work. It binds to `127.0.0.1` and refuses non-local `Host` headers unless `ALLOW_UNAUTHENTICATED_NETWORK=1` and `ALLOWED_HOSTS` are set (`src/lib/host.ts`). Never weaken this without a change that adds accounts.
- Next.js docs for the installed version are in `node_modules/next/dist/docs/`; the `next-devtools` MCP server in `.mcp.json` points to them.

The product is a web app for studying the Greek New Testament: reading, grammatical (sentence) diagramming, and arcing/bracketing (discourse analysis) of the same passage in one place. Who it is for, its positioning and its open decisions (including whether it is free and open source) are in `PRODUCT.md`.

## Workflow: OpenSpec

Before changing project skills or slash commands, read and follow `lat.md/skill-maintenance.md`. Update matching Claude and Codex workflows together and compare them before finishing.

Changes are planned with OpenSpec before code is written. Slash commands live in `.claude/commands/opsx/` (`/opsx:propose`, `/opsx:apply`, `/opsx:archive`, etc.). A change's `proposal.md`, `design.md` and `specs/` are the source of truth for what to build; `openspec/config.yaml` carries project context shown to the model when generating artifacts.

## Stack (see `design.md`)

- Next.js (App Router) + TypeScript as a standalone Node server bound to `127.0.0.1` (see `openspec/changes/archive/2026-10-24-app-server-and-sqlite/design.md`). SQLite through Drizzle and `better-sqlite3`: a read-only `corpus.sqlite` and a read-write `app.sqlite` for saved work, written by server actions. Edits apply locally first and autosave in the background (`src/lib/autosave.ts`). The editor will be client-side (Zustand + Immer, SVG rendering), styled with Tailwind v4 for app chrome and CSS custom properties for renderer colours.
- Python is used only for the offline corpus-ingest script (`scripts/ingest/`), which turns MACULA Greek `SBLGNT/lowfat` XML into versioned per-chapter JSON under `corpus/v1/`, which `db:seed` loads into `corpus.sqlite`. `.venv/` is the local Python environment.
- Tooling: npm with a committed `package-lock.json`, Node pinned to 26 via `.node-version` (use `fnm use`), Vitest for tests, oxlint for linting, Prettier for formatting.
- Validation is one pure-TypeScript module shared by the editor, the import path and the save action.
- Taxonomy and conjunction cue data are JSON in `docs/data/`; TypeScript types are generated from it, never hand-written.

## Architecture constraints that span multiple files

- **One model, two renderings.** Arcing and bracketing share a single proposition model and differ only in view layers. Never build them as separate features.
- **Discourse analysis and grammatical diagramming are separate models** (propositions linked by logical relationships vs words linked by syntactic role). Do not conflate them in specs or code.
- **Analysis is a containment tree** over an ordered `Proposition[]`; each connection covers a contiguous index range. Bilateral is a single ternary node (before, supporter, after) so the structure stays a tree.
- **Ground and Inference share one relation with a direction field** (`follows` / `precedes`); inversion flips direction rather than recreating the connection. Relationships are data records, not an enum.
- **The app never interprets for the user.** No automatic proposition splitting, relationship suggestions or auto-drawn diagrams, and MACULA's sentence-role labels are never shown. See `PRODUCT.md`.
- **Word ids come from MACULA**, never from positional indices, so saved analyses survive re-ingest.

Where docs disagree, `design.md` wins. `docs/reference/model-notes.md` §4 still describes Bilateral as breaking the tree; `design.md` decision 2 supersedes that.

## Licensing rules enforced in the pipeline

- Strip UBS attributes (`@ln`, `@domain`) from MACULA data at ingest; their redistribution permission is not established.
- Ingest emits attribution metadata, and the shipped UI reads attribution from it. SBLGNT and MACULA are CC BY 4.0 and need their notices in-repo and in the UI (exact strings in `docs/reference/data-sources.md`).
- Do not bundle Westminster morphology/syntax obtained directly from the Groves Center (CC BY-NC-ND). Only the MACULA-distributed copy is usable.
- The PDFs in `docs/source-pdfs/` are Biblearc material kept for reference only, not redistributed in the app.

## Prior art: learn from it, don't copy it

Biblearc is the established (paid) arcing tool. The goal is to respect it and build something better, not a clone.

- Never copy Biblearc's code (including JavaScript served to the browser), assets, icons, help text, UI labels, or the wording of their reference sheets. Never use their name or logo in the product, and don't make the overall look confusable with theirs.
- Don't commit Biblearc screenshots or trace their layouts. Screens are designed from `DESIGN.md`.
- The method and the 18 relationships come from scholarship (Fuller, Piper, Schreiner) and are implemented from those sources, with credit.
- Write requirements as user needs in our own words (OpenSpec specs). Notes from using Biblearc record what works for the user and why, not how it is built.
- Check their terms of service before studying the product beyond ordinary use.
- The same applies to `SotS1689/DA-Tool`, which has no licence, so its code must not be copied.

## Design language

`DESIGN.md` (repo root) is the normative visual system ("The Scholar's Desk"): parchment and ink palette, rubric red as the only accent, serif-only type, light/dark/sepia themes through tokens. Read it before building or changing any UI, including the arcing and diagramming editors. `.impeccable/design.json` is its machine-readable sidecar, and `docs/design/base44-prototype/` holds the prototype source it was extracted from (reference only, not built or linted).

## Reference docs

- `docs/reference/logical-relationships.md`: the canonical 18 (+4 extended) relationships. Read before changing the taxonomy.
- `docs/reference/model-notes.md`: findings that constrain the data model. Read before designing schemas.
- `docs/reference/greek-conjunctions.md` and `docs/data/greek-conjunctions.json`: conjunction-to-relationship cues. Reference material a user opens on request; the app never suggests, preselects or ranks a relationship from it. Most conjunctions are ambiguous.
- `docs/reference/data-sources.md`: verified licensing for every candidate dataset.
- `docs/reference/diagramming-notation.md`: the sentence-diagram notation (Reed–Kellogg adapted for Greek). Read before building diagramming.
