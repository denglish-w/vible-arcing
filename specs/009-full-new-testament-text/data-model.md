# Data Model: Full New Testament Text

No entity changes. Corpus format v1 and the corpus store schema stay exactly as they are; this feature adds 259 more chapter files of the same shape. The authoritative definitions are the zod parser in `src/lib/corpus/format.ts` and the Drizzle schema in `src/db/schema/corpus.ts`.

## Chapter file (`corpus/v1/<BOOK>/<chapter>.json`)

| Field | Type | Rule |
|---|---|---|
| `format` | `1` | Unrecognised versions are refused by the seed. |
| `edition` | `"SBLGNT"` | |
| `source.dataset` | `"macula-greek"` | |
| `source.commit` | 40-char lower-case SHA | Same commit in every file; the seed refuses a mix. |
| `book` | book code, e.g. `MAT` | Must match the directory name and one of the 27 codes in `src/lib/books.ts`. |
| `chapter` | integer ≥ 1 | Must match the file name; within the book's chapter count. |
| `words` | Word[] | Non-empty, in reading order (verse, then word number from MACULA `ref`). |

## Word

| Field | Type | Rule |
|---|---|---|
| `id` | MACULA `xml:id`, e.g. `n50001001001` | Unique across the whole New Testament; never positional. |
| `v` | integer | Verse number. |
| `text` | string | Non-empty surface form; no `<`, `>` or `&`. |
| `after` | string | Punctuation and space up to the next word; joining `text + after` reproduces the chapter. |
| `lemma` | string | Non-empty. |
| `gloss` | string, optional | Absent for 830 words in the source; never invented. |
| `pos` | string | One of noun, verb, det, conj, pron, prep, adj, adv, ptcl, num, intj. |
| `m` | object, optional | Only person, number, gender, case, tense, voice, mood, degree, and only those present. |

Never present (strict parser rejects them): `ln`, `domain`, `role`, `frame`, `referent`, `subjref`, `strong`, `morph`, `english`, `mandarin`, and every other MACULA attribute or syntax-tree element.

## Attribution (`corpus/v1/attribution.json`)

Unchanged: SBL Greek New Testament, MACULA Greek Linguistic Datasets, Berean Interlinear Bible, each with name, creator, licence, licence URL, statement, modification note and URL.

## Store (`data/corpus.sqlite`)

Unchanged schema. After this feature: `books` 27 rows (as before), `chapters` 260 rows (was 1), `words` 137,741 rows (was 501), `attribution` 3 rows, `build` 1 row whose `ingest_hash` differs from a Philippians-only store, which is what triggers the rebuild-if-stale step.

## States

A chapter request resolves as today: `ok` (now every valid chapter), `unavailable` (valid chapter missing from an out-of-date store), `not found` (no such chapter), or "not installed" (no store).
