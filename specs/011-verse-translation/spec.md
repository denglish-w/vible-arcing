# Feature Specification: Verse Translation

**Feature Branch**: `011-verse-translation`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Translate: write my own translation and notes verse by verse (from the Base44 prototype comparison)"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Write my own translation under each verse (Priority: P1)

A seminary student reading Philippians 1 turns on Translate. She has no translation of this chapter yet, so an empty box opens under each verse, belonging to a new translation with a default name. She types her own English rendering of verse 3 and a short note on a word she found hard. The text appears as she types, with no save button. She closes the browser, comes back the next day, turns Translate on again, and her translation and note are under verse 3 exactly as she left them.

**Why this priority**: Writing and keeping one's own translation beside the Greek is the whole point of the feature. Splitting and phrase groupings refine it; without this story they have nothing to attach to.

**Independent Test**: Turn Translate on for a chapter, write a translation and a note for two verses, reload the page and restart the server, and confirm both verses reopen with identical text. Repeat once with a keyboard only and once by touch only on a tablet.

**Acceptance Scenarios**:

1. **Given** the reading screen with Translate off, **When** the user turns Translate on, **Then** the active translation's name is shown in a translation picker and a translation box with a field for the translation and a field for notes appears under every verse of the chapter, and the Greek text stays where it is in reading order.
2. **Given** a verse the user has never translated, **When** its box opens, **Then** both fields are empty: nothing is filled in from the English line (spec 012), the word glosses or any other source.
3. **Given** the user types in a verse's translation field, **When** each character is typed, **Then** it appears at once, without waiting for the server.
4. **Given** the user stops typing, **When** about one second passes, **Then** a background save is initiated, the user sees that saving is in progress, and Saved appears only after success; completion timing follows SC-003.
5. **Given** a saved translation, **When** the user reloads the page, opens the app in another browser on the same computer, or the server is restarted, **Then** the translation and notes reopen with identical content.
6. **Given** Translate is on, **When** the user selects a Greek word with a single click, tap or Enter, **Then** the word detail opens as it does in the reader (spec 002); Translate does not take that action away.
7. **Given** the user turns Translate off and on again, or moves to another chapter and back, **When** the boxes reappear, **Then** every saved translation and note is still there.
8. **Given** a user clears every field of a verse that has no segments or phrase groupings, **When** the change is saved, **Then** nothing is stored for that verse.
9. **Given** a chapter with no translations, **When** the user turns Translate on and leaves without typing anything, **Then** no translation is stored and nothing is added to the saved work list.

---

### User Story 2 - Split a verse into segments and merge them back (Priority: P2)

A pastor translating Ephesians 1:3 finds the verse too long to render in one go. He splits it after the fifth word and again after the eleventh, so the verse becomes three segments labelled 3a, 3b and 3c, each with its own translation and notes. Later he decides 3b and 3c read better together and merges them; their translations and notes are joined into one segment, and the labels become 3a and 3b.

**Why this priority**: Long Greek sentences are hard to translate as a single block, and the prototype showed users break verses into clauses. It depends on Story 1 but is not needed for a first useful release.

**Independent Test**: Split a verse at two word boundaries, write text in each segment, merge two of them, reload, and confirm labels, boundaries and text. Do the same with a keyboard only and by touch only.

**Acceptance Scenarios**:

1. **Given** a verse box, **When** the user chooses to split the verse, **Then** a split point is offered between every pair of adjacent words, all looking the same, and none after the last word or before the first.
2. **Given** split points are offered, **When** the user picks the one after a word, **Then** the verse becomes two segments at that boundary, each with its own empty translation and notes fields, and the text already written stays with the first segment.
3. **Given** a verse 21 split into three segments, **When** the box is shown, **Then** the segments are labelled 21a, 21b and 21c in reading order, and a mark in the Greek line shows where each boundary falls.
4. **Given** a verse with one segment, **When** the box is shown, **Then** it is labelled with the plain verse number (21), with no letter.
5. **Given** two adjacent segments where only one has text, **When** the user merges them, **Then** they become one segment holding that text, with no confirmation asked.
6. **Given** two adjacent segments that both have translation text or both have notes, **When** the user asks to merge them, **Then** the app asks the user to confirm, and on confirmation joins the first segment's text and then the second's for each field, losing nothing.
7. **Given** a merge or split, **When** the labels are recalculated, **Then** they stay in reading order with no gaps (21a, 21b, ...).
8. **Given** a phrase grouping covers words on both sides of a boundary, **When** the user tries to split there, **Then** the split is not made and the user is told it would cut through a phrase grouping.

