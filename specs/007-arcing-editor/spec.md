# Feature Specification: Arcing Editor

**Feature Branch**: `007-arcing-editor`

**Created**: 2026-11-05

**Status**: Draft

**Input**: User description: "An editor where the user divides a Greek passage into propositions and connects them with logical relationships, shown as arcs or as brackets over one shared analysis."

## Context and Scope

This feature is the editor in which a user traces the argument of a Greek New Testament passage. The user divides the passage into propositions, connects adjacent propositions (and groups of them) with logical relationships, and sees the result either as arcs or as brackets. The method and its relationships are those of Daniel Fuller, John Piper and Thomas Schreiner, and the editor credits them.

The editor builds on, and does not re-specify:

- the proposition model and relationship taxonomy in the open OpenSpec change `openspec/changes/discourse-analysis-foundation/` (`discourse/proposition-model`, `discourse/relationship-taxonomy`): what a proposition, connection, Bilateral connection, direction of support and complete analysis are, and which structures are valid;
- saved work in `openspec/specs/app/saved-work/spec.md`: durable storage, autosave, conflicts, size limits, listing, deleting and the file export of a stored analysis;
- the reader in `openspec/specs/text/greek-reader/spec.md`: chapter text, word detail and display settings.

Where this spec and those OpenSpec specs disagree, the OpenSpec specs win and this spec is corrected.

Three rules apply to every story below, and breaking any of them is a defect:

1. **The user interprets.** The editor never divides the passage, never connects propositions, and never suggests, preselects, orders by likelihood or otherwise ranks a relationship. The Greek conjunction reference opens only when the user asks for it and fills in nothing.
2. **One analysis, two renderings.** Arcs and brackets are two views of the same analysis. Choosing a view never changes the analysis, and every editing action is available in both.
3. **Every way of working.** Every action can be done with a keyboard alone, with a screen reader, and by touch alone on a tablet, and the editor meets WCAG 2.2 AA in every theme. Colour never carries meaning on its own.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Divide a passage and connect it as arcs (Priority: P1)

A seminary student opens Philippians 1:3–11 in arcing mode. The passage appears as continuous Greek text with no divisions. She marks where each proposition ends, so the passage becomes a numbered list of propositions in reading order. She selects two adjacent propositions, chooses Ground from the relationship list, and an arc appears joining them with the label and a mark showing which proposition supports the other. She closes the browser and returns the next day; the analysis is in her saved work and opens exactly as she left it.

**Why this priority**: Dividing, connecting and seeing arcs, with the work kept, is the smallest slice that lets a user do real arcing. Every later story refines it.

**Independent Test**: Start a new analysis of a passage, divide it into at least four propositions, connect two pairs with different relationships, reload the app, and reopen the analysis from saved work. Repeat the whole task once with a keyboard only and once by touch only on a tablet.

**Acceptance Scenarios**:

1. **Given** a user starts a new analysis of a passage, **When** the editor opens, **Then** the passage's Greek text is shown in reading order with no proposition divisions, no connections and no relationships.
2. **Given** an undivided passage, **When** the user places a division after a word, **Then** the text before and after that point become separate propositions, each showing its Greek text verbatim, in reading order.
3. **Given** two adjacent propositions, **When** the user merges them, **Then** one proposition replaces them, covering both spans.
4. **Given** two adjacent propositions are selected, **When** the user asks to connect them, **Then** the relationship list opens with nothing selected, grouped by category, in the same fixed order every time, and the connection is created only once the user picks a relationship.
5. **Given** the user picks Ground for two propositions, **When** the arc is drawn, **Then** it spans exactly those propositions, shows the relationship's name or abbreviation as text, and marks the supporting proposition with a cue that is not colour alone.
6. **Given** a user has made edits, **When** they reload the page or come back later, **Then** the analysis appears in their saved work and reopens with the same propositions and connections, without the user ever pressing a save control.
7. **Given** a keyboard-only user, **When** they divide, merge, select and connect propositions, **Then** every step is reachable and operable from the keyboard with a visible focus indicator.
8. **Given** a tablet user with no mouse or keyboard, **When** they divide, merge, select and connect propositions, **Then** every step can be done by tapping, without dragging, hovering or multi-finger gestures being required.

---

### User Story 2 - Nest and regroup connections (Priority: P2)

