# Taxonomy data

Where the relationship taxonomy and conjunction cues live, and how both runtimes consume them.

## Shared taxonomy JSON

Taxonomy and cue data are language-neutral JSON in `docs/data/`, with TypeScript types generated from them rather than hand-written.

The relationship picker needs the taxonomy before any network call, so it is bundled rather than served by an endpoint. The Python ingest script reads the same cue table to classify conjunctions, keeping one source across both languages. The conjunction table is `docs/data/greek-conjunctions.json`.

## Language scope

Only the conjunction cue table is language-specific; the relationship set, categories and directionality are language-agnostic.

The cue table is keyed by language from the start, which is the only concession made to languages outside v1 and costs one map key. Adding Hebrew would be new source data, not a model change. Greek ships in v1. Hebrew is no longer blocked by licensing, so including it is a scope choice. The Hebrew particle lists in the source PDF extraction are mangled and must be checked against the PDF before encoding.
