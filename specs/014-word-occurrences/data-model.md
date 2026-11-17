# Data Model: Step Through Occurrences

Phase 1 for [plan.md](plan.md). Decisions are in [research.md](research.md). Nothing here is saved work: `app.sqlite` is untouched, and no occurrence data is ever written to it (FR-011).

## Corpus store change (`corpus.sqlite`, rebuilt by `db:seed`)

### `words.canon_seq` (new column)

| Field | Type | Rule |
| --- | --- | --- |
| `canon_seq` | integer, not null | 1-based position of the word in the whole installed New Testament: books in `BOOKS` order, then chapter, then the existing book-wide `seq`. Dense over installed words, unique. |

- **Indexes**: `words_lemma_canon` on `(lemma, canon_seq)`; unique `words_canon_seq` on `(canon_seq)`. The unique index makes a seed bug fail the build, matching the existing `words_book_seq` rule.
- **Assignment**: in `src/db/seed.ts` `load()`, a counter carried across the per-book transactions. Books are visited in `BOOKS` order, not `Map.groupBy` insertion order, so the value never depends on file order.
- **Determinism**: the same corpus input gives the same values (SC-007 relies on ids, not on this, but the seed test asserts both).
- **Migration**: a generated Drizzle corpus migration (`drizzle/corpus/0001_*.sql`). Because `ingestHash` covers the migrations folder, every existing store is stale until reseeded (research R11).
- **Not exposed**: `canon_seq` is a query key. It never reaches the client and is never shown.

## Server read model (`src/db/occurrences.ts`)

`LemmaOccurrences` and `OccurrenceRef` are declared **once**, in `src/lib/occurrences/types.ts`. That module holds types only and is script-safe (relative imports, erasable syntax). `src/db/occurrences.ts` uses `import type … from "../lib/occurrences/types.ts"`, and client code imports the same file, so the server and client shapes cannot drift. Add the module to the script-shared list checked by `src/db/script-imports.test.ts`.

### `LemmaOccurrences` (one per distinct lemma in the requested chapter)

| Field | Type | Meaning |
| --- | --- | --- |
| `lemma` | string | Exact lemma string from the source (FR-002). No normalisation. |
| `before` | integer ≥ 0 | Installed occurrences of the lemma before this chapter in canonical order. |
| `total` | integer ≥ 1 | Installed occurrences of the lemma in the New Testament. The single figure 013 also shows (FR-023). |
| `prev` | `OccurrenceRef \| null` | The last occurrence before this chapter; `null` when the chapter holds the first. |
| `next` | `OccurrenceRef \| null` | The first occurrence after this chapter; `null` when the chapter holds the last. |

Invariant: `before + (occurrences in this chapter) ≤ total`, and `prev === null ⇔ before === 0`.

### `OccurrenceRef`

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | MACULA word id, the only identity used in addresses (FR-012). |
| `book` | string | Book code (`ROM`); the client maps it to a slug and name through `src/lib/books.ts`. |
| `chapter` | integer | Chapter number. |
| `verse` | integer | Verse number, for the reference text. |

`chapterOccurrences(db, book, chapter): Map<string, LemmaOccurrences> | null`. It returns `null` only for a store without `canon_seq` (R11). Contract: [contracts/occurrence-data.md](contracts/occurrence-data.md).

## Client view model (derived, never stored)

### `OccurrencePosition` (for one selected word)

Computed by a pure function in `src/lib/occurrences/position.ts` from the chapter's words and its `LemmaOccurrences`:

| Field | Derivation |
| --- | --- |
| `index` | `before` + 1 + (count of words earlier in this chapter with the same lemma) |
| `total` | `total` |
| `reference` | `{ book, chapter, verse }` of the word |
| `previous` | the previous same-lemma word in this chapter, else `prev`, else none |
| `next` | the next same-lemma word in this chapter, else `next`, else none |
| `kind` | `"only"` when `total === 1`; `"first"`, `"last"` or `"middle"` otherwise |

"Earlier in the chapter" uses the chapter's word order, which is canonical order within the chapter. Several occurrences in one verse are separate positions (spec Edge Cases).

### `SteppingRun` (client store, `src/lib/occurrences/stepper-store.ts`)

| Field | Type | Meaning |
| --- | --- | --- |
| `origin` | `{ path: string; wordId: string } \| null` | Where the run began; the history entry Back returns to. |
| `targetId` | `string \| null` | The occurrence the reader should show once the current navigation lands. |
| `token` | integer | Increases on every requested step; arrivals with an older token are not announced. |
| `pending` | integer (signed) | Steps requested while a cross-chapter navigation is in flight (+ next, − previous). |
| `direction` | `"previous" \| "next"` | Which control receives focus on arrival. |

### State transitions

```text
idle ──step──▶ running(origin set, history: replace origin with ?w=start, then push target)
running ──step, same chapter──▶ running (history.replaceState; mark moves; announce)
running ──step, other chapter──▶ navigating (router push/replace; pending=0)
navigating ──step──▶ navigating (pending ±= 1; nothing sent)
navigating ──page mounts with ?w = targetId──▶ running, or navigating again if pending ≠ 0 (pending applied from the arrived word)
navigating|running ──w changes to anything but targetId (Back/Forward in or across chapters, chapter link, contents)──▶ idle (pending dropped; popover closed; mark follows the new w or clears)  FR-016, SC-008
idle ──page opened from an address with w──▶ idle (word marked and scrolled; popover not opened; focus not moved)  FR-013
running ──select another word / click outside / Escape twice──▶ idle (mark cleared; ?w removed with replaceState)  FR-008
running ──reach an end and step past it──▶ running (no movement; no wrap)  FR-009
```

### Current-occurrence mark

The rendering of `targetId` once it is shown: `data-current-occurrence` on exactly one `.word` button (FR-008). It is presentation of the shared selection (FR-011), not saved.

## Page props change

`ReaderContent`'s `"ok"` case gains:

| Field | Type | Meaning |
| --- | --- | --- |
| `occurrences` | `Record<string, LemmaOccurrences> \| null` | Keyed by lemma. `null` when the store is stale (R11) or, after 010 lands, in Learning mode (FR-024). |
| `focusWordId` | `string \| null` | The `?w=` id when it is a word of this chapter. It seeds the first render only. After that, `GreekText` follows `useSearchParams().get("w")`, so Back and Forward within a chapter update the mark (research R5). |
| `wordNotFound` | boolean | `?w=` was given but is not a word of this chapter (FR-013). |

A plain object rather than a `Map`, because server-to-client props must be serialisable.

## Validation rules

- `?w=` is accepted only when it matches `^[A-Za-z0-9_-]{1,32}$` **and** equals the id of a word in the chapter. Otherwise `wordNotFound` is true and nothing is marked.
- Occurrence matching is equality of the stored `words.lemma` string only (FR-002, FR-003): no case folding, sense or domain, and no normalisation done by 014 itself. Today's store keeps the source's lemma bytes, which spell some lemmas with both oxia and tonos (5,518 distinct strings). Spec 013 (research R5) NFC-normalises lemmas at seed, which merges only canonically equal spellings (5,468). Whichever store is installed, 014 counts the same stored strings that 013 counts, so the totals agree.
