## Purpose

Provides the Greek New Testament text that discourse analyses are built over — passage addressing, word-level retrieval, and the attribution obligations that its open licence imposes on the application.

## ADDED Requirements

### Requirement: Greek New Testament text availability

The system SHALL provide the SBL Greek New Testament as the Greek source text.

The system SHALL cover the entire New Testament.

The text SHALL be available without network access to a third-party service at analysis time.

#### Scenario: Retrieving a passage

- **WHEN** a user requests a passage by book, chapter, and verse range
- **THEN** the system returns the Greek text of that passage in canonical word order

#### Scenario: Whole New Testament addressable

- **WHEN** a user requests any passage within any New Testament book
- **THEN** the system returns text for it

#### Scenario: Invalid reference

- **WHEN** a user requests a passage that does not exist in the New Testament
- **THEN** the system reports the reference as invalid and returns no text

### Requirement: Stable word addressing

Every word in the source text SHALL have a stable identifier that does not change between releases of the application.

A proposition SHALL be able to reference its span by word identifiers.

#### Scenario: Word identifiers are stable across releases

- **WHEN** an analysis saved under one release is opened under a later release
- **THEN** its propositions resolve to the same words of the source text

#### Scenario: Span resolves to text

- **WHEN** a proposition's span is resolved
- **THEN** the system returns the words of that span in canonical order

### Requirement: Word-level linguistic data

The system SHALL provide, for each word of the source text, its lemma and morphological parsing.

The system SHALL provide clause boundary information for the source text.

Where the source data marks a word as a conjunction, the system SHALL expose that classification so it can be matched against the relationship taxonomy's conjunction cues.

#### Scenario: Morphology available per word

- **WHEN** the data for a word in the source text is requested
- **THEN** the system returns its lemma and morphological parsing

#### Scenario: Clause boundaries available

- **WHEN** clause information is requested for a passage
- **THEN** the system returns the clause boundaries within it

#### Scenario: Conjunctions identifiable

- **WHEN** a passage contains a word classified as a conjunction in the source data
- **THEN** the system exposes that classification for that word

### Requirement: Licence attribution

The system SHALL display attribution for the source text and every linguistic dataset it incorporates, in a location reachable by any user of the application.

Attribution SHALL state the name of each work, its licence, and a link to the licence.

Where a licence requires it, attribution SHALL indicate that the material has been modified.

The system SHALL retain the attribution required by each dataset's licence in the distributed source repository as well as in the running application.

#### Scenario: Attribution visible to users

- **WHEN** a user views the application's attribution information
- **THEN** the SBL Greek New Testament is named with its licence and a link to that licence
- **AND** every incorporated linguistic dataset is named with its licence and a link

#### Scenario: Modification disclosed

- **WHEN** a dataset has been reformatted or transformed for use in the application
- **THEN** the attribution states that the material has been modified

#### Scenario: Attribution present in the repository

- **WHEN** the source repository is inspected
- **THEN** it contains the attribution required by each incorporated dataset's licence

### Requirement: Licence compatibility of incorporated data

The system SHALL only incorporate text and linguistic data whose licence permits redistribution, modification, and commercial use.

The system SHALL NOT incorporate data licensed under terms prohibiting derivative works or commercial use.

The system SHALL NOT incorporate data whose licence would impose redistribution obligations on the application's own source code.

#### Scenario: Non-derivative-permitting data excluded

- **WHEN** a dataset's licence prohibits derivative works or commercial use
- **THEN** the system does not incorporate it

#### Scenario: Copyleft data excluded

- **WHEN** a dataset's licence would require the application's source or derived data to be redistributed under that same licence
- **THEN** the system does not incorporate it

#### Scenario: Permissively licensed data incorporated

- **WHEN** a dataset is licensed permissively with an attribution requirement only
- **THEN** the system may incorporate it, subject to displaying the required attribution

### Requirement: Text edition identification

The system SHALL identify which text edition an analysis was built over.

#### Scenario: Analysis records its edition

- **WHEN** an analysis is created
- **THEN** the text edition it was built over is recorded with it
