# Feature Specification: English Line

**Feature Branch**: `012-english-line`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "English line: show a public-domain English translation under each Greek verse (from the Base44 prototype comparison)"

**Relationship to other specs**: Extends the reading screen (`002-greek-reader`) and the corpus store (`001-corpus-store`), which already holds the whole SBL Greek New Testament (`009-full-new-testament-text`). Sibling specs written alongside it: `010-learning-mode` (the English line is hidden there), `011-translate` (the English line never pre-fills the user's own translation), `013-richer-word-details` (word help stays free of the English line), `015-accounts` (the setting is kept per account once accounts exist).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See an English translation under each verse (Priority: P1)

A lay reader with little Greek opens Philippians 1 and turns on the English line. Under each Greek verse a plain English translation of that verse appears, smaller and quieter than the Greek, so they can keep their bearings while they work through the Greek word by word. A student checking their own reading does the same, then turns it off again to work unaided.

**Why this priority**: This is the feature. Readers without fluent Greek lose their place in long verses, and a whole-verse translation they can glance at keeps them in the text instead of reaching for another book or tab.

**Independent Test**: On Philippians 1, turn the English line on and off and confirm that each verse gains and loses its English translation, with the Greek, word help and navigation unchanged.

**Acceptance Scenarios**:

1. **Given** a first-time visitor on any chapter, **When** the reading screen loads, **Then** no English translation is shown and the English line control is off.
2. **Given** the English line is off, **When** the user turns it on, **Then** the English translation of each verse appears directly under that verse's Greek text, without the page reloading.
3. **Given** the English line is on, **When** the user turns it off, **Then** every English line disappears and the Greek text returns to its previous layout.
4. **Given** the English line is on, **When** the user moves to the next or previous chapter, **Then** the new chapter also shows its English lines.
5. **Given** the English line is on, **When** the user selects a Greek word, **Then** the word's detail shows the same facts as with the English line off, and contains no part of the verse's English translation.
6. **Given** the English line is on and verse numbers are off, **When** the user reads the chapter, **Then** each English line still sits under the Greek verse it translates.

---

### User Story 2 - Know whose translation it is (Priority: P1)

A seminary student wants to know what the English text is before trusting it. The reading screen names the translation wherever English lines are shown, and the credits page lists it with its licence and source like every other shipped work.

**Why this priority**: A translation is someone else's interpretation of the Greek. The product promises never to interpret for the user, so English shown alongside the text must be plainly marked as a named outside source, not as the app's own reading.

**Independent Test**: Turn the English line on and confirm the translation is named on the reading screen and that the name leads to its entry on the credits page; open the credits page directly and find the entry.

**Acceptance Scenarios**:

1. **Given** the English line is on, **When** the user views a chapter, **Then** the screen names the translation (Berean Standard Bible) in a visible label, and the label leads to the credits page.
2. **Given** the credits page, **When** the user opens it, **Then** the Berean Standard Bible is listed with its public-domain status, a link to its licensing statement, its attribution statement and a note of how the text was changed for the app, alongside the existing entries.
3. **Given** a screen-reader user with the English line on, **When** they read a verse, **Then** the English is announced as English and as the translation of that verse, and the Greek is announced as Greek.

---

### User Story 3 - The setting is remembered (Priority: P2)

A pastor who always reads with the English line on turns it on once. On the next visit, and on every chapter, it is still on, with no account, in the same way as the other display settings.

**Why this priority**: Users who want the English line want it every time; users who do not should never have to dismiss it.

**Independent Test**: Turn the English line on, reload and open another chapter; confirm it is still on. Make browser storage unavailable and confirm the page renders with the English line off.

**Acceptance Scenarios**:

1. **Given** the user turned the English line on, **When** they reload the page or come back later, **Then** the English line is still on.
2. **Given** stored settings saved before this feature existed, **When** the reading screen loads, **Then** the English line is off and every other stored setting is kept.
3. **Given** browser storage throws on access, **When** the reading screen loads, **Then** it renders with the English line off.
4. **Given** the English line is stored as on, **When** a chapter opens, **Then** the English lines are present when the page first appears and the Greek text does not move afterwards.

---

### User Story 4 - Verses that do not line up (Priority: P2)

A reader opens a chapter where the Greek edition and the English translation do not match verse for verse: a verse the Greek edition does not include, a verse the English places differently, or two verses the English translates as one. The app shows exactly what each source has and says plainly where they differ, without guessing how one maps onto the other.

**Why this priority**: The SBL Greek New Testament and the Berean Standard Bible were made from different editorial decisions. Hiding the differences, or quietly pairing the wrong English with a verse, would mislead readers about the text.

**Independent Test**: Using the alignment report produced at ingest, open chapters with each kind of mismatch and confirm the behaviour below; confirm every matched verse in those chapters is unaffected.

**Acceptance Scenarios**:

1. **Given** a Greek verse with no English text for the same reference, **When** the English line is on, **Then** that verse shows a short note that the translation has no text for this verse, and no English is borrowed from a neighbouring verse.
2. **Given** English text for a reference with no Greek verse in the SBL Greek New Testament, **When** the English line is on, **Then** the English is shown once, at its place in verse order, labelled with its reference and marked as having no corresponding verse in the Greek edition; no Greek verse or verse number is invented for it.
3. **Given** English text that the translation gives as one passage covering several verse references, **When** the English line is on, **Then** it is shown once, under the last Greek verse it covers, labelled with the verse range, and each other Greek verse in the range shows a short note pointing to where its English is.
4. **Given** a chapter where every verse matches, **When** the English line is on, **Then** no alignment notes are shown.

---

### User Story 5 - Rebuild the English text safely (Priority: P3)

A maintainer regenerates the English text from a pinned edition of the Berean Standard Bible by following the ingest documentation, gets identical output each time, and reviews a report of every place where the English and Greek verse lists differ.

**Why this priority**: The text must be reproducible and auditable, but this matters to maintainers rather than readers.

**Independent Test**: Run the documented ingest twice from the pinned source and compare outputs; feed it a malformed source file and confirm it stops without writing partial output.

**Acceptance Scenarios**:

1. **Given** the pinned source, **When** the maintainer runs the documented English ingest, **Then** it produces English text for every New Testament chapter and an alignment report, identical to the committed output.
2. **Given** a source file that is missing, malformed, or holds markup in verse text, **When** the ingest runs, **Then** it stops with a message naming the file and reference, and leaves the committed output unchanged.
3. **Given** the English output, **When** the corpus store is rebuilt, **Then** the English text is loaded with the Greek text by the existing build command, and saved work is untouched.

### Edge Cases

- **English text not installed**: the corpus store was built before the English text existed, or the English part is missing. With the English line on, the reading screen says once, near the top of the chapter, that the English translation is not installed and how to rebuild the corpus; the Greek, word help and navigation work as before. No per-verse notes are shown.
- **Corpus store missing**: the existing "not installed" message is shown; the English line control does nothing harmful.
- **Greek chapter unavailable but English present**: the existing unavailable message is shown; English is not shown on its own as if it were the chapter.
- **Long verses and small screens**: the English line wraps under its verse at every text size and screen width, and never overlaps the Greek or the next verse.
- **Part-of-speech colouring on**: colouring and its underlines apply only to Greek words, never to English.
- **Word popover open when the English line is toggled**: the Greek moves, so the popover closes or re-anchors to its word; it never points at the wrong word.
- **Learning mode (spec 010)**: English lines are hidden while Learning mode is active, and the control shows as unavailable there; the stored setting is unchanged and English returns when the user leaves Learning mode.
- **Translation workspace (spec 011)**: if the English line is on while the user translates, it stays a separate, labelled reference line. Nothing copies, pre-fills or compares it with the user's own translation.
- **Text in the translation's own brackets or other editorial marks**: kept as the translation gives it; the app does not add or remove brackets.
- **Section headings, footnotes and cross-references** in the source: not shown (see Assumptions).
- **A verse reference in the source that is not a New Testament reference at all** (for example a malformed book or chapter): the ingest stops and names it.

## Requirements *(mandatory)*

### Functional Requirements

**Display**

- **FR-001**: The reading screen MUST provide an English line control that shows or hides an English translation of each verse. It MUST be off by default.
- **FR-002**: When the English line is on, each verse's English text MUST appear directly beneath that verse's Greek text, as a separate line visually subordinate to the Greek, and MUST be distinguishable from the Greek by more than colour alone.
- **FR-003**: Turning the English line on or off MUST take effect at once, without reloading the page, and MUST NOT change the Greek text, verse order, word selection or chapter navigation.
- **FR-004**: When the English line is on, the reading screen MUST name the translation in a visible label that leads to its credits entry.
- **FR-005**: English text MUST be shown exactly as the pinned translation gives it for that reference, with no rewording, summarising or added interpretation by the app.
- **FR-006**: The English line MUST appear only on the reading screen. It MUST NOT appear in word help, in the arcing or diagramming editors, or in any exported work.
- **FR-007**: Part-of-speech colouring and word selection MUST apply to Greek words only; English text MUST NOT be selectable as a word for word help.
- **FR-008**: The English line MUST follow the user's theme and text-size settings, staying smaller than the Greek at every size.

**Interpretation boundary (Constitution I)**

- **FR-009**: The English translation MUST be treated as outside reference material shown only on request. It MUST NOT pre-fill, suggest, rank or be compared with anything in the user's own translation (spec 011), analyses, arcs, brackets or diagrams, and MUST NOT be used to split propositions or choose relationships.
- **FR-010**: Word help (spec 002, extended by spec 013) MUST NOT show any part of the whole-verse English translation.
- **FR-011**: While Learning mode (spec 010) is active, English lines MUST be hidden and the control MUST show as unavailable, without changing the stored setting.

**Verse alignment**

- **FR-012**: English text MUST be paired with Greek verses only by book, chapter and verse reference. The app MUST NOT infer, shift or split text to make the two match.
- **FR-013**: A Greek verse with no English text for its reference MUST show a short note saying the translation has no text for that verse.
- **FR-014**: English text for a reference with no Greek verse MUST be shown once at its place in verse order, labelled with its reference and marked as having no corresponding verse in the SBL Greek New Testament. A Greek verse or verse number MUST NOT be invented for it.
- **FR-015**: English text that the translation gives as one passage for several verse references MUST be shown once, under the last Greek verse it covers, labelled with the range; each other Greek verse in the range MUST show a short note pointing to it.
- **FR-016**: When the English text for a chapter is not installed, the reading screen MUST say so once, with how to rebuild the corpus, and MUST NOT show per-verse notes; the Greek reading screen MUST otherwise behave as it does without this feature.

**Settings**

- **FR-017**: The English line choice MUST persist with the other display settings (spec 002 FR-017), and, once accounts exist (spec 015), per account.
- **FR-018**: Stored settings that lack the English line choice, or hold an invalid value, MUST fall back to off without affecting other settings or failing to render (spec 002 FR-018).
- **FR-019**: When the English line is stored as on, the English lines MUST be present when a chapter first appears, and the Greek text MUST NOT move once the page has finished loading.

**Accessibility**

- **FR-020**: The English line control MUST be operable by keyboard and touch, MUST have an accessible name, and MUST expose its on or off state to assistive technology.
- **FR-021**: English text MUST be marked as English and Greek text as Greek, so assistive technology reads each in the right language. Each English line MUST be associated with the verse it translates.
- **FR-022**: English text and alignment notes MUST meet WCAG 2.2 AA contrast for body text in light, dark and sepia themes. English lines MUST NOT be focus stops in the keyboard order.

**Data and credits**

- **FR-023**: The English text MUST come from one pinned edition of the Berean Standard Bible, ingested offline into versioned, verse-referenced output that the corpus store is built from, alongside the Greek text.
- **FR-024**: The English ingest MUST be a single documented procedure that produces identical output when run twice on the same input, and MUST stop with a message naming the file and reference when a source file is missing or malformed, a reference is not a New Testament reference, or verse text contains markup; it MUST leave the committed output unchanged when it stops.
- **FR-025**: The English ingest MUST produce an alignment report listing every Greek verse without English, every English reference without a Greek verse, and every combined passage, committed with the output.
- **FR-026**: The English output MUST hold only verse text and its references. Section headings, footnotes and cross-references MUST NOT be kept.
- **FR-027**: The corpus attribution MUST include a Berean Standard Bible record (name, creator, licence "Public domain", link to its licensing statement, attribution statement, and a modification note describing what was kept), so it appears on the credits page without a separate hand edit (spec 002 FR-020), including in the committed fallback attribution (spec 001 FR-016).
- **FR-028**: Adding the English text MUST NOT change any Greek word, word identifier or existing attribution record, and rebuilding the store MUST NOT affect saved work.

### Key Entities

- **English verse**: The English text the translation gives for one book, chapter and verse, or for a range of verses given as one passage; carries its reference or range and its text.
- **English edition**: The pinned edition of the Berean Standard Bible the English text is taken from: name, edition identifier or date, licence.
- **Alignment report**: The ingest's list of every reference where the Greek and English verse lists differ, by kind (Greek only, English only, combined).
- **Display settings**: Extended with the English line choice (on or off; default off).
- **Attribution record**: Gains a Berean Standard Bible entry, separate from the existing Berean Interlinear Bible entry.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the English line on and the corpus built, every Greek verse in all 260 chapters shows either its English text or one of the alignment notes in FR-013 and FR-015; zero verses show English belonging to a different reference.
- **SC-002**: 100% of the entries in the alignment report display as FR-013 to FR-015 describe when spot-checked in the reader, and every chapter with no entries shows no alignment notes.
- **SC-003**: Turning the English line on or off updates the chapter within 100 ms on the development machine, and opening the longest chapters (Matthew 26, Luke 1) with the English line on stays under one second.
- **SC-004**: In 100% of loads with the English line stored as on, the English lines are present when the page first appears and the Greek text does not shift afterwards.
- **SC-005**: In 100% of word details opened with the English line on, no text from the verse's English translation appears.
- **SC-006**: Automated accessibility checks on the reading screen, with the English line on and off, report zero violations in light, dark and sepia themes; the control is operable with the keyboard alone.
- **SC-007**: The credits page lists the Berean Standard Bible with all five attribution items in 100% of checks, whether read from the corpus store or from the committed fallback.
- **SC-008**: Running the documented English ingest twice from the pinned source produces byte-identical output, including the alignment report.
- **SC-009**: 100% of Greek word identifiers and word data are the same before and after the English text is added.

## Assumptions

- **Source**: the Berean Standard Bible, which `docs/reference/data-sources.md` records as public domain since 2023-04-30 with an optional licensing form. No blocking reason to prefer the World English Bible was found. Attribution is not legally required but is given, as with every shipped work. The edition is pinned (by date or version) so the text and alignment do not change under the app; moving to a newer edition is a separate decision.
- **Alignment defaults**: English with no Greek verse is shown and marked (FR-014) rather than hidden, because silently dropping a source's text would misrepresent it; combined passages sit under the last verse of their range so the reader has met all the Greek they translate. The kinds of mismatch are known only once the source is ingested; the alignment report, not this spec, records the actual cases.
- **What is kept**: verse text only. Section headings (which are themselves interpretive), footnotes, cross-references and any words-of-Christ marking are left out; the translation's own brackets and punctuation are kept as given.
- **Placement**: the English line control sits on the reading screen beside the other reading toggles, with its exact placement and appearance designed from `DESIGN.md` during planning, not copied from the prototype.
- **Learning mode**: hiding the English line in Learning mode was confirmed by the user on 2026-11-16 and is also spec 010 FR-036.
- **Translation workspace**: whether spec 011 shows the English line inside its workspace, and how, is decided there; this spec only requires that it is never pre-filled or suggested from.
- **Settings scope**: settings are per browser today (spec 002); spec 015 moves display settings to per account, and the English line choice moves with them.
- **Out of scope**: other translations or a translation chooser, interlinear word-by-word English (word glosses already exist in word help), English search, showing English in the arcing or diagramming editors, and the Hebrew Bible.
- **Constitution**: principle I (constitution v1.1.0, amended 2026-11-16) allows a published English translation as reference, off by default, labelled with its source, kept out of word help and never used to pre-fill, suggest or check the user's work; its Licensing section names the Berean Standard Bible as the default English text. `PRODUCT.md` ("Greek only for now") still needs a matching update before or with this feature's plan.
