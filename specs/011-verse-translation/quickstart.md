# Quickstart Validation: Verse Translation

This guide defines acceptance for the future implementation. Feature 011 is currently planned; the scenarios below are not claims that its UI or routes already exist.

## Prerequisites and baseline

Use the Node version in `.node-version`, run `npm ci`, and work on a local disposable data directory with a seeded corpus. Follow the repository README for corpus provisioning; never rebuild or replace real saved work for a test. New schema changes must run through the existing migration/backup path.

```sh
npm run db:migrate
npm run db:seed
npm run dev
```

Use `http://127.0.0.1:3000`, with Host protection enabled. Open Philippians 1. See [data-model.md](data-model.md) for limits and [contracts](contracts/persistence.md) for action/export outcomes. Run malformed-input tests through injected in-memory databases rather than editing production data.

## Writing, storage and blank defaults

Turn Translate on and leave without editing: no translation row, receipt or saved-work entry should be created. Return, write translation and notes under two verses, wait for Saved and compare content after reload, another browser and server restart. Explicitly create an empty named translation and verify it is listed. Clear a simple verse to remove that verse's stored data; clear all verses and verify the named translation remains. Toggle Translate off during an edit and verify saving and failure recovery remain available. Test stale/invalid browser settings and blocked localStorage.

## Structure and word help

Split a verse twice, type distinct text/notes, merge with and without same-field collisions, and check exact text and sequential labels after reload. Use a long verse split at every word to check labels past z. Group separate and nested ranges; test reverse selection, exact duplicates, partial overlap, crossing verses/segments and split inside grouping. Invalid edits explain their reason and leave stored content unchanged. Single click/tap/Enter must still open word details with Translate on.

## Named records and races

Create Literal and Smooth with different boundaries and text. Switch, reload and visit from another browser; verify server-persisted active selection and independent content. Rename using whitespace, case-equivalent names, composed/decomposed Unicode, sigma/final sigma, sharp-s/SS, empty names and 81-character names. Duplicate an 80-character name repeatedly and verify suffixes fit the name limit. Concurrent tabs creating defaults/copies must allocate distinct names. Replay creation requests, including a lost successful response followed by retry and retry after deletion: one record at most, no resurrection. Edit again while first creation is in flight, lose the response and retry: newer text must remain pending until its own revisioned save succeeds; reopening after successful create/duplicate selects the new record.

Rename a record in one tab and save older content from another: conflict, with name/content unchanged on refusal. Delete active records and test previous-used selection fallback, stale preference fallback to modified-time order, last deletion to unsaved default, and deep links requesting missing/wrong-chapter ids.

## Slow, failed and conflicting saves

Measure two distinct conditions. Under SC-003 healthy conditions, every required request must commit and acknowledge within one second with no failures/conflicts; verify durable saving within three seconds of the last edit, including first creation and follow-up saves. Separately delay save processing/response by ten seconds: keystrokes remain below 100 ms, status must not say Saved prematurely, only one save per record is in flight and text/download remain available. The delayed case has no three-second durability assertion. Test retryable failure, conflict, invalid, unknown-word, deleted, oversized, unknown-version and corpus-missing outcomes. Keep text visible and recovery download usable for every case.

Switch records and chapters while a save/create is delayed or fails; old responses must never update the new session. Keep failed drafts reachable after switching and hiding Translate. Test conflict overwrite with a third concurrent write, save-as-copy and offline recovery download. While saving fails, navigate via chapter arrows, book title, logo/home, `/work`, credits and browser Back/Forward. Verify each destination still shows the global unsaved-work summary and return/retry/download controls; return to the reader and compare text exactly. Reload/close/external navigation must still prompt; cancel those prompts and verify every dirty session remains. Duplicate after local edits must include the just-flushed source snapshot.

Test field limits with multiline, astral Unicode, long paste and merge overflow. Check 512 KiB UTF-8 document boundaries including Greek snapshots; no text is truncated and no partial update commits. Test valid near-limit documents through the real server action transport.

## Corpus and export

Rebuild a disposable corpus preserving ids and verify reads leave stored documents byte-identical. Correct Greek spelling and punctuation while keeping the ordered ids unchanged: before saving, export must retain the old document/Greek; edit only a note and verify the successful save refreshes source Greek while preserving every user field, UUID, boundary and grouping except that intentional note edit. Repeat with a stale revision, server refusal and refreshed snapshots exceeding the byte limit: the stored document/Greek must remain unchanged. A forged client Greek snapshot must never be stored; verify server-canonical replacement. Missing/reordered ids must not take the text-only refresh path. Simulate a removed boundary/group endpoint in an isolated fixture: load does not mutate, diagnostics name affected anchors, normal save refuses, original export still includes saved Greek. Cancel repair, then confirm repair and verify text preservation and validator success. Repeat with missing corpus; saved export must remain available.

Open `/work`: each named translation is listed independently with chapter, kind and modified time; open enables Translate and selects that id. Export one translation and compare stored document plus Greek excerpts, including empty records and mismatched corpus. Foreign Host/Origin requests fail; same-origin export passes with attachment/nosniff/no-store. Delete with cancel/confirm and verify every sibling, analysis and diagram remains unchanged.

## Accessibility and theme matrix

Repeat split/merge/group with keyboard only and touch only, without drag, hover or multi-finger gestures, each in under one minute. Repeat switch/create/rename/duplicate/delete with keyboard, screen reader and touch, each under 30 seconds. Check escape cancellation, focus return, selection announcements, nested endpoint reading order, live save/refusal feedback, hidden verse numbers and long names at tablet and narrow widths. Render relevant stories in light/dark/sepia with axe; automated checks supplement manual screen-reader and touch verification.

## Automated gates and documentation

```sh
npm run lint
npm run typecheck
npm run format:check
npm test
npm run build
npm run build-storybook
lat check
```

Add targeted model, naming, autosave and database fixtures plus Storybook interaction tests before these broad checks. Verify generated app migrations are committed and the existing migration backup checks pass; run existing Docker smoke checks when implementation touches runtime packaging. Before implementation completion, mirror additive requirements into OpenSpec and update implemented Lat sections with specific source/test links. Planning-only artifacts stay under this feature directory.
