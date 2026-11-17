# Feature Specification: Richer Word Details

**Feature Branch**: `013-richer-word-details`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Richer word bubble: Strong's number, lexicon definition and New Testament occurrence count (from the Base44 prototype comparison)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read the dictionary entry for a word (Priority: P1)

While reading, a user selects a word and, beside the facts they already see (form, lemma, gloss, part of speech, morphology), sees the full entry for its lemma from a Greek–English lexicon: the entry's headword and its whole definition. They no longer need a printed lexicon or a second tool open to learn the range of meanings a word can carry.

**Why this priority**: The one-word gloss tells the user what the word means here in the source's English; the lexicon entry tells them what the word can mean at all. That range is what a student weighs when deciding how a passage hangs together, and it is the most useful thing the richer details add.

**Independent Test**: Select a common verb, a noun and a preposition, and confirm each shows a headword and full definition matching the lexicon; select a word whose lemma the lexicon lacks and confirm the details say so and still show every other fact.

**Acceptance Scenarios**:

1. **Given** a word whose lemma has a lexicon entry, **When** a user selects it, **Then** the word details show the entry's headword and its complete definition, in addition to every fact spec 002 already requires.
2. **Given** a word whose lemma has no lexicon entry, **When** a user selects it, **Then** the details state plainly that the lexicon has no entry for this word, and the form, lemma, gloss, part of speech, morphology, Strong's number (if any) and occurrence count are still shown.
3. **Given** two words in different verses that share a lemma, **When** a user selects each in turn, **Then** both show the same headword and definition, whatever the context.
4. **Given** any word's details, **When** they are shown, **Then** they contain no syntactic role, no semantic domain, and no indication of which sense of the definition applies in this verse.
5. **Given** a long definition on a phone-width screen, **When** a user selects the word, **Then** the details open as a sheet from the bottom of the screen that can be scrolled to the end of the definition, and the Greek line the word sits in is not hidden behind it.

---

### User Story 2 - See how often a word occurs in the New Testament (Priority: P1)

A user selects a word and sees how many times its lemma occurs in the Greek New Testament. A student learning vocabulary sees at once whether a word is one of the most common or a rare one worth looking up carefully.

**Why this priority**: Frequency is the fact students most often use to decide which words to learn first and which to study closely. It costs the user nothing to read and needs no interpretation.

**Independent Test**: Select a word whose lemma occurs exactly once, one that occurs a few times and one of the most common; compare each count with a count of that lemma across the loaded text.

**Acceptance Scenarios**:

1. **Given** any word, **When** a user selects it, **Then** the details state how many times its lemma occurs in the whole Greek New Testament text the app ships.
2. **Given** a lemma that occurs once, **When** its details are shown, **Then** the count reads in the singular ("once" or "1 time"), never "1 times".
3. **Given** two different inflected forms of the same lemma, **When** a user selects each, **Then** both show the same count.
4. **Given** stepping through occurrences (spec 014) is available, **When** a user activates the count, **Then** it takes them to stepping through that lemma's occurrences.
5. **Given** stepping through occurrences is not yet available, **When** the details are shown, **Then** the count is plain text and is not presented or announced as a control.

---

### User Story 3 - Find the word's Strong's number (Priority: P2)

A user who works with other study tools, commentaries or concordances keyed by Strong's numbers selects a word and sees its Strong's number, so they can look the word up elsewhere.

**Why this priority**: Strong's numbers are the common key many readers already use, but the number itself carries no meaning; it only links out. It matters less than the definition and count.

**Independent Test**: Select several words and compare the number shown with the source data; select a word the source gives no number and confirm no number and no empty label appears.

**Acceptance Scenarios**:

1. **Given** a word the source gives a Strong's number, **When** a user selects it, **Then** the details show that number with a text label naming it as a Strong's number.
2. **Given** a word the source gives no Strong's number, **When** a user selects it, **Then** no Strong's label or blank value is shown.
3. **Given** a word whose Strong's number differs from the number of the lexicon entry shown for it (for example a pronoun form the lexicon files under its base pronoun), **When** a user selects it, **Then** the details show the word's own number and also make clear which lexicon entry the definition comes from, so the two numbers are never silently conflated.

