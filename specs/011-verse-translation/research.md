# Research: Verse Translation

All decisions below are planning conclusions grounded in current repository code. No external API, package selection or dataset integration is required.

## Existing reader and saved work

**Decision:** Extend the props-driven reader and Greek word presentation; introduce `src/lib/translation/` and `src/db/translations.ts`. Reuse the existing save-result vocabulary and guarded server entry points.

**Rationale:** `src/components/reading/reader.tsx` accepts chapter data; `greek-text.tsx` owns the word popovers and groups words by verse. `src/db/work.ts` injects app/corpus connections, enforces a 512 KiB document limit and checks revisions. Its `tableFor` currently maps every non-analysis kind to diagrams: adding a union member alone would misroute data. Make dispatch exhaustive and keep translation writes in the dedicated module; merge summaries at the list boundary.

**Alternatives considered:** Store translations in analysis JSON (violates separate models); genericize all work persistence (unnecessary refactor); one translation per chapter (contradicts FR-026).

## Draft creation and concurrency

**Decision:** An untouched default is memory-only. The first text or structural edit persists the complete snapshot. Bootstrap creation outside `createAutosave`: retain a frozen creation payload plus its edit generation; replay only that payload until the receipt resolves, then start the revisioned controller from the acknowledged generation and immediately enqueue any newer snapshot. Never let a creation receipt success acknowledge newer unsent edits. Explicit create, rename or duplicate persists even an empty document. Use a client-generated UUID as a retry-safe creation token and separate expected revision 0 for first creation; never infer update versus create from a missing row during a later save.

**Rationale:** Multiple autosave retries must create one record, and a deleted record must never be resurrected. Creation retries return the original result for the same operation payload; changed content follows with a normal revision-checked save. Keep the token receipt and original payload fingerprint so retries after deletion return not-found, never recreate. The implicit default name is provisional: server allocation occurs transactionally on first persistence and returns the actual available name.

**Alternatives considered:** Create on Translate toggle (violates empty-default rule); create on each retry (duplicates); blindly upsert (resurrects deleted work).

## Naming and active selection

**Decision:** Store trimmed display name plus a deterministic key from Unicode NFC normalization followed by locale-independent uppercasing then lowercasing. Enforce unique `(edition, book, chapter, nameKey)` in SQLite. Default numeric and copy suffix allocation runs inside the same transaction as insertion; truncate the base of an automatic copy name by code points to reserve suffix space within 80 characters.

**Rationale:** SQLite's basic case-insensitive collation alone cannot implement the desired Unicode name policy. Shared client/server naming code gives consistent previews, while a database constraint protects races. A separate chapter preference points to the last used record; per-record recency supports the explicit deletion fallback. Visiting does not increment document revision or updatedAt, so choosing a translation does not trigger content conflicts or reorder `/work`.

Case-key policy deliberately treats final sigma/ordinary sigma and sharp-s/SS as equivalent; use the same shared function for previews, collision checks and the database key. Test non-ASCII names rather than relying on SQLite NOCASE. Successful create (including first-write), duplicate and rename of an unsaved default also set active preference and recency atomically.

**Alternatives considered:** localStorage selection (fails cross-browser); one unique chapter index (forbids multiplicity); updatedAt for selection (spurious conflicts).

## Save lifecycle and loss prevention

**Decision:** Reuse `createAutosave` with the existing 800 ms debounce, exponential retry and explicit overwrite/copy/download. Add an awaitable flush operation that serializes with an in-flight save, covers the latest queued generation and reports whether the record is clean or blocked. Retain dirty sessions keyed by chapter plus translation/draft id until saved or deliberately discarded. Translate off hides the editor only.

**Rationale:** `src/lib/use-autosave.ts` already binds options per recordKey. However, `createAutosave.dispose()` sends only a best-effort final save and cannot report a late refusal. Switching must send old work first and keep its controller/snapshot and warning reachable if it fails. Never use dispose as the switch protocol. Mount the client session registry and its global recovery summary in `src/app/layout.tsx`, above all route children. Internal navigation to another chapter, `/work`, `/book`, `/`, or `/credits`, and browser Back/Forward retain the same provider. Initiate a flush on internal departure without dropping failed/pending sessions; their return/retry/download controls stay visible on the destination page. Full document departure still uses beforeunload. A provider under `/read` is insufficient because leaving that subtree unmounts it.

