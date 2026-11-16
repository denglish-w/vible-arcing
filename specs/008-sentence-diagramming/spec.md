# Feature Specification: Sentence Diagramming

**Feature Branch**: `008-sentence-diagramming`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "An editor where the user builds Reed–Kellogg-style sentence diagrams, adapted for Greek, from the words of a passage, with selection followed across views, undo/redo, autosave and export."

## Context and Constraints

- The notation is defined in `docs/reference/diagramming-notation.md`. This spec decides how the user builds diagrams in that notation; it does not redefine the notation. Where this spec settles one of that document's open decisions, it says so in Assumptions.
- A diagram is **grammatical analysis**: words linked by syntactic role within a sentence. It is a separate kind of saved work from a discourse analysis (propositions linked by logical relationships). The two share only the passage and the word ids they refer to. Nothing in a diagram is stored as, derived from, or converted into a discourse analysis, or the reverse (constitution III).
- **The user places every word.** The app never draws a diagram, never pre-places a word, never offers a default slot for a word, and never shows or uses MACULA sentence-role labels or syntax trees, including to order, filter or highlight anything. The help it gives about a word is limited to facts: surface form, lemma, gloss and morphology (constitution I).
- Saving, conflict handling, listing and corpus-rebuild isolation follow `openspec/specs/app/saved-work/spec.md`. Word facts match the reader's word detail in `openspec/specs/text/greek-reader/spec.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Diagram a simple clause and keep it (Priority: P1)

A seminary student opens a passage (for example Philippians 1:15) in diagramming, starts a new diagram, and adds a baseline. Reading each word's facts (lemma, gloss, case, person and so on), they put τινὲς in the subject slot, κηρύσσουσιν in the verb slot and Χριστὸν in the object slot, with the subject divider and object divider drawn between them. The words they placed fade in the passage card under the canvas; the rest stay unplaced. They close the browser, come back the next day, reopen the diagram from their saved work and find it exactly as they left it.

**Why this priority**: This is the smallest slice that delivers the core value: the user's own diagram of a clause, in the notation, kept between sessions. Every later construct hangs off a baseline, so nothing else is usable without it.

**Independent Test**: Create a diagram for one verse, build a single baseline with subject, verb and object (and, separately, a linking verb with a complement), using only the keyboard, then only touch, then only a pointer. Reload and reopen: the diagram is identical.

**Acceptance Scenarios**:

1. **Given** a chapter whose text is available, **When** the user chooses a verse range and starts a new diagram, **Then** an empty canvas opens with the passage's words in Greek order in the passage card, every word unplaced and nothing drawn.
2. **Given** an empty diagram, **When** the user adds a baseline, **Then** a baseline with an empty subject slot and an empty verb slot appears, and no word is put on it.
3. **Given** a baseline, **When** the user selects an unplaced word and then chooses the subject slot (or verb, object or complement slot), **Then** the word appears in that slot in its Greek form and fades in the passage card.
4. **Given** a baseline with a verb, **When** the user adds an object, **Then** an object divider that stops at the baseline separates verb and object; **When** the user instead adds a complement, **Then** a slanted complement divider separates them.
5. **Given** a placed or unplaced word, **When** the user asks for its details, **Then** form, lemma, gloss, part of speech and applicable morphology are shown, and no syntactic role or interpretive label is shown.
6. **Given** a diagram with placed words, **When** the user reloads the page or reopens it later from the saved-work list, **Then** the diagram is shown exactly as last edited, listed with kind "diagram", its title, passage and last-modified time.
7. **Given** a finite verb with no explicit subject in the clause, **When** the user marks the subject slot as implied, **Then** the slot shows a mark that is clearly not a Greek word and is announced as an implied subject.

---

### User Story 2 - Hang modifiers and phrases (Priority: P2)

A pastor adds the article τὸν on a modifier line under Χριστὸν, a negative under the verb it negates, a prepositional phrase (διὰ φθόνον) on a phrase line under the verb with the preposition on the slant and its object on the foot, a genitive under the noun it modifies, a dative of indirect object on a modifier line with a short foot, an adverbial case word under the verb, a vocative on its own line above the clause, and an attributive or adverbial participle on a bent modifier line with its own objects and modifiers attached to it.

