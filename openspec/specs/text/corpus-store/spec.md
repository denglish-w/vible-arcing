# text/corpus-store Specification

## Purpose
Holds the Greek New Testament text and its linguistic data in a server-side database built from the ingest output, so the app can serve and query it, and it can be rebuilt at any time without affecting users' saved work.
## Requirements
### Requirement: Corpus format

The ingest pipeline SHALL emit, and the corpus build SHALL read, a published, versioned format in which every word carries its MACULA word identifier, surface form, following punctuation, verse number, lemma, gloss, part of speech and applicable morphology fields.

Words SHALL be identified by their MACULA identifier, never by their position in the chapter or verse.

The format SHALL NOT contain UBS semantic-domain attributes.

#### Scenario: Word identity is the MACULA id

- **WHEN** a word in the ingest output is inspected
- **THEN** it carries its MACULA identifier, and nothing downstream identifies it by position

#### Scenario: No UBS attributes in the output

- **WHEN** any ingest output file is inspected
- **THEN** it contains no Louw-Nida or UBS semantic-domain fields

### Requirement: Corpus built from ingest output

The corpus store SHALL be built entirely from the ingest pipeline's output, by a single repeatable command.

Running the build again with the same ingest output SHALL produce a store with identical rows in every table.

The build SHALL refuse ingest output whose format version it does not recognise, and SHALL leave the existing store in place when it refuses or fails.

#### Scenario: Repeatable build

- **WHEN** the corpus store is built twice from the same ingest output
- **THEN** every table in the two stores holds identical rows

#### Scenario: Unknown format refused

- **WHEN** the build is given ingest output with an unrecognised format version
- **THEN** it fails with a message naming the version
- **AND** the previously built store is unchanged

#### Scenario: Failed build leaves the old store

- **WHEN** a build fails partway through
- **THEN** the store from before the build is unchanged and still opens

### Requirement: Read-only at runtime

The running application SHALL only read from the corpus store, never write to it.

If the corpus store is missing or cannot be opened, the application SHALL say that the corpus must be built, and SHALL NOT create an empty store.

#### Scenario: Store opened read-only

- **WHEN** the application attempts a write to the corpus store
- **THEN** the write fails and the store is unchanged

#### Scenario: Store missing

- **WHEN** the application starts and the corpus store does not exist
- **THEN** pages that need the corpus show that the corpus has not been built, and no empty store is created

### Requirement: Book, chapter and word retrieval

The corpus store SHALL know every New Testament book and its number of chapters, in canonical order, whether or not the book has been ingested.

The corpus store SHALL return a chapter's words in canonical order, each with its MACULA identifier, surface form, following punctuation, verse number, lemma, gloss, part of speech and applicable morphology fields.

The corpus store SHALL return any single word by its MACULA identifier.

The corpus store SHALL distinguish a chapter that does not exist from one that exists but has not been ingested.

#### Scenario: Chapter in order

- **WHEN** the app requests a chapter that has been ingested
- **THEN** all its words are returned once each, in canonical order

#### Scenario: Word by identifier

- **WHEN** the app requests a word by its MACULA identifier
- **THEN** that word and its linguistic data are returned

#### Scenario: Chapter not ingested

- **WHEN** the app requests a valid New Testament chapter that has not been ingested
- **THEN** the store reports it as unavailable rather than returning an empty chapter

#### Scenario: Reference that does not exist

- **WHEN** the app requests a book that is not in the New Testament, or a chapter beyond the book's last
- **THEN** the store reports that the reference does not exist, distinctly from "unavailable"

### Requirement: Attribution held with the corpus

The corpus store SHALL hold the attribution metadata emitted by ingest, and the app's credits SHALL be read from it. Whenever the app shows corpus text, its credits SHALL be reachable.

The corpus store SHALL NOT contain UBS semantic-domain attributes.

#### Scenario: Attribution available after a build

- **WHEN** the corpus store has been built
- **THEN** it contains an attribution record for the SBL Greek New Testament and for the MACULA Greek Linguistic Datasets

#### Scenario: Credits shown from the store

- **WHEN** a user opens the credits from a page showing corpus text
- **THEN** each dataset in the store's attribution is listed with its licence, licence link, attribution statement and modification note

#### Scenario: No UBS attributes

- **WHEN** the corpus store's tables are inspected
- **THEN** no table or column holds Louw-Nida or UBS semantic-domain data

