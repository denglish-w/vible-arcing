# Feature Specification: Learning Mode (Parsing Practice)

**Feature Branch**: `010-learning-mode`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Learning mode: practise parsing Greek words (from the Base44 prototype comparison)"

## Clarifications

### Session 2026-11-16

- Q: Many verb forms look the same in middle and passive, but the source always picks one. How should a student's voice answer be graded? → A: Add a "middle or passive" voice choice that agrees when the source says middle or passive in a tense whose middle and passive forms are the same; "middle" and "passive" alone are still graded exactly.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Parse a word and check it against the source (Priority: P1)

A Greek student reading a chapter switches the reading screen into Learning mode. They select a word, type its dictionary form, choose its part of speech and then fill in only the grammatical details that apply to that kind of word. When they check, the app shows the source's parsing beside theirs, field by field, marking each as agreeing or differing. Before they check, nothing on the screen gives the answer away.

**Why this priority**: Parsing practice in the real text is the whole point of the feature. Without the check and the field-by-field comparison there is nothing to learn from.

**Independent Test**: In Learning mode on Philippians 1, select a finite verb, enter a deliberately wrong tense and the correct remaining fields, check, and confirm that only tense is marked as differing, that the source parsing appears only after checking, and that no syntactic role is shown at any point.

**Acceptance Scenarios**:

1. **Given** the reading screen in Reading mode, **When** the user switches to Learning mode, **Then** the screen says Learning mode is on and invites the user to select a word to parse.
2. **Given** Learning mode, **When** the user selects a word, **Then** a parsing form opens for that word showing the word as it appears in the text, its reference, a field for the dictionary form and a part-of-speech choice, and no other fact about the word.
3. **Given** the parsing form, **When** the user chooses "verb" and then an indicative mood, **Then** the form asks for tense, voice, mood, person and number, and does not ask for case or gender.
4. **Given** the parsing form, **When** the user chooses "participle", **Then** the form asks for tense, voice, case, number and gender without a separate mood choice, and a participle in the source counts as a match for part of speech.
5. **Given** the parsing form, **When** the user changes the part of speech, **Then** fields that no longer apply are removed and any values the user entered in them are not graded.
6. **Given** a completed form, **When** the user checks it, **Then** the source's dictionary form and parsing are shown, and each field the user answered is listed with the user's answer, the source's value and a mark of agreeing or differing.
7. **Given** a word whose inflected form differs from its dictionary form (for example a dative noun), **When** the user types the dictionary form, **Then** it is graded as agreeing, and typing the inflected form instead is graded as differing.
8. **Given** a typed dictionary form that differs from the source only in accents, breathing marks, capitalisation or the form of final sigma, **When** the user checks, **Then** it is graded as agreeing.
9. **Given** Learning mode, **When** the user has not yet checked a word, **Then** neither the screen nor anything announced to assistive technology reveals that word's dictionary form, gloss, part of speech or parsing.
10. **Given** any point in Learning mode, **When** the source's parsing is shown, **Then** it contains no syntactic role (such as subject or object) and no other interpretive analysis.

---

### User Story 2 - Pick up where I left off (Priority: P1)

A student comes back to a chapter they practised last week. When they reopen a word they have already attempted, the form is filled in with their last answer, and the app tells them they checked it before and whether it agreed. Their attempts survive closing the browser and restarting the app.

**Why this priority**: Practice spans many sessions. An attempt that is lost, or a form that forgets what was entered, wastes the student's effort (constitution principle V).

**Independent Test**: Check a word, restart the server, reopen the same word in another browser on the same computer, and confirm the form is pre-filled with the earlier answer and states when it was checked and its outcome.

**Acceptance Scenarios**:

