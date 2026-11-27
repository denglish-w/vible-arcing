# Feature Specification: Saved Work

**Source**: `openspec/specs/app/saved-work/spec.md` (OpenSpec is authoritative; where this copy disagrees, OpenSpec wins).

**Feature Branch**: `005-saved-work`

**Created**: 2026-11-05

**Status**: Implemented

**Input**: User description: "Keep a user's analyses and diagrams safely stored so they survive reloads, restarts, conflicts and corpus rebuilds and can be reopened; source `openspec/specs/app/saved-work/spec.md`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Work is kept and reopened (Priority: P1)

A student or pastor saves an analysis or a diagram and comes back later, in the same or another browser, and finds it exactly as they left it. A list at `/work` shows everything they have saved so they can reopen or delete it.

**Why this priority**: Coursework and sermon preparation span many sessions. Losing work is unacceptable (constitution principle V).

**Independent Test**: Save an analysis, restart the server, open the list, reopen the record and compare content.

**Acceptance Scenarios**:

1. **Given** a saved analysis, **When** the server is restarted, **Then** the analysis can be reopened with identical content.
2. **Given** an analysis saved in one browser, **When** the user opens the app in another browser on the same computer, **Then** the analysis is listed and can be opened.
3. **Given** saved analyses and diagrams, **When** the user opens the list, **Then** each is shown with title, passage, kind and last-modified time, newest first.
4. **Given** the user creates a record, **When** they then open the list, **Then** the new record is shown.
5. **Given** a saved analysis, **When** the user deletes it and confirms, **Then** it no longer appears in the list and cannot be reopened.
6. **Given** a saved analysis, **When** its stored copy is inspected, **Then** every word it refers to is referenced by its MACULA identifier, not by a position in a verse or chapter.
7. **Given** a diagram and an analysis, **When** either is stored, **Then** each remains its own kind of record and is never stored as, or converted into, the other.

---

### User Story 2 - Editing never waits for the server (Priority: P1)

A user edits and sees the change at once. Changes are saved in the background with no save button. If saving fails, the user's changes are kept, they are told, and they are never silently lost.

**Why this priority**: The app must feel as fast as a single-page app, and a slow or unreachable server must not cost the user work.

**Independent Test**: Make an edit against a slow server, then against an unreachable one, then against a refusing one, and check what is shown and kept.

**Acceptance Scenarios**:

1. **Given** the server is slow to respond, **When** the user makes an edit, **Then** the edit is visible in the editor at once.
2. **Given** a save fails because the server cannot be reached, **When** the failure happens, **Then** the editor keeps the changes and shows that they are not saved, retries, and clears the indicator once a save succeeds.
3. **Given** a save is refused because the record was deleted, the content is invalid, it refers to a word the corpus no longer has, it is too large, or the corpus has not been built, **When** the refusal arrives, **Then** the system stops retrying, keeps the changes, says which of these happened, and offers to download the work as a file.
4. **Given** changes are not yet saved, **When** the user tries to close the page, **Then** the browser asks them to confirm leaving.

---

### User Story 3 - Conflicting saves never lose work (Priority: P2)

A user has the same record open in two tabs. A save from the older version never silently overwrites the newer one, and the user decides what happens to their changes.

**Why this priority**: Two tabs are common in long sessions; silent overwrite would destroy work.

**Independent Test**: Open one analysis in two tabs, save in one, then save in the other.

**Acceptance Scenarios**:

1. **Given** an analysis open in two tabs and one tab has saved, **When** the other tab saves changes based on the earlier version, **Then** the save is not applied, the stored version is unchanged, and the second tab keeps its changes and says the work was changed elsewhere.
2. **Given** a conflict, **When** the user chooses to overwrite, **Then** their version is stored and becomes the latest.
3. **Given** a conflict, **When** the user chooses to save as a new copy, **Then** a new record holding their changes is created and the other version is left as it was.
4. **Given** a conflict, **When** the user chooses to download, **Then** their changes are offered as a file.

---

### User Story 4 - Invalid or unknown work is refused (Priority: P2)

The server checks every save with the same validation rules the editor uses, so a bad record can never replace a good one.

**Why this priority**: The server is a second trust boundary; the stored copy must always be valid.