**Why this priority**: Almost every real Greek clause has articles, prepositional phrases or genitives. Without modifiers a user can diagram only bare cores.

**Independent Test**: On one baseline, attach each modifier type listed above to a chosen word, including a modifier of a modifier, and confirm each is drawn as the notation defines and announced correctly by a screen reader.

**Acceptance Scenarios**:

1. **Given** a placed word, **When** the user adds a modifier line under it and places a word on that line, **Then** a slanted line hangs below the chosen word carrying the modifier.
2. **Given** a placed word, **When** the user adds a phrase line under it, places a preposition on the slant and its object on the foot, **Then** the phrase is drawn as a slant with a horizontal foot, and the object can carry its own modifiers.
3. **Given** a placed verb, **When** the user adds an indirect-object line, **Then** a modifier line with a short horizontal foot and no preposition hangs under the verb.
4. **Given** a clause, **When** the user places a vocative, **Then** it sits on its own short line above the clause with no line joining it to the clause.
5. **Given** a placed noun or verb, **When** the user adds a bent modifier line and places a participle on the bend, **Then** the participle's own objects and modifiers can be attached to its horizontal part.
6. **Given** a modifier, **When** the user hangs another modifier under it, **Then** modifiers nest to any depth and each stays attached to its head.

---

### User Story 3 - Correct mistakes with undo, redo, move and remove (Priority: P2)

While working, a lay student puts a word in the wrong slot, moves it, removes a whole modifier line, then changes their mind and undoes several steps, and redoes one.

**Why this priority**: Diagramming is trial and error. Without dependable correction, users lose work or avoid experimenting.

**Independent Test**: Make a sequence of edits of every kind (add, place, move, remove, delete element), undo them all to the empty diagram, redo them all, and compare each intermediate state.

**Acceptance Scenarios**:

1. **Given** a placed word, **When** the user moves it to another slot or line, **Then** it leaves its old place and appears in the new one, as one undoable step.
2. **Given** a placed word, **When** the user removes it, **Then** it returns to unplaced in the passage card and its old slot is empty.
3. **Given** a line element carrying words and attached elements, **When** the user deletes it, **Then** the element and everything attached to it are removed, every word on them returns to unplaced, and the user is told how many words were returned.
4. **Given** a series of edits, **When** the user undoes, **Then** the diagram returns to each earlier state in reverse order; **When** the user redoes, **Then** the undone edits are reapplied in order.
5. **Given** the user has undone some edits, **When** they make a new edit, **Then** the undone edits can no longer be redone.

---

### User Story 4 - Compound parts and multiple clauses (Priority: P3)

A student diagrams a sentence with a compound object joined by καί, an adverbial ἵνα clause under the main verb, a relative clause tied back to its antecedent, coordinate clauses joined by δέ, a discourse particle such as γάρ on the connector between clauses, and a genitive absolute on its own small baseline.

**Why this priority**: Paul's sentences are long. Compounds and clause links are needed to diagram most of Philippians 1, but simple and modified clauses (P1, P2) are useful first.

**Independent Test**: Diagram a passage containing each construct above and check each against the notation document.

**Acceptance Scenarios**:

1. **Given** a filled slot, **When** the user makes it compound, **Then** a fork splits it into parallel branches, each branch takes its own words, and a dashed connector between branches can carry the joining word.
2. **Given** two baselines, **When** the user joins them as coordinate clauses, **Then** a dashed connector joins them and can carry the conjunction or particle.
3. **Given** a main clause and a second baseline, **When** the user makes the second an adverbial clause of a chosen word, **Then** it sits below and a dashed connector from that word carries the introducing conjunction.
4. **Given** a relative clause baseline, **When** the user links its relative pronoun to an antecedent, **Then** a dashed connector joins the pronoun to the antecedent.
5. **Given** a genitive absolute, **When** the user builds it, **Then** it has its own small baseline with participle and genitive subject, joined to the main verb by a dashed connector.

---

### User Story 5 - Stilts for clauses, infinitives and substantives (Priority: P3)

