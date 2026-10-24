# Taxonomy data

Where the relationship taxonomy and conjunction cues live, and how both runtimes consume them.

## Shared taxonomy JSON

Taxonomy and cue data are language-neutral JSON in `docs/data/`, with TypeScript types generated from them rather than hand-written.

The relationship taxonomy is `docs/data/relationships.json`: shapes (coordinate, binary, bilateral), the four categories, and the 18 core and 4 extended relationships with their arity, supporter and direction rules and definitions written in our own words. Ground and Inference are one `support` relation that differs only by direction. `npm run taxonomy:generate` ([[scripts/generate-taxonomy.ts]]) checks the data and writes `src/lib/analysis/taxonomy.generated.ts`, which is committed; a unit test fails when it no longer matches the JSON, and another checks that every cue in the conjunction table names a known relationship.

The relationship picker needs the taxonomy before any network call, so it is bundled rather than served by an endpoint. The Python ingest script reads the same cue table to classify conjunctions, keeping one source across both languages. The conjunction table is `docs/data/greek-conjunctions.json`.

## Language scope

Only the conjunction cue table is language-specific; the relationship set, categories and directionality are language-agnostic.

The cue table is keyed by language from the start, which is the only concession made to languages outside v1 and costs one map key. Adding Hebrew would be new source data, not a model change. Greek ships in v1. Hebrew is no longer blocked by licensing, so including it is a scope choice. The Hebrew particle lists in the source PDF extraction are mangled and must be checked against the PDF before encoding.