---

### User Story 3 - Group the words of a phrase (Priority: P2)

A lay student working through Romans 3:21 wants to keep "χωρὶς νόμου" together while she decides how to render it. She drags across the two words (or clicks the first and shift-clicks the last), chooses to group them, and a mark appears around the phrase in the Greek line. The grouping has its own small fields for her rendering of the phrase and a note. She can jump from the grouping's entry to the phrase in the text and back, and delete the grouping when she no longer needs it.

**Why this priority**: Marking phrases helps users see units of meaning as they translate, but a verse-level translation is useful without it.

**Independent Test**: Create two disjoint groupings and one nested grouping in a verse with the mouse, then again with the keyboard only and by touch only; try a partial overlap and confirm it is refused; write a rendering for one grouping, reload, and confirm all groupings and text remain.

**Acceptance Scenarios**:

1. **Given** Translate is on, **When** the user drags from one word to another in the same verse, or selects one word and shift-selects another, **Then** the contiguous run of words between them is highlighted as a pending selection and a choice to group them or cancel appears.
2. **Given** a pending selection of two or more words, **When** the user chooses to group them, **Then** a visible mark opens before the first word and closes after the last, and an entry for the grouping appears in that verse's box showing the grouped Greek, an empty rendering field and an empty note field.
3. **Given** a pending selection, **When** the user cancels or presses Escape, **Then** the selection clears and nothing is stored.
4. **Given** an existing grouping, **When** the user groups a run that lies wholly inside it or wholly contains it, **Then** the new grouping is made and the marks nest.
5. **Given** an existing grouping, **When** the user tries to group a run that overlaps it only in part, **Then** the grouping is not made and the user is told why.
6. **Given** a selection that crosses a segment boundary or a verse boundary, **When** the user tries to group it, **Then** the grouping is not made and the user is told a phrase grouping must stay within one segment.
7. **Given** a keyboard-only user with focus on a Greek word, **When** they extend the selection word by word with the keyboard and then choose to group, **Then** the grouping is made exactly as with a mouse.
8. **Given** a tablet user with no mouse or keyboard, **When** they choose to start a grouping, tap the first word and tap the last word, **Then** the grouping is made without dragging, hovering or multi-finger gestures.
9. **Given** a grouping, **When** the user selects its mark in the text, **Then** focus moves to its entry in the box, and from the entry the user can move back to the phrase in the text.
10. **Given** a grouping, **When** the user deletes it, **Then** its marks, rendering and note are removed and the words and any other groupings stay.

---

### User Story 4 - Keep several named translations of a chapter (Priority: P2)

A pastor keeps two translations of Philippians 1: "Literal draft", where he follows the Greek word order closely, and "Smooth", which he reads from the pulpit. He picks "Smooth" from the translation picker on the reading screen, and the boxes show that translation's segments, phrase groupings, renderings and notes. When he comes back to Philippians 1 next week, "Smooth" opens because it was the last one he used there. To try a different approach he duplicates "Literal draft", renames the copy "Literal, second pass", and later deletes the original.

**Why this priority**: Students and pastors often keep a close and a free rendering of the same text side by side. It builds on Story 1 but a single translation per chapter is already useful.

**Independent Test**: In one chapter create two translations with different text, segments and groupings; switch between them; rename one; duplicate one and change the copy; delete one; reload and confirm each translation's content, the list in `/work`, and that the last-used translation opens by default. Do the picker steps once with a keyboard only, once with a screen reader and once by touch only.

**Acceptance Scenarios**:

1. **Given** a chapter with no translations, **When** the user types in any verse box, **Then** a translation is created with the default name "Translation 1" and the text is saved into it.
2. **Given** the translation picker, **When** the user chooses to create a new translation, **Then** a translation is made with the next unused default name ("Translation 2", ...), it becomes active, every verse box is empty, and nothing is copied from the English line, glosses, another translation or any other source.
3. **Given** two translations of a chapter, **When** the user picks the other one in the picker, **Then** every verse box shows that translation's own segments, phrase groupings, translations and notes, and the Greek line shows only its boundaries and grouping marks.
4. **Given** a translation, **When** the user renames it to a name no other translation of that chapter has, **Then** the new name shows in the picker and in the saved work list.
5. **Given** a translation named "Smooth", **When** the user tries to rename another translation of the same chapter to "smooth" (any letter case, ignoring spaces at either end), or to an empty name, **Then** the rename is refused, the user is told why, and the old name stays.
6. **Given** a translation, **When** the user duplicates it, **Then** a new translation holding an exact copy of its verses, segments, groupings, renderings and notes is made with the name "<name> (copy)" (numbered if that name is taken), it becomes active, and later edits to either one leave the other unchanged.
7. **Given** a translation, **When** the user deletes it and confirms, **Then** it and all its content are removed, it leaves the picker and the saved work list, and the remaining translation last used in that chapter becomes active (or, if none remains, an empty unsaved one as in scenario 1 of this story).
8. **Given** the user last used "Smooth" in Philippians 1, **When** they open Philippians 1 again with Translate on, in a later visit or another browser on the same computer, **Then** "Smooth" is active.
9. **Given** a translation the user has created, renamed or duplicated, **When** every verse in it is cleared, **Then** the translation is kept, with its name, until the user deletes it.
10. **Given** a keyboard-only user, **When** they open the picker, move between translations, choose one, and create, rename, duplicate or delete a translation, **Then** every step works from the keyboard with visible focus and Escape closes the picker without a change.
11. **Given** a screen-reader user, **When** they reach the picker, **Then** it is announced with its purpose, the active translation's name, and the number of translations, and switching translation is announced by name.
12. **Given** a tablet user with no mouse or keyboard, **When** they switch, create, rename, duplicate or delete a translation, **Then** every step can be done by tapping, without hovering or dragging.

---

### User Story 5 - Take my translation with me (Priority: P3)

A pastor wants his "Smooth" translation of Philippians 1 outside the app to paste into sermon notes. He finds it in his saved work and downloads it as a file that names the translation, passage and edition and holds every segment, note and phrase grouping.

**Why this priority**: Export is required by the constitution (principle V) but is used less often than writing.

**Independent Test**: Make two translations of parts of a chapter, open `/work`, confirm each is listed separately, export one, and compare the file with what is stored.

**Acceptance Scenarios**:

1. **Given** a chapter with two stored translations, **When** the user opens their saved work list, **Then** each is listed as its own entry with its name as the title, its passage, the kind "translation" and its last-modified time, alongside analyses and diagrams.
2. **Given** a listed translation, **When** the user opens it, **Then** the reading screen for that chapter opens with Translate on and that translation active.
3. **Given** a listed translation, **When** the user exports it, **Then** a file is downloaded that names the translation, passage and edition and holds only that translation's verses: every verse's segments, translations, notes and phrase groupings exactly as stored, each word referred to by its MACULA identifier, with the Greek text of every segment and grouping also written out so the file can be read without the app.
4. **Given** a listed translation, **When** the user deletes it and confirms, **Then** that translation and its segments, notes and groupings are removed, and every other translation of the chapter is unchanged.

---

### Edge Cases