A student puts a ὅτι noun clause in the object slot on a stilt with ὅτι on the post, a complementary infinitive after θέλω on a stilt in the object slot, a substantival participle on a stilt in the subject slot, an articular construction such as τὰ ἄνω on a stilt with the article on a modifier line, an accusative subject of an infinitive on the stilt's own small baseline, and a purpose infinitive on a phrase line under the verb with εἰς τό on the slant.

**Why this priority**: Stilts are needed for Greek's frequent infinitives, participles and content clauses, but only once baselines, modifiers and clauses exist.

**Independent Test**: Fill subject, object and complement slots with stilts of each kind and check nesting (a stilt inside a clause on a stilt) to at least three levels.

**Acceptance Scenarios**:

1. **Given** an empty slot, **When** the user puts a stilt in it, **Then** a post with a raised line stands in the slot, and the raised line takes a whole clause or phrase with its own slots.
2. **Given** a stilt holding a noun clause, **When** the user places the conjunction, **Then** it sits on the stilt's post.
3. **Given** a stilt, **When** the user puts another stilt inside its clause, **Then** stilts nest and each can be edited independently.

---

### User Story 6 - Export a diagram (Priority: P3)

A student downloads their diagram to submit with an assignment and to keep a copy outside the app.

**Why this priority**: The constitution requires that users can export their work. It is a smaller slice than building constructs, but must exist before the feature is complete.

**Independent Test**: Export a saved diagram and confirm the file names the passage, edition and document version and holds the diagram exactly as saved.

**Acceptance Scenarios**:

1. **Given** a saved diagram, **When** the user exports it, **Then** a file is downloaded that names the passage, edition and document version, and holds the diagram's content exactly as stored, including unplaced-word status and implied marks.
2. **Given** a save that cannot succeed, **When** the app offers a download, **Then** the downloaded file holds the user's unsaved diagram in the same format.
3. **Given** a diagram, **When** the user exports it, **Then** [NEEDS CLARIFICATION: Besides the data file, must export also produce a picture or printable page of the drawn diagram (for handing in or printing), and if so in which forms?]

---

### User Story 7 - Follow a word across reader, diagram and arcing (Priority: P4)

A pastor taps ἐλπίδα in the reader, switches to diagramming and finds the same word selected: highlighted on the canvas if placed, highlighted in the passage card if not. They select a word on the canvas, switch back to the reader and the same word is selected there. When the arcing view exists, it shows the same selection.

**Why this priority**: "One study desk" is the product's position, but users can diagram without it.

**Independent Test**: Select a word in one view, switch views in each direction, and confirm the same word (by id) is selected and in view, with focus on it for keyboard and screen-reader users.

**Acceptance Scenarios**:

1. **Given** a word selected in the reader, **When** the user opens a diagram covering that word, **Then** the word is selected, scrolled into view and announced, on the canvas if placed and in the passage card if unplaced.
2. **Given** a word selected in the diagram, **When** the user switches to the reader or the arcing view, **Then** that word is selected there.
3. **Given** a selected word outside the diagram's passage, **When** the user opens the diagram, **Then** no word is selected and the user is told the word is outside this diagram.
4. **Given** a word placed on the canvas, **When** the user selects it in the passage card, **Then** its place on the canvas is selected and shown, and the reverse.

---

### Edge Cases

