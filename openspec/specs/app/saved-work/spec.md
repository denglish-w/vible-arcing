# app/saved-work Specification

## Purpose
Keeps users' analyses (arcing and bracketing) and grammatical diagrams safely stored on the server, so work survives reloads, restarts, conflicts and corpus rebuilds and can be reopened later.
## Requirements
### Requirement: Durable saved work

The system SHALL store each analysis and each diagram on the server so it survives a page reload, a browser change, and a server restart.

Analyses and diagrams SHALL be stored as distinct kinds of record. A diagram SHALL NOT be stored as, or converted into, an analysis, or the reverse.

Each saved record SHALL identify the passage and the text edition it was built over. Every word an analysis refers to SHALL be referenced by its MACULA word identifier and SHALL exist in the corpus store. A diagram's passage range SHALL be given by MACULA word identifiers that exist in the corpus store.

#### Scenario: Work survives a server restart

- **WHEN** a user saves an analysis and the server is restarted
- **THEN** the analysis can be reopened with identical content

#### Scenario: Work survives a change of browser

- **WHEN** a user saves an analysis in one browser and then opens the app in another browser on the same computer
- **THEN** the analysis is listed and can be opened

#### Scenario: Records reference stable word ids

- **WHEN** a saved analysis is inspected
- **THEN** every word it refers to is referenced by its MACULA identifier, not by its position in a verse or chapter

#### Scenario: Unknown word refused

- **WHEN** a save refers to a word identifier that is not in the corpus store
- **THEN** the server refuses it and the stored copy is unchanged

#### Scenario: Passage taken from the content

- **WHEN** an analysis is saved
- **THEN** its recorded passage is the range of the words it contains, whatever passage the request claims

### Requirement: Saving never blocks editing

Edits SHALL take effect in the editor immediately, without waiting for the server.

The system SHALL save changes automatically, without a separate save action.

If a save fails for a reason that may pass, such as the server being unreachable, the system SHALL keep the unsaved changes, tell the user that the work is not saved, and retry. If a save fails for a reason that retrying cannot fix, the system SHALL keep the unsaved changes, stop retrying, and tell the user why, with a way to download their work.

#### Scenario: Edit applies before the save completes

- **WHEN** a user makes an edit while the server is slow to respond
- **THEN** the edit is visible in the editor at once

#### Scenario: Server unreachable

- **WHEN** a save fails because the server cannot be reached
- **THEN** the editor keeps the user's changes and shows that they are not saved
- **AND** the save is retried and the indicator clears once it succeeds

#### Scenario: Save that cannot succeed

- **WHEN** a save is refused because the record was deleted, the content is invalid, it refers to a word the corpus no longer has, it is too large, or the corpus has not been built
- **THEN** the system stops retrying, keeps the user's changes, says which of these happened, and offers to download the work as a file

#### Scenario: Leaving with unsaved changes

- **WHEN** a user tries to close the page while changes are not yet saved
- **THEN** the browser asks the user to confirm leaving

### Requirement: Conflicting saves never lose work

When the same record is changed in two places, a save based on an older version SHALL NOT overwrite the newer stored version silently, and SHALL NOT discard the user's unsaved changes.

The user SHALL be able to choose to overwrite the stored version, to save their changes as a new copy, or to download them as a file.

#### Scenario: Two tabs edit the same analysis

- **WHEN** an analysis is open in two tabs, one tab saves, and then the other tab saves changes based on the earlier version
- **THEN** the second save is not applied, the stored version is unchanged, and the second tab keeps its changes and says the work was changed elsewhere

#### Scenario: Overwrite after a conflict

- **WHEN** after a conflict the user chooses to overwrite
- **THEN** their version is stored and becomes the latest

#### Scenario: Save as copy after a conflict

- **WHEN** after a conflict the user chooses to save as a new copy
- **THEN** a new record holding their changes is created and the other version is left as it was

### Requirement: Saved work rejected if invalid

The server SHALL refuse to store an analysis that fails the structural validation rules, using the same validation module as the editor.

The server SHALL refuse any record whose document is larger than the stated limit or whose document version it does not recognise.

#### Scenario: Invalid analysis refused

- **WHEN** a request to save an analysis that violates a structural rule reaches the server
- **THEN** the server refuses it and the stored copy is unchanged

#### Scenario: Oversized or unknown-version document refused

- **WHEN** a request to save an analysis or diagram is over the size limit or names an unknown document version
- **THEN** the server refuses it with that reason and the stored copy is unchanged

### Requirement: Exporting an analysis

A user SHALL be able to download any saved analysis as a file that records its passage, edition, document version and content.

#### Scenario: Export a saved analysis

- **WHEN** a user exports a saved analysis
- **THEN** a file is downloaded that names the passage and edition and holds the analysis exactly as stored

### Requirement: Listing, reopening and deleting work

A user SHALL be able to list saved analyses and diagrams, showing for each its title, passage, kind and last-modified time, newest first. The list SHALL reflect the current stored work every time it is opened.

A user SHALL be able to reopen any listed record and to delete it. Deleting SHALL require confirmation.

#### Scenario: Listing saved work

- **WHEN** a user opens the list of saved work
- **THEN** every saved analysis and diagram is shown with its title, passage, kind and last-modified time, newest first

#### Scenario: New work appears in the list

- **WHEN** a user creates a record and then opens the list
- **THEN** the new record is shown

#### Scenario: Deleting with confirmation

- **WHEN** a user deletes a saved analysis and confirms
- **THEN** it no longer appears in the list and cannot be reopened

### Requirement: Saved work isolated from corpus rebuilds

Rebuilding or replacing the Greek corpus SHALL NOT modify or delete any saved work.

#### Scenario: Corpus rebuild keeps saved work

- **WHEN** the corpus is rebuilt from ingest output while saved analyses exist
- **THEN** every saved analysis is still present and unchanged

### Requirement: Saved work protected across upgrades

Before a schema change is applied to the store of saved work, the system SHALL keep a backup copy of it. If the change fails, the system SHALL NOT start serving, and the backup SHALL remain.

If the store of saved work is missing or damaged, the system SHALL say so and SHALL NOT replace it with an empty store.

#### Scenario: Backup before a schema change

- **WHEN** a schema change is applied to an existing store of saved work
- **THEN** a backup copy from before the change exists afterwards

#### Scenario: Failed schema change

- **WHEN** a schema change fails partway
- **THEN** the server does not start, and the backup from before the change is intact

#### Scenario: Store missing

- **WHEN** the server starts and the store of saved work does not exist
- **THEN** it reports that the database must be set up and does not create an empty one in its place

#### Scenario: Store damaged

- **WHEN** the store of saved work fails its integrity check
- **THEN** the system refuses to serve saved work, says the store is damaged and where the backups are, and leaves the file as it is

### Requirement: Single-user operation until accounts exist

Until user accounts exist, the system SHALL treat all saved work as belonging to one user, and SHALL limit who can reach it as set out in `app/local-only-server`.

#### Scenario: Deployment warning documented

- **WHEN** the project's run and deployment documentation is read
- **THEN** it states that, without accounts, anyone who can reach the server can read and change all saved work, so the app must only be run locally or privately