A pastor has connected propositions 1–2 as Ground and 3–4 as Series. He now connects those two groups to each other with Inference, building a higher arc over both. Later he decides proposition 5 belongs with the Series group, so he extends that group to include it. He decides one connection was a mistake and removes it; the propositions and any connections inside it stay.

**Why this priority**: Real arguments are nested. Without nesting and regrouping, only the lowest level of a passage can be traced.

**Independent Test**: Build a three-level analysis over at least six propositions, extend one connection by one member, remove a middle-level connection, and confirm the remaining structure and the completeness status after each step.

**Acceptance Scenarios**:

1. **Given** two adjacent groups (each a connection or a proposition), **When** the user connects them, **Then** a new connection is created that contains both, and it is drawn above them in the arc view.
2. **Given** a connection and the member directly beside it, **When** the user extends the connection to include that member, **Then** the connection covers the larger contiguous range and its relationship is kept if it is still valid for the new number of members; if not, the user is told why and asked to choose a relationship that fits, with nothing preselected.
3. **Given** a connection with more than the minimum members for its relationship, **When** the user removes its first or last member from it, **Then** the connection shrinks and the removed member stays in the analysis, unconnected at that level.
4. **Given** a connection that is itself a member of a larger one, **When** the user removes it, **Then** its members stay, any connections inside it stay, and the larger connection is either kept with those members in its place (if that is still valid) or removed too; the user is told beforehand which connections will be removed and can cancel.
5. **Given** an analysis, **When** the user asks for its status, **Then** the editor says whether every proposition is reachable from one outermost connection and, if not, how many top-level pieces remain.
6. **Given** the user changes the relationship on an existing connection, **When** they pick a new relationship, **Then** the connection keeps its members and position and only its label changes, provided the new relationship fits its number of members.

---

### User Story 3 - Switch between arcs and brackets (Priority: P2)

A teacher prefers brackets to see the main point at a glance, while her students use arcs. She opens an analysis built in the arc view and switches to brackets. The same propositions, groupings and labels appear as brackets. She relabels one connection in the bracket view, switches back, and sees the change in the arcs.

**Why this priority**: Arcs and brackets are the two established ways of showing the same analysis, and users choose by preference or by what their teacher uses.

**Independent Test**: Build an analysis in one view, switch to the other, make one edit of each kind, switch back, and confirm through export that the analysis is identical to one made by the same edits in a single view.

**Acceptance Scenarios**:

1. **Given** an analysis shown as arcs, **When** the user switches to brackets, **Then** every proposition, connection, nesting level, relationship label and supporting-member mark is shown, and nothing is added or lost.
2. **Given** the user switches views back and forth any number of times without editing, **When** the saved analysis is exported before and after, **Then** the two files hold identical analyses.
3. **Given** the bracket view, **When** the user performs any editing action available in the arc view, **Then** the same action is available and has the same effect.
4. **Given** the user leaves an analysis in the bracket view, **When** they reopen it later, **Then** it opens in the bracket view, and remembering this does not change the stored analysis.

---

### User Story 4 - Invert direction and use Bilateral (Priority: P2)

A student labelled a pair Ground and then realises the reason comes first, so the pair is an Inference. She inverts the connection instead of deleting it. Elsewhere, one proposition supports both the statement before it and the one after it; she selects the three adjacent members and labels them Bilateral, and one connection relates the middle proposition to both neighbours.

**Why this priority**: Inversion and Bilateral are part of the method and come up in most passages, but a user can arc meaningfully without them.

**Independent Test**: Create a Ground connection and invert it twice; create a Bilateral connection over three members; try to invert a coordinate and a Bilateral connection; confirm each result.

**Acceptance Scenarios**:

1. **Given** a connection labelled Ground, **When** the user inverts it, **Then** it becomes Inference, its members and position are unchanged, and the supporting mark moves to the other member.
2. **Given** a subordinate connection whose relationship allows support from either side, **When** the user inverts it, **Then** the supporting mark moves to the other member and the label stays the same.
3. **Given** a connection labelled Series, Progression or Alternative, **When** the user tries to invert it, **Then** nothing changes and the user is told coordinate relationships have no direction of support.
4. **Given** three adjacent members, **When** the user labels them Bilateral, **Then** one connection is created with the middle member as the supporter of the members before and after it, and it is shown and edited as a single connection in both views.
5. **Given** a selection of two members, or of more than three, **When** the user chooses Bilateral, **Then** the connection is refused with an explanation that Bilateral needs one member on each side of the supporter.
6. **Given** a Bilateral connection, **When** the user tries to invert it, **Then** nothing changes and the user is told Bilateral supports both sides and has no single direction.