**Alternatives considered:** Wait for every keystroke save (latency); drop old store on switch (data loss); a new save framework (duplicates existing behavior).

## Boundaries, source snapshots and recovery

**Decision:** Persist MACULA boundary/group endpoints and stable segment/group UUIDs. Derive labels and containment from corpus order. Store the Greek words for each saved verse as a minimal source snapshot (id, verse, text, after). On an edit save, after missing-record/stale-revision prechecks, if stored and current ordered word ids match, prepare a candidate with source words rebuilt from the canonical corpus before running the shared validator and byte-limit checks. The editor prepares its candidate from the loaded chapter; the server independently rebuilds it from its own corpus and never trusts client-supplied Greek. Only a successful revision-checked save persists the refreshed candidate. Reads/exports and failed/conflicting saves preserve the prior stored JSON and Greek; user text, UUIDs, boundaries and groupings are unchanged. Missing or reordered ids require explicit structural repair rather than this text-only refresh.

**Rationale:** A portable export must contain readable Greek even if a later ingest removes anchors. Snapshots provide export provenance, never authority to accept unknown ids. Load-time diagnostics preserve raw saved JSON; saves referencing removed ids are refused. Repair can remove an affected grouping or rebuild the verse structure on current words, with a preview that joins existing text in order and moves otherwise displaced grouping content to notes after explicit confirmation. All user text remains available in the original download.

**Alternatives considered:** Positional anchors (unstable); live-only export enrichment (fails after rebuild); automatically dropping invalid structures (loses work).

## Limits and normalization

**Decision:** Every translation/rendering/notes field supports 20,000 Unicode code points. Warn at 90% and show counts/errors; retain excess pasted or merged text locally rather than truncate. Total serialized document including source snapshots is limited to the existing 512 KiB in UTF-8, measured before storage. The server action transport must permit this valid payload plus its envelope; test the existing framework limit without increasing document allowance.

**Rationale:** This meets the spec's minimum note length and current saved-work ceiling. SC-003 measures durability only with each required request committing and acknowledging within one second, without failures/conflicts; the ten-second-delay test separately measures input latency, truthful status and no-loss recovery. Merge joins two nonempty fields with two newlines; empty plus nonempty preserves the latter exactly. Empty means length zero, not trim-empty: whitespace typed by the user is content. A verse disappears only with one default segment, empty fields and no groupings; the stored translation remains.

**Alternatives considered:** Unlimited text (unbounded work); trimming prose (changes user text); HTML/rich text (unneeded and unsafe).

## Interaction design

**Decision:** Keep ordinary word activation unchanged. Add explicit split and grouping modes, Shift-selection and drag as shortcuts; touch uses Start grouping, first word, last word, Group. Display equal split buttons at all internal word boundaries, with crossing-group refusals explained rather than hidden or ranked. Render grouping endpoints with paired glyphs and accessible labels, distinct from discourse brackets.

**Rationale:** `DESIGN.md` supplies reader typography, tokens, switches, quiet rules and word help. This is an Operate task inside a Read surface: Greek stays primary, editors sit under each verse, metadata and actions stay compact. No new visual world or standalone design file is needed.

**Alternatives considered:** Hijack every click for grouping (breaks word detail); drag-only grouping (inaccessible); automatic grouping (forbidden interpretation).

## Scope and sibling specifications

**Decision:** Implement against the current local reader, independently of 010 and 012–015. Keep Translate state in independently validated browser display settings and last-used translation on the server. Later account work must scope records, receipts, uniqueness and preferences to the server-derived owner and migrate all local records; do not accept an owner id from the client now.

**Rationale:** Current Host protection and existing OpenSpec persistence guarantees remain binding. No published English text or lexicon is bundled, and no parsing-mode behavior is decided here. Mirror the additive feature in an OpenSpec delta at implementation, while leaving implemented-state Lat pages unchanged during this planning-only command.

**Alternatives considered:** Wait for accounts or English line (unnecessary dependency); weaken local-only guards (violates constitution VII).
