# Feature Specification: Full New Testament Text

**Feature Branch**: `009-full-new-testament-text`

**Created**: 2026-11-15

**Status**: Implemented

**Input**: User description: "Full SBL Greek New Testament text in the reader. Today only Philippians 1 is ingested and every other chapter shows "not available yet". Users want every chapter of all 27 books of the SBLGNT (from MACULA Greek SBLGNT/lowfat at a pinned commit) readable in the reader with the same word data as Philippians 1 (text, punctuation, lemma, gloss, part of speech, morphology, MACULA word ids), with Louw-Nida/UBS domain attributes still stripped and attribution unchanged. Scope is the text only: clause and conjunction data stay in the discourse-analysis-foundation change. The existing sample extractor scripts/ingest/sample_chapter.py is extended rather than replaced, and npm run db:seed loads the result."

**Relationship to other specs**: This delivers the text half of FR-039 in `specs/006-discourse-analysis-foundation/spec.md` ("the SBL Greek New Testament, covering the whole New Testament") ahead of the rest of that feature. Clause and conjunction data stay in 006. When this is implemented, the "only Philippians 1 is ingested" assumptions in `001-corpus-store`, `002-greek-reader` and `006` are updated to match, and so is the matching OpenSpec text (OpenSpec remains authoritative where the two disagree).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read any chapter of the New Testament (Priority: P1)

A student opens the contents page, picks any book and chapter — Matthew 5, John 1, Romans 8, Revelation 22 — and reads the full Greek text of that chapter, exactly as they can read Philippians 1 today. No chapter shows "not available yet".

**Why this priority**: This is the feature. A reader with one chapter cannot be used for real study, and every later feature (arcing, diagramming) needs a passage the user chooses.

**Independent Test**: Open the first and last chapter of each of the 27 books, plus a sample of chapters in between, and confirm each shows its Greek text with verse numbers and no unavailable message.

**Acceptance Scenarios**:

1. **Given** the corpus has been built, **When** the user opens any chapter of any of the 27 books, **Then** the chapter's full Greek text is shown in reading order with its verse numbers.
2. **Given** the corpus has been built, **When** the user follows previous and next links from any chapter, **Then** every linked chapter shows text, including across book boundaries.
3. **Given** a chapter that does not exist (for example Philippians 5), **When** the user requests it, **Then** the app reports that it does not exist, distinctly from "unavailable", as it does today.

---

### User Story 2 - The same word help everywhere (Priority: P1)

A student selects any word in any chapter and sees the same facts they get in Philippians 1 today: surface form, lemma, gloss when one exists, part of speech and the morphology that applies to that word.

**Why this priority**: Word help is the reader's main study aid. Uneven data across books would make the reader untrustworthy.

**Independent Test**: Select words of several parts of speech in chapters from the Gospels, Acts, the letters and Revelation, and compare their details with the source data.

**Acceptance Scenarios**:

1. **Given** any word in any chapter, **When** the user selects it, **Then** its surface form, lemma, part of speech and applicable morphology are shown, and its gloss when the source has one.
2. **Given** a word with no gloss in the source, **When** the user selects it, **Then** the other facts are shown and no gloss is invented.
3. **Given** any word, **When** it is inspected, **Then** it carries its MACULA word identifier, so saved work that refers to it keeps working after a rebuild.

---

### User Story 3 - Saved work and credits are unaffected (Priority: P2)

Someone who already has saved work on Philippians 1 rebuilds the corpus with the full New Testament. Their saved work still opens and refers to the same words, and the credits page still lists every dataset with its licence and notice.

**Why this priority**: Expanding the text must not break what users already have or the licence obligations the app already meets.

**Independent Test**: Save work referring to Philippians 1 words, rebuild the corpus with the full text, and reopen it; compare the Philippians 1 words before and after; open the credits page.

**Acceptance Scenarios**:

1. **Given** saved work referring to words in Philippians 1, **When** the corpus is rebuilt with the full New Testament, **Then** every word it refers to still exists with the same identifier and text.
2. **Given** the rebuilt corpus, **When** the user opens the credits, **Then** the SBL Greek New Testament, MACULA Greek and Berean Interlinear Bible entries are listed exactly as before.
3. **Given** any file the ingest produces, **When** it is inspected, **Then** it contains no Louw-Nida or UBS semantic-domain data.

---

### User Story 4 - Rebuild the full text from source with one documented procedure (Priority: P3)

A maintainer regenerates the whole New Testament from the pinned MACULA source by following the ingest README, and gets byte-identical output to what is committed.

**Why this priority**: The text must be reproducible and auditable, but this matters to maintainers rather than readers.

**Independent Test**: Follow the README from a clean checkout and compare the output with the committed corpus.

**Acceptance Scenarios**:

1. **Given** the pinned MACULA source, **When** the maintainer runs the documented ingest, **Then** it produces output for all 260 chapters, identical to the committed output.
2. **Given** a source file that is malformed or contains unsafe markup, **When** the ingest runs, **Then** it stops with a message naming the file and writes nothing partial into the committed corpus.

### Edge Cases