---

### User Story 5 - Undo and redo (Priority: P2)

While regrouping a long passage, a user removes the wrong connection and the connections that depended on it. One undo restores all of them as they were. She redoes it to compare, then undoes again.

**Why this priority**: Structural edits can remove several connections at once. Without undo, users would avoid exploring alternatives, which is the point of arcing.

**Independent Test**: Make a sequence of at least ten edits of mixed kinds, undo all of them back to the starting state, redo all of them, and compare the result with the state before undoing.

**Acceptance Scenarios**:

1. **Given** any edit (divide, merge, delete a proposition, connect, relabel, invert, extend, shrink, remove a connection), **When** the user undoes, **Then** the analysis returns exactly to its state before that edit, including any connections the edit removed.
2. **Given** the user has undone edits, **When** they redo, **Then** the edits are re-applied in order; **and When** they make a new edit instead, **Then** the undone edits can no longer be redone.
3. **Given** the user switches between arcs and brackets, **When** they undo, **Then** the view switch is not an undo step and the last edit is undone.
4. **Given** undo or redo changes the analysis, **When** the change is applied, **Then** it is autosaved like any other edit and announced to screen-reader users.

---

### User Story 6 - Open the conjunction reference on request (Priority: P3)

Unsure what γάρ can signal, a lay student opens the conjunction reference from the editor. It lists the relationships γάρ is known to signal, each with a scripture example, and states that the list is not exhaustive and that the choice is hers. She closes it and picks a relationship herself.

**Why this priority**: It is reference help for users still learning the method. The editor is fully usable without it.

**Independent Test**: Open the reference from the editor for several conjunctions, including one with several candidates and one not in the table, and confirm that no selection, label or order in the editor changes.

**Acceptance Scenarios**:

1. **Given** the editor is open, **When** the user asks to open the conjunction reference, **Then** it opens; it never opens on its own, when the user selects a word, or when they start a connection.
2. **Given** the user selects a Greek word in the passage that is in the conjunction table, **When** they ask to look it up, **Then** the reference opens at that conjunction and lists every relationship it can signal, each with its example, in one fixed order that does not depend on the passage or on the propositions involved.
3. **Given** the reference is open while the user is choosing a relationship, **When** they close it, **Then** the relationship list is unchanged: nothing selected, highlighted, reordered or filled in.
4. **Given** a conjunction that is not in the table, **When** the user looks it up, **Then** the reference says it has no entry and that the table is not exhaustive.
5. **Given** the reference is closed, **When** focus returns, **Then** it goes back to the control the user opened it from.

---

### User Story 7 - Follow a word between the reader and the editor (Priority: P3)

A pastor reading Philippians 1 selects ἀγάπη in verse 9 and switches to arcing mode; the editor opens on his analysis of that passage with ἀγάπη selected and scrolled into view. Later, in the editor, he selects a word and opens it in the reader, which shows that word selected with its detail available.

**Why this priority**: Following the user's place across views is the product's "one study desk" promise, but arcing works without it.

**Independent Test**: Select a word in the reader, switch to arcing, confirm the same word is selected in the editor; select a different word in the editor, switch to reading, confirm that word is selected in the reader.

**Acceptance Scenarios**:

1. **Given** a word is selected in the reader and the user has an analysis whose passage contains it, **When** they switch to arcing mode, **Then** the user can open that analysis (or the only such analysis opens directly) with the same word selected and in view.
2. **Given** a word is selected in the reader and no analysis covers it, **When** they switch to arcing mode, **Then** they are offered a new analysis with the passage picker starting at that word's verse, and nothing is created until they confirm.
3. **Given** a word is selected in the editor, **When** the user switches to the reader, **Then** the reader opens at that chapter with the same word selected and its detail available on request.
4. **Given** a word is selected in the editor, **When** the user asks for its details, **Then** only facts about the word are shown (surface form, lemma, gloss and parsing), never a syntactic role or any other interpretive label.

---

