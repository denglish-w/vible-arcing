# Contract: Learning-mode server actions and routes

All actions live in `src/app/read/learning-actions.ts` (`"use server"`), call `assertAllowedHost()` first, parse input with zod and return a typed result for every expected outcome; anything else throws, as in `src/app/(work)/actions.ts`. Shapes are defined in [../data-model.md](../data-model.md).

## `setReadingMode(mode)`

| | |
|---|---|
| Input | `"reading" \| "learning"` |
| Effect | Sets cookie `vible.mode` (`HttpOnly`, `SameSite=Lax`, path `/`, max age one year). Changes nothing else. |
| Returns | `{ ok: true, mode }` or `{ ok: false, reason: "invalid" }` |
| Client follow-up | To Learning: `location.reload()` (discards the Reading render's inline payload; research R1). To Reading: `refresh()` from `next/cache` inside the action. |

## `checkParse(answer)`

| | |
|---|---|
| Input | Parsing answer `{ wordId, lemma, pos, fields }`, validated with the shared schema |
| Effect | Read-only. Loads the word from the corpus store and grades with `grade.ts`. |
| Returns | `{ ok: true, comparisons, allAgreed, differCount, source }` with `source` the full source parsing plus gloss; or `{ ok: false, reason: "invalid" \| "unknown-word" \| "corpus-missing" }` |
| Unreachable server | The client treats a rejected call as "could not check": answers kept, "Check again" offered, nothing saved, no source shown. |
| Guarantee | This response is the first and only way the source's lemma, gloss, part of speech or morphology for `wordId` reaches the browser in Learning mode (FR-020). |

## `recordAttempt(attempt)`

| | |
|---|---|
| Input | `{ id: uuid, answer }` |
| Effect | Validates (data-model "Validation before insert"), re-grades on the server, inserts into `parse_attempts` with server time. `INSERT … ON CONFLICT(id) DO NOTHING`, so retries are idempotent. |
| Returns | `{ ok: true }` (also when the id already exists) or `{ ok: false, reason: "invalid" \| "unknown-word" \| "corpus-missing" }`. A thrown error or network failure means "retry" to the outbox. |

## Reading page in Learning mode (`/read/[book]/[chapter]`)

| | |
|---|---|
| Mode source | `(await cookies()).get("vible.mode")`; missing or unknown = Reading |
| Learning payload | Lean chapter `{ book, chapter, words: [{ id, v, text, after }] }` plus latest-attempt summaries for the chapter's word ids (no `source`, no `comparisons`) |
| Reading payload | Unchanged from today |
| Test hook | The QA script asserts that, in Learning mode, the served HTML contains no `"lemma"`, `"gloss"`, `"pos"` or `"m"` keys for chapter words and none of a sample of the chapter's lemmas that differ from their surface forms (SC-002). |

## `GET /api/attempts/export`

| | |
|---|---|
| Checks | `assertAllowedHost()` and the same-origin check from `src/app/api/analyses/[id]/export/route.ts` |
| Response | `200`, `content-type: application/json`, `content-disposition: attachment; filename="parse-attempts-YYYY-MM-DD.json"`, body as in data-model "Export file" |
| Refusals | `403` wrong host or cross-origin; `503` when the store is missing or damaged |
