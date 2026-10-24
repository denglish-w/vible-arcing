## Purpose

Defines how a passage is segmented into propositions and how those propositions are connected by labelled logical relationships to form a discourse analysis — the single structure that both arcing and bracketing render.

## ADDED Requirements

### Requirement: The user does the analysis

Every proposition boundary, connection and relationship label in an analysis SHALL be created by the user.

The system SHALL NOT segment a passage into propositions, connect propositions, or assign relationships automatically, including from syntax or conjunction data.

#### Scenario: New analysis starts unsegmented

- **WHEN** a user starts an analysis of a passage
- **THEN** the analysis has no proposition boundaries, connections or relationships

#### Scenario: Syntax data does not produce an analysis

- **WHEN** the source data marks clause boundaries in the passage
- **THEN** no proposition boundaries are created from them

### Requirement: Proposition segmentation

A discourse analysis SHALL be built over an ordered sequence of propositions derived from a passage.

Each proposition SHALL reference a contiguous span of the source text and SHALL preserve that text verbatim.

Propositions SHALL NOT overlap, and their order SHALL follow the order of the source text.

A user SHALL be able to split a proposition into two and to merge two adjacent propositions into one.

When a split or merge changes a proposition that is a member of a connection, that connection SHALL be removed and the user SHALL be told which connections were removed.

The system SHALL NOT require that every word of the passage belong to a proposition.

#### Scenario: Segmented passage forms ordered propositions

- **WHEN** a user has marked propositions in a passage
- **THEN** the analysis holds them as an ordered sequence following the source text
- **AND** each proposition's text matches its span in the source text

#### Scenario: Splitting a proposition

- **WHEN** a user splits a proposition at a point within its span
- **THEN** two propositions replace it, preserving the original text and order

#### Scenario: Splitting a connected proposition

- **WHEN** a user splits a proposition that is a member of a Ground connection
- **THEN** that connection is removed
- **AND** the user is told that the Ground connection was removed

#### Scenario: Merging adjacent propositions

- **WHEN** a user merges two adjacent propositions
- **THEN** one proposition replaces them, spanning both original spans
- **AND** any connection either proposition was a member of is removed and reported to the user

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

#### Scenario: Deleting a connection

- **WHEN** a user deletes a connection
- **THEN** the connection is removed and its members remain in the analysis

### Requirement: Bilateral support

A proposition SHALL be able to support one member before it and one member after it through a single Bilateral connection.

A Bilateral connection SHALL relate exactly one supporting proposition to exactly one supported member on each side.

Outside a Bilateral connection, a supporting member SHALL support exactly one member.

#### Scenario: Bilateral support recorded

- **WHEN** a user labels a proposition as Bilateral support for the member before it and the member after it
- **THEN** the analysis records one Bilateral connection relating that supporting proposition to both supported members

#### Scenario: Two supported members on the same side rejected

- **WHEN** a user attempts to make one proposition the supporting member for two members that both precede it
- **THEN** the system rejects the operation

#### Scenario: Ordinary connections remain singly attached

- **WHEN** a proposition is the supporting member of a connection that is not Bilateral
- **THEN** it supports exactly one member

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

An analysis SHALL be complete when it has at least one proposition and every proposition is reachable from a single outermost connection.

An incomplete analysis SHALL remain a valid analysis.

#### Scenario: Incomplete analysis is valid

- **WHEN** an analysis has propositions that are not yet connected
- **THEN** the analysis passes validation
- **AND** its status reports it as incomplete

#### Scenario: Completeness reported

- **WHEN** the status of an analysis is requested
- **THEN** the system reports whether every proposition is reachable from a single outermost connection

#### Scenario: Cyclic structure rejected

- **WHEN** an operation would make a connection a member of itself, directly or transitively
- **THEN** the system rejects the operation