- **Words left unplaced**: a diagram with any number of unplaced words, including none placed, is valid and saves normally. Unplaced words stay in the passage card at full strength, and the user can see and hear how many remain. Leaving a word unplaced is never treated as an error or blocked.
- **The same word placed twice**: a word id holds at most one place in a diagram. Choosing a new place for a placed word moves it there (one undoable step) and says it was moved. A saved diagram with one word id in two places is invalid and refused.
- **Greek word order differs from diagram order**: words are placed by function, so the canvas reorders the sentence. The passage card always keeps Greek order, and a screen-reader user can read the passage in Greek order with each word's placed or unplaced status and where it is placed.
- **Implied and elided words**: an implied subject is shown by an implied mark in the slot, never by a word taken from the text. Whether the user may add other words that are not in the text (an elided verb in a compound clause, a word the reader must supply) is open: see FR-014. Until settled, nothing that is not a word of the passage can be placed except the implied mark.
- **A word the diagram needs from outside the passage**: the user can only place words inside the diagram's passage. To include more, they widen the passage; words in the new range arrive unplaced and existing placements are untouched. Narrowing the passage is refused while a placed word would fall outside it, and the user is told which words.
- **Re-ingest and word-id stability**: placements are stored by MACULA word id, so a re-ingest that keeps ids keeps the diagram intact. If a stored word id no longer exists, the diagram still opens, the missing word's place is shown as a marked gap with its last known form, the user is told, and nothing is silently dropped. The diagram cannot be saved until the user removes the missing word (one action per gap or for all); they can download it meanwhile. Words newly present in the passage range appear unplaced.
- **Invalid diagrams**: a diagram is invalid if it refers to a word outside its passage or not in the corpus, places a word twice, attaches an element to something that does not exist, puts two words in a single-word slot, forms a loop (an element attached under itself), or names an unknown document version. The editor prevents these edits; any that arrive by another route (a stale tab, a hand-edited file) are refused on save with a plain reason, and the user's copy is kept.
- **Empty baseline and empty elements**: a baseline, line or stilt with no words is allowed while the user works and is saved as is.
- **Same passage diagrammed twice**: a user may keep several diagrams of the same passage; each is a separate record.
- **Unavailable text**: if the passage's chapter is not ingested or the corpus cannot be read, diagramming says the text is not available and does not offer to start a diagram there; existing diagrams over it still list and export.
- **Very long passage**: a diagram over a whole chapter remains editable without noticeable delay (SC-006).
- **Conflicting edits in two tabs**: handled as in saved work: no silent overwrite; overwrite, save as copy, or download.

## Requirements *(mandatory)*

### Functional Requirements

**Creating and opening diagrams**

- **FR-001**: Users MUST be able to start a new diagram by choosing a book, chapter and contiguous verse range, and give it a title (defaulting to the passage reference).
- **FR-002**: A new diagram MUST open with nothing drawn and every word of the passage unplaced, shown in Greek order in a passage card beside or below the canvas.
- **FR-003**: Users MUST be able to reopen any saved diagram from the saved-work list and continue where they left off.
- **FR-004**: A diagram MUST cover one passage and MAY hold any number of baselines (clauses and sentences) on one canvas.

**Building in the notation**

- **FR-005**: Users MUST be able to add, place words in, and remove every element the notation defines: baseline, subject divider, object divider, complement divider, modifier line, phrase line, indirect-object line, bent modifier line, vocative line, stilt, dashed connector carrying a word, and fork with parallel branches.
- **FR-006**: Each element MUST be drawn as `docs/reference/diagramming-notation.md` defines, and each line type MUST be distinguishable by shape or line style (solid, dashed, slanted, bent, post), never by colour alone.
- **FR-007**: Users MUST be able to attach modifiers, phrases, stilts, forks and clauses to any placed word or element, nested to any depth.
- **FR-008**: Users MUST be able to place a passage word in any open slot or line, move a placed word to another place, and remove a placed word, which returns it to unplaced.
- **FR-009**: Deleting an element MUST remove everything attached to it and return all of their words to unplaced, telling the user how many words were returned.
- **FR-010**: Each word id MUST occupy at most one place in a diagram. Placing an already placed word MUST move it.
- **FR-011**: Users MUST be able to arrange where whole clauses (baselines and what hangs from them) sit on the canvas; the app positions lines within a clause from the structure the user built, and that positioning MUST NOT change which word is attached to what.
- **FR-012**: Users MUST be able to give the canvas more room, and to zoom and pan it, without changing the diagram.

**No interpretation**