1. **Given** the user has checked a word, **When** they reopen that word later, including after a restart, **Then** the form is pre-filled with their most recent answer for that word.
2. **Given** a pre-filled form, **When** it opens, **Then** it states that the word was checked before, when, and whether every field agreed, and it does not show the source's parsing until the user checks again.
3. **Given** a pre-filled form, **When** the user changes an answer and checks again, **Then** a new attempt is kept and earlier attempts remain.
4. **Given** a word the user has never attempted, **When** they open it, **Then** the form is empty.
5. **Given** an attempt has been checked, **When** saving it fails, **Then** the result is still shown, the user is told it is not yet saved, saving is retried, and the indicator clears once it succeeds.

---

### User Story 3 - Work through a chapter word by word (Priority: P2)

After checking a word, the student moves straight on to the next word in reading order without hunting for it on the page. At the end of the chapter, the app tells them so and offers the next chapter.

**Why this priority**: Systematic practice through a passage is how students drill parsing, but the feature is usable one word at a time without it.

**Independent Test**: In Learning mode, check the first word of a chapter, use the next-word control repeatedly across a verse boundary, and confirm each step opens the next word in order, scrolled into view, until the end-of-chapter message appears.

**Acceptance Scenarios**:

1. **Given** a parsing form for a word, **When** the user chooses next word, **Then** the form opens for the following word in reading order, crossing verse boundaries, and that word is brought into view.
2. **Given** the last word of a chapter, **When** the user chooses next word, **Then** the app says the chapter is finished and offers to continue in the next chapter, crossing book boundaries, except after Revelation 22.
3. **Given** a form with answers that have not been checked, **When** the user chooses next word, **Then** the unchecked answers are discarded without a save, and the user is not blocked.
4. **Given** a parsing form, **When** the user moves to the previous word, **Then** the form opens for the preceding word in reading order.

---

### User Story 4 - Practise without the answers in view (Priority: P2)

A student who normally reads with part-of-speech colouring on switches to Learning mode. The colouring and the word-detail popover are withheld so they cannot read the answer off the page. When they switch back to Reading mode, everything returns as it was.

**Why this priority**: Practice is meaningless if the answer is visible, but the core form and check still work on a plain page.

**Independent Test**: Turn part-of-speech colouring on, switch to Learning mode and confirm no word is coloured or underlined by category and no legend is shown; select a word and confirm the parsing form opens instead of the detail popover; switch back and confirm the colouring returns.

**Acceptance Scenarios**:

1. **Given** part-of-speech colouring is on, **When** the user switches to Learning mode, **Then** no word is coloured or styled by its category and the legend is hidden.
2. **Given** Learning mode, **When** the user selects a word, **Then** the parsing form opens and the word-detail popover does not.
3. **Given** Learning mode, **When** the user switches back to Reading mode, **Then** part-of-speech colouring and the word-detail popover behave as before, and the user's display settings are unchanged.
4. **Given** a word is selected in Learning mode, **When** the user switches to Reading mode, **Then** the same word stays selected.

---

### User Story 5 - Practise by keyboard, screen reader or touch (Priority: P2)

A student on a tablet parses words by tapping; another uses only the keyboard; a third uses a screen reader. Each can choose a word, enter the dictionary form in Greek, choose every field, check, read the comparison and move to the next word.

**Why this priority**: Accessibility on every device is a constitution principle, and tablets are a first-class target.

**Independent Test**: Complete the full parse-check-next cycle with keyboard alone, with a screen reader, and on a touch tablet with no keyboard attached.

**Acceptance Scenarios**:

1. **Given** Learning mode, **When** a keyboard user moves focus to a word and presses Enter, **Then** the parsing form opens with focus in its first field.
2. **Given** an open form, **When** the user presses Escape, **Then** the form closes and focus returns to the word, after confirming if there are unchecked answers.
3. **Given** a checked word, **When** the comparison appears, **Then** every agreeing and differing field is marked by text or a symbol as well as by colour, and the outcome is announced to screen readers.
4. **Given** a touch device without a physical keyboard, **When** the user enters the dictionary form, **Then** they can produce Greek letters by typing Latin letters that are converted to Greek as they type.
5. **Given** a narrow screen, **When** the form opens, **Then** it fits the screen without hiding the controls to check, close or move on.

