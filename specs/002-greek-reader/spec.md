# Feature Specification: Greek Reader

**Source**: Mirrors the OpenSpec spec `openspec/specs/text/greek-reader/spec.md` (context: `openspec/changes/archive/2026-10-24-base44-look-and-reader/`). OpenSpec stays authoritative.

**Feature Branch**: `002-greek-reader`

**Created**: 2026-11-05

**Status**: Implemented

**Input**: User description: "Browse the Greek New Testament by book and chapter, read a chapter, inspect word facts, adjust display settings, and see credits. Ported from the OpenSpec spec path text/greek-reader."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find and read a chapter (Priority: P1)

A student opens the contents page, sees every New Testament book, picks a book, picks a chapter and reads its Greek text verse by verse. They can step to the previous or next chapter without going back to the contents.

**Why this priority**: Reading the Greek passage is the base that every later study view builds on. Without it nothing else has value.

**Independent Test**: Open the contents page, select Philippians, then chapter 1, and confirm the whole chapter shows in order, then follow the previous and next links.

**Acceptance Scenarios**:

1. **Given** the contents page, **When** a user opens it, **Then** all 27 New Testament books are listed in canonical order with their chapter counts.
2. **Given** the contents page, **When** a user selects Philippians and then chapter 1, **Then** the reading screen for Philippians 1 opens.
3. **Given** a chapter whose text is available, **When** a user opens it, **Then** every word of the chapter is shown once, in canonical order, grouped under its verse number.
4. **Given** a user reading Matthew 28, **When** they follow the next-chapter link, **Then** the reading screen for Mark 1 opens.
5. **Given** a user reading Matthew 1, **When** the screen loads, **Then** no previous-chapter link is shown.
6. **Given** a reading-screen address for a book or chapter that does not exist, **When** a user opens it, **Then** the application shows a not-found page.

---

### User Story 2 - Check the facts about a word (Priority: P1)

While reading, a user selects a word and sees its form, lemma, English gloss, part of speech and the grammatical details that apply to it. They do not see any interpretation of the word's role in the sentence.

**Why this priority**: Word facts are what lets a reader study the Greek rather than just look at it, and the no-interpretation rule is a core product principle.

**Independent Test**: Select a finite verb with the mouse and with the keyboard; confirm the facts shown, that case and gender are absent, and that each way of closing the popover works.

**Acceptance Scenarios**:

1. **Given** a finite verb on the reading screen, **When** a user selects it, **Then** the popover shows its lemma, gloss, person, number, tense, voice and mood, and does not show case or gender.
2. **Given** a word with keyboard focus, **When** the user presses Enter, **Then** the detail popover opens for that word.
3. **Given** an open popover, **When** the user presses Escape, **Then** the popover closes and focus returns to the word.
4. **Given** an open popover, **When** the user selects outside it, **Then** it closes.
5. **Given** an open popover, **When** the user selects another word, **Then** the popover moves to the new word.
6. **Given** any word's popover, **When** it is shown, **Then** it contains no syntactic role (such as subject or object) and no other interpretive analysis from the source data.

---

### User Story 3 - Set up the page for comfortable reading (Priority: P2)

A user opens the display menu and chooses theme, Greek typeface, text size, line spacing, verse numbers and part-of-speech colouring. Changes show at once, and the choices are still there on the next visit, with no account.

**Why this priority**: Long study sessions depend on comfortable display, but the text is readable at the defaults.

**Independent Test**: Change each setting and see it apply without reloading; reload and confirm the choices remain; make browser storage unavailable and confirm the page still renders with defaults.

**Acceptance Scenarios**:

1. **Given** the reading screen, **When** a user changes the text size, **Then** the Greek text resizes without a page reload.
2. **Given** part-of-speech colouring is off, **When** a user turns it on and disables every category except participle, **Then** only participles are coloured and underlined, and the legend lists only participle.
3. **Given** a user has set the typeface to Gentium Plus, **When** they reload the page, **Then** the Greek text is still in Gentium Plus.
4. **Given** browser storage throws on access, **When** the reading screen loads, **Then** it renders with default settings.
5. **Given** stored settings that are unreadable or lack a field added in a later release, **When** the reading screen loads, **Then** each missing or invalid field uses its default and the page renders.
6. **Given** a first-time visitor, **When** they open the display menu, **Then** the defaults are light theme, EB Garamond, the middle text size, comfortable line spacing, verse numbers on, and part-of-speech colouring off with all eleven categories on.

---

### User Story 4 - Know when a chapter has no text yet (Priority: P2)

A user opens a chapter that exists but is missing from the installed corpus, which happens when the store was built from an older corpus. The screen says the text is not available and how to rebuild it, and the user can still move to other chapters.

**Why this priority**: The experience must be clear and must not trap the user, even when the installed corpus is out of date.

**Independent Test**: With a store built from an older corpus (for example Philippians 1 only), open a chapter it lacks and confirm the message and that the previous and next links work.

**Acceptance Scenarios**:

1. **Given** a chapter that exists but is missing from the installed corpus, **When** a user opens it, **Then** the screen states the text is not available and how to rebuild the corpus, and the previous and next chapter links still work.
2. **Given** the corpus store cannot be read, **When** a user opens any chapter, **Then** the screen says the text is not available and the chapter navigation still works.
3. **Given** a chapter loaded after the application was built, **When** a user opens it, **Then** it appears without rebuilding the application.

---

### User Story 5 - See what sources the app uses (Priority: P3)

A user opens the credits page and sees every work whose text or data the app ships, with its licence, a link to the licence, the required attribution and whether it was modified.

**Why this priority**: Required for licence compliance, but not part of the reading flow.

**Independent Test**: Open the credits page and check the SBLGNT and MACULA entries; add a dataset to the corpus attribution and confirm it appears.