- A chapter the source does not cover, or a book file missing from the download: the ingest stops and names it rather than producing a corpus with gaps.
- Verses SBLGNT omits or brackets (for example passages absent from the earliest manuscripts): the text follows SBLGNT as MACULA gives it; chapters are not padded and verse numbers are not invented.
- Words without a gloss, or with morphology fields that do not apply: shown without the missing facts, as in Philippians 1.
- A word whose text, punctuation, lemma or gloss contains markup characters: ingest stops, as the sample extractor does today.
- An existing corpus store built from Philippians 1 only: it is detected as out of date and rebuilt by the existing seed commands, including the Docker entrypoint.
- Saved work referring to a word that no longer exists after re-ingest: does not happen at the pinned commit; Philippians 1 identifiers are unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The corpus MUST contain every chapter of all 27 New Testament books of the SBL Greek New Testament (260 chapters), taken from one pinned version of the MACULA Greek source.
- **FR-002**: Every word MUST carry the same data as the existing Philippians 1 corpus: MACULA identifier, surface form, following punctuation, verse number, lemma, gloss when present, part of speech and applicable morphology.
- **FR-003**: The corpus MUST use the existing published corpus format, version 1, so the app reads the new chapters without changes to how chapters are stored or shown.
- **FR-004**: Words MUST appear in reading order (verse, then word position, from MACULA's references). Every word MUST have non-empty text, and every word's following punctuation MUST be a space, or a punctuation mark followed by a space, as MACULA gives it, so joining each word with its following punctuation gives the chapter's text as MACULA records it.
- **FR-005**: The corpus MUST NOT contain Louw-Nida or UBS semantic-domain data, or any source field outside the existing whitelist.
- **FR-006**: The attribution records MUST be unchanged in content; the SBLGNT and MACULA modification notes stay accurate for the full text.
- **FR-007**: Philippians 1 MUST keep the same word identifiers and the same word data after the full ingest.
- **FR-008**: The existing build command MUST load the full corpus, and an existing store built from fewer chapters MUST be detected as stale and rebuilt by the existing rebuild-if-stale step.
- **FR-009**: The ingest MUST be a single documented procedure that extends the existing sample extractor rather than replacing it, uses only the pinned source, and produces identical output when run twice on the same input.
- **FR-010**: The ingest MUST stop with a message naming the file when a source file is missing, malformed, declares a DTD or entities, or holds markup characters in word text, punctuation, lemma or gloss, and MUST NOT leave partial output in the committed corpus.
- **FR-011**: This feature's ingest does not keep MACULA's syntax trees, clause boundaries, sentence-role labels or conjunction data; the chapter files carry only facts about each word. Working out how a sentence is built is the analysis the user performs in the diagramming and arcing editors (Constitution I). Whether clause data is added later, as reference data in its own files, is decided in the discourse-analysis-foundation feature, which still lists it and has it on hold.
- **FR-012**: When a valid chapter is missing from an installed corpus store that is out of date, the reading screen MUST say the chapter's text is missing and how to rebuild it, and MUST keep chapter navigation working. When the corpus store is missing or cannot be read, the existing "not installed" message MUST be shown as today.

### Key Entities

- **Chapter file**: One book and chapter in corpus format v1: format version, edition, source dataset and pinned commit, book, chapter, ordered words.
- **Word**: MACULA identifier, verse, surface form, following punctuation, lemma, optional gloss, part of speech, applicable morphology.
- **Attribution**: The per-dataset credits record, unchanged by this feature.
- **Pinned source**: The MACULA Greek commit all 27 book files are taken from.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 260 New Testament chapters open in the reader with text; zero valid chapters show the unavailable message when the store is present.
- **SC-002**: The total word count of the corpus matches the word count of the pinned MACULA SBLGNT source (137,741 words), with each word appearing exactly once.
- **SC-003**: Opening any chapter, including the longest (Matthew 26, Luke 1), feels as fast as opening Philippians 1 does today: under one second on the development machine.
- **SC-004**: A search of every corpus file and every store table finds zero Louw-Nida or UBS semantic-domain fields.
- **SC-005**: 100% of Philippians 1 words have the same identifier and data before and after the full ingest.
- **SC-006**: Running the documented ingest twice from the pinned source produces byte-identical output both times.
- **SC-007**: Every existing automated check (unit tests, story accessibility checks, the container smoke test) still passes with the full corpus.

## Assumptions

- The pinned MACULA commit stays `8423afe47b9e8f24b7772e808af45c7159a6fe7e`, the one Philippians 1 came from, so Philippians 1 identifiers cannot change. Moving to a newer commit is a separate decision.
- The generated corpus files are committed to the repository like Philippians 1 is today. That is about 37 MB on disk (about 2.7 MB compressed in git); whether to shrink or relocate them is a planning decision, provided the app still needs no network access at runtime.
- The reader, navigation, word help, credits and saved-work behaviour already handle any ingested chapter; no user-facing screen changes are expected beyond chapters now showing text.
- Ingest stays an offline, release-time step using only the standard library; nothing in the request path parses source XML.
- Out of scope: clause and conjunction data, other editions, search, and any change to the corpus format.