### Edge Cases

- A word whose source parsing leaves a field blank that the form asks for (for example a pronoun with no person or gender): the user can answer "not applicable", which agrees with a blank source value.
- A word with no part of speech in the source, or a category the form does not offer: the user can still answer; the comparison shows the source's value as given.
- A present, imperfect, perfect or pluperfect verb whose middle and passive forms are the same: the user can answer "middle or passive", which agrees with either source value (FR-016a); the comparison still shows which one the source chose.
- An indeclinable word such as a proper name with no case in the source: the case field agrees only with "not applicable".
- The user checks with required fields left empty: the empty fields are graded as differing and shown as unanswered, rather than the check being blocked.
- The dictionary form field is left empty: graded as differing and shown as unanswered.
- Learning mode is chosen on a chapter whose text is not available: the unavailable message from the reader is shown and nothing can be parsed; navigation still works.
- An attempt refers to a word that no longer exists after the corpus is rebuilt: the attempt is kept, never silently deleted, and is simply not shown on any page.
- The source corrects a word's parsing after re-ingest: earlier attempts keep the outcome they had when checked; a new check is graded against the current source.
- The page scrolls or the window resizes while the form is open: the form stays usable and attached to its word, or closes without losing a checked attempt.
- The check cannot reach the server (for example, the server has stopped): the user's answers are kept, the form says the word could not be checked and offers to try again, nothing is saved and no source value is shown. Only a check that succeeded can leave an attempt waiting to be saved.
- The user opens the same chapter in two tabs and checks the same word in both: both attempts are kept, and the most recent one pre-fills the form.

## Requirements *(mandatory)*

### Functional Requirements

**Mode**

- **FR-001**: The reading screen MUST offer a Learning mode alongside Reading mode, switchable from the reading screen at any time.
- **FR-002**: While Learning mode is on, the screen MUST show a visible notice that it is on and how to begin.
- **FR-003**: The chosen mode MUST persist across chapter navigation and across visits in the same browser, falling back to Reading mode if the stored choice is missing or unreadable.
- **FR-004**: In Learning mode the system MUST withhold part-of-speech colouring, its legend, the word-detail popover and any other per-word fact (dictionary form, gloss, part of speech, parsing, and the richer word details of spec 013) until the user has checked that word.
- **FR-005**: Leaving Learning mode MUST restore Reading-mode behaviour and MUST NOT change any display setting.
- **FR-006**: The selected word MUST be kept when switching between Learning and Reading mode.

**Parsing form**

- **FR-007**: Selecting a word in Learning mode MUST open a parsing form for that word showing the word as it appears in the text and its reference.
- **FR-008**: The form MUST ask for the dictionary form as free text in Greek, and MUST let the user produce Greek letters by typing Latin letters, with final sigma used at the end of a word.
- **FR-009**: The form MUST ask for part of speech from a fixed list: noun, verb, participle, article, pronoun, adjective, adverb, preposition, conjunction, particle, numeral and interjection.
- **FR-010**: After a part of speech is chosen, the form MUST show only the fields that apply to it:
  - verb: tense, voice and mood; then person and number for indicative, subjunctive, optative and imperative; case, number and gender for participle; nothing further for infinitive;
  - participle: tense, voice, case, number and gender;
  - noun, adjective, article and numeral: case, number and gender;
  - pronoun: case, number, gender and person;
  - all other parts of speech: no further fields.
- **FR-011**: Each field MUST offer a closed list of values: tense (present, imperfect, future, aorist, perfect, pluperfect), voice (active, middle, passive, middle or passive), mood (indicative, subjunctive, optative, imperative, participle, infinitive), person (first, second, third), number (singular, plural), gender (masculine, feminine, neuter) and case (nominative, genitive, dative, accusative, vocative). Person, gender and case MUST also offer "not applicable".
- **FR-012**: Changing the part of speech or mood MUST remove fields that no longer apply, and only fields shown at the time of checking MUST be graded and saved.
- **FR-013**: The form MUST NOT pre-select, suggest, order by likelihood or otherwise hint at any answer drawn from the source.