**Acceptance Scenarios**:

1. **Given** the credits page, **When** a user opens it, **Then** the SBL Greek New Testament and the MACULA Greek Linguistic Datasets are each listed with CC BY 4.0, a link to the licence, and a statement that they have been modified.
2. **Given** the corpus store's attribution lists a dataset, **When** a user opens the credits page, **Then** that dataset appears there without a separate hand edit.
3. **Given** the credits page, **When** a user reads it, **Then** it states the application is not affiliated with or endorsed by the publishers of any source.

### Edge Cases

- A reading-screen address names a book or chapter that does not exist: show not-found.
- A chapter exists but has no loaded text, or the store cannot be read: show the unavailable state with working navigation.
- First chapter of Matthew and last of Revelation: omit the missing previous or next link.
- Browser storage missing, unreadable or throwing, or stored settings lacking a newer field: fall back to defaults per field.
- A word has fields that do not apply (a verb has no case): omit them, never show blanks.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The contents page MUST list all 27 New Testament books in canonical order, grouped as Gospels and Acts, Letters, and Revelation, each with its chapter count.
- **FR-002**: Each book MUST have a page listing its chapters, each linking to that chapter's reading screen.
- **FR-003**: Every book and chapter page MUST be produced from the current corpus data on each request, so a chapter ingested after the build appears without rebuilding.
- **FR-004**: The system MUST show a not-found page for a reading-screen address whose book or chapter does not exist.
- **FR-005**: The reading screen MUST show the chapter's Greek text in canonical word order, verse by verse, with each word's following punctuation.
- **FR-006**: The reading screen MUST show verse numbers unless the user has turned them off.
- **FR-007**: The reading screen MUST link to the previous and next chapter, crossing book boundaries, and MUST omit a link where none exists (before Matthew 1, after Revelation 22).
- **FR-008**: When a chapter's text is not available, because it has not been ingested or because the corpus store cannot be read, the reading screen MUST say so and MUST keep chapter navigation working.
- **FR-009**: Selecting a word MUST open a detail popover anchored to that word showing its surface form, lemma, English gloss, part of speech, and every morphological field that applies (person, number, gender, case, tense, voice, mood, degree).
- **FR-010**: Fields that do not apply to a word MUST be omitted, not shown blank.
- **FR-011**: The popover MUST NOT show the word's syntactic role or any other interpretive analysis from the source data.
- **FR-012**: The popover MUST be dismissible by Escape, by selecting outside it, or by selecting another word, which moves the popover to the new word. Escape MUST return focus to the word.
- **FR-013**: Words MUST be selectable with the keyboard.
- **FR-014**: The reading screen MUST provide a display menu with these settings and defaults: theme (light, dark, sepia; default light), Greek typeface (EB Garamond, Gentium Plus, Cardo, GFS Didot; default EB Garamond; each option label shown in its own typeface), text size (five steps; default the middle step), line spacing (compact, comfortable, spacious; default comfortable), verse numbers (on or off; default on), and part-of-speech colouring (on or off, default off; each of the eleven categories on or off, default all on).
- **FR-015**: Changing a setting MUST take effect immediately without reloading.
- **FR-016**: When part-of-speech colouring is on, the reading screen MUST show a legend of the enabled categories, each in its own colour and underline style.
- **FR-017**: Display settings MUST persist in the user's browser across reloads and visits, with no account.
- **FR-018**: If stored settings are missing, unreadable or lack a later-added field, the system MUST use the default for each missing or invalid field and MUST NOT fail to render.
- **FR-019**: The credits page MUST use the application's theme and shared page shell, and MUST name every work whose text or data the application ships, with its licence, a link to the licence, its required attribution statement, and whether it has been modified.
- **FR-020**: The credits list MUST be built from the attribution held with the corpus data, so a dataset added to the corpus appears without a separate hand edit.
- **FR-021**: The credits page MUST state that the application is not affiliated with or endorsed by the publishers of any source.

### Key Entities

- **Book**: One of the 27 New Testament books, with canonical position, group and chapter count.
- **Chapter**: A numbered part of a book; its text may be available or not yet available.
- **Word**: A Greek word with surface form, following punctuation, lemma, gloss, part of speech and morphological fields.
- **Display settings**: The user's theme, typeface, text size, line spacing, verse-number choice and part-of-speech colouring choices.
- **Attribution entry**: A shipped work with licence, licence link, attribution statement and modified flag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can go from the contents page to a chapter's reading screen in at most 3 selections (book, chapter, and the contents page itself).
- **SC-002**: 100% of the 27 books appear on the contents page in canonical order with correct chapter counts.
- **SC-003**: For a loaded chapter, 100% of its words appear exactly once, in canonical order.
- **SC-004**: In 100% of word popovers, no syntactic role or other interpretive label appears.
- **SC-005**: Every display setting takes effect with no page reload, and every setting chosen survives a reload.
- **SC-006**: With browser storage unavailable, the reading screen renders with defaults in 100% of loads.
- **SC-007**: On every chapter missing from the installed corpus, the unavailable message is shown and both navigation links that exist work.
- **SC-008**: 100% of datasets in the corpus attribution appear on the credits page.
- **SC-009**: Word selection, popover dismissal and chapter navigation are all operable with the keyboard alone.

## Assumptions

- The whole SBL Greek New Testament is loaded (spec 009); the unavailable state appears only when the installed corpus is out of date.
- English glosses and morphology come from the loaded corpus data; the format of that data is specified elsewhere (`text/corpus-store`) and is out of scope here.
- Visual identity, themes, colour categories and typefaces are specified in `003-visual-theme`; this spec covers how the reader uses them.
- The reader has no editing, arcing or diagramming; those are separate features.
- The application is single-user and local; there are no accounts, so settings are per browser.
