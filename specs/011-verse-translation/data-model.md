# Data Model: Verse Translation

This is the proposed version-1 model; it does not alter analyses, diagrams or the corpus schema.

## Translation record

| Field                                | Meaning / invariant                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| id                                   | Server record UUID; independent identity for duplicates                      |
| name, nameKey                        | Trimmed 1–80 code point display name; NFC/uppercase/lowercase uniqueness key |
| edition, book, chapter               | One canonical installed chapter, currently SBLGNT                            |
| passageLabel, startWordId, endWordId | Server-derived chapter metadata, even for an explicitly created empty record |
| docVersion                           | 1; reject unsupported versions                                               |
| doc                                  | Whole translation document serialized as JSON, at most 512 KiB UTF-8         |
| revision                             | Starts at 1, incremented on every content save or rename                     |
| createdAt, updatedAt                 | Server timestamps; selection alone changes neither                           |

Use a separate `translations` table with a unique index on `(edition, book, chapter, nameKey)`. Every update/delete includes the expected revision and distinguishes conflict from not-found before content validation. SQLite transaction boundaries cover name allocation, create/copy, deletion preference repair and conditional updates. Do not add translations to an analysis/diagram-only fallback.

## Translation document

`TranslationDocument` contains a document version and sparse `verses` keyed by canonical verse number. Chapter identity is checked against the server record, not taken on trust from the client.

A `VerseTranslation` contains `sourceWords`, `boundaries`, ordered `segments` and `groupings`. `sourceWords` preserves canonical id, verse, Greek text and trailing punctuation/space for export. Only saved verses get snapshots. After missing-record/stale-revision prechecks and before content validation, when stored and current verse word ids are identical and in the same order, prepare a candidate with canonical current text/punctuation in `sourceWords`. The editor uses its loaded corpus, and the server independently rebuilds snapshots from its own corpus, ignoring client-supplied Greek text. Validate this candidate, including the 512 KiB limit, then persist it only through an atomic expected-revision update; a concurrent change can still conflict at commit. At successful validation these words must match the current chapter; never store client-authored substitute Greek. This refresh changes no user text, UUID, boundary or grouping; reads, exports, conflicts and refusals preserve the original stored snapshot. Missing or reordered ids require explicit repair. New verses use server-built snapshots directly.

A boundary holds `afterWordId`. Resolve every boundary against canonical order, require uniqueness, refuse last-word boundaries and reject a split inside an existing grouping. Sort for presentation; positions are temporary calculations, never persisted identities.

A segment contains a stable UUID, first and last word ids, `translation` and `notes`. Endpoints must exactly cover the source verse once, with no gaps or overlap, partitioned by the boundary list. Initial whole-verse segment is synthesized for absent verses. Labels are derived from order: verse number alone for one segment; bijective letters a–z, aa, ab and onward for multiple segments.

A grouping contains UUID, `segmentId`, first and last word ids, `rendering` and `notes`. Its inclusive interval must contain at least two words, lie in that segment and verse, and be disjoint from or contained in/contain every other grouping. Exact duplicate intervals and partial overlap are refused. UUIDs identify entries; word ids anchor them. Duplicate translations deep-copy all content and may preserve nested UUIDs because their namespace includes translation id.

## Pure edits and validation

One browser-safe `validateTranslation` module accepts unknown document input plus canonical chapter words and returns typed errors with verse, segment/group ids and word ids. Server and editor both use it; server always loads its own corpus data. Validate shape, version, text code-point limits, duplicate ids, exact coverage, boundary consistency, range rules and byte limits. The server also validates name and chapter membership.

Split keeps the existing segment id and text on the left, creates an empty right segment and reassigns wholly-right groupings. Groupings spanning the proposed boundary cause refusal. Merge keeps the left id, removes the boundary, reassociates all groupings and combines each field in reading order. Ask confirmation only if both values in a corresponding field are nonempty. A limit overflow keeps the proposed text locally with an error and download; no silent truncation or partial server update.

Normalize after valid edits: remove a verse only when it has no extra boundaries, no groupings and empty translation and notes. A whitespace-only string is not empty. Remove its source snapshot with it. Normalization never deletes the parent translation.

## Preferences and creation receipts

A `translation_chapter_preferences` row has `(edition, book, chapter)` as primary key and `activeTranslationId`, constrained to an existing record in the same chapter by server transaction checks. A `translation_recency` row tracks each translation's last-used time. Opening a chapter reads preference without inserting default work. Successful creation (including first-write), duplication and explicit selection update preference and recency atomically, without modifying the document revision.

Resolution order on ordinary open: valid stored selection, otherwise most recently modified remaining translation (tie: id), otherwise memory-only default. When deleting the active record: choose the most recently used remaining translation (then updatedAt/id), or the unsaved default if none. The explicit saved-work URL takes precedence and updates the chapter preference; a missing or wrong-chapter requested id yields not-found and never silently substitutes another record.

Creation receipts map client operation UUID to request fingerprint and original result/record id. Store atomically with the new record. Same token and original payload returns the same result; different payload returns invalid. Keep a receipt tombstone after deletion; a retry cannot resurrect the record. Generated first-write names are selected inside the transaction; explicit invalid names leave the old name intact.

## Client lifecycle

States are untouched default, creating, persisted clean, pending, saving, retryable not-saved, conflict, permanent refusal and deleted. Only a user edit or explicit management operation leaves untouched default. Structural work also counts as an edit, even with no text. Creation runs before starting the ordinary autosave controller, with a frozen payload and captured edit generation. In-flight creation holds newer local snapshots for a follow-up revision-checked save. A receipt acknowledges only its original generation; initialize the revisioned controller after creation and notify it of newer edits immediately. A retry receipt must never mark newer unsent edits as saved.

The client provider and global recovery summary are mounted in `src/app/layout.tsx`, above all route children, and are not keyed/remounted by pathname or active record. Each session owns its document, record id, revision and autosave controller. A switch flushes the old session before activating the new one; failure leaves the old session retained with a reachable status/download. Response handlers update only their originating session. Hiding Translate keeps sessions alive. Internal departure initiates a flush while sessions and return/retry/download controls remain available on `/work`, `/book`, `/`, `/credits` and other chapters, including Back/Forward. Pending and failed sessions participate in the full-document leave guard. Explicit discard/deletion is confirmed before releasing unsaved text.

## Corpus mismatch and exports

Read operations never rewrite malformed or unmatched saved content. Compare against canonical words and report affected anchors. Reject normal saves until unknown anchors are removed or explicitly repaired; unrelated text remains local. Repair preview reconstructs the affected verse on current words, preserves segment text in reading order and preserves grouping text in notes when its anchor is removed. Cancel leaves the document unchanged. A confirmed repair goes through the same validator and revision check.

Export includes the exact stored document plus its source-derived Greek excerpts. Client recovery downloads include the current unsaved document, even if invalid/oversized; mark recovery format and validation errors so this is not presented as a successful saved export. No import is implemented.
