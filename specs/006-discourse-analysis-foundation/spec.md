# Feature Specification: Discourse Analysis Foundation

**Source**: `openspec/changes/discourse-analysis-foundation/` (proposal, design, and specs `discourse/proposition-model`, `discourse/relationship-taxonomy`, `text/greek-source`). OpenSpec is authoritative; `design.md` decision 2 supersedes `docs/reference/model-notes.md` section 4 on Bilateral.

**Feature Branch**: `006-discourse-analysis-foundation`

**Created**: 2026-11-05

**Status**: In Progress

**Input**: User description: "The shared proposition model, relationship taxonomy and Greek source text that every arcing and bracketing view is built on; source `openspec/changes/discourse-analysis-foundation/`."

This feature is the shared model and vocabulary. It is not an editor and not a renderer, and it never interprets the passage for the user.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The user does the analysis (Priority: P1)

A student or pastor starts an analysis and gets the Greek passage with nothing drawn on it. Every proposition boundary, connection and relationship is theirs.

**Why this priority**: The product exists so the user does the interpretive work (constitution principle I). Everything else in this feature depends on it.

**Independent Test**: Start an analysis of a passage whose source data marks clause boundaries and check that it holds no propositions, connections or relationships.

**Acceptance Scenarios**:

1. **Given** a passage, **When** the user starts an analysis, **Then** it is presented with no proposition boundaries, connections or relationships.
2. **Given** the source data marks clause boundaries in the passage, **When** an analysis is started, **Then** no proposition boundaries are created from them.
3. **Given** two propositions joined by a conjunction such as `γάρ`, **When** the user connects them, **Then** no relationship is preselected or suggested, and the user can open the conjunction's reference entry if they choose.

---

### User Story 2 - Segment a passage into propositions (Priority: P1)

The user divides a passage into an ordered sequence of propositions, each a stretch of the original text, and can split one into two or merge two neighbours.

**Why this priority**: Propositions are the units every connection is built from.

**Independent Test**: Create propositions over a passage, split and merge them, and check order, verbatim text and non-overlap.

**Acceptance Scenarios**:

1. **Given** a passage opened for analysis, **When** it is presented, **Then** it is an ordered sequence of propositions and each proposition's text matches its span in the source text.
2. **Given** a proposition, **When** the user splits it at a point within its span, **Then** two propositions replace it, preserving the original text and order, and connections attached to the original are preserved or the user is told which were affected [NEEDS CLARIFICATION: which behaviour applies on split, preserve connections or report the affected ones? The OpenSpec change allows either and the design says to pick one and make it consistent].
3. **Given** two adjacent propositions, **When** the user merges them, **Then** one proposition replaces them, spanning both original spans.
4. **Given** two propositions that are not adjacent, **When** the user tries to merge them, **Then** the system rejects the operation.
5. **Given** propositions over a passage, **When** they are checked, **Then** they do not overlap, follow source order, and the analysis does not require every word of the passage to belong to one.

---

### User Story 3 - Connect propositions with labelled relationships (Priority: P1)

The user connects neighbouring propositions, or groups already connected, and labels each connection with one relationship. Connections nest to any depth, giving the containment tree that arcs and brackets both show.

**Why this priority**: This is the analysis itself.

**Independent Test**: Build connections including a nested one and a four-member Series, and try each invalid connection.

**Acceptance Scenarios**:

1. **Given** two adjacent propositions, **When** the user connects them and labels the connection Ground, **Then** the analysis records one Ground connection relating those two propositions.
2. **Given** an existing connection, **When** the user connects it to a further proposition, **Then** the analysis records the existing connection as a member of the new one.
3. **Given** two members separated by a member belonging to neither, **When** the user tries to connect them, **Then** the system rejects the operation.
4. **Given** a connection with no relationship, **When** it is created, **Then** the system rejects it and requires a relationship to be chosen.
5. **Given** four adjacent propositions, **When** the user connects them and labels the connection Series, **Then** the analysis records one Series connection with all four as equal members.
6. **Given** a connection over three members, **When** the user tries to label it Ground, **Then** the system rejects it and reports that Ground relates one supporting member to one supported member.
7. **Given** an operation that would make a connection a member of itself, directly or transitively, **When** it is attempted, **Then** the system rejects it.