---

### User Story 4 - The same richer details everywhere a word can be inspected (Priority: P2)

A user who opens a word's details in the arcing editor (spec 007) or the diagramming view (spec 008) sees the same lexicon entry, Strong's number and count as in the reader, laid out the same way.

**Why this priority**: The product promises one study desk. Details that differ between views would make users wonder which is right, but the editors do not exist yet, so the reader comes first.

**Independent Test**: Once either editor exists, open the same word's details in the reader and in that editor and compare every fact shown.

**Acceptance Scenarios**:

1. **Given** a word inspected in the reader and the same word inspected in an editor, **When** the user compares them, **Then** every fact shown, including headword, definition, Strong's number and count, is identical.
2. **Given** learning mode (spec 010) is withholding word details, **When** a user selects a word, **Then** none of the new facts (Strong's number, headword, definition, count) is revealed either.

---

### User Story 5 - Credit the lexicon (Priority: P3)

A user opening the credits page sees the lexicon listed with its licence or public-domain status, a link to where that status is stated, its attribution and whether it has been modified, alongside the existing sources.

**Why this priority**: Required for honest attribution and licence compliance, but not part of the reading flow.

**Independent Test**: Open the credits page with the lexicon loaded and confirm its entry appears with every field spec 002 requires of a credits entry.

**Acceptance Scenarios**:

1. **Given** the lexicon is part of the loaded data, **When** a user opens the credits page, **Then** the lexicon is listed with its name, its licence or public-domain status, a link to the statement of that status, its attribution text and whether it was modified.
2. **Given** the credits list is built from the attribution held with the corpus data (spec 002 FR-020), **When** the lexicon is added, **Then** its entry appears without a separate hand edit to the credits page.

### Edge Cases

- **No lexicon entry for the lemma**: show the other facts and a short plain statement that the lexicon has no entry for this word. Never show an empty definition area, a placeholder dash or an error.
- **Source number that the lexicon files under a different number**: some Strong's numbers in the source (several pronoun and verb forms, for example) are not keys in the lexicon, which files them under a base word. A reviewed correspondence decides which entry, if any, applies; the word's own number is still shown, and the entry's identity is visible (Story 3, scenario 3). Where no reviewed correspondence exists, the word is treated as having no entry rather than guessed.
- **Several Strong's numbers for one word**: when the source gives a word more than one number (compound or combined forms), all are shown in the source's order, and the definition is shown only if the reviewed correspondence names a single entry for the whole; otherwise the "no entry" statement applies.
- **A Strong's number of zero or a malformed value**: treat as no number; show neither the label nor the value.
- **Very long definitions**: some entries (common prepositions, particles, the article) run to many lines. On wide screens the details panel keeps a bounded height and scrolls within itself; on phones it is a bottom sheet that can be scrolled to the end. The definition is never cut off without a way to read the rest.
- **Proper nouns** (people and places): handled like any other word. If the lexicon has an entry, show it; if not, the "no entry" statement applies. The occurrence count counts the lemma, so different spellings the source gives one lemma count together.
- **Crasis and elided forms** (such as κἀγώ): the details follow the single lemma and Strong's number the source gives that word. The app does not split a crasis form into its parts or look up the parts separately.
- **Lemmas with the same spelling but different numbers**: the count is by lemma as the source gives it; the spec accepts that homographs the source assigns one lemma are counted together, and states this in the Assumptions.
- **Lexicon data missing from an installed corpus built before this feature**: the details show the facts spec 002 requires, omit the new ones without error, and do not claim the lexicon has no entry.
- **Learning mode** (spec 010) active: the new facts are withheld with the rest of the word details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Word details MUST show, in addition to the facts required by spec 002 FR-009, the word's Strong's number(s) as given by the source text data, labelled in text as a Strong's number.
- **FR-002**: Word details MUST show the headword and the complete definition of the lexicon entry that applies to the word's lemma, when one applies.
- **FR-003**: Which lexicon entry applies MUST be decided from the word's Strong's number, using a reviewed correspondence between the source's numbers and the lexicon's keys where they differ. The correspondence MUST be recorded as reviewable data shipped with the corpus, not decided at the moment of display, and a source number with no reviewed correspondence and no direct match MUST be treated as having no entry.
- **FR-004**: When the entry shown is filed under a different number from the word's own, the details MUST identify the entry (by its headword and number) so the user can tell the two apart.
- **FR-005**: When no lexicon entry applies, the details MUST say so in a short plain statement and MUST still show every other fact. They MUST NOT show an empty definition area or an error.
- **FR-006**: Word details MUST show how many times the word's lemma occurs in the whole Greek New Testament text shipped with the app, counted by lemma across all 27 books, with correct singular and plural wording.
- **FR-007**: The occurrence count MUST equal the number of words in the shipped text that carry that lemma, and MUST be the same for every form of the lemma.
- **FR-008**: Once stepping through occurrences (spec 014) exists, the occurrence count MUST be a control that opens it for that lemma; until then, the count MUST be plain text and MUST NOT look or announce itself as a control.
- **FR-009**: The headword, definition, Strong's number and count MUST be the same for a lemma wherever it occurs. Word details MUST NOT show anything that depends on the word's context: no indication of which sense applies in this verse, no syntactic role, no semantic domain, no Louw–Nida or other UBS data, and no other interpretive analysis from the source data (extending spec 002 FR-011).
- **FR-010**: Fields with no value (no Strong's number, no entry) MUST be omitted or replaced by the statement in FR-005, never shown blank.
- **FR-011**: The new facts MUST appear together with the existing facts when the details open, without a separate loading step the user can see in normal use.
- **FR-012**: Long definitions MUST be readable in full: on wide screens within a details panel of bounded height that scrolls on its own, and on phone-width screens in a sheet that rises from the bottom of the screen and scrolls to the end.
- **FR-013**: The details MUST keep the existing ways to open and close them (spec 002 FR-012, FR-013). Every new fact MUST be reachable and readable with the keyboard alone and announced by a screen reader with its label (for example "Strong's number", "Lexicon definition", "Occurrences in the New Testament"). Scrolling a long definition MUST be possible with the keyboard.
- **FR-014**: Each new fact MUST be distinguished by a text label or position, not by colour alone (Two-Cue Rule), and MUST use the application's theme colours and serif type in light, dark and sepia themes (spec 003).
- **FR-015**: Greek in the headword and definition MUST be marked as Greek so it is pronounced and rendered as Greek; English in the definition MUST be marked as English.
- **FR-016**: When learning mode (spec 010) withholds word details, the Strong's number, headword, definition and count MUST be withheld with them.
- **FR-017**: The arcing editor (spec 007) and the diagramming view (spec 008) MUST show the same facts as the reader's word details, including the new ones. Specs 007 FR-041 and 008 FR-015 MUST be updated to name the new facts in the same change that adds them.
- **FR-018**: The credits page MUST list the lexicon with its licence or public-domain status, a link to where that status is stated, its attribution text and whether it was modified, drawn from the attribution held with the corpus data (spec 002 FR-019, FR-020).
- **FR-019**: The lexicon MUST NOT ship until its licence or public-domain status has been verified and recorded with the other verified sources, alongside any required attribution wording.
- **FR-020**: Only the lexicon's headword, definition and key number MUST be kept from it. Any lexicon content tied to UBS or Louw–Nida material MUST NOT be kept, and the source text data's Louw–Nida and UBS domain attributes MUST remain stripped.
- **FR-021**: If the installed corpus predates this feature and lacks the new data, word details MUST still open with the facts spec 002 requires and MUST omit the new facts without error and without stating that no entry exists.
- **FR-022**: Saved work MUST be unaffected: adding or updating the lexicon, correspondence or counts MUST NOT change any word identity or invalidate any saved analysis.

### Key Entities

- **Word** (extends spec 002): adds its Strong's number or numbers as given by the source.
- **Lexicon entry**: one entry of the Greek–English lexicon, with its key number, Greek headword and full English definition. A fact about a lexeme, not about any one occurrence.
- **Strong's correspondence**: a reviewed record mapping a source Strong's number that the lexicon does not use as a key to the lexicon entry that covers it, or to "no entry".
- **Lemma frequency**: for each lemma, the number of words in the shipped text that carry it.
- **Attribution entry** (spec 002): gains an entry for the lexicon.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For 100% of words the source gives a Strong's number, the details show exactly the source's number or numbers.
- **SC-002**: For 100% of lemmas, the occurrence count shown equals an independent count of that lemma across all 27 books of the shipped text.
- **SC-003**: For every Strong's number in the shipped text, a definition is shown if and only if it matches a lexicon key directly or through a reviewed correspondence; every number with neither shows the "no entry" statement. The share of words in the text with a definition is reported when the data is prepared and is at least 99%.
- **SC-004**: In 100% of word details, no syntactic role, semantic domain, context-specific sense or other interpretive label appears.
- **SC-005**: Opening a word's details, including the new facts, feels instant: in normal use the details are complete within 0.1 seconds of selection, with no visible loading state.
- **SC-006**: The longest definition in the lexicon can be read to its end on a screen 320 pixels wide and on a wide screen, using touch, mouse or keyboard alone.
- **SC-007**: A screen-reader user can reach and hear every new fact with its label, and an automated accessibility check of the details reports no violations in light, dark and sepia themes.
- **SC-008**: The lexicon appears on the credits page with all fields that spec 002 requires of a credits entry.
- **SC-009**: In learning mode (spec 010), 0 of the new facts are revealed before the mode allows word details.

## Assumptions

- **Lexicon**: the Greek–English lexicon is the Dodson lexicon, which is widely described as public domain. Its status has **not** been verified for this project and it is not yet listed in `docs/reference/data-sources.md`. Verifying and recording it, with any attribution wording, is a dependency and blocks release (FR-019). If it proves unusable, the feature ships with another openly licensed lexicon of comparable coverage, or without the definition while keeping the Strong's number and count.
- **Strong's numbers**: the source text data (MACULA Greek) carries an augmented Strong's number per word, already covered by its CC BY 4.0 licence and existing credit. The current ingest keeps only an explicit whitelist of fields (surface form, following punctuation, verse, lemma, gloss, part of speech, morphology) and does **not** keep the Strong's number, so the corpus data (spec 001) must be extended to carry it, the lexicon entries, the reviewed correspondence and the per-lemma counts. That is a change to the corpus store's contents, specified with spec 001 during planning.
- **Correspondence**: the source's numbers do not always match the lexicon's keys (the earlier prototype needed a correspondence of roughly 75 numbers). The correspondence is assembled and reviewed once by the maintainers as data, in our own work, and is not copied from the prototype.
- **Count by lemma**: the count uses the source's lemma, across the whole SBLGNT as shipped (spec 009). Homographs the source gives one lemma are counted together; that follows the source and is not corrected by the app. Lemmas are compared after Unicode NFC normalisation, which only joins spellings Unicode treats as identical. For example, the source writes δέ with two different accent code points (tonos and oxia) that are the same text. No two lemmas the source distinguishes are merged.
- **Count is a fact, not a judgement**: stating a frequency does not rank, suggest or interpret anything, so it sits within the no-interpretation rule.
- **Constitution and product**: principle I (constitution v1.1.0, amended 2026-11-16) permits lexeme-level facts as word help (Strong's number, the lexicon entry for the lemma as a whole, New Testament frequency) and still forbids saying which sense, semantic domain or syntactic role applies in the passage. A matching note under the "No interpretation" decision in `PRODUCT.md` is still needed before or with planning. The constitution's Licensing section also blocks shipping Dodson until its licence is recorded (FR-019).
- **Showing a whole definition is not choosing a sense**: a lexicon definition lists the range of meanings of a lexeme. Showing it in full, with nothing marking one sense as the one meant here, leaves the choice with the user.
- **Editors**: specs 007 and 008 are not yet built; FR-017 binds them when they are, and their word-help requirements are updated to match.
- **Siblings**: spec 010 (learning mode) decides when word details are withheld; this spec only requires that the new facts follow that decision. Spec 014 (step through occurrences) provides what the count links to; until it exists the count is plain text. Specs 011, 012 and 015 do not affect this feature.
- **Single user, local**: there are no accounts and no per-user state in this feature; the data is the same for everyone using the installation.