- **FR-013**: The app MUST NOT draw any element, place or pre-place any word, propose a slot, order or highlight words by grammatical role, or validate a placement against grammar. The only placement checks are structural (FR-030).
- **FR-014**: Users MUST be able to mark a subject slot as implied, shown with a mark that is not a Greek word and announced as "implied subject". [NEEDS CLARIFICATION: May the user also add words that are not in the passage (an elided verb repeated in a compound clause, a word the reader must supply, an English gloss under a placed word)? If so, they must be visibly and audibly distinct from passage words and excluded from word-id rules.]
- **FR-015**: Word help in the diagramming view MUST show the same facts as the reader's word detail (surface form, lemma, gloss, part of speech, applicable morphology) and MUST NOT show any syntactic role, constituent label, clause boundary or other source analysis.
- **FR-016**: MACULA sentence-role labels and syntax trees MUST NOT be shown in the diagramming view, used to place, order, group, filter or highlight words, or used to judge a diagram.

**Passage card and word order**

- **FR-017**: The passage card MUST keep Greek word order and show each word's status: placed words faded, unplaced words at full strength, the selected word highlighted, each state carried by more than colour.
- **FR-018**: Users MUST be able to see how many words remain unplaced and step through them in Greek order.

**Correcting**

- **FR-019**: Every change to a diagram's content (adding, placing, moving, removing, deleting, marking implied, joining, rearranging clauses, retitling) MUST be undoable and redoable, step by step, for at least the last 100 changes in the session.
- **FR-020**: Undo and redo MUST restore exactly the earlier content, including placed and unplaced status and the passage card.

**Selection across views**

- **FR-021**: The selected word MUST be shared by word id between the reader, the diagram and (when it exists) the arcing view: switching views keeps it selected and in view.
- **FR-022**: Selecting a placed word in the passage card MUST select and reveal it on the canvas, and the reverse.
- **FR-023**: When the shared selected word is not in the diagram's passage, the diagram MUST say so and select nothing.

**Saving and resuming**

- **FR-024**: Edits MUST apply in the editor at once and save automatically in the background, with no separate save action, following the saved-work rules for failures, retries, conflicts and leaving with unsaved changes.
- **FR-025**: A diagram MUST be saved as a diagram record, distinct from any discourse analysis, holding its title, passage, text edition, document version and content. It MUST NOT be stored as, derived from or converted into a discourse analysis, or the reverse.
- **FR-026**: A diagram MUST refer to every word by its MACULA word id and never by position.
- **FR-027**: Reopening a diagram MUST restore its content exactly, and SHOULD restore the canvas view (zoom and position) the user last had.
- **FR-028**: When a stored word id no longer exists in the corpus, the diagram MUST still open, show the gap with the word's last known form, tell the user, and block saving until the user removes the missing words, while still allowing download.
- **FR-029**: Users MUST be able to widen a diagram's passage; new words arrive unplaced. Narrowing MUST be refused while a placed word would fall outside, naming those words.

**Validation**

- **FR-030**: A diagram MUST be checked by the same validation rules in the editor, on save and for any other incoming route. A valid diagram has: every word id in its passage and in the corpus; each word id in at most one place; every element attached to something that exists; no loops; at most one word in a single-word slot; a known document version.
- **FR-031**: Unplaced words, empty elements and incomplete clauses MUST NOT make a diagram invalid.
- **FR-032**: An invalid diagram MUST be refused with a plain reason, without changing the stored copy or discarding the user's copy.

**Export**

- **FR-033**: Users MUST be able to export any diagram as a file naming its passage, edition and document version and holding its content exactly as stored. The same file MUST be what is offered when a save cannot succeed.

**Accessibility and device support**

- **FR-034**: Every action in this feature MUST be possible with the keyboard alone, with visible focus, without requiring a pointer, and without key combinations that conflict with screen-reader or browser defaults.
- **FR-035**: Every action MUST be possible by touch alone on a tablet. Any action done by dragging MUST also be possible by tapping (select, then choose a target). Touch and pointer targets MUST meet the WCAG 2.2 AA minimum size.
- **FR-036**: The diagram MUST be available to screen readers as a navigable structure (clauses, then their slots, then what hangs from each word), with each element announced by its kind, its words and what it is attached to. Changes (placed, moved, removed, undone) MUST be announced.
- **FR-037**: The diagramming view MUST meet WCAG 2.2 AA in light, dark and sepia themes, including contrast of lines, words, selection and focus against the canvas.
- **FR-038**: Selection, placed or unplaced status, missing words, implied marks and line types MUST each be shown by at least two cues, never colour alone.
- **FR-039**: The view MUST follow `DESIGN.md` (canvas, passage card, tool buttons, palette, tokens, serif type) and use tool names and help text written for this product.

