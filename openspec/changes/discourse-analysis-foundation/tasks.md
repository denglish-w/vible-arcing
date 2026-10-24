## 0. Delivered by `app-server-and-sqlite`

That change supersedes this change's design decisions 5 and 8, part of 4 and 7, and two risks (see its design decision 12). It also builds part of this change early, because saving an analysis needs the validation module. Tick these when that change merges; do not implement them here.

- [ ] 0.1 Taxonomy JSON `docs/data/relationships.json` (18 core + 4 extended, categories, direction, shape, extended flag) and `scripts/generate-taxonomy.ts` with `src/lib/analysis/taxonomy-codegen.ts`, which generate the committed `src/lib/analysis/taxonomy.generated.ts`, plus its freshness test (decision 4)
- [ ] 0.2 `src/lib/analysis/`: `model.ts` (proposition and connection types for the containment tree, Bilateral as a ternary node, `{relation, direction}` records, `emptyAnalysis`, `invertConnection`), `taxonomy.ts` (`getRelationship`, `relationshipChoices`, `invertedRelationship`), `validate.ts` (`validateAnalysis` with typed error codes for contiguity, arity, acyclicity and Bilateral one-per-side, and `analysisStatus`), and the shared valid and invalid fixtures with their tests (decisions 1, 2, 3, 7)
- [ ] 0.3 Corpus store: `corpus/v1/` format, `db:seed` into `corpus.sqlite`, `src/lib/books.ts`, `getChapter`/`getWord`, attribution in the store and on `/credits`, and the test that no `ln`/`domain` field is shipped (its groups 3 and 6.5)
- [ ] 0.4 Saved work: `app.sqlite` with the edition recorded per analysis, and server actions that run the validation module (its groups 4 and 6)
- [ ] 0.5 Taxonomy credit: a Method credit on `/credits` rendered from the generated `TAXONOMY_CREDIT` (`src/app/credits/page.tsx`, `src/components/credits/attribution-list.tsx`)

## 1. Gate

- [ ] 1.1 Do not start sections 2–5 until `app-server-and-sqlite` has merged and this branch has been rebased onto it. Then tick section 0 against what actually merged, and fix any path in this file that changed

## 2. Full corpus ingest (`text/greek-source`)

Corpus format v1 stays as `app-server-and-sqlite` defines it. Its parser is strict, so clause and conjunction data go in a separate per-chapter file with its own format version rather than new v1 fields. Conjunction classification is MACULA's own word class. The ingest never reads the cue table and never attaches relationships to corpus data; this replaces the cue-table step in design decision 4.

- [ ] 2.1 Measure the output size of the full 27 books in a scratch run, and record total and per-chapter size in `scripts/ingest/README.md`. If the total would weigh down the repository or the Docker image, stop and settle where the corpus lives before committing it
- [ ] 2.2 Extend `scripts/ingest/` from the Philippians 1 sample to all 27 books of MACULA Greek `SBLGNT/lowfat`, at the pinned commit, in format v1 under `corpus/v1/`, keeping the field whitelist (UBS `@ln`/`@domain` never emitted) and the attribution output; a re-run is byte-identical
- [ ] 2.3 Emit `corpus/v1/<BOOK>/<chapter>.clauses.json` with its own `format` field: clauses as nested, possibly discontinuous groups of MACULA word ids. Check whether v1's `pos` already exposes MACULA's conjunction class; if it does, emit nothing extra for conjunctions
- [ ] 2.4 Add the clause tables to the corpus-store schema with a new migration, load them in `db:seed`, and add `getClauses(book, chapter)` to `src/db/corpus.ts`. Add a `text/corpus-store` delta spec for the clause file to this change if `app-server-and-sqlite` has been archived by then, otherwise to that change
- [ ] 2.5 Tests: every book and chapter in `src/lib/books.ts` is present after seeding; MACULA word ids for Philippians 1 are unchanged from the sample; no shipped file has an `ln` or `domain` key; clause retrieval returns nested groups for a sample chapter; conjunction-class words are exposed; no module under `src/lib/analysis/`, `src/components/` or `src/app/` imports clause data (an import-boundary test)

