# Data Model: Richer Word Details

The authoritative definitions will be the zod parser in `src/lib/corpus/format.ts` and the Drizzle schema in `src/db/schema/corpus.ts`. Decisions referred to as R1 to R10 are in [research.md](research.md).

## Chapter file (`corpus/v1/<BOOK>/<chapter>.json`): Word changes

The format number stays `1`. The changes below are additive, and the strict parser is updated to accept them. An older seed refuses the new files because its strict parser rejects the unknown `strong` key, which is the intended failure.

| Field | Change | Rule |
|---|---|---|
| `lemma` | now NFC-normalised | Canonically equal to the source's lemma (R5). |
| `strong` | **new**, optional string | `^[1-9][0-9]*(\+[1-9][0-9]*)*$`. It is the source's `@strong` with leading zeros stripped, `0` and malformed parts dropped, and compound parts kept in source order. It is omitted when nothing survives (R3). |

`id`, `v`, `text`, `after`, `gloss`, `pos` and `m` do not change.

Still never present: `ln`, `domain`, `role`, `frame`, `referent`, `subjref`, `morph`, `english`, `mandarin` and every other MACULA attribute.

## Lexicon file (`corpus/v1/lexicon.json`): new

```json
{
  "format": 1,
  "source": { "dataset": "dodson-greek-lexicon", "commit": "74f70358…" },
  "entries": [ { "key": 3004, "headword": "λέγω", "definition": "(denoting speech in progress), (a) I say, speak; …" } ],
  "numbers": [
    { "strong": "3004", "entry": 3004, "via": "direct" },
    { "strong": "2036", "entry": 3004, "via": "correspondence" },
    { "strong": "1537+4053", "entry": null, "via": "correspondence" }
  ]
}
```

| Field | Rule |
|---|---|
| `entries[].key` | Integer 1–5624, unique. |
| `entries[].headword` | Non-empty Greek, NFC, no markup. |
| `entries[].definition` | Non-empty English, whitespace collapsed, no markup. |
| `numbers[]` | One row for every distinct `strong` value in the chapter files, and no others, sorted by value. |
| `numbers[].entry` | One of the `entries` keys, or `null` (no entry). |
| `numbers[].via` | `direct` when the value is itself a key; otherwise `correspondence`. |

Nothing else from Dodson is kept: no brief definition, no Goodrick-Kohlenberger number, no part of speech (FR-020).

## Reviewed correspondence (`scripts/ingest/strongs-correspondence.json`): new, ingest input

```json
{ "rows": [ { "strong": "2036", "entry": 3004, "note": "aorist εἶπον; Dodson files it under λέγω" } ] }
```

- `strong` is a normalised source value that is **not** a Dodson key. Rows for values that are keys are an error, because direct matches are never overridden (R4).
- `entry` is a Dodson key or `null`. `note` is required and non-empty.
- `entry` follows Dodson. It is the entry Dodson files the words' lemma under, or `null` when Dodson has none or the lemmas point to different entries. See research R4.
- Rows are sorted by `strong` and unique. Rows for values that do not occur in the text are an error, so the file cannot rot.
- The file is written by hand by a maintainer after reviewing the output of `propose_correspondence.py`.
- **Reviewable record (spec FR-003)**: this committed file, with its notes, is the reviewable correspondence. The shipped corpus carries its resolved result as `lexicon.json`'s `numbers` rows, with `via: "correspondence"`. The notes are not shipped, because the app never shows them.

## Attribution (`corpus/v1/attribution.json`)

A fourth dataset is appended after SBLGNT, MACULA and Berean, with the same eight fields (R10). The SBLGNT and MACULA checks are unchanged.

## Store (`data/corpus.sqlite`)

New corpus migration `drizzle/corpus/0001_*.sql`, generated with `npm run db:generate`:

| Table / column | Definition |
|---|---|
| `words.strong` | `TEXT NULL`: the normalised source value. |
| index `words_lemma_idx` | on `words(lemma)` (R6). |
| `lexicon_entries` | `key INTEGER PRIMARY KEY`, `headword TEXT NOT NULL`, `definition TEXT NOT NULL`. |
| `strong_numbers` | `strong TEXT PRIMARY KEY`, `entry_key INTEGER NULL REFERENCES lexicon_entries(key)`, `via TEXT NOT NULL CHECK (via IN ('direct','correspondence'))`. |
| `lemmas` | `lemma TEXT PRIMARY KEY`, `occurrences INTEGER NOT NULL CHECK (occurrences > 0)`. The seed builds it from `words` in the load transaction. |
| `build` | No new column. `SEED_VERSION` becomes 2, and `ingestHash` also covers `lexicon.json` (R8). |

Seed checks, which refuse the build on failure:

- every `words.strong` value has a `strong_numbers` row;
- every non-null `entry_key` exists in `lexicon_entries`;
- `lexicon.json`'s `source.commit` is a 40-character SHA.

## Read model: chapter payload (Reading mode)

`getChapter` and the page mapping in `src/app/read/[book]/[chapter]/page.tsx` extend `ChapterText`:

| Field | Type | Meaning |
|---|---|---|
| `words[].strong` | `string \| undefined` | The source number or numbers. Absent when the source has none. |
| `words[].entry` | `number \| null \| undefined` | `number`: the key of the entry that applies. `null`: no entry applies, including words with no Strong's number (show the "no entry" sentence). `undefined`: the store predates this feature (show nothing new, FR-021). |
| `lexicon` | `Record<number, { headword: string; definition: string }> \| undefined` | Only the entries this chapter's words use. |
| `occurrences` | `Record<string, number> \| undefined` | Count per lemma, for this chapter's lemmas. `undefined` when the store predates this feature. |

The Learning-mode payload (spec 010) is unchanged and carries none of these fields.

**Older store (FR-021)**: a store built before this feature has no `words.strong` column and none of the new tables. `src/db/corpus.ts` detects this once per connection, through `sqlite_master` and `PRAGMA table_info(words)`. In that case it uses a chapter query that names neither the column nor the tables, and returns every field above as `undefined`.

## Derived display values (pure, `src/lib/corpus/word-facts.ts`)

| Function | Rule |
|---|---|
| `strongLabel("1537+4053")` | → `"G1537 + G4053"` |
| `occurrencesLabel(1)` / `(2335)` | → `"once"` / `"2,335 times"` |
| `entryIsElsewhere(strong, key)` | True when `key` is not one of the word's own numbers. The panel then shows the entry's number beside its headword (FR-004). |

## States of the lexicon area in the panel

| `entry` | Shown |
|---|---|
| number | Headword (`lang="grc"`), the entry number when it is filed elsewhere, and the definition (`lang="en"`). |
| `null` | "The Dodson lexicon has no entry for this word." |
| `undefined` | Nothing: no heading, no statement. |