**Independent Test**: Send saves that break a structural rule, name an unknown word, exceed the size limit, or name an unknown document version, and confirm each is refused with the stored copy untouched.

**Acceptance Scenarios**:

1. **Given** a request to save an analysis that violates a structural rule, **When** it reaches the server, **Then** the server refuses it and the stored copy is unchanged.
2. **Given** a save that refers to a word identifier not in the corpus store, **When** it reaches the server, **Then** it is refused and the stored copy is unchanged.
3. **Given** a save of an analysis or diagram that is over the size limit or names an unknown document version, **When** it reaches the server, **Then** it is refused with that reason and the stored copy is unchanged.
4. **Given** an analysis is saved, **When** its passage is recorded, **Then** the passage is the range of the words it contains, whatever passage the request claims.

---

### User Story 5 - Export an analysis to a file (Priority: P2)

A user downloads any saved analysis as a file that names its passage and edition, so they have a copy outside the app.

**Why this priority**: Users must always be able to take their work with them (constitution principle V).

**Independent Test**: Export a saved analysis and check the file's passage, edition, document version and content against the stored record.

**Acceptance Scenarios**:

1. **Given** a saved analysis, **When** the user exports it, **Then** a file is downloaded that names the passage and edition and holds the analysis exactly as stored.

---

### User Story 6 - Saved work survives rebuilds and upgrades (Priority: P3)

Rebuilding the Greek corpus or upgrading the app never alters saved work, and a failed or damaged state never results in an empty store replacing it.

**Why this priority**: These are rare events, but a mistake in them destroys all saved work at once.

**Independent Test**: Rebuild the corpus with saved analyses present; apply a schema change and force one to fail; start the server with the store missing and with it damaged.

**Acceptance Scenarios**:

1. **Given** saved analyses exist, **When** the corpus is rebuilt from ingest output, **Then** every saved analysis is still present and unchanged.
2. **Given** an existing store of saved work, **When** a schema change is applied, **Then** a backup copy from before the change exists afterwards.
3. **Given** a schema change fails partway, **When** the server is started, **Then** it does not start and the backup from before the change is intact.
4. **Given** the store does not exist, **When** the server starts, **Then** it reports that the database must be set up and does not create an empty one in its place.
5. **Given** the store fails its integrity check, **When** saved work is requested, **Then** the system refuses to serve it, says the store is damaged and where the backups are, and leaves the file as it is.
6. **Given** the run and deployment documentation, **When** it is read, **Then** it states that without accounts anyone who can reach the server can read and change all saved work, so the app must only be run locally or privately.

### Edge Cases

