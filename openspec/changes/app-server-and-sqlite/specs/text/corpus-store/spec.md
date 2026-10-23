## Purpose

Holds the Greek New Testament text and its linguistic data in a server-side database built from the ingest output, so the app can serve and query it, and it can be rebuilt at any time without affecting users' saved work.

## ADDED Requirements

### Requirement: Corpus built from ingest output

The corpus store SHALL be built entirely from the ingest pipeline's output, by a single repeatable command.

Running the build again with the same ingest output SHALL produce a store with identical contents.

The build SHALL refuse ingest output whose format version it does not recognise, and SHALL leave the existing store in place when it refuses or fails.

#### Scenario: Repeatable build

- **WHEN** the corpus store is built twice from the same ingest output
- **THEN** both stores contain identical words, verses and attribution records

#### Scenario: Unknown format refused

- **WHEN** the build is given ingest output with an unrecognised format version
- **THEN** it fails with a message naming the version
- **AND** the previously built store is unchanged

#### Scenario: Failed build leaves the old store

- **WHEN** a build fails partway through
- **THEN** the app keeps serving the store from before the build

### Requirement: Read-only at runtime

The running application SHALL only read from the corpus store, never write to it.

#### Scenario: No runtime writes

- **WHEN** the application handles any user request
- **THEN** the corpus store is not modified

### Requirement: Chapter and word retrieval

The corpus store SHALL return a chapter's words in canonical order, each with its MACULA identifier, surface form, following punctuation, verse number, lemma, gloss, part of speech and applicable morphology fields.

The corpus store SHALL return any single word by its MACULA identifier.

The corpus store SHALL report which chapters are available, so the app can distinguish "not yet ingested" from "does not exist".

#### Scenario: Chapter in order

- **WHEN** the app requests a chapter that has been ingested
- **THEN** all its words are returned once each, in canonical order

#### Scenario: Word by identifier

- **WHEN** the app requests a word by its MACULA identifier
- **THEN** that word and its linguistic data are returned

#### Scenario: Chapter not ingested

- **WHEN** the app requests a valid New Testament chapter that has not been ingested
- **THEN** the store reports it as unavailable rather than returning an empty chapter

### Requirement: Attribution held with the corpus

The corpus store SHALL hold the attribution metadata emitted by ingest, and the app's credits SHALL be read from it.

The corpus store SHALL NOT contain UBS semantic-domain attributes.

#### Scenario: Attribution available after a build

- **WHEN** the corpus store has been built
- **THEN** it contains an attribution record for the SBL Greek New Testament and for the MACULA Greek Linguistic Datasets

#### Scenario: No UBS attributes

- **WHEN** the corpus store's tables are inspected
- **THEN** no table or column holds Louw-Nida or UBS semantic-domain data