---

### User Story 4 - Choose from the 18 relationships, by category (Priority: P1)

When labelling a connection, the user picks from the 18 core relationships grouped by category. The 4 extended relationships appear only if the user opts in. Each relationship carries a name, abbreviation and definition.

**Why this priority**: The vocabulary is the method (Fuller, Piper, Schreiner) and every analysis depends on it.

**Independent Test**: Open the choice list with and without extended relationships enabled and check names, counts, categories and reference data.

**Acceptance Scenarios**:

1. **Given** the user labels a connection, **When** the choices are shown, **Then** all 18 core relationships are offered and the 4 extended are not.
2. **Given** the user enables extended relationships, **When** the choices are shown, **Then** all 22 are offered and the extended ones are visually distinguished from core.
3. **Given** any relationship, **When** it is retrieved, **Then** it exposes a stable identifier, display name, abbreviation and definition text.
4. **Given** relationships grouped by category, **When** counted, **Then** Coordinate has 3, Support by Restatement 5, Support by Distinct Statement 8 and Support by Contrary Statement 2.
5. **Given** the relationships partitioned as coordinate and subordinate, **When** counted, **Then** exactly 3 are coordinate and exactly 15 are subordinate.
6. **Given** the user is offered relationships, **When** they are shown, **Then** they are grouped under their category names.
7. **Given** any viewer of the taxonomy, **When** it shows information about the taxonomy, **Then** the origin of the taxonomy and the conjunction cue data is stated.

---

### User Story 5 - Ground and Inference are one relation with a direction (Priority: P2)

The user flips a Ground into an Inference, and back, without rebuilding the connection. Coordinate relationships have no direction to flip.

**Why this priority**: Direction is how the method treats these two, and inversion is a core editing action.

**Independent Test**: Invert Ground, Inference and a Series connection and compare members.

**Acceptance Scenarios**:

1. **Given** a connection labelled Ground, **When** the user inverts its direction, **Then** it is relabelled Inference and the two propositions it connects are unchanged.
2. **Given** a connection labelled Series, Progression or Alternative, **When** the user tries to invert it, **Then** the system rejects the operation and reports that coordinate relationships have no support direction.

---

### User Story 6 - Bilateral is one connection (Priority: P2)

The user labels one proposition as supporting both the member before it and the member after it, as a single Bilateral connection that is edited, relabelled and deleted as one.

**Why this priority**: Bilateral is in scope by user decision and is the one structural exception in the method.

**Independent Test**: Create a Bilateral connection, relabel and delete it, and attempt a proposition supporting two members on one side.

**Acceptance Scenarios**:

1. **Given** the choice list, **When** the user looks for Bilateral, **Then** it appears under Support by Distinct Statement.
2. **Given** a Bilateral label, **When** a connection is made, **Then** the system requires one supported member before the supporter and one after, and rejects the connection if either is missing.
3. **Given** a Bilateral connection, **When** the user relabels or deletes it, **Then** the change applies to the whole connection, including both supported members.
4. **Given** a proposition labelled as Bilateral support for the member before it and the member after it, **When** the analysis is recorded, **Then** both supported members are recorded against that one supporting proposition.
5. **Given** one proposition, **When** the user tries to make it the supporter of two members that both precede it, **Then** the system rejects the operation.
6. **Given** a proposition in a connection that is not Bilateral, **When** it is checked, **Then** it supports at most one member.
7. **Given** an analysis with a Bilateral connection, **When** it is rendered, **Then** it is shown as a single connection labelled Bilateral relating the supporter to both supported members.

---

### User Story 7 - Work in progress is kept, and completeness is reported (Priority: P2)

The user can save and resume an analysis before it is finished, see it drawn with what exists so far, and ask whether it is complete.

**Why this priority**: Analyses are built over many sessions.

**Independent Test**: Save an analysis with unconnected propositions, render it, and request its status; repeat with one proposition.

**Acceptance Scenarios**:

