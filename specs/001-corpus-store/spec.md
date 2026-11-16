# Feature Specification: Corpus Store

**Source**: Mirrors `openspec/specs/text/corpus-store/spec.md` (OpenSpec stays authoritative). One extra requirement, FR-016, comes from `CLAUDE.md` project state rather than that spec.

**Feature Branch**: `001-corpus-store`

**Created**: 2026-11-05

**Status**: Implemented

**Input**: User description: "Hold the Greek New Testament text and its linguistic data in a read-only store built from versioned ingest output (ported from the OpenSpec spec at openspec/specs/text/corpus-store)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a chapter's words in order (Priority: P1)

A student opens a chapter and sees every word of the Greek text, once each, in reading order, with the facts about each word (form, punctuation, verse, lemma, gloss, part of speech, morphology). Any single word can also be looked up directly by its stable identifier.

**Why this priority**: Everything the app shows or lets users analyse starts from the text. Without it nothing else works.

**Independent Test**: Request an ingested chapter and a single word by identifier. Check completeness, order and the data carried by each word.

**Acceptance Scenarios**:

1. **Given** a chapter that has been ingested, **When** the app requests it, **Then** all its words are returned once each, in canonical order.
2. **Given** a word's MACULA identifier, **When** the app requests that word, **Then** the word and its linguistic data are returned.
3. **Given** a valid New Testament chapter that has not been ingested, **When** the app requests it, **Then** the store reports it as unavailable rather than returning an empty chapter.
4. **Given** a book that is not in the New Testament, or a chapter beyond a book's last, **When** the app requests it, **Then** the store reports that the reference does not exist, distinctly from "unavailable".
5. **Given** any New Testament book, whether or not ingested, **When** the app asks which books and how many chapters exist, **Then** every book is listed in canonical order with its chapter count.

---

### User Story 2 - Words keep a stable identity (Priority: P1)

Saved work refers to words by identifier. The published corpus format gives every word its MACULA identifier and nothing downstream identifies a word by position, so saved work survives a rebuild or re-ingest.

**Why this priority**: Users' saved work depends on it.

**Independent Test**: Inspect ingest output and confirm each word has a MACULA id and that no consumer keys on position.

**Acceptance Scenarios**:

1. **Given** a word in the ingest output, **When** it is inspected, **Then** it carries its MACULA identifier, and nothing downstream identifies it by position.
2. **Given** the format, **When** a word is inspected, **Then** it carries surface form, following punctuation, verse number, lemma, gloss, part of speech and applicable morphology fields.

---

### User Story 3 - Rebuild the store safely and repeatably (Priority: P2)

The person running the app rebuilds the corpus store from the ingest output with one command, at any time, without affecting saved work. The same input always gives the same store, and a bad or failed build never damages the store already in use.

**Why this priority**: Rebuilds must be safe, or the corpus could not be updated without risk.

**Independent Test**: Build twice from the same input and compare rows. Build from an unrecognised format version and from a build that fails partway, then check the old store is intact.

**Acceptance Scenarios**:

1. **Given** the same ingest output, **When** the store is built twice, **Then** every table in the two stores holds identical rows.
2. **Given** ingest output with an unrecognised format version, **When** the build runs, **Then** it fails with a message naming the version, and the previously built store is unchanged.
3. **Given** a build that fails partway through, **When** it stops, **Then** the store from before the build is unchanged and still opens.

---

### User Story 4 - Read-only at runtime, clear when missing (Priority: P2)

While the app runs it only reads the corpus store. If the store is missing, pages that need it say the corpus has not been built, and no empty store is created.

**Why this priority**: Protects the corpus from accidental change and gives a clear message instead of a confusing empty app.

**Independent Test**: Attempt a write through the app's connection; start with no store and open a corpus page.

**Acceptance Scenarios**:

1. **Given** the store exists, **When** the application attempts a write to it, **Then** the write fails and the store is unchanged.
2. **Given** the store does not exist, **When** the application starts, **Then** pages that need the corpus show that the corpus has not been built, and no empty store is created.

---

### User Story 5 - Credits stay with the text (Priority: P2)

Anyone viewing corpus text can reach the credits, which list each dataset with its licence, licence link, attribution statement and modification note. The credits come from attribution held in the store. The store never holds UBS or Louw-Nida semantic-domain data.

**Why this priority**: The data licences (CC BY 4.0) require visible attribution, and redistribution of UBS domain data is not established.

**Independent Test**: Build the store, query its attribution, open the credits page, and inspect all tables and ingest files for domain fields.

**Acceptance Scenarios**:

1. **Given** the store has been built, **When** its attribution is read, **Then** it contains a record for the SBL Greek New Testament and for the MACULA Greek Linguistic Datasets.
2. **Given** a page showing corpus text, **When** a user opens the credits, **Then** each dataset in the store's attribution is listed with its licence, licence link, attribution statement and modification note.
3. **Given** the corpus store's tables, **When** they are inspected, **Then** no table or column holds Louw-Nida or UBS semantic-domain data.
4. **Given** any ingest output file, **When** it is inspected, **Then** it contains no Louw-Nida or UBS semantic-domain fields.

### Edge Cases

- A valid chapter that has not been ingested versus a chapter or book that does not exist: both must be reported, and kept distinct.
- Ingest output with an unrecognised format version: refused by name, old store kept.
- A build that fails partway: old store still opens.
- Corpus store missing or unopenable: say the corpus must be built, never create an empty store.
- The store is missing while credits are requested: committed attribution is shown instead (FR-016).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The ingest output MUST use a published, versioned format in which every word carries its MACULA word identifier, surface form, following punctuation, verse number, lemma, gloss, part of speech and applicable morphology fields.
- **FR-002**: Words MUST be identified by their MACULA identifier, never by their position in the chapter or verse.
- **FR-003**: The ingest output MUST NOT contain UBS semantic-domain attributes (Louw-Nida).
- **FR-004**: The corpus store MUST be built entirely from the ingest output, by a single repeatable command.
- **FR-005**: Building again from the same ingest output MUST produce a store with identical rows in every table.
- **FR-006**: The build MUST refuse ingest output whose format version it does not recognise, with a message naming the version.
- **FR-007**: The build MUST leave the existing store in place when it refuses or fails.
- **FR-008**: The running application MUST only read from the corpus store, never write to it.
- **FR-009**: If the corpus store is missing or cannot be opened, the application MUST say that the corpus must be built, and MUST NOT create an empty store.
- **FR-010**: The store MUST know every New Testament book and its number of chapters, in canonical order, whether or not the book has been ingested.
- **FR-011**: The store MUST return a chapter's words in canonical order, each with its MACULA identifier, surface form, following punctuation, verse number, lemma, gloss, part of speech and applicable morphology fields.
- **FR-012**: The store MUST return any single word by its MACULA identifier.
- **FR-013**: The store MUST distinguish a chapter that does not exist from one that exists but has not been ingested.
- **FR-014**: The store MUST hold the attribution metadata emitted by ingest, and the app's credits MUST be read from it. Whenever the app shows corpus text, its credits MUST be reachable.
- **FR-015**: The store MUST NOT contain UBS semantic-domain attributes in any table or column.
- **FR-016**: When the corpus store is missing, the credits MUST fall back to the attribution committed in the repository. (Stated in `CLAUDE.md`; not in the OpenSpec corpus-store spec.)
- **FR-017**: Rebuilding the corpus store MUST NOT affect users' saved work (stated in the OpenSpec Purpose).

### Key Entities

- **Word**: One Greek word with its MACULA identifier, surface form, following punctuation, verse, lemma, gloss, part of speech and morphology.
- **Chapter**: An ordered run of words for one book and chapter number, either ingested or unavailable.
- **Book**: A New Testament book with its canonical position and chapter count.
- **Attribution record**: Per dataset: name, licence, licence link, attribution statement, modification note.
- **Ingest output**: The versioned per-chapter files plus attribution metadata from which the store is built.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every ingested chapter (all 260, spec 009), 100% of its words are returned exactly once, in canonical order, each with every field in FR-011.
- **SC-002**: Two builds from the same ingest output produce stores whose rows match in 100% of tables.
- **SC-003**: After a refused build (unknown version) and after a build that fails partway, the earlier store opens and returns the same chapter data as before, in both cases.
- **SC-004**: A write attempted through the running app's connection fails in 100% of attempts, and starting with no store creates no store file.
- **SC-005**: A search of all ingest files and all store tables finds zero Louw-Nida or UBS semantic-domain fields.
- **SC-006**: The credits page lists, for every dataset in the attribution, all five items (name, licence, licence link, statement, modification note), including SBL Greek New Testament and MACULA, in 100% of checks.
- **SC-007**: A request for a not-ingested chapter and a request for a nonexistent chapter return two different outcomes.

## Assumptions

- All 260 New Testament chapters are ingested (spec 009); a chapter missing from an out-of-date store is reported as unavailable.
- The data source is MACULA Greek (SBLGNT lowfat) under CC BY 4.0; exact notice strings are in `docs/reference/data-sources.md`.
- The committed attribution (`corpus/v1/attribution.json`) also lists the Berean Interlinear Bible as a third dataset, shown in credits alongside the two the spec requires.
- Ingest is an offline, release-time step; nothing in the request path parses source files and browsers never fetch the corpus files.
- Saved work lives in a separate database, so rebuilding the corpus never touches it.
- Out of scope: reader display, saved work and any analysis behaviour.