- **Re-ingest of the corpus.** Segment boundaries and groupings point at MACULA word ids, so a rebuild that keeps the same words leaves every boundary and grouping in place. If a rebuild removes a word that a boundary or grouping refers to, the saved record is kept unchanged, the affected verse says which boundary or grouping no longer matches the text, and the user can remove or redo it. Their translation and notes are never dropped. If the same word identifiers remain in the same order but Greek spelling or punctuation changes, reading and exporting keep the saved record unchanged. The next successful edit save refreshes the Greek reference text from the installed corpus without changing user text, segment boundaries or groupings; it requires no structural repair.
- **Splitting at the last word.** No split point is offered after a verse's last word or before its first, so a segment can never be empty.
- **Every word split.** A verse may be split at every boundary. Labels continue past z as aa, ab and so on, still in reading order.
- **Overlapping groupings.** Groupings may nest or be separate but never overlap in part; an exact duplicate of an existing grouping is refused as well.
- **Single word.** A grouping needs at least two words; selecting one word opens word detail instead.
- **Very long notes.** A note or translation may run to many paragraphs. Each field has a stated length limit; the user is told as they approach it, and text is never cut silently. A translation that is too large to save is refused as set out in spec 005 with the changes kept and a download offered.
- **Storage failure.** If a save fails, the changes stay on screen, the user is told the work is not saved, and the app retries, as in spec 005. A refusal that retrying cannot fix stops retries, says why and offers a download.
- **Leaving with unsaved changes.** Closing or reloading the page while changes are unsaved asks the user to confirm leaving; moving to another chapter sends the pending changes once more, as in spec 005. Turning Translate off does not discard or block unsaved changes. Moving to saved work, book navigation, the home page or credits, including browser Back/Forward within the app, also keeps pending or failed work reachable with its status and download; full-page departure retains the unsaved-change warning.
- **Two tabs.** The same translation open in two tabs follows the conflict rules of spec 005: a stale save never overwrites a newer one silently. Different translations of one chapter open in two tabs save independently and never conflict. If one tab deletes or renames a translation the other has open, the other tab's next save is handled as a deleted record or a newer version, as in spec 005.
- **Switching with unsaved changes.** Switching to another translation sends the active translation's pending changes first; they are never applied to the newly chosen one.
- **Many translations.** There is no fixed limit; the picker stays usable and scrolls with dozens of translations of one chapter.
- **Last-used translation deleted.** If the translation last used in a chapter has been deleted, the most recently modified remaining one opens instead.
- **Duplicate name on duplicating.** If "<name> (copy)" is taken, the copy is named "<name> (copy 2)", "<name> (copy 3)" and so on.
- **Very long name.** Names are limited to 80 characters; the user is told when they reach the limit.
- **Emptying a verse.** Clearing all text in a verse that still has segments or groupings keeps the verse, because the boundaries and groupings are the user's work. Removing all of them as well leaves nothing stored for that verse. A translation whose verses are all empty is kept with its name until the user deletes it, because the user named it; only the untouched default of a chapter with no translations is never stored.
- **Corpus unavailable.** If the chapter's text is not available (spec 002), Translate cannot be turned on for it and any saved translation stays untouched until the text returns.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The reading screen MUST offer a Translate control that shows or hides a translation box under every verse of the chapter, showing the active translation.
- **FR-002**: The Translate on/off choice MUST be remembered with the reader's display settings across reloads and visits (spec 002).
- **FR-003**: Each verse box MUST hold, per segment, a translation field and a notes field, and the user MUST be able to write and edit both.
- **FR-004**: The system MUST NOT fill any field with text the user did not type: not from the English line (spec 012), word glosses, lexicon entries (spec 013) or any other source. Nothing may suggest a rendering, a split point or a phrase grouping.
- **FR-005**: Split points MUST be offered at every boundary between adjacent words of a verse and only there, presented alike so none is singled out.
- **FR-006**: A verse with one segment MUST be labelled with its verse number; a verse with several MUST label them with the verse number and letters in reading order (21a, 21b, ...), continuing with double letters after z.
- **FR-007**: The user MUST be able to merge any two adjacent segments. When both hold text in the same field, the app MUST ask for confirmation and MUST keep both texts, the first segment's before the second's.
- **FR-008**: The system MUST NOT split a verse inside a phrase grouping and MUST say why when the user tries.
- **FR-009**: The user MUST be able to group a contiguous run of two or more words within one segment, by dragging, by selecting one word and shift-selecting another, by keyboard alone and by tapping alone.
- **FR-010**: Phrase groupings MUST either nest or be separate; the system MUST refuse a partial overlap, an exact duplicate, or a grouping that crosses a segment or verse boundary, and MUST say why.
- **FR-011**: Each phrase grouping MUST show a mark before its first word and after its last word in the Greek line, and an entry in the verse box with the grouped Greek, a rendering field and a note field.
- **FR-012**: The user MUST be able to move from a grouping's mark to its entry and back, and to delete a grouping without affecting its words or other groupings.
- **FR-013**: Edits MUST appear immediately without waiting for the server, and an automatic background save MUST be initiated about one second after the user stops editing, with no save control. Completion timing follows SC-003; the work MUST NOT be reported as saved before success.
- **FR-014**: The user MUST be able to see whether their translation work is saved, saving or not saved.
- **FR-015**: Save failures, permanent refusals, conflicts between tabs and leaving with unsaved changes MUST be handled as in spec 005 (FR-009 to FR-013 there), and the user's changes MUST never be lost silently. Pending and failed work MUST remain reachable after navigation anywhere within the app, including Back/Forward; a browser leave warning alone is insufficient for those transitions.
- **FR-016**: Every saved translation MUST be checked by the same validation used by the editor before it is stored; the server MUST refuse a translation whose boundaries or groupings break FR-005 or FR-010, refer to a word id not in the corpus, or exceed the size limit, leaving the stored copy unchanged.
- **FR-017**: Segment boundaries and phrase groupings MUST be stored by MACULA word identifier, never by a word's position in a verse or chapter.
- **FR-018**: A verse with no translation text, no notes, no extra segments and no phrase groupings MUST leave nothing stored.
- **FR-019**: A translation MUST be its own kind of saved work, distinct from analyses and diagrams, and MUST NOT be stored as, converted into, or read as propositions of a discourse analysis.
- **FR-020**: The saved work list MUST show each stored translation as its own entry with its name as title, passage, kind and last-modified time, and the user MUST be able to open it (with that translation active), delete it (with confirmation) and export it.
- **FR-021**: The export file MUST cover one translation, name it, its passage and edition, and hold that translation exactly as stored, with the Greek of each segment and grouping also written out.
- **FR-022**: If a rebuilt corpus no longer contains a word that a boundary or grouping refers to, the system MUST keep the stored translation unchanged, show the user which boundary or grouping no longer matches, and let them remove or redo it. When only Greek spelling or punctuation changes with the same word identifiers in the same order, the next accepted edit save MUST refresh the reference Greek without changing user content or structure; reads and exports MUST leave the stored record unchanged.
- **FR-023**: Every action in this feature MUST be operable with the keyboard alone with visible focus, MUST be announced meaningfully to a screen reader (segment labels, the start and end of each grouping, refusals and save status), and MUST be operable by touch alone without dragging, hovering or multi-finger gestures.
- **FR-024**: Segment boundaries, pending selections and phrase-grouping marks MUST each be shown by a shape or glyph as well as colour (the Two-Cue Rule), using only theme tokens, in the light, dark and sepia themes.
- **FR-025**: Once accounts exist (spec 015), translations, and the last-used translation of each chapter, MUST belong to the signed-in account and MUST NOT be shown to any other account; until then they belong to the single local user.
- **FR-026**: A user MUST be able to keep several named translations of the same chapter. Segment boundaries, segments, phrase groupings, renderings and notes MUST belong to one translation, never to the chapter, and changing one translation MUST NOT change any other.
- **FR-027**: The reading screen MUST offer a translation picker, shown while Translate is on, that names the active translation and lets the user switch to any other translation of the chapter, create a new one, rename, duplicate and delete one.
- **FR-028**: A new translation MUST start with every verse empty. Duplicating MUST copy only the user's own chosen translation, exactly, into a new independent translation; no other source may be copied.
- **FR-029**: Translation names MUST be non-empty after trimming spaces at either end, at most 80 characters, and unique within a chapter ignoring letter case. A refused name MUST be explained and the old name kept.
- **FR-030**: A new translation MUST get the default name "Translation N" with the lowest unused N in that chapter; a duplicate MUST get "<name> (copy)", numbered "(copy 2)", "(copy 3)" and so on when taken.
- **FR-031**: When the user opens a chapter with Translate on, the translation last used in that chapter MUST be active; if it no longer exists, the most recently modified one; if the chapter has none, an empty, unsaved translation with the default name.
- **FR-032**: A translation MUST be stored once the user types any content in it, or creates, renames or duplicates it, and MUST then stay stored, even if all its verses are emptied, until the user deletes it. An untouched default translation MUST NOT be stored or listed.
- **FR-033**: Deleting a translation MUST require confirmation and MUST remove only that translation.
- **FR-034**: Switching translation MUST first send the active translation's pending changes to it and MUST NOT apply them to the newly chosen translation.
- **FR-035**: The translation picker and its create, rename, duplicate and delete actions MUST be operable by keyboard alone with visible focus and Escape to close, MUST announce to a screen reader its purpose, the active translation's name and the number of translations, and MUST be operable by tapping alone with touch targets that meet WCAG 2.2 AA.