- A save arrives for a record that was deleted in another tab: reported as a permanent refusal, not a conflict, and the changes are kept with a download offered.
- A stale or deleted record is reported before content problems when a save has both.
- Edits made while a save is in flight: the later edits are saved afterwards and are not marked saved early.
- The user leaves the editor with unsaved edits that are not waiting on a decision: they are sent once more without retries.
- An analysis with some propositions not yet connected is still saved (see feature 006).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST store each analysis and each diagram on the server so it survives a page reload, a browser change and a server restart.
- **FR-002**: The system MUST store analyses and diagrams as distinct kinds of record, and MUST NOT store or convert one as the other.
- **FR-003**: Each saved record MUST identify the passage and the text edition it was built over.
- **FR-004**: Every word an analysis refers to MUST be referenced by its MACULA word identifier and MUST exist in the corpus store; a diagram's passage range MUST be given by MACULA word identifiers that exist in the corpus store.
- **FR-005**: The server MUST refuse a save that names a word identifier not in the corpus store, leaving the stored copy unchanged.
- **FR-006**: The recorded passage of an analysis MUST be the range of the words it contains, not the passage the request claims.
- **FR-007**: Edits MUST take effect in the editor immediately, without waiting for the server.
- **FR-008**: The system MUST save changes automatically, with no separate save action.
- **FR-009**: On a failure that may pass (such as an unreachable server), the system MUST keep the unsaved changes, tell the user the work is not saved, and retry until it succeeds.
- **FR-010**: On a failure that retrying cannot fix, the system MUST keep the unsaved changes, stop retrying, say which cause applied, and offer to download the work as a file. The causes are: record deleted, content invalid, a word the corpus no longer has, too large, or corpus not built.
- **FR-011**: The system MUST ask the user to confirm leaving the page while changes are unsaved.
- **FR-012**: A save based on an older version MUST NOT overwrite the newer stored version silently and MUST NOT discard the user's unsaved changes; the second tab MUST keep its changes and say the work was changed elsewhere.
- **FR-013**: After a conflict the user MUST be able to overwrite the stored version, save their changes as a new copy (leaving the other version as it was), or download them as a file.
- **FR-014**: The server MUST refuse to store an analysis that fails the structural validation rules, using the same validation module as the editor.
- **FR-015**: The server MUST refuse any record whose document is over the stated size limit or whose document version it does not recognise, stating that reason, and leave the stored copy unchanged.
- **FR-016**: A user MUST be able to download any saved analysis as a file recording its passage, edition, document version and content, holding the analysis exactly as stored.
- **FR-017**: A user MUST be able to list saved analyses and diagrams, each with title, passage, kind and last-modified time, newest first, reflecting current stored work every time the list is opened.
- **FR-018**: A user MUST be able to reopen any listed record and delete it, and deleting MUST require confirmation.
- **FR-019**: Rebuilding or replacing the Greek corpus MUST NOT modify or delete any saved work.
- **FR-020**: Before a schema change is applied to the store of saved work, the system MUST keep a backup copy; if the change fails, the system MUST NOT start serving and the backup MUST remain.
- **FR-021**: If the store of saved work is missing or damaged, the system MUST say so and MUST NOT replace it with an empty store; for a missing store it reports that the database must be set up, and for a damaged one it refuses to serve saved work, says where the backups are and leaves the file as it is.
- **FR-022**: Until accounts exist, the system MUST treat all saved work as one user's and MUST limit who can reach it as set out in `app/local-only-server`; the run and deployment documentation MUST state that anyone who can reach the server can read and change all saved work, so the app must only be run locally or privately.

### Key Entities

- **Analysis record**: a discourse analysis (see feature 006) with title, passage, edition, document version, content and a revision that changes on every save.
- **Diagram record**: a grammatical diagram, a separate kind from an analysis, with a passage range given by word identifiers.
- **Saved-work list entry**: title, passage, kind and last-modified time for one record.
- **Saved work store**: the server-side home of all records, kept apart from the corpus store.
- **Export file**: a download of one analysis with passage, edition, document version and content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested restarts and browser changes, a saved analysis reopens with content identical to what was saved.
- **SC-002**: An edit is visible in the editor within one second of the user's action even when the server takes ten seconds to answer.
- **SC-003**: In every tested failure (unreachable server, conflict, each permanent refusal), the user's unsaved changes are still present in the editor and can be downloaded.
- **SC-004**: In every tested invalid, unknown-word, oversized or unknown-version save, the stored copy is byte-for-byte unchanged afterwards.
- **SC-005**: After a corpus rebuild, a failed schema change, and a start with a missing or damaged store, every previously saved record is still present and unchanged, and no empty store has replaced it.
- **SC-006**: A user can find, reopen and delete (with confirmation) any saved record from the list in under one minute.
- **SC-007**: The list of 100 saved records shows each with title, passage, kind and last-modified time in newest-first order, with no record missing.

## Assumptions

- The feature is already built: the `/work` list, the save actions that validate before storing, the autosave loop (`src/lib/autosave.ts`) and the download route exist. This spec records the behaviour for the Spec Kit copy.
- The size limit and the recognised document versions are set in the server and stated to the user at refusal; this spec does not fix their values.
- The arcing and diagramming editors do not exist yet, so the autosave behaviour is exercised through the save loop and server actions rather than a finished editor.
- Importing an exported file is not part of this feature; it comes with the arcing editor.
- Parsing-practice attempts (spec 010) are a further kind of saved work in their own table: append-only, validated, exportable and kept across re-ingest, but not listed on `/work`.
- The app is single-user and local only; accounts, sharing and Postgres are out of scope.
- Constitution principles V and VII apply: work is kept and validated by one shared module, and the local-only protection is not weakened.
