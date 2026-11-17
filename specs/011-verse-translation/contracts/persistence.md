# Persistence and Export Contracts

These are proposed server actions and one authenticated-by-local-policy download route, not a new public REST mutation API.

## Common boundary

Every action rechecks Host before opening a database. Server-loaded chapter words determine passage metadata and validation. After missing-record/stale-revision prechecks, for existing verses whose stored and current ordered ids match, prepare current canonical `sourceWords` before shared validation/size checks; the server ignores supplied Greek and rebuilds it independently. Persist refreshed snapshots only with a successful revision-checked edit save; reads, exports, refusals and conflicts leave the saved JSON intact. Changed text/punctuation alone requires no structural repair; missing/reordered ids do. User text and structure are never changed by snapshot refresh. Use Zod at the action boundary plus the shared translation validator. Render user strings as plain text, never HTML. Never accept client owner claims. After 015, apply its server-derived ownership scope consistently to every record, preference, receipt and export.

Success returns a typed value; expected refusals never throw. Transport/storage failures reject for autosave retry. Existing permanent reasons remain `invalid`, `unknown-word`, `not-found`, `too-large`, `unknown-version`, `corpus-missing`; name validation uses `invalid` with `field: name` and a specific message. Conflict returns `{ok:false, reason:"conflict", current:{revision,updatedAt}}`. Success returns the current id/revision/name when needed. Do not extend autosave's refusal union merely to add name errors.

## Operations

| Operation                 | Input                                                                 | Result and side effects                                                                                          |
| ------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Load chapter translations | edition, book, chapter, optional requested id                         | Summaries, active record or unsaved-default descriptor, diagnostics; no record created by reading                |
| Create                    | operationId, chapter identity, name policy, version, initial document | Atomic name allocation and validated insert, revision 1; retry-safe receipt; returns actual name and id          |
| Save                      | id, baseRevision, docVersion, doc                                     | Conditional update, increments revision; does not overwrite a name changed elsewhere                             |
| Rename                    | id, baseRevision, proposed name                                       | Validates uniqueness, increments revision/updatedAt; unchanged on refusal                                        |
| Duplicate                 | sourceId, sourceRevision, operationId                                 | Copies exactly that saved revision into independent record; allocates copy suffix transactionally                |
| Select                    | chapter identity, id                                                  | Verifies chapter membership; stores active preference/recency; does not revise content                           |
| Delete                    | id, baseRevision, confirmed user intent                               | Removes only that translation, repairs selection/recency, preserves creation tombstone; stale revision conflicts |
| List work                 | none (local-user scope)                                               | Merge translation summaries with analyses/diagrams, newest first; title is name                                  |

Explicit create/rename/duplicate first settles any current pending save; on failure retain it and keep recovery reachable. Duplicate flushes the source session and uses the resulting revision, so unsaved text is not omitted. Create, first-write creation and duplicate atomically set the new record as the chapter preference and record recency. First-write bootstrap runs outside the ordinary autosave controller so its receipt acknowledges only the frozen original edit generation, never subsequent unsent edits. First-write creation retains its original payload across retries and saves newer edits only after receiving the created identity/revision. Concurrent automatic-name races allocate distinct available names; an explicit name collision is refused.

On conflict, overwrite uses the returned latest revision and still performs a conditional update; a third writer can conflict again. Save-as-copy uses the local snapshot and transactionally allocates an independent name. Deleted records offer copy/download; they are never recreated through save.

## Opening and selection

Saved-work links use `/read/{bookSlug}/{chapter}?translate=1&translation={id}`. Validate query input and chapter membership server-side. An explicit Translate link enables the control and persists that display choice after hydration, overriding a previously false browser setting. Otherwise `showTranslate` follows browser settings, default false. Server selection persists across browsers; display choices remain existing browser settings until 015.

## Export route

`GET /api/translations/{id}/export` follows the analysis route's Host and Origin/Sec-Fetch-Site checks. Foreign Origin or an absent Origin without `same-origin`/`none` fetch metadata returns 403. Missing record returns 404. Successful response is JSON UTF-8 with `Content-Disposition: attachment; filename="translation-{id}.json"`, `X-Content-Type-Options: nosniff` and `Cache-Control: no-store`; never put a user name directly into a header.

Envelope fields: `format: "translation-export"`, `formatVersion: 1`, `kind: "translation"`, `name`, `passage` (book, chapter, label, first/last word ids), `edition`, `docVersion`, `updatedAt`, `doc` and `greek`. Splice `doc` from the stored JSON without changing its contents. `greek` maps verse/segment/group ids to text assembled from stored source words and punctuation, so unavailable or changed corpus data does not prevent export. Export exactly one translation, including empty metadata-only translations; never include siblings.

Recovery download uses `format: "translation-recovery"`, version 1, identity/name/chapter, current local `doc`, source excerpts and validation errors. It is available for conflict, server unavailability, missing corpus, invalid or oversized work, without a server request.
