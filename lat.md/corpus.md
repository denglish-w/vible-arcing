# Corpus

The Greek text and linguistic data that analyses are built over, and the obligations attached to it.

## Source data

The text is SBLGNT, with morphology and syntax trees from MACULA Greek `SBLGNT/lowfat`. Both are CC BY 4.0.

MACULA supplies per-word lemma and morphology plus explicit clause nodes (`<wg class="cl">`), sentence boundaries, role labels and conjunction nodes. Clause and role data are never used to split a passage or shown to users, because the app does not interpret for them. Verified licensing for every candidate dataset is in `docs/reference/data-sources.md`.

## Ingest pipeline

A standard-library Python extractor publishes Philippians 1 as versioned chapter JSON, with MACULA identity and only the reader's required fields.

[[scripts/ingest/sample_chapter.py#extract_chapter]] restores canonical order using source references, while preserving each XML word id. The CLI verifies the pinned source checksum before extraction. [[scripts/ingest/README.md]] records the source commit and reproducible command. The full NT ingest remains unimplemented.

## Chapter format

Format v1 uses one static file per chapter, with passage identity, source provenance and whitelisted word morphology.

[[public/corpus/v1/PHP/1.json]] contains 501 words across 30 verses. Each word has id, verse, text, following punctuation, lemma, gloss, part of speech and applicable morphology. The source's following punctuation is preserved verbatim; the reader supplies inter-word spacing after punctuation. A missing gloss remains empty rather than invented. [[src/lib/corpus/parse.ts#parseChapter]] validates passage identity, required fields, unique MACULA ids, verse order and morphology, returning only supported fields.

## Stable word identifiers

Word identifiers come from MACULA, never from positional indices.

Positional indices would shift under any re-ingest or upstream correction and silently corrupt saved analyses. The MACULA commit is pinned per release, and a corpus bump is a migration with its own change rather than a silent dependency update.

## Licence rules enforced at ingest

Licence-unsafe data is removed by the pipeline, and attribution is emitted by it, so neither depends on someone remembering.

UBS semantic-domain attributes (`@ln`, `@domain`) are stripped because their redistribution permission is not established. Attribution metadata is written alongside the data and the shipped UI reads it from there. A test asserts the attribution is present, so removing it fails CI.

## Excluded data sources

Data whose licence forbids derivatives or commercial use, or imposes copyleft, is not incorporated.

Westminster morphology or syntax obtained directly from the Groves Center is CC BY-NC-ND, and the no-derivatives term alone blocks reshaping it; only the MACULA-distributed copy is usable. MorphGNT is CC BY-SA and would make downstream data virally licensed, and MACULA supplies the same base text without that. The Biblearc PDFs in `docs/source-pdfs/` are kept for reference and are not redistributed in the app.

## Attribution

Each incorporated work is named with its licence and a link, and any modification is disclosed, both in the repository and in the shipped UI.

The exact required strings are listed in `docs/reference/data-sources.md`. The relationship taxonomy and conjunction cue data are also attributed to their sources in user-visible documentation.