### Key Entities

- **Translation**: One named translation of one chapter of one edition, owned by the single local user, or by the signed-in account once spec 015 exists; one saved-work record with a name unique within the chapter, a passage, a kind of "translation", a revision for conflict checks and a last-modified time. Holds verse translations. A chapter may have any number of translations.
- **Last-used translation**: For each chapter, which of the user's translations was active most recently, so it opens by default.
- **Verse translation**: The work on one verse within one translation: its segment boundaries, segments and phrase groupings. Exists only when non-empty.
- **Segment boundary**: A split after a given word, recorded by that word's MACULA id. Never after the verse's last word.
- **Segment**: A contiguous run of a verse's words between boundaries, with a derived label (21, 21a, ...), a translation and notes. Its label is computed from order, never stored as the identity.
- **Phrase grouping**: A contiguous run of two or more words within one segment, recorded by its first and last MACULA word ids, with the user's rendering and a note. Groupings nest or are separate.
- **Translation export file**: A download of one translation with its name, passage, edition, document version, the stored content and the Greek of each segment and grouping.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A typed character appears in the translation field within 100 milliseconds, even when the server takes ten seconds to answer.
- **SC-002**: In 100% of tested reloads, browser changes and server restarts, a chapter's translations, notes, segments and groupings reopen identical to what was saved.
- **SC-003**: Work is saved within three seconds of the user stopping typing under healthy local conditions: every required save request commits and acknowledges within one second, with no failures or conflicts. The ten-second delayed-server scenario in SC-001 is exempt from this durability deadline; immediate editing, accurate save status and no-loss recovery still apply.
- **SC-004**: In every tested failure (unreachable server, conflict, each permanent refusal), the user's unsaved text is still on screen and can be downloaded.
- **SC-005**: After a corpus rebuild that keeps the same word ids, 100% of segment boundaries and groupings sit on the same words as before.
- **SC-006**: In 100% of new verse boxes, every field is empty until the user types in it.
- **SC-007**: A keyboard-only user and a touch-only user can each split a verse, merge two segments and make a phrase grouping without help, every step reachable, in under one minute per task.
- **SC-008**: Every tested partial-overlap, cross-boundary or split-inside-grouping attempt is refused with a message, and the stored copy is unchanged.
- **SC-009**: Every screen in this feature passes automated accessibility checks at WCAG 2.2 AA in the light, dark and sepia themes.
- **SC-010**: Clearing a verse entirely leaves no stored data for it in 100% of tests.
- **SC-011**: With two translations of one chapter, in 100% of tests an edit, split or grouping made in one leaves the other byte-for-byte unchanged, including a duplicate and its original.
- **SC-012**: In 100% of tested returns to a chapter, the translation last used there is the one that opens.
- **SC-013**: A keyboard-only, a screen-reader and a touch-only user can each switch to another translation, and create, rename, duplicate and delete one, without help, each in under 30 seconds.
- **SC-014**: In 100% of new translations, every field is empty until the user types in it, and no duplicate name within a chapter is ever stored.

