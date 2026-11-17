# Feature Specification: Step Through Occurrences

**Feature Branch**: `014-word-occurrences`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Step through occurrences of a word across the whole New Testament (from the Base44 prototype comparison)"

**Relationship to other specs**: Builds on the reader and its word popover (`002-greek-reader`) and on the whole New Testament being installed (`009-full-new-testament-text`). `013-richer-word-details` adds the lemma's New Testament occurrence count to the word popover; when both are present the stepper sits beside that count and shows the same total, but this feature does not depend on 013 and shows its own position and total without it. `010-learning-mode` (parsing practice) MUST NOT offer the stepper, because stepping reveals which words share a lemma. The design prototype in `docs/design/base44-prototype/` had a similar control; it is reference only, and these requirements are written from the user's needs.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Step to the next or previous use of a word (Priority: P1)

A student reading Romans 8 selects σάρξ and wants to see how Paul and the other writers use the same word elsewhere. From the word's details they step to the next use of that dictionary form, then the next, and back again. Each step takes them to the word itself, wherever it is in the New Testament, marks it so they can find it at a glance, and tells them where they are: which occurrence this is out of how many, and its book, chapter and verse.

**Why this priority**: This is the feature. Seeing a word in its other contexts is one of the most common moves in studying Greek, and doing it without leaving the text keeps the reader in the passage rather than in a separate concordance.

**Independent Test**: Open Romans 8, select σάρξ in verse 3, step forward several times within the chapter and into Romans 9 or beyond, then step back to the starting word; confirm the position, total and reference shown at each step match the source data in canonical order.

**Acceptance Scenarios**:

1. **Given** the word popover for a word whose lemma occurs more than once in the New Testament, **When** the user opens it, **Then** it offers controls to step to the previous and next occurrence of that lemma and shows the word's position among all occurrences, the total, and its reference (for example, for the first σαρκός in Romans 8:3, "occurrence 36 of 147, Romans 8:3").
2. **Given** the popover for a word, **When** the user steps to the next occurrence and that occurrence is in the same chapter, **Then** the stepped-to word is scrolled into view, marked as the current occurrence, and its popover is shown with the stepper, without the page reloading.
3. **Given** the popover for the last occurrence of a lemma in a chapter, **When** the user steps to the next occurrence, **Then** the reader moves to the chapter that holds it, crossing into the next book if needed, and the word is scrolled into view, marked and shown with its popover.
4. **Given** the user has stepped forward from a word, **When** they step back the same number of times, **Then** they return to the word they started from, with the same position shown.
5. **Given** any stepped-to word, **When** its popover is shown, **Then** the lemma it shares with the starting word is the matching criterion, and no sense, semantic domain, syntactic role or relevance judgement has been used to choose or order the occurrences.

---

### User Story 2 - Step without a mouse, and hear where you are (Priority: P1)

A pastor working at a keyboard, or a reader using a screen reader, opens a word's details with the keyboard and steps through its occurrences using keyboard shortcuts or the stepper buttons. Each step is announced with the position, total and reference, and focus stays on the stepper so they can keep going. A student on a tablet does the same with taps.

**Why this priority**: Constitution VI requires full keyboard, screen-reader and touch operation. A stepper that only works with a mouse would exclude part of the audience from the feature entirely.

**Independent Test**: With the keyboard only, select a word, step forward and back across a chapter boundary, and dismiss the popover; with a screen reader, confirm each step's announcement; on a touch tablet, step forward and back by tapping.

**Acceptance Scenarios**:

1. **Given** a word popover opened with the keyboard, **When** the user activates the next control or presses the next-occurrence shortcut, **Then** the reader steps to the next occurrence and keyboard focus stays on the stepper in the new word's popover, so a repeated press steps again.
2. **Given** a screen reader is running, **When** the user steps, **Then** the new position, total and reference are announced once (for example "occurrence 36 of 147, Romans 8:3"), including after a move to another chapter.
3. **Given** a stepped-to word, **When** it is marked as the current occurrence, **Then** the mark uses at least two cues (for example a tint and an outline or underline), so it does not rely on colour alone, in light, dark and sepia themes.
4. **Given** a touch tablet with no keyboard or mouse, **When** the user taps the previous and next controls, **Then** stepping works exactly as with a mouse, and each control is large enough to tap reliably.
5. **Given** the user is typing in a text field elsewhere on the screen, **When** they press keys that match the stepping shortcuts, **Then** no stepping happens.
6. **Given** a stepped-to word's popover, **When** the user presses Escape, **Then** the popover closes and focus goes to the stepped-to word, not the word where stepping began.

