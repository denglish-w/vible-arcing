## Purpose

Defines how a passage is segmented into propositions and how those propositions are connected by labelled logical relationships to form a discourse analysis — the single structure that both arcing and bracketing render.

## ADDED Requirements

### Requirement: The user does the analysis

Every proposition boundary, connection and relationship label in an analysis SHALL be created by the user.

The system SHALL NOT segment a passage into propositions, connect propositions, or assign relationships automatically, including from syntax or conjunction data.

#### Scenario: New analysis starts unsegmented

- **WHEN** a user starts an analysis of a passage
- **THEN** the passage is presented with no proposition boundaries, connections or relationships

#### Scenario: Syntax data does not produce an analysis

- **WHEN** the source data marks clause boundaries in the passage
- **THEN** no proposition boundaries are created from them

### Requirement: Proposition segmentation

A discourse analysis SHALL be built over an ordered sequence of propositions derived from a passage.

Each proposition SHALL reference a contiguous span of the source text and SHALL preserve that text verbatim.

Propositions SHALL NOT overlap, and their order SHALL follow the order of the source text.

A user SHALL be able to split a proposition into two and to merge two adjacent propositions into one.

The system SHALL NOT require that every word of the passage belong to a proposition.

#### Scenario: Passage segmented into ordered propositions

- **WHEN** a user opens a passage for analysis
- **THEN** the passage is presented as an ordered sequence of propositions
- **AND** each proposition's text matches its span in the source text

#### Scenario: Splitting a proposition

- **WHEN** a user splits a proposition at a point within its span
- **THEN** two propositions replace it, preserving the original text and order
- **AND** connections attached to the original proposition are preserved or the user is told which were affected

#### Scenario: Merging adjacent propositions

- **WHEN** a user merges two adjacent propositions
- **THEN** one proposition replaces them, spanning both original spans

#### Scenario: Non-adjacent merge rejected

- **WHEN** a user attempts to merge two propositions that are not adjacent
- **THEN** the system rejects the operation

### Requirement: Labelled connections between propositions

A discourse analysis SHALL consist of propositions and connections between them.

Each connection SHALL carry exactly one relationship from the relationship taxonomy.

A connection SHALL relate members that are contiguous in proposition order, either individual propositions or groups already formed by other connections.

A connection formed over other connections SHALL itself be available as a member of further connections, so that an analysis can express nested structure to arbitrary depth.

#### Scenario: Connecting two propositions

- **WHEN** a user connects two adjacent propositions and labels the connection Ground
- **THEN** the analysis records one connection labelled Ground relating those two propositions

#### Scenario: Nesting connections

- **WHEN** a user connects an existing connection to a further proposition
- **THEN** the analysis records the existing connection as a member of the new connection

#### Scenario: Non-contiguous connection rejected

- **WHEN** a user attempts to connect two members separated by a member belonging to neither
- **THEN** the system rejects the operation

#### Scenario: Unlabelled connection rejected

- **WHEN** a connection is created without a relationship
- **THEN** the system rejects it and requires a relationship to be chosen

### Requirement: Multiple support participation

The model SHALL permit a proposition to participate in more than one connection as the supporting member.

This participation SHALL be constrained to the Bilateral case: a proposition MAY support at most one preceding member and at most one following member.

The system SHALL reject any structure in which a proposition supports two members on the same side.

#### Scenario: Bilateral participation permitted

- **WHEN** a user labels a proposition as Bilateral support for the member before it and the member after it
- **THEN** the analysis records both supported members against that one supporting proposition

#### Scenario: Two supported members on the same side rejected

- **WHEN** a user attempts to make one proposition the supporting member for two members that both precede it
- **THEN** the system rejects the operation

#### Scenario: Ordinary connections remain singly attached

- **WHEN** a proposition participates in a connection that is not Bilateral
- **THEN** it supports at most one member

### Requirement: Coordinate connections over multiple members

A connection labelled with a coordinate relationship SHALL relate two or more members, none of which supports another.

A connection labelled with a subordinate relationship SHALL relate exactly one supporting member to the member or members it supports.

#### Scenario: Series over several propositions

- **WHEN** a user connects four adjacent propositions and labels the connection Series
- **THEN** the analysis records one Series connection with all four as equal members

#### Scenario: Subordinate connection over more than two members rejected

- **WHEN** a user attempts to label a connection over three members as Ground
- **THEN** the system rejects the operation and reports that Ground relates one supporting member to one supported member

### Requirement: Analysis validity

The system SHALL be able to report whether an analysis is complete.

An analysis SHALL be complete when every proposition is reachable from a single outermost connection, or when it has exactly one proposition and so nothing to connect.

The system SHALL permit an incomplete analysis to be saved and resumed, and SHALL NOT require completeness in order to render.

#### Scenario: Incomplete analysis is saved and rendered

- **WHEN** a user saves an analysis in which some propositions are not yet connected
- **THEN** the analysis is saved
- **AND** it can be rendered, showing the connections made so far

#### Scenario: Completeness reported

- **WHEN** a user requests the status of an analysis
- **THEN** the system reports whether every proposition is reachable from a single outermost connection

#### Scenario: Single proposition is complete

- **WHEN** an analysis has exactly one proposition and no connections
- **THEN** the system reports it as complete

#### Scenario: Cyclic structure rejected

- **WHEN** an operation would make a connection a member of itself, directly or transitively
- **THEN** the system rejects the operation

### Requirement: Rendering independence

The proposition model SHALL be independent of how it is displayed.

The system SHALL support rendering the same analysis as arcs and as brackets, with no loss of information in either direction.

Switching between renderings SHALL NOT alter the underlying analysis.

#### Scenario: Same analysis in both renderings

- **WHEN** a user switches an analysis from the arc rendering to the bracket rendering
- **THEN** the same propositions, connections, and relationship labels are shown
- **AND** the stored analysis is unchanged

#### Scenario: Editing in either rendering

- **WHEN** a user edits an analysis in either rendering
- **THEN** the edit is reflected in the other rendering

#### Scenario: Bilateral rendered as one connection

- **WHEN** an analysis containing a Bilateral connection is rendered
- **THEN** it is shown as a single connection labelled Bilateral relating the supporting proposition to both supported members

### Requirement: Analysis portability

A user SHALL be able to export an analysis and re-import it, recovering the same propositions, connections, and relationship labels.

An exported analysis SHALL identify the passage and text edition it was built over.

#### Scenario: Round-trip export and import

- **WHEN** a user exports an analysis and re-imports it
- **THEN** the propositions, connections, relationship labels, and their nesting are identical to the original

#### Scenario: Exported analysis names its source

- **WHEN** an analysis is exported
- **THEN** the export identifies the passage and the text edition used