1. **Given** some propositions are not yet connected, **When** the user saves, **Then** the analysis is saved and can be rendered, showing the connections made so far.
2. **Given** an analysis, **When** the user asks for its status, **Then** the system reports whether every proposition is reachable from a single outermost connection.
3. **Given** exactly one proposition and no connections, **When** the status is requested, **Then** the analysis is reported complete.

---

### User Story 8 - One analysis, arcs and brackets (Priority: P2)

The same analysis can be shown as arcs or as brackets, switching never changes it, and an edit in one is seen in the other.

**Why this priority**: One model with two renderings is the product's position (constitution principle III). The renderers themselves are separate work.

**Independent Test**: With an analysis open in each rendering, switch between them and edit in each; compare stored content before and after switching.

**Acceptance Scenarios**:

1. **Given** an analysis in the arc rendering, **When** the user switches to brackets, **Then** the same propositions, connections and relationship labels are shown and the stored analysis is unchanged.
2. **Given** an analysis, **When** the user edits it in either rendering, **Then** the edit is reflected in the other.

---

### User Story 9 - Export, re-import and edition (Priority: P3)

The user exports an analysis and re-imports it with nothing lost. The analysis always says which passage and text edition it was built over.

**Why this priority**: Portability protects the user's work; the saved-work side is feature 005.

**Independent Test**: Export, re-import and compare propositions, connections, labels and nesting; check passage and edition in the export and on screen.

**Acceptance Scenarios**:

1. **Given** an analysis, **When** the user exports it and re-imports it, **Then** its propositions, connections, relationship labels and nesting are identical.
2. **Given** an exported analysis, **When** it is inspected, **Then** it identifies the passage and the text edition used.
3. **Given** a new analysis, **When** it is created, **Then** the text edition it was built over is recorded with it.
4. **Given** the user views an analysis, **When** they look at its details, **Then** the text edition is identifiable.

---

### User Story 10 - Look up a conjunction, as reference only (Priority: P3)

When the user asks, they can look up a Greek conjunction and see which relationships it may signal, with a scripture example for each. The app never proposes, preselects or ranks a relationship from it.

**Why this priority**: Useful reference material, but optional to the analysis.

**Independent Test**: Look up `εἰ`, `καίπερ`, an unmapped conjunction, Situation-Response, and a language with no cue data.

**Acceptance Scenarios**:

1. **Given** the user looks up `εἰ`, **When** the result is shown, **Then** Question-Answer, Idea-Explanation, Conditional and Concessive are given as candidates and none is designated the relationship.
2. **Given** the user looks up `καίπερ`, **When** the result is shown, **Then** Concessive is the only candidate.
3. **Given** any conjunction-to-relationship entry, **When** it is retrieved, **Then** it includes a scripture reference exemplifying that pairing.
4. **Given** a conjunction absent from the mapping, **When** it is looked up, **Then** the system returns no candidates and reports that the mapping is not exhaustive.
5. **Given** candidates are requested for Situation-Response, **When** the result is shown, **Then** the system reports that this relationship has no conjunction cue.
6. **Given** conjunction cues are requested for a language with no cue data, **When** the result is shown, **Then** no cues are returned and relationship selection remains fully available.
7. **Given** relationships are retrieved while analysing a text in any supported language, **When** they are returned, **Then** they are the same 18 core relationships with the same categories and directions.

---

### User Story 11 - The Greek text, with stable word ids and attribution (Priority: P1)

The user gets the Greek New Testament by book, chapter and verse range, with every word identifiable by a stable id, its lemma and parsing, and the licences of the data on show.

**Why this priority**: Analyses are built over this text and the licences are a legal obligation.

**Independent Test**: Request valid and invalid passages, resolve a span to words, inspect a word, and open the attribution page and repository notices.

**Acceptance Scenarios**:

1. **Given** a book, chapter and verse range, **When** the user requests a passage, **Then** the Greek text is returned in canonical word order.
2. **Given** any passage in any New Testament book, **When** requested, **Then** text is returned for it.
3. **Given** a passage that does not exist in the New Testament, **When** requested, **Then** the reference is reported invalid and no text is returned.
4. **Given** an analysis saved under one release, **When** it is opened under a later release, **Then** its propositions resolve to the same words.
5. **Given** a proposition's span, **When** it is resolved, **Then** the words of that span are returned in canonical order.
6. **Given** a word, **When** the user inspects it, **Then** its lemma and morphological parsing are returned.
7. **Given** a passage, **When** clause information is requested, **Then** the clause boundaries within it are returned (as reference data only, never used to split).
8. **Given** a word classified as a conjunction in the source data, **When** the passage is read, **Then** the classification is exposed for that word.
9. **Given** the attribution information, **When** a user views it, **Then** the SBL Greek New Testament and every incorporated linguistic dataset are named with licence and licence link.
10. **Given** a dataset that has been reformatted for the app, **When** its attribution is shown, **Then** it states that the material has been modified.
11. **Given** the source repository, **When** inspected, **Then** it contains the attribution each incorporated dataset's licence requires.
12. **Given** a dataset whose licence prohibits derivative works or commercial use, **When** it is considered, **Then** it is not incorporated.
13. **Given** a dataset whose licence would require the app's source or derived data to be redistributed under that same licence, **When** it is considered, **Then** it is not incorporated.
14. **Given** a dataset with a permissive licence with attribution only, **When** it is considered, **Then** it may be incorporated, subject to showing the attribution.

### Edge Cases

- A non-coordinate connection over more than two members (other than Bilateral) is rejected with a message saying what the relationship relates.
- A Bilateral connection with a missing side is rejected.
- Two members that look adjacent but have a third member between them are non-contiguous and rejected.
- An analysis with no propositions is incomplete, not complete.
- An invalid analysis from an import is refused by the same rules as an edit.
- A passage whose chapter has not been ingested shows an unavailable state rather than failing.

## Requirements *(mandatory)*

### Functional Requirements

**The user does the analysis**

- **FR-001**: Every proposition boundary, connection and relationship label MUST be created by the user.
- **FR-002**: The system MUST NOT segment a passage into propositions, connect propositions, or assign or suggest relationships automatically, including from syntax or conjunction data.
- **FR-003**: A new analysis MUST present the passage with no boundaries, connections or relationships.

**Propositions**

- **FR-004**: An analysis MUST be built over an ordered sequence of propositions derived from a passage.
- **FR-005**: Each proposition MUST reference a contiguous span of the source text by word identifiers and preserve that text verbatim.
- **FR-006**: Propositions MUST NOT overlap and MUST follow source order; the system MUST NOT require every word of the passage to belong to a proposition.
- **FR-007**: A user MUST be able to split a proposition into two and merge two adjacent propositions into one, and a merge of non-adjacent propositions MUST be rejected.
- **FR-008**: When a proposition is split, its connections MUST be handled in one consistent way and the user MUST NOT be left unaware of any that changed [NEEDS CLARIFICATION: preserve or report; see story 2].

**Connections and the containment tree**

- **FR-009**: An analysis MUST consist of propositions and connections, forming a containment tree over the ordered propositions.
- **FR-010**: Each connection MUST carry exactly one relationship from the taxonomy, and a connection without one MUST be rejected.
- **FR-011**: Each connection MUST relate members that are contiguous in proposition order, either propositions or groups already formed by other connections, and a non-contiguous connection MUST be rejected.
- **FR-012**: A connection MUST be usable as a member of further connections to any depth, and a structure in which a connection is a member of itself, directly or transitively, MUST be rejected.
- **FR-013**: A connection with a coordinate relationship MUST relate two or more members, none supporting another.
- **FR-014**: A connection with a subordinate relationship MUST relate exactly one supporting member to the member or members it supports, and a subordinate connection over more members than its relationship allows MUST be rejected with a message saying what the relationship relates.

**Bilateral**

- **FR-015**: Bilateral MUST be a first-class, user-selectable relationship listed with the other 17 core relationships under Support by Distinct Statement.
- **FR-016**: A Bilateral connection MUST be a single ternary node with three ordered members: the supported member before, the supporter, and the supported member after, and MUST be rejected if either supported member is missing.
- **FR-017**: A proposition MUST support at most one preceding member and at most one following member, and any structure in which it supports two members on the same side MUST be rejected; in a connection that is not Bilateral it supports at most one member.
- **FR-018**: The system MUST record that Bilateral is semantically equivalent to a Ground toward the preceding member combined with an Inference toward the following member, as meaning recorded on the node, not as its structure.
- **FR-019**: Selecting, labelling, relabelling, deleting and displaying a Bilateral connection MUST treat it as one connection covering both supported members.