---

### User Story 3 - Return to or share a particular occurrence (Priority: P2)

A student finds a striking use of a word in Hebrews while stepping and wants to come back to it later, or paste the address into their notes. The address of the reading screen names that exact word, so opening it later shows the chapter with that word marked, even after the corpus has been rebuilt.

**Why this priority**: Useful for study notes and for picking up where one left off, but stepping is valuable without it.

**Independent Test**: Step to an occurrence in another book, copy the address, open it in a new tab and confirm the same word is marked; rebuild the corpus and open the address again.

**Acceptance Scenarios**:

1. **Given** the user has stepped to an occurrence, **When** they look at the address, **Then** it identifies the chapter and the specific word by its stable source identifier, not by its position in the chapter or among the occurrences.
2. **Given** an address that names a specific word, **When** the user opens it, **Then** the chapter is shown with that word scrolled into view and marked, and its popover with the stepper is available.
3. **Given** an address that names a specific word, **When** the corpus has been rebuilt from the same pinned source and the address is opened again, **Then** the same word is marked.
4. **Given** the user started stepping from Romans 8:3 and stepped through several occurrences in other chapters, **When** they use the browser's back control once, **Then** they return to Romans 8 at the point where they started stepping, not to each intermediate occurrence in turn.

---

### User Story 4 - Know when there is nowhere further to step (Priority: P2)

A user selects a word that appears only once in the New Testament, or reaches the first or last use of a common word. The stepper tells them plainly, rather than doing nothing or jumping back to the other end.

**Why this priority**: Rare words (hapax legomena) are exactly what students look up, and a silent or confusing stepper at the ends would undermine trust in the counts.

**Independent Test**: Select a lemma that occurs once; step to the first and last occurrences of a frequent lemma and try to go past them.

**Acceptance Scenarios**:

1. **Given** a word whose lemma occurs once in the New Testament, **When** its popover is shown, **Then** it states that this is the only occurrence (for example "1 of 1") and offers no active step controls.
2. **Given** the first occurrence of a lemma (in canonical order from Matthew 1:1), **When** its popover is shown, **Then** the previous control is unavailable and identified as such to assistive technology, and the next control works.
3. **Given** the last occurrence of a lemma (towards Revelation 22:21), **When** the user tries to step forward, **Then** nothing moves, the next control is unavailable, and stepping does not wrap round to the first occurrence.

### Edge Cases

