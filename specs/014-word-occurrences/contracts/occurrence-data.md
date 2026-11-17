# Contract: Occurrence data (server)

The interface between the corpus store and the reading page. Data shapes are in [../data-model.md](../data-model.md).

## `chapterOccurrences(db: CorpusDb, book: string, chapter: number)`

Module: `src/db/occurrences.ts`. Like the rest of `src/db/`, it is script-safe (relative `.ts` imports, no `server-only`) and takes the connection as an argument, so tests pass an in-memory store.

**Returns** `Map<lemma, LemmaOccurrences>` with one entry for every distinct lemma among the chapter's installed words, or `null` when the store has no `canon_seq` column.

**Guarantees**

1. `total` equals `SELECT count(*) FROM words WHERE lemma = ?`: every installed word with an identical lemma string, and nothing else (FR-002, SC-001).
2. `before` counts occurrences with `canon_seq` below the chapter's lowest `canon_seq` for that lemma.
3. `prev` is the occurrence with the greatest `canon_seq` below the chapter, and `next` the one with the least `canon_seq` above it. Both are `null` at the ends. There is no wrapping (FR-009).
4. Ordering is canonical: Matthew 1:1 to Revelation 22:21, then verse and word order (FR-004).
5. Uninstalled chapters contribute nothing, so a step can never target one (FR-015).
6. It uses no gloss, part of speech, morphology or other field to choose or order occurrences (FR-003).
7. Cost scales with the chapter's distinct lemmas, not with lemma frequency: ≤ 10 ms for any chapter on the dev machine (measured 3.8 ms for Romans 8; SC-003).

**Errors**: SQLite "no such column: canon_seq" → `null`. Every other error propagates, so `readCorpus` reports a missing or damaged store as it does today.

**Consumers**
- `src/app/read/[book]/[chapter]/page.tsx` (Reading mode only).
- Spec 013's occurrence count and this `total` are both counts of the same stored `words.lemma` rows. Once 013 is merged, `total` is joined from `lemmas.occurrences` (decided by merge order, with no runtime detection), and a test asserts it equals `count(*)` for every lemma (FR-023, research R10).

## Reading page request

`GET /read/<slug>/<chapter>[?w=<wordId>]`

| Input | Outcome |
| --- | --- |
| no `w` | As today, plus `occurrences`; nothing marked. |
| `w` is a word of this chapter | `focusWordId = w`; the word is marked and scrolled into view, and its popover with the stepper opens when the word is activated. On page load the popover does not open and focus does not move (FR-013, US3 scenario 2, research R3). |
| `w` is malformed, from another chapter, or unknown | Chapter shown unmarked, with the notice "That word isn't in this chapter." (FR-013) |
| chapter not installed | The existing `ChapterUnavailable` state; `w` ignored (spec Edge Cases). |
| book or chapter does not exist | The existing `notFound()`. |

The page stays dynamic (`await connection()`), and the Host check in `src/proxy.ts` is unchanged (Constitution VII). No new route handler, server action or API is added.