## 3. Passage addressing (`text/greek-source`)

- [ ] 3.1 A pure reference parser: book, chapter and verse range to a validated reference, or "invalid reference" for anything outside the New Testament or past a chapter's last verse
- [ ] 3.2 `getVerseRange(reference)` in `src/db/corpus.ts`: the ordered words of the range, including ranges that cross a chapter boundary; and resolving a proposition span (first and last word ids) to its words in canonical order
- [ ] 3.3 Tests: a single verse, a cross-chapter range, invalid book/chapter/verse, and a span that resolves to the same words after a re-seed

## 4. Edit operations on the analysis (`discourse/proposition-model`)

Pure functions in `src/lib/analysis/` over the 0.2 types. Each returns a new analysis or a typed rejection, and calls `validateAnalysis` so an invalid result is never returned. Inversion and the taxonomy lookups already exist in 0.2 and are reused, not rewritten.

- [ ] 4.1 Segment: create a proposition from a contiguous word span; reject overlap; a new analysis has no propositions, connections or labels
- [ ] 4.2 Split a proposition at a word inside its span, and merge two adjacent propositions (reject non-adjacent). Both remove every connection the changed proposition was a member of, including connections that contain those connections, and return the removed connections so the editor can tell the user
- [ ] 4.3 Connect contiguous members with a user-chosen relationship (reject when unlabelled, non-contiguous or cyclic); relabel; delete a connection, with a Bilateral handled as one connection
- [ ] 4.4 Invert as an edit operation wrapping 0.2's `invertConnection`: Ground ↔ Inference on the same connection; reject coordinate relationships and Bilateral with the reason
- [ ] 4.5 Check 0.2's `analysisStatus` against the *Analysis validity* requirement and add only what it lacks
- [ ] 4.6 Tests for every scenario in `specs/discourse/proposition-model/spec.md` and the directionality and Bilateral scenarios in `specs/discourse/relationship-taxonomy/spec.md`
- [ ] 4.7 Record the split and merge behaviour in `lat.md/proposition-model.md` (it currently calls this unresolved)

## 5. Taxonomy and conjunction cues (`discourse/relationship-taxonomy`)

- [ ] 5.1 Check 0.2's `relationshipChoices` and `invertedRelationship` against the spec (core only by default, all 22 with the opt-in and marked extended, grouped by category). Verification only; change them only for a gap
- [ ] 5.2 Compile the project's own Greek conjunction cue table from scholarly sources (standard grammars and the Fuller, Piper and Schreiner material), each entry with a scripture example and its source, in the project's own wording and relationship ids. Do not copy from `docs/data/greek-conjunctions.json` or its source sheet. Record the sources and their licences in `docs/reference/data-sources.md`
- [ ] 5.3 Mark `docs/data/greek-conjunctions.json` and `docs/reference/greek-conjunctions.md` as research reference only, not shipped, with no recorded licence; make sure no app code imports them
- [ ] 5.4 Conjunction lookup keyed by language over the new table: every candidate with its example and source, no ranking or designated answer; "not exhaustive" for an unmapped conjunction; "no conjunction cue" for Situation-Response; no cues for a language without data
- [ ] 5.5 Tests: category counts (3/5/8/2, 3 coordinate and 15 subordinate); a multi-candidate conjunction returns all its candidates undesignated; every entry has an example and a source; the taxonomy is identical for every language key; no connection operation reads the cue table
- [ ] 5.6 Add the cue table's scholarly sources to `/credits` beside the 0.5 taxonomy credit

## 6. Docs and verification

- [ ] 6.1 Update `lat.md/taxonomy-data.md` and `lat.md/corpus.md` to describe what was implemented; run `lat check`
- [ ] 6.2 `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, `npm run build-storybook`, the `db:generate` clean-`drizzle/` check, and `lat check` pass
- [ ] 6.3 `openspec validate discourse-analysis-foundation --strict` passes