- **Very frequent lemmas** (ὁ about 19,800 uses, καί about 9,000, αὐτός about 5,000): the full position and total are shown, every occurrence is reachable, and each step is as fast as for a rare word. Nothing is sampled, capped or reordered.
- **Several occurrences in one verse**: each is a separate step in canonical word order; the reference is the same and the position tells them apart.
- **Crasis words** (for example κἀγώ, κἀκεῖ): the source records one lemma for the combined form (κἀγώ), so stepping follows that lemma only. It does not split the word or include uses of the component lemmas (καί, ἐγώ). The stepper never invents a second lemma the source does not give.
- **Lemma spellings**: two lemmas match only when the source records them identically. The app does not merge variant spellings or related words.
- **Chapter missing from the installed corpus** (a store built from an older corpus): positions and totals cover only the chapters that are installed, and the stepper never steps into a chapter that has no text. An address naming a word in a missing chapter opens the chapter's existing "not available" state.
- **Address names a word that is not in that chapter, or does not exist** (a mistyped or stale address): the chapter is shown without any mark, with a short notice that the word could not be found; nothing else breaks.
- **User changes chapter by hand mid-stepping** (previous/next chapter links, the contents page): the current-occurrence mark and the popover close, and nothing pending from the stepper is applied to the new chapter. Selecting any word there starts stepping afresh from that word.
- **The temporary mark**: it clears when the user selects outside the stepped-to word and its popover, selects another word, presses Escape twice (closing the popover, then clearing the mark), or leaves the chapter. Stepping again moves it to the new word; only one word is ever marked.
- **Rapid repeated stepping** (holding a shortcut or tapping quickly across chapters): the reader ends at the occurrence that matches the number of steps taken, never at a stale one, and does not announce intermediate positions after the user has moved past them.
- **Display changes while a word is marked** (text size, typeface, theme, line spacing): the mark stays on the same word and the popover remains attached to it or closes cleanly.
- **Unsaved study work on the current passage** (once the editors exist): stepping to another chapter follows the same rules as any other navigation away, so autosaved work is kept (Constitution V).
- **Learning mode (010)**: the stepper and occurrence position are not shown, and stepping shortcuts do nothing.
- **Reduced motion**: when the user's system asks for reduced motion, the stepped-to word is brought into view without animated scrolling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The word popover on the reading screen MUST offer controls to step to the previous and next occurrence of the selected word's lemma.
- **FR-002**: Occurrences MUST be every word in the installed New Testament text whose lemma is identical to the selected word's lemma, as recorded in the source data, and nothing else.
- **FR-003**: Matching MUST NOT use sense, gloss, semantic domain (including Louw–Nida or other UBS data, which is not held), syntactic role, or any other interpretive analysis, and occurrences MUST NOT be filtered, grouped or ranked by relevance (Constitution I).
- **FR-004**: Occurrences MUST be ordered in canonical order, from Matthew 1:1 to Revelation 22:21, by book, chapter, verse and word order within the verse, and stepping MUST cross chapter and book boundaries in that order.
- **FR-005**: The stepper MUST show the current word's position among the occurrences, the total number of occurrences, and the word's reference (book, chapter and verse).
- **FR-006**: Stepping MUST bring the stepped-to word into view, open its popover with the stepper, and mark it as the current occurrence.
- **FR-007**: The current-occurrence mark MUST use at least two cues and MUST NOT rely on colour alone; it MUST be distinguishable in the light, dark and sepia themes and from part-of-speech colouring and ordinary word selection.
- **FR-008**: At most one word MUST carry the current-occurrence mark at a time. The mark MUST clear when the user selects outside the marked word and its popover, selects another word, dismisses it with the keyboard, or leaves the chapter by any route other than stepping.
- **FR-009**: Stepping MUST NOT wrap. At the first occurrence the previous control and at the last occurrence the next control MUST be unavailable, and their unavailable state MUST be exposed to assistive technology.
- **FR-010**: When a lemma has only one occurrence, the popover MUST say so and MUST NOT offer active step controls.
- **FR-011**: A stepped-to word MUST become the user's selected word, so any other view that follows the shared selection follows it (Constitution II). The current-occurrence mark is a reading-screen presentation of that selection and MUST NOT be stored in saved work.
- **FR-012**: The reading screen's address MUST identify the selected occurrence by the word's stable source identifier, so it can be bookmarked, reopened and copied within the local app, and continues to identify the same word after the corpus is rebuilt from the same source.
- **FR-013**: Opening an address that names a word MUST show that word's chapter with the word brought into view and marked. If the word is not in that chapter or does not exist, the chapter MUST be shown without a mark and with a short notice that the word was not found.
- **FR-014**: Steps MUST NOT each add an entry to the browser history. A single use of the browser's back control after a run of steps MUST return the user to the passage and word where the run began.
- **FR-015**: Positions and totals MUST be worked out from the installed text. The stepper MUST NOT step into a chapter whose text is not installed.
- **FR-016**: Changing chapter by any route other than stepping MUST end the current stepping run: no pending step is applied to the new chapter, and the mark and popover close.
- **FR-017**: When several steps are requested in quick succession, the reader MUST end at the occurrence matching the total number of steps requested, and MUST NOT display or announce a stale occurrence after a later one has been requested.
- **FR-018**: The stepper MUST be fully operable with the keyboard: its controls MUST be reachable and activatable, there MUST be keyboard shortcuts for previous and next occurrence while a word's popover is open, the shortcuts MUST be discoverable from the controls (for example in their accessible name or tooltip), and they MUST NOT act while the user is typing in a text field.
- **FR-019**: After a step, keyboard focus MUST be on the stepper in the stepped-to word's popover, and the new position, total and reference MUST be announced once to screen readers.
- **FR-020**: The stepper controls MUST be usable by touch alone and meet the WCAG 2.2 AA target-size requirement, consistent with the app's other touch controls.
- **FR-021**: Stepping MUST NOT reload the page, MUST NOT show a blank screen when moving to another chapter, and MUST keep the current chapter visible until the next one is ready.
- **FR-022**: When the user's system requests reduced motion, bringing the stepped-to word into view MUST NOT animate.
- **FR-023**: When the richer word details of `013-richer-word-details` are present, the stepper's total MUST equal the New Testament occurrence count shown there, and the stepper MUST sit beside it. Without 013, the stepper MUST still show its own total.
- **FR-024**: Learning mode (`010-learning-mode`) MUST NOT show the stepper, the occurrence position or the total, and the stepping shortcuts MUST do nothing there.
- **FR-025**: The stepper MUST follow `DESIGN.md`: colours from theme tokens, serif type, and rubric red as the only accent.
- **FR-026**: A full list of all occurrences with references (a concordance view) is out of scope for this feature; the stepper moves one occurrence at a time.