### User Story 8 - Export and re-import an analysis (Priority: P3)

A student exports her finished analysis to hand to a classmate, who imports it into his own copy of the app and sees the same propositions, connections and labels.

**Why this priority**: Saved work already keeps analyses safe; exporting and importing extends that to backups and sharing between installations.

**Independent Test**: Export an analysis with nesting, inversion and a Bilateral connection; import the file; compare the two analyses.

**Acceptance Scenarios**:

1. **Given** an open analysis, **When** the user exports it from the editor, **Then** a file is downloaded that names the passage and text edition and holds the analysis.
2. **Given** an exported file, **When** the user imports it, **Then** a new saved analysis is created whose propositions, connections, relationship labels, directions and nesting are identical to the original.
3. **Given** a file that is damaged, from an unknown document version, too large, refers to words the corpus does not have, or describes an invalid structure, **When** the user imports it, **Then** nothing is created and the user is told which of these is the problem.

---

### Edge Cases

- **Non-contiguous selection.** The user selects members that are not next to each other (for example propositions 1 and 3 with 2 outside both), or members whose ranges would partly overlap an existing connection, and asks to connect them. The connection is refused before the relationship list opens, the reason is stated in plain words, and the selection is kept so the user can adjust it.
- **Deleting a proposition inside a connection.** The user deletes a proposition (its words become undivided text again) or merges or divides one that belongs to a connection. Connections that are still valid without it are kept. Connections that would become invalid (for example a Ground with only one member left, or a Bilateral missing a side), and any containing connections that then become invalid, are listed before the edit is applied; the user can cancel or go ahead, and one undo restores everything. No connection is changed to a different relationship automatically.
- **Words left out.** Some words, such as a vocative or a closing doxology, may stay outside every proposition. They are shown as undivided text and do not count against completeness.
- **Re-ingest and word ids.** Saved analyses refer to words by their MACULA ids, so rebuilding the corpus leaves them intact. If an analysis refers to a word the current corpus no longer has, the editor still opens it, marks the propositions that refer to missing text, does not alter or discard anything, explains that saving is not possible until this is resolved, and offers to export the analysis.
- **Very long passages.** For a passage at the size limit, editing stays responsive (see SC-003), the user can move between propositions and connections by keyboard without scrolling manually, deeply nested arcs or brackets remain readable (the user can scroll the view and can collapse and expand a connection), and screen-reader users can move by nesting level rather than hearing the whole passage at once.
- **Size limit reached.** If an analysis approaches the saved-work size limit, the user is warned before it is reached; an edit that cannot be saved because of size is kept in the editor and handled as saved work specifies (stop retrying, say why, offer download).
- **Invalid structures.** Every edit is checked by the same validation that saving and importing use. An edit that would produce an invalid analysis (wrong number of members for its relationship, a connection containing itself, a proposition supporting two members on the same side, overlapping propositions) is refused with a reason and the analysis is unchanged. A stored analysis is never invalid.
- **Incomplete analyses.** An analysis with unconnected propositions can be saved, reopened, switched between views and exported at any stage.
- **Single proposition.** A passage left as one proposition is reported complete, and the connect action explains there is nothing to connect.
- **Extended relationships.** The four extended relationships are not offered until the user turns them on. If an analysis already uses one, it is shown and kept even when the option is off.
- **Conflicts.** If the same analysis is edited in two tabs, the conflict rules in saved work apply and the user's edits in the editor are never lost.
- **Leaving with unsaved changes.** If the user tries to leave while an edit is not yet saved, they are asked to confirm, as saved work specifies.
- **Touch precision.** Division points between Greek words are small; on touch the user can place a division without needing to hit a gap between words exactly (for example by choosing a word and placing the division after it).
- **Themes and contrast.** In light, dark and sepia themes the arcs, brackets, labels, supporting marks, selection and focus all meet contrast requirements.

## Requirements *(mandatory)*

### Functional Requirements

**Starting and opening an analysis**