**Taxonomy**

- **FR-020**: The system MUST provide exactly 18 core relationships, each with a unique identifier, display name, abbreviation and definition, and 4 extended relationships (Both-And, General-Specific, Fact-Interpretation, Anticipation-Fulfillment).
- **FR-021**: Extended relationships MUST be excluded from selection by default and available only when the user opts in, and then MUST be visually distinguished from core relationships.
- **FR-022**: Each relationship MUST belong to exactly one category (Coordinate 3, Support by Restatement 5, Support by Distinct Statement 8, Support by Contrary Statement 2), every non-Coordinate relationship is subordinate, and selection MUST present relationships grouped under their category names.
- **FR-023**: Relationships MUST be data records, not an enum, and the taxonomy data MUST be one source from which the app's types are generated.
- **FR-024**: Each subordinate relationship MUST declare the supporter's position relative to the supported member (`follows`, `precedes` or `either`); Ground declares `follows` and Inference `precedes`; coordinate relationships declare no direction.
- **FR-025**: Ground and Inference MUST be one relation that differs only by direction, and inverting a connection MUST flip its direction without discarding it, so Ground becomes Inference (and back) with its members unchanged.
- **FR-026**: Inverting a coordinate connection MUST be rejected with a message that coordinate relationships have no support direction.
- **FR-027**: The relationship set, categories and directions MUST be independent of the text's language; only the conjunction cues are language-specific, and adding a language MUST need only new cue data.
- **FR-028**: The system MUST attribute the taxonomy and conjunction cue data to their sources in user-visible documentation.

**Conjunction cues (reference only)**

- **FR-029**: The system MUST keep a mapping from conjunctions to the relationships they may signal, keyed by language, each entry with a scripture reference, covering at least 64 Koine Greek conjunctions.
- **FR-030**: A conjunction MAY map to several relationships and MUST NOT be treated as determining one; the mapping MUST be shown only when the user asks to look up a conjunction.
- **FR-031**: The system MUST NOT propose, preselect or rank a relationship from the mapping.
- **FR-032**: For an unmapped conjunction the system MUST return no candidates and say the mapping is not exhaustive; for Situation-Response it MUST say there is no conjunction cue; for a language with no cue data it MUST return no cues while selection stays fully available.

**Completeness and rendering**

- **FR-033**: The system MUST report whether an analysis is complete: every proposition reachable from a single outermost connection, or exactly one proposition and so nothing to connect.
- **FR-034**: The system MUST allow an incomplete analysis to be saved and resumed and MUST NOT require completeness to render.
- **FR-035**: The model MUST be independent of display; the same analysis MUST be renderable as arcs and as brackets with no loss of information, switching MUST NOT alter it, and an edit in one rendering MUST show in the other.
- **FR-036**: Arcing and bracketing MUST share this one model, and it MUST stay separate from grammatical diagramming (words linked by syntactic role).

**Portability and edition**

- **FR-037**: A user MUST be able to export an analysis and re-import it, recovering the same propositions, connections, labels and nesting, and an imported analysis MUST be checked by the same rules as an edited one.
- **FR-038**: An exported analysis MUST identify its passage and text edition, and the edition MUST be recorded when an analysis is created and identifiable when it is viewed.

**Greek source text**

- **FR-039**: The system MUST provide the SBL Greek New Testament, covering the whole New Testament, retrievable by book, chapter and verse range in canonical word order without a third-party network service, and MUST report a non-existent reference as invalid with no text.
- **FR-040**: Every word MUST have an identifier from MACULA that is stable between releases, never a positional index, and a proposition MUST reference its span by these identifiers so saved work resolves to the same words in later releases.
- **FR-041**: The system MUST provide each word's lemma and morphological parsing, clause boundaries for the text (as reference data only), and, where the source marks a word as a conjunction, expose that classification.
- **FR-042**: The system MUST show attribution for the text and every incorporated dataset where any user can reach it, naming each work, its licence and a licence link, and stating where the material was modified, and MUST keep the required attribution in the source repository.
- **FR-043**: The system MUST incorporate only data whose licence permits redistribution, modification and commercial use, and MUST NOT incorporate data that prohibits derivative works or commercial use or whose licence would bind the app's own source or derived data to the same licence; UBS attributes MUST be stripped at ingest.