### Key Entities

- **Diagram**: a user's grammatical diagram of one passage. Has a title, the passage (as a range of word ids), the text edition, a document version, the clauses on its canvas, and last-modified time. A kind of saved work separate from a discourse analysis.
- **Clause (baseline)**: one baseline with its subject, verb and optional object or complement slots, its position on the canvas, and what hangs from it. May be the main clause, or joined to another clause or word by a connector, or stand on a stilt.
- **Slot**: a place on a line that holds at most one word, an implied mark, a fork, or a stilt.
- **Line element**: a modifier, phrase, indirect-object, bent modifier, vocative, connector, fork or stilt, attached to exactly one word or element (vocative to the clause), carrying its own slots.
- **Placement**: one passage word id put in one slot. A word id has zero or one placement.
- **Implied mark**: a marker in a subject slot standing for a subject carried by the verb ending; not a word.
- **Shared selection**: the one word id currently selected across the reader, diagram and arcing views.
- **Word facts**: read-only form, lemma, gloss, part of speech and morphology for a word id, from the corpus.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user new to the app can create a diagram of a one-verse passage, build a baseline with subject, verb and object and see it kept after reopening, in under 5 minutes, using keyboard only, touch only, or pointer only.
- **SC-002**: 100% of the actions in FR-005 to FR-033 can be completed with keyboard alone and with touch alone, verified by a scripted walkthrough of each.
- **SC-003**: Automated accessibility checks report zero WCAG 2.2 AA violations on the diagramming view in all three themes, and a screen-reader user can identify every element of a test diagram (kind, words, attachment) in a moderated test.
- **SC-004**: Zero diagrams lose content across 100 cycles of edit, reload and reopen, server restart and corpus rebuild in testing.
- **SC-005**: Undoing every step of a 100-step editing session returns the empty starting diagram, and redoing returns the final diagram, identical in both directions.
- **SC-006**: Every edit appears on screen within 100 milliseconds of the user's action, for a diagram covering a whole chapter.
- **SC-007**: An audit of the diagramming view, its word help, announcements and export finds zero syntactic-role labels and zero automatically placed or suggested words.
- **SC-008**: Switching between reader and diagram keeps the same selected word in 100% of trials, with it in view.
- **SC-009**: Every invalid case listed under Edge Cases is refused on save with a reason, and the user's copy is kept, in 100% of tests.
- **SC-010**: A user can diagram every construct in `docs/reference/diagramming-notation.md` from Philippians 1, checked construct by construct against that document.

## Assumptions

- One diagram covers one user-chosen contiguous passage on one canvas, which may hold several sentences. This settles the notation's open "one canvas or one diagram per sentence" question in favour of one canvas per passage, matching saved work's "a diagram's passage range".
- The implied subject is shown as a non-word mark in the slot (settling that open notation question in principle; the exact glyph is a design detail). Adverbial participles get no mark beyond where they attach. Textual variants are out of scope: diagrams use the SBLGNT text as ingested.
- The user decides structure (what attaches to what, in which slot); the app computes line geometry within a clause from that structure. This is drawing the user's own decisions, not interpretation, and it is what makes keyboard and screen-reader editing workable.
- Undo history lasts for the editing session and need not survive a reload; the diagram content always does.
- The whole New Testament is ingested (spec 009); testing uses Philippians 1, and the feature works for any chapter.
- The arcing view does not exist yet. FR-021 applies to it when it is built; until then the shared selection covers the reader and the diagram.
- Importing a diagram file back into the app is out of scope for this feature; the validation in FR-030 is written so an import can reuse it later.
- The single-user, local-only limits of saved work apply unchanged; this feature adds no accounts or sharing.
- Depends on: the corpus store (word ids and word facts), saved work (diagram records, autosave, conflicts, listing), the passage picker, and the reader's word-detail facts.