- **FR-001**: Users MUST be able to start a new analysis by choosing a passage (book, chapter and verse range) in arcing mode, and from the reader for the passage they are reading.
- **FR-002**: A new analysis MUST show the passage's Greek text with no propositions, connections or relationships. The system MUST NOT create propositions from clause data, punctuation, verse boundaries or any other source.
- **FR-003**: Users MUST be able to give an analysis a title; until they do, the title MUST be the passage reference.
- **FR-004**: Users MUST be able to open any saved analysis in the editor from their saved work.
- **FR-005**: A passage MUST be able to span verse boundaries, and a proposition MUST be able to span a verse boundary within the passage. Whether a passage or proposition may also cross a chapter boundary: [NEEDS CLARIFICATION: may a passage, and a proposition within it, cross a chapter boundary (for example Philippians 1:27–2:4), or is a passage limited to one chapter?]
- **FR-006**: The editor MUST accept passages up to a stated maximum size and MUST tell the user before they choose a larger passage. [NEEDS CLARIFICATION: what is the largest passage the editor must support, for example one chapter, a fixed number of verses, or a fixed number of words?]

**Dividing the passage into propositions**

- **FR-007**: Users MUST be able to place a division after any word in undivided text or within a proposition, creating propositions that keep the Greek text verbatim and in reading order.
- **FR-008**: Users MUST be able to merge two adjacent propositions into one. A merge of non-adjacent propositions MUST be refused.
- **FR-009**: Users MUST be able to delete a proposition, returning its words to undivided text.
- **FR-010**: Each proposition MUST be shown with a stable visible reference (such as its verse and a letter) so users can refer to it, and the reference MUST be read out to screen-reader users.

**Connecting and labelling**

- **FR-011**: Users MUST be able to select two or more adjacent members (propositions or existing connections) and connect them. A selection that is not contiguous, or that would partly overlap an existing connection, MUST be refused with a stated reason before any relationship is chosen.
- **FR-012**: Every connection MUST carry exactly one relationship chosen by the user. The relationship list MUST open with nothing selected, MUST show relationships grouped under their categories in one fixed order, and MUST NOT preselect, highlight, reorder, filter by likelihood or otherwise rank any relationship on the basis of the passage, its words or its conjunctions.
- **FR-013**: The relationship list MUST offer the 18 core relationships by default and MUST offer the 4 extended relationships only when the user has turned them on, distinguishing extended ones from core ones by more than colour.
- **FR-014**: The relationship list MUST let users read each relationship's name, abbreviation, category and a short definition before choosing. Definitions shown MUST be in the project's own words and credit the method's sources.
- **FR-015**: The system MUST refuse a relationship whose number of members does not fit the selection (for example a subordinate relationship over three members, or Bilateral over two), say why, and leave the analysis unchanged.
- **FR-016**: For a subordinate connection of two members, the user MUST be able to choose which member supports the other, and the supporting member MUST be marked with a cue that is not colour alone (such as a shape, position or text).
- **FR-017**: Users MUST be able to change the relationship of an existing connection without recreating it, subject to FR-015.

**Inverting and Bilateral**

- **FR-018**: Users MUST be able to invert a two-member subordinate connection. Inverting Ground MUST make it Inference and the reverse; inverting a relationship that allows support from either side MUST swap the supporting member and keep the label. Members and position MUST be unchanged.
- **FR-019**: Inverting a coordinate or Bilateral connection MUST be refused with a stated reason and leave the analysis unchanged.
- **FR-020**: Users MUST be able to label three adjacent members Bilateral, making the middle member the supporter of the members on both sides. A Bilateral connection MUST be selected, labelled, shown, removed and undone as one connection.

**Nesting and regrouping**

- **FR-021**: Users MUST be able to connect existing connections with each other and with propositions to any depth, subject to contiguity.
- **FR-022**: Users MUST be able to extend a connection by an adjacent member and shrink it by its first or last member, keeping the relationship when it still fits and otherwise asking the user to choose one, with nothing preselected.
- **FR-023**: Users MUST be able to remove a connection without removing its members or the connections inside it.
- **FR-024**: When an edit (delete, merge, divide, shrink, remove) would leave other connections invalid, the system MUST list those connections before applying it, let the user cancel, remove only the connections that cannot remain valid, and never relabel or regroup a connection automatically.
- **FR-025**: Users MUST be able to see whether the analysis is complete, and if not, how many top-level pieces remain.

**Validation**

- **FR-026**: Every edit MUST be checked by the same validation the system uses when saving and importing. An edit that would make the analysis invalid MUST be refused with a reason a non-specialist can understand, and the analysis MUST be unchanged.
- **FR-027**: Incomplete analyses MUST be editable, viewable in both renderings, saveable and exportable.