**Checking**

- **FR-014**: Checking MUST compare every shown field and the dictionary form with the source, and show for each the user's answer, the source's value and whether they agree, followed by the source's full parsing and dictionary form.
- **FR-015**: The dictionary form MUST be compared with the source's lemma, not with the inflected form in the text, ignoring accents, breathing marks, capitalisation, final-sigma form and punctuation such as elision marks.
- **FR-016**: Choosing "participle" MUST agree with a source word that is a verb in the participle mood.
- **FR-016a**: Voice "middle or passive" MUST agree with a source voice of middle or passive when the source's tense is present, imperfect, perfect or pluperfect, where the two forms are the same, and MUST differ in the aorist and future, where they are not. "Middle" and "passive" MUST each agree only with the same source value.
- **FR-017**: "Not applicable" MUST agree with a source field that is blank for that word.
- **FR-018**: Empty answers MUST be graded as differing and labelled as unanswered; the check MUST NOT be blocked by them.
- **FR-019**: The outcome MUST state whether every field agreed or how many differed, and MUST present differences as differences from the source, not as the user's error alone.
- **FR-020**: The source's dictionary form and parsing MUST NOT be obtainable from the reading screen, including its hidden content and anything announced to assistive technology, before the user checks that word in Learning mode.
- **FR-021**: The comparison MUST NOT show any syntactic role or other interpretive analysis from the source data.

**Attempts**

- **FR-022**: Each check MUST be saved as an attempt recording the word (by its MACULA word identifier), the time, the user's dictionary form, the user's answers for the fields shown, the source's values at that time and the outcome per field.
- **FR-023**: Saving an attempt MUST NOT delay showing its result; the result appears at once and the attempt saves in the background, with a visible unsaved indicator and retry on failure.
- **FR-024**: Every attempt MUST be validated before it is stored: the word must exist in the corpus, the part of speech and every field value must come from the closed lists, and only fields that apply to the chosen part of speech may be present. Invalid attempts MUST be refused and the user told.
- **FR-025**: All attempts for a word MUST be kept; checking again MUST add an attempt, never overwrite one.
- **FR-026**: Reopening a word MUST pre-fill the form with the most recent attempt's answers and MUST state when it was checked and whether every field agreed, without showing the source's values until the user checks again.
- **FR-027**: Attempts MUST survive server restarts and corpus rebuilds; an attempt whose word no longer exists MUST be kept rather than deleted.
- **FR-028**: Users MUST be able to export their attempts to a file that names each word's reference, text form and edition.

**Moving through a chapter**

- **FR-029**: The form MUST offer next-word and previous-word controls that open the form for the adjacent word in reading order, crossing verse boundaries, and bring that word into view.
- **FR-030**: Moving on with answers that have not been checked MUST discard them without saving.
- **FR-031**: After the last word of a chapter, next word MUST say the chapter is finished and offer the next chapter, crossing book boundaries, and offer nothing after Revelation 22.

**Accessibility**

- **FR-032**: Every Learning-mode action (switching mode, choosing a word, entering the dictionary form, choosing every field, checking, reading the comparison, moving to the next or previous word, closing) MUST be operable by keyboard alone, by screen reader and by touch alone.
- **FR-033**: Agreement and difference MUST each be shown by a text label or symbol in addition to colour, and the outcome MUST be announced to assistive technology when it appears.
- **FR-034**: Escape MUST close the form and return focus to its word; if there are unchecked answers, the user MUST be asked to confirm first.
- **FR-035**: The form MUST fit narrow screens with its check, close and move controls always reachable, and MUST follow the app's themes in light, dark and sepia.
- **FR-036**: In Learning mode the system MUST hide the English line (spec 012) without changing the user's stored English setting, and MUST show it again when the user leaves Learning mode.