### Key Entities

- **Passage**: a stretch of the Greek text addressed by book, chapter and verse range, made of words in canonical order.
- **Word**: one word of the text with a stable MACULA identifier, lemma and morphology.
- **Proposition**: a contiguous span of words, verbatim, in source order.
- **Connection**: a node in the containment tree with one relationship and ordered members that are propositions or other connections. It is coordinate (two or more equal members), binary (one supporter, one supported) or Bilateral (before, supporter, after).
- **Relationship**: a data record with identifier, name, abbreviation, definition, category, core or extended status, and direction where subordinate.
- **Category**: one of four groups of relationships.
- **Conjunction cue**: a Greek conjunction mapped to the relationships it may signal, each with a scripture example; reference only.
- **Analysis**: the ordered propositions, the connections over them, the passage and the text edition.
- **Attribution**: the work, creator, licence, licence link and modification statement for each incorporated dataset.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new analysis of any passage contains zero propositions, connections and relationships until the user creates them, in 100% of test passages including those with clause data.
- **SC-002**: The relationship choices show exactly 18 relationships by default and 22 with extended enabled, in categories of 3, 5, 8 and 2, in 100% of checks.
- **SC-003**: Every structurally invalid analysis in the fixture set (non-contiguous, unlabelled, wrong member count, same-side double support, cycle, Bilateral with a missing side) is rejected, and every valid fixture is accepted, with no exceptions.
- **SC-004**: An analysis exported and re-imported is identical to the original in propositions, connections, labels and nesting, for every fixture.
- **SC-005**: Switching an analysis between arcs and brackets leaves its stored content byte-for-byte unchanged and shows the same set of propositions, connections and labels.
- **SC-006**: A user can find the reference entry for a named conjunction in under 30 seconds, and no relationship is preselected in 100% of connection attempts.
- **SC-007**: 100% of saved analyses resolve to the same words after a corpus rebuild or release update.
- **SC-008**: The attribution page lists every incorporated dataset with licence and link, and the same notices exist in the repository, in 100% of release checks.

## Assumptions

- **Built so far**: the relationship taxonomy (data file, generated types, grouped and opt-in choices, directions, inversion), the analysis model types (propositions, coordinate, binary and ternary Bilateral connections, empty analysis), the validation module (structure, completeness status), word-id based passages and edition recording through saved work, and the Philippians 1 corpus with attribution shown on `/credits`.
- **Not built yet**: split and merge operations; any editor, arc or bracket rendering and switching; export re-import (the import half comes with the arcing editor); conjunction lookup in the app (the 64-conjunction data exists in `docs/data/`); the extended-relationship opt-in control; ingest of the whole New Testament, with clause and conjunction data (only Philippians 1 is ingested, other chapters show an unavailable state). This is why the status is In Progress.
- The OpenSpec proposal lists auto-splitting as a possible use of MACULA clause data; the later product decision of 2026-10-22 and requirement "The user does the analysis" override that, so clause data is reference only.
- The OpenSpec proposal and design recommend rewording "Multiple support participation" behaviourally; this spec follows the ternary-node decision (design decision 2), which supersedes `docs/reference/model-notes.md` section 4.
- The model is the document stored by feature 005 (saved work); persistence, accounts and sync are out of scope here.
- Hebrew, the grammatical diagramming model, renderers and accounts are out of scope. The model is language-neutral but only Greek is supported.
- Whether the extended relationships appear by default in the picker is the opt-in described above; the taxonomy carries them regardless.
- Undo and redo granularity is decided when the editor is built.
- Constitution principles I, III and IV and the licensing rules apply, and the method is credited to Fuller, Piper and Schreiner.