**Two renderings**

- **FR-028**: The editor MUST offer an arc view and a bracket view of the same analysis, and the user MUST be able to switch between them at any time.
- **FR-029**: Both views MUST show every proposition, connection, nesting level, relationship label and supporting-member mark, with nothing added or lost in either.
- **FR-030**: Switching views MUST NOT change the analysis, MUST NOT be an undo step and MUST NOT by itself cause a save of the analysis.
- **FR-031**: Every editing action MUST be available in both views with the same effect.
- **FR-032**: The editor MUST remember, per analysis, which view the user last used, without storing that choice in the analysis itself.
- **FR-033**: Relationship labels MUST always be shown as text (name or abbreviation). If relationships are given colours, each colour MUST be paired with a second cue, and colours MUST come from the theme so they work in light, dark and sepia.

**Undo and redo**

- **FR-034**: Users MUST be able to undo and redo every edit to the analysis, one edit at a time, for the whole editing session. An edit that removed several connections MUST be undone as one step.
- **FR-035**: A new edit after undoing MUST discard the edits that could have been redone.

**Conjunction reference**

- **FR-036**: Users MUST be able to open the Greek conjunction reference from the editor at any time, either in general or for a selected word.
- **FR-037**: The reference MUST open only when the user asks for it. It MUST list every relationship a conjunction can signal with its scripture example in a fixed order that does not depend on the passage, MUST state that the table is not exhaustive and that it does not decide the relationship, and MUST NOT change any selection, relationship list, label or other content in the editor.
- **FR-038**: The reference MUST say when a looked-up word has no entry, and MUST say that Situation-Response has no conjunction cue when the user looks that relationship up.

**Following a word across views**

- **FR-039**: A word the user selects in the reader MUST be selected and brought into view when they move to an analysis containing it, and a word selected in the editor MUST be selected in the reader when they move there.
- **FR-040**: When no analysis contains the word selected in the reader, moving to arcing mode MUST offer to start one with the passage picker starting at that word's verse, and MUST NOT create anything until the user confirms.
- **FR-041**: Word details opened from the editor MUST show only surface form, lemma, gloss and parsing, never syntactic roles or other interpretive labels.

**Saving, resuming, export and import**

- **FR-042**: Every edit MUST take effect in the editor immediately and be saved automatically as saved work specifies, with a visible and screen-reader-announced indication of whether the work is saved.
- **FR-043**: Reopening an analysis MUST restore its propositions, connections, labels, directions and nesting exactly, and open in the view last used.
- **FR-044**: If an analysis refers to a word the corpus no longer has, the editor MUST open it, mark the affected propositions, leave the stored analysis unchanged, explain why it cannot be saved, and offer export.
- **FR-045**: Users MUST be able to export the open analysis to a file from the editor, as saved work specifies. [NEEDS CLARIFICATION: besides the data file, must users also be able to export or print the arcs or brackets as a picture or printable page (for example to hand in coursework), or is that a later feature?]
- **FR-046**: Users MUST be able to import an exported analysis file as a new saved analysis. Import MUST be checked by the same validation as editing and saving and, if refused, MUST create nothing and say why.

**Accessibility and devices**

- **FR-047**: Every action in this spec MUST be operable with a keyboard alone, with a visible focus indicator, in a logical order, without keyboard traps.
- **FR-048**: The analysis MUST be exposed to assistive technology as a navigable structure in which each connection announces its relationship, its members, its nesting level and which member supports which, and each proposition announces its reference and Greek text. Results of edits, refusals and save status MUST be announced.
- **FR-049**: Every action MUST be operable by touch alone on a tablet, with targets meeting the WCAG 2.2 AA minimum target size, and with a single-tap alternative to any drag or multi-finger gesture.
- **FR-050**: The editor MUST meet WCAG 2.2 AA in the light, dark and sepia themes and in both views, and MUST follow the project's design language (`DESIGN.md`), including the Two-Cue Rule.

**Credit**

- **FR-051**: The editor MUST make reachable a credit stating that the arcing method and its relationships come from Daniel Fuller, John Piper and Thomas Schreiner, and the source of the conjunction reference data.
- **FR-052**: The editor's labels, help text, layout and visual design MUST be the project's own, written from user needs, and MUST NOT reproduce any other arcing tool's wording, labels, assets or layouts.