### Key Entities

- **Lemma**: The dictionary form recorded in the source for each word. The only key used to decide which words are occurrences of each other.
- **Occurrence**: One word in the installed text with a given lemma, identified by its stable source word identifier, with its reference (book, chapter, verse) and its position in canonical order among all words with that lemma.
- **Occurrence position**: For a selected word, its 1-based index among its lemma's occurrences and the total count; derived from the installed text, never stored.
- **Current occurrence**: The one word marked after a step; the reading-screen presentation of the shared word selection. Temporary and never saved.
- **Occurrence address**: A reading-screen address naming a chapter and one word by its stable identifier, usable as a bookmark within the local app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For a sample of lemmas covering a lemma that occurs once, a mid-frequency lemma and the three most frequent lemmas, stepping from the first to the last occurrence visits exactly the words whose lemma matches in the source, each once, in canonical order, and the total shown equals that count.
- **SC-002**: A step to an occurrence in the same chapter shows the marked word within 0.1 seconds, and a step to another chapter or book within 1 second on the development machine, with no page reload and no blank screen.
- **SC-003**: Stepping is equally fast for the most frequent lemma (ὁ) and for a lemma that occurs a handful of times, within the limits of SC-002.
- **SC-004**: 100% of stepping actions (step, cross a chapter, reach an end, dismiss) are completable with the keyboard alone and with touch alone.
- **SC-005**: Every step is announced to a screen reader with position, total and reference, and no announcement is made for an occurrence the user has already stepped past.
- **SC-006**: The current-occurrence mark passes WCAG 2.2 AA contrast in all three themes and is identifiable with colour perception removed (for example in greyscale).
- **SC-007**: 100% of occurrence addresses for a sample of words still mark the same word after the corpus is rebuilt from the same pinned source.
- **SC-008**: After any run of steps, one use of the browser's back control returns to where the run began in 100% of trials.
- **SC-009**: In learning mode, zero stepper controls, positions or totals are shown.

## Assumptions

- The whole SBL Greek New Testament is installed (`009-full-new-testament-text`); a partly installed corpus is the out-of-date case, handled by FR-015.
- "Same word" means the identical lemma string the source records. The source gives every word a lemma, and gives crasis forms a single combined lemma; the app takes both as they are.
- Stepping stops at both ends rather than wrapping, so the position and total stay meaningful and the user is not silently moved from Revelation back to Matthew.
- A list of all occurrences is left out: for the most frequent lemmas it would run to thousands of rows, and a concordance or search feature would be the better home for it. The stepper alone meets the need of seeing a word in its other contexts.
- Steps replace the current history entry rather than adding one, so the back control returns to where stepping began instead of walking back through possibly thousands of steps. Ordinary chapter navigation keeps its current history behaviour.
- The exact keys for the stepping shortcuts are a design decision for planning, provided they do not clash with existing reader shortcuts or browser and screen-reader defaults.
- Stepping is offered from the reading screen's word popover. Whether the arcing and diagramming editors also offer it, once they exist, is decided in their own features; they follow the shared selection either way.
- The app is single-user and local (Constitution VII); addresses are shareable only with someone who can reach the same local app.