### Key Entities

- **Learning mode**: A per-browser choice on the reading screen that replaces word facts with the parsing form and withholds anything that would reveal an answer.
- **Parsing answer**: What the user enters for one word before checking: dictionary form, part of speech and the values of the fields that apply.
- **Attempt**: One checked parsing answer for one word, identified by its MACULA word identifier, with the time, the user's answers, the source's values when checked and the per-field outcome. Many attempts may exist per word; the most recent pre-fills the form. Once accounts exist (spec 015), each attempt belongs to the account that made it.
- **Field comparison**: For one field, the user's value, the source's value and whether they agree.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can select a word, complete a parse and see the comparison in under one minute, and the result appears with no perceptible wait for saving.
- **SC-002**: In 100% of Learning-mode views before a word is checked, its dictionary form, gloss, part of speech and parsing are absent from the screen and from what assistive technology announces.
- **SC-003**: In 100% of comparisons, no syntactic role or other interpretive label appears.
- **SC-004**: For every combination of part of speech and mood, the form shows exactly the fields listed in FR-010.
- **SC-005**: 100% of checked attempts are still present and pre-fill the form after a server restart and after a corpus rebuild.
- **SC-006**: A dictionary form typed without accents or breathings is graded the same as one typed with them in 100% of cases.
- **SC-007**: A user can step through every word of a chapter in reading order using only the next-word control.
- **SC-008**: The full parse, check and next-word cycle is completed with keyboard alone, with a screen reader and with touch alone, and agreement is distinguishable in greyscale.
- **SC-009**: Switching between Reading and Learning mode leaves every display setting unchanged in 100% of switches.

## Assumptions

- **Users**: mainly seminary students and lay students learning Greek; pastors may use it to keep their parsing fresh.
- **Source of truth**: the source parsing is MACULA's morphology as already shipped with the corpus (spec 001, spec 009). It is factual word help under constitution principle I, revealed only after the user's own attempt. The app never shows MACULA's sentence-role labels. Because the source can itself be wrong or debatable, outcomes are worded as agreeing or differing from the source rather than as right or wrong.
- **Fields asked**: degree (comparative, superlative) is not asked, though it is shown with the source's full parsing after checking. Proper nouns are graded as nouns.
- **Lemma entry**: Greek may be typed directly with the operating system's Greek keyboard or through the Latin-to-Greek conversion; diacritics are optional because grading ignores them.
- **Attempts are a new kind of saved work** kept on the local server alongside analyses and diagrams (spec 005), so they survive restarts and are shared by browsers on the same computer. They are not listed on the `/work` page in this feature; a progress or review view is out of scope.
- **Constitution fit**: no amendment is needed. Principle I allows revealing morphology as word facts; principle V's validation and export rules are applied to attempts (FR-024, FR-028), reading "analyses" there as covering all saved work. If maintainers read principle V as covering only analyses, a PATCH amendment saying "saved work" would make this explicit. Principle VII is unchanged: until spec 015 exists the app is single-user, so all attempts belong to the one local user.
- **Sibling specs**: once spec 015 (accounts) exists, attempts and the mode choice belong to the signed-in account, and one account never sees another's attempts. Spec 012's English line under the Greek is hidden in Learning mode (FR-036), because a verse translation can give away person, number or tense; the user's English setting is unchanged and returns when they leave Learning mode (decided 2026-11-16). Spec 013's richer word details are withheld in Learning mode like the popover (FR-004). Spec 014's step-through-occurrences control is not offered in Learning mode, because it groups words by lemma and would reveal the answer. Spec 011's translation workspace is independent of Learning mode.
- **Out of scope**: timed quizzes, scores or streaks, filtering practice by part of speech, spaced repetition, practice outside the reading screen, and practice in the arcing or diagramming views.
- **Prototype**: the Base44 prototype in `docs/design/base44-prototype/` is reference only; screens are designed from `DESIGN.md` and no prototype code or wording is reused.