## Assumptions

- **"Phrase grouping", not "bracket".** The prototype called these marks brackets. In this product "bracket" names the bracket rendering of a discourse analysis (arcing/bracketing), so reusing the word would suggest these marks are part of an analysis or that they feed one. They are not, so this spec uses "phrase grouping". Their mark is designed from `DESIGN.md` and must look different from the bracket view of an analysis.
- **Not the arcing editor.** Segments are not propositions and phrase groupings are not connections. Translations are a separate kind of saved work (constitution III) and nothing moves between them and an analysis. Spec 007 keeps per-proposition notes and translations out of scope; this is reader-level work.
- **Several named translations per chapter (user decision, 2026-11-16).** Each translation is one saved-work record covering one chapter, listed and exported on its own. Duplicating is allowed because it copies only the user's own work, never outside text (constitution I).
- **Last-used is kept with saved work.** Which translation was last used in each chapter is stored with the user's saved work, not only in the browser, so it follows them to another browser on the same computer.
- **Groupings stay inside a segment.** Phrases that run across verses are rare enough to leave out; this keeps every grouping attached to one segment's box.
- **Field length.** Each translation, notes and rendering field has a generous stated limit (at least 20,000 characters for notes); the exact values are set in planning, as the size limit is in spec 005.
- **Constitution.** Principle V (constitution v1.1.0 or later) names translations and notes explicitly as saved work that must be kept, validated by the shared module for its kind and exportable, so this feature needs no amendment.
- **Reuse of saved work.** The autosave loop, conflict handling, refusal reasons, list, delete and export of spec 005 are reused; this spec adds the "translation" kind and its validation rules to the shared validation module.
- **Translate in learning mode.** Spec 010 hides the English line in learning mode. Whether the translation boxes show during parsing practice is still for spec 010 to decide; this spec requires them on the reading screen only.
- **Dependencies on sibling specs.** Spec 012 (English line) may show the BSB under the Greek alongside the boxes, as reference only; nothing is copied from it (constitution I). Spec 015 (accounts and sign-in) makes translations belong to the signed-in account (FR-025); until it lands the app is single-user and local (constitution VII). Specs 013 (richer word details) and 014 (stepping through occurrences) share the reading screen but this feature depends on neither. Spec 010 (learning mode) shares the reading screen; see above.
- **Out of scope.** Chapter-level notes, sharing or publishing translations, importing an exported file, comparing translations, printing layouts, and Hebrew.