### Key Entities

- **Analysis**: one user's discourse analysis of a passage: the passage's words in reading order, its propositions and its connections. Defined in `discourse/proposition-model`; stored as saved work.
- **Proposition**: a contiguous run of the passage's words, kept verbatim, identified by word ids that survive corpus rebuilds. Propositions never overlap and follow reading order.
- **Connection**: a user-made grouping of adjacent members (propositions or other connections) labelled with exactly one relationship. Coordinate connections have two or more equal members; subordinate connections have one supporting member and one supported member; a Bilateral connection has a supporter between two supported members.
- **Relationship**: a record from the taxonomy (18 core and 4 extended) with name, abbreviation, category, definition and direction of support. Ground and Inference are one relation in two directions.
- **View choice**: which rendering (arcs or brackets) the user last used for an analysis. It is a preference, not part of the analysis.
- **Edit history**: the session's sequence of edits that undo and redo move through.
- **Conjunction reference entry**: a Greek conjunction with the relationships it can signal and a scripture example for each; reference material only.
- **Selected word**: the word the user has selected, shared between the reader and the editor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user who knows the method can divide Philippians 1:3–11 into propositions and connect them into a complete analysis using only a keyboard, and again using only touch on a tablet, with no step that requires the other input method.
- **SC-002**: In an audit of every way an analysis can start or change, a new analysis has zero propositions and zero connections, and across 100% of connect and relabel actions (with or without the conjunction reference opened first) no relationship is preselected, highlighted or reordered.
- **SC-003**: For a passage at the maximum supported size, each edit is visible in the editor within 100 milliseconds of the user's action, and switching views completes within 1 second.
- **SC-004**: Switching between arcs and brackets 50 times in a row leaves the saved analysis identical, compared by export, in 100% of trials.
- **SC-005**: After any sequence of edits with the server reachable, reloading the page 2 seconds after the last edit shows every edit, in 100% of trials; no edit is lost when the server is briefly unreachable.
- **SC-006**: Exporting and re-importing an analysis that uses nesting, inversion, Bilateral and an extended relationship produces an identical analysis in 100% of trials.
- **SC-007**: Undoing every edit in a 50-edit session returns the analysis exactly to its starting state, and redoing them all returns it exactly to its final state.
- **SC-008**: Every invalid analysis in the shared set of invalid examples is refused when attempted as an edit and when imported, with a stated reason, and no invalid analysis is ever stored.
- **SC-009**: An accessibility audit of the editor in both views and all three themes finds zero WCAG 2.2 AA failures, and a screen-reader user can state the relationship, members and supporting member of any connection they navigate to.
- **SC-010**: A word selected in the reader is selected and in view in the editor (and the reverse) after one mode switch, in 100% of trials where an analysis covers that word.
- **SC-011**: In moderated sessions with at least five people who know the method, at least four complete the P1 task (divide, connect, reopen) on their first attempt without help.

## Assumptions

- The proposition model, taxonomy and validation from `discourse-analysis-foundation` are in place before this editor is built, including the behavioural rewording of *Multiple support participation* that its design calls for.
- Saved work (storage, autosave, conflicts, size limit, listing, deleting, file export) is reused as specified in `app/saved-work`; this feature adds the editor, the import path and the view preference.
- Undo and redo go one edit at a time and last for the editing session; the history is not kept after the page is closed.
- Removing a proposition returns its words to undivided text; it never deletes Greek text.
- When an edit would invalidate connections, the editor removes only the connections that cannot stay valid and tells the user first. This settles the foundation's "preserve or report" choice for split, merge and delete.
- Relationship definitions currently held in the taxonomy data are quoted from source sheets; before they are shown in the editor they are rewritten in the project's own words with credit.
- The view preference is kept per analysis in the user's browser; losing it only means the analysis opens in the arc view.
- Arcing mode reuses the existing passage picker and workspace surfaces described in `DESIGN.md`. Relationship colours, if any, are new theme tokens with light, dark and sepia values.
- Out of scope: per-proposition notes, paraphrases or translations; sharing and accounts; Hebrew; grammatical diagramming; any form of automatic division, connection or relationship suggestion.
- Greek is the only language; the whole New Testament is ingested (spec 009); testing uses Philippians 1.
