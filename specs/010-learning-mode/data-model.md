# Data Model: Learning Mode (Parsing Practice)

Decisions behind this model are in [research.md](research.md). The interfaces that move these shapes are in [contracts/](contracts/).

## Closed lists (shared by form, grader and validator)

Defined once in `src/lib/learning/fields.ts`; values equal the corpus values (research R4).

| List | Values |
|---|---|
| `FormPos` | noun, verb, participle, article, pronoun, adjective, adverb, preposition, conjunction, particle, numeral, interjection |
| `tense` | present, imperfect, future, aorist, perfect, pluperfect |
| `voice` | active, middle, passive |
| `mood` | indicative, subjunctive, optative, imperative, participle, infinitive |
| `person` | first, second, third, `n/a` |
| `number` | singular, plural |
| `gender` | masculine, feminine, neuter, `n/a` |
| `case` | nominative, genitive, dative, accusative, vocative, `n/a` |

Corpus part of speech → `FormPos`: `det`→article, `conj`→conjunction, `pron`→pronoun, `prep`→preposition, `adj`→adjective, `adv`→adverb, `ptcl`→particle, `num`→numeral, `intj`→interjection; `noun`, `verb` unchanged. A source `verb` with mood `participle` also agrees with `FormPos` participle.

## `fieldsFor(pos, mood?)` (FR-010)

| Chosen part of speech | Fields asked, in order |
|---|---|
| verb, mood not yet chosen | tense, voice, mood |
| verb + indicative, subjunctive, optative or imperative | tense, voice, mood, person, number |
| verb + participle | tense, voice, mood, case, number, gender |
| verb + infinitive | tense, voice, mood |
| participle | tense, voice, case, number, gender |
| noun, adjective, article, numeral | case, number, gender |
| pronoun | case, number, gender, person |
| adverb, preposition, conjunction, particle, interjection | none |

The dictionary form and part of speech are always asked. Degree is never asked (spec Assumptions) but is shown in the source's full parsing after a check.

## Parsing answer (client state, not stored on its own)

| Field | Type | Rule |
|---|---|---|
| `wordId` | string | MACULA id, `^n\d{11}$` |
| `lemma` | string | 0–200 characters, Greek after conversion (research R8) |
| `pos` | `FormPos` or empty | |
| `fields` | partial map of field → value | only keys in `fieldsFor(pos, fields.mood)`; changing `pos` or `mood` drops keys that no longer apply (FR-012) |

## Field comparison (returned by a check; stored inside an attempt)

| Field | Type | Notes |
|---|---|---|
| `field` | `lemma`, `pos` or a field name | |
| `answer` | string or null | null = unanswered (FR-018) |
| `source` | string or null | null = blank in the source |
| `outcome` | `agrees`, `differs` or `unanswered` | `unanswered` counts as differing for the overall outcome |

Grading rules (`src/lib/learning/grade.ts`, pure):

- `lemma`: `normaliseLemma(answer) === normaliseLemma(source.lemma)`. `normaliseLemma` = NFD, remove combining marks (accents, breathings, iota subscript, diaeresis), lower-case, ς→σ, remove elision marks (’ ʼ ᾿ ') and other punctuation and whitespace (research R5).
- `pos`: agrees when the mapped source part of speech equals the answer, or the answer is participle and the source is a verb in the participle mood (FR-016).
- Each field in `fieldsFor(answer.pos, answer.fields.mood)`: `n/a` agrees with an absent source value (FR-017); otherwise agrees on equal strings; empty is `unanswered` (FR-018).
- Overall: `allAgreed` is true only when every comparison is `agrees`; `differCount` counts the rest (FR-019).

## Source parsing (returned by a check only)

`{ lemma, pos, pos label, tense?, voice?, mood?, person?, number?, gender?, case?, degree? }`, taken from the corpus word. Never includes gloss in the comparison table (gloss is shown with the full parsing after checking, as a word fact), and never includes any syntactic role, which the corpus does not contain.

## Attempt (stored: table `parse_attempts` in `app.sqlite`)

| Column | Type | Rule |
|---|---|---|
| `id` | text, primary key | client-generated UUID; insert-or-ignore makes retries idempotent (research R6) |
| `word_id` | text, not null | MACULA id; must exist in the corpus when recorded (FR-024) |
| `book` | text, not null | from the corpus at record time, e.g. `PHP` |
| `chapter` | integer, not null | from the corpus at record time |
| `verse` | integer, not null | from the corpus at record time |
| `surface` | text, not null | the word as it appears, at record time |
| `edition` | text, not null | `SBLGNT` |
| `answer` | text (JSON), not null | the parsing answer: `{ lemma, pos, fields }`, validated |
| `source` | text (JSON), not null | the source parsing computed by the server at record time |
| `comparisons` | text (JSON), not null | the field comparisons computed by the server |
| `all_agreed` | integer (boolean), not null | |
| `checked_at` | integer (timestamp ms), not null | server time at record |

Index: `(word_id, checked_at DESC)` for "latest attempt per word" (research R7).

Lifecycle: insert only. No update, no delete in this feature. Rows survive corpus rebuilds; rows whose `word_id` no longer exists are kept and are only absent from pages (FR-027). Spec 015 adds an owner column to this table with the other saved-work tables.

Validation before insert (`src/lib/learning/validate.ts`, zod, shared with the client form):

1. `id` is a UUID; `word_id` matches the MACULA id pattern and exists in the corpus store.
2. `answer.pos` is a `FormPos` or empty; each key in `answer.fields` is in `fieldsFor(answer.pos, answer.fields.mood)`; each value is in its closed list.
3. `answer.lemma` is at most 200 characters.
4. The server computes `source`, `comparisons` and `all_agreed` itself; any such values sent by the client are ignored.

Refusals return a typed reason (`invalid`, `unknown-word`, `corpus-missing`), shown to the user as not saved, with no retry (FR-024).

## Latest-attempt summary (loaded with a Learning-mode page)

`Map<wordId, { answer, checkedAt, allAgreed }>` for the chapter's word ids. Never contains `source` or `comparisons` (FR-026).

## Lean chapter (Learning-mode page payload)

`{ book, chapter, words: [{ id, v, text, after }] }`. Adds nothing beyond the text the reader already shows; no `lemma`, `gloss`, `pos` or `m` (FR-020).

## Reading mode (cookie)

`vible.mode` = `learning` | `reading`; anything else or missing = Reading (FR-003). Set only by the `setReadingMode` action (research R2).

## Export file (`parse-attempts-export`, version 1)

```json
{
  "format": "parse-attempts-export",
  "formatVersion": 1,
  "edition": "SBLGNT",
  "exportedAt": "2026-11-16T10:00:00.000Z",
  "attempts": [
    {
      "id": "…uuid…",
      "wordId": "n50001001001",
      "reference": "Philippians 1:1",
      "surface": "Παῦλος",
      "checkedAt": "…",
      "answer": { "lemma": "Παυλος", "pos": "noun", "fields": { "case": "nominative", "number": "singular", "gender": "masculine" } },
      "source": { "lemma": "Παῦλος", "pos": "noun", "case": "nominative", "number": "singular", "gender": "masculine" },
      "comparisons": [{ "field": "lemma", "answer": "Παυλος", "source": "Παῦλος", "outcome": "agrees" }],
      "allAgreed": true
    }
  ]
}
```

The values in the example are illustrative.
