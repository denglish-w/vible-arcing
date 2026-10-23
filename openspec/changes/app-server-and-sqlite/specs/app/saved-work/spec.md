## Purpose

Keeps users' analyses (arcing and bracketing) and grammatical diagrams safely stored on the server, so work survives reloads, restarts and corpus rebuilds and can be reopened later.

## ADDED Requirements

### Requirement: Durable saved work

The system SHALL store each analysis and each diagram on the server so it survives a page reload, a browser change, and a server restart.

Analyses and diagrams SHALL be stored as distinct kinds of record. A diagram SHALL NOT be stored as, or converted into, an analysis, or the reverse.

Each saved record SHALL identify the passage and the text edition it was built over, and SHALL reference words by their MACULA word identifiers.

#### Scenario: Work survives a server restart

- **WHEN** a user saves an analysis and the server is restarted
- **THEN** the analysis can be reopened with identical content

#### Scenario: Work survives a different browser

- **WHEN** a user saves an analysis in one browser and opens the app in another browser on the same server
- **THEN** the analysis is listed and can be opened

#### Scenario: Records reference stable word ids

- **WHEN** a saved record is inspected
- **THEN** every word it refers to is referenced by its MACULA identifier, not by its position in a verse or chapter

### Requirement: Saving never blocks editing

Edits SHALL take effect in the editor immediately, without waiting for the server.

The system SHALL save changes automatically, without a separate save action.

If a save fails, the system SHALL keep the unsaved changes in the editor, tell the user that the work is not saved, and retry.

#### Scenario: Edit applies before the save completes

- **WHEN** a user makes an edit while the server is slow to respond
- **THEN** the edit is visible in the editor at once

#### Scenario: Server unreachable

- **WHEN** a save fails because the server cannot be reached
- **THEN** the editor keeps the user's changes and shows that they are not saved
- **AND** the save is retried and the indicator clears once it succeeds

#### Scenario: Leaving with unsaved changes

- **WHEN** a user tries to close the page while changes are not yet saved
- **THEN** the browser asks the user to confirm leaving

### Requirement: Saved work rejected if invalid

The server SHALL refuse to store an analysis that fails the structural validation rules, using the same validation module as the editor.

#### Scenario: Invalid analysis refused

- **WHEN** a request to save an analysis that violates a structural rule reaches the server
- **THEN** the server refuses it and the stored copy is unchanged

### Requirement: Listing, reopening and deleting work

A user SHALL be able to list saved analyses and diagrams, showing for each its title, passage, kind and last-modified time, newest first.

A user SHALL be able to reopen any listed record and to delete it. Deleting SHALL require confirmation.

#### Scenario: Listing saved work

- **WHEN** a user opens the list of saved work
- **THEN** every saved analysis and diagram is shown with its title, passage, kind and last-modified time, newest first

#### Scenario: Deleting with confirmation

- **WHEN** a user deletes a saved analysis and confirms
- **THEN** it no longer appears in the list and cannot be reopened

### Requirement: Saved work isolated from corpus rebuilds

Rebuilding or replacing the Greek corpus SHALL NOT modify or delete any saved work.

#### Scenario: Corpus rebuild keeps saved work

- **WHEN** the corpus is rebuilt from ingest output while saved analyses exist
- **THEN** every saved analysis is still present and unchanged

### Requirement: Single-user operation until accounts exist

Until user accounts exist, the system SHALL treat all saved work as belonging to one user. The project's deployment documentation SHALL state that the app must not be exposed publicly in this mode.

#### Scenario: Deployment warning documented

- **WHEN** the deployment documentation is read
- **THEN** it states that, without accounts, every visitor can read and change all saved work, so the app must only be run locally or privately
